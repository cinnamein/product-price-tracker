from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "OliveYoung Price Tracker"
    DATABASE_URL: str = "sqlite:///./price_tracker.db"
    # 크롤링 간격 (분 단위)
    SCRAPE_INTERVAL_MINUTES: int = 60

    class Config:
        env_file = ".env"


settings = Settings()