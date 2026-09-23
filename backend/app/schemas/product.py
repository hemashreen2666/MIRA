from typing import Literal
from uuid import UUID
from pydantic import BaseModel, Field

RoutineStep = Literal["CLEANSE", "HYDRATE", "TREATMENT", "MOISTURIZE", "SUN_PROTECTION"]

class ProductItem(BaseModel):
    product_id: str
    name: str
    brand: str | None = None
    category: str
    routine_step: RoutineStep
    image_url: str | None = None
    product_url: str | None = None
    ingredients: str | None = None
    labels: str | None = None
    barcode: str | None = None
    why: str | None = None

class ProductRecommendationResponse(BaseModel):
    summary: str
    items: list[ProductItem]
    more: list[ProductItem]

class DemoProductRecommendationRequest(BaseModel):
    """Opaque id returned by the current anonymous scan, not a user id."""
    demo_scan_id: UUID

class ProductSearchResponse(BaseModel):
    items: list[ProductItem]

class AddRoutineProductRequest(BaseModel):
    product: ProductItem

class UserProductOut(ProductItem):
    id: UUID
    added_at: str
