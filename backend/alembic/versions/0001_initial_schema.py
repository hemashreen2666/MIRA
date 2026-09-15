"""initial schema

Revision ID: 0001
Revises:
Create Date: 2026-09-03

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("display_name", sa.String(80), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )

    op.create_table(
        "skin_analysis",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("acne_level", sa.Integer, nullable=False),
        sa.Column("redness_level", sa.Integer, nullable=False),
        sa.Column("dark_circles_level", sa.Integer, nullable=False),
        sa.Column("uneven_skin_tone_level", sa.Integer, nullable=False),
        sa.Column("facial_brightness_level", sa.Integer, nullable=False),
        sa.Column("oily_appearance_level", sa.Integer, nullable=False),
        sa.Column("analysis_version", sa.String(20), server_default="demo-0.1"),
        sa.Column("processing_time_ms", sa.Float, server_default="0"),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_skin_analysis_user_id", "skin_analysis", ["user_id"])
    op.create_index("ix_skin_analysis_timestamp", "skin_analysis", ["timestamp"])

    op.create_table(
        "facial_expression_analysis",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("expression", sa.String(20), nullable=False),
        sa.Column("confidence", sa.Float, nullable=False),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_expression_user_id", "facial_expression_analysis", ["user_id"])
    op.create_index("ix_expression_timestamp", "facial_expression_analysis", ["timestamp"])

    op.create_table(
        "recommendations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("analysis_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("skin_analysis.id"), nullable=True),
        sa.Column("slug", sa.String(40), nullable=False),
        sa.Column("title", sa.String(120), nullable=False),
        sa.Column("body", sa.Text, nullable=False),
        sa.Column("priority", sa.String(10), nullable=False),
        sa.Column("added_to_routine", sa.Boolean, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_recommendations_user_id", "recommendations", ["user_id"])
    op.create_index("ix_recommendations_analysis_id", "recommendations", ["analysis_id"])

    op.create_table(
        "skincare_routines",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("name", sa.String(80), server_default="Daily Routine"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_skincare_routines_user_id", "skincare_routines", ["user_id"])

    op.create_table(
        "routine_steps",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("routine_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("skincare_routines.id"), nullable=False),
        sa.Column("order_index", sa.Integer, nullable=False),
        sa.Column("title", sa.String(80), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("duration", sa.String(20), nullable=False),
        sa.Column("complete", sa.Boolean, server_default=sa.false()),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_routine_steps_routine_id", "routine_steps", ["routine_id"])

    op.create_table(
        "routine_progress",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("routine_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("skincare_routines.id"), nullable=False),
        sa.Column("progress_date", sa.Date, nullable=False),
        sa.Column("completed_steps", sa.Integer, server_default="0"),
        sa.Column("total_steps", sa.Integer, server_default="0"),
        sa.Column("percent_complete", sa.Integer, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_routine_progress_user_id", "routine_progress", ["user_id"])
    op.create_index("ix_routine_progress_date", "routine_progress", ["progress_date"])

    op.create_table(
        "wellness_insights",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("insight_date", sa.Date, nullable=False),
        sa.Column("consistency", sa.Integer, nullable=False),
        sa.Column("brightness", sa.Integer, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_wellness_insights_user_id", "wellness_insights", ["user_id"])
    op.create_index("ix_wellness_insights_date", "wellness_insights", ["insight_date"])


def downgrade() -> None:
    op.drop_table("wellness_insights")
    op.drop_table("routine_progress")
    op.drop_table("routine_steps")
    op.drop_table("skincare_routines")
    op.drop_table("recommendations")
    op.drop_table("facial_expression_analysis")
    op.drop_table("skin_analysis")
    op.drop_table("users")
