"""Response shape for /api/v1/privacy/status."""
from pydantic import BaseModel


class PrivacyStatusResponse(BaseModel):
    localProcessing: bool
    imageStorage: bool
    biometricStorage: bool
    cloudProcessing: bool
