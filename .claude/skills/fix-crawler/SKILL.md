---
name: fix-crawler
description: 사이트 구조 변경으로 크롤러가 깨졌을 때 추출 키를 업데이트한다. 인자로 사이트명을 받는다. 예: /fix-crawler zigzag
---

`$ARGUMENTS` 크롤러의 추출 키를 업데이트한다.

## 순서

1. `backend/app/scraper/$ARGUMENTS.py` 읽기 — 현재 추출 키 파악
2. `backend/app/scraper/url.txt`에서 해당 사이트 URL 확인
3. Playwright로 페이지를 다시 fetch해서 변경된 구조 탐지
   - 기존 추출 방식(패턴 A/B/C)이 여전히 유효한지 확인
   - 유효하지 않으면 `CONVENTIONS.md`를 참고해 새 패턴으로 전환
4. 추출 키 업데이트
   - 기존 값 삭제 금지 — 리스트 뒤에 추가해 폴백 유지
   - 더 정확한 값은 앞에 추가
