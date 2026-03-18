from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend

key = b'admi.021.024.202' # Debe ser de 16 bytes (para AES-128)

def decrypt_password(encrypted_password, iv):
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
    decryptor = cipher.decryptor()
    decrypted_password  = decryptor.update(encrypted_password) + decryptor.finalize()
    return decrypted_password.rstrip(b'\0').decode() # Elimina el relleno

    