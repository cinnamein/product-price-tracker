"""
등록된 모든 제품의 가격을 주기적으로 수집하는 스케줄러.
APScheduler를 사용하여 매시 1분에 크롤링을 실행한다.
"""
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.database import SessionLocal
from app.models import Product, PriceHistory
from app.scraper.oliveyoung import scrape_product_price

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler()


def scrape_all_products():
    """등록된 모든 제품의 가격을 크롤링한다."""
    db = SessionLocal()
    try:
        products = db.query(Product).all()
        if not products:
            logger.info("등록된 제품이 없습니다. 스킵합니다.")
            return

        logger.info(f"스케줄 크롤링 시작: {len(products)}개 제품")
        success_count = 0
        fail_count = 0

        for product in products:
            try:
                # 이름/브랜드/이미지가 이미 있으면 메타 수집 건너뛰기
                has_meta = bool(product.name and product.brand and product.image_url)
                result = scrape_product_price(product.url, skip_meta=has_meta)
                if result is None:
                    fail_count += 1
                    logger.warning(f"크롤링 실패: {product.url}")
                    continue

                # 제품 메타 정보 업데이트 (비어있을 때만)
                if not product.name and result.get("name"):
                    product.name = result["name"]
                if not product.brand and result.get("brand"):
                    product.brand = result["brand"]
                if not product.image_url and result.get("image_url"):
                    product.image_url = result["image_url"]

                # 가격 이력 추가 (같은 시간대면 덮어쓰기)
                from app.api.products import _upsert_price
                _upsert_price(db, product.id, result)
                success_count += 1

            except Exception as e:
                fail_count += 1
                logger.error(f"제품 크롤링 중 오류 ({product.url}): {e}")

        db.commit()
        logger.info(
            f"스케줄 크롤링 완료: 성공 {success_count}, 실패 {fail_count}"
        )

    except Exception as e:
        logger.error(f"스케줄 크롤링 전체 오류: {e}")
        db.rollback()
    finally:
        db.close()


def start_scheduler():
    """스케줄러를 시작한다. 매시 1분(xx:01)에 실행."""
    if scheduler.running:
        logger.info("스케줄러가 이미 실행 중입니다.")
        return

    scheduler.add_job(
        scrape_all_products,
        trigger=CronTrigger(minute=1),  # 매시 1분 (0시 1분, 1시 1분, ...)
        id="scrape_all_products",
        name="모든 제품 가격 크롤링",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("스케줄러 시작: 매시 1분(xx:01)에 자동 크롤링")


def stop_scheduler():
    """스케줄러를 정지한다."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("스케줄러 정지")