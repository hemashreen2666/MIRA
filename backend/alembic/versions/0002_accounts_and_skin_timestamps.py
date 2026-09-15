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
    op.add_column("users", sa.Column("username", sa.String(50), nullable=True))
    op.add_column("users", sa.Column("email", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("password_hash", sa.String(255), nullable=True))
    op.add_column("users", sa.Column("session_token_hash", sa.String(64), nullable=True))
    op.create_index("ix_users_username", "users", ["username"], unique=True)
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_session_token_hash", "users", ["session_token_hash"])
    op.add_column("skin_analysis", sa.Column("recorded_date", sa.String(10), nullable=True))
    op.add_column("skin_analysis", sa.Column("recorded_time", sa.String(8), nullable=True))

def downgrade() -> None:
    op.drop_column("skin_analysis", "recorded_time")
    op.drop_column("skin_analysis", "recorded_date")
    op.drop_index("ix_users_session_token_hash", table_name="users")
    op.drop_index("ix_users_email", table_name="users")
    op.drop_index("ix_users_username", table_name="users")
    op.drop_column("users", "session_token_hash")
    op.drop_column("users", "password_hash")
    op.drop_column("users", "email")
    op.drop_column("users", "username")
