class ResetPasswordDTO:
    def __init__(self, email, new_password, code):
        self.email = email
        self.new_password = new_password
        self.code = code
