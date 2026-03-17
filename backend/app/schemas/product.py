from datetime import datetime

from pydantic import BaseModel, HttpUrl


# ── 요청 ──
class ProductCreate(BaseModel):
    url: HttpUrl  # 올리브영 제품 URL


# ── 응답 ──
class PriceHistoryOut(BaseModel):
    price: float
    original_price: float | None = None
    discount_rate: int | None = None
    scraped_at: datetime

    model_config = {"from_attributes": True}


class ProductOut(BaseModel):
    id: int
    name: str | None = None
    url: str
    image_url: str | None = None
    brand: str | None = None
    latest_price: float | None = None
    previous_price: float | None = None
    first_price: float | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProductDetail(ProductOut):
    price_history: list[PriceHistoryOut] = []