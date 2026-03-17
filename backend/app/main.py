from contextlib import asynccontextmanager
import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.api import products_router
from app.scheduler import start_scheduler, stop_scheduler

# 로깅 설정 — 콘솔에서 크롤링 과정을 확인할 수 있도록
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 시작 시: 테이블 생성 + 스케줄러 가동
    Base.metadata.create_all(bind=engine)
    start_scheduler()
    logging.getLogger(__name__).info("서버 시작 완료 — 스케줄러 가동 중 (1시간 간격)")
    yield
    # 종료 시: 스케줄러 정지
    try:
        stop_scheduler()
    except Exception:
        pass


app = FastAPI(
    title=settings.APP_NAME,
    lifespan=lifespan,
)

# CORS 설정 (Next.js 개발 서버 허용)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(products_router, prefix="/api")


@app.get("/health")
def health_check():
    return {"status": "ok"}