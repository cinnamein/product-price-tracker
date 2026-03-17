"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProduct, triggerScrape, ProductDetail } from "@/lib/api";
import { formatPrice, formatDate } from "@/lib/format";
import PriceChart from "@/components/PriceChart";

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);

  useEffect(() => {
    if (!id) return;
    getProduct(id)
      .then(setProduct)
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleScrape = async () => {
    setScraping(true);
    try {
      setProduct(await triggerScrape(id));
    } catch (err: any) {
      alert(err.response?.data?.detail || "수집 실패");
    } finally {
      setScraping(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            border: "2px solid #e5e8eb",
            borderTopColor: "#191f28",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    );
  }

  if (!product) return null;

  const h = product.price_history;
  const cur = h.length > 0 ? h[h.length - 1] : null;
  const first = h.length > 0 ? h[0] : null;
  const diff = cur && first ? cur.price - first.price : 0;
  const pct =
    first && first.price > 0
      ? ((diff / first.price) * 100).toFixed(2)
      : "0.00";
  const sign = diff > 0 ? "+" : "";
  const diffColor = diff > 0 ? "#f04452" : diff < 0 ? "#3182f6" : "#8b95a1";

  const prices = h.map((x) => x.price);
  const lo = prices.length ? Math.min(...prices) : 0;
  const hi = prices.length ? Math.max(...prices) : 0;

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* 네비바 */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          background: "#fff",
          height: 48,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          borderBottom: "1px solid #f2f4f6",
        }}
      >
        <button
          onClick={() => router.push("/")}
          style={{
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            background: "transparent",
            fontSize: 22,
            color: "#4e5968",
            cursor: "pointer",
            marginLeft: -4,
          }}
        >
          ‹
        </button>
        <span
          style={{
            flex: 1,
            textAlign: "center",
            fontSize: 15,
            fontWeight: 600,
            color: "#191f28",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            padding: "0 16px",
          }}
        >
          {product.name || "제품 상세"}
        </span>
        <button
          onClick={handleScrape}
          disabled={scraping}
          style={{
            border: "none",
            background: "transparent",
            fontSize: 13,
            fontWeight: 500,
            color: "#3182f6",
            cursor: "pointer",
            opacity: scraping ? 0.4 : 1,
          }}
        >
          {scraping ? "수집중" : "새로고침"}
        </button>
      </div>

      {/* 브랜드 + 제품명 + 이미지 */}
      <div style={{ padding: "20px 20px 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {product.image_url && (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                overflow: "hidden",
                background: "#f2f4f6",
                flexShrink: 0,
              }}
            >
              <img
                src={product.image_url}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 13, color: "#8b95a1", lineHeight: 1 }}>
              {product.brand || "올리브영"}
            </p>
            <p
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "#191f28",
                marginTop: 4,
                lineHeight: 1.4,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical" as any,
                overflow: "hidden",
              }}
            >
              {product.name || "제품명 미확인"}
            </p>
          </div>
        </div>
      </div>

      {/* 현재가 */}
      <div style={{ padding: "16px 20px 20px" }}>
        {cur ? (
          <>
            <p
              className="num"
              style={{
                fontSize: 34,
                fontWeight: 700,
                color: "#191f28",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {formatPrice(cur.price)}
            </p>
            <p
              className="num"
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: diffColor,
                marginTop: 8,
              }}
            >
              {sign}
              {formatPrice(Math.abs(diff))} ({sign}
              {pct}%)
              <span
                style={{
                  color: "#b0b8c1",
                  fontWeight: 400,
                  marginLeft: 6,
                  fontSize: 12,
                }}
              >
                등록 이후
              </span>
            </p>
          </>
        ) : (
          <p style={{ fontSize: 20, color: "#b0b8c1" }}>가격 미수집</p>
        )}
      </div>

      {/* 차트 */}
      <div style={{ padding: "0 12px" }}>
        <PriceChart data={h} height={240} />
      </div>

      {/* 구분선 */}
      <div style={{ height: 8, background: "#f2f4f6", marginTop: 16 }} />

      {/* 가격 정보 */}
      <div style={{ padding: "20px 20px" }}>
        <p
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#191f28",
            marginBottom: 16,
          }}
        >
          가격 정보
        </p>
        <InfoRow
          label="정가"
          value={cur?.original_price ? formatPrice(cur.original_price) : "—"}
        />
        <InfoRow
          label="할인율"
          value={cur?.discount_rate ? `${cur.discount_rate}%` : "—"}
          color="#f04452"
        />
        <InfoRow
          label="추적 최저"
          value={lo > 0 ? formatPrice(lo) : "—"}
          color="#3182f6"
        />
        <InfoRow
          label="추적 최고"
          value={hi > 0 ? formatPrice(hi) : "—"}
          color="#f04452"
        />
        <InfoRow label="수집 횟수" value={`${h.length}회`} />
      </div>

      {/* 구분선 */}
      <div style={{ height: 8, background: "#f2f4f6" }} />

      {/* 수집 이력 */}
      <div style={{ padding: "20px 20px" }}>
        <p
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: "#191f28",
            marginBottom: 16,
          }}
        >
          수집 이력
        </p>
        {h.length === 0 ? (
          <p
            style={{
              fontSize: 13,
              color: "#b0b8c1",
              padding: "24px 0",
              textAlign: "center",
            }}
          >
            수집된 데이터가 없습니다
          </p>
        ) : (
          [...h].reverse().map((item, i) => {
            const prev = [...h].reverse()[i + 1];
            const d = prev ? item.price - prev.price : 0;
            const dc =
              d > 0 ? "#f04452" : d < 0 ? "#3182f6" : "transparent";
            return (
              <div
                key={item.scraped_at}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "11px 0",
                  borderBottom: "1px solid #f2f4f6",
                }}
              >
                <span style={{ fontSize: 13, color: "#8b95a1" }}>
                  {formatDate(item.scraped_at)}
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span
                    className="num"
                    style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#191f28",
                    }}
                  >
                    {formatPrice(item.price)}
                  </span>
                  {d !== 0 && (
                    <span
                      className="num"
                      style={{ fontSize: 11, color: dc }}
                    >
                      {d > 0 ? "▲" : "▼"} {Math.abs(d).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 올리브영 링크 */}
      <div style={{ padding: "8px 20px 0" }}>
        <a
          href={product.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: 48,
            borderRadius: 16,
            background: "#f2f4f6",
            fontSize: 14,
            fontWeight: 500,
            color: "#4e5968",
            textDecoration: "none",
          }}
        >
          올리브영에서 보기 →
        </a>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  color = "#191f28",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "11px 0",
        borderBottom: "1px solid #f2f4f6",
      }}
    >
      <span style={{ fontSize: 13, color: "#8b95a1" }}>{label}</span>
      <span className="num" style={{ fontSize: 14, fontWeight: 500, color }}>
        {value}
      </span>
    </div>
  );
}
