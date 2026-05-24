# SESSION-LOG

세션 history (append-only). 가장 최근 entry가 위.

---

## 2026-05-24 (kkh94 머신, 깊이 일괄) — Automations 엔진 · Filter · 우클릭 · Gallery/Timeline · Bulk edit · ⌘D · Wiki 페이지 생성/검색

### 완료 (6 커밋)
1. **Automations 실제 트리거 엔진** (`12a65d3`) — 룰이 진짜 발화.
   - types: `ChangeEvent` + `FlowBaseState.lastChange` (ephemeral).
   - store: addRow/updateRow/commitAiCell이 `publishChange()`로 lastChange set. cross-board `addRowToBoard(boardId, row)` 신규.
   - `lib/automation-runtime.tsx` (신규) — AutomationRuntime 컴포넌트 셸 마운트. lastChange 구독 → active 룰 스캔 → `matches()` → `executeRule()`. 트리거: row_added · sentiment changes to · AI Theme confirmed as. 액션: Notify(toast) · Set(updateRow patch) · Add row to(cross-board). detail의 `{name}` 토큰 source row 값으로 치환.
   - 단위 테스트 15 신규 — AUT-001/002/003 트리거 매칭 + parseRowDetail. **vitest 15 → 30 passing**.
2. **다중 필드 Filter 팝오버** (`bfbc3d3`) — status chips만 가능했던 필터를 모든 select/status 컬럼으로 확장.
   - store: `columnFilters: Record<string, string[]>` ephemeral + setColumnFilter / toggleColumnFilter / clearAllFilters. selectVisibleRows에 적용.
   - `components/board/filter-menu.tsx` — Linear "Add Filter…" submenu 패턴. 활성 카운트 배지. ActiveFilterChips 칩 바 (col:value, x로 제거).
3. **행 우클릭 컨텍스트 메뉴** (`26a0c28`) — `onContextMenu` 0건 → shadcn ContextMenu.
   - store: `duplicateRow(rowId)` — 원본 다음 위치에 새 ID + AI confirmed 유지. publishChange로 자동화 통지.
   - `components/sheet/row-context-menu.tsx` — Open in detail(⌘I) · Duplicate(⌘D) · Copy ID · Delete(⌫). 우클릭 시 선택 자동 교체. 다중 선택이면 일괄 적용.
   - sheet-view 각 tr을 RowContextMenu로 래핑.
4. **Gallery + Timeline 뷰** (`0bdedfd`) — Sheet/Kanban/Dashboard 옆에 정렬.
   - view-switcher: VIEWS에 grid · timeline 추가. timeline은 date 컬럼 있을 때만 활성.
   - `gallery-view.tsx`: auto-fill 카드 그리드. 첫 avatar/text → 헤더, status/select/date/num 4개 → 본문. RowContextMenu + detail bar 자동 활성.
   - `timeline-view.tsx`: 첫 date 컬럼 기준 월별 그룹화 (최근부터). 카드: 일자 + 제목/ID + priority/status pill.
5. **Bulk edit + ⌘D 복제 단축키** (`f6044e1`):
   - `bulk-edit-menu.tsx` — 다중 선택 시 "Set…" 드롭다운. status/select 컬럼 → 값 선택 → 모든 선택 행 updateRow. STATUS_LABELS 디스플레이.
   - keyboard-shortcuts: ⌘D → 선택 행 모두 duplicateRow.
6. **Wiki 새 페이지 + 사이드바 검색** (`44d5003`):
   - store: addWikiPage(init?) → unverified draft + 새 ID + 선택 자동. deleteWikiPage.
   - wiki-sidebar 헤더 + 버튼, 검색 input 활성 (title/category/body 매치, X clear).

### 큰 결정
- **자동화 트리거 엔진 = 휴리스틱 키워드 매칭** — when.event/value 자유 텍스트로 두고, "row added"/"sentiment changes to"/"AI theme confirmed as" 같은 substring으로 라우팅. 명시적 typed schema(TriggerKind)로 마이그레이트 ❌ (시드 그대로 동작).
- **publishChange는 store 액션 내부에서** — 별도 middleware ❌. 명시적 호출 + timestamp dedupe로 useEffect 재실행 제어.
- **columnFilters는 filter와 병존** — 기존 status chips 빠른 접근 유지, 새 FilterMenu가 모든 select/status 커버. 둘 다 selectVisibleRows에서 AND.
- **Gallery/Timeline은 RowContextMenu 공유** — 시트 외 뷰에서도 동일 액션 제공. detail bar 자동 활성도 동일.
- **Bulk edit은 select/status만** — text/num/date 인플레이스 bulk는 후속 (입력 위젯 다양해서 복잡).
- **새 Wiki 페이지는 draft 상태** — 자동 verified ❌ (LOCK: 사람이 검증).

### 검증
- tsc 0 · vitest 30/30 (15 신규 automation matches/parseRowDetail) · build.
- 브라우저 통합 테스트는 정량적 store 카운트 검증 (DOM 변화 + lastChange 추적).

### 다음
- Schema pan/zoom + drag reposition · "New table from template" 모달.
- Dashboard builder (Line/Area/Stacked + Add chart 카탈로그).
- 컬럼 헤더 확장: Promote/Attach function/Change type.
- 자동화 시간 기반 트리거 (cron-like for "every day at", "due date passes").
- Wiki sidebar 페이지 우클릭 (Rename · Move category · Delete).
- Trash 행 단위 + 30일 만료.
- Ask AI ⌘J · Settings 멤버 탭.

### Watch Out
- **`updateRow` 호출은 `publishChange` → AutomationRuntime이 useEffect 재실행**. 무한 루프 위험: rule action이 updateRow를 부르면 새 change → 다시 매칭. handledRef로 같은 timestamp는 한 번만 처리, 추가로 룰 자체가 자기-매칭하지 않도록 액션 결과로 trigger 조건이 다시 충족되지 않게 시드 룰 디자인 (Negative→Urgent task는 새 boardId라 OK).
- **Bulk edit + Automations 결합**: 10행 동시 updateRow → 10개 ChangeEvent · 10번 룰 매칭. 시드 룰 4개 × 10행 = 최대 40 fire. 자동화가 toast 폭주 가능성. 향후 batch suppress 옵션 검토.
- **Gallery/Timeline은 selectVisibleRows 결과를 useMemo 의존성 hack** — board/search/filter/sort/columnFilters로 invalidation 추적. 새 ephemeral state 추가하면 deps 갱신 필요.

### 머신
kkh94. main 머지·푸시는 after-work 자동.

---

## 2026-05-24 (kkh94 머신, P1 시급 일괄 #2) — Schema ER · Automations 작동 · Wiki 편집

### 완료
- **Schema ER 다이어그램 + 3 sub-tab** (`7694d76`) — flat grid → positioned 박스 + SVG bezier 엣지.
  - `components/sections/schema-er-diagram.tsx` (신규) — auto-layout 3-column grid. FK 컬럼 → bezier 엣지 + "1:N" cardinality pill. Hover 시 active 표시 + 비-active 30% 페이드. data-er-card 셀렉터.
  - `components/sections/schema-view.tsx` 재구성 — Schema(ER) · Fields(카드 그리드) · Relations(리스트) 3 sub-tab. data-schema-sub 셀렉터.
  - 브라우저 검증: interviews(240×328) + tasks(240×198) 카드 렌더, Relations: 0 (FK 시드 없음).
- **Automations 동작** (`4969e50`) — 카드가 클릭 무반응 → 모든 액션 실작동.
  - store: `toggleAutomationStatus`(active↔paused) · `deleteAutomation` · `testRunAutomation`(runs++ visual proof) · `acceptSuggestion`(draft 룰로 promote) · `dismissSuggestion`.
  - automations-view: 룰 status pill 클릭 가능 + "..." 드롭다운(Test run/Delete with AlertDialog) + Empty state + SuggestionCard에 Accept/Dismiss 버튼.
  - data-automation-id / data-automation-menu / data-automation-runs / data-suggestion-id 셀렉터.
- **Wiki 본문 편집** (`bf02ebb`) — 본문 읽기 전용 → markdown editor 토글.
  - `components/wiki/wiki-page.tsx` — editMode state, Title 우측 Edit/Cancel·Save 버튼군, textarea (min-h-[400px]·font-mono·focus:border-primary), markdown 문법 헬퍼 힌트. Save → updateWikiPage({body, updatedAt}).
  - 페이지 전환 시 draft 자동 리셋.
  - data-wiki-edit-toggle / data-wiki-editor / data-wiki-save 셀렉터.
  - 브라우저 검증: "Library guide" Edit 클릭 → textarea content "# What is the Library?..." 자동 로드 ✓.

### 큰 결정
- **ER auto-layout 우선, drag/zoom 후순위** — 사용자 데이터 규모(2~5 보드 예상)에서 row-major 3-column grid면 충분히 시각화. drag reposition은 향후.
- **Automations 실행 엔진 = visual proof만** — 실제 row 변경 감지 + rule 평가 + Then 실행은 별도 zustand subscribe 레이어 필요 → 후속. 지금은 testRunAutomation으로 runs++ 트래킹만 검증.
- **acceptSuggestion은 draft 상태 룰 생성** — 사용자가 트리거/액션을 명시 설정해야 active로 전환 가능. AI가 만든 룰을 무작정 active로 두지 ❌ (LOCK: "AI 추천 + 사람 확정").
- **Wiki 본문 편집은 textarea + Save (인플레이스 vs split pane)** — split preview는 너비 부담. 사용자가 Save로 명시적 commit 후 렌더 결과 확인.

### 검증
- tsc 0 · vitest 15/15.
- 브라우저: Workspace > Schema 진입 → ER 다이어그램 2 카드 렌더 ✓, sub-tab 3개 데이터 셀렉터 ✓ · Wiki Edit 토글 → textarea content 자동 로드 ✓.

### 다음 (감사 보고서 큰 갭 중 남은 것)
- **Automations 실제 트리거 엔진** — `lib/automation-runtime.ts`로 zustand subscribe + rule 평가. row 변경/스케줄 트리거 두 종류 처리.
- **컬럼 헤더 메뉴 확장**: Promote to Library · Attach function · Change type 인플레이스.
- **다중 필드 Filter 팝오버** · **Bulk edit** · **우클릭 컨텍스트 메뉴**.
- **Gallery / Timeline view** — `view-grid.jsx` · `view-timeline.jsx`.
- **Dashboard builder** — Line/Area/Stacked + "+ Add chart" 카탈로그.
- **Schema 깊이**: pan/zoom · drag reposition · "New table from template" 모달.
- **Wiki 깊이**: 새 페이지 생성 · 사이드바 검색 · live preview.
- **Ask AI ⌘J 톱바 버튼** · **Trash 행 단위 추적**.
- **B4 (가장 마지막)** — 컬럼↔Library 자산 링크.

### Watch Out
- **ER 엣지는 FK만** — conceptual relations(name/company shared field 등) 점선 엣지는 프로토타입엔 있지만 우리 V2 시드엔 explicit FK 없어 노이즈만 추가 → 생략.
- **Automations 룰 변경 시 trashedBoards 같은 보존 ❌** — deleteAutomation은 즉시 영구 삭제. 향후 Trash로 옮기는 패턴 통일 검토.
- **Wiki body edit ↔ Verified 상호작용** — body 수정 시 verified는 그대로 유지(자동 unverify ❌). Owner 검증의 의미가 콘텐츠 stability라 매번 unverify는 과함 — 별도 액션으로 분리.
- **acceptSuggestion 룰의 when/then은 placeholder** — 사용자가 명시 편집해야 의미 있음. 룰 편집 UI 부재로 현재는 자기 자신 디자인 추측에 의존.

### 머신
kkh94. main 머지·푸시는 after-work 자동.

---

## 2026-05-24 (kkh94 머신, P1 깊이 일괄) — 컬럼 추가/편집 · Trash/Settings 실작동 · 시드 영어화

### 완료
- **컬럼 추가/편집** (`d911c06`) — Sheet의 가장 큰 갭 해소. 헤더 "+" 셀이 진짜 동작.
  - store: `addColumn`(중복 이름 자동 _2/_3) · `deleteColumn`(id 보호, 행 키 제거) · `renameColumn`(키 migrate) · `updateColumn`.
  - `add-column-menu.tsx` (신규) — Basic 7 type + Library Field 8 동적 노출.
  - `column-header-menu.tsx` (신규) — 헤더 우측 "..." 메뉴. Rename(Dialog, key 보존) + Delete(AlertDialog 확인).
  - `header-cell.tsx`/`sheet-view.tsx` — 정렬 버튼 + 헤더 메뉴 가로 조합 + "+" 셀 활성화.
  - 브라우저 검증: 14→15 헤더, 새 "Number" 컬럼 정상 추가 ✓.
- **Trash + Settings 실작동** (`a4935af`) — status bar 클릭 토스트 스텁 → 실 다이얼로그.
  - types: `TrashedBoard` · `WorkspaceSettings`. store v6→v7 migrate.
  - `deleteBoard` 변경: boards에서 빼고 trashedBoards에 push (복원 가능). 신규 액션: `restoreBoard` / `permanentDeleteBoard` / `emptyTrash` / `updateSettings`.
  - `trash-dialog.tsx` (신규) — 삭제 보드 리스트, 항목별 Restore↺ / Delete forever🗑, Empty trash. relativeTime + empty state.
  - `settings-dialog.tsx` (신규) — Workspace name input + Sidebar initial(1글자) + Storage 21% 프로그레스(stub).
  - status-bar — Trash 버튼에 trashedCount 배지(primary dot). board-header / board-sidebar 하드코딩 "peter's workspace" → `settings.workspaceLabel`/`workspaceInitial`.
  - 브라우저 검증: Settings 다이얼로그 렌더 ✓ (Workspace name input · Sidebar initial · Storage bar).
- **시드 deep 영어화** (`a7a1c77`) — Library / Workspace / Interviews 시드 한국어 자산명/옵션/quote 모두 영어. Status 키는 LOCK 한국어 enum 유지.
  - `flowbase-library-seed.ts`: 모델명/처리방식/사업부 → Model/Handling type/Business unit. 옵션 라벨 단순변심 등 → Buyer's remorse 등. usedIn "Tasks.모델명" → "Tasks.model".
  - `flowbase-workspace-seed.ts`: AUT-004/005 한국어 잔여 + SUG-002 영어화. Status 디스플레이값 영어로(자동화 엔진 미구현이라 기능 영향 0).
  - `flowbase-seed.ts`: 10 인터뷰 한국어 이름·인용 → 영어 (transliteration 유지: Min Jiho, Jo Hyunwoo 등).

### 큰 결정
- **컬럼 추가는 Library Field 단축 진입 포함** — Basic types 7 + Library Fields 8 한 드롭다운에. Library에 정의된 Field를 그냥 골라 추가 가능.
- **renameColumn 라벨만 변경** — 키 보존이 기본. 행 데이터 안 깨짐. 키 변경은 store에 별도 path 있지만 UI는 라벨만.
- **deleteColumn 액션은 Undo ❌** — 행 단위는 undoStack에 있지만 컬럼 변경은 미추적. AlertDialog로 confirm 명시.
- **삭제된 보드는 Trash 보존, 마지막 보드 삭제 ❌** — `deleteBoard`가 boards에서 빼고 trashedBoards에 push. 마지막 보드는 보호. 복원 시 viewByBoardId 함께 복원.
- **Status 키 영어화 ❌** — LOCK 한국어 enum 보존. Library Field 내부의 workflow status 옵션(수거접수/검수중)은 영어화 OK (이건 셀 옵션, TicketStatus 아님).

### 검증
- tsc 0 · vitest 15/15.
- 브라우저:
  - "+" 클릭 → 12 menuitem 노출 ✓
  - "Number" 선택 → headers 14→15 ✓
  - Settings 다이얼로그 모든 필드 렌더 ✓
- localStorage v6→v7 migrate 시 trashedBoards/settings 자동 주입.

### 다음
- 컬럼 헤더 메뉴: Promote to Library / Attach function / Change type 인플레이스.
- Trash: 행 단위 deletedRows · 30일 자동 만료.
- Settings: 멤버/권한 탭 · 테마 프리셋 · 데이터 export.
- 나머지 갭 (감사 보고서): Schema ER 다이어그램 · Automations 실행 엔진 · Wiki 본문 편집 · Gallery/Timeline view · Dashboard builder · Bulk edit · 다중 필드 Filter · 우클릭 메뉴 · Ask AI ⌘J.

### Watch Out
- **컬럼 변경 = undo 비대상** — addColumn/deleteColumn/renameColumn 모두 undoStack ❌. 사용자에게 명시(AlertDialog 메시지).
- **Library Field가 select 타입일 때**: optionListId 참조라 옵션 라벨이 add-column-menu에서 직접 채워지지 않음. 현재는 빈 select로 추가됨. 향후 optionList 자체 inflation 필요.
- **renameColumn 키 변경 path**: 현재 UI는 라벨만 호출 (newName === colName). 키 변경은 store 액션에 있지만 UI 진입점 ❌.
- **Trash deletedAt 시간 만료 없음** — 영구 보관. 30일 만료 정책은 향후.
- **Settings storage bar 21% 하드코딩** — 실제 회계 없음.

### 머신
kkh94. main 머지·푸시는 after-work 자동.

---

## 2026-05-23 (kkh94 머신, 후속 #5) — 감사 + 셸 chrome 보정 (status bar · NavCluster · ⌘K 힌트)

### 완료
- **앱 감사** — 프로토타입 vs 앱 매핑 + 실작동 검증 (Sheet edit/⌘N/Filter/Kanban/Dashboard/Undo/AI fetch/Import 파서). 결론: 핵심 데이터 흐름은 실제 wiring, 빠진 건 편집/관리 흐름 다수.
  - **진짜 작동 (검증함)**: ⌘N(11→12 row 카운트), Filter(11→2 visible), AI Apply all(POST `/api/ai/infer-batch` 500 + graceful toast), CSV 파서("4열·3행" 감지), Kanban 4컬럼 그룹, Dashboard 실집계, ⌘Z Undo(stack pop), ⌘K Search.
  - **의도적 스텁**: Trash/Settings(toast), 2.1/10 GB(하드코딩), activity-bar Settings(`disabled`), Wiki 사이드바 검색(`<input disabled>`), Library asset edit(B3 미구현).
  - **프로토타입 누락**: 컬럼 추가(+) · 헤더 메뉴 · 다중 필드 Filter · ER 다이어그램 · Automations 실행 엔진 · Wiki 본문 편집 · Gallery/Timeline view · Dashboard builder · 우클릭 메뉴 · nav-history(← 이번 세션에 해결) · Ask AI ⌘J.
- **셸 chrome 보정** (`96ff20d`) — 사용자 지적 5건 해결:
  - `components/board/status-bar.tsx` (신규) — 셸 푸터, hide-all 시에도 항상 표시. Trash · Settings · 2.1/10 GB.
  - 사이드바 푸터 + 액티비티 바 Settings 제거 — status bar 단일화.
  - `types/flowbase.ts` `NavEntry` + `navStack`/`navIndex` + 7 액션 자동 pushNav + `goBack`/`goForward`/`jumpToNavEntry`.
  - `components/board/nav-cluster.tsx` (신규) — 시계(history 드롭다운) · ‹ · ›.
  - `board-header.tsx` — NavCluster 배선 + ⌘K Kbd 힌트 + 검색창 클릭→팔레트.
  - `panels-menu.tsx` — Korean → English ("Panels"/"Show all panels"/"Hide all panels").

### 큰 결정
- **사용자 통찰을 LOCK으로 채택** — "Settings/Trash는 hide-all 무관 항상 접근 가능해야". 프로토타입 sidebar 푸터 결함을 우리는 답습 ❌. 새 컨벤션: **셸 푸터 status bar가 영구**.
- **NavCluster는 단순 visual ❌, 실제 history 스택** — 7개 액션 호출이 자동 push, dedup + cap 50. goBack/goForward는 replay 모드(pushNav 우회).
- **검색창 = ⌘K 팔레트 트리거** — 인라인 입력도 유지하되 (헤더에서 즉시 search store 업데이트), 검색창 클릭 자체가 팔레트도 연다.
- **감사를 솔직하게** — 사용자가 "진짜 돌아가는 앱이냐"고 묻기에 모든 핵심 path를 store-DOM-network 레벨로 검증하고 "스텁/Missing/Working" 표로 보고. 갭 숨기지 않음.

### 검증
- `npx tsc --noEmit` 0 · `npm run build` 0 · `vitest run` 15/15.
- 브라우저: ⌘N → store 카운트 +1 ✓ · Filter In-progress → 11→2 visible ✓ · AI Apply all → 실제 POST ✓ · CSV 파서 감지 ✓ · Kanban/Dashboard 렌더 ✓ · Undo ✓ · hide-all 후 status bar 잔존 ✓ · NavCluster 3 버튼 활성/비활성 ✓.

### 다음
- **Trash · Settings 실제 onClick 로직** (현재 toast만). Trash는 store에 deletedItems 추적, Settings는 모달.
- **컬럼 추가 ("+" 셀)** — Sheet의 핵심 갭. `addColumn` 액션 + 헤더 드롭다운(Library Field 선택/타입 선택/+추가).
- **컬럼 헤더 메뉴 (...)** — Promote / Delete / Attach function.
- **시드 deep 영어화** — `flowbase-library-seed.ts` 한국어 자산명 + Customer Interviews 한국어 quote/name.
- **나머지 갭**: ER 다이어그램 · Automations 실행 엔진 · Wiki 본문 편집 · Gallery/Timeline view.

### Watch Out
- **NavStack 인메모리 only** — 새로고침하면 비워짐. persist 추가 시 다른 머신에서 history 혼란 가능. 의도적 ephemeral.
- **pushNav가 모든 navigation 액션에 자동 호출** — 새 액션 추가할 때 nav 트래킹할 거면 pushNav() 끝에 호출. 안 할 거면 (예: setLibView 같은 미세 토글) 호출 생략.
- **status bar는 6 모드 모두에서 표시** — Wiki/Library/Inbox/Search 모드에도 같은 푸터. Trash가 mode-aware 동작해야 할지(예: Wiki 모드에서 Trash 클릭 → 휴지통 페이지)는 미정.
- **활성 disabled 버튼 모두 제거됨** — activity-bar Settings도 사라짐. 사용자가 액티비티 바 외 진입점을 찾을 곳은 status bar 하나.

### 머신
kkh94. main 머지·푸시는 이번 세션 마무리 시 자동 (after-work step 8 정책 적용 중).

---

## 2026-05-23 (kkh94 머신, 후속 #4) — Search 모드 + ⌘K 팔레트 → breadth P0 100%

### 완료
- **Search** (`3771bc8`) — breadth P0 마지막 항목 마무리. **앱 breadth 100% 도달**.
  - `lib/search-index.ts` — `SearchItem` 평면화(table/row/library/wiki) + `filterSearch`(prefix>contains>subtitle>keywords 스코어) + `countByKind`. 인덱스는 호출자가 useMemo로 캐시.
  - `components/search/search-helpers.tsx` — 공통 `KindBadge`(lucide Database/Rows3/Sparkles/BookText) · `HighlightMatch` · `useNavigateSearchItem` 훅. Row 클릭 시 `switchBoard` + `setActivityMode("tables")` + `setSelected([rowId])` + 디테일 바 자동 열림.
  - `components/search/search-palette.tsx` — 640px 모달 (`fixed inset-0 z-50` + blur). store.searchOpen으로 visibility. ↑↓/Enter/Esc 키 네비, kind 그룹 헤더, 결과 카운트 푸터, `data-search-item-id` 셀렉터.
  - `components/search/search-mode.tsx` — activityMode=== "search" 풀페이지. 큰 input + 5탭(All/Tables/Rows/Library/Wiki, 카운트 chips) + 평탄 리스트 200 limit. `data-search-tab` 셀렉터.
  - `types/flowbase.ts` — `FlowBaseState.searchOpen` (ephemeral, 비-persist).
  - `lib/flowbase-store.ts` — `setSearchOpen` 액션.
  - `lib/keyboard-shortcuts.ts` — `⌘K` → `setSearchOpen(true)`. 편집 중에도 동작.
  - `app/page.tsx` — `activityMode === "search"` → `SearchMode`. `<SearchPalette />`는 항상 마운트.
  - **삭제**: `components/board/coming-soon-mode.tsx` — 마지막 사용자(search 스텁)가 실 구현으로 대체.

### 큰 결정
- **두 진입점, 공통 인덱스/필터** — ⌘K 모달(가벼운 인터럽트 검색)과 풀페이지 모드(긴 세션 탐색)가 같은 `buildSearchIndex` + `filterSearch`로 일관성. UI만 다름.
- **모달은 항상 마운트, store가 visibility 제어** — `if (!open) return null`로 빠른 unmount. ⌘K 단축키는 store 액션만 호출 → 셸/모달 결합도 낮음.
- **Row 검색 액션은 detailBar 자동 활성화** — 행을 찾아 클릭한 의도가 명확하므로, 닫혀 있던 디테일 바도 함께 열어 즉시 행 컨텍스트 노출.
- **외부 lib 미사용** — cmdk(shadcn command)는 그루핑/스코어 정책이 우리 요구와 다름. fixed div + 키 핸들러로 직접 작성 (Wiki 마크다운 렌더러와 같은 정책).

### 검증
- `npx tsc --noEmit` 0 · `npm run build` 0(정적 6/6) · `vitest run` 15/15.
- 브라우저: ⌘K 입력 → 모달 출현 · input 자동 포커스 · "lib" → LIBRARY+ROWS 21 결과 · "glossary" → WIKI 1결과 + 매치 하이라이트 · Enter → Wiki Glossary 페이지 모드로 전환 + 사이드바 selection 동기화 · Search 풀페이지 탭 카운트(All 44 / Tables 2 / Rows 18 / Library 18 / Wiki 6) 합산 정확 · Wiki 탭 필터링 6개만.

### 다음
**Breadth 100% — 다음은 깊이/품질 작업**:
- 시드 deep 영어화 (`flowbase-library-seed.ts` 한국어 자산명·옵션 라벨 + `flowbase-workspace-seed.ts` 룰 잔여 + Customer Interviews 시드)
- B3 Library 인라인 편집
- 반응형 fix (~800px)
- AI 실호출 검증 (`ANTHROPIC_API_KEY`)
- Wiki 페이지 편집 UI + sanitize
- B4 (가장 마지막, 사용자 명시) — 컬럼↔Library 자산 링크 · "Use in table" · 템플릿으로 보드 생성

### Watch Out
- **`buildSearchIndex` 호출 시점** — 모달은 open 시 매번 재인덱싱(`useMemo` deps에 `open` 포함). 모드는 데이터 자체에 deps 묶음. 데이터 폭증 시 worker 분리 후보.
- **모달은 mount-always 패턴** — `if (!open) return null`로 unmount하지만 store 구독은 유지. 무거워지면 SSR `'use client'` 경계 살펴볼 것.
- **Search 모드 input 자동 포커스** — `useEffect(() => inputRef.current?.focus(), [])`. mode 재진입 시에도 매번 포커스.

### 머신
kkh94. main 머지 진행 — after-work step 8 무조건 정책.

---

## 2026-05-23 (kkh94 머신, 후속 #3) — Wiki 모드

### 완료
- **Wiki 모드** (`01a7ae7`) — breadth P0 마지막에서 두 번째 항목 마무리.
  - `types/flowbase.ts` — `WikiPage` 인터페이스 + `FlowBaseState.wikiPages` · `wikiSelectedId` 추가.
  - `lib/flowbase-wiki-seed.ts` — 6 페이지 시드 (Library guide · CS case handling · Keyboard shortcuts · New hire onboarding(draft) · Glossary · Team directory). 콘텐츠는 영어화(시드 deep 번역 P1 정책과 일관).
  - `lib/flowbase-store.ts` — `setWikiPage` · `updateWikiPage` 액션, **v5→v6 migrate** (기존 persisted state에 wikiPages 비어 있으면 시드 주입), partialize 갱신.
  - `components/wiki/markdown-body.tsx` — 의존성 0인 미니 마크다운 렌더러 (h1~h3 · ul · ol · table · inline `code` · `**bold**`). 외부 lib ❌.
  - `components/wiki/wiki-sidebar.tsx` — 카테고리 트리 + DRAFT 배지(unverified) + 활성 페이지 좌측 바 강조. `data-page-id` 셀렉터.
  - `components/wiki/wiki-page.tsx` — 제목 · 브레드크럼 · Owner 아바타 · Verified pill(만료 시 빨간 배너 + Re-verify) · Mark as verified(unverified만).
  - `components/wiki/wiki-mode.tsx` — 셸 ([사이드바 | 페이지]).
  - `app/page.tsx` — activityMode === "wiki" → `WikiMode`.
  - `components/board/coming-soon-mode.tsx` — wiki/library/inbox INFO 항목 제거. 이제 Search 모드만 스텁.

### 큰 결정
- **외부 마크다운 라이브러리 ❌** — `react-markdown`/`remark`-류 도입 대신 시드 마크다운 범위에 맞춘 미니 렌더러를 직접 작성. 의존성 무게 회피 · 시드/사용자 입력이 모두 워크스페이스 내부라 sanitize 단순.
- **Wiki 시드는 영어로** — 사용자 명시 "영어버전" 정책과 시드 deep 번역 P1 일관. Library 시드(`flowbase-library-seed.ts`)의 한국어 잔존은 별도 패스로.
- **store version v5 → v6 (migrate)** — 기존 persisted state에 `wikiPages`가 없거나 비어 있으면 자동 주입. Tasks 보드 v4→v5 패턴 답습.

### 검증
- `npx tsc --noEmit` 0 · `npm run build` 0 (정적 6/6) · `vitest run` 15/15.
- 브라우저: Wiki 모드 진입 → 사이드바 5 카테고리(Concepts/Onboarding/Reference/Runbooks/Team) · 페이지 6개 · DRAFT 배지 · 활성 페이지 강조 · 마크다운 헤딩/리스트/inline code/bold/테이블 모두 렌더 · 페이지 전환 · "Mark as verified" 클릭 시 DRAFT 배지 사라지고 Verified · 90d left pill로 전환 (Re-verify TTL=90d).

### 다음
**Breadth 마지막**: Search 팔레트(⌘K) 만 남음 — `design-ref/prototype/search-palette.jsx` 참조. 이후 시드 deep 영어화 · B3 Library 편집 · 반응형 fix · B4 테이블 연동(가장 마지막).

### Watch Out
- **`react-markdown` 미사용** — 시드 마크다운 문법만 지원. 사용자가 wiki 페이지 편집 UI를 만들 때 입력 sanitize는 부재(현재는 시드만이라 OK).
- **`wikiPages` partialize 포함** — Wiki 페이지 편집은 localStorage에 즉시 반영.
- **dev server 충돌** — 이번 검증 중 `npm run dev`가 이미 :3000에 떠 있어 새 백그라운드 시작 실패 → 기존 서버 재사용으로 해결. 다음 세션에서도 dev 떠 있으면 preview MCP가 reuse한다.

### 머신
kkh94. main 머지·push는 이번 세션 마무리 시 무조건 진행 (after-work step 8 정책).

---

## 2026-05-23 (kkh94 머신, 이어서) — Phase B Library B1·B2 · Workspace Automations · Inbox · Detail bar · English UI · Tasks 보드

### 마무리 — 모든 작업 main 머지·푸시 완료
후속 작업물 6 커밋 + docs sync + after-work 룰 변경(step 8 무조건 포함)까지 모두 `main`에 fast-forward 머지·푸시 완료(`origin/main` = `bb84e56`+). 다른 머신: `git checkout main && git pull` 한 줄로 이어가기.

### 완료
- **Phase B B1 — Library 브라우즈** (`4148c96`) — 5 카테고리(optionLists/fields/templates/functions/dashboards) TS 타입 + 시드(`flowbase-library-seed.ts`) + 스토어 슬라이스 + LibrarySidebar 트리 + CategoryCatalog 카드 그리드 + 셸 모드 분기. 읽기 전용.
- **Phase B B2 — Library 디테일** (`5bf1ef5`) — `components/library/asset-detail.tsx` (5 카테고리 디테일: OptionList 옵션 목록·Field config·Template 필드+멀티테이블·Function params/example·Dashboard 차트 메타). `selectAsset(category, id)` 원자 액션 추가 — cross-category 클릭 버그 해결. `data-asset-id` 테스트 셀렉터.
- **Workspace > Automations** (`41b7257`) — `components/workspace/automations-view.tsx`(룰 카드 When/Then·status pill·runs/lastRun + AI Suggestions confidence%) + Schema/Automations 탭 + `flowbase-workspace-seed.ts`(5 룰 + 3 AI 제안). `ActiveWorkspaceItem` 타입.
- **Inbox 모드** (`620dadb`) — `components/inbox/inbox-view.tsx` 워크스페이스 상태 파생(AI pending·자동화 제안·빈 테이블·미사용 자산·활동 로그). 6 kind + 필터 chips + 액션→해당 모드 네비.
- **Detail bar (4번째 패널)** (`f3feae2`) — `PanelState.detailBar` 추가. `components/board/detail-bar.tsx` (선택/포커스 행 디테일). PanelsMenu에 체크박스 + ⌘I. TablesMode 통합. `data-panel-id` 셀렉터.
- **English UI + Trash/Settings + Tasks 보드** (`605b9f3`) — 20 파일 변경:
  - UI chrome 한국어→영어 (17+ 파일: board-sidebar/header, tables-mode, ai-activity-panel/composer/pending-card, filter-chips, kanban-view, editable-cell, schema-view, detail-bar, inbox-view, automations-view, coming-soon-mode, library-sidebar, asset-detail).
  - `STATUS_LABELS` 맵(types/flowbase.ts) — Status 디스플레이만 영어, 키는 LOCK 한국어 보존.
  - board-sidebar 푸터: Trash · Settings 아이콘 + 2.1/10 GB stub.
  - `lib/flowbase-tasks-seed.ts` — 2번째 시드 보드 (Tasks, 8행, id·title·assignee·status·priority·due).
  - store v4→v5 migrate — 기존 persisted state에 Tasks 자동 주입.

### 큰 결정
- **breadth 우선 (사용자 명시)** — Phase A 셸 완성 후 B3 Library 편집/B4 테이블 연동 대신 워크스페이스 breadth 완성을 우선 ("우선은 목업 퀄리티와 기능들을 완벽하게 구현해내는 게 최우선"). Library B1·B2, Workspace Automations, Inbox, Detail bar, Tasks 보드, 영어화 순.
- **Status는 LOCK 한국어 키 보존, `STATUS_LABELS` 맵으로 디스플레이만 영어** — MEMORY Key Design #8(Status 색 매핑 한국어 키 기반) 호환. 시맨틱 키-색 매핑 그대로, 라벨만 영어("Todo/In progress/Waiting/Done").
- **`selectAsset(category, id)` 원자 액션** — Library 사이드바에서 cross-category 자산 클릭 시 libCategory + libAssetId 동시 업데이트. 기존 `setLibAsset`만 사용 시 카테고리 미동기로 `assetExists` false → 디테일 미렌더 버그.
- **Detail bar는 Tables 모드에서만 콘텐츠** — 다른 모드는 토글되어도 빈(UX).
- **Tasks 보드 시드 + store v4→v5 migrate** — `flowbase-tasks-seed.ts`로 2번째 시드 보드(CS Operations 도메인) 추가. 기존 사용자 persisted state에 자동 주입.

### 검증
- 각 커밋 시점 `tsc --noEmit` 0 · `npm run build` 0 · `vitest run` 15/15.
- 브라우저 검증: Library 5 카테고리 트리 + 카탈로그 + 자산 디테일(Field·Function 확인) · Workspace Automations 탭 5 룰 + AI 제안 · Inbox 11 파생 항목 + 필터 카운트 · Detail bar 토글 시 보드와 AI 패널 사이 렌더 · English UI 전반 (Customer Interviews + Tasks 사이드바, Todo/In progress/Waiting/Done 영어 라벨, Trash/Settings 푸터).
- after-work 시점 재검증: tsc 0 · vitest 15/15.

### 다음
**Breadth 마무리**: Wiki 모드 + Search 팔레트(⌘K) — 둘 다 현재 스텁. 이후 시드 deep 영어화·B3 Library 편집·반응형 fix·B4 테이블 연동(가장 마지막). 자세히는 `NEXT-ACTION.md`.

### Watch Out
- **13 커밋 ahead of origin/main** — main은 `4d71c8a` 그대로. 다른 머신 이어가기는 브랜치 checkout(`claude/wizardly-murdock-451e3d`) 또는 머지 후 main pull.
- **~800px 반응형 깨짐** — Tables 모드에 4-5 패널 동시 표시 시 cramped. 미해결.
- **시드 deep 영어화 미완** — `flowbase-library-seed.ts`(모델명·처리방식·사업부·옵션 라벨), `flowbase-workspace-seed.ts` 룰 잔여, Customer Interviews 한국어 quote/name 잔여.
- **`ANTHROPIC_API_KEY` 미설정** — AI 라우트 실호출 미검증.
- **STATUS_LABELS 도입 (types/flowbase.ts)** — 신규 status 디스플레이는 `STATUS_LABELS[s]` 사용. 직접 `{s}` 렌더 ❌.
- **테스트 셀렉터 속성** (`data-asset-id`, `data-panel-id`, `data-workspace-item`) — UI 코드에 추가됨. 새 인터랙티브 요소도 같은 패턴 권장.

### 머신
kkh94. 다음 머신: before-work 시 — main이 안 머지 됐으면 브랜치에서 이어갈 것.

---

## 2026-05-22~23 (kkh94 머신) — before/after-work 명령어 · Phase 3 Q1 · 죽은코드 정리 · 앱 범위 재정의(Phase A) · Library 설계(Phase B)

### ✅ 마무리 — 6 커밋 + docs, `main` 머지·푸시 완료
- 작업을 `claude/wizardly-murdock-451e3d` 워크트리 브랜치에 커밋 → **`main` 머지·푸시**.
- 다른 머신: `git fetch && git checkout main && git pull && npm install`.

### 완료
- **before/after-work 명령어** (`2cbf01a`·`d2ad4ea`) — `~/.claude/commands/`(머신 로컬·미동기화) 대신 `<repo>/.claude/commands/`에 프로젝트 커맨드로 생성. `.gitignore`에 `!.claude/commands/` 예외 추가 → git 추적, 모든 머신 sync. before-work=git pull 중심, after-work=커밋·push·머지 중심.
- **Phase 3 Q1** (`afa39f1`) — `infer-batch`의 `row.quote` 하드코딩을 `sourceField` 인자로 일반화. API·`flowbase-ai.ts`·`ai-activity-panel.tsx`·테스트. vitest 13→15.
- **옛 V1 코드 정리** (`4fa804a`) — V2에서 도달 불가능한 V1 파일 20개 삭제(−7,025줄): `app-sidebar`·`breadcrumb-bar`·`quick-switcher`·`workspace-switcher`·`sections/*-section` 6개·`sections/sheet/*` 4개·`mock-*` 3개·`view-utils`·`trash/workspaces` 라우트. `tokens.ts`는 `mock-data`의 `Tone`/`ChartColor` 타입을 인라인해 의존 제거.
- **Phase A — 앱 셸 6모드 라우터** (`daad859`) — 액티비티 바를 아이콘 2개 → 6모드 레일(Inbox·Tables·Workspace·Library·Wiki·Search). `app/page.tsx`를 `activityMode` 라우터로, Tables 보드 본체를 `tables-mode.tsx`로 추출. **Schema를 Tables 뷰 탭 → Workspace 모드로 이동.** Library/Wiki/Inbox/Search는 "준비 중" 스텁.
- **Phase B 설계** — `docs/02-design/features/flowbase-v2-library.design.md` (Library 서브시스템, 서브단계 B1~B4).

### 큰 결정 — 앱 범위 재정의
- **"Phase 1~6 완료"는 과대 기재였음.** 사용자 지적 + 프로토타입 정독 결과: 프로토타입은 6 액티비티 모드(Inbox·Tables·Workspace·Library·Wiki·Search)를 그리는데 V2는 **Tables 모드 하나**만 구현 — 앱의 약 1/6. docs의 "브라우저 동작 확인 완료"는 넓은 화면 한정.
- **Schema = Workspace 서브시스템** — `prototype-app.jsx` L63(`Migrate stale "schema" view (now a workspace-level item)`)·L95(`activeWorkspaceItem: "schema"|"automations"`). Phase 6 D3("Schema = 4번째 뷰 탭")를 번복. `ViewMode`에서 `schema` 제거.
- **Library 먼저** — 나머지 서브시스템 중 Library가 가장 구조적(컬럼·옵션 정의 레이어). Wiki·Inbox·Search는 이후.
- **BaaS(옛 Phase 7) 후순위** — 서브시스템 구축이 우선.
- before/after-work는 프로젝트 커맨드로 (글로벌 `~/.claude/`는 머신 간 sync 안 됨 — 이번 머신에 명령어가 없던 이유).

### 검증
- Phase 3 Q1·정리·Phase A 각각 `tsc` 0 · `build` 0 · `vitest` 15/15.
- Phase A: preview 브라우저에서 6모드 액티비티 바 + 모드 전환(Library 스텁 · Workspace=Schema · Tables 복귀) 확인.
- after-work 시점 재검증: tsc 0 · build 0 · vitest 15/15.

### 다음
**Phase B — Library 서브시스템 B1 구현.** 설계 `flowbase-v2-library.design.md` §5의 7단계. `NEXT-ACTION.md` 참조.

### Watch Out
- **~800px 반응형 레이아웃 깨짐** — 4패널이 좁은 폭에서 무너짐(AI 패널이 보드 덮음). 미해결 — 서브시스템 구축 뒤 별도 작업. 사용자 우선순위: 기능 > 반응형.
- `ANTHROPIC_API_KEY` 미설정 — AI 실호출 미검증.
- 콘솔 script-tag 경고 6개 — preview 환경/기존, Phase A 코드 무관.
- `pnpm-lock.yaml` 중복 — 빌드 경고(무관, 기존).
- docs의 옛 "Phase 7 BaaS가 다음" 서술은 이번 세션이 재정의 — NEXT-ACTION·MEMORY·CONTEXT·TODO 모두 갱신함.

### 머신
kkh94. 다음 머신: before-work 시 `main` 동기화.

---

## 2026-05-21 (kkh94 머신, 이어서) — Phase 4·5·6 구현 (Kanban·Dashboard · 앱 셸 · 멀티보드·Schema)

### ✅ 마무리 — 커밋·푸시·main 머지 완료
- 작업물을 `feat/kanban-dashboard`에 커밋(`df7eeb4` 코드 + 후속 docs 커밋) → origin 푸시 → **`main` 머지·푸시** 완료.
- 다른 머신: `git fetch && git checkout main && git pull && npm install`.

### 완료
- **Phase 4 (Kanban + Dashboard)** — 설계 + 구현. `components/board/view-switcher`(Sheet|Kanban|Dashboard 탭) · `components/sections/{kanban,dashboard}-view` · `components/charts/*`(recharts donut/bar + div 막대). Kanban=status 칸+이동 버튼(DnD ❌). Dashboard=제네릭 집계. page 뷰 분기. **버그 수정**: `selectVisibleRows` 직접 구독 → 무한 루프 → 의존 슬라이스 구독 + useMemo.
- **Phase 5 (앱 셸)** — 설계 + 구현. `components/board/*`(activity-bar·board-sidebar·board-header·panels-menu·edge-collapse·expand-tab·filter-chips). page 셸 레이아웃 [액티비티바|사이드바|보드|AI패널] + 패널 조건부 렌더. `keyboard-shortcuts` 확장(⌘⇧A·⌘⇧F·⌘B·⌘N). **버그 수정**: 시트 체크박스 정렬(헤더 X 4px 어긋남 + 행 높이 소수점 jitter → `text-center`·`h-12`·`block mx-auto`).
- **Phase 6 (멀티보드 + Schema)** — 설계 + 구현. 스토어 `renameBoard` · 사이드바 보드 `…` 메뉴(rename 인라인/delete, 마지막 보드 보호) · `schema-view`(전 보드 컬럼 인벤토리 카드 + fk 관계) · `ViewMode += "schema"` 4번째 탭.
- 설계 문서 3개: `flowbase-v2-phase{4,5,6}.design.md`.

### 큰 결정
- Kanban 카드 이동 = 버튼 (DnD 라이브러리 ❌, Phase 4 D1).
- Dashboard = 제네릭 집계 (interview 전용 하드코딩 폐기, Phase 4 D3). 차트 = div 막대 + recharts hero 2개 혼합.
- **Schema = 4번째 뷰 탭** — Phase 1의 "schema ≠ view" 노트를 MVP 단순화 위해 번복 (Phase 6 D3). active board 무관 워크스페이스 렌더.
- 옛 V2-미사용 코드 정리는 별건 — `tokens.ts`가 `mock-data` 타입 의존 등 얽힘 (Phase 6 Q2).

### 검증
- `tsc` green · `npm run build` green · vitest 13/13 · 브라우저: 4뷰 전환·Kanban 이동·Dashboard 차트·패널 토글(키보드/햄버거/엣지)·보드 rename/delete·Schema 뷰 — 모두 확인. 콘솔 getSnapshot 에러 0 (직접 카운터 검증).

### 다음
- **Phase 7 (BaaS)** — V2 7단계 중 마지막. `docs/01-baas-decision.md`(Supabase vs bkend.ai) 결정이 블로커. `NEXT-ACTION.md` 참조.

### Watch Out
- (해결됨) `feat/kanban-dashboard` 커밋·푸시 + `main` 머지 완료 — origin/main이 Phase 1~6 전체 포함.
- `ANTHROPIC_API_KEY` 미설정 — AI 실호출(infer-batch/ask/analyze-import) 여전히 미검증.
- **`selectVisibleRows`를 zustand 셀렉터로 직접 구독 ❌** — 새 배열 반환해 무한 루프. 의존 슬라이스 구독 + `useMemo` 패턴 필수 (Phase 4 교훈, sheet-view 패턴).
- 옛 V2-미사용 코드 정리 미완 — 별건 (NEXT-ACTION 참조).
- `feat/sheet-view-v2`·`feat/kanban-dashboard` 브랜치 origin 잔존 (삭제 선택).

### 머신
kkh94. 다음은 또 다른 머신 — before-work 시 `main` 동기화.

---

## 2026-05-21 (kkh94 머신, 이어서) — Phase 1B·2·3 구현 (시트 뷰 · AI 패널 · Import)

### ✅ 마무리 — 커밋·푸시·main 머지 완료
- 이 세션 작업물을 `feat/sheet-view-v2`에 커밋(`eb31064`) → origin 푸시 → **`main` 머지·푸시**까지 완료.
- git 식별자는 저장소 로컬 config로 설정(peterkwon248). 다른 머신에서 `git fetch && git checkout main && git pull`로 이어가면 됨.

### 완료
- **before-work** — `peterkwon248/FlowBase` clone, `npm install`
- **Phase 1B (시트 뷰)** — `components/sheet/*` (cell-popover·editable-cell·header-cell·new-row-stub·sheet-view) + `use-sheet-keyboard`/`use-sheet-clipboard`(M4/M5 이식). `app/page.tsx` V2 보드 페이지. 버그 수정: tailwind-merge가 `outline` 스타일 클래스 제거 → 포커스 표시를 `ring`으로 교체.
- **Phase 2 (AI 패널 + Claude)** — 설계 문서 + 구현. `app/api/ai/{_anthropic,infer-batch,ask}` · `lib/flowbase-ai.ts` · 스토어 `acceptAllAi`/`dismissAllAi`/`pushAi` · `components/ai/*` · page 우측 패널 슬롯 + `Toaster`. vitest 도입(infer-batch 5 테스트).
- **Phase 3 (Import 모달)** — 설계 문서 + 구현. `app/api/ai/analyze-import` · `components/import/*` (3-step 위저드) · `createBoard(label,columns?,rows?)` 확장 · 헤더 Import 버튼 · `app/txt-poc` + `lib/parsers/txt-block-parser.ts` 제거. parsers 8 테스트. 버그 수정: import 시 `id` 컬럼명 충돌 → dedup.
- 설계 문서 3개: `docs/02-design/features/flowbase-v2-phase{1,2,3}.design.md` (Phase 1은 기존, 2·3은 신규).

### 큰 결정
- **Phase 2 모델 = `claude-sonnet-4-6`** — claude-api 스킬 기본값은 `claude-opus-4-7`이나, 핸드오프 AI-CONTRACTS + 설계 D2가 Sonnet 지정 + 대량 분류 작업이라 채택. `_anthropic.ts`의 `AI_MODEL` 단일 상수.
- **"Apply all" = Claude infer-batch 호출 + `confirmed:true` 적용**, ⌘Z가 검토 백스톱 (Phase 2 D1).
- **Import = 새 제네릭 보드 생성** — 프로토타입/IMPORT-SPEC §3의 고정필드 휴리스틱 매퍼 폐기 (Phase 3 D1, Phase 1 D4 일관).
- vitest 최소 도입 (Phase 2 Q2).

### 검증
- `tsc --noEmit` green · `npm run build` green (5 라우트) · vitest **13/13** (parsers 8 + infer-batch 5) · 브라우저 동작 확인 (시트 편집·키보드 네비·AI 패널 pending/error toast·Import 3-step 흐름·새 보드 생성). AI 실호출은 키 미설정이라 graceful 에러 경로까지만 검증.

### 다음
1. `.env.local`에 `ANTHROPIC_API_KEY` → AI 실호출 검증.
2. Phase 4 (Kanban + Dashboard) — `main`에서 새 브랜치 분기. `NEXT-ACTION.md` 참조.

### Watch Out
- (해결됨) 작업물은 `feat/sheet-view-v2` 커밋·푸시 + `main` 머지 완료 — origin/main이 이번 세션 결과를 포함. `feat/sheet-view-v2` 브랜치는 origin에 잔존(삭제 선택).
- `ANTHROPIC_API_KEY` 미설정 — 사용자가 마지막에 설정 예정. AI 실호출(infer-batch/ask/analyze-import) 미검증.
- 커밋 시 `next-env.d.ts`(빌드 생성물)·`package-lock.json`(npm install) 변경이 incidental하게 섞여 있음 — 포함 여부 판단.
- Phase 3 Q1: `infer-batch`가 `row.quote` 하드코딩 — 임포트 보드에 `quote` 컬럼 없으면 AI 추론 입력 빈약 (소스 컬럼 일반화는 후속).
- Phase 3 Q2: import 후 새 보드 전환 시 Phase 6(멀티보드 사이드바) 전까지 시드 보드 복귀 UI 없음.
- 프로젝트 eslint는 flat config 부재로 `npm run lint` 동작 안 함 (기존 이슈, 빌드는 무관).

### 머신
kkh94 (`C:\Users\kkh94\OneDrive\Desktop\FlowBase`) — CLAUDE.md 기재 경로(`kwonkyunghun/.../flowdb-port`)와 다른 머신. 다음 작업은 또 다른 머신 예정.

---

## 2026-05-21 (집) — FlowBase V2 재구축 착수: 계획·설계·Phase 1A

### 완료
- **design-ref/ V2 핸드오프 분석** — 핸드오프 6문서 + 프로토타입(`prototype-app.jsx` 등 40여 jsx) 정독
- **V2 7단계 재구축 계획** — `docs/01-plan/features/flowbase-v2.plan.md`
- **Phase 1 design** — `docs/02-design/features/flowbase-v2-phase1.design.md`
- **`feat/flowbase-v2` 브랜치** — `feat/sheet-view` 기반 분기
- **Phase 1A 기반 구현** (커밋 `360de73`) — `types/flowbase.ts`, `lib/flowbase-store.ts`, `flowbase-seed.ts`, `undo-stack.ts`, `parsers.ts`, `keyboard-shortcuts.ts`
- **Phase 1A 재작업** (커밋 `bc8f263`) — 프로토타입 정독 후 제네릭 컬럼 구동 모델로 전면 수정
- `components/sheet/ai-pending-mark.tsx` (Phase 1B 첫 컴포넌트)
- after-work로 `feat/flowbase-v2` → main squash 머지

### 브레인스토밍 & 큰 결정
- **V2 클린 재구축** — 기존 3섹션 UI를 V2 보드 UI로 대체. `feat/sheet-view`의 M1~M5(옛 모델 시트 트라이얼)는 머지 안 하고 *패턴만 이식*
- **핸드오프 ≠ 프로토타입** — 핸드오프 STATE-SHAPES는 프로토타입의 단순화판. 실제 V2는 제네릭 컬럼 구동(10 cell type, 다중 테이블). 일부만 읽고 Phase 1A를 핸드오프 기준으로 지었다가, 사용자 지적 후 프로토타입 정독 → 제네릭 모델로 재작업
- **`dismissAiCell` = 값 유지** + confirmed=true (프로토타입 `onDismissAi`)
- **theme은 next-themes 소유** — V2 스토어 제외
- 진행 방식: design-first (계획 → 설계 문서 → 검토 게이트 → 코드)

### 다음
- Phase 1B (시트 뷰) — `components/sheet/*` + 보드 페이지. NEXT-ACTION.md 참조

### Watch Out
- **after-work로 미완성 Phase 1이 main에 머지됨** — Phase 1A 기반만 있고 동작하는 V2 화면 없음(app/page.tsx는 아직 옛 3섹션). M1~M5 + design-ref(23k줄)도 main에. Phase 1B는 main 위에서 이어감
- **레퍼런스(프로토타입)는 구현 전 끝까지 정독** — 이번 세션 교훈
- 범위: 프로토타입엔 Library/Wiki/Inbox/Automations 등 핸드오프 7단계 밖 서브시스템 — MVP(7단계) 후 재논의

### 머신
집

---

## 2026-05-07 오후 (집) — taste-skill 도입 검토 + Geist fix

### 완료
- **taste-skill 도입 검토** ([docs/01-plan/features/taste-skill-adoption.plan.md](01-plan/features/taste-skill-adoption.plan.md))
  - 13개 스킬 매트릭스 분석, FlowBase 정렬도 70% 확인 (Phosphor ✅, Geist ✅, shadcn, Linear)
  - 4개 도입 옵션 평가 → **옵션 2 (minimalist-skill 단일)** 채택
- **minimalist-skill SKILL.md 다운로드**: `docs/design-skills/minimalist-skill/SKILL.md` (git tracked, 85 lines, MIT 라이선스)
- **프로젝트 가드 룰 작성**: [CLAUDE.md](../CLAUDE.md) (project root)
  - 디자인 우선순위 1·2·3 (MEMORY → tokens → minimalist-skill)
  - LOCK 상수: Status 색 매핑, Phosphor, Geist, FlowBase 명칭
  - FlowBase 가드 매트릭스 (minimalist-skill 권장 vs FlowBase 현실)
  - 트라이얼 결정: `feat/sheet-view`에서 적용 → 1주 평가
- **Geist 폰트 fix** (별건):
  - `app/layout.tsx`: `Geist({ variable: "--font-geist-sans" })` + `<html className={geistSans.variable}>`
  - `app/globals.css`: `--font-sans: var(--font-geist-sans), 'Geist Fallback', system-ui, sans-serif`
  - 이전: variable 연결 없이 `'Geist'` string만, 실제 적용 ❌
- **MEMORY.md Key Design Decision #9, #10 추가** (taste-skill 도입, Geist fix)
- **NEXT-ACTION.md 갱신**: 다음 행동을 옵션 A 시트 뷰 트라이얼(minimalist-skill 적용)로 단일화

### 큰 결정
- **옵션 2 (minimalist-skill 단일)** 채택 — 옵션 3(다이얼 조합)은 복잡도 비대 회피, 옵션 4(redesign-skill만)는 신규 컴포넌트 폴리시 부족
- **세리프 헤딩 도입 ❌** — 앱(데이터 보드)은 산스 톤이 적합. minimalist-skill 권장 Lyon Text/Newsreader/Playfair는 미적용
- **framer-motion 자동 설치 ❌** — MOTION_INTENSITY 1-3만 (정적 ~ 미세 hover/fade). 데이터 보드에 화려한 모션 ❌
- **Status 색 매핑 보존** — 어떤 도입에도 절대 override ❌ (LOCK)
- **`.claude/`는 통째로 gitignored** — SKILL.md를 docs/design-skills/에 git tracked로 둠 (cross-machine sync). install은 명시 reference 패턴

### 다음
1. **옵션 A 시트 뷰 트라이얼 (다음 세션)** — `feat/sheet-view` 브랜치에서 PDCA design 작성 → 구현
2. minimalist-skill 1주 평가 후 본격 도입 또는 후퇴 결정

### Watch Out
- **`feat/sheet-view` 브랜치는 origin 미push** — 다음 세션에서 push 후 PR 작업
- **NEXT-ACTION.md 하단 "폐기된 행동" 섹션** — 원본 옵션 A·B·C 내용 참고용 보존. 시간 지나면 정리
- **CLAUDE.md (project)는 신규** — `before-work` 시 4번째로 읽도록 권장 (Source of Truth는 docs/MEMORY.md, CLAUDE.md는 가드/lock 룰)

### 머신
집

---

## 2026-05-07 오전 (집) — before-work 동기화

### 완료
- **GitHub 레포 rename 확인**: `peterkwon248/flowdb` → `peterkwon248/FlowBase` (GitHub에서 이미 rename 됨, 로컬 origin도 `set-url`로 갱신)
- **18 commits pull (fast-forward)**: PR #3·PR #4 + 2026-05-05 직접 커밋 4건
- **docs 정합성 갱신**: `NEXT-ACTION.md` (날짜/경로/PR 완료), `CONTEXT.md` (Current Features), `TODO.md` (완료 항목), `SESSION-LOG.md` (이 entry), `docs/MEMORY.md` (이미 직전 세션에서 갱신됨 — 그대로)
- **Local memory rehydrate**: `~/.claude/projects/.../memory/project_flowdb_status.md` → 2026-05-07 상태로 갱신

### 직전 세션과의 변경
- 폴더 이름 `Desktop/FlowDB/` → `Desktop/FlowBase/`로 변경됨 (사용자 직접 변경 또는 다른 머신)

### 다음
**다음 라운드 결정 — 옵션 A·B·C 중 사용자 선택 대기 (추천 A).**

### Watch Out
- **NEXT-ACTION.md "환경 정보"의 *모든 경로* 갱신 완료** — 다음 머신/세션 시작 시 stale 안 되도록 주의

### 머신
집

---

## 2026-05-05 ~ 2026-05-07 (mixed: v0.dev / claude.ai / 직접 커밋)

> 직접 작성된 SESSION-LOG entry 없음. PR/commit 메타데이터에서 재구성.

### 완료
- **PR #3 머지** (`aa4f353`, 2026-05-05) — `visual-design-update` (v0[bot] 작업)
  - Phosphor status/priority 아이콘 (`95a1558`)
  - light/dark 컬러 최적화 (`28fc0681`)
  - "Add Ticket" → "Add Task" + 아이콘 추가 (`9e12305`)
  - 워크스페이스 셀렉터 드롭다운 (`ec738d4`)
  - 채널 = 아이콘+텍스트 결합 (`897439f`)
- **2026-05-05 직접 커밋 4건** (committer: `ludimast`, claude.ai 추정)
  - `cc90196` fix: TS errors + lockfile drift (PR #3 후처리)
  - `8f597b0` feat: **FlowBase 리브랜드** + status pill 통합 디자인
  - `e3f8208` style: 미처리 status color slate → **blue**
  - `ced9799` docs: MEMORY.md 갱신 (rebrand session)
- **PR #4 머지** (`2e99933`, 2026-05-07) — `claude/awesome-almeida-b95309` (claude.ai 추정)
  - Linear+shadcn 디자인 overhaul (`be6ae15`)
  - Trash 페이지/섹션, sidebar entry (`8feecf4`, `ac3a...`, mock 포함)
  - Workspaces UX (페이지 + 섹션 + switcher)
  - Quick switcher, Breadcrumb bar, Settings section
  - Design tokens 시스템 (`DESIGN-TOKENS.md`, `lib/tokens.ts`)

### 큰 결정 (커밋/MEMORY에서 추출)
- **제품명: FlowDB → FlowBase** (사용자 노출). 내부 docs/spec의 "FlowDB" 표기는 점진 정리 (긴급 ❌)
- **Status 색 매핑 합의**: 미처리=blue (red ❌, priority Urgent 충돌), 진행중=amber, 대기=violet, 완료=emerald
- **Status indicator는 단일 pill** (아이콘+이름+카운트 통합. 분리된 count 배지는 -100 shade에서 안 보임)

### Watch Out
- **이 entry는 재구성**: 실 작업 흐름의 디테일/브레인스토밍 내용은 누락. PR description/commit message만으로 복원 가능한 부분만 기록
- **3개 환경 mixed**: v0.dev (PR #3 빌드) + claude.ai (PR #4, 일부 직접 커밋) + 로컬 (머지) — 다음 작업은 어느 환경이든 *origin/main 기준*으로 시작

### 머신
mixed (v0.dev / claude.ai / 집 로컬)

---

## 2026-05-04 오후 (집)

### 완료
- **txt 블록 자동 분류 PoC 구현 + 머지** — PR #1 (`feat: txt 블록 자동 분류 PoC`, `fac55e1`)
  - `lib/parsers/txt-block-parser.ts`: `***` 구분자 + `<헤더>` 정규식 + 8개 카테고리 키워드 추론 (60줄 순수 함수)
  - `app/txt-poc/page.tsx`: 검증 페이지 (드롭존 + 표 + 카테고리 분포 Badge), 사이드바 진입점 없음
  - 사용자 데이터 `머레이 상황별 템플릿.txt` 231 블록 → 8 카테고리 분포 검증 완료
- **글로벌 명령어 강화**: `~/.claude/commands/{after-work,before-work}.md`
  - 상단 경고: "크로스-머신 동기화. local memory는 보조 캐시"
  - **단계 0 Bootstrap** 추가 (필수 docs 누락 시 skeleton 자동 생성)
  - after-work 단계 5: docs staging 검증, 단계 8: Merge 보호 명시
  - before-work 머신 변경 감지를 단계 2로 위로 이동, 단계 7: docs → local rehydrate
- **Local memory 작성**: `feedback_workflow_skills.md` + `project_flowdb_status.md` + `MEMORY.md` 인덱스
- **Docs bootstrap (이번 entry)**: `docs/{SESSION-LOG, MEMORY, CONTEXT, TODO}.md` 신규 + `NEXT-ACTION.md` 갱신

### 브레인스토밍 & 큰 결정
- **chartdb.io 비교**: chartdb는 *DB 스키마 설계* 도구, FlowDB는 *데이터 정리* 도구. 도메인 다름. 정적+LLM 분기 패턴은 참고할 만함. DBML export로 두 도구 협력 가능.
- **디스플레이 자동 추천 원칙 합의**: "모두 항상 다 있다" ❌, "데이터 도메인이 허용할 때만 활성화" ✓ (Notion/Airtable 비대 함정 회피)
- **다음 라운드 3 후보 정리**: 시트 뷰(★★★★★) / 사람 확정 UI(★★★★) / LLM 하이브리드(★★★) — 우선순위 A ≫ B ≫ C
- **워크스페이스 진입점**: 클릭 핸들러 없는 게 *의도적* placeholder ([docs/02-v01-backlog.md:99](02-v01-backlog.md)). W11 작업.
- **PR #1은 머지까지 완료** — `gh pr merge --merge --delete-branch` 단번에

### 다음
**NEXT-ACTION.md 의 다음 행동 3 후보 중 선택. 추천: 옵션 A (시트 뷰).**

### Watch Out
- ⚠️ **after-work 일반 안전 원칙으로 머지 단계 자의적 누락 금지** — 이번 세션 초기에 머지를 옵션으로 제시했다가 호된 지적 받음. 명령어 정의 자체가 명시 승인 단위. 강화된 명령어 정의에 명시 박힘.
- ⚠️ **워크트리 함정**: `.claude/worktrees/` 안은 Plot 노트앱용. FlowDB 코드는 `flowdb-port/` 메인 working tree에. 이번 세션에서 worktree 안에 있으면서 절대경로로 메인에 직접 작성, 별도 처리 단계 필요했음.
- `"원"` 키워드 광범위 false positive — "가격 59" 분류 일부 의심. 옵션 C 안 가도 옵션 A·B 진행 중에 정밀화 백로그.

### 머신
집
