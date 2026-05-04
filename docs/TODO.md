# TODO

Phase 별 우선순위 (P0 / P1 / P2 / P3).

---

## P0 (즉시)

- [ ] **다음 라운드 결정** — 시트 뷰 / 사람 확정 UI / LLM 하이브리드 ([NEXT-ACTION.md](../NEXT-ACTION.md) "다음 행동" 참조)

---

## P1 (Phase 1 본격)

- [ ] **Import flow Step 1·1.5·2·3 정식 구현** ([specs/flowdb-import-flow-spec.md](specs/flowdb-import-flow-spec.md))
  - PoC 파서 (`lib/parsers/txt-block-parser.ts`) 재사용
  - `app/txt-poc/` 페이지 제거
  - `.csv .xlsx .xls .tsv` + `.txt` 분기
- [ ] **BaaS 결정** — Supabase vs bkend.ai ([01-baas-decision.md](01-baas-decision.md))
- [ ] **카테고리 인라인 편집** (사람 확정 UI) — spec §0 원칙 적용 (옵션 B)
- [ ] **데이터 섹션 시트 뷰** — 셀 인라인 편집 + 키보드 네비게이션 (옵션 A)
- [ ] **디스플레이 자동 추천 원칙 spec에 박기** — 옵션 A와 묶어 처리

---

## P2 (Phase 1 후반)

- [ ] **LLM 하이브리드 카테고리 분류** — "기타" 보강 (옵션 C, 옵션 B 선결)
- [ ] **인코딩 자동 감지** (UTF-8 / EUC-KR / CP949)
- [ ] **AI 추천 카드 — 새 컬럼 후보** (chartdb의 "AI ER Diagram Generator" 패턴 참고)
- [ ] **DBML export** — chartdb.io 연동 (선택)
- [ ] **차트 (요약 대시보드)** 별도 영역

---

## P3 (Phase 2+)

- [ ] **워크스페이스 W11**: 진짜 분리, 개인 워크스페이스 자동 생성 ([02-v01-backlog.md:99](02-v01-backlog.md))
- [ ] **멤버 초대 + 권한 모델** (Owner/Admin/Viewer)
- [ ] **타임라인/캘린더 디스플레이** (일정 컬럼 있는 테이블)
- [ ] **갤러리 디스플레이** (첨부 컬럼 도입 후)
- [ ] **Realtime collab on import preview** ([spec §367](specs/flowdb-import-flow-spec.md))

---

## 완료

- [x] **PR #1** (2026-05-04): txt 블록 자동 분류 PoC + 머지
- [x] 글로벌 명령어 강화 (after-work / before-work)
- [x] Docs bootstrap (`docs/{SESSION-LOG,MEMORY,CONTEXT,TODO}.md`)
- [x] Claude Design 앱 → FlowDB 3 섹션 이식
- [x] shadcn/ui 디자인 시스템
- [x] v0.1 코드 감사 + 백로그 분류 (🟢 24 / 🟡 13 / 🔴 1)
- [x] GitHub repo 분리 + 첫 푸시 (peterkwon248/flowdb)
- [x] 4개 기획 문서 작성 (docs/00~02 + spec)
