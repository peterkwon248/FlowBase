// visual: Linear-style operations — cards 6px rounded, priority as left dot, subtle shadows
"use client"

import { useMemo, useState } from "react"
import {
  Calendar,
  Check,
  ChevronDown,
  Filter,
  LayoutGrid,
  List,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  WORKSPACES,
  ACTIVE_WORKSPACE_ID,
  getActiveWorkspace,
  workspaceColorDotClass,
} from "@/lib/mock-workspaces"
import {
  AGENTS,
  CUSTOMERS,
  PRIORITY_TONE,
  STATUSES,
  STATUS_TONE,
  SUGGESTIONS,
  TICKETS,
  type Agent,
  type Suggestion,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
  ageInHours,
} from "@/lib/mock-data"
import { toneBadgeClassDual, toneDotClassDual, priorityDotClass, statusColorClass } from "@/lib/tokens"

type ViewMode = "kanban" | "list"

const PRIORITY_ORDER: Record<TicketPriority, number> = {
  Urgent: 0,
  High: 1,
  Med: 2,
  Low: 3,
}

export function OperationsSection() {
  const [tickets, setTickets] = useState<Ticket[]>(TICKETS)
  const [viewMode, setViewMode] = useState<ViewMode>("kanban")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<Suggestion[]>(SUGGESTIONS)
  const [showRail, setShowRail] = useState(true)

  const customerById = useMemo(() => {
    const m = new Map(CUSTOMERS.map((c) => [c.id, c]))
    return m
  }, [])
  const agentById = useMemo(() => {
    const m = new Map(AGENTS.map((a) => [a.id, a]))
    return m
  }, [])

  const filtered = useMemo(() => {
    if (!searchQuery) return tickets
    const q = searchQuery.toLowerCase()
    return tickets.filter((t) => {
      const c = customerById.get(t.customer_id)
      return (
        t.id.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        (c?.name ?? "").toLowerCase().includes(q)
      )
    })
  }, [tickets, searchQuery, customerById])

  const counts = useMemo(() => {
    const c: Record<TicketStatus, number> = {
      미처리: 0,
      진행중: 0,
      대기: 0,
      완료: 0,
    }
    tickets.forEach((t) => {
      c[t.status]++
    })
    return c
  }, [tickets])

  const updateTicket = (id: string, patch: Partial<Ticket>) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)))
  }

  const dismissSuggestion = (id: string) => {
    setSuggestions((s) => s.filter((x) => x.id !== id))
  }

  const selectedTicket = useMemo(
    () => tickets.find((t) => t.id === selectedTicketId) ?? null,
    [tickets, selectedTicketId],
  )

  const stats = STATUSES.map((s) => ({
    label: s,
    value: counts[s],
    tone: statusColorClass(s),
  }))

  const openTickets = filtered
    .filter((t) => t.status !== "완료")
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-surface">
        <div className="flex items-center gap-3">
          {/* Workspace Selector */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-foreground/5 transition-colors">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full shrink-0",
                    workspaceColorDotClass(getActiveWorkspace()?.color ?? "blue")
                  )}
                />
                <span className="text-sm font-medium text-muted-foreground">
                  {getActiveWorkspace()?.name ?? "워크스페이스"}
                </span>
                <ChevronDown className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-56 p-0" sideOffset={4}>
              <div className="py-1 max-h-60 overflow-y-auto">
                {WORKSPACES.filter(w => !w.archived).map((ws) => {
                  const isActive = ws.id === ACTIVE_WORKSPACE_ID
                  return (
                    <button
                      key={ws.id}
                      onClick={() => console.log("switch workspace:", ws.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-foreground/5 transition-colors",
                        isActive && "bg-foreground/[0.03]"
                      )}
                    >
                      <span className={cn("w-2 h-2 rounded-full shrink-0", workspaceColorDotClass(ws.color))} />
                      <span className={cn("text-sm flex-1", isActive && "font-semibold")}>{ws.name}</span>
                      {isActive && <Check className="w-3.5 h-3.5 text-primary" strokeWidth={1.5} />}
                    </button>
                  )
                })}
              </div>
            </PopoverContent>
          </Popover>
          <span className="text-muted-foreground/40">/</span>
          <h2 className="text-base font-semibold">업무 관리</h2>
          <span className="text-xs text-muted-foreground">
            오늘 미처리: {counts.미처리}건 · 평균 응답 1시간 47분
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
            <input
              type="text"
              placeholder="제목·고객·ID 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-sm bg-secondary border border-border/60 rounded-md outline-none focus:ring-1 focus:ring-ring w-56"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5 h-8 text-sm border-border/60">
            <Filter className="w-3.5 h-3.5" strokeWidth={1.5} />
            필터
          </Button>
          <div className="flex items-center bg-secondary rounded-md p-0.5 border border-border/60">
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="icon-sm"
              aria-label="칸반 뷰"
              onClick={() => setViewMode("kanban")}
              className="h-7 w-7"
            >
              <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon-sm"
              aria-label="리스트 뷰"
              onClick={() => setViewMode("list")}
              className="h-7 w-7"
            >
              <List className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Button>
          </div>
          {!showRail && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-8 text-sm border-border/60"
              onClick={() => setShowRail(true)}
            >
              <Sparkles className="w-3.5 h-3.5" strokeWidth={1.5} />
              추천 열기
            </Button>
          )}
          <Button size="sm" className="gap-1.5 h-8 text-sm">
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            티켓 추가
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3 p-4 bg-surface border-b border-border/60">
        {stats.map((stat) => (
          <Card key={stat.label} className="py-0 border-border/60">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-medium">
                  {stat.label}
                </span>
                <span
                  className={cn("text-xl font-semibold tabular-nums", stat.tone)}
                >
                  {stat.value}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-auto p-4">
          {viewMode === "kanban" ? (
            <KanbanView
              tickets={filtered}
              customerById={customerById}
              agentById={agentById}
              onSelect={setSelectedTicketId}
            />
          ) : (
            <ListView
              tickets={openTickets}
              customerById={customerById}
              agentById={agentById}
              onSelect={setSelectedTicketId}
            />
          )}
        </div>

        {showRail && suggestions.length > 0 && (
          <SuggestionRail
            suggestions={suggestions}
            onDismiss={dismissSuggestion}
            onHide={() => setShowRail(false)}
          />
        )}
      </div>

      <DetailDrawer
        ticket={selectedTicket}
        agents={Array.from(agentById.values())}
        customer={
          selectedTicket ? customerById.get(selectedTicket.customer_id) : null
        }
        assignee={
          selectedTicket?.assignee_id
            ? (agentById.get(selectedTicket.assignee_id) ?? null)
            : null
        }
        onClose={() => setSelectedTicketId(null)}
        updateTicket={updateTicket}
      />
    </div>
  )
}

interface ViewProps {
  tickets: Ticket[]
  customerById: Map<string, (typeof CUSTOMERS)[number]>
  agentById: Map<string, Agent>
  onSelect: (id: string) => void
}

function KanbanView({ tickets, customerById, agentById, onSelect }: ViewProps) {
  return (
    <div className="grid grid-cols-4 gap-4 h-full">
      {STATUSES.map((status) => {
        const items = tickets.filter((t) => t.status === status)
        return (
          <div key={status} className="flex flex-col min-h-0">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    toneDotClassDual(STATUS_TONE[status]),
                  )}
                />
                <span className="font-medium text-sm">{status}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {items.length}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-foreground/5">
                <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              </Button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto pr-1">
              {items.map((tk) => (
                <TicketCard
                  key={tk.id}
                  ticket={tk}
                  customer={customerById.get(tk.customer_id) ?? null}
                  assignee={
                    tk.assignee_id
                      ? (agentById.get(tk.assignee_id) ?? null)
                      : null
                  }
                  onSelect={() => onSelect(tk.id)}
                />
              ))}
              {items.length === 0 && (
                <div className="text-xs text-muted-foreground py-6 text-center border border-dashed border-border/60 rounded-md">
                  비어 있음
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

interface TicketCardProps {
  ticket: Ticket
  customer: ReturnType<typeof CUSTOMERS["find"]> | null | undefined
  assignee: Agent | null
  onSelect: () => void
}

function TicketCard({ ticket, customer, assignee, onSelect }: TicketCardProps) {
  return (
    <Card
      className="cursor-pointer hover:bg-foreground/[0.02] dark:hover:bg-foreground/[0.04] transition-colors py-0 border-border/60 shadow-sm hover:shadow-md"
      onClick={onSelect}
    >
      <CardContent className="p-3 space-y-2">
        {/* Priority dot + ID */}
        <div className="flex items-center gap-2">
          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", priorityDotClass(ticket.priority))} />
          <code className="text-[10px] font-mono text-muted-foreground">
            {ticket.id}
          </code>
        </div>
        {/* Subject */}
        <div className="text-sm font-medium leading-snug">
          {ticket.subject}
        </div>
        {/* Footer */}
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground truncate">
            {customer?.name} · {customer?.company}
          </span>
          {assignee ? (
            <Avatar className="size-5">
              <AvatarFallback className="text-[10px] bg-muted">
                {assignee.name.slice(-1)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <span className="text-[10px] text-muted-foreground">미지정</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ListView({ tickets, customerById, agentById, onSelect }: ViewProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-xs text-muted-foreground">
          처리 필요 · 우선순위 정렬
        </span>
        <span className="text-xs text-muted-foreground font-mono tabular-nums">
          {tickets.length} items
        </span>
      </div>
      {tickets.map((tk) => {
        const c = customerById.get(tk.customer_id)
        const a = tk.assignee_id ? agentById.get(tk.assignee_id) : null
        const age = ageInHours(tk.opened_at)
        const stale = age > 8 && tk.status === "미처리"
        return (
          <Card
            key={tk.id}
            onClick={() => onSelect(tk.id)}
            className={cn(
              "cursor-pointer hover:bg-foreground/[0.02] dark:hover:bg-foreground/[0.04] transition-colors py-0 border-border/60",
              stale && "ring-1 ring-destructive/30",
            )}
          >
            <CardContent className="p-3 flex items-center gap-3">
              {/* Priority dot */}
              <div className="flex flex-col items-center gap-1 w-12 shrink-0">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    priorityDotClass(tk.priority),
                  )}
                />
                <span className="text-[10px] font-medium text-muted-foreground">{tk.priority}</span>
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-[10px] font-mono text-muted-foreground">
                    {tk.id}
                  </code>
                  <span className="text-sm font-medium truncate">
                    {tk.subject}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>
                    {c?.name} · {c?.company}
                  </span>
                  <span>·</span>
                  <span>{tk.channel}</span>
                  <span>·</span>
                  <span className={cn(stale && "text-destructive font-medium")}>
                    {age}시간 경과
                  </span>
                </div>
              </div>
              {/* Status badge */}
              <Badge
                variant="outline"
                className={cn("font-medium text-xs", toneBadgeClassDual(STATUS_TONE[tk.status]))}
              >
                {tk.status}
              </Badge>
              {/* Assignee */}
              <div className="w-20 flex justify-end">
                {a ? (
                  <div className="flex items-center gap-1.5">
                    <Avatar className="size-6">
                      <AvatarFallback className="text-[10px] bg-muted">
                        {a.name.slice(-1)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] text-muted-foreground">
                      {a.team}
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-muted-foreground">미지정</span>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 hover:bg-foreground/5">
                <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            </CardContent>
          </Card>
        )
      })}
      {tickets.length === 0 && (
        <div className="text-sm text-muted-foreground py-10 text-center">
          처리할 항목이 없습니다.
        </div>
      )}
    </div>
  )
}

interface SuggestionRailProps {
  suggestions: Suggestion[]
  onDismiss: (id: string) => void
  onHide: () => void
}

function SuggestionRail({
  suggestions,
  onDismiss,
  onHide,
}: SuggestionRailProps) {
  return (
    <aside className="w-72 shrink-0 border-l border-border/60 bg-surface overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/60">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <span className="font-medium text-sm">자동화 추천</span>
          <Badge variant="secondary" className="font-mono text-[10px] h-5 px-1.5">
            {suggestions.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-foreground/5"
          aria-label="추천 닫기"
          onClick={onHide}
        >
          <X className="w-3.5 h-3.5" strokeWidth={1.5} />
        </Button>
      </div>
      <div className="p-3 space-y-2">
        {suggestions.map((s) => (
          <Card key={s.id} className="py-0 border-border/60">
            <CardContent className="p-3 space-y-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {s.kind}
              </span>
              <div className="text-sm font-medium leading-snug">{s.title}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {s.body}
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <Button size="sm" className="h-7 text-xs" onClick={() => onDismiss(s.id)}>
                  {s.action}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs hover:bg-foreground/5"
                  onClick={() => onDismiss(s.id)}
                >
                  무시
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        <p className="text-[10px] text-muted-foreground text-center pt-2">
          사람이 확정해야 적용됩니다.
        </p>
      </div>
    </aside>
  )
}

interface DetailDrawerProps {
  ticket: Ticket | null
  customer: ReturnType<typeof CUSTOMERS["find"]> | null | undefined
  assignee: Agent | null
  agents: Agent[]
  onClose: () => void
  updateTicket: (id: string, patch: Partial<Ticket>) => void
}

function DetailDrawer({
  ticket,
  customer,
  assignee,
  agents,
  onClose,
  updateTicket,
}: DetailDrawerProps) {
  const recommendations = useMemo(() => {
    return [...agents].sort((a, b) => a.load - b.load).slice(0, 2)
  }, [agents])

  return (
    <Sheet open={ticket !== null} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md overflow-y-auto p-0"
      >
        {ticket && (
          <>
            <SheetHeader className="px-4 pt-4 pb-3 border-b border-border/60">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                티켓 · {ticket.id}
              </span>
              <SheetTitle className="text-base leading-snug">
                {ticket.subject}
              </SheetTitle>
              <SheetDescription className="sr-only">
                티켓 상세 정보 및 상태 변경
              </SheetDescription>
            </SheetHeader>

            <div className="p-4 space-y-4">
              {/* Status */}
              <div>
                <div className="text-xs text-muted-foreground mb-2">상태</div>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  size="sm"
                  value={ticket.status}
                  onValueChange={(v) => {
                    if (v) updateTicket(ticket.id, { status: v as TicketStatus })
                  }}
                  className="w-full"
                >
                  {STATUSES.map((s) => (
                    <ToggleGroupItem
                      key={s}
                      value={s}
                      className="gap-1.5 flex-1 text-xs"
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          toneDotClassDual(STATUS_TONE[s]),
                        )}
                      />
                      {s}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              {/* Priority */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">우선순위</span>
                <div className="flex items-center gap-2">
                  <span className={cn("w-2 h-2 rounded-full", priorityDotClass(ticket.priority))} />
                  <span className="text-sm font-medium">{ticket.priority}</span>
                </div>
              </div>

              {/* Customer */}
              {customer && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">고객</div>
                  <div className="space-y-1">
                    <div className="text-sm font-medium">
                      {customer.name}{" "}
                      <span className="text-muted-foreground font-normal">
                        · {customer.company}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      {customer.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Tier: {customer.tier} · 등록 {customer.created_at}
                    </div>
                  </div>
                </div>
              )}

              {/* Assignee */}
              <div>
                <div className="text-xs text-muted-foreground mb-2">담당자</div>
                {assignee ? (
                  <Badge variant="outline" className="gap-2 py-1.5 px-2.5 border-border/60">
                    <Avatar className="size-5">
                      <AvatarFallback className="text-[10px] bg-muted">
                        {assignee.name.slice(-1)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{assignee.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {assignee.team} · 부하 {assignee.load}
                    </span>
                  </Badge>
                ) : (
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground">
                      추천:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {recommendations.map((ag) => (
                        <button
                          key={ag.id}
                          type="button"
                          onClick={() =>
                            updateTicket(ticket.id, { assignee_id: ag.id })
                          }
                          className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md border border-border/60 hover:bg-foreground/5 transition-colors"
                        >
                          <Avatar className="size-5">
                            <AvatarFallback className="text-[10px] bg-muted">
                              {ag.name.slice(-1)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{ag.name}</span>
                          <span className="text-muted-foreground">
                            부하 {ag.load}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Channel */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">채널</span>
                <span className="text-sm font-mono">{ticket.channel}</span>
              </div>

              {/* Opened at */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">접수</span>
                <span className="text-sm font-mono inline-flex items-center gap-1 tabular-nums">
                  <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
                  {ticket.opened_at}
                </span>
              </div>

              {/* Activity */}
              <div>
                <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground mb-3">
                  활동
                </div>
                <div className="border-l border-dashed border-border/60 pl-4 space-y-3 ml-1">
                  <div className="relative">
                    <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-foreground" />
                    <div className="text-sm font-medium">접수됨</div>
                    <div className="text-xs text-muted-foreground">
                      {ticket.opened_at}
                    </div>
                  </div>
                  {assignee && (
                    <div className="relative">
                      <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-primary" />
                      <div className="text-sm font-medium">
                        {assignee.name} 배정
                      </div>
                      <div className="text-xs text-muted-foreground">
                        자동 라우팅 · 부하 기반
                      </div>
                    </div>
                  )}
                  <div className="relative">
                    <span className="absolute -left-[17px] top-1.5 w-2 h-2 rounded-full bg-muted-foreground" />
                    <div className="text-sm font-medium">고객 응답 대기</div>
                    <div className="text-xs text-muted-foreground">
                      템플릿 #03 발송
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
