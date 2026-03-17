from datetime import datetime, timezone, timedelta

from sqlalchemy import String, Integer, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

KST = timezone(timedelta(hours=9))


def _now_kst():
    return datetime.now(KST).replace(tzinfo=None)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(255), nullable=True)
    url: Mapped[str] = mapped_column(Text, unique=True, nullable=False)
    image_url: Mapped[str | None] = mapped_column(Text, nullable=True)
    brand: Mapped[str | None] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now_kst)

    # 가격 이력 관계
    price_history: Mapped[list["PriceHistory"]] = relationship(
        back_populates="product", cascade="all, delete-orphan", order_by="PriceHistory.scraped_at"
    )

    @property
    def latest_price(self) -> float | None:
        if self.price_history:
            return self.price_history[-1].price
        return None

    @property
    def previous_price(self) -> float | None:
        """직전 수집 가격."""
        if len(self.price_history) >= 2:
            return self.price_history[-2].price
        return None

    @property
    def first_price(self) -> float | None:
        """최초 수집 가격. 등락 비교 기준."""
        if self.price_history:
            return self.price_history[0].price
        return None


class PriceHistory(Base):
    __tablename__ = "price_history"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    product_id: Mapped[int] = mapped_column(Integer, ForeignKey("products.id"), nullable=False)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    original_price: Mapped[float | None] = mapped_column(Float, nullable=True)  # 정가 (할인 전)
    discount_rate: Mapped[int | None] = mapped_column(Integer, nullable=True)   # 할인율 (%)
    scraped_at: Mapped[datetime] = mapped_column(DateTime, default=_now_kst)

    product: Mapped["Product"] = relationship(back_populates="price_history")