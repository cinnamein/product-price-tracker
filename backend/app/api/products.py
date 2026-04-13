from fastapi import APIRouter, Depends, HTTPException
from fastapi import Query as QueryParam
from sqlalchemy.orm import Session, subqueryload

from app.database import get_db
from app.models import Product
from app.schemas import ProductCreate, ProductOut, ProductDetail
from app.scraper.service import scrape_and_save

router = APIRouter(prefix="/products", tags=["products"])


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

    try:
        scrape_and_save(product, db)
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

    success = scrape_and_save(product, db)
    if not success:
        raise HTTPException(status_code=502, detail="크롤링에 실패했습니다.")

    db.commit()
    db.refresh(product)
    return product