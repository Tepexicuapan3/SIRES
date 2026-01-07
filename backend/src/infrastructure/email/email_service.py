#src\infraestructure\email\email_service.py
import smtplib #envio de correos SMTP
from email.mime.text import MIMEText #connstruir correos electronicos
from email.mime.multipart import MIMEMultipart
import os
from pathlib import Path

#clase para enviar correos electronicos
class EmailService:

    def __init__(self):
        #datos de quien enviara los correos electronicos
        self.smtp_host = os.getenv("SMTP_HOST")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("SMTP_FROM_EMAIL", self.smtp_user)
        
        # Ruta al directorio de templates
        self.templates_dir = Path(__file__).parent / "templates"
        
        # Validación: Verificar que las variables críticas estén configuradas
        if not self.smtp_host:
            raise ValueError("SMTP_HOST no está configurado en .env")
        if not self.smtp_user:
            raise ValueError("SMTP_USER no está configurado en .env")
        if not self.smtp_password:
            raise ValueError("SMTP_PASSWORD no está configurado en .env")
    
    def _render_template(self, template_name: str, **kwargs) -> str:
        """
        Renderiza un template HTML reemplazando variables {{variable}} con sus valores.
        
        Args:
            template_name: Nombre del archivo template (ej: "reset_code.html")
            **kwargs: Variables a reemplazar en el template
        
        Returns:
            String con el HTML renderizado
        """
        template_path = self.templates_dir / template_name
        
        if not template_path.exists():
            raise FileNotFoundError(f"Template no encontrado: {template_path}")
        
        # Leer template
        with open(template_path, 'r', encoding='utf-8') as f:
            html_content = f.read()
        
        # Reemplazar variables {{variable}} con sus valores
        for key, value in kwargs.items():
            placeholder = f"{{{{{key}}}}}"
            html_content = html_content.replace(placeholder, str(value))
        
        return html_content

    #funcion para enviar los correos electronicos de recuperacion
    def send_reset_code(self, to_email: str, code: str, expiry_minutes: int = 10):
        """
        Envía un email con el código de recuperación de contraseña.
        
        Args:
            to_email: Email del destinatario
            code: Código OTP de 6 dígitos
            expiry_minutes: Minutos hasta que expire el código (default: 10)
        """
        subject = "Código de Recuperación - SIRES"
        
        # Versión texto plano (fallback para clientes que no soportan HTML)
        body_plain = f"""
Hola,

Recibiste este correo porque solicitaste restablecer tu contraseña en SIRES.

Tu código de recuperación es:

    {code}

Este código es válido por {expiry_minutes} minutos.

Ingresa este código en la página de recuperación para crear tu nueva contraseña.

Si no solicitaste este código, simplemente ignora este mensaje. Tu contraseña permanecerá sin cambios.

---
SIRES - Sistema de Información de Registro Electrónico para la Salud
Sistema de Transporte Colectivo Metro - Ciudad de México
© 2026 Metro CDMX. Información confidencial.
"""
        
        # Versión HTML (diseño moderno con identidad Metro CDMX)
        try:
            body_html = self._render_template(
                "reset_code.html",
                code=code,
                expiry_minutes=expiry_minutes
            )
        except FileNotFoundError as e:
            print(f"[WARN EMAIL] No se encontró template HTML, usando solo texto plano: {e}")
            body_html = None
        
        # Construir mensaje multipart (HTML + texto plano)
        msg = MIMEMultipart('alternative')
        
        # Asegurar que self.from_email no es None (ya validado en __init__)
        assert self.from_email is not None, "from_email no puede ser None"
        assert self.smtp_host is not None, "smtp_host no puede ser None"
        assert self.smtp_user is not None, "smtp_user no puede ser None"
        assert self.smtp_password is not None, "smtp_password no puede ser None"
        
        msg["From"] = self.from_email
        msg["To"] = to_email
        msg["Subject"] = subject
        
        # Agregar versión texto plano (se muestra si HTML no está soportado)
        msg.attach(MIMEText(body_plain, "plain", "utf-8"))
        
        # Agregar versión HTML si está disponible
        if body_html:
            msg.attach(MIMEText(body_html, "html", "utf-8"))

        try:
            print(f"[EMAIL] Intentando conectar a SMTP: {self.smtp_host}:{self.smtp_port}")
            print(f"[EMAIL] Usuario SMTP: {self.smtp_user}")
            
            #se crea la conexion con el servidor SMTP
            with smtplib.SMTP(self.smtp_host, self.smtp_port, timeout=30) as server:
                server.set_debuglevel(0)  # 0=sin debug, 1=debug activado
                
                print(f"[EMAIL] Conexión establecida, iniciando EHLO...")
                server.ehlo()
                
                print(f"[EMAIL] Iniciando STARTTLS...")
                server.starttls() #conexion con TLS
                server.ehlo()
                
                print(f"[EMAIL] Autenticando usuario...")
                server.login(self.smtp_user, self.smtp_password) #autentifica al usuario
                
                print(f"[EMAIL] Enviando correo a {to_email}...")
                server.sendmail(self.from_email, to_email, msg.as_string()) #envia el correo electronico
                
                print(f"[EMAIL] ✓ Correo enviado exitosamente a {to_email}")

        except smtplib.SMTPAuthenticationError as e:
            print(f"[ERROR SMTP] Autenticación rechazada: {e}")
            print(f"[ERROR SMTP] Verifica SMTP_USER y SMTP_PASSWORD")
            raise
        except smtplib.SMTPConnectError as e:
            print(f"[ERROR SMTP] No se pudo conectar al servidor: {e}")
            print(f"[ERROR SMTP] Verifica SMTP_HOST y SMTP_PORT")
            raise
        except smtplib.SMTPServerDisconnected as e:
            print(f"[ERROR SMTP] Servidor desconectó inesperadamente: {e}")
            raise
        except Exception as e:
            print(f"[ERROR SMTP] Error inesperado: {type(e).__name__}: {e}")
            raise #exepcion manejada por capas superiores
