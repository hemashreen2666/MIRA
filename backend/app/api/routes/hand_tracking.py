"""/api/v1/hand-tracking/*"""
from fastapi import APIRouter

from app.schemas.hand_tracking import HandTrackingStatusResponse
from app.services import hand_tracking_service

router = APIRouter(prefix="/hand-tracking", tags=["Hand Tracking"])


@router.get(
    "/status",
    response_model=HandTrackingStatusResponse,
    summary="Get hand tracking readiness/status",
    description=(
        "Reports whether the hand-tracking pipeline (MediaPipe Hands) is "
        "available and ready. A future WebSocket endpoint can stream "
        "live per-frame gesture results for real-time routine control."
    ),
)
def hand_tracking_status():
    return hand_tracking_service.get_hand_tracking_status()
