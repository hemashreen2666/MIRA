"""
Model inference abstraction layer.

This module exists so that, once trained TensorFlow/PyTorch models are
available, they can be dropped in behind the SAME interface used by the
services layer -- without changing any FastAPI route code.

Today: `get_skin_analyzer()` returns a clearly-marked demo/heuristic
implementation. Later: return an `MLSkinAnalyzer` that loads a trained
model checkpoint from app/ml/models/.
"""
from app.cv.skin_analyzer import SkinAnalyzer, HeuristicSkinAnalyzer, MockSkinAnalyzer


def get_skin_analyzer(prefer_camera_pipeline: bool = True) -> SkinAnalyzer:
    """
    Returns the active skin analyzer implementation.

    prefer_camera_pipeline=True attempts the OpenCV heuristic analyzer
    (needs a real frame). Set to False (e.g. in tests / no-camera demo
    mode) to force the mock analyzer.
    """
    if not prefer_camera_pipeline:
        return MockSkinAnalyzer()
    try:
        import cv2  # noqa: F401  -- just checking availability
        return HeuristicSkinAnalyzer()
    except Exception:
        return MockSkinAnalyzer()
