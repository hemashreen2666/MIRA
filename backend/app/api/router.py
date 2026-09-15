"""Aggregates all v1 routers under a single prefix."""
from fastapi import APIRouter

from app.api.routes import (
    skin_analysis,
    expression,
    hand_tracking,
    recommendations,
    routine,
    wellness,
    privacy,
)

# health check is mounted at the root (not under /api/v1) in main.py
v1_router = APIRouter()
v1_router.include_router(skin_analysis.router)
v1_router.include_router(expression.router)
v1_router.include_router(hand_tracking.router)
v1_router.include_router(recommendations.router)
v1_router.include_router(routine.router)
v1_router.include_router(wellness.router)
v1_router.include_router(privacy.router)
