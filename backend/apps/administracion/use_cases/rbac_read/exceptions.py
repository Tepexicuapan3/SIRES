class RbacReadValidationError(Exception):
    def __init__(self, code, message, details=None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details or {}


class RbacReadNotFoundError(Exception):
    def __init__(self, code, message):
        super().__init__(message)
        self.code = code
        self.message = message
