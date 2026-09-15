"""
Rule-based recommendation engine.

Generates non-medical recommendations from the latest skin_analysis scores.
Designed to be swapped for an ML-based recommender later -- callers only
depend on `generate_recommendations_for_analysis()` and
`list_recommendations()`.
"""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.recommendation import Recommendation
from app.models.skin_analysis import SkinAnalysis

REDNESS_THRESHOLD = 40
OILY_THRESHOLD = 40
DARK_CIRCLES_THRESHOLD = 45
BRIGHTNESS_LOW_THRESHOLD = 45


def generate_recommendations_for_analysis(db: Session, user_id: UUID, analysis: SkinAnalysis) -> list[Recommendation]:
    rules = []

    if analysis.redness_level >= REDNESS_THRESHOLD:
        rules.append(dict(
            slug="hydration",
            title="Hydration",
            body="Consider maintaining a consistent hydration-focused routine.",
            priority="High",
        ))

    rules.append(dict(
        slug="sun",
        title="Sun Protection",
        body="Consider using appropriate sun protection during daytime hours.",
        priority="High",
    ))

    if analysis.oily_appearance_level >= OILY_THRESHOLD:
        rules.append(dict(
            slug="cleanse",
            title="Skin Cleansing",
            body="Follow a consistent cleansing routine, morning and night.",
            priority="Medium",
        ))

    if analysis.dark_circles_level >= DARK_CIRCLES_THRESHOLD:
        rules.append(dict(
            slug="sleep",
            title="Rest & Recovery",
            body="Visible under-eye signs may ease with a more consistent sleep schedule.",
            priority="Low",
        ))

    if analysis.facial_brightness_level < BRIGHTNESS_LOW_THRESHOLD:
        rules.append(dict(
            slug="brightness",
            title="Daily Routine Consistency",
            body="A steady morning and evening routine may help support a brighter appearance over time.",
            priority="Medium",
        ))

    # Upsert by (user_id, slug) so repeated analyses refresh the current
    # recommendation set in place instead of piling up duplicate rows (which
    # would also collide on the frontend's slug-based React keys). The
    # `added_to_routine` flag a user set is preserved across regenerations.
    existing = (
        db.execute(select(Recommendation).where(Recommendation.user_id == user_id))
        .scalars()
        .all()
    )
    existing_by_slug = {row.slug: row for row in existing}

    current = []
    for rule in rules:
        row = existing_by_slug.get(rule["slug"])
        if row is not None:
            row.analysis_id = analysis.id
            row.title = rule["title"]
            row.body = rule["body"]
            row.priority = rule["priority"]
        else:
            row = Recommendation(
                user_id=user_id,
                analysis_id=analysis.id,
                slug=rule["slug"],
                title=rule["title"],
                body=rule["body"],
                priority=rule["priority"],
                added_to_routine=False,
            )
            db.add(row)
        current.append(row)

    db.commit()
    for row in current:
        db.refresh(row)
    return current


def list_recommendations(db: Session, user_id: UUID, limit: int = 20) -> list[Recommendation]:
    return (
        db.execute(
            select(Recommendation)
            .where(Recommendation.user_id == user_id)
            .order_by(Recommendation.created_at)
            .limit(limit)
        )
        .scalars()
        .all()
    )


def mark_added_to_routine(db: Session, user_id: UUID, slug: str) -> Recommendation | None:
    """`slug` is the stable id the API exposes (and the frontend renders),
    not the internal UUID primary key."""
    row = (
        db.execute(
            select(Recommendation)
            .where(Recommendation.user_id == user_id, Recommendation.slug == slug)
            .order_by(Recommendation.created_at.desc())
        )
        .scalars()
        .first()
    )
    if not row:
        return None
    row.added_to_routine = True
    db.commit()
    db.refresh(row)
    return row
