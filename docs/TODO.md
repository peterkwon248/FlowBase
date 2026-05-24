# TODO

Phase 별 우선순위 (P0 / P1 / P2 / P3).

---

## P0 (완료 — breadth 100% + 셸 chrome 보정)

> 🎯 **앱 breadth P0 100%** (2026-05-23): Tables · Workspace(Schema·Automations) · Library(B1·B2) · Inbox · Detail bar · Wiki · Search.
> 🎨 **셸 chrome 보정** (2026-05-23, `96ff20d`): status bar(영구) · NavCluster · ⌘K 힌트 · 영어화.
>
> 다음은 **깊이/품질** — 컬럼 추가/편집 · Trash/Settings 실작동 · 시드 영어화.

---

## P1 — 깊이/품질 (시급) — 3건 완료

- [x] **컬럼 추가 (Sheet "+")** (2026-05-24 — `d911c06`)
- [x] **Trash · Settings 실제 동작** (2026-05-24 — `a4935af`)
- [x] **시드 deep 영어화** (2026-05-24 — `a7a1c77`)

## P1 — 깊이/품질 (시급 3건 완료)

- [x] **Schema ER 다이어그램** (2026-05-24 — `7694d76`)
- [x] **Automations 동작 (toggle/delete/accept/dismiss)** (2026-05-24 — `4969e50`)
- [x] **Wiki 본문 편집** (2026-05-24 — `bf02ebb`)

## P1 — 다음 시급 (6/9 완료)

- [x] **Automations 실제 트리거 엔진** (2026-05-24 — `12a65d3`)
- [x] **다중 필드 Filter 팝오버** (2026-05-24 — `bfbc3d3`)
- [x] **우클릭 컨텍스트 메뉴** (2026-05-24 — `26a0c28`)
- [x] **Gallery view + Timeline view** (2026-05-24 — `0bdedfd`)
- [x] **Bulk edit + ⌘D 단축** (2026-05-24 — `f6044e1`)
- [x] **Wiki**: 새 페이지 + 사이드바 검색 (2026-05-24 — `44d5003`)

## P1 — 남은 시급 (모두 완료)

- [x] **Schema pan/zoom + drag + New table from template 모달** (2026-05-24 — `2bdee40`)
- [x] **Dashboard builder + Stacked bar** (2026-05-24 — `bb5a0cc`)
- [x] **컬럼 헤더 확장 메뉴**: Change type · Promote to Library · Attach function (2026-05-24 — `57fadb6`, `8909ec2`)
- [x] **Automations 시간 기반 트리거** (2026-05-24 — `5db2376`)
- [x] **Attached function 자동 실행** (2026-05-24 — `5db2376`)

## P2 — 폴리시 일괄 #5 (2026-05-24 — `d98f41c` 모두 완료)

- [x] **Wiki 삭제 → trashedWikiPages** (Trash 일관성, store v9→v10, 3rd tab)
- [x] **AppShell mount cleanupExpiredTrash 자동 호출** (hasHydrated 체크)
- [x] **Ask AI ⌘J 톱바 버튼** (Sparkles + composer focus token)
- [x] **Settings 깊이 4탭** (General/Members/Appearance/Data + Owner 보호 + Theme + Export JSON)
- [x] **Heatmap 차트** (Dashboard builder 6번째 종류)

## P2 — 폴리시 일괄 #6 (2026-05-24 — `a818f82` 모두 완료)

- [x] **Timeline Gantt 재작성** (사용자 보고 fix · 월별 카드 폐기)
- [x] **Filter Popover 2-step inline + 컬럼 hue dot** (사용자 보고 fix · DropdownMenu Sub 폐기 · dropdown z-fix)
- [x] **Filter range/numeric/date** (FilterCondition union · num/date picker)
- [x] **viewSettings 인프라 + Display 버튼 + 4 view 옵션** (store v12 · Sheet/Kanban/Gallery/Timeline)
- [x] **Chart reorder + inline edit** (moveChart · ↑↓ · ⋯ Rename · Width)
- [x] **Library promoted field → 원본 컬럼 점프**

## P2 — 폴리시 일괄 #7 (2026-05-24 — `568526d` 모두 완료)

- [x] **Filter cascade hover 복원** (사용자 보고 fix · Linear 정확)
- [x] **Legacy filter 액션 제거** (setColumnFilter/toggleColumnFilter 삭제)
- [x] **permanentDeleteBoard cleanup** (viewSettings/schemaPositions/viewByBoardId dangling)
- [x] **시간 트리거 firedKeys persist** (localStorage + 30일 cleanup)
- [x] **Theme accent color 프리셋** (4종 — purple/blue/emerald/amber)
- [x] **Data Import** (Settings Data 짝 · 보드만 머지)
- [x] **Members 깊이 minimum** (currentUserId/lastSeenAt/UI · addRow demo 가드)

## P2 — 남은 폴리시

- [ ] **Members enforcement 확장** — addRow 외 모든 mutation에 viewer 가드 + toast.
- [ ] **Theme accent oklch 시각 튜닝** — light/dark 4 accent 브라우저 검증 후.
- [ ] **Data Import 메타 포함** — viewSettings/schemaPositions/library/wiki 충돌 정책.
- [ ] **firedKeys dueDate cleanup** — 보드 영구 삭제 시 dangling key.
- [ ] **Chart toolbar 터치 UX** — group-hover 한계.
- [ ] **Filter And/Or multi-condition per column** — ≥/≤/contains 등.
- [ ] **Gallery/Timeline 커스터마이즈 후속** (카드 컬럼 reorder · Gantt 주 단위 group · zoom).
- [ ] **Schema pinch-zoom 트랙패드** + 멀티 테이블 → N개 보드.
- [ ] **MATCH_FROM_DROPDOWN sourceField 명시 선택**.
- [ ] **Wiki body diff/version history**.

---

## P1 (breadth 뒤)

- [ ] **시드 deep 영어화** — `flowbase-library-seed.ts` Korean 자산명(모델명·처리방식·사업부) + 옵션 라벨 · `flowbase-workspace-seed.ts` 룰 잔여 · Customer Interviews 시드 한국어 quote/name
- [ ] **반응형 fix** — ~800px 4-5 패널 cramped (사용자 우선순위 후순위)
- [ ] **B3 — Library 인라인 편집** — rename · 옵션 색상/추가 · field config
- [ ] **AI 실호출 검증** — `.env.local`에 `ANTHROPIC_API_KEY` → infer-batch/ask/analyze-import 검증
- [ ] **`main` 머지** — 13 커밋 origin/branch 대기 → fast-forward
- [ ] **B4 (가장 마지막, 사용자 명시)** — 컬럼↔Library 자산 링크 · "Use in table" · 템플릿으로 보드 생성

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

- [x] **시간 기반 트리거 + Attached function 실 실행** (2026-05-24 — `5db2376`): parseTimeTrigger(daily HH:MM, dueDate+status) · shouldFireDaily/DueDate 순수 함수 + 14 신규 단위 테스트. AutomationRuntime setInterval 1분 tick + firedKeys dedupe. runAttachedFunctions(MATCH_FROM_DROPDOWN 실 구현, AI_CLASSIFY/EXTRACT_REGEX hint). vitest 30 → 44.
- [x] **Dashboard builder full + Stacked bar** (2026-05-24 — `bb5a0cc`): ChartConfig types + Board.charts? + addChart/removeChart/updateChart/clearCustomCharts · stacked-bar-chart.tsx 신규(SVG, 의존성 0) · add-chart-dialog.tsx (5종 카드 + source/group/title/width) · dashboard-view 재구성 (custom charts hero 12-col grid + hover X 삭제 + Reset to auto + Add chart 버튼 + empty state도 Add).
- [x] **일관성 + 깊이 5건** (2026-05-24 — `8909ec2`): 사이드바 너비 통일(Library/Wiki 260→240) · Automation 실행 로그(executeRule이 aiHistory에 pushAi) · Wiki 페이지 우클릭(Rename/Move/Delete) · Trash 행 단위 + 30일 만료(types.TrashedRow + store v8→v9 + deleteRows trash로 이동 + 두 탭 다이얼로그) · Promote to Library + Attach function(column-header-menu에 Sparkles/Sigma submenu, types.ColumnDef.libraryFieldId/functionId).
- [x] **Workspace + Inbox 좌측 사이드바** (2026-05-24 — `fb79379`): 사용자 지적 일관성 결함 해소. WorkspaceSidebar(Schema/Automations) · InboxSidebar(7 필터). workspace-mode 상단 탭 제거. inbox-view 상단 chips 제거. 헤더가 활성 필터 라벨. 모두 panels.sidebar 토글 공유.
- [x] **Dashboard 영어화 + Line/Area trend + 컬럼 Change type** (2026-05-24 — `57fadb6`): dashboard-view 모든 라벨 영어화 · components/charts/line-chart.tsx(SVG path + area, 의존성 0) · buildWeeklyTrend 8주 버킷 · selectVisibleRows columnFilters deps 누락 버그 fix · column-header-menu에 Change type submenu(Basic 7 type, 행 데이터 보존).
- [x] **Schema pan/zoom + drag + New table 모달** (2026-05-24 — `2bdee40`): schemaPositions persist + setSchemaPosition · ⌘+wheel zoom · 빈 영역 pan · 카드 헤더 드래그 reposition(zoom 보정) · 우상단 -/100%/+ Reset toolbar · NewTableModal(Library template 카드 그리드 + Blank, templateToColumns resolver).
- [x] **Wiki 새 페이지 + 사이드바 검색** (2026-05-24 — `44d5003`): addWikiPage(init?) draft + deleteWikiPage 액션. 사이드바 헤더 + 버튼. 검색 input 활성 (title/category/body 매치, X clear).
- [x] **Bulk edit + ⌘D 단축키** (2026-05-24 — `f6044e1`): bulk-edit-menu submenu(status/select 컬럼 → 값) 선택 행 일괄 updateRow. ⌘D → 선택 행 duplicateRow.
- [x] **Gallery + Timeline view** (2026-05-24 — `0bdedfd`): view-switcher에 grid·timeline 추가. gallery 카드 그리드 (avatar/text 헤더 + status/select/date/num 본문). timeline 월별 그룹화. 둘 다 RowContextMenu 공유.
- [x] **우클릭 컨텍스트 메뉴** (2026-05-24 — `26a0c28`): store.duplicateRow + row-context-menu(Open detail·Duplicate·Copy ID·Delete). 우클릭 시 자동 선택. 다중 선택 일괄 적용.
- [x] **다중 필드 Filter 팝오버** (2026-05-24 — `bfbc3d3`): columnFilters: Record&lt;string,string[]&gt; 신규 state · setColumnFilter/toggleColumnFilter/clearAllFilters · filter-menu submenu 패턴 · ActiveFilterChips 칩 바.
- [x] **Automations 실제 트리거 엔진** (2026-05-24 — `12a65d3`): types.ChangeEvent + lastChange ephemeral + publishChange in addRow/updateRow/commitAiCell · addRowToBoard cross-board · AutomationRuntime 컴포넌트 셸 마운트 · matches/executeRule with row_added·sentiment changes·AI theme confirmed 트리거 + Notify/Set/Add row 액션 + parseRowDetail({token} 치환). **vitest 15 → 30 passing.**
- [x] **Wiki 본문 편집** (2026-05-24 — `bf02ebb`): editMode 토글 · Title 우측 Edit/Cancel·Save 버튼군 · textarea(min-h-400, font-mono) · markdown 문법 헬퍼 · Save → updateWikiPage({body, updatedAt}) · 페이지 전환 시 draft 자동 리셋.
- [x] **Automations 동작** (2026-05-24 — `4969e50`): toggleAutomationStatus(active↔paused) · deleteAutomation · testRunAutomation(visual proof) · acceptSuggestion(draft promote) · dismissSuggestion · 룰 카드 status pill 클릭 + "..." 드롭다운(Test run/Delete with AlertDialog) · Empty state · SuggestionCard Accept/Dismiss 버튼.
- [x] **Schema ER 다이어그램 + 3 sub-tab** (2026-05-24 — `7694d76`): auto-layout 3-col grid · FK → bezier 엣지 + 1:N cardinality pill · hover active 표시 + 비-active 페이드 · Schema/Fields/Relations sub-tab 분리 · 카드/리스트 동일 컬러 시스템(TableChip).
- [x] **시드 deep 영어화** (2026-05-24 — `a7a1c77`): Library Option Lists/Fields/Templates/Functions/Dashboards 한국어 자산명·옵션 모두 영어 + usedIn 키 표기 영어 · Workspace AUT-004/005 + SUG-002 한국어 잔여 영어화 · Interviews 10 시드 한국어 이름(transliteration)·인용 영어. Status 키(미처리/진행중/대기/완료)는 LOCK 한국어 enum 유지.
- [x] **Trash · Settings 실제 동작** (2026-05-24 — `a4935af`): TrashedBoard·WorkspaceSettings 타입 · store v6→v7 migrate · deleteBoard 변경(trashedBoards로 push, 마지막 보드 보호) · restoreBoard/permanentDeleteBoard/emptyTrash/updateSettings · trash-dialog.tsx(Restore↺/Delete forever🗑/Empty trash) · settings-dialog.tsx(Workspace name/Initial/Storage stub) · status-bar에 trashedCount 배지 · board-header/board-sidebar 하드코딩 제거.
- [x] **컬럼 추가/편집** (2026-05-24 — `d911c06`): addColumn/deleteColumn/renameColumn/updateColumn · "+"에 Basic 7 + Library Field 8 드롭다운 · 헤더 우측 "..." 메뉴 Rename(Dialog) + Delete(AlertDialog) · 헤더셀 정렬 + 메뉴 가로 결합.
- [x] **셸 chrome 보정 — status bar · NavCluster · ⌘K 힌트** (2026-05-23 — `96ff20d`): 사용자 지적 5건 해결. `status-bar.tsx`(셸 푸터, hide-all 무관 always visible, Trash·Settings·2.1/10 GB) · `nav-cluster.tsx`(시계·‹·›) + store NavEntry/navStack/goBack/goForward/jumpToNavEntry · 사이드바 푸터·액티비티 바 Settings 제거 단일화 · 검색창 ⌘K Kbd + 검색창 클릭→팔레트 · PanelsMenu Korean→English. **앱 감사 보고서**: Sheet edit/⌘N/Filter/Kanban/Dashboard/Undo/AI fetch/Import 파서 모두 실작동 검증 완료.
- [x] **Search 모드 + ⌘K 팔레트** (2026-05-23 — `3771bc8`): `lib/search-index.ts` (boards/library/wikiPages 평면 SearchItem + prefix>contains>subtitle>keywords 스코어 필터 + countByKind) · `components/search/search-palette.tsx` 640px 모달(↑↓/Enter/Esc 키 네비, kind 그룹) · `components/search/search-mode.tsx` 풀페이지(5탭 + 카운트 chips, 200 limit) · `useNavigateSearchItem` 훅(Row 검색 시 detailBar 자동 활성) · ⌘K 키 단축키 · `ComingSoonMode` 삭제. **앱 breadth P0 100% 도달.**
- [x] **Wiki 모드** (2026-05-23 — `01a7ae7`): `WikiPage` 타입 + 6 페이지 시드(영어, Library guide/CS runbook/Keyboard shortcuts/New hire onboarding(draft)/Glossary/Team directory) + 미니 마크다운 렌더러(의존성 0, h1~h3·ul·ol·table·inline code·bold) + 카테고리 트리 사이드바(DRAFT 배지) + 페이지 상세(Owner·Verified pill·만료 배너·Re-verify·Mark as verified) + v5→v6 migrate
- [x] **English UI + Trash/Settings + Tasks 보드** (2026-05-23 — `605b9f3`): UI chrome 17+ 파일 영어화 · `STATUS_LABELS` 맵 · 사이드바 푸터(Trash·Settings·2.1/10 GB) · Tasks 시드(store v4→v5 migrate)
- [x] **Detail bar (4번째 패널)** (2026-05-23 — `f3feae2`): `PanelState.detailBar` · DetailBar 컴포넌트 · ⌘I 단축키 · TablesMode 통합
- [x] **Inbox 모드** (2026-05-23 — `620dadb`): 워크스페이스 상태 파생 6 kind + 필터 chips + 액션 네비
- [x] **Workspace > Automations** (2026-05-23 — `41b7257`): 룰 카드(When/Then) + AI 제안 + Schema/Automations 탭
- [x] **Phase B Library B2** (2026-05-23 — `5bf1ef5`): 5 카테고리 자산 디테일 + `selectAsset` 원자 액션
- [x] **Phase B Library B1** (2026-05-23 — `4148c96`): 5 카테고리 사이드바 트리 + 카탈로그 (읽기 전용)
- [x] **앱 셸 6모드 라우터 (Phase A)** (2026-05-23 — `daad859`): 액티비티 바 6모드 레일 · `activityMode` 라우터 · Schema를 Tables 뷰 탭→Workspace 모드 이동. Library 서브시스템 설계 문서
- [x] **옛 V1 미사용 코드 정리** (2026-05-23 — `4fa804a`): V2 도달 불가 V1 파일 20개 삭제 (−7,025줄)
- [x] **infer-batch sourceField 일반화 (Phase 3 Q1)** (2026-05-23 — `afa39f1`)
- [x] **before/after-work 명령어** (2026-05-22 — `2cbf01a`·`d2ad4ea`): 글로벌 대신 프로젝트 커맨드로 git 추적
- [x] **FlowBase V2 Phase 4·5·6** (2026-05-21 — `df7eeb4`, `main` 머지): Kanban·Dashboard·뷰 스위처 · 앱 셸(Activity bar·Sidebar·패널 토글·단축키) · 멀티보드(보드 CRUD)·Schema 뷰. 설계 문서 phase{4,5,6}
- [x] **FlowBase V2 Phase 1B·2·3** (2026-05-21 — `eb31064`, `main` 머지): 시트 뷰(`components/sheet/*`) · AI 패널+Claude(`app/api/ai/*`·`components/ai/*`) · Import 모달(`components/import/*`). 설계 문서 phase{2,3}. vitest 도입. `app/txt-poc` 제거
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
