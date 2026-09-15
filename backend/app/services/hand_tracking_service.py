"""Hand tracking status service (demo status; wire to MediaPipe stream later)."""
from app.cv.hand_tracker import HandTracker
from app.schemas.hand_tracking import HandTrackingStatusResponse

_tracker = HandTracker()


def get_hand_tracking_status() -> HandTrackingStatusResponse:
    """
    Without a live camera stream over REST, this reports the tracker's
    availability as a readiness signal, matching the frontend's mock shape.
    A future WebSocket endpoint can stream real per-frame results.
    """
    if _tracker.is_available:
        return HandTrackingStatusResponse(handDetected=True, gestureStatus="Ready", routineControl="Enabled")
    return HandTrackingStatusResponse(handDetected=False, gestureStatus="Idle", routineControl="Disabled")
