import os
import base64
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding

AES_SECRET_KEY = os.getenv("AES_SECRET_KEY") or os.urandom(32)


def encrypt_token_aes(token: str) -> str:
    if isinstance(token, bytes):
        token = token.decode()

    iv = os.urandom(16)

    padder = padding.PKCS7(128).padder()
    padded = padder.update(token.encode()) + padder.finalize()

    cipher = Cipher(algorithms.AES(AES_SECRET_KEY), modes.CBC(iv))
    encryptor = cipher.encryptor()
    ciphertext = encryptor.update(padded) + encryptor.finalize()

    return base64.urlsafe_b64encode(iv + ciphertext).decode()
