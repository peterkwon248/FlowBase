// FlowBase V2 — 셀 편집용 공통 Popover (select / status / multiSelect)
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §6
// 출처: design-ref/prototype/prototype.jsx (Popover · MenuItem · EditableSelect/Status)
//
// AI 컬럼(theme/sentiment)이면 상단에 "AI suggested" Accept/Dismiss 블록을 띄운다.
// LOCK: AI 추천 + 사람 확정 — 자동 적용 ❌. 선택/Accept 모두 사람의 명시 행동.
//
// MultiCellPopover: multiSelect 전용. option click = 토글, popover 안 닫음 (여러 값 선택).
// "+ Add new"로 col.options 즉시 확장 (옵션, callback). outside click/ESC로 close.

"use client"

import { useState, type ReactNode } from "react"
import { Check, Clock, Plus, Sparkles, X } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

export interface CellOption {
  value: string
  label: string
  icon?: ReactNode
}

interface AiBlock {
  // AI가 채웠으나 사람이 아직 확정하지 않음
  pending: boolean
  onAccept: () => void
  onDismiss: () => void
}

interface CellPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: ReactNode
  label?: string
  options: CellOption[]
  value?: string
  onSelect: (value: string) => void
  ai?: AiBlock
  width?: number
  // Workspace Memory "Recent" 섹션 — frequency 2+ 학습 값. options 위에 별도 섹션으로 표시.
  // Memory ≠ Library — 자동 학습 cache. LOCK: 명시 click 시만 적용. (lib/flowbase-store.ts learnFromPatch)
  recent?: CellOption[]
  // Memory → Library promote bridge — Recent item 옆 "+" 버튼. 호출 시 col.options에 영구 추가.
  // 사용자 명시 click 시만 (LOCK: 자동 promote ❌).
  onPromote?: (value: string) => void
}

// 셀 클릭/Enter 시 열리는 옵션 선택 Popover. select·status 공용.
export function CellPopover({
  open,
  onOpenChange,
  trigger,
  label,
  options,
  value,
  onSelect,
  ai,
  width = 180,
  recent,
  onPromote,
}: CellPopoverProps) {
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="p-1"
        style={{ width }}
      >
        {ai?.pending && (
          <div className="mb-1 border-b border-border-subtle px-1 pb-2">
            <div className="mb-1.5 flex items-center gap-1 px-1 pt-1 text-[11px] text-muted-foreground">
              <Sparkles className="size-3 text-primary" />
              AI suggested · 검토 필요
            </div>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  ai.onAccept()
                  onOpenChange(false)
                }}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-primary px-2 py-1 text-[11.5px] font-medium text-primary-foreground"
              >
                <Check className="size-3" />
                Accept
              </button>
              <button
                type="button"
                onClick={() => {
                  ai.onDismiss()
                  onOpenChange(false)
                }}
                className="flex-1 rounded-md border border-border px-2 py-1 text-[11.5px] text-muted-foreground hover:bg-foreground/[0.05]"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {recent && recent.length > 0 && (
          <>
            <div className="flex items-center gap-1 px-2 pb-1 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              <Clock className="size-3" strokeWidth={1.75} />
              Recent
            </div>
            <div className="flex flex-col">
              {recent.map((opt) => (
                <div
                  key={`recent-${opt.value}`}
                  className="group/recent flex items-center gap-1 rounded-md hover:bg-foreground/[0.05]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      onSelect(opt.value)
                      onOpenChange(false)
                    }}
                    className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-[13px]"
                  >
                    {opt.icon}
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">
                      {opt.label}
                    </span>
                  </button>
                  {onPromote && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onPromote(opt.value)
                      }}
                      title="Save as option (add to column)"
                      aria-label={`Save "${opt.label}" as option`}
                      className="mr-1 inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/60 opacity-0 transition-opacity hover:bg-foreground/[0.08] hover:text-foreground group-hover/recent:opacity-100 focus:opacity-100"
                    >
                      <Plus className="size-3" strokeWidth={2} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="my-1 h-px bg-border-subtle" />
          </>
        )}

        {label && (
          <div className="px-2 pb-1.5 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {label}
          </div>
        )}

        <div className="flex flex-col">
          {options.map((opt) => {
            const active = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onSelect(opt.value)
                  onOpenChange(false)
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px]",
                  "hover:bg-foreground/[0.05]",
                  active && "bg-foreground/[0.05]",
                )}
              >
                {opt.icon}
                <span className="flex-1 truncate">{opt.label}</span>
                {active && <Check className="size-3 text-primary" />}
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─── MultiCellPopover ───────────────────────────────────────────────
// multiSelect 전용. option click = toggle, popover 안 닫음 (사용자가 여러 값 선택).
// outside click / ESC로 close.
// "+ Add new"는 onAddNew prop 있으면 inline input 노출 (col.options 확장 진입점).

interface MultiCellPopoverProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: ReactNode
  label?: string
  options: CellOption[]
  values: string[]
  onToggle: (value: string) => void
  width?: number
  // 신규 옵션 추가 — Library promote와는 다른 단순 col.options 추가 진입점.
  // 호출 시 callback이 col.options에 value 추가 + 자동 toggle on. UI는 input + Enter.
  onAddNew?: (value: string) => void
  // Workspace Memory "Recent" — Multi에서도 같은 패턴. 클릭 시 toggle, "+" 버튼은 promote.
  recent?: CellOption[]
  onPromote?: (value: string) => void
}

export function MultiCellPopover({
  open,
  onOpenChange,
  trigger,
  label,
  options,
  values,
  onToggle,
  width = 200,
  onAddNew,
  recent,
  onPromote,
}: MultiCellPopoverProps) {
  const [draft, setDraft] = useState("")
  const set = new Set(values)
  const trimmed = draft.trim()
  const canAdd =
    !!onAddNew &&
    trimmed.length > 0 &&
    !options.some((o) => o.value === trimmed)

  const submitAdd = () => {
    if (!canAdd) return
    onAddNew!(trimmed)
    setDraft("")
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={4}
        className="p-1"
        style={{ width }}
      >
        {recent && recent.length > 0 && (
          <>
            <div className="flex items-center gap-1 px-2 pb-1 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              <Clock className="size-3" strokeWidth={1.75} />
              Recent
            </div>
            <div className="flex flex-col">
              {recent.map((opt) => {
                const active = set.has(opt.value)
                return (
                  <div
                    key={`recent-${opt.value}`}
                    className="group/recent flex items-center gap-1 rounded-md hover:bg-foreground/[0.05]"
                  >
                    <button
                      type="button"
                      onClick={() => onToggle(opt.value)}
                      className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-[13px]"
                    >
                      <span className="flex size-3.5 items-center justify-center">
                        {active && (
                          <Check className="size-3 text-primary" strokeWidth={3} />
                        )}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-muted-foreground">
                        {opt.label}
                      </span>
                    </button>
                    {onPromote && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onPromote(opt.value)
                        }}
                        title="Save as option (add to column)"
                        aria-label={`Save "${opt.label}" as option`}
                        className="mr-1 inline-flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/60 opacity-0 transition-opacity hover:bg-foreground/[0.08] hover:text-foreground group-hover/recent:opacity-100 focus:opacity-100"
                      >
                        <Plus className="size-3" strokeWidth={2} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="my-1 h-px bg-border-subtle" />
          </>
        )}

        {label && (
          <div className="px-2 pb-1.5 pt-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            {label}
          </div>
        )}

        <div className="flex max-h-64 flex-col overflow-y-auto">
          {options.length === 0 && !onAddNew && (
            <div className="px-2 py-2 text-[12px] text-muted-foreground">
              No options yet.
            </div>
          )}
          {options.map((opt) => {
            const active = set.has(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onToggle(opt.value)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px]",
                  "hover:bg-foreground/[0.05]",
                  active && "bg-foreground/[0.04]",
                )}
              >
                <span
                  className={cn(
                    "flex size-3.5 shrink-0 items-center justify-center rounded-sm border",
                    active
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border",
                  )}
                  aria-hidden
                >
                  {active && <Check className="size-2.5" strokeWidth={3} />}
                </span>
                {opt.icon}
                <span className="flex-1 truncate">{opt.label}</span>
              </button>
            )
          })}
        </div>

        {onAddNew && (
          <>
            <div className="my-1 h-px bg-border-subtle" />
            <div className="flex items-center gap-1 px-1 py-1">
              <input
                type="text"
                value={draft}
                placeholder="New option…"
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    submitAdd()
                  } else if (e.key === "Escape" && draft) {
                    e.preventDefault()
                    setDraft("")
                  }
                }}
                className="min-w-0 flex-1 rounded-sm border border-input bg-background px-1.5 py-1 text-[12.5px] outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                type="button"
                onClick={submitAdd}
                disabled={!canAdd}
                title={canAdd ? "Add and select" : "Type a unique value"}
                className={cn(
                  "inline-flex size-6 shrink-0 items-center justify-center rounded text-muted-foreground transition-colors",
                  canAdd
                    ? "hover:bg-foreground/[0.06] hover:text-foreground"
                    : "cursor-not-allowed opacity-40",
                )}
              >
                <Plus className="size-3.5" strokeWidth={2} />
              </button>
            </div>
          </>
        )}

        {values.length > 0 && (
          <div className="mt-1 flex items-center justify-between gap-1 border-t border-border-subtle px-2 pb-1 pt-1.5 text-[10.5px] text-muted-foreground">
            <span>{values.length} selected</span>
            <button
              type="button"
              onClick={() => {
                // 모든 active values 토글 (=clear)
                for (const v of values) onToggle(v)
              }}
              className="inline-flex items-center gap-0.5 rounded hover:text-foreground"
            >
              <X className="size-2.5" strokeWidth={2} />
              Clear
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}
