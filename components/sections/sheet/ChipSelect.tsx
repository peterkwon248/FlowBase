// ChipSelect — pill 모양 dropdown + 새 옵션 추가 (사용자 요청 2026-05-07)
// design.md M3 InlineSelect 대체. 더 풍부한 UX:
//   - pill 모양 트리거 (Notion/Linear 스타일)
//   - 옵션 list (status는 색상 매핑, priority는 아이콘)
//   - "+ 추가" 인풋으로 새 옵션 (Field.enum에 동적 추가 — parent state)
//   - 키보드 ↑↓ 네비, Enter commit, Esc cancel
//
// 가드 (CLAUDE.md):
// - Status 색 매핑 LOCK 보존 (미처리=blue 등)
// - 토큰만 (border-input, bg-popover, ring-ring)
// - shadow-sm만, 큰 그림자 ❌

"use client"

import { useEffect, useRef, useState } from "react"
import { Plus, Check } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { statusBgClass, statusColorClass } from "@/lib/tokens"
import type { Field, TicketStatus } from "@/lib/mock-data"
import { StatusIcon, PriorityIcon, ChannelIcon } from "../data-section"

type AdvanceDirection = "next" | "prev" | "down"

interface ChipSelectProps {
  field: Field
  value: unknown
  options: string[] // merged: field.enum + custom additions
  onCommit: (newValue: unknown) => void
  onCommitAndAdvance?: (newValue: unknown, direction: AdvanceDirection) => void
  onAddOption?: (newOpt: string) => void // undefined → 추가 비활성
  onCancel: () => void
}

export function ChipSelect({
  field,
  value,
  options,
  onCommit,
  onCommitAndAdvance,
  onAddOption,
  onCancel,
}: ChipSelectProps) {
  const [open, setOpen] = useState(true) // 편집 모드 진입 시 자동 open
  const [highlightIdx, setHighlightIdx] = useState<number>(() => {
    const i = options.findIndex((o) => o === String(value))
    return i >= 0 ? i : 0
  })
  const [addingMode, setAddingMode] = useState(false)
  const [draftNew, setDraftNew] = useState("")
  const addInputRef = useRef<HTMLInputElement>(null)

  // popover가 닫히면 cancel (commit 후 닫혔는지 ref로 구분)
  const committedRef = useRef(false)

  useEffect(() => {
    if (addingMode) addInputRef.current?.focus()
  }, [addingMode])

  const select = (opt: string) => {
    committedRef.current = true
    onCommit(opt)
    setOpen(false)
  }

  const selectAndAdvance = (opt: string, direction: AdvanceDirection) => {
    committedRef.current = true
    if (onCommitAndAdvance) onCommitAndAdvance(opt, direction)
    else onCommit(opt)
    setOpen(false)
  }

  const tryAdd = () => {
    const next = draftNew.trim()
    if (!next) return
    if (options.includes(next)) {
      // 이미 존재 → 그 값으로 commit
      select(next)
      return
    }
    onAddOption?.(next)
    select(next)
  }

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        setOpen(o)
        if (!o && !committedRef.current) onCancel()
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full text-left rounded-sm -mx-1 px-1 py-0.5 cursor-pointer",
            "ring-1 ring-ring outline-none",
            "transition-colors hover:bg-foreground/[0.05]",
          )}
          aria-label={`${field.name} 선택`}
        >
          <ChipDisplay field={field} value={value} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-56 p-1"
        align="start"
        sideOffset={4}
        onCloseAutoFocus={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (addingMode) return // 추가 인풋이 자체 처리
          if (e.key === "ArrowDown") {
            e.preventDefault()
            setHighlightIdx((i) => Math.min(options.length - 1, i + 1))
          } else if (e.key === "ArrowUp") {
            e.preventDefault()
            setHighlightIdx((i) => Math.max(0, i - 1))
          } else if (e.key === "Enter") {
            e.preventDefault()
            const opt = options[highlightIdx]
            if (opt) selectAndAdvance(opt, "down")
          } else if (e.key === "Tab") {
            e.preventDefault()
            const opt = options[highlightIdx]
            if (opt) selectAndAdvance(opt, e.shiftKey ? "prev" : "next")
          } else if (e.key === "Escape") {
            e.preventDefault()
            committedRef.current = false
            setOpen(false)
          }
        }}
      >
        <ul className="max-h-64 overflow-auto py-0.5" role="listbox">
          {options.map((opt, idx) => {
            const isCurrent = String(value) === opt
            const isHighlighted = idx === highlightIdx
            return (
              <li key={opt} role="option" aria-selected={isCurrent}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlightIdx(idx)}
                  onClick={() => select(opt)}
                  className={cn(
                    "w-full flex items-center justify-between rounded-sm px-2 py-1.5 text-sm",
                    "transition-colors text-left",
                    isHighlighted && "bg-accent/60",
                  )}
                >
                  <ChipDisplay field={field} value={opt} compact />
                  {isCurrent && (
                    <Check className="w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
                  )}
                </button>
              </li>
            )
          })}
          {options.length === 0 && (
            <li className="px-2 py-1.5 text-xs text-muted-foreground">옵션 없음</li>
          )}
        </ul>
        {onAddOption && (
          <>
            <div className="border-t border-border/60 my-1" />
            {addingMode ? (
              <div className="flex items-center gap-1 px-1">
                <input
                  ref={addInputRef}
                  type="text"
                  value={draftNew}
                  onChange={(e) => setDraftNew(e.target.value)}
                  placeholder="새 옵션 이름"
                  className={cn(
                    "flex-1 bg-background border border-input rounded-sm",
                    "px-1.5 py-1 text-sm font-[inherit]",
                    "outline-none focus:ring-1 focus:ring-ring",
                  )}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      tryAdd()
                    } else if (e.key === "Escape") {
                      e.preventDefault()
                      setAddingMode(false)
                      setDraftNew("")
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={tryAdd}
                  className="rounded-sm px-2 py-1 text-xs bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  추가
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingMode(true)}
                className={cn(
                  "w-full flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-sm",
                  "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                  "transition-colors",
                )}
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                새 옵션 추가
              </button>
            )}
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}

// ─────────────────────────────────────────────────────────────────
// ChipDisplay — pill 모양 표시 (status 색상 매핑, priority 아이콘 등)
// ─────────────────────────────────────────────────────────────────

interface ChipDisplayProps {
  field: Field
  value: unknown
  compact?: boolean
}

function ChipDisplay({ field, value, compact = false }: ChipDisplayProps) {
  if (value == null || value === "") {
    return <span className="text-muted-foreground text-sm">—</span>
  }
  const s = String(value)

  // status: 색상 매핑 (Status 색 LOCK 보존)
  if (field.type === "status") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium",
          statusBgClass(s as TicketStatus),
          statusColorClass(s as TicketStatus),
        )}
      >
        <StatusIcon status={s as TicketStatus} className="w-3.5 h-3.5" />
        <span>{s}</span>
      </span>
    )
  }

  // priority — 아이콘 + 텍스트
  if (field.type === "select" && field.name === "priority") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm">
        <PriorityIcon priority={s as never} />
        <span className={compact ? "" : ""}>{s}</span>
      </span>
    )
  }

  // channel — 아이콘 + 텍스트
  if (field.type === "select" && field.name === "channel") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm">
        <ChannelIcon channel={s as never} />
        <span>{s}</span>
      </span>
    )
  }

  // 일반 select (tier, team, custom): 텍스트만
  return <span className="text-sm">{s}</span>
}
