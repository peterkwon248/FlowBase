"use client"

import { useMemo, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Copy,
  Download,
  Filter,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react"
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
  type Note,
  type TableNode,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
  type Tone,
  colorBgClass,
  getAgentName,
  getCustomerName,
  toneBadgeClass,
} from "@/lib/mock-data"

type AnyRow = Customer | Ticket | Agent | Note
type SortDir = "asc" | "desc"

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
      return <span>{String(value)}</span>
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
        <span className="font-mono text-xs text-muted-foreground">
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
        <span className="text-muted-foreground">
          {s.length > 60 ? s.slice(0, 60) + "…" : s}
        </span>
      )
    }
    case "status": {
      const tone: Tone = STATUS_TONE[value as TicketStatus] ?? "muted"
      return (
        <Badge variant="outline" className={cn("font-medium", toneBadgeClass(tone))}>
          {String(value)}
        </Badge>
      )
    }
    case "select": {
      let tone: Tone = "muted"
      if (field.name === "priority") {
        tone = PRIORITY_TONE[value as TicketPriority] ?? "muted"
      } else if (field.name === "tier") {
        tone = TIER_TONE[value as CustomerTier] ?? "muted"
      }
      return (
        <Badge variant="outline" className={toneBadgeClass(tone)}>
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
        <span className="inline-flex items-center gap-2">
          <span>{label}</span>
          <code className="text-xs font-mono text-muted-foreground">
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
        "px-4 py-3 text-left text-sm font-medium",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      <button
        onClick={() => onSort(field.name)}
        className="inline-flex items-center gap-1 hover:text-foreground"
      >
        {field.name}
        <ArrowIcon className="w-3 h-3" />
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
      <div className="w-56 border-r border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">테이블</h3>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="space-y-1">
          {SCHEMA.map((t) => {
            const count = (TABLE_DATA[t.id] ?? []).length
            const selected = activeTable === t.id
            return (
              <button
                key={t.id}
                onClick={() => handleSetActiveTable(t.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors",
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full shrink-0",
                    colorBgClass(t.color),
                  )}
                />
                <span className="flex-1 text-left">{t.label}</span>
                <span
                  className={cn(
                    "text-xs",
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
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{table?.label}</h2>
            <span className="text-sm text-muted-foreground">
              {rows.length}개 / 전체 {data.length}개
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 text-sm bg-secondary border-none rounded-md outline-none focus:ring-2 focus:ring-ring w-64"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="w-4 h-4" />
              필터
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="w-4 h-4" />
              내보내기
            </Button>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              레코드 추가
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {table && (
            <table className="w-full">
              <thead className="bg-muted/50 sticky top-0 z-10">
                <tr>
                  <th className="w-12 px-4 py-3 text-left">
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
                  <th className="w-12 px-4 py-3" />
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
                        "border-b border-border hover:bg-muted/30 transition-colors",
                        isSelected && "bg-primary/5",
                      )}
                    >
                      <td className="px-4 py-3">
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
                          className="px-4 py-3 text-sm align-middle"
                        >
                          <Cell field={field} value={rowValue(row, field.name)} />
                        </td>
                      ))}
                      <td className="px-4 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Pencil className="w-4 h-4 mr-2" />
                              편집
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Copy className="w-4 h-4 mr-2" />
                              복제
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
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
                      className="px-4 py-12 text-center text-sm text-muted-foreground"
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
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
          <span className="text-sm text-muted-foreground">
            {selectedRows.length > 0
              ? `${selectedRows.length}개 선택됨`
              : `${rows.length}개 레코드`}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              이전
            </Button>
            <span className="text-sm">1 / 1</span>
            <Button variant="outline" size="sm" disabled>
              다음
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
