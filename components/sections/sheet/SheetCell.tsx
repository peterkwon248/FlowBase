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

export type CellId = { rowId: string; fieldName: string }

interface SheetCellProps {
  field: Field
  value: unknown
  rowId: string
  isEditing: boolean
  onStartEdit: () => void
  onCommit: (newValue: unknown) => void
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
  onStartEdit,
  onCommit,
  onCancel,
}: SheetCellProps) {
  // 미지원 type (uuid/pk/fk/select/status): 비편집 Cell 그대로
  if (!supportsInlineEdit(field)) {
    return <Cell field={field} value={value} />
  }

  if (isEditing) {
    if (field.type === "text") {
      return (
        <InlineTextarea value={value} onCommit={onCommit} onCancel={onCancel} />
      )
    }
    // M3: select/status — native <select> + Field.enum
    if (field.type === "select" || field.type === "status") {
      return (
        <InlineSelect
          options={field.enum ?? []}
          value={value}
          onCommit={onCommit}
          onCancel={onCancel}
        />
      )
    }
    return (
      <InlineInput
        type={inputTypeFor(field.type)}
        rawType={field.type}
        value={value}
        onCommit={onCommit}
        onCancel={onCancel}
      />
    )
  }

  // 비편집 모드: button wrapper + 클릭 시 편집 시작
  return (
    <button
      type="button"
      onClick={onStartEdit}
      className={cn(
        "w-full text-left rounded-sm -mx-1 px-1 py-0.5 cursor-pointer",
        "transition-colors hover:bg-foreground/[0.05] dark:hover:bg-foreground/[0.07]",
        "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
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
  onCommit: (newValue: unknown) => void
  onCancel: () => void
}

function InlineInput({ type, rawType, value, onCommit, onCancel }: InlineInputProps) {
  const [draft, setDraft] = useState<string>(toEditableString(value, rawType))
  const [isComposing, setIsComposing] = useState(false)
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    ref.current?.focus()
    ref.current?.select()
  }, [])

  const commit = () => {
    const coerced = coerceValue(draft, rawType)
    if (coerced === COERCE_FAILED) {
      onCancel()
      return
    }
    onCommit(coerced)
  }

  return (
    <input
      ref={ref}
      type={type}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onCompositionStart={() => setIsComposing(true)}
      onCompositionEnd={() => setIsComposing(false)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (isComposing) return // IME (한글 자모 입력 중 Enter 무시)
        if (e.key === "Enter") {
          e.preventDefault()
          commit()
        } else if (e.key === "Escape") {
          e.preventDefault()
          onCancel()
        }
        // Tab은 useSheetKeyboardNav가 처리 (M4) — 여기서는 default 동작 유지
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
  onCommit: (newValue: unknown) => void
  onCancel: () => void
}

function InlineTextarea({ value, onCommit, onCancel }: InlineTextareaProps) {
  const [draft, setDraft] = useState<string>(String(value ?? ""))
  const [isComposing, setIsComposing] = useState(false)
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.focus()
    el.select()
    autoResize(el)
  }, [])

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
        // text 타입: Ctrl/Cmd+Enter 또는 blur로 commit. 단독 Enter는 줄바꿈
        if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
          e.preventDefault()
          onCommit(draft)
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
// InlineSelect — select / status (Field.enum)
// design.md §4: change → 즉시 commit. native <select>로 단순화 + 키보드 친화적
// ─────────────────────────────────────────────────────────────────

interface InlineSelectProps {
  options: string[]
  value: unknown
  onCommit: (newValue: unknown) => void
  onCancel: () => void
}

function InlineSelect({ options, value, onCommit, onCancel }: InlineSelectProps) {
  const ref = useRef<HTMLSelectElement>(null)
  const committedRef = useRef(false)

  useEffect(() => {
    ref.current?.focus()
  }, [])

  return (
    <select
      ref={ref}
      defaultValue={value == null ? "" : String(value)}
      onChange={(e) => {
        committedRef.current = true
        onCommit(e.target.value)
      }}
      onBlur={() => {
        // 값 변경 없이 떠나면 cancel. onCommit 후 unmount되므로 race 위험 시 onChange 우선
        if (!committedRef.current) onCancel()
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault()
          onCancel()
        }
      }}
      className={cn(
        "w-full bg-background border border-input rounded-sm",
        "px-1.5 py-0.5 text-sm font-[inherit]",
        "outline-none focus:ring-1 focus:ring-ring",
      )}
    >
      {value == null && <option value="">—</option>}
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  )
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
