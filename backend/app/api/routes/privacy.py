"""/api/v1/privacy/status"""
from fastapi import APIRouter

from app.schemas.privacy import PrivacyStatusResponse

router = APIRouter(prefix="/privacy", tags=["Privacy"])


@router.get(
    "/status",
    response_model=PrivacyStatusResponse,
    summary="Get current privacy configuration",
    description=(
        "MIRA processes all camera frames in memory and never persists "
        "images, video, or face embeddings. Only derived numeric analysis "
        "results are stored in the database."
    ),
)
def privacy_status():
    return PrivacyStatusResponse(
        localProcessing=True,
        imageStorage=False,
        biometricStorage=False,
        cloudProcessing=False,
    )
