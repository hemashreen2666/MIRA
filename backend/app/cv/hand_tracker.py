"""
Hand tracking abstraction (MediaPipe Hands).

DEMO IMPLEMENTATION: wraps MediaPipe Hands when available; otherwise
reports "not available" so the service layer can fall back to a mock
status without pretending it's a live camera read.
"""
from dataclasses import dataclass
from typing import Optional

import numpy as np


@dataclass
class HandTrackingResult:
    hand_detected: bool
    gesture_status: str  # "Ready" | "Idle" | "Tracking" | "Lost"


class HandTracker:
    def __init__(self) -> None:
        self._mp_hands = None
        try:
            import mediapipe as mp

            self._mp_hands = mp.solutions.hands.Hands(
                static_image_mode=True, max_num_hands=1, min_detection_confidence=0.5
            )
        except Exception:
            self._mp_hands = None

    @property
    def is_available(self) -> bool:
        return self._mp_hands is not None

    def track(self, frame_rgb: np.ndarray) -> Optional[HandTrackingResult]:
        if not self.is_available:
            return None

        result = self._mp_hands.process(frame_rgb)
        detected = bool(result.multi_hand_landmarks)
        return HandTrackingResult(
            hand_detected=detected,
            gesture_status="Ready" if detected else "Idle",
        )
