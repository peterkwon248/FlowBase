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
        <span className="text-[13px] font-medium">AI 컬럼 추천</span>
        <span className="text-[11.5px] text-muted-foreground">
          추가하면 초안으로 들어가고, 보드에서 행별로 확정합니다.
        </span>
      </div>

      {/* AI 요약 */}
      <div
        className={cn(
          "flex items-start gap-2 rounded-lg border border-border-subtle p-3",
          analyzeError ? "bg-card" : "bg-primary/[0.05]",
        )}
      >
        <Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />
        <div className="flex-1">
          <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            AI 요약
          </div>
          <div className="text-[13px] leading-relaxed">
            {analyzeError
              ? "AI 분석에 실패했습니다 — 아래 컬럼을 직접 선택하세요."
              : summary?.summary || "데이터를 분석하지 못했습니다."}
          </div>
        </div>
      </div>

      <AiColumnCard
        title="Theme"
        detail="각 행을 상위 테마(Pricing · Onboarding · Features 등)로 분류. 자유 텍스트 컬럼에서 추론."
        recommended={summary?.suggestTheme === true}
        on={aiTheme}
        onToggle={onToggleTheme}
      />
      <AiColumnCard
        title="Sentiment"
        detail="각 행을 Positive / Mixed / Negative로 점수화. 피드백·인용문이 있을 때 유용."
        recommended={summary?.suggestSentiment === true}
        on={aiSentiment}
        onToggle={onToggleSentiment}
      />

      <div className="flex items-center gap-1.5 rounded-lg bg-muted p-3 text-[11.5px] text-muted-foreground">
        <Check className="size-3 shrink-0" />
        자동 적용 ❌ — AI 컬럼은 <i className="px-0.5">pending</i>으로 추가됩니다.
        보드에서 셀별로 확정하세요.
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
              추천
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
