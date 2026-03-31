class RbacWriteError(Exception):
    def __init__(
        self,
        *,
        code,
        message,
        status_code,
        details=None,
        resource_id=None,
        target_user=None,
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        self.resource_id = resource_id
        self.target_user = target_user
