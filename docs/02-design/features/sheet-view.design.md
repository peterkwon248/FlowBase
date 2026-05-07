# 시트 뷰 (편집용 표) — Design

> 작성: 2026-05-07
> Plan: [sheet-view.plan.md](../../01-plan/features/sheet-view.plan.md)
> Phase: PDCA Design
> 다음: 구현 (Do) — `feat/sheet-view` 브랜치, 마일스톤 M1~M5 incremental

---

## 1. 사용자 시나리오

```
1) 사용자가 사이드바 → "데이터" 진입
2) Toolbar 우측 정렬 버튼 옆에 [표] [시트] 토글 보임. 기본은 [표] (현 상태 유지)
3) 사용자가 [시트] 클릭 → tbody 렌더 분기. 셀이 클릭 가능 모드로 변환
4) 사용자가 임의 셀 클릭 → 해당 셀이 input/select로 활성화. 기존 값 미리 채워짐
5) 값 수정 후 Enter 또는 셀 외부 클릭 → commit (TABLE_DATA[activeTable] 업데이트)
6) Esc → 편집 취소, 원래 값 복원
7) Tab → 다음 편집 가능 컬럼으로 이동 (uuid/pk 건너뜀)
8) Enter (편집 중) → commit + 아래 행 같은 컬럼으로 이동 (Excel/Sheets 패턴)
9) 비편집 모드에서 ↑↓←→로 셀 포커스 이동
10) Ctrl+C → 선택 범위 TSV 클립보드 복사 / Ctrl+V → 클립보드 TSV 붙여넣기 (M5)
```

**상태 보존**:
- viewMode 전환 시 `searchQuery`, `sortByTable`, `selectedRows`는 그대로 (rows useMemo 재실행만)
- 시트에서 [표]로 돌아가도 직전 편집 결과는 `tableData` state에 남음 (refresh 시 mock 초기값 복귀 — 본 PR 범위 outside)

---

## 2. UI 구조

### 2.1 Toolbar viewMode 토글 (`data-section.tsx:543` 블록)

```tsx
<div className="flex items-center gap-2">
  <ViewModeToggle viewMode={viewMode} onChange={setViewMode} />
  <Separator orientation="vertical" className="h-5" />
  {/* 기존 검색·필터·내보내기·레코드 추가 */}
</div>
```

`ViewModeToggle` 디자인 (inline `data-section.tsx`에 작성, 별 컴포넌트 분리는 향후 칸반 추가 시):

```tsx
<div className="inline-flex items-center rounded-md border border-border/60 bg-secondary/40 p-0.5">
  <button
    onClick={() => onChange("table")}
    className={cn(
      "px-2.5 py-1 text-xs rounded-sm flex items-center gap-1.5 transition-colors",
      viewMode === "table" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
    )}
  >
    <List className="w-3.5 h-3.5" /> 표
  </button>
  <button onClick={() => onChange("sheet")} className={...}>
    <Pencil className="w-3.5 h-3.5" /> 시트
  </button>
</div>
```

- 아이콘: `lucide-react`의 `List`, `Pencil` (현재 import 중)
- 활성 상태: `bg-background shadow-sm` (minimalist 가드 — 약한 그림자만)
- 토큰: `border-border/60`, `bg-secondary/40` 등 기존 패턴 따름

### 2.2 시트 모드 행 렌더 (`data-section.tsx:598` `rows.map` 블록)

```tsx
<tbody>
  {rows.map((row) => (
    viewMode === "sheet"
      ? <SheetRow key={row.id} row={row} fields={table.fields}
                  editingCell={editingCell} setEditingCell={setEditingCell}
                  onCellCommit={handleCellCommit}
                  isSelected={selectedRows.includes(row.id)}
                  onToggleSelection={toggleRowSelection} />
      : <TableRow key={row.id} ... />  // 기존 코드 추출
  ))}
</tbody>
```

**`TableRow` 추출** (선택, 가독성 위함): 현재 `<tr>` 인라인 블록(`data-section.tsx:601-651`)을 별 컴포넌트로 분리. 변경 최소화 원칙이면 인라인 유지하고 ternary로 `<SheetRow>`만 추가도 OK. 결정: **인라인 ternary 유지 + `SheetRow`만 신규**. 기존 코드 변경 최소화.

---

## 3. 컴포넌트 분해

### 3.1 `DataSection` (수정)

**신규 state**:
```ts
const [viewMode, setViewMode] = useState<"table" | "sheet">("table")
const [editingCell, setEditingCell] = useState<{ rowId: string; fieldName: string } | null>(null)
const [tableData, setTableData] = useState<typeof TABLE_DATA>(TABLE_DATA)
const [focusedCell, setFocusedCell] = useState<{ rowId: string; fieldName: string } | null>(null)  // 비편집 모드 포커스
```

**기존 state 변경**:
- `data` 변수 (data-section.tsx:393): `TABLE_DATA[activeTable]` → `tableData[activeTable]` (이름만 교체. useMemo 재실행 자동)

**신규 핸들러**:
```ts
const handleCellCommit = useCallback(
  (rowId: string, fieldName: string, newValue: unknown) => {
    setTableData(prev => ({
      ...prev,
      [activeTable]: prev[activeTable].map(row =>
        row.id === rowId ? { ...row, [fieldName]: newValue } : row
      )
    }))
    setEditingCell(null)
  },
  [activeTable]
)
```

### 3.2 `SheetRow` (신규, 인라인 또는 `components/sections/sheet/SheetRow.tsx`)

**Props**:
```ts
interface SheetRowProps {
  row: AnyRow
  fields: Field[]
  editingCell: { rowId: string; fieldName: string } | null
  setEditingCell: (cell: { rowId: string; fieldName: string } | null) => void
  onCellCommit: (rowId: string, fieldName: string, value: unknown) => void
  isSelected: boolean
  onToggleSelection: (rowId: string) => void
  focusedCell: { rowId: string; fieldName: string } | null
  setFocusedCell: (cell: { rowId: string; fieldName: string } | null) => void
}
```

**구조**: 기존 `<tr>` 패턴 그대로 + 각 `<td>`를 `<SheetCell>`로 교체.

### 3.3 `SheetCell` (신규, `components/sections/sheet/SheetCell.tsx`)

**Props**:
```ts
interface SheetCellProps {
  field: Field                     // FieldType 분기 기준
  value: unknown                   // 현재 값
  isEditing: boolean               // editingCell === { rowId, fieldName }
  isFocused: boolean               // focusedCell === { rowId, fieldName }
  onStartEdit: () => void          // 클릭 시
  onCommit: (newValue: unknown) => void
  onCancel: () => void
}
```

**Render 로직**:
```ts
if (field.pk || field.type === "uuid" || field.type === "fk") {
  return <ReadOnlyCell field={field} value={value} isFocused={isFocused} />
  // 기존 <Cell> 렌더 + focus ring 추가
}

if (isEditing) {
  switch (field.type) {
    case "string": case "email": case "phone":
      return <InlineInput type={...} value={value} onCommit onCancel />
    case "number":
      return <InlineInput type="number" ... />
    case "datetime":
      return <InlineInput type="datetime-local" ... />
    case "text":
      return <InlineTextarea value={value} onCommit onCancel />
    case "select": case "status":
      return <InlineSelect options={field.enum ?? []} value={value} onCommit onCancel />
  }
}

// 비편집 모드: 기존 <Cell> 그대로 렌더 (status pill 등 보존)
return (
  <button
    type="button"
    onClick={onStartEdit}
    className={cn(
      "w-full text-left rounded-sm px-1 -mx-1 transition-colors",
      "hover:bg-foreground/5",
      isFocused && "ring-1 ring-ring"
    )}
  >
    <Cell field={field} value={value} />
  </button>
)
```

**가드 (minimalist-skill 적용)**:
- 활성 셀: `ring-1 ring-ring` (토큰. inline hex ❌)
- shadow ❌, gradient ❌
- 편집 input의 `border` / `bg`는 토큰만
- `framer-motion` ❌ (transition은 Tailwind `transition-colors`만)

### 3.4 `InlineInput` / `InlineSelect` / `InlineTextarea` (신규, 같은 파일 내부)

**`InlineInput`** (text/email/phone/number/datetime):
```tsx
function InlineInput({ type, value, onCommit, onCancel }: ...) {
  const [draft, setDraft] = useState(String(value ?? ""))
  const ref = useRef<HTMLInputElement>(null)
  useEffect(() => { ref.current?.focus(); ref.current?.select() }, [])

  return (
    <input
      ref={ref}
      type={type}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => onCommit(coerceValue(draft, type))}
      onKeyDown={(e) => {
        if (e.key === "Enter") { e.preventDefault(); onCommit(coerceValue(draft, type)) }
        if (e.key === "Escape") { e.preventDefault(); onCancel() }
        // Tab은 useSheetKeyboardNav가 처리 — preventDefault ❌
      }}
      className="w-full bg-background border border-input rounded-sm px-1.5 py-0.5 text-sm outline-none focus:ring-1 focus:ring-ring"
    />
  )
}
```

`coerceValue(draft, "number") → Number(draft)` / `coerceValue(draft, "datetime") → new Date(draft).toISOString()` 등 분기. 실패 시 onCancel.

**`InlineSelect`** (select/status):
- `Field.enum` 옵션을 native `<select>`로 렌더 (단순 + accessibility)
- 또는 shadcn Select 사용 — UX 더 좋지만 native가 키보드 친화적

**`InlineTextarea`** (text):
- auto-height (`onInput`으로 `el.style.height = el.scrollHeight + "px"`)
- Enter 단독은 줄바꿈, Ctrl+Enter (또는 Shift+Enter)로 commit. 또는 blur로 commit

---

## 4. 셀 타입별 편집기 매트릭스

| `Field.type` | 예시 필드 | 비편집 (Cell) | 편집기 (SheetCell) | commit 트리거 |
|---|---|---|---|---|
| `uuid` | id | `<code>` 모노 | **read-only** | — |
| `string` | name, subject | text | `<input type="text">` | Enter / blur |
| `email` | email | text + truncate | `<input type="email">` | Enter / blur |
| `phone` | phone | text | `<input type="tel">` | Enter / blur |
| `number` | load | text-right | `<input type="number">` | Enter / blur |
| `text` | body | 60자 truncate | `<textarea>` auto-height | Ctrl+Enter / blur |
| `datetime` | opened_at | YYYY-MM-DD HH:mm | `<input type="datetime-local">` | Enter / blur |
| `select` (priority) | priority | PriorityIcon + Tooltip | `<select>` enum | change → 즉시 commit |
| `select` (channel) | channel | ChannelIcon + 텍스트 | `<select>` enum | change → 즉시 commit |
| `select` (tier) | tier | Badge + tone | `<select>` enum | change → 즉시 commit |
| `status` | status | StatusIcon + status pill | `<select>` enum + StatusIcon preview | change → 즉시 commit |
| `fk` | customer_id | 이름 + 아이디 code | **read-only** (M2 범위 외) | — |

---

## 5. 키보드 인터랙션 매트릭스 (`useSheetKeyboardNav`)

테이블 wrapper div에 `tabIndex={0}`, ref → keydown 리스너.

| 키 | 비편집 모드 (focusedCell 있음) | 편집 모드 (editingCell 있음) |
|---|---|---|
| `↑` | 위 행 같은 컬럼 (행 0이면 무시) | 입력기 기본 동작 (textarea 제외) |
| `↓` | 아래 행 같은 컬럼 | 입력기 기본 동작 |
| `←` | 이전 컬럼 (편집 가능 아니어도 포커스 OK) | 입력기 기본 동작 |
| `→` | 다음 컬럼 | 입력기 기본 동작 |
| `Tab` | 다음 *편집 가능* 컬럼 (uuid/pk/fk 건너뜀, 행 끝이면 다음 행 첫 컬럼) | commit + 다음 편집 가능 컬럼 이동 |
| `Shift+Tab` | 이전 편집 가능 컬럼 | commit + 이전 편집 가능 컬럼 |
| `Enter` | 현재 셀 편집 시작 (편집 가능일 때) | commit + **아래 행 같은 컬럼**으로 이동 (Excel 패턴) |
| `Esc` | 포커스 해제 | 편집 취소, 원래 값 복원 |
| `Space` (편집 가능) | 편집 시작 (Enter와 동일) | 입력기 기본 |
| `F2` | 편집 시작 (Excel 표준) | 입력기 기본 |
| `Delete` / `Backspace` (편집 가능 + 비편집) | 빈 문자열로 commit (uuid/pk ❌) | 입력기 기본 |
| 일반 문자 키 | 편집 시작 + 그 키로 첫 글자 채움 (Excel 표준) | 입력기 기본 |

**hook 시그니처**:
```ts
function useSheetKeyboardNav(opts: {
  fields: Field[]
  rows: AnyRow[]
  editingCell: { rowId: string; fieldName: string } | null
  focusedCell: { rowId: string; fieldName: string } | null
  setEditingCell: (cell: ... | null) => void
  setFocusedCell: (cell: ... | null) => void
  onCellCommit: (rowId: string, fieldName: string, value: unknown) => void
  containerRef: RefObject<HTMLElement>
}): void
```

**구현 메모**:
- `isEditableField(field)` = `!field.pk && field.type !== "uuid" && field.type !== "fk"`
- 행 끝 다음 컬럼 이동 시 다음 행으로 wrap (Excel 표준은 *행 끝에서 첫 컬럼으로 wrap*)
- 첫 키 입력 시 편집 시작은 IME(한글) 호환 — `compositionstart` 동안 `keydown` 무시

---

## 6. 복붙 동작 명세 (`useSheetClipboard`, M5 — 옵션)

**선택 범위 모델**:
```ts
type SheetSelection = {
  start: { rowIdx: number; fieldIdx: number }
  end:   { rowIdx: number; fieldIdx: number }
} | null
```

(현재 `selectedRows`는 행 단위 체크박스 선택. **별 state**라 충돌 없음.)

**Ctrl+C** → 선택 범위 TSV 직렬화:
```ts
const tsv = rows.slice(rowMin, rowMax + 1)
  .map(row => fields.slice(fieldMin, fieldMax + 1)
    .map(f => formatForClipboard(rowValue(row, f.name), f.type))
    .join("\t"))
  .join("\n")
navigator.clipboard.writeText(tsv)
```

`formatForClipboard`:
- `select` / `status` / `enum` → 원시 enum 키 (e.g., `"high"`)
- `datetime` → ISO 8601
- `fk` → 원본 ID (이름 ❌)

**Ctrl+V** → 클립보드 TSV 파싱:
```ts
const text = await navigator.clipboard.readText()
const matrix = text.split(/\r?\n/).map(line => line.split("\t"))
// 시작 셀(focusedCell)부터 채움
matrix.forEach((row, i) =>
  row.forEach((val, j) => {
    const target = { rowIdx: startRow + i, fieldIdx: startField + j }
    if (!isEditableField(fields[target.fieldIdx])) return  // 건너뜀
    onCellCommit(rows[target.rowIdx].id, fields[target.fieldIdx].name, parseValue(val, fields[target.fieldIdx].type))
  })
)
```

**가드**:
- 범위 초과 시 무시 (rows.length 또는 fields.length 초과)
- `parseValue` 실패 (예: number에 "abc") 시 해당 셀만 건너뜀, console.warn
- `uuid` / `pk` / `fk` 셀 건너뜀

**M5는 옵션**: M1~M4 머지 후 별 PR로 진행 가능.

---

## 7. 디스플레이 자동 추천 원칙 spec 박기 (`docs/MEMORY.md #5`)

**현재 결정** (MEMORY.md):
| 컬럼 조건 | 활성화 |
|---|---|
| 모든 테이블 | 표(읽기) + **시트(편집)** |

**구현**: 시트는 *조건 없이 모든 테이블*에 활성화. 향후 칸반/타임라인 추가 시:

```ts
// lib/view-utils.ts (신규)
export type ViewMode = "table" | "sheet" | "kanban" | "timeline" | "gallery" | "chart"

export function getAvailableViews(fields: Field[]): ViewMode[] {
  const views: ViewMode[] = ["table", "sheet"]  // 항상

  const hasStatus = fields.some(f => f.type === "status" || (f.type === "select" && ["status", "category", "tier"].includes(f.name)))
  if (hasStatus) views.push("kanban")

  const hasDate = fields.some(f => f.type === "datetime")
  if (hasDate) views.push("timeline")

  // 추후: 첨부 컬럼 → "gallery", 숫자 ≥ 2 → "chart"

  return views
}
```

본 PR(M1)에서는 `getAvailableViews`만 작성하고 토글에서는 `["table", "sheet"]`만 렌더. **칸반/타임라인은 후속 PR**.

---

## 8. minimalist-skill 가드 매트릭스 적용

[CLAUDE.md "minimalist-skill 활성 룰"](../../../CLAUDE.md) + [docs/design-skills/minimalist-skill/SKILL.md](../../design-skills/minimalist-skill/SKILL.md) 참조.

| 가드 항목 | 시트 뷰 적용 |
|---|---|
| 색상 팔레트 (warm monochrome) | 토큰만 (`bg-background`, `bg-secondary/40`, `border-border/60`). inline hex ❌ |
| 헤딩 세리프 ❌ | 적용 (Geist Sans 그대로) |
| 매크로 화이트스페이스 ❌ | 적용 (시트는 dense — `px-3 py-2` 셀 패딩 그대로) |
| 본문 `#111` (검은색 ❌) | shadcn 패턴 그대로 |
| 이모지 ❌ | 적용 (아이콘은 lucide/Phosphor만) |
| Inter 폰트 ❌ | 적용 (Geist) |
| 큰 요소 `rounded-full` ❌ | 셀/입력기는 `rounded-sm` (작은 radius) |
| `shadow-(md/lg/xl)` ❌ | 적용 (활성 셀은 `shadow-sm`만, 또는 `ring`만) |
| `h-screen` → `min-h-[100dvh]` | 본 PR 범위 외 (별 fix) |
| `framer-motion` ❌ | 적용 (Tailwind `transition-colors`만) |
| Phosphor / Radix Icons | 기존 lucide 유지 (priority/status는 Phosphor — 변경 ❌) |
| 1px 보더 토큰 우선 | `border-border/60` 토큰 |

**다이얼 권장** (옵션 3 미적용이지만 참고):
- DESIGN_VARIANCE: 1 (대칭 표준 그리드 그대로)
- MOTION_INTENSITY: 1 (hover 색만)
- VISUAL_DENSITY: 7 (앱 dense — 시트는 정보 밀도 높음)

---

## 9. 마일스톤별 구체 변경 (commit 단위)

### M1. viewMode 토글 + 시트 read-only 시각 차이만
**변경**:
- `data-section.tsx`: `viewMode` state, Toolbar `<ViewModeToggle>` (inline JSX)
- `data-section.tsx`: tbody ternary — viewMode === "sheet" 시 행 셀에 미세 시각 차이 (예: `cursor-pointer`만)
- `lib/view-utils.ts` (신규): `getAvailableViews(fields)` 정의
- 편집 ❌ (M2부터)

**목표 검증**: 토글 UX 이상 없이 동작. 표/시트 시각 차이 인지 가능.

**예상 커밋**: 1개. 영향 작음.

### M2. SheetCell 인라인 편집 (string/number/email/phone/text/datetime)
**변경**:
- `components/sections/sheet/SheetCell.tsx` (신규): `field.type` switch + `InlineInput`/`InlineTextarea`
- `data-section.tsx`: `editingCell` state, `tableData` useState, `handleCellCommit`
- `data-section.tsx` tbody 시트 분기: `<SheetCell>` 사용
- `select`/`status`는 read-only로 표시 (M3에서 처리)

**목표 검증**: 클릭 → input → Enter/blur로 commit. Esc로 취소.

**예상 커밋**: 2-3개 (SheetCell 추가 / wire-up / 타입별 input 폴리시).

### M3. SheetCell select/status 편집
**변경**:
- `SheetCell.tsx` `case "select"` / `case "status"` 추가 — `<select>` + `Field.enum`
- StatusIcon preview 옵션 (편집 중에도 아이콘 표시)

**목표 검증**: priority/status/channel/tier 편집 가능. Status 색 매핑 유지 (LOCK).

**예상 커밋**: 1-2개.

### M4. useSheetKeyboardNav (Tab/Enter/Arrow/Esc/F2/문자 키)
**변경**:
- `components/sections/sheet/useSheetKeyboardNav.ts` (신규)
- `data-section.tsx`: `focusedCell` state, `containerRef`, hook 적용
- `<SheetCell>` props에 `isFocused` 추가, focus ring 표시
- IME 호환 (`compositionstart` 처리)

**목표 검증**: 키보드만으로 셀 이동·편집 가능. Excel/Sheets 패턴.

**예상 커밋**: 2개 (hook 추가 / wire-up + 폴리시).

### M5. useSheetClipboard (Ctrl+C/V) — 옵션, 후속 PR 가능
**변경**:
- `components/sections/sheet/useSheetClipboard.ts` (신규)
- `data-section.tsx`: `sheetSelection` state, range selection (마우스 드래그)
- TSV 직렬화/파싱

**목표 검증**: 셀 범위 복사 → Excel/Sheets에 붙여넣기 OK. 역방향도.

**예상 커밋**: 1-2개.

---

## 10. PR 머지 흐름

```
M1 → push, 사용자 확인
M2 → push
M3 → push
M4 → push
M5 → 옵션
PR 생성: feat: 시트 뷰 (M1~M4 또는 M1~M5)
머지 → main
1주 후 minimalist-skill 본격 도입 또는 후퇴 결정 (CLAUDE.md 가드 평가)
```

---

## 11. 위험 / Watch Out

- **`tableData` useState로 승격** = 페이지 refresh 시 편집 결과 lost. 본 PR 범위 명시. localStorage persist는 후속 PR
- **shadcn `<Select>` vs native `<select>`**: 키보드 네비 통합 위해 native 우선. shadcn은 a11y 좋지만 useSheetKeyboardNav과 키 이벤트 충돌 가능
- **IME (한글 입력)**: 편집 시작 시 `compositionstart`/`compositionend` 처리. 한글 자모 입력 중 Enter는 commit ❌
- **다크 모드**: focus ring과 hover 색이 다크에서도 보이는지 검증 (`ring-ring`은 다크 토큰 자동 매핑)
- **virtualization 부재**: 본 PR 범위에서는 mock 데이터(13행)만이라 OK. 실 데이터 연결 시 별 PR 필요

---

## 12. Open Questions (필요 시 사용자에게)

다음 중 모호하면 구현 진입 전 사용자 confirm:
- **(Q1) M5 (복붙) 본 PR에 포함 vs 후속 PR?** — 추천: **M1~M4를 한 PR**, M5는 후속 PR (PR 사이즈 합리화)
- **(Q2) `text` 타입 commit 키** — Ctrl+Enter vs Shift+Enter? 추천: **Ctrl+Enter** (Slack/Linear 패턴)
- **(Q3) `<select>` 표준 vs shadcn `<Select>`?** — 추천: **native `<select>`** (M3에서). 키보드 네비 단순화
