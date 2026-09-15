"""
DEVELOPMENT SEED DATA -- do not run against a production database.

Populates: demo user, sample skin analysis history, sample expressions,
sample recommendations, a default routine with progress, and derived
wellness insight rows.

Usage:
    python seed.py
"""
import random
from datetime import date, datetime, timedelta, timezone

from app.core.database import SessionLocal
from app.models.user import User
from app.models.skin_analysis import SkinAnalysis
from app.models.expression import FacialExpressionAnalysis
from app.models.recommendation import Recommendation
from app.models.routine import SkincareRoutine, RoutineStep, RoutineProgress
from app.models.wellness import WellnessInsight

EXPRESSIONS = ["Happy", "Neutral", "Sad", "Tired"]


def run():
    db = SessionLocal()
    try:
        print("[SEED] Creating demo user...")
        user = db.query(User).first()
        if not user:
            user = User(display_name="MIRA Demo User")
            db.add(user)
            db.commit()
            db.refresh(user)

        print("[SEED] Creating 7 days of skin analysis history...")
        for i in range(7, 0, -1):
            db.add(SkinAnalysis(
                user_id=user.id,
                acne_level=random.randint(10, 30),
                redness_level=random.randint(30, 55),
                dark_circles_level=random.randint(35, 60),
                uneven_skin_tone_level=random.randint(15, 35),
                facial_brightness_level=random.randint(58, 80),
                oily_appearance_level=random.randint(10, 30),
                analysis_version="demo-0.1",
                processing_time_ms=random.uniform(80, 220),
                timestamp=datetime.now(timezone.utc) - timedelta(days=i),
            ))
        db.commit()

        print("[SEED] Creating sample facial expressions...")
        for i in range(5, 0, -1):
            db.add(FacialExpressionAnalysis(
                user_id=user.id,
                expression=random.choice(EXPRESSIONS),
                confidence=round(random.uniform(0.7, 0.95), 2),
                timestamp=datetime.now(timezone.utc) - timedelta(hours=i),
            ))
        db.commit()

        print("[SEED] Creating sample recommendations...")
        sample_recs = [
            ("hydration", "Hydration", "Consider maintaining a consistent hydration-focused routine.", "High", False),
            ("sun", "Sun Protection", "Consider using appropriate sun protection during daytime hours.", "High", True),
            ("cleanse", "Skin Cleansing", "Follow a consistent cleansing routine, morning and night.", "Medium", True),
            ("sleep", "Rest & Recovery", "Visible under-eye signs may ease with a more consistent sleep schedule.", "Low", False),
        ]
        for slug, title, body, priority, added in sample_recs:
            db.add(Recommendation(
                user_id=user.id, slug=slug, title=title, body=body, priority=priority, added_to_routine=added
            ))
        db.commit()

        print("[SEED] Creating default routine + steps...")
        routine = db.query(SkincareRoutine).filter_by(user_id=user.id).first()
        if not routine:
            routine = SkincareRoutine(user_id=user.id, name="Daily Routine")
            db.add(routine)
            db.commit()
            db.refresh(routine)

            steps = [
                (1, "Cleanse", "Gentle cleanser, lukewarm water, 60 seconds.", "1 min", True),
                (2, "Hydrate", "Apply hydrating toner or essence to damp skin.", "1 min", True),
                (3, "Moisturize", "Lock in moisture with a lightweight daily moisturizer.", "2 min", False),
                (4, "Sun Protection", "Broad-spectrum SPF, reapply if heading outdoors.", "1 min", False),
            ]
            for order_index, title, description, duration, complete in steps:
                db.add(RoutineStep(
                    routine_id=routine.id, order_index=order_index, title=title,
                    description=description, duration=duration, complete=complete,
                    completed_at=datetime.now(timezone.utc) if complete else None,
                ))
            db.commit()

        print("[SEED] Creating 7 days of routine progress + wellness insights...")
        for i in range(7, 0, -1):
            d = date.today() - timedelta(days=i)
            completed = random.randint(1, 4)
            percent = round((completed / 4) * 100)
            db.add(RoutineProgress(
                user_id=user.id, routine_id=routine.id, progress_date=d,
                completed_steps=completed, total_steps=4, percent_complete=percent,
            ))
            db.add(WellnessInsight(
                user_id=user.id, insight_date=d,
                consistency=percent, brightness=random.randint(55, 80),
            ))
        db.commit()

        print(f"[SEED] Done. Demo user id: {user.id}")
    finally:
        db.close()


if __name__ == "__main__":
    run()
