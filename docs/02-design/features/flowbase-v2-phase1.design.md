# FlowBase V2 — Phase 1 (기반 + 시트 뷰) Design

> 작성: 2026-05-21
> Plan: [flowbase-v2.plan.md](../../01-plan/features/flowbase-v2.plan.md)
> Phase: PDCA Design — **검토 게이트 대상**
> 정본 소스: `design-ref/handoff/STATE-SHAPES.md`, `COMPONENT-MAP.md` + `design-ref/prototype/{sheet,prototype,components}.jsx`
> 다음: 사용자 검토 → Phase 1A 코드

---

## 1. 범위

Phase 1 = **1A 기반**(데이터 모델·스토어·undo·parsers·키보드) + **1B 시트 뷰**(`components/sheet/*` + 최소 보드 페이지).

- ✅ 새 데이터 모델 + zustand 스토어 + localStorage persist
- ✅ 시트 뷰 — 셀 인라인 편집, Excel식 키보드 네비, 복붙, ⌘Z
- ✅ AI pending **마커** 표시 (보라 점 + 점선 underline)
- ❌ 실 Claude 호출 (Phase 2) — Phase 1은 시드의 pending 상태만 사용
- ❌ AI Activity 패널, Accept/Dismiss 마이크로 카드 (Phase 2)
- ❌ Kanban/Dashboard/Schema 뷰, 멀티 보드 UI, Import 모달 (Phase 3~6)

---

## 2. 데이터 모델 — `types/flowbase.ts`

> STATE-SHAPES §1 기준. status는 **한국어 enum**(프로토타입의 영문 `todo/progress/...`는 미사용 — STATE-SHAPES §1 주의1).

```ts
// types/flowbase.ts

export type TicketStatus = "미처리" | "진행중" | "대기" | "완료";
// LOCK 색 (lib/tokens.ts statusColorClass/statusBgClass):
//   미처리=blue · 진행중=amber · 대기=violet · 완료=emerald

export type TicketPriority = "Urgent" | "High" | "Med" | "Low";
export type Sentiment = "Positive" | "Mixed" | "Negative";
export type ColumnType = "text" | "num" | "date" | "email" | "select" | "status";

export interface ColumnDef {
  name: string;          // key (TableRow의 필드명과 일치)
  label: string;         // 표시 이름
  type: ColumnType;
  width?: number;        // px
  ai?: boolean;          // AI 추론 컬럼 (theme/sentiment)
  options?: string[];    // type==="select"일 때 가능값
}

export interface TableRow {
  id: string;
  name: string;
  company: string;
  date: string;          // ISO yyyy-mm-dd
  theme: string;
  sentiment: Sentiment;
  status: TicketStatus;
  priority: TicketPriority;
  quote: string;
  themeConfirmed: boolean;       // false = AI 추천 보류(pending)
  sentimentConfirmed: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AIHistoryEntry {
  id: string;
  kind: "infer" | "schema" | "import" | "ask" | "manual";
  title: string;
  detail?: string;
  time: string;          // ISO
  status: "pending" | "applied" | "dismissed" | "error";
  rowIds?: string[];
}

export interface Board {
  id: string;
  label: string;
  columns: ColumnDef[];
  rows: TableRow[];
  aiHistory: AIHistoryEntry[];   // 보드별 (STATE-SHAPES §6)
  createdAt: string;
  updatedAt: string;
}

export type ViewMode = "sheet" | "kanban" | "chart" | "schema";
// "chart" = Dashboard. 프로토타입 ViewSwitcher의 "table"은 V2에서 제거
// (V2 sheet가 옛 읽기용 table을 대체).
```

**결정 D1 — status 한국어**: 프로토타입 `STATUS` 맵은 `todo→미처리` 변환을 거치지만, V2는 `TableRow.status`에 **한국어를 직접 저장**. 시드 생성 시 변환(§3).

**결정 D2 — `id` 컬럼**: `columns`에 `id` 컬럼이 포함되며 `TableRow.id`를 read-only로 표시(프로토타입 `CellEditor`의 `col.name==="id"` 분기). 편집 불가.

**결정 D3 — `text` = 단일 행 입력**: 프로토타입 `EditableText`는 `quote`(width 380)까지 전부 `<input>`(단일 행). V2 `text`도 단일 행 `<input>`. textarea 불필요. (장문 편집이 필요해지면 추후 `multiline` 플래그 추가 — Phase 1 비목표)

## 3. 시드 데이터 — `lib/flowbase-seed.ts`

프로토타입 `components.jsx`의 `INTERVIEWS`(10행)를 V2 `Board`로 변환. 단일 시드 보드 = **"Customer Interviews"**.

### 3.1 컬럼 (`sheet.jsx` COLUMNS 기준, 9개)

| name | label | type | width | ai | options |
|---|---|---|---|---|---|
| id | ID | text | 86 | — | — (read-only) |
| name | Name | text | 130 | — | — |
| company | Company | text | 130 | — | — |
| date | Date | date | 110 | — | — |
| theme | Theme | select | 180 | ✅ | THEME_OPTIONS (6) |
| sentiment | Sentiment | select | 112 | ✅ | Positive/Mixed/Negative |
| status | Status | status | 116 | — | — (TicketStatus enum) |
| priority | Priority | select | 96 | — | Urgent/High/Med/Low |
| quote | Quote | text | 380 | — | — |

`THEME_OPTIONS = ["Pricing pushback", "Onboarding friction", "Feature: AI columns", "Sheet performance", "Sharing & roles", "Other"]` (AI-CONTRACTS §1 기본값과 동일).

### 3.2 행 (10행) — status 변환

프로토타입 `INTERVIEWS` 행을 그대로 옮기되 status를 한국어로, `aiTheme`/`aiSentiment` → `themeConfirmed`/`sentimentConfirmed`로 변환:

```
status:  todo→미처리 · progress→진행중 · waiting→대기 · done→완료
themeConfirmed     = !row.aiTheme
sentimentConfirmed = !row.aiSentiment
```

| id | status(변환) | themeConfirmed | sentimentConfirmed |
|---|---|---|---|
| INT-018 | 미처리 | false | false |
| INT-017 | 진행중 | false | true |
| INT-016 | 완료 | true | true |
| INT-015 | 대기 | true | false |
| INT-014 | 미처리 | false | false |
| INT-013 | 미처리 | false | true |
| INT-012 | 진행중 | true | true |
| INT-011 | 완료 | true | true |
| INT-010 | 대기 | false | false |
| INT-009 | 미처리 | true | true |

(name/company/date/theme/sentiment/priority/quote는 프로토타입 값 그대로.)

→ Phase 1 진입 시 pending: theme 5건, sentiment 4건. AI 패널 없이도 셀의 보라 점으로 보임.

## 4. 스토어 — `lib/flowbase-store.ts`

zustand + `persist` 미들웨어. STATE-SHAPES §2·§5.

### 4.1 상태 분류 — board-scoping 결정 (D4)

| 분류 | 필드 | persist | 보드 전환 시 |
|---|---|---|---|
| **보드 데이터** | `boards: Record<string, Board>` (columns·rows·aiHistory 포함) | ✅ | — |
| **전역 UI** | `activeBoardId`, `panels` | ✅ | 유지 |
| **보드별 뷰** | `viewByBoardId: Record<string, ViewMode>` | ✅ | — |
| **세션 ephemeral** | `search`, `filter`, `sort`, `selectedRowIds`, `focusedCell` | ❌ | **초기화** |

- `aiHistory`는 `Board` 안에 nested (STATE-SHAPES §6).
- `editingCell`은 스토어 ❌ — `sheet-view.tsx` 로컬 `useState` (초ephemeral한 편집 상태, 시트 외부에서 불필요). `focusedCell`만 스토어(키보드 네비가 참조).
- `theme`(light/dark)은 **next-themes**가 소유 — 스토어·persist 비포함 (기존 통합 유지, STATE-SHAPES와의 의도적 차이).

### 4.2 persist 설정

```ts
{
  name: "flowbase-state-v3",
  storage: createJSONStorage(() => localStorage),
  version: 3,
  partialize: (s) => ({
    boards: s.boards,
    activeBoardId: s.activeBoardId,
    panels: s.panels,
    viewByBoardId: s.viewByBoardId,
  }),
  migrate: (persisted, version) => persisted,  // v3 신규 — 이전 버전 없음
}
```

- 200ms debounce (zustand persist 기본 동작 + 필요 시 커스텀).
- 첫 실행(저장값 없음) → `lib/flowbase-seed.ts`의 시드 보드로 초기화.

### 4.3 액션 (STATE-SHAPES §5)

```ts
type FlowBaseActions = {
  // Board
  switchBoard(boardId): void;          // selectedRowIds·focusedCell·search·filter·sort 초기화
  createBoard(label, columns?): string;
  deleteBoard(boardId): void;

  // Rows (active board 대상)
  addRow(row?: Partial<TableRow>): string;
  updateRow(rowId, patch): void;       // updatedAt 자동 갱신 + undo push
  deleteRows(rowIds): void;            // undo push
  commitAiCell(rowId, col: "theme"|"sentiment", value): void;   // value 설정 + {col}Confirmed=true
  dismissAiCell(rowId, col): void;     // theme→"Other" / sentiment→"Mixed" 리셋 + {col}Confirmed=true (D5)
  // acceptAllAi / dismissAllAi → Phase 2 (AI 패널)

  // Undo
  undo(): void;
  redo(): void;

  // UI
  setView(v): void;                    // viewByBoardId[activeBoardId] = v
  setSearch(s): void;
  setFilter(f): void;
  setSort(s): void;
  setSelected(ids): void;
  setFocused(cell): void;
  togglePanel(k): void;                // Phase 5에서 UI 연결, 액션은 Phase 1 정의
  showAllPanels(): void;
  hideAllPanels(): void;
};
```

**결정 D5 — dismissAiCell 의미** (확정 2026-05-21, Q1): AI 추천 거부 → 값을 **기본값으로 리셋** (theme→`"Other"`, sentiment→`"Mixed"`) + `{col}Confirmed=true`. Accept(AI 값 수용)와 의미가 명확히 구분되고, 사람이 이후 직접 값을 고름.

### 4.4 derived selector

검색/정렬/필터는 저장 ❌. memoized selector:

```ts
selectVisibleRows(state): TableRow[]
  // active board rows → filter(status) → search(name+company+theme+quote+id) → sort
```

## 5. Undo 스택 — `lib/undo-stack.ts`

STATE-SHAPES §3. rows 스냅샷 기반, 30 step.

```ts
type RowsSnapshot = { boardId: string; rows: TableRow[] };
class UndoStack { past[]; future[]; limit=30; push(); undo(); redo(); }
```

- `updateRow`/`deleteRows`/`commitAiCell`/`addRow` 전에 현재 rows 스냅샷 push.
- localStorage persist ❌ — 새 세션 = 새 스택.
- 스토어 모듈 외부의 싱글톤 인스턴스(`export const undoStack`). 스토어 액션이 push/undo/redo 호출.

## 6. parsers — `lib/parsers.ts` (시그니처만)

Phase 3(Import) 선행 모듈. 의존성 없는 순수 함수. Phase 1에서는 **파일 작성 + 단위 검증**만, UI 연결 ❌.

```ts
parseDelimited(text, delim): string[][]      // CSV(',') / TSV('\t'), quote 처리
parseMarkdownTable(text): string[][]
detectFormat(text): "csv" | "tsv" | "md" | null
parseAny(text): { format, rows }
inferType(samples): ColumnType
normalizeHeader(s, idx): string              // snake_case
```

상세 명세는 Phase 3 design. Phase 1은 IMPORT-SPEC §1 그대로 이식 + 픽스처 테스트.

## 7. 키보드 — `lib/keyboard-shortcuts.ts`

Phase 1 범위: ⌘Z / ⌘⇧Z / Delete·Backspace. 패널 단축키(⌘⇧A/⌘⇧F/⌘B/⌘N)는 Phase 5.

| 키 | 동작 |
|---|---|
| ⌘Z / Ctrl+Z | `undo()` |
| ⌘⇧Z / Ctrl+Shift+Z | `redo()` |
| Delete / Backspace | 선택 행(`selectedRowIds`) 삭제 → `deleteRows()` |

- 글로벌 `keydown` 리스너 (보드 페이지 mount 시). input/textarea 포커스 중에는 ⌘Z/Delete를 입력기에 양보(시트 셀 편집 중 Delete는 셀 입력).
- 시트 내 셀 단위 키보드 네비(Tab/Enter/Arrow/F2/문자키)는 `useSheetKeyboardNav`(§11 이식)가 별도 담당.

## 8. 시트 컴포넌트 — `components/sheet/`

COMPONENT-MAP §2 기준. 의존성 순서대로:

| 파일 | 역할 | props (요약) |
|---|---|---|
| `ai-pending-mark.tsx` | 보라 점 + 점선 underline 마커 | `{ children }` 래퍼 또는 dot-only |
| `cell-popover.tsx` | select/status/theme/sentiment 공통 Popover 래퍼 | shadcn Popover+Command 조합 |
| `editable-cell.tsx` | ColumnType별 셀 분기 (비편집/편집) | §9 매트릭스 |
| `header-cell.tsx` | 타입 아이콘 + 라벨 + 정렬 화살표 + AI 배지 | `{ col, sort, onSort }` |
| `new-row-stub.tsx` | 마지막 줄 "+ New row" | `{ onAddRow }` |
| `sheet-view.tsx` | 편집 가능 그리드 (메인) | `{ board }` — 스토어 직접 구독 |

### 8.1 `sheet-view.tsx` 구조

`data-section.tsx`(M1~M5)의 `<table>` 구조를 기반 — `<colgroup>` 고정폭, sticky `<thead>`, `<tbody>` 행 렌더. 차이:
- 데이터 소스: `useFlowBase` 스토어의 `selectVisibleRows` + active board `columns`
- 셀: `<editable-cell>` (Field → ColumnDef)
- `editingCell` 로컬 state, `focusedCell` 스토어
- 행 체크박스 → `selectedRowIds`
- 마지막 행 `<new-row-stub>`

### 8.2 비AI 셀의 click-to-edit vs AI 셀

- 일반 셀(name/company/date/quote): 클릭 → 인라인 편집기. M1~M5 패턴 그대로.
- theme/sentiment(`ai:true`): 클릭 → select popover. pending이면 마커 표시. Phase 1은 popover에서 값 선택 = `commitAiCell`(confirmed=true). **Accept/Dismiss 마이크로 카드는 Phase 2.**
- status/priority: 클릭 → select popover (ChipSelect 스타일).

## 9. 셀 편집기 매트릭스

Customer Interviews 보드 컬럼 한정 (num/email 컬럼 없음 → Phase 1 미구현 OK):

| 컬럼 | type | 비편집 표시 | 편집기 | commit |
|---|---|---|---|---|
| id | text | mono, 회색 | **read-only** | — |
| name | text | text | `<input type=text>` | Enter/blur |
| company | text | text | `<input type=text>` | Enter/blur |
| date | date | mono yyyy-mm-dd | `<input type=date>` | Enter/blur/change |
| theme | select·ai | text (+pending 마커) | select popover (THEME_OPTIONS) | 선택 시 `commitAiCell` |
| sentiment | select·ai | pill tone (+pending 마커) | select popover (3종) | 선택 시 `commitAiCell` |
| status | status | status pill (아이콘+라벨) | select popover (status enum) | 선택 시 `updateRow` |
| priority | select | 아이콘+텍스트 | select popover (4종) | 선택 시 `updateRow` |
| quote | text | text, ellipsis | `<input type=text>` (wide) | Enter/blur |

- status pill·아이콘: 기존 `data-section.tsx`의 `StatusIcon` + `lib/tokens.ts`의 `statusBgClass`/`statusColorClass` 재사용 (미처리=blue LOCK).
- priority 아이콘: 기존 `PriorityIcon` + `priorityTextClass` 재사용.
- sentiment pill 톤: `Positive→success(emerald)` · `Mixed→warning(amber)` · `Negative→info(blue)` — 프로토타입 `SENTIMENT_TONE`(status 톤 재사용). 토큰만, inline hex ❌.

## 10. AI pending 마커 — `ai-pending-mark.tsx`

프로토타입 `EditableSentiment`/`EditableTheme`의 pending 표현:
- **보라 점**: 셀 좌측 `width:5px height:5px` 원, `background: var(--primary)`.
- **점선 underline**: theme 셀 텍스트에 `fb-ai-cell` 클래스 = 점선 밑줄. V2는 Tailwind `underline decoration-dotted decoration-primary/60 underline-offset-2` 또는 토큰 기반 클래스.
- 표시 조건: `row.themeConfirmed === false`(theme) / `row.sentimentConfirmed === false`(sentiment).

## 11. M1~M5 이식 매핑

`components/sections/sheet/`(옛 `Field`/`AnyRow` 모델) → `components/sheet/`(`ColumnDef`/`TableRow`):

| 이식 소스 | V2 대상 | 변경 |
|---|---|---|
| `useSheetKeyboardNav.ts` | `components/sheet/use-sheet-keyboard-nav.ts` | `Field[]`→`ColumnDef[]`, `isEditableField` 재정의(id만 read-only). IME 처리 그대로 |
| `useSheetClipboard.ts` | `components/sheet/use-sheet-clipboard.ts` | `rowValue`/`AnyRow`→`TableRow` 직접 접근 |
| `SheetCell.tsx`의 `InlineInput`/`InlineTextarea`/`coerceValue`/`toEditableString` | `editable-cell.tsx` | text/date 편집기. `coerceValue`에서 `num`/`datetime` 분기 단순화(date만) |
| `ChipSelect.tsx` | `cell-popover.tsx` + `editable-cell.tsx` select 분기 | pill 드롭다운 + 키보드 ↑↓ + 새 옵션 추가. `Field`→`ColumnDef`, status 색 매핑 유지 |

**이식 원칙**: 로직 패턴은 재사용, import·타입은 V2 모델로 재작성. 옛 `components/sections/sheet/`는 Phase 1 완료 후 삭제(`data-section.tsx`와 함께).

## 12. 최소 보드 페이지 — Phase 1 호스트

전체 앱 셸은 Phase 5. Phase 1은 시트를 띄울 최소 페이지:

- `app/page.tsx` 교체 — 옛 3섹션 토글 제거, V2 보드 페이지로.
- 레이아웃: 상단 간단 헤더(보드 라벨 + row 수) + `<sheet-view>`.
- Activity bar / Sidebar / AI 패널 / 뷰 스위처 = Phase 2·4·5에서 추가.
- 옛 `app/page.tsx`가 쓰던 `design-section`/`data-section`/`operations-section` 등은 import 끊김 → Phase 1에서 시트 무관 파일은 삭제 보류, `data-section.tsx`+`components/sections/sheet/`만 시트 이식 완료 후 정리.

→ Q2 확정: **단계적 삭제** (§15). Phase 1은 `app/page.tsx` 교체 + `data-section`·`components/sections/sheet/`만 정리.

## 13. LOCK·가드 준수

- Status 색: `statusColorClass`/`statusBgClass`만 (미처리=blue). `STATUS_TONE`(red) 사용 ❌.
- Phosphor(status/priority 아이콘) + lucide. Geist.
- AI: Phase 1은 추천 *마커*만. 자동 적용 ❌. 모든 row 변경 ⌘Z.
- minimalist: 시트 dense(셀 패딩 `py-2 px-3`급), framer-motion ❌, `transition-colors`만, 약한 ring/shadow만, 토큰만.

## 14. 마일스톤 (commit 단위)

### 1A 기반 (PR #1)
```
M1.1  의존성 설치 (zustand, nanoid) + types/flowbase.ts
M1.2  lib/flowbase-seed.ts (Customer Interviews 시드 보드)
M1.3  lib/undo-stack.ts
M1.4  lib/flowbase-store.ts (zustand + persist + 액션)
M1.5  lib/parsers.ts (IMPORT-SPEC §1 이식, 픽스처 검증)
M1.6  lib/keyboard-shortcuts.ts (⌘Z/⌘⇧Z/Delete)
```
**Done**: 스토어 import → 시드 보드 로드 · `updateRow` → localStorage 반영 · `undo()` 동작 · 새로고침 유지.

### 1B 시트 뷰 (PR #2)
```
M2.1  components/sheet/ai-pending-mark.tsx + cell-popover.tsx
M2.2  editable-cell.tsx (text/date 편집 — M1~M5 InlineInput 이식)
M2.3  editable-cell.tsx (select/status/theme/sentiment popover)
M2.4  header-cell.tsx + new-row-stub.tsx
M2.5  sheet-view.tsx + use-sheet-keyboard-nav 이식
M2.6  use-sheet-clipboard 이식
M2.7  app/page.tsx → 최소 보드 페이지
```
**Done**: status/priority/sentiment/theme/text 셀 편집 → store+localStorage · Tab/Enter/Arrow 네비 · ⌘C/⌘V · ⌘Z · Delete+undo · 새로고침 유지 · pending 마커 표시.

## 15. 리스크 / Open Questions

| 위험 | 완화 |
|---|---|
| 기반 모델 오류가 Phase 2~7 전파 | 본 문서 검토 게이트 |
| `text` 단일 행 입력이 `quote` 장문에 불편 | 프로토타입 fidelity 우선(D3). 불편 시 추후 `multiline` |
| persist 5MB 한도 | Phase 1 시드 10행이라 무관. 한도 처리는 Phase 2(aiHistory 증가 시) |
| 옛 `data-section`/`components/sections/sheet/` 삭제가 다른 import 깨뜨림 | §12 Q2 — 삭제 시점 신중히 |

**검토 게이트 — 확정 (2026-05-21)**:
- **Q1** ✅ — `dismissAiCell` = 값을 기본값으로 리셋(theme→`"Other"`, sentiment→`"Mixed"`) + `confirmed=true`. AI 추천 거부 의미 명확화 (§4.3 D5).
- **Q2** ✅ — 옛 섹션 파일 **단계적 삭제**. Phase 1은 `app/page.tsx` 교체 + `data-section`·`components/sections/sheet/`만 정리. `design-section`/`operations-section`/`trash`/`workspaces`/`settings` + `/trash`·`/workspaces`·`/txt-poc` 라우트는 V2가 해당 뷰를 대체하는 Phase(4·6)에서 삭제. 빌드 항상 green.
- **Q3** ✅ — `editingCell` = `sheet-view.tsx` 로컬 `useState`. `focusedCell`만 스토어.
- **Q4** ✅ — 새 행 `id` = `nanoid`. 시드의 `INT-NNN`은 시드 한정.

→ 게이트 통과. Phase 1A 코드 착수.
