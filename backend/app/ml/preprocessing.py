"""
Shared preprocessing helpers for frames headed into the CV/ML pipeline.
"""
import numpy as np


def decode_image_bytes(data: bytes) -> np.ndarray:
    """Decode raw uploaded image bytes (JPEG/PNG) into a BGR numpy array."""
    import cv2

    arr = np.frombuffer(data, dtype=np.uint8)
    frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if frame is None:
        raise ValueError("Could not decode image data")
    return frame


def crop_face_region(frame_bgr: np.ndarray, x: int, y: int, w: int, h: int) -> np.ndarray:
    height, width = frame_bgr.shape[:2]
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(width, x + w), min(height, y + h)
    return frame_bgr[y0:y1, x0:x1]
