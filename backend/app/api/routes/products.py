"""Authenticated product discovery and user-owned routine products."""
from uuid import UUID
import asyncio
from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.api.dependencies import get_current_user_id
from app.core.database import get_db
from app.models.skin_analysis import SkinAnalysis
from app.models.user_product import UserProduct
from app.schemas.product import AddRoutineProductRequest, DemoProductRecommendationRequest, ProductItem, ProductRecommendationResponse, ProductSearchResponse, UserProductOut
from app.api.routes.skin_analysis import get_demo_scan
from app.services import product_service, routine_service
from app.utils.errors import MiraAPIError

router = APIRouter(prefix="/products", tags=["Product Recommendations"])

async def _product_response(analysis, current_scan_only: bool = False):
    summary, queries = product_service.recommendation_queries(analysis)
    if current_scan_only:
        summary = "Based on your current scan, these cosmetic products may be relevant."
    try:
        result_sets = await asyncio.gather(*(product_service.search_products(query, limit=3, why=why) for query, why in queries))
        extra_set = await product_service.search_products("face skincare", limit=8)
    except RuntimeError as exc:
        raise MiraAPIError("PRODUCT_SERVICE_UNAVAILABLE", str(exc), 503)
    primary, seen = [], set()
    for products in result_sets:
        for product in products:
            if product["product_id"] not in seen and len(primary) < 5: seen.add(product["product_id"]); primary.append(product)
    more = [p for p in extra_set if p["product_id"] not in seen][:6]
    return ProductRecommendationResponse(summary=summary, items=[ProductItem(**p) for p in primary], more=[ProductItem(**p) for p in more])

@router.post("/demo/recommendations", response_model=ProductRecommendationResponse)
async def demo_recommendations(payload: DemoProductRecommendationRequest):
    analysis = get_demo_scan(payload.demo_scan_id)
    if not analysis:
        raise MiraAPIError("DEMO_SCAN_EXPIRED", "Run a new demo scan to view products.", 404)
    return await _product_response(analysis, current_scan_only=True)

@router.get("/recommendations", response_model=ProductRecommendationResponse)
async def recommendations(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    analysis = db.execute(select(SkinAnalysis).where(SkinAnalysis.user_id == user_id).order_by(SkinAnalysis.analyzed_at.desc()).limit(1)).scalars().first()
    if not analysis: raise MiraAPIError("NOT_FOUND", "Complete a skin analysis before viewing personalized products.", 404)
    return await _product_response(analysis)

@router.get("/search", response_model=ProductSearchResponse)
async def search(query: str = Query(..., min_length=2, max_length=100), user_id: UUID = Depends(get_current_user_id)):
    try:
        products = await product_service.search_products(query)
    except RuntimeError as exc:
        raise MiraAPIError("PRODUCT_SERVICE_UNAVAILABLE", str(exc), 503)
    return ProductSearchResponse(items=[ProductItem(**p) for p in products])

@router.get("/routine", response_model=list[UserProductOut])
def my_products(db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    rows = db.execute(select(UserProduct).where(UserProduct.user_id == user_id).order_by(UserProduct.added_at)).scalars().all()
    return [UserProductOut(id=r.id, product_id=r.product_id, name=r.product_name, brand=r.brand, category=r.category, routine_step=r.routine_step, image_url=r.image_url, product_url=r.product_url, ingredients=r.ingredients_summary, labels=r.labels, barcode=r.barcode, added_at=r.added_at.isoformat()) for r in rows]

@router.post("/routine", response_model=UserProductOut, status_code=201)
def add_product(payload: AddRoutineProductRequest, db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    p = payload.product
    if db.execute(select(UserProduct).where(UserProduct.user_id == user_id, UserProduct.product_id == p.product_id)).scalars().first():
        raise MiraAPIError("DUPLICATE_PRODUCT", "Already added to your routine.", 409)
    category = product_service.normalize_category(p.category, p.ingredients or "")
    row = UserProduct(user_id=user_id, product_id=p.product_id, product_name=p.name, brand=p.brand, category=category, routine_step=product_service.routine_step_for(category), image_url=p.image_url, product_url=p.product_url, ingredients_summary=p.ingredients, labels=p.labels, barcode=p.barcode)
    db.add(row); db.commit(); db.refresh(row)
    routine_service.sync_optional_treatment_step(db, user_id)
    return UserProductOut(id=row.id, product_id=row.product_id, name=row.product_name, brand=row.brand, category=row.category, routine_step=row.routine_step, image_url=row.image_url, product_url=row.product_url, ingredients=row.ingredients_summary, labels=row.labels, barcode=row.barcode, added_at=row.added_at.isoformat())

@router.delete("/routine/{entry_id}", status_code=204)
def remove_product(entry_id: UUID, db: Session = Depends(get_db), user_id: UUID = Depends(get_current_user_id)):
    row = db.execute(select(UserProduct).where(UserProduct.id == entry_id, UserProduct.user_id == user_id)).scalars().first()
    if not row: raise MiraAPIError("NOT_FOUND", "Routine product not found.", 404)
    db.delete(row); db.commit(); routine_service.sync_optional_treatment_step(db, user_id)
