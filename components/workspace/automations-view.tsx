// FlowBase V2 — Workspace Automations 뷰 (룰 카드 + AI 제안, 읽기 전용)
// 출처: design-ref/prototype/automations.jsx

"use client"

import { Sparkles, Zap } from "lucide-react"
import { useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type {
  AutomationRule,
  AutomationStatus,
  AutomationStep,
  AutomationTrigger,
  SuggestedAutomation,
} from "@/types/flowbase"

const STATUS_STYLE: Record<
  AutomationStatus,
  { bg: string; fg: string; dot: string; label: string }
> = {
  active: {
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
    fg: "text-emerald-700 dark:text-emerald-400",
    dot: "bg-emerald-500 dark:bg-emerald-400",
    label: "Active",
  },
  paused: {
    bg: "bg-amber-100 dark:bg-amber-900/30",
    fg: "text-amber-700 dark:text-amber-400",
    dot: "bg-amber-500 dark:bg-amber-400",
    label: "Paused",
  },
  draft: {
    bg: "bg-muted",
    fg: "text-muted-foreground",
    dot: "bg-muted-foreground",
    label: "Draft",
  },
}

export function AutomationsView() {
  const automations = useFlowBase((s) => s.automations)
  const suggested = useFlowBase((s) => s.suggestedAutomations)

  const activeCount = automations.filter((r) => r.status === "active").length
  const pausedCount = automations.filter((r) => r.status === "paused").length
  const draftCount = automations.filter((r) => r.status === "draft").length

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-background">
      {/* 헤더 */}
      <div className="shrink-0 px-6 pb-3 pt-5">
        <div className="mb-1.5 flex items-center gap-2.5">
          <span className="inline-flex size-8 items-center justify-center rounded-md bg-chart-2/15 text-chart-2">
            <Zap className="size-4" strokeWidth={1.75} />
          </span>
          <h1 className="text-[22px] font-bold tracking-[-0.02em]">
            Automations
          </h1>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            {automations.length}
          </span>
        </div>
        <p className="pl-[42px] text-[13px] text-muted-foreground">
          React to data changes or scheduled triggers to add rows or send
          notifications automatically.
        </p>
        <div className="mt-2 flex gap-2 pl-[42px] text-[11.5px] text-muted-foreground">
          <span>
            <strong className="font-semibold tabular-nums text-foreground">
              {activeCount}
            </strong>{" "}
            active
          </span>
          <span className="opacity-50">·</span>
          <span>
            <strong className="font-semibold tabular-nums text-foreground">
              {pausedCount}
            </strong>{" "}
            paused
          </span>
          <span className="opacity-50">·</span>
          <span>
            <strong className="font-semibold tabular-nums text-foreground">
              {draftCount}
            </strong>{" "}
            draft
          </span>
        </div>
      </div>

      {/* 룰 카드 */}
      <div className="flex flex-col gap-3 px-6 pb-6">
        {automations.map((rule) => (
          <RuleCard key={rule.id} rule={rule} />
        ))}
      </div>

      {/* AI Suggestions */}
      {suggested.length > 0 && (
        <div className="border-t border-border-subtle px-6 pb-8 pt-5">
          <div className="mb-3 flex items-center gap-1.5">
            <Sparkles className="size-3.5 text-primary" />
            <span className="text-[12px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              AI Suggestions
            </span>
            <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-primary">
              {suggested.length}
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 lg:grid-cols-3">
            {suggested.map((s) => (
              <SuggestionCard key={s.id} suggestion={s} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RuleCard({ rule }: { rule: AutomationRule }) {
  const style = STATUS_STYLE[rule.status]

  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2">
        <span className={cn("size-2 shrink-0 rounded-full", style.dot)} />
        <span className="flex-1 text-[13.5px] font-semibold">{rule.name}</span>
        {rule.aiSuggested && (
          <span className="inline-flex items-center gap-1 rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            <Sparkles className="size-2.5" strokeWidth={2} />
            AI built
          </span>
        )}
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10.5px] font-semibold",
            style.bg,
            style.fg,
          )}
        >
          {style.label}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <TriggerBlock when={rule.when} />
        {rule.then.map((step, i) => (
          <ActionBlock key={i} step={step} />
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-border-subtle pt-2 text-[11.5px] text-muted-foreground">
        <span>
          Runs this week:{" "}
          <strong className="font-semibold tabular-nums text-foreground">
            {rule.runsThisWeek}
          </strong>
        </span>
        <span className="opacity-50">·</span>
        <span>Last run: {rule.lastRun}</span>
      </div>
    </div>
  )
}

function TriggerBlock({ when }: { when: AutomationTrigger }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-chart-1/25 bg-chart-1/[0.06] px-2.5 py-2 text-[12.5px] leading-relaxed">
      <span className="mt-px shrink-0 rounded bg-chart-1 px-1.5 py-px text-[9.5px] font-bold uppercase tracking-[0.06em] text-white">
        When
      </span>
      <span className="flex-1">
        {when.table && when.table !== "—" && (
          <>
            <code className="rounded bg-muted px-1 py-px font-mono text-[11px]">
              {when.table}
            </code>
            <span className="text-muted-foreground"> · </span>
          </>
        )}
        <span>{when.event}</span>{" "}
        <code className="rounded bg-muted px-1 py-px font-mono text-[11px]">
          {when.value}
        </code>
      </span>
    </div>
  )
}

function ActionBlock({ step }: { step: AutomationStep }) {
  return (
    <div className="flex items-start gap-2 rounded-md border border-chart-2/25 bg-chart-2/[0.06] px-2.5 py-2 text-[12.5px] leading-relaxed">
      <span className="mt-px shrink-0 rounded bg-chart-2 px-1.5 py-px text-[9.5px] font-bold uppercase tracking-[0.06em] text-white">
        Then
      </span>
      <span className="flex-1">
        <strong className="font-medium">{step.action}</strong>{" "}
        <code className="rounded bg-muted px-1 py-px font-mono text-[11px]">
          {step.target}
        </code>
        {step.detail && (
          <>
            <br />
            <span className="text-[11.5px] text-muted-foreground">
              {step.detail}
            </span>
          </>
        )}
      </span>
    </div>
  )
}

function SuggestionCard({ suggestion }: { suggestion: SuggestedAutomation }) {
  const confidencePct = Math.round(suggestion.confidence * 100)
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/[0.04] p-3">
      <div className="flex items-start gap-2">
        <Sparkles
          className="mt-0.5 size-3 shrink-0 text-primary"
          strokeWidth={2}
        />
        <span className="flex-1 text-[13px] font-semibold">
          {suggestion.summary}
        </span>
        <span className="rounded bg-primary/15 px-1.5 py-0.5 font-mono text-[10.5px] font-semibold text-primary">
          {confidencePct}%
        </span>
      </div>
      <p className="text-[12px] leading-relaxed text-muted-foreground">
        {suggestion.detail}
      </p>
    </div>
  )
}
