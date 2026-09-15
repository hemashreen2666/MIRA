"""
Facial landmark detection abstraction (MediaPipe Face Mesh).

DEMO IMPLEMENTATION: wraps MediaPipe's Face Mesh solution when available.
Falls back gracefully to `None` if mediapipe isn't installed in the current
environment, so the rest of the pipeline can still run in mock mode.
"""
from typing import List, Optional, Tuple

import numpy as np


class FaceLandmarkDetector:
    """Wraps MediaPipe Face Mesh. Returns normalized (x, y, z) landmarks."""

    def __init__(self) -> None:
        self._mp_face_mesh = None
        try:
            import mediapipe as mp

            self._mp_face_mesh = mp.solutions.face_mesh.FaceMesh(
                static_image_mode=True,
                max_num_faces=1,
                refine_landmarks=True,
                min_detection_confidence=0.5,
            )
        except Exception:
            # mediapipe not installed / not supported on this platform.
            # Callers must handle `None` and fall back to mock inference.
            self._mp_face_mesh = None

    @property
    def is_available(self) -> bool:
        return self._mp_face_mesh is not None

    def detect(self, frame_rgb: np.ndarray) -> Optional[List[Tuple[float, float, float]]]:
        if not self.is_available:
            return None

        result = self._mp_face_mesh.process(frame_rgb)
        if not result.multi_face_landmarks:
            return None

        landmarks = result.multi_face_landmarks[0]
        return [(lm.x, lm.y, lm.z) for lm in landmarks.landmark]
