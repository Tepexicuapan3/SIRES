#src\infraestructure\security\aes_service.py
import os
import base64 #para codifivar en b64
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes #algoritmos criptograficos
from cryptography.hazmat.primitives import padding #padding de CBC

"""se obtiene la clave secreta
   en caso de no existri, se crea una aleatoria de 32 bytes
"""
AES_SECRET_KEY = os.getenv("AES_SECRET_KEY") or os.urandom(32)

#cifra un token en AES modo CBC
def encrypt_token_aes(token: str) -> str:
    if isinstance(token, bytes): #se obtiene el token en bytes
        token = token.decode() #se convierte en string

    iv = os.urandom(16) # se crea vector de inicializacion de 16 bytes

    #se crea el padder para completar el relleno del bloque
    padder = padding.PKCS7(128).padder() #16 bytes / 128 bites
    padded = padder.update(token.encode()) + padder.finalize() #aplica el padding

    #crea el cifrador de AES, usando llave, define modo CBC 
    cipher = Cipher(algorithms.AES(AES_SECRET_KEY), modes.CBC(iv))
    encryptor = cipher.encryptor() # obtiene el objeto
    ciphertext = encryptor.update(padded) + encryptor.finalize() #cifra el token con el padding

    #regresa el digesto en b64
    return base64.urlsafe_b64encode(iv + ciphertext).decode()
