"""
등록된 모든 제품의 가격을 주기적으로 수집하는 스케줄러.
APScheduler를 사용하여 매시 1분에 크롤링을 실행한다.
"""
import logging

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.database import SessionLocal
from app.models import Product
from app.scraper.service import scrape_and_save

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
        success_count = sum(scrape_and_save(p, db) for p in products)
        db.commit()
        logger.info(f"스케줄 크롤링 완료: 성공 {success_count}, 실패 {len(products) - success_count}")

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
        trigger=CronTrigger(minute=1),
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
