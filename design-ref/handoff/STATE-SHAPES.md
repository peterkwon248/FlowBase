# STATE-SHAPES — 데이터 shape + persistence + 마이그레이션 경로

> 프로토타입은 localStorage로 모든 걸 저장. 프로덕션 v0도 localStorage로 충분합니다.
> BaaS는 `docs/01-baas-decision.md`에서 결정 후 phase 3+.

---

## 1. 핵심 타입

```ts
// types/flowbase.ts

export type TicketStatus = "미처리" | "진행중" | "대기" | "완료";
// LOCK: 색상 매핑 (CLAUDE.md)
//   미처리   → blue   (info)
//   진행중   → amber  (warning)
//   대기     → violet (primary)
//   완료     → emerald (success)

export type TicketPriority = "Urgent" | "High" | "Med" | "Low";

export type Sentiment = "Positive" | "Mixed" | "Negative";

export type ColumnType = "text" | "num" | "date" | "email" | "select" | "status";

export type ColumnDef = {
  name: string;             // snake_case key (DB-safe)
  label: string;            // 사용자에게 보이는 이름
  type: ColumnType;
  width?: number;           // px, 미정이면 auto
  ai?: boolean;             // AI 추론 컬럼 여부 (theme, sentiment 등)
  options?: string[];       // type=select일 때 가능값
};

export type TableRow = {
  // 표준 필드 (Customer Interviews 도메인)
  id: string;
  name: string;
  company: string;
  date: string;             // ISO yyyy-mm-dd
  theme: string;
  sentiment: Sentiment;
  status: TicketStatus;
  priority: TicketPriority;
  quote: string;

  // AI 추천 상태
  themeConfirmed: boolean;       // false = AI 추천 보류 상태
  sentimentConfirmed: boolean;

  // 향후 (옵션)
  createdAt?: string;
  updatedAt?: string;
  ownerId?: string;
};

export type Board = {
  id: string;
  label: string;
  columns: ColumnDef[];
  rows: TableRow[];
  // 메타
  createdAt: string;
  updatedAt: string;
};

export type ViewMode = "sheet" | "kanban" | "chart" | "schema";

export type FlowBaseState = {
  // 데이터
  boards: Record<string, Board>;
  activeBoardId: string;

  // UI 상태
  theme: "light" | "dark";
  view: ViewMode;
  search: string;
  filter: TicketStatus[];        // active status 필터들
  sort: { key: string; dir: "asc" | "desc" };
  selectedRowIds: string[];      // 보드별로 가져갈 거면 nested
  focusedCell: { row: string; col: string } | null;
  panels: { activityBar: boolean; sidebar: boolean; aiPanel: boolean };

  // AI 히스토리
  aiHistory: AIHistoryEntry[];   // 보드별로 가져갈 거면 nested
};

export type AIHistoryEntry = {
  id: string;                    // nanoid
  kind: "infer" | "schema" | "import" | "ask" | "manual";
  title: string;
  detail?: string;
  time: string;                  // ISO
  status: "pending" | "applied" | "dismissed" | "error";
  rowIds?: string[];
};
```

**주의 1**: 프로토타입은 status 키를 `"todo" | "progress" | "waiting" | "done"`(영문)로 썼지만,
**기존 `lib/mock-data.ts`의 `TicketStatus`는 한국어**. 새 코드는 **한국어 enum을 따르세요**.

**주의 2**: 프로토타입 코드의 `STATUS` 객체와 `STATUS_OPTIONS` 배열은 일관성을 맞춰 다시 짜야 함.
`mock-data.ts`의 `STATUS_TONE` map과 `tokens.ts`의 `statusBgClass / statusColorClass`를 그대로 사용.

---

## 2. localStorage shape (Phase 1)

키: `flowbase-state-v3` (v2는 프로토타입 데이터로 충돌 가능 → 버전 올림)

```ts
type PersistedState = {
  v: 3;                          // schema version
  state: {
    boards: Record<string, Board>;
    activeBoardId: string;
    theme: "light" | "dark";
    panels: FlowBaseState["panels"];
    // 검색/필터/정렬은 세션 ephemeral, persist 안 해도 OK
    // 또는 보드별로 마지막 view 저장하고 싶으면 별도 nested
    viewByBoardId: Record<string, ViewMode>;
  };
  savedAt: string;               // ISO
};
```

### 저장 정책
- 200ms debounce on any state change
- `JSON.stringify` 5MB 한도 (localStorage)
- 한도 초과 시: 가장 오래된 aiHistory 잘라내기 → 다시 저장

### 마이그레이션
```ts
// lib/persist.ts
function migrate(stored: any): PersistedState {
  if (!stored) return defaultState();
  if (stored.v === 3) return stored;
  if (stored.v === 2) { /* … v2 → v3 변환 */ }
  return defaultState();    // unknown version
}
```

### 권장: zustand persist 미들웨어
```ts
// lib/flowbase-store.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useFlowBase = create<FlowBaseState & FlowBaseActions>()(
  persist(
    (set, get) => ({
      ...defaultState(),

      // actions
      updateRow: (boardId, rowId, patch) => set((s) => {
        const b = s.boards[boardId];
        if (!b) return s;
        return {
          ...s,
          boards: {
            ...s.boards,
            [boardId]: {
              ...b,
              rows: b.rows.map(r => r.id === rowId ? { ...r, ...patch, updatedAt: new Date().toISOString() } : r),
              updatedAt: new Date().toISOString(),
            },
          },
        };
      }),

      commitAiCell: (boardId, rowId, col, value) => { /* … */ },

      // ...
    }),
    {
      name: "flowbase-state-v3",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({
        boards: s.boards,
        activeBoardId: s.activeBoardId,
        theme: s.theme,
        panels: s.panels,
        // search/filter/sort은 partialize에서 제외 (세션마다 초기화)
      }),
      version: 3,
      migrate: (persisted, version) => {
        // 버전별 변환 로직
        return persisted as any;
      },
    },
  )
);
```

---

## 3. Undo / Redo 스택

```ts
// lib/undo-stack.ts
type RowsSnapshot = { boardId: string; rows: TableRow[] };

class UndoStack {
  past: RowsSnapshot[] = [];
  future: RowsSnapshot[] = [];
  limit = 30;

  push(snapshot: RowsSnapshot) {
    this.past.push(snapshot);
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];   // 새 액션 → redo 스택 초기화
  }

  undo(current: RowsSnapshot): RowsSnapshot | null {
    const prev = this.past.pop();
    if (!prev) return null;
    this.future.push(current);
    return prev;
  }

  redo(current: RowsSnapshot): RowsSnapshot | null {
    const next = this.future.pop();
    if (!next) return null;
    this.past.push(current);
    return next;
  }
}

export const undoStack = new UndoStack();
```

**중요**: undo는 localStorage에 persist 안 함. 새 세션 = 새 스택.

---

## 4. 마이그레이션 경로 — localStorage → BaaS

### Phase 3a — Supabase 가정

```sql
-- supabase migration: boards
create table boards (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete cascade,
  label text not null,
  columns jsonb not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table rows (
  id text primary key,           -- "INT-018" 같은 사용자 noted ID
  board_id uuid references boards(id) on delete cascade,
  data jsonb not null,           -- TableRow의 column-driven 필드들
  status text,
  priority text,
  date date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table ai_history (
  id uuid primary key default gen_random_uuid(),
  board_id uuid references boards(id) on delete cascade,
  kind text not null,
  title text not null,
  detail text,
  row_ids text[],
  status text default 'applied',
  created_at timestamptz default now()
);

-- RLS
alter table boards   enable row level security;
alter table rows     enable row level security;
alter table ai_history enable row level security;

create policy "users own their boards" on boards
  for all using (auth.uid() = owner_id);
create policy "rows follow board ownership" on rows
  for all using (board_id in (select id from boards where owner_id = auth.uid()));
create policy "ai history follows board ownership" on ai_history
  for all using (board_id in (select id from boards where owner_id = auth.uid()));
```

### 마이그레이션 한 번
- 로그인 직후 localStorage의 `flowbase-state-v3`이 있으면 → Supabase로 일괄 upload → localStorage 비우기
- 그 시점부터 store는 Supabase가 source of truth, localStorage는 캐시로만 사용 (PWA offline)

### 동기화 모드
- **Optimistic write**: UI 즉시 업데이트 + 서버에 PUT. 실패 시 rollback + 에러 toast.
- **Realtime subscription**: Supabase realtime channel 구독 → 다른 디바이스의 변경사항 자동 반영.
- **Conflict resolution**: `updated_at` 기준 last-write-wins (v1). 향후 CRDT 검토.

### Phase 3b — bkend.ai 시나리오
거의 동일하지만 schema 정의가 BaaS의 visual builder에서. SDK 호출이 fetch 대신 SDK function. AI 호출도 BaaS에서 wrapping 가능 (Anthropic key 보관 책임 BaaS로 위임).

---

## 5. 액션 인터페이스 (store actions)

```ts
type FlowBaseActions = {
  // Board
  switchBoard(boardId: string): void;
  createBoard(label: string, columns?: ColumnDef[]): string;
  deleteBoard(boardId: string): void;

  // Rows (모두 active board 대상)
  addRow(row: Partial<TableRow>): string;
  updateRow(rowId: string, patch: Partial<TableRow>): void;
  deleteRows(rowIds: string[]): void;
  commitAiCell(rowId: string, col: "theme" | "sentiment", value: string): void;
  dismissAiCell(rowId: string, col: "theme" | "sentiment"): void;
  acceptAllAi(col: "theme" | "sentiment", results: {id: string; value: string}[]): void;
  dismissAllAi(col: "theme" | "sentiment"): void;

  // Undo
  undo(): void;
  redo(): void;

  // UI
  setView(v: ViewMode): void;
  setSearch(s: string): void;
  setFilter(f: TicketStatus[]): void;
  setSort(s: FlowBaseState["sort"]): void;
  setSelected(ids: string[]): void;
  setFocused(c: FlowBaseState["focusedCell"]): void;
  togglePanel(k: keyof FlowBaseState["panels"]): void;
  showAllPanels(): void;
  hideAllPanels(): void;

  // AI history
  pushAi(entry: Omit<AIHistoryEntry, "id" | "time">): void;
};
```

---

## 6. 멀티 보드 (프로토타입은 single)

프로토타입은 "Customer Interviews" 보드 하나만 진짜 작동하고 나머지는 placeholder.
프로덕션에선 BOARDS 배열을 그대로 살리되 각 보드가 자체 rows/columns/aiHistory를 가지도록 nest.

```ts
type Board = {
  id: string;
  label: string;
  columns: ColumnDef[];
  rows: TableRow[];
  aiHistory: AIHistoryEntry[];
  // ... 메타
};
```

---

## 7. 검색 / 정렬 / 필터는 derived state

저장 X. memoized selector로 visibleRows 계산:

```ts
export function selectVisibleRows(state: FlowBaseState): TableRow[] {
  const board = state.boards[state.activeBoardId];
  if (!board) return [];
  let r = board.rows;
  if (state.filter.length > 0) r = r.filter(x => state.filter.includes(x.status));
  if (state.search.trim()) {
    const q = state.search.trim().toLowerCase();
    r = r.filter(x => (x.name + x.company + x.theme + x.quote + x.id).toLowerCase().includes(q));
  }
  return [...r].sort(rowSorter(state.sort));
}
```
