"""Local, non-medical historical skin insight and reminder rules.

This service reads only the authenticated user's persisted visible-feature
scores. It never receives, stores, or transmits camera data.
"""
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.skin_analysis import SkinAnalysis
from app.models.user import User
from app.models.user_product import UserProduct

HISTORY_WINDOW = 5
TREND_DELTA = 5  # Scores are 0-100; changes below this are presented as stable.
METRICS = (
    ("acne", "Acne-like Spots", "acne_level", True),
    ("redness", "Visible Redness", "redness_level", True),
    ("darkCircles", "Dark Circles", "dark_circles_level", True),
    ("brightness", "Facial Brightness", "facial_brightness_level", False),
    ("oily", "Oily Appearance", "oily_appearance_level", True),
)


def _trend(current: int, previous: int | None, higher_is_concern: bool) -> str:
    if previous is None:
        return "INSUFFICIENT_DATA"
    difference = current - previous
    if abs(difference) < TREND_DELTA:
        return "STABLE"
    if higher_is_concern:
        return "INCREASING" if difference > 0 else "IMPROVING"
    return "IMPROVING" if difference > 0 else "DECREASING"


def get_personalized_insight(db: Session, user_id: UUID) -> dict:
    user = db.get(User, user_id)
    name = (user.display_name or user.username or "there").strip() if user else "there"
    analyses = db.execute(
        select(SkinAnalysis).where(SkinAnalysis.user_id == user_id)
        .order_by(SkinAnalysis.analyzed_at.desc()).limit(HISTORY_WINDOW)
    ).scalars().all()
    if not analyses:
        return {
            "greeting": f"Hello, {name}! 👋", "welcome": "Welcome back to MIRA.", "has_analysis": False,
            "history_count": 0, "progress_message": "Complete your first analysis to start tracking your skin progress.",
            "metrics": [], "reminders": [],
        }

    latest = analyses[0]
    previous = analyses[1] if len(analyses) > 1 else None
    historical = analyses[1:]
    metrics = []
    by_id = {}
    for metric_id, label, field, higher_is_concern in METRICS:
        current = getattr(latest, field)
        prior = getattr(previous, field) if previous else None
        average = round(sum(getattr(row, field) for row in historical) / len(historical), 1) if len(historical) >= 2 else None
        item = {"id": metric_id, "label": label, "current": current, "previous": prior,
                "recent_average": average, "trend": _trend(current, prior, higher_is_concern)}
        metrics.append(item); by_id[metric_id] = item

    products = db.execute(select(UserProduct).where(UserProduct.user_id == user_id)).scalars().all()
    steps_with_products = {product.routine_step for product in products}
    reminders = []
    acne = by_id["acne"]
    if acne["current"] >= 45 or acne["trend"] == "INCREASING":
        if "TREATMENT" in steps_with_products:
            reminders.append({"type": "acne", "routine_step": "TREATMENT", "message": "MIRA detected elevated visible acne-like spots. Don't forget your treatment step today."})
        elif "CLEANSE" in steps_with_products:
            reminders.append({"type": "acne", "routine_step": "CLEANSE", "message": "MIRA detected elevated visible acne-like spots. Remember your gentle cleansing step today."})
    redness = by_id["redness"]
    if redness["current"] >= 40 or redness["trend"] == "INCREASING":
        if "MOISTURIZE" in steps_with_products:
            reminders.append({"type": "redness", "routine_step": "MOISTURIZE", "message": "Your recent visible redness is elevated or increasing. Keep your moisturizing routine gentle today."})
    brightness = by_id["brightness"]
    if brightness["current"] < 45 or brightness["trend"] == "DECREASING":
        step = "MOISTURIZE" if "MOISTURIZE" in steps_with_products else "HYDRATE"
        if step in steps_with_products:
            reminders.append({"type": "brightness", "routine_step": step, "message": "Your facial brightness is lower than usual. Remember your hydration and moisturizing routine today."})
    if "SUN_PROTECTION" in steps_with_products:
        reminders.append({"type": "sun_protection", "routine_step": "SUN_PROTECTION", "message": "Don't forget your sun-protection step today. ☀️"})
    if not reminders:
        reminders.append({"type": "routine", "routine_step": "ROUTINE", "message": "Your recent skin measurements are relatively stable. Keep following your regular routine."})

    if len(analyses) == 1:
        progress_message = "One analysis is saved. Complete another analysis to start seeing trends."
    else:
        progress_message = "Your progress compares the latest analysis with your previous session and recent history when available."
    return {"greeting": f"Hello, {name}! 👋", "welcome": "Welcome back to MIRA.", "has_analysis": True,
            "history_count": len(analyses), "progress_message": progress_message, "metrics": metrics, "reminders": reminders[:3]}
