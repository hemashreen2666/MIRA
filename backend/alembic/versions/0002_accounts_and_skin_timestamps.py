"""add account credentials and formatted skin-record timestamps

Revision ID: 0002
Revises: 0001
"""
from alembic import op
import sqlalchemy as sa

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

def upgrade() -> None:
    op.add_column("users", sa.Column("age", sa.Integer(), nullable=True))
    op.add_column("users", sa.Column("username", sa.String(50), nullable=True))
    op.add_column("users", sa.Column("email", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("password_hash", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("session_token_hash", sa.String(64), nullable=True))
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_session_token_hash", "users", ["session_token_hash"])
    op.add_column("skin_analysis", sa.Column("recorded_date", sa.String(10), nullable=True))
    op.add_column("skin_analysis", sa.Column("recorded_time", sa.String(8), nullable=True))
    op.add_column("skin_analysis", sa.Column("fatigue_level", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("skin_analysis", sa.Column("recommendation_summary", sa.Text(), nullable=True))
    op.create_table(
        "routine_task_progress",
        sa.Column("id", sa.Uuid(as_uuid=True), primary_key=True),
        sa.Column("user_id", sa.Uuid(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("routine_id", sa.Uuid(as_uuid=True), sa.ForeignKey("skincare_routines.id"), nullable=False),
        sa.Column("progress_date", sa.Date(), nullable=False),
        sa.Column("task_name", sa.String(80), nullable=False),
        sa.Column("complete", sa.Boolean(), server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_routine_task_progress_user_id", "routine_task_progress", ["user_id"])
    op.create_index("ix_routine_task_progress_routine_id", "routine_task_progress", ["routine_id"])
    op.create_index("ix_routine_task_progress_date", "routine_task_progress", ["progress_date"])

def downgrade() -> None:
    op.drop_index("ix_routine_task_progress_date", table_name="routine_task_progress")
    op.drop_index("ix_routine_task_progress_routine_id", table_name="routine_task_progress")
    op.drop_index("ix_routine_task_progress_user_id", table_name="routine_task_progress")
    op.drop_table("routine_task_progress")
    op.drop_column("skin_analysis", "recommendation_summary")
    op.drop_column("skin_analysis", "fatigue_level")
    op.drop_column("skin_analysis", "recorded_time")
    op.drop_column("skin_analysis", "recorded_date")
    op.drop_index("ix_users_session_token_hash", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_column("users", "session_token_hash")
    op.drop_column("users", "password_hash")
    op.drop_column("users", "email")
    op.drop_column("users", "username")
    op.drop_column("users", "age")
