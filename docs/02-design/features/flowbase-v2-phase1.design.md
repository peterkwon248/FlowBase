# FlowBase V2 — Phase 1 (기반 + 시트 뷰) Design

> 작성: 2026-05-21 · **개정: 2026-05-21 — 프로토타입 정독 후 제네릭 모델로 전면 수정**
> Plan: [flowbase-v2.plan.md](../../01-plan/features/flowbase-v2.plan.md)
> 정본: `design-ref/prototype/{prototype-app,tables-data,cell-types,view-controls}.jsx` + `handoff/`
> 구현: [types/flowbase.ts](../../../types/flowbase.ts) · [lib/flowbase-seed.ts](../../../lib/flowbase-seed.ts) · [lib/flowbase-store.ts](../../../lib/flowbase-store.ts)

## 0. 개정 배경

초판은 핸드오프 `STATE-SHAPES.md`(단순화판)를 따라 **고정 9필드 `TableRow`**로 설계했다. 이후 프로토타입(`prototype-app.jsx`·`tables-data.jsx`·`cell-types.jsx`)을 정독한 결과, 실제 V2는 **제네릭 컬럼 구동 모델**(테이블마다 컬럼 정의가 다른 generic row, 10 cell type, 다중 테이블)이었다. 본 문서는 그에 맞춰 §2~4·7·12를 전면 개정 (2026-05-21 사용자 결정).

## 1. 범위

Phase 1 = **1A 기반**(데이터 모델·스토어·undo·parsers·키보드) + **1B 시트 뷰**(`components/sheet/*` + 최소 보드 페이지).

- ✅ 제네릭 데이터 모델 + zustand 스토어 + localStorage persist
- ✅ 시트 뷰 — 셀 인라인 편집, Excel식 키보드 네비, 복붙, ⌘Z
- ✅ AI pending 마커 (보라 점 + 점선 underline)
- ❌ 실 Claude 호출(Phase 2) · AI 패널(Phase 2) · Kanban/Dashboard/Schema/멀티보드/Import(Phase 3~6)

## 2. 데이터 모델 — `types/flowbase.ts` (제네릭 컬럼 구동)

프로토타입은 **보드마다 컬럼 정의가 다른 generic row** 모델. 고정 `TableRow` ❌.

- **`ColumnType`** (10종): `text · num · date · email · select · status · avatar · reaction · button · fk` (`cell-types.jsx` 기준)
- **`ColumnDef`**: `{ name, label, type, width?, mono?, ai?, options?, subtitleField?, fk?, buttonLabel?, buttonAction? }`
- **`TableRow`** (제네릭): `{ id: string; themeConfirmed?; sentimentConfirmed?; createdAt?; updatedAt?; [key: string]: unknown }` — 필드는 보드 `columns`에 따라 동적, `row[col.name]`으로 접근
- **`Board`**: `{ id, label, colorVar?, idPrefix?, columns, rows, aiHistory, createdAt, updatedAt }`
- **`ViewMode`** (5종): `sheet · kanban · chart · grid · timeline` — "schema"는 뷰 아닌 workspace 모드라 제외
- **`FlowBaseState`**: `boards`/`activeBoardId`/`panels`/`viewByBoardId` (persist) + `search`/`filter`/`sort`/`selectedRowIds`/`focusedCell` (세션 ephemeral)

전체 정의는 [`types/flowbase.ts`](../../../types/flowbase.ts).

## 3. 시드 보드 — `lib/flowbase-seed.ts`

프로토타입 `tables-data.jsx` `COLUMNS_BY_TABLE.interviews` + `components.jsx` `INTERVIEWS` 기준. 단일 시드 보드 "Customer Interviews" (`id: "interviews"`, `idPrefix: "INT-"`).

**11컬럼**:

| name | type | 비고 |
|---|---|---|
| id | text | mono, read-only |
| name | **avatar** | `subtitleField: "company"` |
| company | text | |
| date | date | mono |
| theme | select · ai | THEME_OPTIONS 6종 |
| sentiment | select · ai | Positive/Mixed/Negative |
| votes | **reaction** | `{ positive, mixed, negative }` |
| status | status | TicketStatus enum |
| priority | select | Urgent/High/Med/Low |
| quote | text | |
| actions | **button** | "Reclassify" |

**10행** — `INTERVIEWS` + `initialRows()` augmentation: status 한국어 변환, `votes`(sentiment 기반), `themeConfirmed = !aiTheme` / `sentimentConfirmed = !aiSentiment`. 진입 시 pending: theme 5건 · sentiment 4건. (나머지 4 테이블은 Phase 6 멀티보드에서)

## 4. 스토어 — `lib/flowbase-store.ts`

zustand + `persist`. key `flowbase-state-v4`, version 4.

**상태 분류**: `boards`·`activeBoardId`·`panels`·`viewByBoardId` → persist. `search`·`filter`·`sort`·`selectedRowIds`·`focusedCell` → 세션 ephemeral, 보드 전환 시 초기화.

**액션**: `switchBoard` `createBoard` `deleteBoard` / `addRow` `updateRow` `deleteRows` `commitAiCell` `dismissAiCell` / `undo` `redo` / `setView` `setSearch` `setFilter` `setSort` `setSelected` `setFocused` `togglePanel` `showAllPanels` `hideAllPanels`. 행 변경 액션은 변경 전 undo 스냅샷 push.

- **`commitAiCell(rowId, col, value)`** — `row[col]=value` + `{col}Confirmed=true` (AI 추천 수용)
- **`dismissAiCell(rowId, col)`** — `{col}Confirmed=true`, **값은 그대로** (프로토타입 `onDismissAi` — Q1)
- **`addRow`** — id = `idPrefix` + (기존 최대 번호+1), 3자리 패딩 (예: `INT-019`) (Q4)

**셀렉터**: `selectActiveBoard` · `selectActiveView` · `selectVisibleRows`(필터 → 검색(전 컬럼) → 정렬; status/priority는 의미 순서 정렬).

## 5. 기반 보조 — Undo / parsers / 키보드

- **`lib/undo-stack.ts`** — `RowsSnapshot { boardId, rows }`, 30-step. persist ❌.
- **`lib/parsers.ts`** — CSV/TSV/MD 파서 (IMPORT-SPEC §1). Phase 3 선행 — Phase 1은 파일만.
- **`lib/keyboard-shortcuts.ts`** — 글로벌 ⌘Z/⌘⇧Z/Delete. 패널 단축키는 Phase 5.

(이 3개 파일은 제네릭 전환 영향 없음 — 그대로)

## 6. 시트 컴포넌트 — `components/sheet/` (Phase 1B)

| 파일 | 역할 |
|---|---|
| `ai-pending-mark.tsx` ✅ | 보라 점 + 점선 underline (작성 완료) |
| `cell-popover.tsx` | select/status 공통 Popover 래퍼 |
| `editable-cell.tsx` | `col.type`별 셀 분기 (§7) |
| `header-cell.tsx` | 타입 아이콘 + 라벨 + 정렬 + AI 배지 |
| `new-row-stub.tsx` | "+ New row" |
| `sheet-view.tsx` | 편집 가능 그리드 — 스토어 구독, `selectVisibleRows` |

## 7. 셀 편집기 매트릭스

`editable-cell.tsx`는 `col.type`으로 분기. Phase 1 시드(interviews)가 쓰는 7종:

| type | 비편집 표시 | 편집기 |
|---|---|---|
| text | 텍스트 (id는 mono read-only) | `<input>` |
| date | mono yyyy-mm-dd | `<input type=date>` |
| avatar | 이니셜 원 + 이름 + subtitle | 이름 `<input>` |
| select | 값 (theme=AI 마커 가능) | Popover 옵션 리스트 |
| status | status pill (아이콘+라벨) | Popover (status enum) |
| reaction | 😊😐😞 + 카운트 | 클릭 → 카운트 증가 |
| button | 버튼 ("Reclassify") | 클릭 → 액션 (실동작 Phase 2) |

(fk/num/email은 다른 보드용 — Phase 6). theme/sentiment(`ai:true`)는 pending이면 마커 표시; Phase 1은 popover 선택 = `commitAiCell`. Accept/Dismiss 마이크로 카드는 Phase 2.

## 8. AI pending 마커 — `ai-pending-mark.tsx` ✅

`themeConfirmed===false` / `sentimentConfirmed===false`이면 좌측 보라 점 + (theme) 점선 underline. 작성 완료.

## 9. M1~M5 이식 + 보드 페이지

- `useSheetKeyboardNav`·`useSheetClipboard` (`components/sections/sheet/`) → `components/sheet/`로 이식, `Field`→`ColumnDef`·제네릭 row로 어댑트
- `app/page.tsx` → 최소 V2 보드 페이지 (헤더 + sheet-view). 옛 3섹션 제거, `data-section`·`components/sections/sheet/` 정리 (Q2 — 단계적 삭제)

## 10. LOCK·가드

status 색 `statusColorClass`/`statusBgClass`만 (미처리=blue). `STATUS_TONE`(red) 사용 ❌. Phosphor/lucide·Geist. AI 추천+사람 확정 — 자동 적용 ❌. minimalist dense, framer-motion ❌, 토큰만.

## 11. 마일스톤

- **1A 기반** ✅ — types·seed·store·undo·parsers·키보드. 제네릭 모델로 재작업 완료, tsc green.
- **1B 시트** — cell-popover·editable-cell → header-cell·new-row-stub·sheet-view → 키보드/클립보드 이식 → 보드 페이지.

## 12. 결정 기록

| # | 결정 |
|---|---|
| D1 | status = 한국어 enum (`미처리/진행중/대기/완료`) |
| D2 | `theme`(light/dark) = next-themes 소유 — 스토어 제외 |
| D3 | `editingCell` = sheet-view.tsx 로컬 state, `focusedCell`만 스토어 |
| D4 | **데이터 모델 = 프로토타입 제네릭 컬럼 구동** (2026-05-21 사용자 결정 — 초판 고정 TableRow 폐기) |
| Q1 | `dismissAiCell` = **값 유지** + confirmed=true (프로토타입 `onDismissAi`. 초판 "기본값 리셋"은 오류 — 정정) |
| Q2 | 옛 섹션 파일 단계적 삭제 |
| Q4 | 새 행 id = `idPrefix` + 카운터 (`INT-019` 식) — 프로토타입 방식 |
