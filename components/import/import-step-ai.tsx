// FlowBase V2 — Import Step 3: AI 컬럼 추천
// 설계: docs/02-design/features/flowbase-v2-phase3.design.md §4
// 출처: design-ref/prototype/import-modal.jsx Step3AI

"use client"

import { Check, Sparkles } from "lucide-react"
import type { AnalyzeImportRes } from "@/lib/flowbase-ai"
import { cn } from "@/lib/utils"

interface ImportStepAiProps {
  summary: AnalyzeImportRes | null
  analyzeError: boolean
  aiTheme: boolean
  aiSentiment: boolean
  onToggleTheme: () => void
  onToggleSentiment: () => void
}

export function ImportStepAi({
  summary,
  analyzeError,
  aiTheme,
  aiSentiment,
  onToggleTheme,
  onToggleSentiment,
}: ImportStepAiProps) {
  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-2.5">
        <span className="text-[13px] font-medium">Suggest AI columns</span>
        <span className="text-[11.5px] text-muted-foreground">
          Added as drafts — confirm per row in the board.
        </span>
      </div>

      {/* AI summary */}
      <div
        className={cn(
          "flex items-start gap-2 rounded-lg border border-border-subtle p-3",
          analyzeError ? "bg-card" : "bg-primary/[0.05]",
        )}
      >
        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
        <div className="flex-1">
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            AI summary
          </div>
          <div className="text-[13px] leading-relaxed">
            {analyzeError
              ? "AI analysis failed — pick columns manually below."
              : summary?.summary || "Couldn't analyze the data."}
          </div>
        </div>
      </div>

      <AiColumnCard
        title="Theme"
        detail="Classify each row into a top-level theme (Pricing, Onboarding, Features, etc.). Inferred from free-text columns."
        recommended={summary?.suggestTheme === true}
        on={aiTheme}
        onToggle={onToggleTheme}
      />
      <AiColumnCard
        title="Sentiment"
        detail="Score each row as Positive / Mixed / Negative. Useful when rows have feedback or quotes."
        recommended={summary?.suggestSentiment === true}
        on={aiSentiment}
        onToggle={onToggleSentiment}
      />

      <div className="flex items-center gap-1.5 rounded-lg bg-muted p-3 text-[11.5px] text-muted-foreground">
        <Check className="size-3 shrink-0" />
        Not auto-applied — AI columns are added as <i className="px-0.5">pending</i>.
        Confirm per cell in the board.
      </div>
    </div>
  )
}

interface AiColumnCardProps {
  title: string
  detail: string
  recommended: boolean
  on: boolean
  onToggle: () => void
}

function AiColumnCard({
  title,
  detail,
  recommended,
  on,
  onToggle,
}: AiColumnCardProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex items-start gap-3 rounded-lg border bg-card p-3.5 text-left",
        on ? "border-primary" : "border-border",
      )}
    >
      <span
        className={cn(
          "mt-px flex size-[18px] shrink-0 items-center justify-center rounded border-[1.5px]",
          on
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border bg-card",
        )}
      >
        {on && <Check className="size-3" />}
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-[13.5px] font-semibold">{title}</span>
          {recommended && (
            <span className="rounded bg-primary/15 px-1.5 py-px text-[10px] font-semibold text-primary">
              Recommended
            </span>
          )}
        </div>
        <div className="text-xs leading-relaxed text-muted-foreground">
          {detail}
        </div>
      </div>
    </button>
  )
}
