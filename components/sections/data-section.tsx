// visual: Linear-style data table — subtle row hover, sticky header, tight cell padding, 12px sort arrows
"use client"

import { useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  AtSign,
  Calendar,
  Check,
  ChevronDown,
  Copy,
  Download,
  FileText,
  Filter,
  Flame,
  Hash,
  Key,
  Link,
  List,
  Mail,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  Search,
  SignalHigh,
  SignalLow,
  SignalMedium,
  ToggleLeft,
  Trash2,
  Type,
} from "lucide-react"
import {
  Circle,
  CircleDashed,
  CircleHalf,
  CircleNotch,
  CheckCircle,
} from "@phosphor-icons/react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  WORKSPACES,
  ACTIVE_WORKSPACE_ID,
  getActiveWorkspace,
  workspaceColorDotClass,
} from "@/lib/mock-workspaces"
import {
  AGENTS,
  CUSTOMERS,
  NOTES,
  PRIORITY_TONE,
  SCHEMA,
  STATUS_TONE,
  TICKETS,
  TIER_TONE,
  type Agent,
  type Customer,
  type CustomerTier,
  type Field,
  type FieldType,
  type Note,
  type TableNode,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
  type Tone,
  colorBgClass,
  getAgentName,
  getCustomerName,
} from "@/lib/mock-data"
import { toneBadgeClassDual, statusColorClass, statusBgClass, priorityTextClass } from "@/lib/tokens"

type AnyRow = Customer | Ticket | Agent | Note
type SortDir = "asc" | "desc"

// Status icons - Linear style using Phosphor
function StatusIcon({ status, className }: { status: TicketStatus; className?: string }) {
  const iconClass = cn("w-4 h-4", statusColorClass(status), className)
  switch (status) {
    case "미처리":
      return <CircleDashed className={iconClass} weight="bold" />
    case "진행중":
      return <CircleHalf className={iconClass} weight="fill" />
    case "대기":
      return <CircleNotch className={iconClass} weight="bold" />
    case "완료":
      return <CheckCircle className={iconClass} weight="fill" />
  }
}

// Priority icons - signal bars style
function PriorityIcon({ priority, className }: { priority: TicketPriority; className?: string }) {
  const iconClass = cn("w-4 h-4", priorityTextClass(priority), className)
  switch (priority) {
    case "Urgent":
      return <Flame className={iconClass} strokeWidth={1.5} />
    case "High":
      return <SignalHigh className={iconClass} strokeWidth={1.5} />
    case "Med":
      return <SignalMedium className={iconClass} strokeWidth={1.5} />
    case "Low":
      return <SignalLow className={iconClass} strokeWidth={1.5} />
  }
}

// Channel icons - known channels get icons, custom channels get first letter
const CHANNEL_ICONS: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  Email: Mail,
  Phone: Phone,
  Chat: MessageCircle,
}

function ChannelIcon({ channel, className }: { channel: string; className?: string }) {
  const IconComponent = CHANNEL_ICONS[channel]
  const iconClass = cn("w-4 h-4 text-muted-foreground", className)
  
  if (IconComponent) {
    return <IconComponent className={iconClass} strokeWidth={1.5} />
  }
  
  // Custom channel - show first letter in a circle
  const firstChar = channel.charAt(0).toUpperCase()
  return (
    <div className={cn(
      "w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[9px] font-medium text-muted-foreground",
      className
    )}>
      {firstChar}
    </div>
  )
}

// Field type icons for table columns
function FieldTypeIcon({ type, className }: { type: FieldType; className?: string }) {
  const iconClass = cn("w-3.5 h-3.5 text-muted-foreground", className)
  switch (type) {
    case "uuid":
      return <Key className={iconClass} strokeWidth={1.5} />
    case "string":
      return <Type className={iconClass} strokeWidth={1.5} />
    case "email":
      return <AtSign className={iconClass} strokeWidth={1.5} />
    case "phone":
      return <Phone className={iconClass} strokeWidth={1.5} />
    case "text":
      return <FileText className={iconClass} strokeWidth={1.5} />
    case "number":
      return <Hash className={iconClass} strokeWidth={1.5} />
    case "datetime":
      return <Calendar className={iconClass} strokeWidth={1.5} />
    case "select":
      return <List className={iconClass} strokeWidth={1.5} />
    case "status":
      return <ToggleLeft className={iconClass} strokeWidth={1.5} />
    case "fk":
      return <Link className={iconClass} strokeWidth={1.5} />
    default:
      return <Type className={iconClass} strokeWidth={1.5} />
  }
}

const TABLE_DATA: Record<string, AnyRow[]> = {
  customers: CUSTOMERS,
  tickets: TICKETS,
  agents: AGENTS,
  notes: NOTES,
}

const DEFAULT_SORT_KEY: Record<string, string> = {
  customers: "created_at",
  tickets: "opened_at",
  agents: "name",
  notes: "created_at",
}

function rowValue(row: AnyRow, key: string): unknown {
  return (row as unknown as Record<string, unknown>)[key]
}

function compare(a: unknown, b: unknown): number {
  const av = a ?? ""
  const bv = b ?? ""
  if (typeof av === "number" && typeof bv === "number") return av - bv
  const as = String(av)
  const bs = String(bv)
  return as < bs ? -1 : as > bs ? 1 : 0
}

function rowMatchesQuery(row: AnyRow, fields: Field[], q: string): boolean {
  const lq = q.toLowerCase()
  return fields.some((f) => {
    if (f.type === "fk") {
      const id = rowValue(row, f.name)
      const refLabel =
        f.ref === "customers"
          ? getCustomerName(id as string)
          : f.ref === "agents"
            ? getAgentName(id as string)
            : String(id ?? "")
      return refLabel.toLowerCase().includes(lq)
    }
    const v = rowValue(row, f.name)
    return v != null && String(v).toLowerCase().includes(lq)
  })
}

interface CellProps {
  field: Field
  value: unknown
}

function Cell({ field, value }: CellProps) {
  if (value == null) {
    return <span className="text-muted-foreground">—</span>
  }
  switch (field.type) {
    case "uuid":
      return (
        <code className="text-xs font-mono text-muted-foreground">
          {String(value)}
        </code>
      )
    case "string":
      return <span className="text-sm">{String(value)}</span>
    case "email":
      return (
        <span className="font-mono text-xs text-muted-foreground">
          {String(value)}
        </span>
      )
    case "phone":
      return (
        <span className="font-mono text-xs text-muted-foreground">
          {String(value)}
        </span>
      )
    case "datetime":
      return (
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {String(value)}
        </span>
      )
    case "number":
      return (
        <span className="tabular-nums font-mono text-xs">{String(value)}</span>
      )
    case "text": {
      const s = String(value)
      return (
        <span className="text-muted-foreground text-sm">
          {s.length > 60 ? s.slice(0, 60) + "…" : s}
        </span>
      )
    }
    case "status": {
      const status = value as TicketStatus
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium",
              statusBgClass(status),
              statusColorClass(status)
            )}>
              <StatusIcon status={status} className="w-3.5 h-3.5" />
              <span>{status}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="top" sideOffset={4}>
            상태: {status}
          </TooltipContent>
        </Tooltip>
      )
    }
    case "select": {
      // Priority field - icon only with tooltip
      if (field.name === "priority") {
        const priority = value as TicketPriority
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center justify-center w-6 h-6 rounded hover:bg-foreground/5 transition-colors cursor-default">
                <PriorityIcon priority={priority} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" sideOffset={4}>
              우선순위: {priority}
            </TooltipContent>
          </Tooltip>
        )
      }
      // Channel field - icon + text
      if (field.name === "channel") {
        const channel = String(value)
        return (
          <div className="inline-flex items-center gap-1.5">
            <ChannelIcon channel={channel} />
            <span className="text-sm text-muted-foreground">{channel}</span>
          </div>
        )
      }
      // Other select fields (tier, etc.)
      let tone: Tone = "muted"
      if (field.name === "tier") {
        tone = TIER_TONE[value as CustomerTier] ?? "muted"
      }
      return (
        <Badge variant="outline" className={cn("text-xs", toneBadgeClassDual(tone))}>
          {String(value)}
        </Badge>
      )
    }
    case "fk": {
      const id = String(value)
      let label = id
      if (field.ref === "customers") label = getCustomerName(id)
      else if (field.ref === "agents") label = getAgentName(id)
      return (
        <span className="inline-flex items-center gap-1.5 text-sm">
          <span>{label}</span>
          <code className="text-[10px] font-mono text-muted-foreground">
            {id}
          </code>
        </span>
      )
    }
  }
}

interface ThProps {
  field: Field
  sort: { key: string; dir: SortDir } | null
  onSort: (key: string) => void
}

function Th({ field, sort, onSort }: ThProps) {
  const active = sort?.key === field.name
  const ArrowIcon = !active
    ? ArrowUpDown
    : sort?.dir === "asc"
      ? ArrowUp
      : ArrowDown
  return (
    <th
      className={cn(
        "px-3 py-2 text-left text-xs font-medium",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <button
        onClick={() => onSort(field.name)}
        className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
      >
        <FieldTypeIcon type={field.type} className={active ? "text-foreground" : ""} />
        <span>{field.name}</span>
        <ArrowIcon className="w-3 h-3" strokeWidth={1.5} />
      </button>
    </th>
  )
}

export function DataSection() {
  const [activeTable, setActiveTable] = useState<string>("tickets")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRows, setSelectedRows] = useState<string[]>([])
  const [sortByTable, setSortByTable] = useState<
    Record<string, { key: string; dir: SortDir } | null>
  >({})

  const table: TableNode | undefined = useMemo(
    () => SCHEMA.find((t) => t.id === activeTable),
    [activeTable],
  )

  const data = TABLE_DATA[activeTable] ?? []

  const sort =
    sortByTable[activeTable] ??
    ({ key: DEFAULT_SORT_KEY[activeTable] ?? "id", dir: "desc" } as const)

  const rows = useMemo(() => {
    if (!table) return []
    let r = [...data]
    if (searchQuery) r = r.filter((row) => rowMatchesQuery(row, table.fields, searchQuery))
    r.sort((a, b) => {
      const cmp = compare(rowValue(a, sort.key), rowValue(b, sort.key))
      return sort.dir === "asc" ? cmp : -cmp
    })
    return r
  }, [data, table, searchQuery, sort])

  const handleSort = (key: string) => {
    setSortByTable((prev) => {
      const current = prev[activeTable]
      const next: { key: string; dir: SortDir } =
        current?.key === key
          ? { key, dir: current.dir === "asc" ? "desc" : "asc" }
          : { key, dir: "asc" }
      return { ...prev, [activeTable]: next }
    })
  }

  const toggleRowSelection = (id: string) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id],
    )
  }

  const toggleAllRows = () => {
    if (!table) return
    if (selectedRows.length === rows.length) {
      setSelectedRows([])
    } else {
      setSelectedRows(rows.map((row) => row.id))
    }
  }

  const handleSetActiveTable = (id: string) => {
    setActiveTable(id)
    setSelectedRows([])
    setSearchQuery("")
  }

  return (
    <div className="flex h-full">
      {/* Table List Sidebar */}
      <div className="w-52 border-r border-border/60 bg-surface p-3 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">테이블</h3>
          <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-foreground/5">
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
          </Button>
        </div>
        <div className="space-y-0.5">
          {SCHEMA.map((t) => {
            const count = (TABLE_DATA[t.id] ?? []).length
            const selected = activeTable === t.id
            return (
              <button
                key={t.id}
                onClick={() => handleSetActiveTable(t.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-foreground/5",
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    colorBgClass(t.color),
                  )}
                />
                <span className="flex-1 text-left font-medium">{t.label}</span>
                <span
                  className={cn(
                    "text-[11px] tabular-nums",
                    selected
                      ? "text-primary-foreground/70"
                      : "text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
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
            <h2 className="text-base font-semibold">{table?.label}</h2>
            <span className="text-xs text-muted-foreground tabular-nums">
              {rows.length}개 / 전체 {data.length}개
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" strokeWidth={1.5} />
              <input
                type="text"
                placeholder="검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-sm bg-secondary border border-border/60 rounded-md outline-none focus:ring-1 focus:ring-ring w-56"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-sm border-border/60">
              <Filter className="w-3.5 h-3.5" strokeWidth={1.5} />
              필터
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 h-8 text-sm border-border/60">
              <Download className="w-3.5 h-3.5" strokeWidth={1.5} />
              내보내기
            </Button>
            <Button size="sm" className="gap-1.5 h-8 text-sm">
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              레코드 추가
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {table && (
            <table className="w-full">
              <thead className="bg-muted/40 sticky top-0 z-10 border-b border-border/60">
                <tr>
                  <th className="w-10 px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      aria-label="전체 선택"
                      checked={
                        rows.length > 0 && selectedRows.length === rows.length
                      }
                      onChange={toggleAllRows}
                      className="rounded border-input"
                    />
                  </th>
                  {table.fields.map((field) => (
                    <Th
                      key={field.name}
                      field={field}
                      sort={sort}
                      onSort={handleSort}
                    />
                  ))}
                  <th className="w-10 px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const id = row.id
                  const isSelected = selectedRows.includes(id)
                  return (
                    <tr
                      key={id}
                      className={cn(
                        "border-b border-border/40 hover:bg-foreground/[0.02] dark:hover:bg-foreground/[0.04] transition-colors",
                        isSelected && "bg-primary/5",
                      )}
                    >
                      <td className="px-3 py-2">
                        <input
                          type="checkbox"
                          aria-label={`${id} 선택`}
                          checked={isSelected}
                          onChange={() => toggleRowSelection(id)}
                          className="rounded border-input"
                        />
                      </td>
                      {table.fields.map((field) => (
                        <td
                          key={field.name}
                          className="px-3 py-2 text-sm align-middle"
                        >
                          <Cell field={field} value={rowValue(row, field.name)} />
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-foreground/5">
                              <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Pencil className="w-4 h-4 mr-2" strokeWidth={1.5} />
                              편집
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="w-4 h-4 mr-2" strokeWidth={1.5} />
                              복제
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive">
                              <Trash2 className="w-4 h-4 mr-2" strokeWidth={1.5} />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  )
                })}
                {rows.length === 0 && (
                  <tr>
                    <td
                      colSpan={(table?.fields.length ?? 0) + 2}
                      className="px-4 py-10 text-center text-sm text-muted-foreground"
                    >
                      검색 결과가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border/60 bg-surface">
          <span className="text-xs text-muted-foreground">
            {selectedRows.length > 0
              ? `${selectedRows.length}개 선택됨`
              : `${rows.length}개 레코드`}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled className="h-7 text-xs border-border/60">
              이전
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums">1 / 1</span>
            <Button variant="outline" size="sm" disabled className="h-7 text-xs border-border/60">
              다음
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
