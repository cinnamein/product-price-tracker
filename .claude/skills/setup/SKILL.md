---
name: setup
description: 프로젝트 클론 후 초기 세팅. url.txt 생성 및 첫 크롤러 구성을 안내한다.
---

프로젝트를 처음 클론한 사용자를 위한 초기 세팅을 진행한다.

## 순서

1. `ls backend/app/scraper/`로 현재 파일 목록 확인
2. `url.txt`가 없으면 생성 안내:
   - `backend/app/scraper/url.txt` 파일을 만들고 수집할 상품 페이지 URL을 한 줄씩 입력하도록 안내한다.
   - 사용자가 URL을 입력할 때까지 기다린다.
3. URL이 준비되면 `/add-crawler` 스킬로 크롤러 생성을 이어서 진행한다.
4. 완료 후 `docker compose up -d` 실행 안내
