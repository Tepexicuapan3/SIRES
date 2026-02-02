class AuthServiceError(Exception):
    # Error controlado con metadata HTTP.
    def __init__(self, code, message, status_code, details=None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
