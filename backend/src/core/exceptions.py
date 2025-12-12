# src/core/exeptions.py

# se define una exepcion personalizada de Exeption
class DomainError(Exception):
    def __init__(self, code, message, status=400):
        self.code = code #codigo interno de error
        self.message = message #mensaje de error
        self.status = status #codigo HTTP del error
        super().__init__(message)
