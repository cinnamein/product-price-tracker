# 코딩 컨벤션 (Coding Conventions)

## 레이어별 새 코드 위치

| 레이어 | 새 코드 추가 시 |
|--------|----------------|
| `models/` | 테이블/컬럼 변경 |
| `schemas/` | 요청/응답 구조 변경 |
| `api/` | 새 API 추가 |
| `scraper/` | 새 수집 대상 사이트 → 별도 파일 추가 |
| `scheduler/` | 수집 주기/조건 변경 |

---

## 크롤러 작성 규칙

### 파일 네이밍

- 파일명: `{사이트명}.py` (예: `oliveyoung.py`, `ably.py`)
- 파일 상단에 URL 패턴 정규식으로 사이트 판별 (`{사이트명}_URL_PATTERN`)

### __init__.py 등록

크롤러 생성 후 `__init__.py`의 `SCRAPERS` 리스트에 반드시 등록:

```python
from app.scraper.{사이트명} import scrape_product_price as _{사이트명}_scrape, {사이트명}_URL_PATTERN

SCRAPERS = [
    ...,
    ({사이트명}_URL_PATTERN, _{사이트명}_scrape),
]
```

### 셀렉터·키 수정 규칙

기존 값 삭제 금지 — 리스트 뒤에 추가해 폴백을 유지한다. 더 정확한 값은 앞에 추가한다.

### 추출 함수 폴백 체인

추출 방법은 항상 `_extract_from_meta()`를 마지막 fallback으로 유지한다.

---

## 데이터 로딩 패턴 탐지 및 크롤러 구조

Playwright로 페이지를 fetch한 후 아래 순서로 패턴을 판별한다.

**Playwright 로딩 설정 기준:**
- 패턴 A (SSG): `wait_until="domcontentloaded"` — `__NEXT_DATA__`는 초기 HTML에 포함됨
- 패턴 B (CSR/API): `wait_until="networkidle"` — API 호출이 페이지 로드 이후에 발생함
- 패턴 C (렌더링 HTML): `wait_until="networkidle"` — JS 렌더링 완료 후 셀렉터 탐색

> **반드시 구조 파악 단계에서 실제로 사용할 설정과 동일한 조건으로 테스트하고, 그 결과를 크롤러에 그대로 적용한다.**

### 패턴 A — `__NEXT_DATA__` (SSG/Next.js)

**판별 조건:** `<script id="__NEXT_DATA__">` 안에 실제 상품 데이터(가격·이름 등)가 있음

**크롤러 구조:**
```python
NEXT_DATA_KEYS = {
    "price":          [...],  # JSON 키 후보, 우선순위 순
    "original_price": [...],
    "discount_rate":  [...],
    "name":           [...],
    "brand":          [...],
    "image_url":      [...],
}
```

폴백 순서: `_extract_from_next_data()` → `_extract_from_rendered_html()` → `_extract_from_meta()`

---

### 패턴 B — 클라이언트 API (CSR/Next.js)

**판별 조건:** `__NEXT_DATA__`가 비어 있고, 네트워크에 JSON을 반환하는 API 호출이 발생

**탐지 방법:** 모든 JSON 응답을 수집해 가격·이름 필드가 있는 엔드포인트를 찾는다.

**크롤러 구조:**
```python
API_ENDPOINT_PATTERN = "..."  # 인터셉트할 URL 패턴 (예: "api.example.com/v3/goods/")

API_KEYS = {
    "price":          "price_info.thumbnail_price",  # 응답 JSON 키 경로
    "original_price": "price_info.consumer",
    "discount_rate":  "price_info.discount_rate",
    "name":           "goods.name",
    "brand":          "market.name",
    "image_url":      "cover_images[0]",
}
```

폴백 순서: `_parse_api_response()` → `_extract_from_rendered_html()` → `_extract_from_meta()`

---

### 패턴 C — 렌더링 HTML (CSS 셀렉터)

**판별 조건:** 패턴 A, B 모두 해당 없음

**크롤러 구조:**
```python
SELECTORS = {
    "price":          [...],  # CSS 셀렉터 후보, 우선순위 순
    "original_price": [...],
    "discount_rate":  [...],
    "name":           [...],
    "brand":          [...],
    "image_url":      [...],
}
```

폴백 순서: `_extract_from_rendered_html()` → `_extract_from_meta()`
