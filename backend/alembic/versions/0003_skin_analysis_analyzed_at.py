"""store a canonical analysis-save timestamp

Revision ID: 0003
Revises: 0002
"""
from alembic import op
import sqlalchemy as sa

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Nullable while old rows are backfilled. SQLite's CURRENT_TIMESTAMP has
    # always been UTC, so it is the safest source for legacy records.
    op.add_column("skin_analysis", sa.Column("analyzed_at", sa.DateTime(timezone=True), nullable=True))
    op.execute("UPDATE skin_analysis SET analyzed_at = timestamp WHERE analyzed_at IS NULL")
    op.create_index("ix_skin_analysis_analyzed_at", "skin_analysis", ["analyzed_at"])


def downgrade() -> None:
    op.drop_index("ix_skin_analysis_analyzed_at", table_name="skin_analysis")
    op.drop_column("skin_analysis", "analyzed_at")
