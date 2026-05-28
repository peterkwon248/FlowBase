# CONTEXT

현재 features, 디자인 결정. [MEMORY.md](MEMORY.md) 기준으로 동기화.

---

## Current Features (Completed — 최근 우선)

1. **G7 후속 폴리시 묶음 (7 phase)** (2026-05-28, 7 commit `e4ea9e4`~`b43c93e`, 베이스 `663c6b7`, **main 머지 예정**) —
   - **A3 Wiki diff LCS** (`lib/line-diff.ts`) — `naiveLineDiff`(위치 비교) → `diffLines`(LCS DP+backtrack). 한 줄 삽입/삭제 어긋남 해소. 의존성 0. +10 단위 테스트(307→317). wiki-history-dialog import 교체(렌더 불변).
   - **D1 README** — 제목 FlowDB→FlowBase · GitHub Actions CI badge(`peterkwon248/FlowBase`) · 현재 상태/스택 갱신.
   - **A10 Gallery cardFields 네이티브 dnd** (`display-menu.tsx`) — HTML5 `draggable`+grip+splice reorder. ↑/↓ 버튼 유지. **dnd lib ❌ LOCK**(코드베이스 첫 네이티브 dnd 패턴).
   - **A9 Timeline month/week 실제 버킷** (`timeline-view.tsx`) — `days[]`→scale별 `ticks[]` 버킷(day/week/month). `bucketIndexOf` timestamp 기반 · UTC 자정 스냅. day scale 보존. 컬럼 폭 per-day→per-bucket(WEEK 54·MONTH 68).
   - **C2 Library 깊은 편집** (`asset-detail.tsx`) — OptionList 옵션 추가/삭제/rename/색상(토큰 `var(--chart-1..5)`) + Field config(required/default/format/validation/OptionList 링크). `updateLibraryOptionList`/`updateLibraryField` 재사용(ensureCanEdit). viewer read-only.
   - **Chart toolbar a11y** (`dashboard-view.tsx`) — `focus-within:opacity-100` 키보드 노출(touch는 기존).

2. **ESLint 풀스택 + G7-C 후속 폴리시 (17 phase)** (2026-05-26 후속, 2 commit `cb5e19d` 인프라 + `26ddcdb` 17 phase, **main 머지 완료**) —
   - **ESLint 9 flat config** + GitHub Actions CI + husky pre-commit (자동 작동) · ESLint **0/0 클린**
   - **Q13-D3 추가 룰** — prefer-const · no-console (allow warn/error/info) · eqeqeq smart
   - **G7-C 후속**: Q1-A6 Theme accent 미세 조정 · Q1-B5 lib/deep-equal.ts · Q1-B6 saved view fallback 명시
   - **Formula 후속**: Q3 sort/filter by formula 컬럼 · Q5-B2 joinProp · Q5-B7 Import 재검증 · Q6-B3 column chip autocomplete · Q7-B4 추가 함수 11개
   - **UI 폴리시**: Q8-A7 Pivot PNG (html2canvas) · Q9-A11 search/inbox EmptyState · Q10-B9 Saved Views search + sort toggle
   - **Library**: Q14-C2 5 카테고리 rename MVP (asset-detail Shell 인라인 input)
   - **ESLint cleanup**: Q4 warnings 16→0 · Q2-fu1 errors 8 fix (dashboard-view 컴포넌트 분리)

2. **G7-C Saved Views + Formula 컬럼 + UI polish** (2026-05-26, 2 commit `fac61fe` G7-C + `9f351c0` polish, **main 머지 완료**) —
   - **Saved Views** (C-V1·V2·V3) — Notion 식 named view · SavedView types + 5 store actions + v17 migrate · SavedViewsMenu(BookmarkCheck trigger · Save/Apply/Rename inline/Delete) · viewType 호환 가드 + modified detection(amber dot · Update from current). Scope LOCK: filter+sort+viewSettings 풀세트
   - **Formula 컬럼** (C-F1~F5) — `ColumnType += "formula"` · `lib/formula/` (tokens·parser·evaluator·functions·cycles·index) · 16 함수(concat/lower/upper/length · add/sub/mul/div/round · if · today/format · prop + 비교/논리) · dependsOn 자동 추출 · 자동 editor 오픈(CustomEvent) · FormulaCell + AST cache + ⚠ ERR · FormulaEditorDialog + 라이브 validation · 순환 detection(DFS 3색) · patch 거부 가드. LOCK: prop("X") 명시만 · 결과 타입 4종(status pill 흉내 ❌) · sort/filter 1차 미지원. 87 신규 tests
   - **UI polish P-1~P-4** — Toast position="bottom-right" + richColors + closeButton + duration LOCK · EmptyState 공통 컴포넌트(Gallery/Timeline) · Import skip summary 분기(Nothing new · Snapshot empty · Imported X) · Bullet "as KPI" preset(KPI↔Bullet Convert + goal Dialog)
   - **viewer enforcement P-5** — store undo/redo 가드(총 가드 ~56개) · tables-mode Undo button · Settings General(workspace name/initial/Save) + Accent(4 preset) + Import(Choose JSON) viewer disable

2. **14 phase 통합** (2026-05-25, multi-select 5 commits `a4e36a5`~`b6e6e10` + 13 phase 단일 `2c04c39`, **main 머지 완료**) —
   - **Multi-select column type** (C1-C5) — Notion 패턴 · in/not_in ANY-match · status 격리 LOCK
   - **Filter +Add condition** — 3+ cond array loop
   - **Dashboard 완성** (D1-5 + F1-2 + G1 + G5 + G7-A + G7-B) — 11 chart type · 6 AggFn · 5 TimeScale · Auto-recommend · Pivot · drill-down · Goal · Bullet · Funnel · Conditional · PNG/Print
   - **Phase A code-only domain fit** (A1-5) — 7 도메인 추론 · KPI title 변형 · value format · insights · outliers
   - **AI 확장** (B1-4 + G6-1-2) — 6 routes (suggest board label / summarize / column type / cleanup / cell value / generate template). 명시 click LOCK
   - **G3 NEXT-ACTION 잔여** — Snapshots A vs B · multiTable N보드 · sourceField 명시
   - **G4 안정성** — auto-backup 30분 · BOM strip · outlier dot
   - **P 폴리시** — onboarding · ⌘/ 단축키 dialog · pill nowrap

2. **fix(ui): status pill nowrap** (2026-05-24, `a7e91c5`, **main 머지 완료**) — 사용자 보고. "In progress" 2줄 wrap → editable-cell·gallery-view·filter-chips 3 곳에 whitespace-nowrap. LOCK 컨벤션 추가.

1. **폴리시 #9 — Filter text contains · Gallery cardFields reorder · Timeline month scale** (2026-05-24, `1cb045e`, **main 머지 완료**)

1. **폴리시 #8 — Members enforcement 전체 · firedKeys dueDate cleanup · Data Import 메타 확장** (2026-05-24, `951e82e`, **main 머지 완료**)

1. **폴리시 #7 — Filter cascade 복원 · firedKeys persist · Theme accent · Data Import · Members 깊이** (2026-05-24, `568526d`, **main 머지 완료**) —
   - **Filter cascade hover 복원** (`components/board/filter-menu.tsx`) — DropdownMenu Sub + kind별 widget (Linear 정확). 직전 #6 2-step inline 폐기.
   - **Legacy filter 액션 제거** — setColumnFilter/toggleColumnFilter 삭제.
   - **permanentDeleteBoard cleanup** — viewSettings · schemaPositions · viewByBoardId dangling 키 정리.
   - **firedKeys persist** (`lib/automation-runtime.tsx`) — localStorage + 30일 daily cleanup.
   - **Theme accent 4 프리셋** (`globals.css` + `app/page.tsx` mount sync + `settings-dialog` AccentSection) — purple/blue/emerald/amber.
   - **Data Import** (`store.importBoards` + settings-dialog ImportSection) — JSON 보드만 머지, id 충돌 시 새 id.
   - **Members 깊이 minimum** — `WorkspaceMember.lastSeenAt` + `roleCanEdit` + `settings.currentUserId` (v12→v13) + Settings Members "You" 배지·lastSeen 표시. addRow demo 가드.

1. **깊이 #6 — Timeline Gantt · Filter (2-step + range) · Display 옵션 · Chart reorder · Library 점프** (2026-05-24, `a818f82`, **main 머지 완료**) —
   - **Timeline Gantt 재작성** (`components/sections/timeline-view.tsx`) — 월별 카드 리스트 폐기, sticky day-column + Gantt bar + OVERDUE.
   - **Filter Popover 2-step inline** (`components/board/filter-menu.tsx`) — DropdownMenu Sub 폐기, 컬럼 hue dot.
   - **Filter range/numeric/date** — `types.FilterCondition` union, num/date 컬럼 picker, kind별 chip 라벨.
   - **viewSettings 인프라 + Display 버튼 + 4 view 옵션** (`components/board/display-menu.tsx` 신규) — Linear "Display" 패턴. Sheet hide columns · Kanban groupBy · Gallery cover/cards/columns · Timeline date/scale. store v11→v12.
   - **Chart reorder + inline edit** (`store.moveChart` + dashboard-view 호버 toolbar) — ↑↓ swap + ⋯ menu(Rename · Width 4종).
   - **Library promoted field 점프** (`components/library/asset-detail.tsx`) — Used in chip → button → 원본 컬럼.
   - **DropdownMenu Sub z-fix** (`components/ui/dropdown-menu.tsx`) — z-[60] + sideOffset 6 + cursor-pointer.

1. **깊이 #5 — Wiki Trash · AppShell cleanup · Ask AI ⌘J · Settings 4탭 · Heatmap** (2026-05-24, `d98f41c`, **main 머지 완료**) —
   - **Wiki 삭제 → trashedWikiPages** (store v9→v10 + trash-dialog 3탭 + 컨텍스트 메뉴 메시지)
   - **AppShell mount cleanupExpiredTrash** (`app/page.tsx` mount + zustand persist hasHydrated 체크)
   - **Ask AI ⌘J 톱바 버튼** (`board-header` Sparkles 버튼 + `keyboard-shortcuts` ⌘J + `requestAskAi` 액션 + `AiComposer` focus 구독)
   - **Settings 깊이 4탭** (`settings-dialog` 전면 재작성 — General/Members(Owner 보호 이중 단)/Appearance(next-themes)/Data(Blob JSON export))
   - **Heatmap 차트** (`components/charts/heatmap-chart.tsx` 신규 — 2D grid + intensity opacity, 의존성 0)

1. **깊이 #4 — Dashboard builder · 시간 트리거 · Attached function 실행** (2026-05-24, `bb5a0cc`+`5db2376`, **main 머지 완료**) —
   - **Dashboard builder** (`components/sections/add-chart-dialog.tsx` + `stacked-bar-chart.tsx`) — 사용자 차트 추가/삭제. 5종(KPI/Bar/Donut/Line/Stacked) + width 4종 + 12-col grid.
   - **시간 트리거** (`lib/automation-runtime.tsx`) — daily HH:MM + dueDate+statusEquals. setInterval 1분 tick + firedKeys dedupe.
   - **Attached function 실행** — MATCH_FROM_DROPDOWN 실 구현 + AI_CLASSIFY/EXTRACT_REGEX hint.

2. **일관성 + 깊이 #3 — 사이드바 추가/통일 · Automation log · Wiki 우클릭 · Trash 행 · Promote/Attach** (2026-05-24, `fb79379`+`8909ec2`, **main 머지 완료**) —
   - **Workspace/Inbox 사이드바** — 일관성 결함 해소. 5 모드 모두 사이드바.
   - **사이드바 너비 통일** 240px 전체.
   - **Automation 실행 로그** AI Activity panel timeline에 fire 기록.
   - **Wiki 페이지 우클릭** Rename/Move/Delete.
   - **Trash 행 단위 + 30일 만료** — 두 탭 다이얼로그.
   - **Promote to Library + Attach function** — 컬럼 → LibraryField/LibraryFunction 링크.

2. **깊이 일괄 #2 — Schema pan/zoom + New table + Dashboard 영어/Line + 컬럼 Change type** (2026-05-24, `2bdee40`+`57fadb6`, **main 머지 완료**) —
   - **Schema ER 인터랙션** (`schema-er-diagram.tsx` + `schema-new-table-modal.tsx`) — 카드 헤더 드래그 reposition, ⌘+wheel zoom, 빈 영역 pan, 우상단 zoom/Reset toolbar, New table 모달 (Library template 또는 Blank).
   - **Dashboard 영어화 + Line/Area trend** (`components/charts/line-chart.tsx`) — 8주 버킷 trend chart 추가. 모든 한국어 라벨 영어.
   - **컬럼 Change type submenu** (`column-header-menu.tsx`) — Rename/Delete 사이에 Change type submenu. Basic 7 type.

2. **깊이 일괄 — Automations 엔진 + Filter 다중 + 우클릭 + Gallery/Timeline + Bulk edit + Wiki 페이지 생성** (2026-05-24, 6 커밋 `12a65d3`~`44d5003`, **main 머지 완료**) —
   - **Automations 트리거 엔진** (`lib/automation-runtime.tsx`) — row 변경 시 active 룰 자동 발화. Notify/Set/Add row to 액션. 15 단위 테스트.
   - **다중 필드 Filter** (`components/board/filter-menu.tsx`) — Linear 스타일 submenu. ActiveFilterChips.
   - **우클릭 컨텍스트 메뉴** (`components/sheet/row-context-menu.tsx`) — Open detail/Duplicate/Copy ID/Delete + 자동 선택.
   - **Gallery + Timeline 뷰** (`components/sections/{gallery,timeline}-view.tsx`) — 5종 뷰 완성.
   - **Bulk edit + ⌘D** (`components/board/bulk-edit-menu.tsx` + keyboard-shortcuts) — 다중 행 일괄 set + 복제 단축.
   - **Wiki 페이지 생성 + 사이드바 검색** (`components/wiki/wiki-sidebar.tsx` + store) — + 버튼 / 활성 검색.

2. **P1 시급 일괄 #2 — Schema ER · Automations 작동 · Wiki 편집** (2026-05-24, `7694d76`·`4969e50`·`bf02ebb`, **main 머지 완료**) —
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
- 내부 docs/spec의 "FlowDB" 표기 다수 잔존 (사용자 노출은 FlowBase, 내부는 점진 정리. README는 2026-05-28 FlowBase로 정정).
