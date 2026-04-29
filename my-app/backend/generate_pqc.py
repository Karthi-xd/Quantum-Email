import sys
sys.stdout.reconfigure(encoding='utf-8')

from kyber_py.kyber import Kyber512
from dilithium_py.dilithium import Dilithium2
from base64 import b64encode

def generate_quantum_keys():
    print("Generating Post-Quantum Keys...")

    # 1. KYBER (for Encrypting the Email)
    public_key_kyber, private_key_kyber = Kyber512.keygen()

    # 2. DILITHIUM (for Signing the Email - Identity)
    public_key_dili, private_key_dili = Dilithium2.keygen()

    # We encode them to Base64 so they can be saved as TEXT in your database
    return {
        "kyber_pub": b64encode(public_key_kyber).decode('utf-8'),
        "kyber_priv": b64encode(private_key_kyber).decode('utf-8'),
        "dili_pub": b64encode(public_key_dili).decode('utf-8'),
        "dili_priv": b64encode(private_key_dili).decode('utf-8'),
    }

if __name__ == "__main__":
    keys = generate_quantum_keys()
    print("Kyber Public Key (Truncated):", keys['kyber_pub'][:30] + "...")
    print("Dilithium Public Key (Truncated):", keys['dili_pub'][:30] + "...")
