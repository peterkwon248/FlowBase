# TODO

Phase 별 우선순위 (P0 / P1 / P2 / P3).

---

## 2026-05-30 — 테이블 많을 때 1순위 + Schema 캔버스 + 전역 순서 (3 commit, main 머지)

- [x] **Fields 검색 + 카드 접기** (`9938f9b`) — 테이블/필드 매칭 필터 · 행 하이라이트 · 카운트 · Collapse/Expand all · 검색 중 force-expand
- [x] **Schema ER 검색 포커스** (`3b2ddef`) — 검색창 + 드롭다운 → 카드 중앙 이동 + ring
- [x] **Schema ER 캔버스** (`3b2ddef`) — 카드 본문 드래그 · 클릭 선택 · 빈곳 해제 · 더블클릭 열기
- [x] **전역 테이블 순서** (`2d31752` reorderBoards + `9938f9b` Fields grip dnd) — boards Record 재정렬 · 사이드바/Schema/Fields 일관
- [ ] 테이블 많을 때 **2·3순위** — 미니맵 · 자동레이아웃 · 도메인그룹 · 마스터-디테일 (YAGNI 백로그, 15~20개+ 신호 시)

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

## P2 — 폴리시 일괄 #8 (2026-05-24 — `951e82e` 모두 완료)

- [x] **Members enforcement** (핵심 14 mutation 가드)
- [x] **firedKeys dueDate cleanup** (permanentDeleteBoard)
- [x] **Data Import 메타 포함** (importWorkspace · library/wiki/automations)

## P2 — 폴리시 일괄 #9 (2026-05-24 — `1cb045e` 모두 완료)

- [x] **Filter text/email contains operator**
- [x] **Gallery cardFields reorder** (↑/↓ 버튼)
- [x] **Timeline month scale** (COL_WIDTH_MONTH=8)

## 2026-05-26 후속 17 phase (2 commit · `cb5e19d` ESLint 인프라 + `26ddcdb` 17 phase)

- [x] **ESLint 9 flat config + CI + pre-commit** (Q2 풀스택) — eslint.config.mjs · ci.yml · husky · lint-staged · 신규 deps
- [x] **Q13-D3 추가 lint 룰** — prefer-const · no-console · eqeqeq smart
- [x] **Q1-A6 Theme accent 미세 조정** — AccentSection relative + active bg
- [x] **Q1-B5 deep equal helper** — lib/deep-equal.ts (JSON.stringify 의존 제거)
- [x] **Q1-B6 saved view kanban fallback 명시** — viewSettings 보존 + toast description
- [x] **Q2-fu1 ESLint errors 8개 fix** — sheet-view + dashboard-view 컴포넌트 분리
- [x] **Q3 Formula sort/filter by formula** — selectVisibleRows evaluator + AST cache + filter widget 분기
- [x] **Q4 ESLint warnings 16개 → 0/0**
- [x] **Q5-B2 Formula joinProp(col, sep)** — multiSelect 명시 separator (+6 tests)
- [x] **Q5-B7 importWorkspace formula 재검증**
- [x] **Q6-B3 Formula column autocomplete** — chip 삽입
- [x] **Q7-B4 Formula 추가 함수 11개** — contains/replace/startsWith/endsWith/trim/abs/mod/floor/ceil/dateAdd/weekOfYear (+11 tests)
- [x] **Q8-A7 Pivot HTML PNG export** — html2canvas dynamic import
- [x] **Q9-A11 Empty state 잔여** — search-mode + inbox-view EmptyState 적용
- [x] **Q10-B9 Saved Views UI 폴리시** — search filter + recent/alpha sort toggle
- [x] **Q12-D2 pre-commit hook 실 동작 확인** — husky lint-staged 자동 작동
- [x] **Q14-C2 Library rename MVP** — 5 update actions + Shell 인라인 rename

## 2026-05-26 G7-C + 폴리시 13 phase (2 commit · `fac61fe` + `9f351c0`)

- [x] **G7-C Saved Views** (C-V1·V2·V3) — SavedView types + 5 actions + v17 migrate · SnapshotState 포함 · SavedViewsMenu · viewType 호환 가드 · modified detection
- [x] **G7-C Formula 컬럼** (C-F1~F5) — tokenizer/parser + extractDeps · evaluator + 16 함수 · ColumnType += "formula" · dependsOn 자동 추출 · FormulaCell + AST cache · FormulaEditorDialog · 순환 detection
- [x] **P-1 Toast position 통일** — Toaster props 명시 (bottom-right + richColors + closeButton + duration) + LOCK
- [x] **P-2 Empty state 일관성** — EmptyState 공통 컴포넌트 + Gallery/Timeline 적용 (Kanban 의도 skip)
- [x] **P-3 Data Import skip summary UI** — totalAdded/totalSkipped 분기 (Nothing new · Snapshot empty · Imported X)
- [x] **P-4 Bullet "as KPI" preset** — KPI↔Bullet Convert 메뉴 + goal Dialog
- [x] **P-5 viewer enforcement polish** — store undo/redo 가드 + tables-mode Undo + Settings General/Accent/Import disable

## 2026-05-25 14 phase 통합 (multi-select 5 commits + 13 phase 1 commit `2c04c39`)

- [x] **Multi-select column type** (C1-C5) — types/store/sheet/views/filter/import
- [x] **Filter +Add condition UI** — 3+ cond array loop
- [x] **D Dashboard 완성** — AggFn · Scatter · Histogram · TimeScale · Auto-recommend
- [x] **F Dashboard 후속** — Multi-series line · Calendar bucket
- [x] **A Phase A code-only domain fit** — domain-infer · value-format · insights · outliers
- [x] **G1 Dashboard 강화** — Pivot · drill-down · Goal · Sheet outlier alert
- [x] **G2 AI** — board label · summarize · column type · cleanup (사용자 명시 click LOCK)
- [x] **G3 NEXT-ACTION 잔여** — Snapshots A vs B · multiTable → N보드 · sourceField 명시
- [x] **G4 안정성** — Sheet outlier dot · auto-backup · BOM strip · firedKeys sync
- [x] **G5 Chart polish** — Histogram/Line drill-down · CSV export
- [x] **G6 AI 확장** — cell suggest · board template generator
- [x] **P 소소 폴리시** — onboarding · ⌘/ 단축키 dialog · pill nowrap
- [x] **G7-A Domain fit** — Bullet · Funnel · Conditional formatting
- [x] **G7-B 결과 공유** — Chart PNG · @media print CSS

## Fix #1 (2026-05-24 — `a7e91c5`)

- [x] **status pill 줄바꿈** (사용자 보고) — editable-cell/gallery-view/filter-chips 3 곳 whitespace-nowrap

## P2 — 남은 폴리시

- [x] ~~**다른 pill 일괄 점검**~~ — 이미 18 파일 whitespace-nowrap 적용됨
- [x] ~~**남은 mutation enforcement**~~ — undo/redo 가드 완료 (P-5). 의도 제외 LOCK 명시
- [x] ~~**UI 단 viewer disable**~~ — Settings General/Accent/Import + tables Undo 완료 (P-5)
- [x] ~~**Theme accent oklch 시각 튜닝**~~ — AccentSection relative + bg 적용 (Q1-A6)
- [x] ~~**Data Import skip summary**~~ — 분기 추가 완료 (P-3)
- [x] ~~**Filter And/Or UI 본격**~~ — 직전 세션 #19에서 ExtraCondBlock + "Add condition" 완료 (Q1-A1)
- [x] ~~**Schema pinch-zoom 트랙패드 + 멀티 테이블**~~ — `41cd262` + G3-2에서 완료 (Q1-A2)
- [x] ~~**MATCH_FROM_DROPDOWN sourceField 명시**~~ — G3-3 완료 (Q1-A4)
- [x] ~~**Chart toolbar 터치 UX**~~ — 2026-05-28 `b43c93e` focus-within 키보드 a11y (touch 기존)
- [x] ~~**A3 Wiki body diff 정교화**~~ — 2026-05-28 `e4ea9e4` LCS (`lib/line-diff.ts` + 10 tests)
- [x] ~~**firedKeys runtime ref sync**~~ — `39a9c4e` CustomEvent listener 완료 (Q1-A5)
- [x] ~~**A9 Timeline real month aggregation**~~ — 2026-05-28 `fd79451` scale별 ticks 버킷
- [x] ~~**A10 Gallery dnd reorder**~~ — 2026-05-28 `37e1ad6` cardFields 네이티브 HTML5 dnd
- [x] ~~**HTML chart (Pivot) PNG export**~~ — html2canvas dynamic import 완료 (Q8-A7)
- [x] ~~**ESLint flat config 복구**~~ — Q2 풀스택 완료 (config + CI + pre-commit)

## G7-C 후속 (Formula · Saved Views 폴리시 — 모두 완료)

- [x] ~~**Formula sort/filter by formula**~~ Q3 완료
- [x] ~~**Formula joinProp(col, sep)**~~ Q5-B2 완료
- [x] ~~**Formula 컬럼명 autocomplete**~~ Q6-B3 완료 (chip 삽입 방식)
- [x] ~~**Formula 추가 함수**~~ Q7-B4 완료 (11개: contains/replace/startsWith/endsWith/trim/abs/mod/floor/ceil/dateAdd/weekOfYear)
- [x] ~~**Saved view deep equal helper**~~ Q1-B5 완료
- [x] ~~**Saved view kanban fallback 명시**~~ Q1-B6 완료 (viewSettings 보존 의도 + toast description)
- [x] ~~**Formula Import 시 매핑**~~ Q5-B7 완료 (재검증 + dependsOn 재계산)
- [x] ~~**Empty state 잔여**~~ Q9-A11 완료 (Search + Inbox, Wiki sidebar는 inline 유지)
- [x] ~~**Saved Views UI 폴리시**~~ Q10-B9 완료 (search filter + sort toggle)

## ESLint/CI 후속 + 결정/규모 보류

- [~] **Q11-D1 CI workflow 실 검증** — README badge 추가 완료 (2026-05-28 `ed02ef7`). GitHub Actions push 후 통과 확인은 잔여.
- [ ] **Formula sort/filter 1000행 성능 측정** — useMemo evaluation 비용 측정 (측정 task)
- [~] **Library 깊은 편집 (C2 후속)** — OptionList 옵션 CRUD + Field config 완료 (2026-05-28 `612bf42`+`2368aee`). **잔여**: Function params · Template fields · Dashboard charts 편집.
- [ ] **Formula propArr(col) 함수** — ⚠ raw array 반환 → Formula 결과타입 LOCK(4종) 확장 필요. 승인 후.
- [ ] **Saved Views 폴더 그룹화** — B9 후속 (기능 규모)

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
