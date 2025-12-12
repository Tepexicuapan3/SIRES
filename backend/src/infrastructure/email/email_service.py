#src\infraestructure\email\email_service.py
import smtplib #envio de correos SMTP
from email.mime.text import MIMEText #connstruir correos electronicos
from email.mime.multipart import MIMEMultipart
import os

#clase para enviar correos electronicos
class EmailService:

    def __init__(self):
        #datos de quien enviara los correos electronicos
        self.smtp_host = os.getenv("SMTP_HOST")
        self.smtp_port = int(os.getenv("SMTP_PORT", 587))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("SMTP_FROM_EMAIL", self.smtp_user)

    #funcion para enviar los correos electronicos
    def send_reset_code(self, to_email: str, code: str):
        subject = "Tu código de recuperación" #asunto del correo 
        #cuerpo del correo
        body = f""" 
Hola,

Tu código de recuperación es:

    {code}

Este código es válido por 10 minutos.

Si no solicitaste este código, simplemente ignora este mensaje.
"""

        msg = MIMEMultipart()
        msg["From"] = self.from_email #define el correo del remitente
        msg["To"] = to_email #correo del destinatario 
        msg["Subject"] = subject #define el asunto del correo

        #cuerpo del mensaje como texto plano
        msg.attach(MIMEText(body, "plain"))

        try:
            #se crea la conexion con el servidor SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls() #conexion con TLS
                server.login(self.smtp_user, self.smtp_password) #autentifica al usuario
                server.sendmail(self.from_email, to_email, msg.as_string()) #envia el correo electronico

        except Exception as e:
            print("Error al enviar correo:", e) #imprime el error 
            raise #exepcion manejada por capas superiores
