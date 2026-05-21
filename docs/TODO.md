# TODO

Phase 별 우선순위 (P0 / P1 / P2 / P3).

---

## P0 (즉시)

- [ ] **🚨 커밋 + 푸시** — Phase 1B·2·3 작업물이 `feat/sheet-view-v2`에 미커밋·origin 미push. git 식별자 설정 후 커밋·푸시 ([NEXT-ACTION.md](../NEXT-ACTION.md)).
- [ ] **FlowBase V2 Phase 4 — Kanban + Dashboard** — `components/board/view-switcher` · `components/sections/kanban-view` · `components/charts/*` + `dashboard-view` ([01-plan/features/flowbase-v2.plan.md §8](01-plan/features/flowbase-v2.plan.md))

> P1~P3의 import/BaaS/시트 등은 V2 7단계 계획으로 재편됨 — 시트=Phase 1B✅, AI=Phase 2✅, Import=Phase 3✅, Kanban/Dashboard=Phase 4, BaaS=Phase 7.

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

- [ ] **워크스페이스 W11 — 진짜 분리** (mock UX는 PR #4로 추가됨, 백엔드 분리/개인 워크스페이스 자동 생성 미구현, [02-v01-backlog.md:99](02-v01-backlog.md))
- [ ] **멤버 초대 + 권한 모델** (Owner/Admin/Viewer)
- [ ] **Trash 백엔드** (mock UX는 PR #4로 추가됨, 30일 rollback 백스톱 미구현)
- [ ] **타임라인/캘린더 디스플레이** (일정 컬럼 있는 테이블)
- [ ] **갤러리 디스플레이** (첨부 컬럼 도입 후)
- [ ] **Realtime collab on import preview** ([spec §367](specs/flowdb-import-flow-spec.md))

---

## 완료

- [x] **FlowBase V2 Phase 1B·2·3** (2026-05-21 — ⚠️ 미커밋, `feat/sheet-view-v2`): 시트 뷰(`components/sheet/*`) · AI 패널+Claude(`app/api/ai/*`·`components/ai/*`) · Import 모달(`components/import/*`). 설계 문서 phase{2,3}. vitest 도입. `app/txt-poc` 제거. tsc·build·vitest(13) green
- [x] **FlowBase V2 Phase 1A — 기반** (2026-05-21): 제네릭 데이터 모델·zustand 스토어·시드·undo·parsers·키보드. design-ref V2 핸드오프 도입, 7단계 계획·Phase 1 design 작성
- [x] **PR #4** (2026-05-07): Linear+shadcn overhaul, Trash, Workspaces UX, Quick switcher, Breadcrumb, Settings, design tokens
- [x] **FlowBase 리브랜드** (2026-05-05): FlowDB → FlowBase, GitHub repo rename (peterkwon248/FlowBase), Status pill 통합 + 미처리=blue
- [x] **PR #3** (2026-05-05): visual-design-update — Phosphor 아이콘, 채널 아이콘+텍스트, 워크스페이스 셀렉터, light/dark 컬러 최적화
- [x] **PR #1** (2026-05-04): txt 블록 자동 분류 PoC + 머지
- [x] 글로벌 명령어 강화 (after-work / before-work)
- [x] Docs bootstrap (`docs/{SESSION-LOG,MEMORY,CONTEXT,TODO}.md`)
- [x] Claude Design 앱 → FlowDB 3 섹션 이식
- [x] shadcn/ui 디자인 시스템
- [x] v0.1 코드 감사 + 백로그 분류 (🟢 24 / 🟡 13 / 🔴 1)
- [x] GitHub repo 분리 + 첫 푸시 (peterkwon248/flowdb → FlowBase)
- [x] 4개 기획 문서 작성 (docs/00~02 + spec)
