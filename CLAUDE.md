# Product Price Tracker — AI 하네스

## 실행 명령어

```bash
# 전체 스택 실행 (백엔드 + 프론트엔드 + nginx)
docker compose up -d

# 로그 확인
docker compose logs -f backend

# 재빌드 (코드 변경 후)
docker compose up -d --build
```

---

## 크롤러 관리

### gitignore 정책

악용 방지를 위해 아래 파일은 `.gitignore` 처리된다. 클론 후 직접 생성해야 한다.

```
backend/app/scraper/__init__.py # URL → 크롤러 라우터
backend/app/scraper/url.txt # 수집 대상 URL 목록
backend/app/scraper/{사이트명}.py # 사이트별 크롤러
```

`backend/app/scraper/service.py`는 커밋 대상이므로 클론 후 존재한다.

### 신규 사이트 추가

`/add-crawler` 스킬 사용.

### 크롤러 깨짐 (사이트 구조 변경)

`/fix-crawler {사이트명}` 스킬 사용.

> **주의:** `scraper/` 파일은 `.gitignore` 대상이므로 Glob으로 탐색되지 않는다.
> 크롤러 작업 전 반드시 `ls backend/app/scraper/`로 실제 파일 목록을 확인한다.

---

## 커밋 컨벤션

형식: `type: 한국어 설명`

| type | 용도 |
|------|------|
| feat | 새 기능 |
| fix | 버그 수정 |
| refactor | 동작 변화 없는 코드 개선 |
| docs | 문서, README |
| chore | 설정, 의존성, 빌드 |
| style | 포맷, 오탈자 (로직 변경 없음) |

**규칙:**
- 설명은 한국어
- `scraper/` 파일은 커밋 대상 아님 (gitignore 정책)
