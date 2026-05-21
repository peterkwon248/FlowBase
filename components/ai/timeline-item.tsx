// FlowBase V2 — AI 타임라인 1줄
// 설계: docs/02-design/features/flowbase-v2-phase2.design.md §7
// 출처: design-ref/prototype/prototype.jsx InteractiveActivityPanel (timeline)

"use client"

import type { AIHistoryEntry } from "@/types/flowbase"

function formatTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ""
  return d.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })
}

export function TimelineItem({ entry }: { entry: AIHistoryEntry }) {
  return (
    <div className="relative mb-3 last:mb-0">
      <span
        aria-hidden
        className="absolute -left-[14px] top-1 size-[9px] rounded-full border-[1.5px] border-border bg-card"
      />
      <div className="text-[12.5px] font-medium leading-snug">
        {entry.title}
      </div>
      {entry.detail && (
        <div className="mt-0.5 text-[11.5px] leading-snug text-muted-foreground">
          {entry.detail}
        </div>
      )}
      <div className="mt-0.5 font-mono text-[10.5px] text-muted-foreground">
        {formatTime(entry.time)}
      </div>
    </div>
  )
}
