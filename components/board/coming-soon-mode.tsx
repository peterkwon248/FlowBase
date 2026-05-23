// FlowBase V2 — 미구현 액티비티 모드 플레이스홀더
// 현재는 Search 모드만 스텁. Library/Wiki/Inbox는 각자 구현됨.

"use client"

import { type LucideIcon, Search } from "lucide-react"
import type { ActivityMode } from "@/types/flowbase"

const INFO: Partial<
  Record<ActivityMode, { label: string; Icon: LucideIcon; desc: string }>
> = {
  search: {
    label: "Search",
    Icon: Search,
    desc: "⌘K — jump quickly across boards, rows, and assets.",
  },
}

export function ComingSoonMode({ mode }: { mode: ActivityMode }) {
  const info = INFO[mode]
  if (!info) return null
  const { label, Icon, desc } = info

  return (
    <div className="flex min-w-0 flex-1 items-center justify-center bg-background">
      <div className="max-w-sm px-8 text-center">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-7" strokeWidth={1.5} />
        </div>
        <h2 className="text-lg font-semibold">{label}</h2>
        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
          {desc}
        </p>
        <span className="mt-4 inline-block rounded-md border border-border-subtle bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          Coming soon
        </span>
      </div>
    </div>
  )
}
