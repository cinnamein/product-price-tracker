"""
제품 한 건의 크롤링 + DB 저장을 담당하는 서비스.
스케줄러와 API 양쪽에서 이 모듈을 호출한다.
"""
import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.models import Product, PriceHistory
from app.scraper import scrape_product_price

logger = logging.getLogger(__name__)

KST = timezone(timedelta(hours=9))


def scrape_and_save(product: Product, db: Session) -> bool:
    """
    제품 한 건을 크롤링하고 결과를 DB에 저장한다.
    성공하면 True, 실패하면 False를 반환한다.
    """
    has_meta = bool(product.name and product.brand and product.image_url)
    result = scrape_product_price(product.url, skip_meta=has_meta)

    if result is None:
        logger.warning(f"크롤링 실패: {product.url}")
        return False

    if not product.name and result.get("name"):
        product.name = result["name"]
    if not product.brand and result.get("brand"):
        product.brand = result["brand"]
    if not product.image_url and result.get("image_url"):
        product.image_url = result["image_url"]

    _upsert_price(db, product.id, result)
    return True


def _upsert_price(db: Session, product_id: int, result: dict):
    """가격 이력을 추가하되, 같은 시간(hour)에 이미 기록이 있으면 덮어쓴다."""
    now = datetime.now(KST).replace(tzinfo=None)
    hour_start = now.replace(minute=0, second=0, microsecond=0)
    hour_end = hour_start + timedelta(hours=1)

    existing = (
        db.query(PriceHistory)
        .filter(
            PriceHistory.product_id == product_id,
            PriceHistory.scraped_at >= hour_start,
            PriceHistory.scraped_at < hour_end,
        )
        .first()
    )

    if existing:
        existing.price = result["price"]
        existing.original_price = result.get("original_price")
        existing.discount_rate = result.get("discount_rate")
        existing.scraped_at = now
    else:
        db.add(PriceHistory(
            product_id=product_id,
            price=result["price"],
            original_price=result.get("original_price"),
            discount_rate=result.get("discount_rate"),
        ))
