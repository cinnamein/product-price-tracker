from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi import Query as QueryParam
from sqlalchemy.orm import Session, subqueryload

from app.database import get_db
from app.models import Product, PriceHistory
from app.schemas import ProductCreate, ProductOut, ProductDetail

router = APIRouter(prefix="/products", tags=["products"])

KST = timezone(timedelta(hours=9))


def _upsert_price(db: Session, product_id: int, result: dict):
    """
    가격 이력을 추가하되, 같은 시간(hour)에 이미 기록이 있으면 덮어쓴다.
    """
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
        # 같은 시간대 기록이 있으면 덮어쓰기
        existing.price = result["price"]
        existing.original_price = result.get("original_price")
        existing.discount_rate = result.get("discount_rate")
        existing.scraped_at = now
    else:
        # 없으면 새로 추가
        record = PriceHistory(
            product_id=product_id,
            price=result["price"],
            original_price=result.get("original_price"),
            discount_rate=result.get("discount_rate"),
        )
        db.add(record)


@router.post("/", response_model=ProductDetail, status_code=201)
def register_product(body: ProductCreate, db: Session = Depends(get_db)):
    """제품 URL을 등록하고, 즉시 첫 크롤링을 실행한다."""
    url_str = str(body.url)

    existing = db.query(Product).filter(Product.url == url_str).first()
    if existing:
        raise HTTPException(status_code=409, detail="이미 등록된 제품입니다.")

    product = Product(url=url_str)
    db.add(product)
    db.commit()
    db.refresh(product)

    from app.scraper.oliveyoung import scrape_product_price

    try:
        result = scrape_product_price(product.url)
        if result:
            if result.get("name"):
                product.name = result["name"]
            if result.get("brand"):
                product.brand = result["brand"]
            if result.get("image_url"):
                product.image_url = result["image_url"]

            _upsert_price(db, product.id, result)
            db.commit()
            db.refresh(product)
    except Exception as e:
        import logging
        logging.getLogger(__name__).warning(f"첫 크롤링 실패 (등록은 완료): {e}")

    return product


@router.get("/", response_model=list[ProductOut])
def list_products(
    q: str = QueryParam(default="", description="검색어 (제품명 또는 브랜드명)"),
    db: Session = Depends(get_db),
):
    """등록된 제품 목록을 반환한다. q 파라미터로 검색 가능."""
    query = db.query(Product).options(subqueryload(Product.price_history))

    if q.strip():
        keyword = f"%{q.strip()}%"
        query = query.filter(
            (Product.name.ilike(keyword)) | (Product.brand.ilike(keyword))
        )

    return query.all()


@router.get("/{product_id}", response_model=ProductDetail)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """제품 상세 정보 + 가격 이력을 반환한다."""
    product = (
        db.query(Product)
        .options(subqueryload(Product.price_history))
        .filter(Product.id == product_id)
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="제품을 찾을 수 없습니다.")
    return product


@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """제품과 관련 가격 이력을 모두 삭제한다."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="제품을 찾을 수 없습니다.")
    db.delete(product)
    db.commit()


@router.post("/{product_id}/scrape", response_model=ProductDetail)
def trigger_scrape(product_id: int, db: Session = Depends(get_db)):
    """수동으로 특정 제품의 가격을 즉시 크롤링한다."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="제품을 찾을 수 없습니다.")

    from app.scraper.oliveyoung import scrape_product_price

    has_meta = bool(product.name and product.brand and product.image_url)
    result = scrape_product_price(product.url, skip_meta=has_meta)
    if result is None:
        raise HTTPException(status_code=502, detail="크롤링에 실패했습니다.")

    if not product.name and result.get("name"):
        product.name = result["name"]
    if not product.brand and result.get("brand"):
        product.brand = result["brand"]
    if not product.image_url and result.get("image_url"):
        product.image_url = result["image_url"]

    _upsert_price(db, product.id, result)
    db.commit()
    db.refresh(product)
    return product