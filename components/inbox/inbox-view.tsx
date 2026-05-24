// FlowBase V2 — Inbox 모드 — 워크스페이스 상태에서 파생된 항목
// 출처: design-ref/prototype/inbox-view.jsx
//
// 6 kind: alert · warn · ai · info · tip · log
// 파생 소스: pending AI cells · 미사용 Library 자산 · 빈 테이블 · AI 자동화 제안 · 활동 로그

"use client"

import { useMemo, useState } from "react"
import {
  AlertCircle,
  AlertTriangle,
  FileText,
  Inbox as InboxIcon,
  Info,
  Lightbulb,
  type LucideIcon,
  Sparkles,
} from "lucide-react"
import { InboxSidebar, type InboxFilter } from "@/components/inbox/inbox-sidebar"
import { useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type {
  Board,
  Library,
  LibraryCategoryId,
  SuggestedAutomation,
} from "@/types/flowbase"

type InboxKind = "alert" | "warn" | "ai" | "info" | "tip" | "log"

interface InboxItem {
  id: string
  kind: InboxKind
  priority: number
  title: string
  detail?: string
  time: string
  action?: { label: string; onClick: () => void }
}

const KIND_STYLE: Record<
  InboxKind,
  { Icon: LucideIcon; bg: string; fg: string; label: string }
> = {
  alert: {
    Icon: AlertCircle,
    bg: "bg-destructive/15",
    fg: "text-destructive",
    label: "Alert",
  },
  warn: {
    Icon: AlertTriangle,
    bg: "bg-amber-100 dark:bg-amber-900/30",
    fg: "text-amber-700 dark:text-amber-400",
    label: "Warning",
  },
  ai: {
    Icon: Sparkles,
    bg: "bg-primary/15",
    fg: "text-primary",
    label: "AI",
  },
  info: {
    Icon: Info,
    bg: "bg-chart-3/15",
    fg: "text-chart-3",
    label: "Info",
  },
  tip: {
    Icon: Lightbulb,
    bg: "bg-muted",
    fg: "text-muted-foreground",
    label: "Tip",
  },
  log: {
    Icon: FileText,
    bg: "bg-muted",
    fg: "text-muted-foreground",
    label: "Activity",
  },
}

const FILTERS: { id: InboxKind | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "alert", label: "Alerts" },
  { id: "warn", label: "Warnings" },
  { id: "ai", label: "AI" },
  { id: "info", label: "Info" },
  { id: "tip", label: "Tips" },
  { id: "log", label: "Activity" },
]

function buildItems(input: {
  boards: Record<string, Board>
  library: Library
  suggestedAutomations: SuggestedAutomation[]
  goToBoard: (boardId: string) => void
  goToLibraryAsset: (cat: LibraryCategoryId, id: string) => void
  goToAutomations: () => void
}): InboxItem[] {
  const items: InboxItem[] = []
  const today = new Date().toISOString().slice(0, 10)

  // 1) AI pending cells per board
  Object.values(input.boards).forEach((b) => {
    const pendingTheme = b.rows.filter(
      (r) => r.themeConfirmed === false,
    ).length
    const pendingSent = b.rows.filter(
      (r) => r.sentimentConfirmed === false,
    ).length
    if (pendingTheme > 0) {
      items.push({
        id: `ai-theme-${b.id}`,
        kind: "ai",
        priority: 7,
        title: `${pendingTheme} rows awaiting Theme classification`,
        detail: `${b.label} · Review AI classification`,
        time: today,
        action: { label: "Review", onClick: () => input.goToBoard(b.id) },
      })
    }
    if (pendingSent > 0) {
      items.push({
        id: `ai-sent-${b.id}`,
        kind: "ai",
        priority: 7,
        title: `${pendingSent} rows awaiting Sentiment classification`,
        detail: `${b.label} · Review AI classification`,
        time: today,
        action: { label: "Review", onClick: () => input.goToBoard(b.id) },
      })
    }
  })

  // 2) AI-suggested automations
  input.suggestedAutomations.forEach((s) => {
    const pct = Math.round(s.confidence * 100)
    items.push({
      id: `ai-auto-${s.id}`,
      kind: "ai",
      priority: 6,
      title: `${s.summary} · ${pct}% confidence`,
      detail: s.detail,
      time: today,
      action: { label: "Automations", onClick: input.goToAutomations },
    })
  })

  // 3) Empty tables
  Object.values(input.boards).forEach((b) => {
    if (b.rows.length === 0) {
      items.push({
        id: `empty-table-${b.id}`,
        kind: "tip",
        priority: 2,
        title: `Empty table: ${b.label}`,
        detail: "Add rows or import to populate",
        time: today,
        action: { label: "Open", onClick: () => input.goToBoard(b.id) },
      })
    }
  })

  // 4) Unused Library assets
  const libCats: {
    cat: LibraryCategoryId
    label: string
    assets: { id: string; name: string; usedIn: string[] }[]
  }[] = [
    { cat: "optionLists", label: "Option List", assets: input.library.optionLists },
    { cat: "fields", label: "Field", assets: input.library.fields },
    { cat: "templates", label: "Template", assets: input.library.templates },
    { cat: "functions", label: "Function", assets: input.library.functions },
    { cat: "dashboards", label: "Dashboard", assets: input.library.dashboards },
  ]
  libCats.forEach(({ cat, label, assets }) => {
    assets.forEach((a) => {
      if (a.usedIn.length === 0) {
        items.push({
          id: `lib-unused-${a.id}`,
          kind: "tip",
          priority: 1,
          title: `Unused ${label}: ${a.name}`,
          detail: "Unused Library asset — apply or archive",
          time: today,
          action: {
            label: "Open",
            onClick: () => input.goToLibraryAsset(cat, a.id),
          },
        })
      }
    })
  })

  // 5) Recent AI activity (log) — 최근 3개
  const recentActivity: {
    boardLabel: string
    title: string
    detail?: string
    time: string
  }[] = []
  Object.values(input.boards).forEach((b) => {
    b.aiHistory.slice(-3).forEach((h) => {
      recentActivity.push({
        boardLabel: b.label,
        title: h.title,
        detail: h.detail,
        time: h.time,
      })
    })
  })
  recentActivity
    .sort((a, b) => (a.time < b.time ? 1 : -1))
    .slice(0, 3)
    .forEach((h, i) => {
      items.push({
        id: `activity-${i}-${h.time}`,
        kind: "log",
        priority: 0,
        title: h.title,
        detail: h.detail
          ? `${h.boardLabel} · ${h.detail}`
          : h.boardLabel,
        time: h.time.slice(0, 10),
      })
    })

  return items.sort((a, b) => b.priority - a.priority)
}

export function InboxView() {
  const boards = useFlowBase((s) => s.boards)
  const library = useFlowBase((s) => s.library)
  const suggestedAutomations = useFlowBase((s) => s.suggestedAutomations)
  const setActivityMode = useFlowBase((s) => s.setActivityMode)
  const switchBoard = useFlowBase((s) => s.switchBoard)
  const setActiveWorkspaceItem = useFlowBase((s) => s.setActiveWorkspaceItem)
  const selectAsset = useFlowBase((s) => s.selectAsset)

  const [filter, setFilter] = useState<InboxFilter>("all")
  const sidebarOn = useFlowBase((s) => s.panels.sidebar)

  const items = useMemo(
    () =>
      buildItems({
        boards,
        library,
        suggestedAutomations,
        goToBoard: (boardId) => {
          switchBoard(boardId)
          setActivityMode("tables")
        },
        goToLibraryAsset: (cat, id) => {
          selectAsset(cat, id)
          setActivityMode("library")
        },
        goToAutomations: () => {
          setActiveWorkspaceItem("automations")
          setActivityMode("workspace")
        },
      }),
    [
      boards,
      library,
      suggestedAutomations,
      setActivityMode,
      switchBoard,
      setActiveWorkspaceItem,
      selectAsset,
    ],
  )

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: items.length }
    items.forEach((i) => {
      c[i.kind] = (c[i.kind] ?? 0) + 1
    })
    return c
  }, [items])

  const filtered =
    filter === "all" ? items : items.filter((i) => i.kind === filter)

  const filterLabel = FILTERS.find((f) => f.id === filter)?.label ?? "All"

  return (
    <>
      {sidebarOn && (
        <InboxSidebar
          filter={filter}
          onFilter={setFilter}
          counts={counts}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-background">
        {/* 헤더 */}
        <div className="shrink-0 px-6 pb-3 pt-5">
          <div className="mb-1.5 flex items-center gap-2.5">
            <span className="inline-flex size-8 items-center justify-center rounded-md bg-primary/15 text-primary">
              <InboxIcon className="size-4" strokeWidth={1.75} />
            </span>
            <h1 className="text-[22px] font-bold tracking-[-0.02em]">
              {filterLabel}
            </h1>
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
              {filtered.length}
            </span>
            {filter !== "all" && (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="ml-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
              >
                · Show all
              </button>
            )}
          </div>
          <p className="pl-[42px] text-[13px] text-muted-foreground">
            AI suggestions, alerts, and workspace activity that need attention.
          </p>
        </div>

        {/* 항목 목록 */}
        <div className="flex flex-col px-6 py-4">
          {filtered.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border bg-card px-6 py-16 text-center text-[13px] text-muted-foreground">
              {filter === "all"
                ? "Inbox is empty — all clear."
                : `No items in "${filterLabel}".`}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

function ItemRow({ item }: { item: InboxItem }) {
  const style = KIND_STYLE[item.kind]
  const Icon = style.Icon

  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-border-subtle bg-card p-3.5">
      <span
        className={cn(
          "inline-flex size-6 shrink-0 items-center justify-center rounded-md",
          style.bg,
          style.fg,
        )}
      >
        <Icon className="size-3.5" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="flex-1 truncate text-[13.5px] font-semibold">
            {item.title}
          </span>
          <span className="shrink-0 font-mono text-[10.5px] tabular-nums text-muted-foreground">
            {item.time}
          </span>
        </div>
        {item.detail && (
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted-foreground">
            {item.detail}
          </p>
        )}
      </div>
      {item.action && (
        <button
          type="button"
          onClick={item.action.onClick}
          className="shrink-0 rounded-md border border-border bg-card px-2.5 py-1 text-[11.5px] font-medium hover:bg-foreground/[0.04]"
        >
          {item.action.label}
        </button>
      )}
    </div>
  )
}
