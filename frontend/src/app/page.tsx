"use client";

import { useEffect, useState, useMemo } from "react";
import { getProducts, registerProduct, deleteProduct, triggerScrape, Product } from "@/lib/api";
import { formatPrice } from "@/lib/format";
import { useRouter } from "next/navigation";

type SortKey = "name_asc" | "name_desc" | "price_asc" | "price_desc";

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name_asc");

  const fetchProducts = async (q: string = "") => {
    try {
      setProducts(await getProducts(q));
    } catch {}
  };

  const handleRefreshAll = async () => {
    setRefreshing(true);
    setRefreshProgress(0);
    for (let i = 0; i < products.length; i++) {
      try {
        await triggerScrape(products[i].id);
      } catch {}
      setRefreshProgress(i + 1);
    }
    await fetchProducts(searchQuery);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleRegister = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError("");
    try {
      await registerProduct(url.trim());
      setUrl("");
      setShowInput(false);
      await fetchProducts(searchQuery);
    } catch (err: any) {
      setError(err.response?.data?.detail || "등록에 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm("삭제할까요?")) return;
    await deleteProduct(id);
    await fetchProducts(searchQuery);
  };

  // 정렬 적용
  const sorted = useMemo(() => {
    const list = [...products];
    switch (sortKey) {
      case "name_asc":
        return list.sort((a, b) => (a.name || "").localeCompare(b.name || "", "ko"));
      case "name_desc":
        return list.sort((a, b) => (b.name || "").localeCompare(a.name || "", "ko"));
      case "price_asc":
        return list.sort((a, b) => (a.latest_price || 0) - (b.latest_price || 0));
      case "price_desc":
        return list.sort((a, b) => (b.latest_price || 0) - (a.latest_price || 0));
      default:
        return list;
    }
  }, [products, sortKey]);

  return (
    <div style={{ paddingBottom: 40 }}>
      {/* 헤더 — 전체 새로고침을 오른쪽 상단에 배치 */}
      <div
        style={{
          padding: "52px 20px 8px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#191f28",
              letterSpacing: "-0.02em",
            }}
          >
            제품 시세
          </h1>
          <p style={{ fontSize: 13, color: "#8b95a1", marginTop: 4 }}>
            올리브영 제품의 가격 변동을 추적합니다
          </p>
        </div>
        {products.length > 0 && (
          <button
            onClick={handleRefreshAll}
            disabled={refreshing}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 13,
              fontWeight: 500,
              color: refreshing ? "#b0b8c1" : "#3182f6",
              cursor: refreshing ? "default" : "pointer",
              padding: "4px 0",
              whiteSpace: "nowrap",
              marginTop: 4,
            }}
          >
            {refreshing
              ? `수집 중 (${refreshProgress}/${products.length})`
              : "전체 새로고침"}
          </button>
        )}
      </div>

      {/* 등록 */}
      <div style={{ padding: "12px 20px" }}>
        {showInput ? (
          <div style={{ background: "#f2f4f6", borderRadius: 16, padding: 16 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#4e5968", marginBottom: 10 }}>
              올리브영 제품 URL
            </p>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRegister()}
              placeholder="https://www.oliveyoung.co.kr/..."
              autoFocus
              style={{
                width: "100%",
                height: 44,
                padding: "0 16px",
                background: "#fff",
                borderRadius: 12,
                border: "1px solid #e5e8eb",
                fontSize: 14,
                color: "#191f28",
                outline: "none",
              }}
            />
            {error && (
              <p style={{ fontSize: 12, color: "#f04452", marginTop: 8 }}>{error}</p>
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={() => { setShowInput(false); setUrl(""); setError(""); }}
                style={{
                  flex: 1, height: 42, borderRadius: 12,
                  border: "1px solid #e5e8eb", background: "#fff",
                  fontSize: 14, fontWeight: 500, color: "#8b95a1", cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                onClick={handleRegister}
                disabled={loading || !url.trim()}
                style={{
                  flex: 1, height: 42, borderRadius: 12,
                  border: "none", background: "#fee500",
                  fontSize: 14, fontWeight: 600, color: "#191f28",
                  cursor: "pointer", opacity: loading || !url.trim() ? 0.4 : 1,
                }}
              >
                {loading ? "등록 중..." : "등록하기"}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowInput(true)}
            style={{
              width: "100%", height: 44, background: "#f2f4f6",
              borderRadius: 16, border: "none", fontSize: 14,
              color: "#8b95a1", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
            제품 추가
          </button>
        )}
      </div>

      {/* 검색 바 */}
      <div style={{ padding: "0 20px 4px" }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            fetchProducts(e.target.value);
          }}
          placeholder="제품명 또는 브랜드로 검색"
          style={{
            width: "100%", height: 40, padding: "0 14px",
            background: "#f2f4f6", borderRadius: 12,
            border: "none", fontSize: 13, color: "#191f28", outline: "none",
          }}
        />
      </div>

      {/* 리스트 헤더 — 개수 + 정렬 드롭박스 */}
      <div
        style={{
          padding: "16px 20px 8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: "#8b95a1" }}>
          추적 중 {products.length}개
        </span>
        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          style={{
            border: "none",
            background: "transparent",
            fontSize: 12,
            color: "#8b95a1",
            cursor: "pointer",
            outline: "none",
            padding: "2px 0",
          }}
        >
          <option value="name_asc">제품명 오름차순</option>
          <option value="name_desc">제품명 내림차순</option>
          <option value="price_asc">가격 낮은순</option>
          <option value="price_desc">가격 높은순</option>
        </select>
      </div>

      {/* 제품 리스트 */}
      {sorted.length === 0 ? (
        <div style={{ padding: "60px 20px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#b0b8c1" }}>
            {searchQuery ? "검색 결과가 없어요" : "추적 중인 제품이 없어요"}
          </p>
        </div>
      ) : (
        <div style={{ padding: "0 20px" }}>
          {sorted.map((product, i) => {
            const diff =
              product.first_price != null &&
              product.latest_price != null &&
              product.first_price > 0
                ? product.latest_price - product.first_price
                : 0;
            const isUp = diff > 0;
            const isDown = diff < 0;
            const priceColor = isUp
              ? "#f04452"
              : isDown
                ? "#3182f6"
                : "#191f28";

            return (
              <div
                key={product.id}
                onClick={() => router.push(`/products/${product.id}`)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 0",
                  borderBottom:
                    i < sorted.length - 1 ? "1px solid #f2f4f6" : "none",
                  cursor: "pointer",
                }}
              >
                {/* 썸네일 */}
                <div
                  style={{
                    width: 42, height: 42, borderRadius: 10,
                    background: "#f2f4f6", flexShrink: 0, overflow: "hidden",
                  }}
                >
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%", height: "100%",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 16, color: "#d1d6db",
                      }}
                    >
                      ●
                    </div>
                  )}
                </div>

                {/* 정보 */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 15, fontWeight: 500, color: "#191f28",
                      overflow: "hidden", textOverflow: "ellipsis",
                      whiteSpace: "nowrap", lineHeight: 1.3,
                    }}
                  >
                    {product.name || "크롤링 대기 중"}
                  </p>
                  <p style={{ fontSize: 12, color: "#b0b8c1", marginTop: 2 }}>
                    {product.brand || ""}
                  </p>
                </div>

                {/* 가격 + 등락 + 삭제 */}
                <div
                  style={{
                    display: "flex", alignItems: "center",
                    gap: 8, flexShrink: 0,
                  }}
                >
                  {product.latest_price ? (
                    <div style={{ textAlign: "right" }}>
                      <span
                        className="num"
                        style={{ fontSize: 15, fontWeight: 600, color: priceColor }}
                      >
                        {formatPrice(product.latest_price)}
                      </span>
                      {diff !== 0 && (
                        <p
                          className="num"
                          style={{ fontSize: 11, color: priceColor, marginTop: 2 }}
                        >
                          {isUp ? "▲" : "▼"} {Math.abs(diff).toLocaleString()}원
                        </p>
                      )}
                    </div>
                  ) : (
                    <span style={{ fontSize: 13, color: "#d1d6db" }}>—</span>
                  )}
                  <button
                    onClick={(e) => handleDelete(e, product.id)}
                    style={{
                      width: 28, height: 28,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      border: "none", background: "transparent",
                      color: "#d1d6db", fontSize: 12,
                      cursor: "pointer", borderRadius: "50%",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
