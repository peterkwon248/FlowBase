# COMPONENT-MAP — 프로토타입 ↔ shadcn ↔ 신규 컴포넌트

> 답: **모든 버튼을 직접 연결할 필요 없음.**
> 대부분 기존 `components/ui/*.tsx`의 shadcn 프리미티브로 해결되고, 시트/AI 패널/차트만 새로 짭니다.

---

## 1. 이미 존재하는 shadcn 프리미티브 (그대로 사용)

| 프로토타입에서 한 것 | 기존 컴포넌트 (`components/ui/`) |
|---|---|
| 행 체크박스 | `checkbox.tsx` |
| status / priority 드롭다운 (셀 클릭 → 옵션 선택) | `dropdown-menu.tsx` 또는 `popover.tsx` + `command.tsx` |
| sentiment 셀의 AI Accept/Dismiss 미니 카드 | `popover.tsx` |
| 검색창 (⌘K) | `command.tsx` (이미 `quick-switcher.tsx`에서 사용 중) |
| Import 모달 | `dialog.tsx` |
| 햄버거 → 패널 토글 메뉴 | `dropdown-menu.tsx` |
| 필터 status chips | `badge.tsx` + 클릭 핸들러 |
| 우선순위 / 채널 / status 배지 | 기존 `lib/tokens.ts`의 `toneBadgeClassDual` 그대로 |
| Toast (AI 적용 / Undo / Import 완료) | `sonner` (PR #4) |
| Kanban 카드 | `card.tsx` + `button.tsx` |
| Dashboard KPI 타일 | `card.tsx` |
| View switcher | `tabs.tsx` (`components/ui/tabs.tsx` 확인) 또는 `button-group.tsx` |
| 새 행 추가 / Import 버튼 | `button.tsx` |
| 셀 내 텍스트 편집 | `input.tsx` (autoFocus + onBlur 커밋 + Esc 취소) |
| 사이드바 하단 단축키 힌트 | `kbd.tsx` |
| Edge collapse chevron | `button.tsx` (variant=ghost, size=icon) |

**짚어보기**: 새로운 visual 컴포넌트는 거의 필요 없습니다. 대부분 *조립*입니다.

---

## 2. 새로 만들 컴포넌트 (조립이 필요한 것)

### `components/board/`
```
board-header.tsx          — 햄버거 메뉴 + breadcrumb + 검색 + AI 버튼 + 테마 토글
panels-menu.tsx           — PANELS 드롭다운 (Activity / Sidebar / AI panel + Show/Hide all)
view-switcher.tsx         — Sheet | Kanban | Dashboard | Schema 토글
filter-chips.tsx          — status 필터 chip 줄
edge-collapse.tsx         — 패널 가장자리 chevron 토글
expand-tab.tsx            — 패널 닫힌 상태에서 다시 펼치는 floating tab
```

### `components/sheet/`
```
sheet-view.tsx            — 편집 가능한 데이터 그리드 (메인)
editable-cell.tsx         — 셀 타입별 분기 (status/priority/sentiment/theme/text/date)
ai-pending-mark.tsx       — 보라 점 + 점선 underline 마커
cell-popover.tsx          — status/priority/sentiment 선택용 공통 Popover 래퍼
header-cell.tsx           — 타입 아이콘 + 정렬 + AI 배지
new-row-stub.tsx          — 마지막 줄의 + New row 행
```

### `components/ai/`
```
ai-activity-panel.tsx     — 우측 사이드 패널 전체 (Pending + Timeline + Composer)
pending-card.tsx          — "Inferred N rows" 카드 (Apply all / Dismiss)
timeline-item.tsx         — AI 히스토리 한 줄
ai-composer.tsx           — 하단 입력창 (Enter → window 또는 server route)
```

### `components/sections/`
```
kanban-view.tsx           — 4 status 컬럼 + 카드 + 컬럼 이동 버튼
dashboard-view.tsx        — KPI 4개 + Bar/Donut/HBar/Stacked/Heatmap/Line+Area
schema-view.tsx           — 테이블 스키마 다이어그램 (기존 `design-section.tsx` 활용)
```

### `components/charts/` (Dashboard 하위)
```
bar-chart.tsx             — 세로 막대 + y축 + hover tooltip
donut-chart.tsx           — 도넛 + legend + 중앙 hover swap
hbar-chart.tsx            — 가로 막대 (랭킹 리스트)
stacked-bar.tsx           — 가로 stacked
line-area.tsx             — 라인 + 영역 채움
matrix-heatmap.tsx        — status × theme 매트릭스
kpi-tile.tsx              — 큰 숫자 + delta
chart-card.tsx            — 차트 카드 래퍼 (제목 + accent dot)
```

**추천**: 차트는 **`recharts`** 사용을 권장합니다 (Next.js 친화, shadcn에 `chart.tsx` 래퍼 이미 있음 → `components/ui/chart.tsx` 활용).
프로토타입의 SVG 직접 구현은 디자인 의도만 보세요. recharts로 옮기면 코드 양 절반 이하.

### `components/import/`
```
import-dialog.tsx         — 3-step 위저드 (Paste → Review → AI columns)
import-step-paste.tsx     — textarea + 포맷 감지
import-step-review.tsx    — 컬럼 이름/타입 편집 + 미리보기
import-step-ai.tsx        — Theme/Sentiment AI 컬럼 추천 카드
lib/parsers.ts            — parseDelimited / parseMarkdownTable / detectFormat / inferType
```

### `lib/`
```
flowbase-store.ts         — zustand 추천 (또는 useState + Context). 상세는 STATE-SHAPES.md
flowbase-ai.ts            — Claude API 호출 래퍼 (서버 route 호출). AI-CONTRACTS.md 참고
keyboard-shortcuts.ts     — ⌘Z / ⌘⇧Z / ⌘B / ⌘⇧F / ⌘⇧A / Delete 글로벌 핸들러
undo-stack.ts             — 30 step rows 히스토리
```

### `app/api/`
```
ai/infer-batch/route.ts   — Theme/Sentiment 일괄 분류 (서버에서 Anthropic API 호출)
ai/analyze-import/route.ts — Import 데이터 요약 + AI 컬럼 추천
ai/ask/route.ts            — AI composer의 자유 질의
```

---

## 3. 매핑 디테일 — 프로토타입 함수 ↔ shadcn 패턴

### 예시 1: status 셀 편집

**프로토타입** (`prototype.jsx` `EditableStatus`):
```jsx
<button onClick={() => setOpen(!open)}>
  <StatusBadge status={value} />
</button>
{open && <Popover>...4 menu items...</Popover>}
```

**Next.js 권장** (`components/sheet/editable-cell.tsx` 안):
```tsx
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandItem, CommandList } from "@/components/ui/command"

<Popover>
  <PopoverTrigger asChild>
    <button className="...">
      <StatusBadge status={value} />
    </button>
  </PopoverTrigger>
  <PopoverContent className="w-44 p-1" align="start">
    <Command>
      <CommandList>
        {STATUS_OPTIONS.map(s => (
          <CommandItem key={s} onSelect={() => { onChange(s); /* close */ }}>
            <StatusIcon status={s} />
            <span>{STATUS_LABEL[s]}</span>
            {s === value && <Check className="ml-auto h-3 w-3 text-primary" />}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  </PopoverContent>
</Popover>
```

**StatusBadge / StatusIcon은 기존 `data-section.tsx`에 이미 있음.** 재사용하세요.

### 예시 2: AI Activity 패널의 "Apply all"

**프로토타입**:
- 버튼 클릭 → `window.claude.complete({ messages: [...] })` 직접 호출
- 응답 텍스트에서 JSON 파싱

**Next.js 권장**:
- 버튼 클릭 → `fetch("/api/ai/infer-batch", { method: "POST", body: JSON.stringify({ rows, column }) })`
- 서버에서 Anthropic SDK로 Claude 호출 (API key는 환경변수)
- 응답 JSON 받아서 setRows
- AI-CONTRACTS.md의 프롬프트 그대로 사용

### 예시 3: 패널 토글 (햄버거 메뉴)

**프로토타입**: `useState`로 3개 boolean 관리.

**Next.js 권장**: zustand store로 관리하고 localStorage persist 미들웨어. STATE-SHAPES.md 참고.

```ts
// lib/flowbase-store.ts
import { create } from "zustand"
import { persist } from "zustand/middleware"

type Panels = { activityBar: boolean; sidebar: boolean; aiPanel: boolean }

export const usePanels = create<{ panels: Panels; toggle: (k: keyof Panels) => void; ... }>(
  persist((set) => ({
    panels: { activityBar: true, sidebar: true, aiPanel: true },
    toggle: (k) => set((s) => ({ panels: { ...s.panels, [k]: !s.panels[k] } })),
    ...
  }), { name: "flowbase-panels" })
)
```

---

## 4. 신규 컴포넌트 작업 우선순위 (의존성 순서)

```
1. lib/parsers.ts                       (의존성 없음)
2. lib/flowbase-store.ts                (의존성 없음, Phase 1)
3. components/sheet/ai-pending-mark.tsx (의존성 없음)
4. components/sheet/editable-cell.tsx   (#3 사용)
5. components/sheet/header-cell.tsx     (의존성 없음)
6. components/sheet/sheet-view.tsx      (#4, #5 사용)
7. components/board/filter-chips.tsx
8. components/board/panels-menu.tsx
9. components/board/view-switcher.tsx
10. components/board/board-header.tsx   (#8 포함)
11. app/api/ai/*/route.ts               (#1 사용)
12. components/ai/ai-activity-panel.tsx (#11 호출)
13. components/sections/kanban-view.tsx
14. components/charts/* + dashboard-view.tsx
15. components/import/*                  (#1, #11 사용)
16. board-page assembly + keyboard hookup
```

각 단계마다 PR 분리하면 리뷰가 쉽습니다.

---

## 5. 신규 컴포넌트 props 시그니처 (요약)

### `<EditableCell row col onUpdate onCommitAi onDismissAi />`
- `row`: TableRow
- `col`: ColumnDef
- `onUpdate(id, patch)`: 일반 텍스트/날짜 셀
- `onCommitAi(id, col, value)`: AI 추천 셀의 Accept (themeConfirmed/sentimentConfirmed=true)
- `onDismissAi(id, col)`: AI 추천 거부 (원본 유지)

### `<AIActivityPanel rows onAcceptAll onDismissAll onAsk aiHistory />`
- `onAcceptAll("theme" | "sentiment")`: 서버 API 호출
- `onAsk(prompt)`: 자유 질의

### `<ImportDialog open onClose onCommit existingColumns />`
- `onCommit(newRows, info)`: 위저드 끝나면 `info: { count, ranAi }`와 함께 row 배열 전달

### `<PanelsMenu panels onToggle onShowAll onHideAll />`
- 단순 컨트롤드. 외부 상태에서 토글.

상세 타입은 `prototype/prototype.jsx`, `prototype-shell.jsx`, `prototype-app.jsx`에 박혀 있어요.
