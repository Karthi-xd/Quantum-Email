import sys
sys.stdout.reconfigure(encoding='utf-8')
import logging
logger = logging.getLogger(__name__)

from kyber_py.kyber import Kyber512
from dilithium_py.dilithium import Dilithium2
from base64 import b64encode, b64decode
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives.kdf.hkdf import HKDF
from cryptography.hazmat.primitives import hashes
import os


def generate_quantum_keys():
    logger.info("Generating Post-Quantum Keys...")

    public_key_kyber, private_key_kyber = Kyber512.keygen()
    public_key_dili, private_key_dili = Dilithium2.keygen()

    return {
        "kyber_pub": b64encode(public_key_kyber).decode('utf-8'),
        "kyber_priv": b64encode(private_key_kyber).decode('utf-8'),
        "dili_pub": b64encode(public_key_dili).decode('utf-8'),
        "dili_priv": b64encode(private_key_dili).decode('utf-8'),
    }


def encrypt_email_body(body: str, recipient_kyber_pub_b64: str, sender_dili_priv_b64: str) -> dict:
    kyber_pub = b64decode(recipient_kyber_pub_b64)
    dili_priv = b64decode(sender_dili_priv_b64)

    shared_secret, ciphertext = Kyber512.encaps(kyber_pub)

    hkdf = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b'q-mail-pqc')
    aes_key = hkdf.derive(shared_secret)

    iv = os.urandom(12)
    cipher = Cipher(algorithms.AES(aes_key), modes.GCM(iv))
    encryptor = cipher.encryptor()
    encrypted_body = encryptor.update(body.encode('utf-8')) + encryptor.finalize()
    tag = encryptor.tag

    payload = iv + tag + encrypted_body

    data_to_sign = ciphertext + payload
    signature = Dilithium2.sign(dili_priv, data_to_sign)

    return {
        "encrypted_body": b64encode(payload).decode('utf-8'),
        "encrypted_key": b64encode(ciphertext).decode('utf-8'),
        "signature": b64encode(signature).decode('utf-8'),
    }


def decrypt_email_body(encrypted_body_b64: str, encrypted_key_b64: str, signature_b64: str,
                        recipient_kyber_priv_b64: str, sender_dili_pub_b64: str) -> dict:
    kyber_priv = b64decode(recipient_kyber_priv_b64)
    dili_pub = b64decode(sender_dili_pub_b64)
    ciphertext = b64decode(encrypted_key_b64)
    payload = b64decode(encrypted_body_b64)
    sig = b64decode(signature_b64)

    data_to_verify = ciphertext + payload
    verified = Dilithium2.verify(dili_pub, data_to_verify, sig)

    shared_secret = Kyber512.decaps(kyber_priv, ciphertext)

    hkdf = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b'q-mail-pqc')
    aes_key = hkdf.derive(shared_secret)

    iv = payload[:12]
    tag = payload[12:28]
    ciphertext_body = payload[28:]

    cipher = Cipher(algorithms.AES(aes_key), modes.GCM(iv, tag))
    decryptor = cipher.decryptor()
    body = decryptor.update(ciphertext_body) + decryptor.finalize()

    return {
        "body": body.decode('utf-8'),
        "verified": verified,
    }


def encrypt_private_key(key_bytes: bytes, password_hash: str) -> str:
    hkdf = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b'q-mail-key-encrypt')
    aes_key = hkdf.derive(password_hash.encode('utf-8'))
    iv = os.urandom(12)
    cipher = Cipher(algorithms.AES(aes_key), modes.GCM(iv))
    encryptor = cipher.encryptor()
    ct = encryptor.update(key_bytes) + encryptor.finalize()
    return b64encode(iv + encryptor.tag + ct).decode('utf-8')


def decrypt_private_key(encrypted_b64: str, password_hash: str) -> bytes:
    hkdf = HKDF(algorithm=hashes.SHA256(), length=32, salt=None, info=b'q-mail-key-encrypt')
    aes_key = hkdf.derive(password_hash.encode('utf-8'))
    data = b64decode(encrypted_b64)
    iv, tag, ct = data[:12], data[12:28], data[28:]
    cipher = Cipher(algorithms.AES(aes_key), modes.GCM(iv, tag))
    decryptor = cipher.decryptor()
    return decryptor.update(ct) + decryptor.finalize()


if __name__ == "__main__":
    keys = generate_quantum_keys()
    print("Kyber Public Key (Truncated):", keys['kyber_pub'][:30] + "...")
    print("Dilithium Public Key (Truncated):", keys['dili_pub'][:30] + "...")
