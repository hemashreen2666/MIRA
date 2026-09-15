"""
Face detection abstraction.

DEMO IMPLEMENTATION: uses OpenCV's Haar cascade as a lightweight, dependency
-light stand-in so the pipeline runs end-to-end without a trained model.
Swap in a MediaPipe Face Detector / BlazeFace model for production use.
"""
from dataclasses import dataclass

import numpy as np


@dataclass
class FaceBox:
    x: int
    y: int
    w: int
    h: int


class FaceDetector:
    """DEMO face detector using OpenCV Haar cascades."""

    def __init__(self) -> None:
        import cv2  # local import keeps module importable without cv2 installed

        cascade_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        self._cascade = cv2.CascadeClassifier(cascade_path)

    def detect(self, frame_bgr: np.ndarray) -> FaceBox | None:
        import cv2

        gray = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2GRAY)
        faces = self._cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(80, 80))
        if len(faces) == 0:
            return None
        x, y, w, h = max(faces, key=lambda f: f[2] * f[3])  # largest face
        return FaceBox(int(x), int(y), int(w), int(h))
