# src/domain/dto/reset_password_dto.py

# clase usada para restablecer la contrasena
class ResetPasswordDTO:
    def __init__(self, email, new_password, code):
        self.email = email #correo electronico del usuraio
        self.new_password = new_password #nueva contrasena del usuario
        self.code = code #codigo OTP de verificacion
