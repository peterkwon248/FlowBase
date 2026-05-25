// FlowBase V2 — AI Pending 카드 ("Apply all" / "Dismiss")
// 설계: docs/02-design/features/flowbase-v2-phase2.design.md §7
// 출처: design-ref/prototype/prototype.jsx PendingCard
//
// "Apply all" = Claude infer-batch 호출 + 결과 확정. ⌘Z가 검토 백스톱 (design D1).

"use client"

import { Check, Loader2, Sparkles } from "lucide-react"
import type { AiColumn } from "@/lib/flowbase-ai"

const LABEL: Record<AiColumn, string> = {
  theme: "Theme",
  sentiment: "Sentiment",
}

const DETAIL: Record<AiColumn, string> = {
  theme: "Free-text quote → 5 categories",
  sentiment: "Quote → Positive / Mixed / Negative",
}

interface PendingCardProps {
  column: AiColumn
  count: number
  busy: boolean
  disabled?: boolean // viewer mode 등 — disable + cursor-not-allowed
  onApply: () => void
  onDismiss: () => void
}

export function PendingCard({
  column,
  count,
  busy,
  disabled,
  onApply,
  onDismiss,
}: PendingCardProps) {
  const blocked = busy || disabled
  const viewerTitle = disabled ? "Viewers can't edit" : undefined
  return (
    <div className="mb-1.5 rounded-lg border border-primary/30 bg-card p-3">
      <div className="mb-1.5 flex items-center gap-1.5">
        <Sparkles className="size-3.5 shrink-0 text-primary" />
        <span className="flex-1 text-[12.5px] font-semibold leading-snug">
          {count} unconfirmed {LABEL[column]} rows
        </span>
        <span className="rounded bg-primary/15 px-1.5 py-px text-[10px] font-semibold tabular-nums text-primary">
          {count}
        </span>
      </div>
      <div className="mb-2 text-xs leading-relaxed text-muted-foreground">
        {DETAIL[column]}
      </div>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onApply}
          disabled={blocked}
          title={viewerTitle}
          className="inline-flex items-center gap-1 rounded-md border border-primary bg-primary px-2.5 py-1 text-[11.5px] font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Check className="size-3" />
          )}
          Apply all
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={blocked}
          title={viewerTitle}
          className="rounded-md border border-border px-2.5 py-1 text-[11.5px] text-muted-foreground hover:bg-foreground/[0.05] disabled:cursor-not-allowed disabled:opacity-60"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}
