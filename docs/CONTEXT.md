# CONTEXT

현재 features, 디자인 결정. [MEMORY.md](MEMORY.md) 기준으로 동기화.

---

## Current Features (Completed — 최근 우선)

1. **P1 시급 일괄 #2 — Schema ER · Automations 작동 · Wiki 편집** (2026-05-24, `7694d76`·`4969e50`·`bf02ebb`, **main 머지 완료**) —
   - **Schema ER**: positioned 박스 + SVG bezier 엣지 + cardinality pill. Schema/Fields/Relations 3 sub-tab.
   - **Automations 동작**: 룰 toggle/delete/test-run · 제안 accept(promote to draft)/dismiss. 실제 트리거 엔진은 후속.
   - **Wiki 편집**: Edit 토글 → textarea + Save/Cancel. markdown 원문 직접 편집 가능.

2. **P1 깊이 일괄 — 컬럼 추가/편집 + Trash/Settings + 시드 영어화** (2026-05-24, `d911c06`·`a4935af`·`a7a1c77`, **main 머지 완료**) —
   - **컬럼 CRUD** (`components/sheet/{add-column-menu,column-header-menu}.tsx`) — 헤더 "+"가 진짜 동작. Basic 7 type + Library Field 8 통합 드롭다운. 컬럼 헤더 "..." 메뉴 Rename(Dialog, key 보존) + Delete(AlertDialog 확인).
   - **Trash + Settings 실작동** (`components/board/{trash-dialog,settings-dialog}.tsx`) — status-bar 클릭 시 실 다이얼로그. Trash는 보드 복원/영구 삭제/empty. Settings는 워크스페이스 이름·initial 편집, 모든 화면 즉시 반영.
   - **시드 deep 영어화** — Library/Workspace/Interviews 자산명·옵션·quote 모두 영어. Status 키만 LOCK 한국어 유지.

2. **셸 chrome 보정 — status bar · NavCluster · ⌘K 힌트** (2026-05-23, `96ff20d`, **main 머지 완료**) —
   - **status bar** (`components/board/status-bar.tsx`) — 셸 푸터, **어떤 패널 상태에서도 항상 표시**. Trash · Settings · 2.1/10 GB. hide-all 시에도 접근 가능.
   - **NavCluster** (`components/board/nav-cluster.tsx`) — 시계 (history 드롭다운, 최근 20개) · ‹ Back · › Forward. store의 `navStack`/`navIndex` + `goBack`/`goForward`/`jumpToNavEntry`. 7개 navigation 액션이 자동 pushNav (dedup + cap 50).
   - **검색창 ⌘K Kbd 힌트** — 검색창이 ⌘K 팔레트 트리거.
   - **사이드바 푸터 · 액티비티 바 Settings 제거** — status bar 단일화.
   - **PanelsMenu English** — "Panels"/"Show all panels"/"Hide all panels".

2. **Search 모드 + ⌘K 팔레트** (2026-05-23, `3771bc8`, **main 머지 완료**) —
   - `lib/search-index.ts` + `components/search/*` — Tables · Rows · Library · Wiki를 평면 인덱스로 묶고 스코어 정렬.
   - **⌘K 팔레트** — 640px 모달, blur backdrop, kind별 그룹 결과, ↑↓/Enter/Esc 키 네비, 매치 하이라이트.
   - **풀페이지 Search 모드** — activityMode "search"에서 5탭(All/Tables/Rows/Library/Wiki) + 카운트 chips + 평탄 리스트.
   - Row 결과 클릭 시 자동으로 detailBar 열림. Wiki/Library 결과 클릭 시 해당 모드 + 선택 동기화.
   - 앱 breadth P0 100% 도달 — Tables · Workspace · Library · Inbox · Detail bar · English UI · Tasks · Wiki · Search.

2. **Wiki 모드** (2026-05-23, `01a7ae7`, **main 머지 완료**) —
   - `components/wiki/*` + `lib/flowbase-wiki-seed.ts` — 6 시드 페이지(영어, Concepts/Onboarding/Reference/Runbooks/Team).
   - 사이드바 카테고리 트리 + DRAFT 배지(unverified) + 활성 페이지 강조.
   - 페이지 상세: 제목 · Owner 아바타 · Verified pill(만료 시 Re-verify 배너) · Mark as verified(unverified) · 의존성 0인 미니 마크다운 본문(h1~h3·ul·ol·table·inline code·bold).
   - store v5→v6 migrate로 기존 persisted state에 시드 자동 주입.

2. **Library + Workspace Automations + Inbox + Detail bar + English UI + Tasks 보드** (2026-05-23, main 머지 완료) —
   - **Library** (`components/library/*` + `lib/flowbase-library-seed.ts`) — 5 카테고리 사이드바 트리 + 카드 카탈로그 + 자산 디테일(B1·B2, 읽기 전용).
   - **Workspace > Automations** (`components/workspace/automations-view.tsx` + `lib/flowbase-workspace-seed.ts`) — 룰 카드(When/Then) + AI 제안 + Schema/Automations 탭.
   - **Inbox** (`components/inbox/inbox-view.tsx`) — 워크스페이스 상태 파생 항목(AI pending · 자동화 제안 · 빈 테이블 · 미사용 자산 · 활동 로그) + 필터 chips + 액션 네비.
   - **Detail bar** (`components/board/detail-bar.tsx`) — 4번째 패널(`panels.detailBar`) · ⌘I · 선택/포커스 행 디테일.
   - **English UI** — `STATUS_LABELS` 맵으로 Status 디스플레이 영어(키는 LOCK 한국어). 17+ 컴포넌트 chrome 영어화. Trash · Settings 사이드바 푸터 + 2.1/10 GB stub.
   - **Tasks 보드** (`lib/flowbase-tasks-seed.ts`) — 2번째 시드 보드 (CS Operations 도메인). store v4→v5 migrate로 기존 persisted 자동 주입.

3. **앱 셸 6모드 라우터 (Phase A)** (2026-05-23) — `app/page.tsx`가 `activityMode` 기반 6모드 라우터. 액티비티 바 6모드 레일(Inbox·Tables·Workspace·Library·Wiki·Search). Tables 모드=기존 V2 보드(시트·칸반·대시보드·Import·AI·멀티보드 — 옛 "Phase 1~6"), Workspace 모드=Schema/Automations, Wiki는 자체 구현, Search만 "Coming soon" 스텁.
2. **Linear+shadcn 디자인 overhaul** (PR #4, 2026-05-07) — 전체 UI 톤 통합. Trash·Workspaces·Quick switcher·Breadcrumb·Settings·design tokens(`lib/tokens.ts`).
3. **Status pill 통합 + 미처리=blue** (2026-05-05) — 아이콘+이름+카운트 단일 pill.
4. **FlowBase 리브랜드** (2026-05-05) — FlowDB → FlowBase, GitHub repo rename.
5. **txt 블록 자동 분류 PoC** (PR #1, 2026-05-04 — **Phase 3에서 제거**) — `***` 구분 키워드 분류 PoC. `/txt-poc` 페이지 + `lib/parsers/txt-block-parser.ts`는 V2 Import로 대체되어 삭제됨.

> 옛 3섹션 UI는 V2 보드 UI로 전면 대체. 옛 V1 미사용 코드 20파일은 2026-05-23 정리 완료(`4fa804a`).

---

## Design Decisions

상세는 [MEMORY.md "Key Design Decisions"](MEMORY.md#key-design-decisions) 참조 (중복 방지).

핵심 5개:
- AI 추천 + 사람 확정
- 모든 결정 되돌릴 수 있음 (30일 rollback)
- 혼자 시작 → 팀 확장 (워크스페이스 모델)
- 3 진입점 분리
- 디스플레이 자동 추천 (도메인 의존 활성화)

---

## Pending TODO (다음에 시작할 것)

P0는 [TODO.md](TODO.md) 참조.

---

## 알려진 한계

- **반응형 레이아웃 깨짐** — ~800px 폭에서 4패널이 무너짐(AI 패널이 보드 영역 덮음, 시트가 컬럼 못 폄). 반응형 처리 부재 — 별도 작업 대기.
- `ANTHROPIC_API_KEY` 미설정 — AI 라우트(`infer-batch`/`ask`/`analyze-import`) 실호출 미검증. 키 없으면 graceful 500 + toast.
- **BaaS 미결정** (Supabase vs bkend.ai, `docs/01-baas-decision.md`) — 옛 Phase 7. 서브시스템 구축 뒤로 후순위.
- 프로젝트 eslint flat config 부재 — `npm run lint` 동작 안 함 (기존 이슈, 빌드 무관).
- 내부 docs/spec의 "FlowDB" 표기 다수 잔존 (사용자 노출은 FlowBase, 내부는 점진 정리).
