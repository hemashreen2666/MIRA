"""Open Beauty Facts client and non-medical category mapping.

Only text search terms leave MIRA. Face frames and scores never leave this module.
"""
from __future__ import annotations
from dataclasses import dataclass
from urllib.parse import quote
import httpx

from app.core.logging import get_logger

logger = get_logger(__name__)
OBF_BASE = "https://world.openbeautyfacts.org"
FIELDS = "code,product_name,brands,categories,ingredients_text,labels,image_front_url,url"
TIMEOUT = 6.0

STEP_BY_CATEGORY = {
    "CLEANSER": "CLEANSE", "TONER": "HYDRATE", "ESSENCE": "HYDRATE", "HYDRATING_SERUM": "HYDRATE",
    "TREATMENT": "TREATMENT", "ACNE_TREATMENT": "TREATMENT", "SPOT_TREATMENT": "TREATMENT", "FACE_MASK": "TREATMENT",
    "MOISTURIZER": "MOISTURIZE", "FACE_CREAM": "MOISTURIZE", "SUNSCREEN": "SUN_PROTECTION", "EYE_CREAM": "TREATMENT",
}

def normalize_category(value: str, ingredients: str = "") -> str:
    text = f"{value} {ingredients}".lower()
    if any(x in text for x in ("sunscreen", "sun protection", "spf")): return "SUNSCREEN"
    if "cleanser" in text or "cleansing" in text or "face wash" in text: return "CLEANSER"
    if "spot" in text: return "SPOT_TREATMENT"
    if "acne" in text or "blemish" in text or "salicylic" in text: return "ACNE_TREATMENT"
    if "eye" in text or "under eye" in text: return "EYE_CREAM"
    if "mask" in text: return "FACE_MASK"
    if "toner" in text: return "TONER"
    if "essence" in text: return "ESSENCE"
    if "serum" in text: return "HYDRATING_SERUM" if any(x in text for x in ("hyaluronic", "glycerin", "hydrat")) else "TREATMENT"
    if "cream" in text: return "FACE_CREAM"
    return "MOISTURIZER"

def routine_step_for(category: str) -> str:
    return STEP_BY_CATEGORY.get(category, "MOISTURIZE")

def _item(raw: dict, why: str | None = None) -> dict | None:
    name = (raw.get("product_name") or "").strip()
    code = str(raw.get("code") or "").strip()
    if not name or not code: return None
    ingredients = (raw.get("ingredients_text") or "").strip() or None
    category = normalize_category(raw.get("categories") or "", ingredients or "")
    return {"product_id": code, "name": name, "brand": (raw.get("brands") or "").strip() or None,
            "category": category, "routine_step": routine_step_for(category), "image_url": raw.get("image_front_url"),
            "product_url": raw.get("url") or f"{OBF_BASE}/product/{quote(code)}", "ingredients": ingredients,
            "labels": (raw.get("labels") or "").strip() or None, "barcode": code, "why": why}

async def search_products(query: str, limit: int = 8, why: str | None = None) -> list[dict]:
    # Official Product Opener API, using Open Beauty Facts' documented instance URL.
    params = {"search_terms": query, "page_size": min(max(limit, 1), 20), "fields": FIELDS, "json": 1}
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT, headers={"User-Agent": "MIRA/1.0 (privacy-first cosmetic recommendations)"}) as client:
            response = await client.get(f"{OBF_BASE}/cgi/search.pl", params=params)
            response.raise_for_status()
            payload = response.json()
    except (httpx.HTTPError, ValueError) as exc:
        logger.warning("Open Beauty Facts search unavailable: %s", exc)
        raise RuntimeError("Product recommendations are temporarily unavailable. Please try again.") from exc
    products = payload.get("products") if isinstance(payload, dict) else []
    if not isinstance(products, list): return []
    output, seen = [], set()
    for raw in products:
        if not isinstance(raw, dict): continue
        parsed = _item(raw, why)
        if parsed and parsed["product_id"] not in seen:
            seen.add(parsed["product_id"]); output.append(parsed)
    return output

def recommendation_queries(analysis) -> tuple[str, list[tuple[str, str]]]:
    # Scores are documented 0-100 visible-feature levels; named thresholds stay easy to tune.
    queries = [("sunscreen SPF", "Recommended as a daily sun-protection product.")]
    summary = "Based on your visible skin features, these cosmetic products may be relevant."
    if analysis.acne_level >= 45:
        queries.insert(0, ("salicylic acid cleanser", "Recommended because MIRA detected a higher level of visible acne-like spots."))
    if analysis.redness_level >= 40:
        queries.append(("gentle soothing moisturizer", "Recommended because MIRA detected elevated visible redness."))
    if analysis.oily_appearance_level >= 40:
        queries.append(("oil control lightweight moisturizer", "Recommended because MIRA detected increased oily appearance."))
    if analysis.dark_circles_level >= 45:
        queries.append(("eye cream", "Recommended because MIRA detected elevated visible under-eye darkness."))
    # The existing analyzer has no hydration field; low brightness is the closest established cosmetic proxy.
    if analysis.facial_brightness_level < 45:
        queries.append(("hyaluronic acid hydrating serum", "Recommended because your analysis indicates lower hydration."))
    return summary, queries[:5]
