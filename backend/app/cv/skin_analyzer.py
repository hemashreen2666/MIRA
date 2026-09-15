"""
Visible skin feature analysis.

Produces 0-100 scores for: acne, redness, dark_circles, uneven_skin_tone,
facial_brightness, oily_appearance.

This module never performs medical diagnosis. It only estimates VISIBLE
image characteristics (color variance, brightness, local contrast, etc.)
within the detected face region.
"""
from dataclasses import dataclass

import numpy as np


@dataclass
class SkinFeatureScores:
    acne: int
    redness: int
    dark_circles: int
    uneven_skin_tone: int
    facial_brightness: int
    oily_appearance: int


class SkinAnalyzer:
    """Abstract interface. Swap MockSkinAnalyzer for MLSkinAnalyzer later."""

    def analyze(self, face_region_bgr: np.ndarray) -> SkinFeatureScores:
        raise NotImplementedError


class HeuristicSkinAnalyzer(SkinAnalyzer):
    """
    DEMO / NON-ML IMPLEMENTATION.

    Uses simple, explainable OpenCV image-processing heuristics (HSV
    brightness stats, local variance, redness channel ratio) rather than a
    trained model. This is clearly a placeholder and NOT real AI inference —
    replace with MLSkinAnalyzer once a trained model is available.
    """

    def analyze(self, face_region_bgr: np.ndarray) -> SkinFeatureScores:
        import cv2

        hsv = cv2.cvtColor(face_region_bgr, cv2.COLOR_BGR2HSV)
        h, s, v = cv2.split(hsv)

        brightness = float(np.mean(v))
        facial_brightness = int(np.clip(brightness / 255 * 100, 0, 100))

        saturation = float(np.mean(s))
        oily_appearance = int(np.clip(saturation / 255 * 100, 0, 100))

        b, g, r = cv2.split(face_region_bgr.astype(np.float32))
        redness_ratio = float(np.mean(r) / (np.mean(g) + np.mean(b) + 1e-5))
        redness = int(np.clip((redness_ratio - 0.8) * 150, 0, 100))

        gray = cv2.cvtColor(face_region_bgr, cv2.COLOR_BGR2GRAY)
        local_variance = float(np.var(cv2.Laplacian(gray, cv2.CV_64F)))
        acne = int(np.clip(local_variance / 50, 0, 100))
        uneven_skin_tone = int(np.clip(local_variance / 40, 0, 100))

        h_frac, w_frac = face_region_bgr.shape[0], face_region_bgr.shape[1]
        under_eye_region = gray[int(h_frac * 0.35):int(h_frac * 0.5), :]
        dark_circles = int(np.clip(100 - (np.mean(under_eye_region) / 255 * 100), 0, 100)) if under_eye_region.size else 40

        return SkinFeatureScores(
            acne=acne,
            redness=redness,
            dark_circles=dark_circles,
            uneven_skin_tone=uneven_skin_tone,
            facial_brightness=facial_brightness,
            oily_appearance=oily_appearance,
        )


class MockSkinAnalyzer(SkinAnalyzer):
    """
    CLEARLY-LABELED MOCK. Used when no camera frame is supplied (e.g. demo
    mode, automated tests) or MediaPipe/OpenCV are unavailable. Returns
    plausible but fixed/randomized demo values -- NOT derived from any real
    image.
    """

    def analyze(self, face_region_bgr: np.ndarray | None = None) -> SkinFeatureScores:
        import random

        return SkinFeatureScores(
            acne=random.randint(10, 30),
            redness=random.randint(30, 55),
            dark_circles=random.randint(35, 60),
            uneven_skin_tone=random.randint(15, 35),
            facial_brightness=random.randint(60, 85),
            oily_appearance=random.randint(10, 30),
        )
