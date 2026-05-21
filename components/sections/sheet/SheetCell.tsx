// design.md §3.3 SheetCell — M2: string/number/email/phone/text/datetime, M3: select/status 인라인 편집
// uuid/pk/fk는 영구 read-only.
//
// 가드 (CLAUDE.md minimalist-skill):
// - 토큰만 사용 (border-input, ring-ring, bg-background)
// - shadow-sm만, gradient/heavy shadow ❌
// - framer-motion ❌, transition-colors만 (Tailwind)

"use client"

import { useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { Field } from "@/lib/mock-data"
import { Cell } from "../data-section"
import { ChipSelect } from "./ChipSelect"

export type CellId = { rowId: string; fieldName: string }

export type AdvanceDirection = "next" | "prev" | "down"

interface SheetCellProps {
  field: Field
  value: unknown
  rowId: string
  isEditing: boolean
  isFocused?: boolean
  // M4b: 문자키로 편집 시작 시 initialDraft (없으면 현재 value)
  initialDraft?: string
  // select/status — 사용자가 추가한 enum 옵션 (field.enum + customOptions = merged)
  customOptions?: string[]
  onAddOption?: (opt: string) => void
  onStartEdit: () => void
  onCommit: (newValue: unknown) => void
  // M4b: 편집 모드 Tab/Enter — commit + 다음 셀 자동 이동
  onCommitAndAdvance?: (newValue: unknown, direction: AdvanceDirection) => void
  onCancel: () => void
}

// design.md §5: editable 판단 — uuid/pk/fk는 영구 read-only
export function isEditableField(field: Field): boolean {
  if (field.pk) return false
  if (field.type === "uuid" || field.type === "fk") return false
  return true
}

// 시트 뷰에서 인라인 편집 가능한 type
// M2: string/email/phone/number/text/datetime, M3: select/status 추가
const EDITABLE_TYPES = new Set([
  "string",
  "email",
  "phone",
  "number",
  "text",
  "datetime",
  "select",
  "status",
])

function supportsInlineEdit(field: Field): boolean {
  if (!isEditableField(field)) return false
  return EDITABLE_TYPES.has(field.type)
}

export function SheetCell({
  field,
  value,
  rowId: _rowId,
  isEditing,
  isFocused = false,
  initialDraft,
  customOptions,
  onAddOption,
  onStartEdit,
  onCommit,
  onCommitAndAdvance,
  onCancel,
}: SheetCellProps) {
  // 미지원 type (uuid/pk/fk): 비편집 Cell + focus ring (편집은 ❌, 키보드 네비로 통과만 가능)
  if (!supportsInlineEdit(field)) {
    return (
      <div
        className={cn(
          "rounded-sm -mx-1 px-1 py-0.5",
          isFocused && "ring-1 ring-ring",
        )}
      >
        <Cell field={field} value={value} />
      </div>
    )
  }

  if (isEditing) {
    if (field.type === "text") {
      return (
        <InlineTextarea
          value={value}
          initialDraft={initialDraft}
          onCommit={onCommit}
          onCommitAndAdvance={onCommitAndAdvance}
          onCancel={onCancel}
        />
      )
    }
    // M3 → ChipSelect: pill 모양 dropdown + 새 옵션 추가
    if (field.type === "select" || field.type === "status") {
      const merged = [...(field.enum ?? []), ...(customOptions ?? [])]
      return (
        <ChipSelect
          field={field}
          value={value}
          options={merged}
          onCommit={onCommit}
          onCommitAndAdvance={onCommitAndAdvance}
          onAddOption={onAddOption}
          onCancel={onCancel}
        />
      )
    }
    return (
      <InlineInput
        type={inputTypeFor(field.type)}
        rawType={field.type}
        value={value}
        initialDraft={initialDraft}
        onCommit={onCommit}
        onCommitAndAdvance={onCommitAndAdvance}
        onCancel={onCancel}
      />
    )
  }

  // 비편집 모드: button wrapper + 클릭 시 편집 시작
  return (
    <button
      type="button"
      onClick={onStartEdit}
      tabIndex={-1}
      className={cn(
        "w-full text-left rounded-sm -mx-1 px-1 py-0.5 cursor-pointer",
        "transition-colors hover:bg-foreground/[0.05] dark:hover:bg-foreground/[0.07]",
        "focus:outline-none",
        isFocused && "ring-1 ring-ring",
      )}
      aria-label={`${field.name} 편집`}
    >
      <Cell field={field} value={value} />
    </button>
  )
}

// ─────────────────────────────────────────────────────────────────
// InlineInput — text/email/phone/number/datetime
// ─────────────────────────────────────────────────────────────────

interface InlineInputProps {
  type: string // HTML input type
  rawType: string // FieldType — coerce 시 사용
  value: unknown
  initialDraft?: string // M4b: 문자키로 편집 시작 시
  onCommit: (newValue: unknown) => void
  onCommitAndAdvance?: (newValue: unknown, direction: AdvanceDirection) => void
  onCancel: () => void
}

function InlineInput({
  type,
  rawType,
  value,
  initialDraft,
  onCommit,
  onCommitAndAdvance,
  onCancel,
}: InlineInputProps) {
  const [draft, setDraft] = useState<string>(
    initialDraft !== undefined ? initialDraft : toEditableString(value, rawType),
  )
  const [isComposing, setIsComposing] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ref.current?.focus()
    // initialDraft (문자키 편집 시작) — 커서를 끝에 두기, select ❌
    // 일반 진입 — 전체 select (사용자가 즉시 덮어쓰기 쉽게)
    if (initialDraft === undefined) ref.current?.select()
  }, [initialDraft])

  const commitOrCancel = (advanceDirection?: AdvanceDirection) => {
    const coerced = coerceValue(draft, rawType)
    if (coerced === COERCE_FAILED) {
      onCancel()
      return
    }
    if (advanceDirection && onCommitAndAdvance) {
      onCommitAndAdvance(coerced, advanceDirection)
    } else {
      onCommit(coerced)
    }
  }

  return (
    <input
      ref={ref}
      type={type}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onCompositionStart={() => setIsComposing(true)}
      onCompositionEnd={() => setIsComposing(false)}
      onBlur={() => commitOrCancel()}
      onKeyDown={(e) => {
        if (isComposing) return
        if (e.key === "Enter") {
          e.preventDefault()
          commitOrCancel("down")
        } else if (e.key === "Tab") {
          e.preventDefault()
          commitOrCancel(e.shiftKey ? "prev" : "next")
        } else if (e.key === "Escape") {
          e.preventDefault()
          onCancel()
        }
      }}
      className={cn(
        "w-full bg-background border border-input rounded-sm",
        "px-1.5 py-0.5 text-sm font-[inherit]",
        "outline-none focus:ring-1 focus:ring-ring",
        rawType === "number" && "tabular-nums font-mono text-xs text-right",
        rawType === "datetime" && "tabular-nums font-mono text-xs",
        (rawType === "email" || rawType === "phone") && "font-mono text-xs",
      )}
    />
  )
}

// ─────────────────────────────────────────────────────────────────
// InlineTextarea — text (long-form)
// ─────────────────────────────────────────────────────────────────

interface InlineTextareaProps {
  value: unknown
  initialDraft?: string
  onCommit: (newValue: unknown) => void
  onCommitAndAdvance?: (newValue: unknown, direction: AdvanceDirection) => void
  onCancel: () => void
}

function InlineTextarea({
  value,
  initialDraft,
  onCommit,
  onCommitAndAdvance,
  onCancel,
}: InlineTextareaProps) {
  const [draft, setDraft] = useState<string>(
    initialDraft !== undefined ? initialDraft : String(value ?? ""),
  )
  const [isComposing, setIsComposing] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    if (initialDraft === undefined) el.select()
    autoResize(el)
  }, [initialDraft])

  const advance = (direction: AdvanceDirection) => {
    if (onCommitAndAdvance) onCommitAndAdvance(draft, direction)
    else onCommit(draft)
  }

  return (
    <textarea
      ref={ref}
      value={draft}
      onChange={(e) => {
        setDraft(e.target.value)
        autoResize(e.currentTarget)
      }}
      onCompositionStart={() => setIsComposing(true)}
      onCompositionEnd={() => setIsComposing(false)}
      onBlur={() => onCommit(draft)}
      onKeyDown={(e) => {
        if (isComposing) return
        // text 타입: 단독 Enter는 줄바꿈, Ctrl/Cmd+Enter는 commit + 아래 셀 이동
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault()
          advance("down")
        } else if (e.key === "Tab") {
          e.preventDefault()
          advance(e.shiftKey ? "prev" : "next")
        } else if (e.key === "Escape") {
          e.preventDefault()
          onCancel()
        }
      }}
      rows={1}
      className={cn(
        "w-full bg-background border border-input rounded-sm",
        "px-1.5 py-0.5 text-sm font-[inherit]",
        "outline-none focus:ring-1 focus:ring-ring",
        "resize-none overflow-hidden text-muted-foreground",
      )}
    />
  )
}

function autoResize(el: HTMLTextAreaElement) {
  el.style.height = "auto"
  el.style.height = `${el.scrollHeight}px`
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

function inputTypeFor(rawType: string): string {
  switch (rawType) {
    case "email":
      return "email"
    case "phone":
      return "tel"
    case "number":
      return "number"
    case "datetime":
      return "datetime-local"
    default:
      return "text"
  }
}

function toEditableString(value: unknown, rawType: string): string {
  if (value == null) return ""
  if (rawType === "datetime") {
    // ISO → datetime-local 호환 ("YYYY-MM-DDTHH:mm")
    const s = String(value)
    if (s.length >= 16 && s[10] === "T") return s.slice(0, 16)
    const d = new Date(s)
    if (!isNaN(d.getTime())) {
      const pad = (n: number) => String(n).padStart(2, "0")
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }
    return s
  }
  return String(value)
}

const COERCE_FAILED = Symbol("coerce-failed") as unknown as never

function coerceValue(draft: string, rawType: string): unknown {
  const trimmed = draft.trim()
  if (trimmed === "") {
    // 빈 문자열은 null로 처리 (mock 데이터의 nullable 필드 대응)
    return null
  }
  switch (rawType) {
    case "number": {
      const n = Number(trimmed)
      if (Number.isNaN(n)) return COERCE_FAILED
      return n
    }
    case "datetime": {
      // datetime-local("YYYY-MM-DDTHH:mm") → ISO 또는 그대로
      const d = new Date(trimmed)
      if (isNaN(d.getTime())) return COERCE_FAILED
      return d.toISOString()
    }
    default:
      return trimmed
  }
}
