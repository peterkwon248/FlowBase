// FlowBase V2 — 미구현 액티비티 모드 플레이스홀더
// Library/Wiki/Inbox/Search — 셸이 해당 모드에서 이 컴포넌트를 렌더.

"use client"

import { BookText, Inbox, Library, type LucideIcon, Search } from "lucide-react"
import type { ActivityMode } from "@/types/flowbase"

const INFO: Partial<
  Record<ActivityMode, { label: string; Icon: LucideIcon; desc: string }>
> = {
  library: {
    label: "Library",
    Icon: Library,
    desc: "옵션 리스트·필드·템플릿·함수·대시보드를 한곳에서 정의하고 모든 보드에서 재사용합니다.",
  },
  wiki: {
    label: "Wiki",
    Icon: BookText,
    desc: "워크스페이스 문서와 노트를 페이지로 정리합니다.",
  },
  inbox: {
    label: "Inbox",
    Icon: Inbox,
    desc: "검토가 필요한 AI 추천과 알림을 한곳에 모읍니다.",
  },
  search: {
    label: "Search",
    Icon: Search,
    desc: "⌘K — 보드·행·자산을 가로질러 빠르게 이동합니다.",
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
          준비 중
        </span>
      </div>
    </div>
  )
}
