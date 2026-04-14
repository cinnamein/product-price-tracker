---
name: add-crawler
description: url.txt에 새 URL을 추가하고 해당 사이트의 크롤러를 생성한다.
---

새 사이트 크롤러를 생성한다. 아래 4단계를 반드시 순서대로 따른다.

## 4단계 고정 순서

### 1단계 — URL 확인
- `backend/app/scraper/url.txt`를 읽어 대상 URL 확인
- `ls backend/app/scraper/`로 기존 크롤러 목록 확인
- **url.txt에 있는 사이트 중 크롤러가 없는 것만** 생성한다

### 2단계 — robots.txt 확인
- 대상 사이트의 `robots.txt`를 fetch해서 크롤링 허용 여부 확인
- 허용되지 않은 경로가 포함된 경우 사용자에게 고지하고 크롤러 생성을 중단한다

### 3단계 — 구조 파악
- Playwright로 페이지를 fetch해서 데이터 로딩 패턴 탐지
- `CONVENTIONS.md`의 패턴 판별 순서(A → B → C)를 따른다
- 반드시 실제로 사용할 설정과 동일한 조건으로 테스트한다

### 4단계 — 크롤러 작성
- 탐지된 패턴에 맞는 추출 방식으로 `{사이트명}.py` 생성
- `__init__.py`의 `SCRAPERS` 리스트에 등록
- Playwright headless를 봇으로 탐지해 차단하는 사이트는 제외한다
