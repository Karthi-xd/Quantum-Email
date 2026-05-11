import sys
sys.stdout.reconfigure(encoding='utf-8')
import logging
logger = logging.getLogger(__name__)

from kyber_py.kyber import Kyber768
from dilithium_py.dilithium import Dilithium3
from base64 import b64encode, b64decode
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric.x25519 import X25519PrivateKey, X25519PublicKey
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey, Ed25519PublicKey
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat, PrivateFormat, NoEncryption
from argon2 import PasswordHasher, Type
import os
import hashlib

# --- Constants ---
KYBER_CT_LEN = 1088

_ph = PasswordHasher(
    time_cost=2,
    memory_cost=65536,
    parallelism=1,
    hash_len=32,
    type=Type.ID,
)


def _derive_key(master: str) -> bytes:
    return hashlib.pbkdf2_hmac('sha256', master.encode(), salt=b'q-mail-pqc-v2', iterations=600000, dklen=32)


def _combine_shares(*shares: bytes) -> bytes:
    hkdf = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b'q-mail-hybrid-v2')
    return hkdf.derive(b''.join(shares))


def generate_quantum_keys():
    kyber_pk, kyber_sk = Kyber768.keygen()

    x25519_priv = X25519PrivateKey.generate()
    x25519_pub = x25519_priv.public_key()
    x25519_pub_bytes = x25519_pub.public_bytes(Encoding.Raw, PublicFormat.Raw)
    x25519_priv_bytes = x25519_priv.private_bytes(Encoding.Raw, PrivateFormat.Raw, NoEncryption())

    dili_pk, dili_sk = Dilithium3.keygen()

    ed25519_priv = Ed25519PrivateKey.generate()
    ed25519_pub = ed25519_priv.public_key()
    ed25519_pub_bytes = ed25519_pub.public_bytes(Encoding.Raw, PublicFormat.Raw)
    ed25519_priv_bytes = ed25519_priv.private_bytes(Encoding.Raw, PrivateFormat.Raw, NoEncryption())

    fp_input = kyber_pk + x25519_pub_bytes + dili_pk + ed25519_pub_bytes
    fingerprint = hashlib.sha256(fp_input).hexdigest()[:16]

    return {
        "kyber_pub": b64encode(kyber_pk).decode(),
        "kyber_priv": b64encode(kyber_sk).decode(),
        "x25519_pub": b64encode(x25519_pub_bytes).decode(),
        "x25519_priv": b64encode(x25519_priv_bytes).decode(),
        "dili_pub": b64encode(dili_pk).decode(),
        "dili_priv": b64encode(dili_sk).decode(),
        "ed25519_pub": b64encode(ed25519_pub_bytes).decode(),
        "ed25519_priv": b64encode(ed25519_priv_bytes).decode(),
        "fingerprint": fingerprint,
    }


def encrypt_email_body(body: str, recipient_pub_keys: dict, sender_priv_keys: dict) -> dict:
    kyber_pub = b64decode(recipient_pub_keys['kyber_pub_b64'])
    x25519_pub = X25519PublicKey.from_public_bytes(
        b64decode(recipient_pub_keys['x25519_pub_b64'])
    )

    ephemeral_priv = X25519PrivateKey.generate()
    ephemeral_pub = ephemeral_priv.public_key()
    ephemeral_pub_bytes = ephemeral_pub.public_bytes(Encoding.Raw, PublicFormat.Raw)

    K_kyber, kyber_ct = Kyber768.encaps(kyber_pub)
    K_x25519 = ephemeral_priv.exchange(x25519_pub)
    hybrid_secret = _combine_shares(K_kyber, K_x25519)

    hkdf = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b'q-mail-hybrid-aes-v2')
    aes_key = hkdf.derive(hybrid_secret)

    iv = os.urandom(12)
    cipher = Cipher(algorithms.AES(aes_key), modes.GCM(iv))
    encryptor = cipher.encryptor()
    encrypted_body = encryptor.update(body.encode('utf-8')) + encryptor.finalize()
    tag = encryptor.tag

    payload = ephemeral_pub_bytes + kyber_ct + iv + tag + encrypted_body

    dili_priv = b64decode(sender_priv_keys['dili_priv_b64'])
    ed25519_priv = Ed25519PrivateKey.from_private_bytes(
        b64decode(sender_priv_keys['ed25519_priv_b64'])
    )

    dili_sig = Dilithium3.sign(dili_priv, payload)
    ed25519_sig = ed25519_priv.sign(payload)

    return {
        "encrypted_body": b64encode(payload).decode(),
        "dili_sig": b64encode(dili_sig).decode(),
        "ed25519_sig": b64encode(ed25519_sig).decode(),
    }


def decrypt_email_body(encrypted_body_b64: str, dili_sig_b64: str, ed25519_sig_b64: str,
                       recipient_priv_keys: dict, sender_pub_keys: dict) -> dict:
    kyber_priv = b64decode(recipient_priv_keys['kyber_priv_b64'])
    x25519_priv_bytes = b64decode(recipient_priv_keys['x25519_priv_b64'])
    x25519_priv = X25519PrivateKey.from_private_bytes(x25519_priv_bytes)
    dili_pub = b64decode(sender_pub_keys['dili_pub_b64'])
    ed25519_pub = Ed25519PublicKey.from_public_bytes(
        b64decode(sender_pub_keys['ed25519_pub_b64'])
    )

    payload = b64decode(encrypted_body_b64)
    dili_sig = b64decode(dili_sig_b64)
    ed25519_sig = b64decode(ed25519_sig_b64)

    if not Dilithium3.verify(dili_pub, payload, dili_sig):
        raise ValueError("Dilithium3 signature verification failed")
    try:
        ed25519_pub.verify(ed25519_sig, payload)
    except Exception:
        raise ValueError("Ed25519 signature verification failed")

    ephemeral_pub_bytes = payload[:32]
    kyber_ct = payload[32:32 + KYBER_CT_LEN]
    iv = payload[32 + KYBER_CT_LEN:32 + KYBER_CT_LEN + 12]
    tag = payload[32 + KYBER_CT_LEN + 12:32 + KYBER_CT_LEN + 12 + 16]
    encrypted_body = payload[32 + KYBER_CT_LEN + 12 + 16:]

    K_kyber = Kyber768.decaps(kyber_priv, kyber_ct)
    ephemeral_pub = X25519PublicKey.from_public_bytes(ephemeral_pub_bytes)
    K_x25519 = x25519_priv.exchange(ephemeral_pub)
    hybrid_secret = _combine_shares(K_kyber, K_x25519)

    hkdf = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b'q-mail-hybrid-aes-v2')
    aes_key = hkdf.derive(hybrid_secret)

    cipher = Cipher(algorithms.AES(aes_key), modes.GCM(iv, tag))
    decryptor = cipher.decryptor()
    body = decryptor.update(encrypted_body) + decryptor.finalize()

    return {"body": body.decode('utf-8'), "verified": True}


def encrypt_private_key(key_bytes: bytes, password_hash: str) -> str:
    aes_key = _derive_key(password_hash)
    iv = os.urandom(12)
    cipher = Cipher(algorithms.AES(aes_key), modes.GCM(iv))
    encryptor = cipher.encryptor()
    ct = encryptor.update(key_bytes) + encryptor.finalize()
    tag = encryptor.tag
    return b64encode(iv + tag + ct).decode()


def decrypt_private_key(encrypted_b64: str, password_hash: str) -> bytes:
    aes_key = _derive_key(password_hash)
    data = b64decode(encrypted_b64)
    iv, tag, ct = data[:12], data[12:28], data[28:]
    cipher = Cipher(algorithms.AES(aes_key), modes.GCM(iv, tag))
    decryptor = cipher.decryptor()
    return decryptor.update(ct) + decryptor.finalize()


def get_fingerprint(kyber_pub_b64: str, x25519_pub_b64: str, dili_pub_b64: str, ed25519_pub_b64: str) -> str:
    fp_input = b64decode(kyber_pub_b64) + b64decode(x25519_pub_b64) + b64decode(dili_pub_b64) + b64decode(ed25519_pub_b64)
    return hashlib.sha256(fp_input).hexdigest()[:16]


if __name__ == "__main__":
    keys = generate_quantum_keys()
    print("Kyber768 PK (truncated):", keys['kyber_pub'][:30] + "...")
    print("X25519 PK (truncated):", keys['x25519_pub'][:30] + "...")
    print("Dilithium3 PK (truncated):", keys['dili_pub'][:30] + "...")
    print("Ed25519 PK (truncated):", keys['ed25519_pub'][:30] + "...")
    print("Fingerprint:", keys['fingerprint'])
