// FlowBase V2 — 셀 편집기 (col.type 별 분기)
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §7
// 출처: design-ref/prototype/{prototype.jsx CellEditor, cell-types.jsx}
//
// Phase 1 시드(interviews)가 쓰는 7종: text · date · avatar · select · status · reaction · button
// LOCK: status 색 = statusColorClass/statusBgClass (미처리=blue). AI 추천 + 사람 확정.

"use client"

import { useEffect, useRef, useState } from "react"
import {
  CheckCircle,
  CircleDashed,
  CircleHalf,
  CircleNotch,
} from "@phosphor-icons/react"
import { STATUS_LABELS, type ColumnDef, type TableRow, type TicketStatus } from "@/types/flowbase"
import { statusBgClass, statusColorClass } from "@/lib/tokens"
import { cn } from "@/lib/utils"
import { AiPendingMark } from "./ai-pending-mark"
import { CellPopover, type CellOption } from "./cell-popover"

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
    default:
      return <TextCell {...props} />
  }
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
            "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
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

  // 트리거 표시 — sentiment는 색 pill, 그 외는 muted pill / theme은 평문
  let trigger: React.ReactNode
  if (col.name === "sentiment") {
    trigger = (
      <button
        type="button"
        className={cn(
          "rounded px-1.5 py-0.5 text-xs font-medium",
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
        className="rounded border border-border-subtle bg-muted px-1.5 py-0.5 text-xs"
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
              "inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[11.5px]",
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

// ── 공통 인라인 텍스트 입력 ────────────────────────────────────────
interface InlineInputProps {
  initial: string
  selectAll: boolean
  onCommit: (value: string) => void
  onCancel: () => void
}

function InlineInput({ initial, selectAll, onCommit, onCancel }: InlineInputProps) {
  const [draft, setDraft] = useState(initial)
  const [composing, setComposing] = useState(false)
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

  return (
    <input
      ref={ref}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onCompositionStart={() => setComposing(true)}
      onCompositionEnd={() => setComposing(false)}
      onBlur={() => onCommit(draft)}
      onKeyDown={(e) => {
        if (composing || e.nativeEvent.isComposing) return
        if (e.key === "Enter") {
          e.preventDefault()
          onCommit(draft)
        } else if (e.key === "Escape") {
          e.preventDefault()
          onCancel()
        }
      }}
      className="w-full rounded-sm border border-input bg-background px-1.5 py-0.5 text-[13px] outline-none focus:ring-1 focus:ring-ring"
    />
  )
}
