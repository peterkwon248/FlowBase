// FlowBase V2 — 셀 편집기 (col.type 별 분기)
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §7
// 출처: design-ref/prototype/{prototype.jsx CellEditor, cell-types.jsx}
//
// Phase 1 시드(interviews)가 쓰는 7종: text · date · avatar · select · status · reaction · button
// LOCK: status 색 = statusColorClass/statusBgClass (미처리=blue). AI 추천 + 사람 확정.

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  CheckCircle,
  CircleDashed,
  CircleHalf,
  CircleNotch,
} from "@phosphor-icons/react"
import {
  ArrowUpRight,
  Calculator,
  Clock,
  Link2,
  Sigma,
  Waypoints,
} from "lucide-react"
import {
  STATUS_LABELS,
  type AggFn,
  type ColumnDef,
  type TableRow,
  type TicketStatus,
} from "@/types/flowbase"
import { toast } from "sonner"
import { MEMORY_MIN_COUNT, useFlowBase } from "@/lib/flowbase-store"
import { evaluate, FormulaError, parseFormula } from "@/lib/formula"
import type { Expr } from "@/lib/formula"
import { coerceMultiValue } from "@/lib/multi-select"
import { statusBgClass, statusColorClass } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import { AiPendingMark } from "./ai-pending-mark"
import { CellPopover, MultiCellPopover, type CellOption } from "./cell-popover"

const STATUS_ENUM: TicketStatus[] = ["미처리", "진행중", "대기", "완료"]

// AI 확정 플래그 컬럼 — commitAiCell/dismissAiCell이 받는 col 타입.
type AiColumn = "theme" | "sentiment"

export interface EditableCellProps {
  col: ColumnDef
  row: TableRow
  editing: boolean
  // 문자키로 편집 시작 시 초기 입력값 (M4b)
  initialDraft?: string
  onStartEdit: () => void
  onStopEdit: () => void
  onUpdate: (patch: Partial<TableRow>) => void
  onCommitAi: (col: AiColumn, value: string) => void
  onDismissAi: (col: AiColumn) => void
  onButtonAction: (col: ColumnDef, row: TableRow) => void
}

export function EditableCell(props: EditableCellProps) {
  const { col, row } = props

  // id — 영구 read-only 모노
  if (col.name === "id") {
    return (
      <span className="font-mono text-xs text-muted-foreground">
        {String(row.id)}
      </span>
    )
  }

  switch (col.type) {
    case "avatar":
      return <AvatarCell {...props} />
    case "date":
      return <DateCell {...props} />
    case "status":
      return <StatusCell {...props} />
    case "reaction":
      return <ReactionCell {...props} />
    case "button":
      return <ButtonCell {...props} />
    case "select":
      return <SelectCell {...props} />
    case "multiSelect":
      return <MultiSelectCell {...props} />
    case "fk":
      return <FkCell {...props} />
    case "lookup":
      return <LookupCell {...props} />
    case "rollup":
      return <RollupCell {...props} />
    case "formula":
      return <FormulaCell {...props} />
    default:
      return <TextCell {...props} />
  }
}

// ── formula ──────────────────────────────────────────────────────
// read-only cell — col.formula 평가 결과 표시. 편집 ❌ (column-header-menu의 "Edit formula" 사용).
// AST cache: formula string → Expr | error. 같은 컬럼의 다른 행이 재파싱 안 함.
const FORMULA_AST_CACHE = new Map<string, Expr | { __error: string }>()
const FORMULA_CACHE_CAP = 200

function getFormulaAst(src: string): Expr | { __error: string } {
  const cached = FORMULA_AST_CACHE.get(src)
  if (cached) return cached
  let entry: Expr | { __error: string }
  try {
    entry = parseFormula(src)
  } catch (err) {
    entry = { __error: err instanceof Error ? err.message : String(err) }
  }
  if (FORMULA_AST_CACHE.size > FORMULA_CACHE_CAP) FORMULA_AST_CACHE.clear()
  FORMULA_AST_CACHE.set(src, entry)
  return entry
}

function FormulaCell({ col, row }: EditableCellProps) {
  // useMemo deps: formula src + formulaDeps + 각 dep의 row 값. row 전체 ref는 deps에 안 씀.
  const depKey = useMemo(() => {
    return (col.formulaDeps ?? [])
      .map((d) => {
        const v = row[d]
        if (Array.isArray(v)) return v.join("")
        return v == null ? "" : String(v)
      })
      .join("")
  }, [col.formulaDeps, row])

  const result = useMemo<
    | { kind: "empty" }
    | { kind: "error"; msg: string }
    | { kind: "value"; value: unknown }
  >(() => {
    const src = col.formula
    if (!src?.trim()) return { kind: "empty" }
    const ast = getFormulaAst(src)
    if ("__error" in ast) return { kind: "error", msg: ast.__error }
    try {
      const today = new Date().toISOString().slice(0, 10)
      const value = evaluate(ast, { row, today })
      return { kind: "value", value }
    } catch (err) {
      const msg =
        err instanceof FormulaError
          ? err.message
          : err instanceof Error
            ? err.message
            : String(err)
      return { kind: "error", msg }
    }
    // depKey 변할 때만 재평가 — row의 다른 컬럼 변화는 deps 외라 무시.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [col.formula, depKey])

  if (result.kind === "empty") {
    return (
      <span
        className="inline-flex items-center gap-1 text-xs italic text-muted-foreground"
        title="No formula — click the column header menu to edit"
      >
        <Calculator className="size-3" strokeWidth={1.75} />
        empty
      </span>
    )
  }
  if (result.kind === "error") {
    return (
      <span
        className="font-mono text-xs text-rose-500"
        title={result.msg}
      >
        ⚠ ERR
      </span>
    )
  }
  // value 렌더 — resultType에 따라 포맷
  return (
    <span className="text-sm" data-formula-result>
      {formatFormulaValue(result.value, col.formulaResultType)}
    </span>
  )
}

function formatFormulaValue(
  v: unknown,
  resultType: ColumnDef["formulaResultType"],
): string {
  if (v === null || v === undefined) return "—"
  if (resultType === "boolean") {
    return v === true || v === "true" ? "✓ Yes" : "— No"
  }
  if (resultType === "number" && typeof v === "number") {
    return Number.isInteger(v) ? String(v) : String(v)
  }
  if (resultType === "date" && typeof v === "string") return v
  if (typeof v === "string") return v
  if (typeof v === "number") return String(v)
  if (typeof v === "boolean") return v ? "true" : "false"
  return String(v)
}

// ── text ──────────────────────────────────────────────────────────
function TextCell({
  col,
  row,
  editing,
  initialDraft,
  onStartEdit,
  onStopEdit,
  onUpdate,
}: EditableCellProps) {
  const value = row[col.name]
  const text = value == null ? "" : String(value)

  // Phase 1B: workspaceMemory prefix 매치 autocomplete.
  // editing 중에만 의미 — draft 변화에 따라 prefix 매치된 학습값을 InlineInput에 전달.
  // raw 구독 + useMemo derive (selector 직접 구독 시 새 배열 → 무한 루프).
  const memoryByScope = useFlowBase((s) => s.workspaceMemory.byScope)
  const [draft, setDraft] = useState("")
  const suggestions = useMemo(() => {
    if (!editing) return undefined
    const q = draft.trim().toLowerCase()
    if (!q) return undefined
    const scope = `${col.name}::${col.libraryFieldId ?? "_"}`
    const list = memoryByScope[scope] ?? []
    const matched = list
      .filter(
        (e) =>
          e.count >= MEMORY_MIN_COUNT &&
          e.value.toLowerCase().startsWith(q) &&
          e.value.toLowerCase() !== q, // 정확 일치는 제외 (이미 입력됨)
      )
      .sort((a, b) => b.count - a.count || b.lastUsedTs - a.lastUsedTs)
      .slice(0, 5)
      .map((e) => e.value)
    return matched.length > 0 ? matched : undefined
  }, [editing, draft, memoryByScope, col.name, col.libraryFieldId])

  if (editing) {
    return (
      <InlineInput
        initial={initialDraft ?? text}
        selectAll={initialDraft === undefined}
        onCommit={(v) => {
          onUpdate({ [col.name]: v })
          onStopEdit()
        }}
        onCancel={onStopEdit}
        suggestions={suggestions}
        onDraftChange={setDraft}
      />
    )
  }
  return (
    <span
      onClick={onStartEdit}
      className="block max-w-full cursor-text truncate text-[13px]"
    >
      {text || <span className="text-muted-foreground">—</span>}
    </span>
  )
}

// ── date ──────────────────────────────────────────────────────────
function DateCell({
  col,
  row,
  editing,
  onStartEdit,
  onStopEdit,
  onUpdate,
}: EditableCellProps) {
  const value = row[col.name]
  const text = value == null ? "" : String(value)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) ref.current?.focus()
  }, [editing])

  if (editing) {
    return (
      <input
        ref={ref}
        type="date"
        defaultValue={text}
        onBlur={(e) => {
          onUpdate({ [col.name]: e.target.value })
          onStopEdit()
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            onUpdate({ [col.name]: e.currentTarget.value })
            onStopEdit()
          } else if (e.key === "Escape") {
            onStopEdit()
          }
        }}
        className="w-full rounded-sm border border-input bg-background px-1 py-0.5 font-mono text-xs outline-none focus:ring-1 focus:ring-ring"
      />
    )
  }
  return (
    <span
      onClick={onStartEdit}
      className="block cursor-text font-mono text-xs text-muted-foreground"
    >
      {text || "—"}
    </span>
  )
}

// ── avatar ────────────────────────────────────────────────────────
const AVATAR_TONES = [
  "bg-chart-1",
  "bg-chart-2",
  "bg-chart-3",
  "bg-chart-4",
  "bg-chart-5",
]

function avatarTone(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i += 1) h += name.charCodeAt(i)
  return AVATAR_TONES[h % AVATAR_TONES.length]
}

function AvatarCell({
  col,
  row,
  editing,
  initialDraft,
  onStartEdit,
  onStopEdit,
  onUpdate,
}: EditableCellProps) {
  const name = row[col.name] == null ? "" : String(row[col.name])
  const subtitle = col.subtitleField ? row[col.subtitleField] : undefined

  if (editing) {
    return (
      <InlineInput
        initial={initialDraft ?? name}
        selectAll={initialDraft === undefined}
        onCommit={(v) => {
          onUpdate({ [col.name]: v })
          onStopEdit()
        }}
        onCancel={onStopEdit}
      />
    )
  }
  return (
    <span
      onClick={onStartEdit}
      className="flex cursor-text items-center gap-2"
    >
      <span
        className={cn(
          "flex size-[22px] shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white",
          avatarTone(name),
        )}
      >
        {(name || "?").charAt(0).toUpperCase()}
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-[13px] font-medium">
          {name || "—"}
        </span>
        {subtitle != null && String(subtitle) !== "" && (
          <span className="truncate text-[10.5px] text-muted-foreground">
            {String(subtitle)}
          </span>
        )}
      </span>
    </span>
  )
}

// ── status ────────────────────────────────────────────────────────
// Kanban 칸 헤더 등에서 재사용 — status별 Phosphor 아이콘 + LOCK 색.
export function statusIcon(status: TicketStatus) {
  const cls = cn("size-3.5", statusColorClass(status))
  switch (status) {
    case "미처리":
      return <CircleDashed className={cls} weight="bold" />
    case "진행중":
      return <CircleHalf className={cls} weight="fill" />
    case "대기":
      return <CircleNotch className={cls} weight="bold" />
    case "완료":
      return <CheckCircle className={cls} weight="fill" />
  }
}

function StatusCell({
  row,
  editing,
  onStartEdit,
  onStopEdit,
  onUpdate,
}: EditableCellProps) {
  const status = (row.status as TicketStatus) ?? "미처리"
  const options: CellOption[] = STATUS_ENUM.map((s) => ({
    value: s,
    label: STATUS_LABELS[s],
    icon: statusIcon(s),
  }))

  return (
    <CellPopover
      open={editing}
      onOpenChange={(o) => (o ? onStartEdit() : onStopEdit())}
      label="Status"
      width={170}
      options={options}
      value={status}
      onSelect={(v) => onUpdate({ status: v as TicketStatus })}
      trigger={
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium",
            statusBgClass(status),
            statusColorClass(status),
          )}
        >
          {statusIcon(status)}
          <span>{STATUS_LABELS[status]}</span>
        </button>
      }
    />
  )
}

// ── select (theme · sentiment · priority 등) ──────────────────────
const SENTIMENT_TONE: Record<string, string> = {
  Positive:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  Mixed:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Negative:
    "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
}

function isAiColumn(name: string): name is AiColumn {
  return name === "theme" || name === "sentiment"
}

function SelectCell({
  col,
  row,
  editing,
  onStartEdit,
  onStopEdit,
  onUpdate,
  onCommitAi,
  onDismissAi,
}: EditableCellProps) {
  const value = row[col.name] == null ? "" : String(row[col.name])
  const options: CellOption[] = (col.options ?? []).map((o) => ({
    value: o,
    label: o,
  }))

  // Workspace Memory — 자동 학습된 값 중 frequency 2+, col.options에 없는 것만 노출.
  // raw byScope 구독 후 useMemo로 derive (selector 직접 구독 시 새 배열 반환 → 무한 루프).
  const memoryByScope = useFlowBase((s) => s.workspaceMemory.byScope)
  const recent: CellOption[] | undefined = useMemo(() => {
    const scope = `${col.name}::${col.libraryFieldId ?? "_"}`
    const list = memoryByScope[scope] ?? []
    if (list.length === 0) return undefined
    const excluded = new Set(col.options ?? [])
    const filtered = list
      .filter((e) => e.count >= MEMORY_MIN_COUNT)
      .filter((e) => !excluded.has(e.value))
      .sort((a, b) => b.count - a.count || b.lastUsedTs - a.lastUsedTs)
      .slice(0, 5)
    if (filtered.length === 0) return undefined
    return filtered.map((e) => ({ value: e.value, label: e.value }))
  }, [memoryByScope, col.name, col.libraryFieldId, col.options])

  // AI 컬럼(theme/sentiment) — pending이면 마커 + Accept/Dismiss
  const aiCol = col.ai && isAiColumn(col.name) ? col.name : null
  const pending =
    aiCol === "theme"
      ? row.themeConfirmed === false
      : aiCol === "sentiment"
        ? row.sentimentConfirmed === false
        : false

  const handleSelect = (v: string) => {
    if (aiCol) onCommitAi(aiCol, v)
    else onUpdate({ [col.name]: v })
  }

  // Memory → Library promote bridge (Phase F1 + F2).
  // Recent item "+" 버튼 → col.options에 추가 + col.libraryFieldId 있으면 Library OptionList도 sync.
  // 자동 ❌, 명시 click 시만 (LOCK).
  const updateColumn = useFlowBase((s) => s.updateColumn)
  const addOptionToLibraryField = useFlowBase(
    (s) => s.addOptionToLibraryField,
  )
  const handlePromote = (v: string) => {
    const existing = col.options ?? []
    if (existing.includes(v)) {
      toast.info(`"${v}" is already in ${col.label || col.name} options.`)
      return
    }
    updateColumn(col.name, { options: [...existing, v] })
    // F2: Library link 있으면 Library에도 sync
    let libSynced = false
    if (col.libraryFieldId) {
      libSynced = addOptionToLibraryField(col.libraryFieldId, v)
    }
    toast.success(`Saved "${v}" as ${col.label || col.name} option`, {
      description: libSynced
        ? "Also synced to Library (linked column)."
        : "Available in this column from now on.",
    })
  }

  // 트리거 표시 — sentiment는 색 pill, 그 외는 muted pill / theme은 평문
  let trigger: React.ReactNode
  if (col.name === "sentiment") {
    trigger = (
      <button
        type="button"
        className={cn(
          "whitespace-nowrap rounded px-1.5 py-0.5 text-xs font-medium",
          SENTIMENT_TONE[value] ?? "bg-muted text-muted-foreground",
        )}
      >
        {value || "—"}
      </button>
    )
  } else if (col.name === "theme") {
    trigger = (
      <button type="button" className="text-left text-[13px]">
        {value || <span className="text-muted-foreground">—</span>}
      </button>
    )
  } else {
    trigger = (
      <button
        type="button"
        className="whitespace-nowrap rounded border border-border-subtle bg-muted px-1.5 py-0.5 text-xs"
      >
        {value || "—"}
      </button>
    )
  }

  return (
    <AiPendingMark pending={pending} underline={col.name === "theme"}>
      <CellPopover
        open={editing}
        onOpenChange={(o) => (o ? onStartEdit() : onStopEdit())}
        label={col.label?.trim() || undefined}
        width={col.name === "theme" ? 220 : 170}
        options={options}
        recent={recent}
        onPromote={handlePromote}
        value={value}
        onSelect={handleSelect}
        ai={
          aiCol
            ? {
                pending,
                onAccept: () => onCommitAi(aiCol, value),
                onDismiss: () => onDismissAi(aiCol),
              }
            : undefined
        }
        trigger={trigger}
      />
    </AiPendingMark>
  )
}

// ── multiSelect ────────────────────────────────────────────────────
// cell = string[]. trigger = chip 여러 개 (whitespace-nowrap LOCK).
// popover toggle = MultiCellPopover. "+ Add new"로 col.options 즉시 확장.
function MultiSelectCell({
  col,
  row,
  editing,
  onStartEdit,
  onStopEdit,
  onUpdate,
}: EditableCellProps) {
  const raw = row[col.name]
  const values = useMemo(() => coerceMultiValue(raw), [raw])
  const options: CellOption[] = (col.options ?? []).map((o) => ({
    value: o,
    label: o,
  }))

  // Workspace Memory Recent — col.options에 없는 frequency 2+ 학습 값.
  const memoryByScope = useFlowBase((s) => s.workspaceMemory.byScope)
  const recent: CellOption[] | undefined = useMemo(() => {
    const scope = `${col.name}::${col.libraryFieldId ?? "_"}`
    const list = memoryByScope[scope] ?? []
    if (list.length === 0) return undefined
    const excluded = new Set(col.options ?? [])
    const filtered = list
      .filter((e) => e.count >= MEMORY_MIN_COUNT)
      .filter((e) => !excluded.has(e.value))
      .sort((a, b) => b.count - a.count || b.lastUsedTs - a.lastUsedTs)
      .slice(0, 5)
    if (filtered.length === 0) return undefined
    return filtered.map((e) => ({ value: e.value, label: e.value }))
  }, [memoryByScope, col.name, col.libraryFieldId, col.options])

  const updateColumn = useFlowBase((s) => s.updateColumn)
  const addOptionToLibraryField = useFlowBase((s) => s.addOptionToLibraryField)

  // multi-click 사이 stale closure 방지 — values는 row prop의 snapshot이라
  // 같은 tick에 두 번 click하면 두 번째가 첫 번째 결과를 못 봄. store에서 최신 row 읽기.
  const currentValues = (): string[] => {
    const s = useFlowBase.getState()
    const b = s.boards[s.activeBoardId]
    const cur = b?.rows.find((r) => r.id === row.id)
    return coerceMultiValue(cur?.[col.name])
  }

  const handleToggle = (v: string) => {
    const arr = currentValues()
    const next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]
    onUpdate({ [col.name]: next })
  }

  // "+ Add new" — col.options에 추가 + 즉시 toggle on. Library link 있으면 sync.
  const handleAddNew = (v: string) => {
    const existing = col.options ?? []
    if (!existing.includes(v)) {
      updateColumn(col.name, { options: [...existing, v] })
      if (col.libraryFieldId) addOptionToLibraryField(col.libraryFieldId, v)
    }
    const arr = currentValues()
    if (!arr.includes(v)) onUpdate({ [col.name]: [...arr, v] })
  }

  // Recent "+" promote — col.options에 추가 (toggle은 별도).
  const handlePromote = (v: string) => {
    const existing = col.options ?? []
    if (existing.includes(v)) {
      toast.info(`"${v}" is already in ${col.label || col.name} options.`)
      return
    }
    updateColumn(col.name, { options: [...existing, v] })
    let libSynced = false
    if (col.libraryFieldId) {
      libSynced = addOptionToLibraryField(col.libraryFieldId, v)
    }
    toast.success(`Saved "${v}" as ${col.label || col.name} option`, {
      description: libSynced
        ? "Also synced to Library (linked column)."
        : "Available in this column from now on.",
    })
  }

  const trigger = (
    <button
      type="button"
      className="flex w-full flex-wrap items-center gap-1 rounded text-left"
    >
      {values.length === 0 ? (
        <span className="text-[13px] text-muted-foreground">—</span>
      ) : (
        values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center whitespace-nowrap rounded border border-border-subtle bg-muted px-1.5 py-0.5 text-xs text-foreground"
          >
            {v}
          </span>
        ))
      )}
    </button>
  )

  return (
    <MultiCellPopover
      open={editing}
      onOpenChange={(o) => (o ? onStartEdit() : onStopEdit())}
      label={col.label?.trim() || undefined}
      width={220}
      options={options}
      values={values}
      onToggle={handleToggle}
      onAddNew={handleAddNew}
      recent={recent}
      onPromote={handlePromote}
      trigger={trigger}
    />
  )
}

// ── reaction (votes) ──────────────────────────────────────────────
interface VotesShape {
  positive: number
  mixed: number
  negative: number
}

const REACTIONS: { key: keyof VotesShape; emoji: string; tone: string }[] = [
  {
    key: "positive",
    emoji: "😊",
    tone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  {
    key: "mixed",
    emoji: "😐",
    tone: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  {
    key: "negative",
    emoji: "😞",
    tone: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  },
]

function ReactionCell({ col, row, onUpdate }: EditableCellProps) {
  const raw = row[col.name]
  const votes: VotesShape =
    raw && typeof raw === "object"
      ? (raw as VotesShape)
      : { positive: 0, mixed: 0, negative: 0 }

  return (
    <span className="inline-flex gap-1">
      {REACTIONS.map((r) => {
        const n = votes[r.key] ?? 0
        return (
          <button
            key={r.key}
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onUpdate({ [col.name]: { ...votes, [r.key]: n + 1 } })
            }}
            className={cn(
              "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-1.5 py-px text-[11.5px]",
              n > 0 ? r.tone : "bg-muted text-muted-foreground",
            )}
          >
            <span className="text-[11px]">{r.emoji}</span>
            <span className="font-semibold tabular-nums">{n}</span>
          </button>
        )
      })}
    </span>
  )
}

// ── button ────────────────────────────────────────────────────────
function ButtonCell({ col, row, onButtonAction }: EditableCellProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onButtonAction(col, row)
      }}
      className="inline-flex items-center gap-1.5 rounded-md border border-primary/35 bg-primary/10 px-2.5 py-1 text-[11.5px] font-medium text-primary hover:bg-primary/15"
    >
      {col.buttonLabel ?? "Action"}
    </button>
  )
}

// ── fk (relation) ──────────────────────────────────────────────────
// cross-board 참조 — col.fk = 타겟 보드 id. 값 = 타겟 row id. 표시 = 타겟 행 라벨 컬럼.
// 라벨 컬럼 = 타겟 보드 첫 비-id text/avatar (없으면 id). 편집 = 타겟 행 선택 popover.
function FkCell({
  col,
  row,
  editing,
  onStartEdit,
  onStopEdit,
  onUpdate,
}: EditableCellProps) {
  const targetBoard = useFlowBase((s) => (col.fk ? s.boards[col.fk] : undefined))
  const switchBoard = useFlowBase((s) => s.switchBoard)
  const setActivityMode = useFlowBase((s) => s.setActivityMode)
  const setSelected = useFlowBase((s) => s.setSelected)
  const setFocused = useFlowBase((s) => s.setFocused)

  const labelCol = useMemo(() => {
    if (!targetBoard) return "id"
    const c = targetBoard.columns.find(
      (col2) =>
        col2.name !== "id" && (col2.type === "text" || col2.type === "avatar"),
    )
    return c?.name ?? "id"
  }, [targetBoard])

  const currentId = row[col.name] == null ? "" : String(row[col.name])

  // 타겟 보드 없음 (삭제됨 등) — fk id 평문 fallback.
  if (!targetBoard) {
    return (
      <span
        className="font-mono text-xs text-muted-foreground"
        title="Target table not found"
      >
        {currentId || "—"}
      </span>
    )
  }

  const labelOf = (r: TableRow): string => {
    const v = r[labelCol]
    return v == null || v === "" ? String(r.id) : String(v)
  }

  const currentRow = targetBoard.rows.find((r) => String(r.id) === currentId)
  const display = currentRow ? labelOf(currentRow) : currentId

  const options: CellOption[] = [
    { value: "", label: "— None" },
    ...targetBoard.rows.map((r) => ({
      value: String(r.id),
      label: labelOf(r),
    })),
  ]

  // 연결된 행으로 점프 — 타겟 보드로 전환 + 해당 행 선택/포커스.
  const jumpToRelated = () => {
    if (!col.fk || !currentRow) return
    switchBoard(col.fk)
    setActivityMode("tables")
    setSelected([String(currentRow.id)])
    setFocused({ row: String(currentRow.id), col: labelCol })
    toast.success(`Jumped to ${targetBoard.label}`, {
      id: "fk-jump",
      description: labelOf(currentRow),
    })
  }

  const trigger = (
    <button
      type="button"
      data-fk-cell={col.name}
      className="inline-flex max-w-full items-center gap-1 truncate rounded border border-border-subtle bg-muted px-1.5 py-0.5 text-xs"
    >
      {display ? (
        <>
          <Link2 className="size-3 shrink-0 text-primary" strokeWidth={2} />
          <span className="truncate">{display}</span>
        </>
      ) : (
        <span className="text-muted-foreground">—</span>
      )}
    </button>
  )

  return (
    <span className="inline-flex max-w-full items-center gap-0.5">
      <CellPopover
        open={editing}
        onOpenChange={(o) => (o ? onStartEdit() : onStopEdit())}
        label={`→ ${targetBoard.label}`}
        width={220}
        options={options}
        value={currentId}
        onSelect={(v) => onUpdate({ [col.name]: v })}
        trigger={trigger}
      />
      {currentRow && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            jumpToRelated()
          }}
          title={`Go to ${targetBoard.label} · ${labelOf(currentRow)}`}
          data-fk-jump={col.name}
          className="flex size-4 shrink-0 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-foreground/[0.08] hover:text-primary"
        >
          <ArrowUpRight className="size-3" strokeWidth={2} />
        </button>
      )}
    </span>
  )
}

// ── lookup ──────────────────────────────────────────────────────────
// via(같은 보드의 fk 컬럼) → 연결된 타겟 행 → field 값을 읽어 표시 (read-only).
function LookupCell({ col, row }: EditableCellProps) {
  const lookup = col.lookup
  const viaName = lookup?.via
  const targetBoard = useFlowBase((s) => {
    if (!viaName) return undefined
    const b = s.boards[s.activeBoardId]
    const fkc = b?.columns.find((c) => c.name === viaName)
    return fkc?.fk ? s.boards[fkc.fk] : undefined
  })

  if (!lookup || !targetBoard) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  const targetId = row[lookup.via]
  if (targetId == null || targetId === "") {
    return <span className="text-xs italic text-muted-foreground/50">—</span>
  }
  const targetRow = targetBoard.rows.find(
    (r) => String(r.id) === String(targetId),
  )
  if (!targetRow) {
    return <span className="text-xs text-muted-foreground">—</span>
  }

  const display = formatLookupValue(targetRow[lookup.field])
  return (
    <span
      className="inline-flex max-w-full items-center gap-1 truncate text-[13px] text-muted-foreground"
      data-lookup-cell={col.name}
      title={`${lookup.via} → ${lookup.field}`}
    >
      <Waypoints
        className="size-3 shrink-0 text-muted-foreground/40"
        strokeWidth={1.75}
      />
      {display ? (
        <span className="truncate">{display}</span>
      ) : (
        <span className="text-muted-foreground/50">—</span>
      )}
    </span>
  )
}

function formatLookupValue(v: unknown): string {
  if (v == null) return ""
  if (Array.isArray(v)) return v.join(", ")
  if (typeof v === "object") return ""
  return String(v)
}

// ── rollup ──────────────────────────────────────────────────────────
// 이 보드를 참조하는 source 보드 행들(viaFk === 이 행 id)을 aggFn으로 집계 (read-only).
function RollupCell({ col, row }: EditableCellProps) {
  const rollup = col.rollup
  const sourceBoard = useFlowBase((s) =>
    rollup ? s.boards[rollup.sourceBoard] : undefined,
  )
  if (!rollup || !sourceBoard) {
    return <span className="text-xs text-muted-foreground">—</span>
  }
  const myId = String(row.id)
  const matching = sourceBoard.rows.filter(
    (r) => String(r[rollup.viaFk]) === myId,
  )
  const result = aggregateRollup(matching, rollup.aggFn, rollup.field)
  return (
    <span
      className="inline-flex items-center gap-1 text-[13px] tabular-nums text-foreground"
      data-rollup-cell={col.name}
      title={`${rollup.aggFn}${rollup.field ? ` of ${rollup.field}` : ""} · ${sourceBoard.label}`}
    >
      <Sigma
        className="size-3 shrink-0 text-muted-foreground/40"
        strokeWidth={1.75}
      />
      {result}
    </span>
  )
}

function aggregateRollup(
  rows: TableRow[],
  aggFn: AggFn,
  field?: string,
): string {
  if (aggFn === "count") return String(rows.length)
  if (!field) return String(rows.length)
  const nums = rows
    .map((r) => Number(r[field]))
    .filter((n) => Number.isFinite(n))
  if (nums.length === 0) return "—"
  const sum = nums.reduce((a, b) => a + b, 0)
  const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2))
  switch (aggFn) {
    case "sum":
      return fmt(sum)
    case "avg":
      return fmt(sum / nums.length)
    case "min":
      return fmt(Math.min(...nums))
    case "max":
      return fmt(Math.max(...nums))
    case "median": {
      const sorted = [...nums].sort((a, b) => a - b)
      const mid = Math.floor(sorted.length / 2)
      return fmt(
        sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2,
      )
    }
    default:
      return String(rows.length)
  }
}

// ── 공통 인라인 텍스트 입력 ────────────────────────────────────────
interface InlineInputProps {
  initial: string
  selectAll: boolean
  onCommit: (value: string) => void
  onCancel: () => void
  // Phase 1B: 학습된 값 prefix 매치 suggestion list. 키보드 ↑↓/Enter/Esc 지원.
  // 부모(TextCell)가 draft 변화 받아 memoryByScope에서 prefix 매치 후 prop으로 갱신.
  suggestions?: string[]
  onDraftChange?: (draft: string) => void
}

function InlineInput({
  initial,
  selectAll,
  onCommit,
  onCancel,
  suggestions,
  onDraftChange,
}: InlineInputProps) {
  const [draft, setDraft] = useState(initial)
  const [composing, setComposing] = useState(false)
  const [activeIdx, setActiveIdx] = useState(0)
  const [open, setOpen] = useState(true) // suggestion list 표시 토글 (Esc 한 번 시 닫고 또 누르면 cancel)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    if (selectAll) el.select()
    else {
      const end = el.value.length
      el.setSelectionRange(end, end)
    }
  }, [selectAll])

  // draft 변경 시 부모 통지 (prefix 매치 재계산용)
  useEffect(() => {
    onDraftChange?.(draft)
  }, [draft, onDraftChange])

  // suggestions 갱신될 때마다 activeIdx 0으로 reset
  useEffect(() => {
    setActiveIdx(0)
  }, [suggestions])

  const list = open ? suggestions ?? [] : []
  const hasList = list.length > 0

  const commit = (v: string) => {
    onCommit(v)
  }

  return (
    <div className="relative">
      <input
        ref={ref}
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value)
          setOpen(true)
        }}
        onCompositionStart={() => setComposing(true)}
        onCompositionEnd={() => setComposing(false)}
        onBlur={() => commit(draft)}
        onKeyDown={(e) => {
          if (composing || e.nativeEvent.isComposing) return
          if (hasList && e.key === "ArrowDown") {
            e.preventDefault()
            setActiveIdx((i) => (i + 1) % list.length)
            return
          }
          if (hasList && e.key === "ArrowUp") {
            e.preventDefault()
            setActiveIdx((i) => (i - 1 + list.length) % list.length)
            return
          }
          if (e.key === "Enter") {
            e.preventDefault()
            // suggestion 있으면 그것, 없으면 draft commit
            commit(hasList ? list[activeIdx] : draft)
          } else if (e.key === "Escape") {
            e.preventDefault()
            // 1단계: list 열려있으면 닫기만. 2단계: cancel
            if (hasList) {
              setOpen(false)
            } else {
              onCancel()
            }
          } else if (e.key === "Tab" && hasList) {
            // Tab → 현재 active suggestion으로 commit (Notion 패턴)
            e.preventDefault()
            commit(list[activeIdx])
          }
        }}
        className="w-full rounded-sm border border-input bg-background px-1.5 py-0.5 text-[13px] outline-none focus:ring-1 focus:ring-ring"
      />
      {hasList && (
        <ul
          className="absolute left-0 top-full z-50 mt-1 max-h-48 w-full min-w-[160px] overflow-y-auto rounded-md border border-border-subtle bg-popover py-1 shadow-md"
          data-text-autocomplete
        >
          {list.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                // onMouseDown로 commit — 입력 onBlur보다 먼저 실행되어 draft commit 막음.
                onMouseDown={(e) => {
                  e.preventDefault()
                  commit(s)
                }}
                onMouseEnter={() => setActiveIdx(i)}
                className={cn(
                  "flex w-full items-center gap-1.5 px-2 py-1 text-left text-[12.5px] transition-colors",
                  i === activeIdx
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-foreground/[0.04]",
                )}
              >
                <Clock
                  className="size-3 shrink-0 text-muted-foreground/60"
                  strokeWidth={1.75}
                />
                <span className="flex-1 truncate">{s}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
