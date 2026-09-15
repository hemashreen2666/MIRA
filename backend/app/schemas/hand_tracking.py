"""Response shape for /api/v1/hand-tracking/status."""
from typing import Literal

from pydantic import BaseModel


class HandTrackingStatusResponse(BaseModel):
    """Matches frontend getHandTrackingStatus() shape exactly."""
    handDetected: bool
    gestureStatus: Literal["Ready", "Idle", "Tracking", "Lost"]
    routineControl: Literal["Enabled", "Disabled"]
