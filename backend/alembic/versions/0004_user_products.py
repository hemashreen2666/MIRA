"""add user owned products

Revision ID: 0004_user_products
Revises: 0003
"""
from alembic import op
import sqlalchemy as sa

revision = "0004_user_products"
down_revision = "0003"
branch_labels = None
depends_on = None

def upgrade():
    op.create_table("user_products",
        sa.Column("id", sa.Uuid(), primary_key=True), sa.Column("user_id", sa.Uuid(), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("product_id", sa.String(100), nullable=False), sa.Column("product_name", sa.String(255), nullable=False),
        sa.Column("brand", sa.String(255)), sa.Column("category", sa.String(40), nullable=False), sa.Column("routine_step", sa.String(40), nullable=False),
        sa.Column("image_url", sa.Text()), sa.Column("product_url", sa.Text()), sa.Column("ingredients_summary", sa.Text()), sa.Column("labels", sa.Text()), sa.Column("barcode", sa.String(100)), sa.Column("added_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.UniqueConstraint("user_id", "product_id", name="uq_user_products_user_product"))
    op.create_index("ix_user_products_user_id", "user_products", ["user_id"])

def downgrade():
    op.drop_index("ix_user_products_user_id", table_name="user_products")
    op.drop_table("user_products")
