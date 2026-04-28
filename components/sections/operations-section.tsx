"use client"

import { useMemo, useState } from "react"
import {
  Calendar,
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
import { cn } from "@/lib/utils"
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
  toneBadgeClass,
  toneDotClass,
} from "@/lib/mock-data"

type ViewMode = "kanban" | "list"

const PRIORITY_ORDER: Record<TicketPriority, number> = {
  Urgent: 0,
  High: 1,
  Med: 2,
  Low: 3,
}

const STATS_TONE: Record<TicketStatus, string> = {
  미처리: "text-destructive",
  진행중: "text-primary",
  대기: "text-warning-foreground",
  완료: "text-success",
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
    tone: STATS_TONE[s],
  }))

  const openTickets = filtered
    .filter((t) => t.status !== "완료")
    .sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold">업무 관리</h2>
          <span className="text-sm text-muted-foreground">
            오늘 미처리: {counts.미처리}건 · 평균 응답 1시간 47분
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="제목·고객·ID 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm bg-secondary border-none rounded-md outline-none focus:ring-2 focus:ring-ring w-64"
            />
          </div>
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="w-4 h-4" />
            필터
          </Button>
          <div className="flex items-center bg-secondary rounded-lg p-1">
            <Button
              variant={viewMode === "kanban" ? "default" : "ghost"}
              size="icon-sm"
              aria-label="칸반 뷰"
              onClick={() => setViewMode("kanban")}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon-sm"
              aria-label="리스트 뷰"
              onClick={() => setViewMode("list")}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
          {!showRail && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setShowRail(true)}
            >
              <Sparkles className="w-4 h-4" />
              추천 열기
            </Button>
          )}
          <Button size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            티켓 추가
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-card border-b border-border">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {stat.label}
              </span>
              <span
                className={cn("text-2xl font-bold tabular-nums", stat.tone)}
              >
                {stat.value}
              </span>
            </div>
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
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    toneDotClass(STATUS_TONE[status]),
                  )}
                />
                <span className="font-medium">{status}</span>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {items.length}
                </span>
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
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
                <div className="text-xs text-muted-foreground py-6 text-center border border-dashed border-border rounded-md">
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
      className="cursor-pointer hover:shadow-md transition-shadow py-0"
      onClick={onSelect}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between">
          <code className="text-xs font-mono text-muted-foreground">
            {ticket.id}
          </code>
          <Badge
            variant="outline"
            className={cn("text-xs", toneBadgeClass(PRIORITY_TONE[ticket.priority]))}
          >
            {ticket.priority}
          </Badge>
        </div>
        <div className="text-sm font-medium leading-snug">
          {ticket.subject}
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted-foreground truncate">
            {customer?.name} · {customer?.company}
          </span>
          {assignee ? (
            <Avatar className="size-6">
              <AvatarFallback className="text-xs">
                {assignee.name.slice(-1)}
              </AvatarFallback>
            </Avatar>
          ) : (
            <span className="text-xs text-muted-foreground">미지정</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ListView({ tickets, customerById, agentById, onSelect }: ViewProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-sm text-muted-foreground">
          처리 필요 · 우선순위 정렬
        </span>
        <span className="text-sm text-muted-foreground font-mono tabular-nums">
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
              "p-4 cursor-pointer hover:shadow-md transition-shadow py-0",
              stale && "ring-1 ring-destructive/30",
            )}
          >
            <CardContent className="p-3 flex items-center gap-4">
              <div className="flex flex-col items-center gap-1 w-16 shrink-0">
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    toneDotClass(PRIORITY_TONE[tk.priority]),
                  )}
                />
                <span className="text-xs font-medium">{tk.priority}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono text-muted-foreground">
                    {tk.id}
                  </code>
                  <span className="text-sm font-medium truncate">
                    {tk.subject}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
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
              <Badge
                variant="outline"
                className={cn("font-medium", toneBadgeClass(STATUS_TONE[tk.status]))}
              >
                {tk.status}
              </Badge>
              <div className="w-24 flex justify-end">
                {a ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="size-7">
                      <AvatarFallback className="text-xs">
                        {a.name.slice(-1)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {a.team}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">미지정</span>
                )}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        )
      })}
      {tickets.length === 0 && (
        <div className="text-sm text-muted-foreground py-12 text-center">
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
    <aside className="w-80 shrink-0 border-l border-border bg-card overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="font-medium text-sm">자동화 추천</span>
          <Badge variant="secondary" className="font-mono text-xs">
            {suggestions.length}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="추천 닫기"
          onClick={onHide}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
      <div className="p-4 space-y-3">
        {suggestions.map((s) => (
          <Card key={s.id} className="py-0">
            <CardContent className="p-4 space-y-2">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {s.kind}
              </span>
              <div className="text-sm font-medium leading-snug">{s.title}</div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {s.body}
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <Button size="sm" onClick={() => onDismiss(s.id)}>
                  {s.action}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDismiss(s.id)}
                >
                  무시
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        <p className="text-xs text-muted-foreground text-center pt-2">
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
            <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                티켓 · {ticket.id}
              </span>
              <SheetTitle className="text-base leading-snug">
                {ticket.subject}
              </SheetTitle>
              <SheetDescription className="sr-only">
                티켓 상세 정보 및 상태 변경
              </SheetDescription>
            </SheetHeader>

            <div className="p-5 space-y-5">
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
                      className="gap-1.5 flex-1"
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          toneDotClass(STATUS_TONE[s]),
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
                <Badge
                  variant="outline"
                  className={cn(
                    "font-medium",
                    toneBadgeClass(PRIORITY_TONE[ticket.priority]),
                  )}
                >
                  {ticket.priority}
                </Badge>
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
                  <Badge variant="outline" className="gap-2 py-1.5 px-2.5">
                    <Avatar className="size-5">
                      <AvatarFallback className="text-xs">
                        {assignee.name.slice(-1)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{assignee.name}</span>
                    <span className="text-muted-foreground">
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
                          className="inline-flex items-center gap-2 px-2.5 py-1.5 text-xs rounded-md border border-border hover:bg-muted transition-colors"
                        >
                          <Avatar className="size-5">
                            <AvatarFallback className="text-xs">
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
                <span className="text-sm font-mono inline-flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {ticket.opened_at}
                </span>
              </div>

              {/* Activity */}
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                  활동
                </div>
                <div className="border-l border-dashed border-border pl-4 space-y-4 ml-1">
                  <div className="relative">
                    <span className="absolute -left-5 top-1.5 w-2 h-2 rounded-full bg-foreground" />
                    <div className="text-sm font-medium">접수됨</div>
                    <div className="text-xs text-muted-foreground">
                      {ticket.opened_at}
                    </div>
                  </div>
                  {assignee && (
                    <div className="relative">
                      <span className="absolute -left-5 top-1.5 w-2 h-2 rounded-full bg-primary" />
                      <div className="text-sm font-medium">
                        {assignee.name} 배정
                      </div>
                      <div className="text-xs text-muted-foreground">
                        자동 라우팅 · 부하 기반
                      </div>
                    </div>
                  )}
                  <div className="relative">
                    <span className="absolute -left-5 top-1.5 w-2 h-2 rounded-full bg-muted-foreground" />
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
