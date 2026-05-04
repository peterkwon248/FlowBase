// visual: Linear-style ER diagram — 1px borders, subtle shadow, 6px rounded nodes
"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import {
  AlignStartVertical,
  Check,
  ChevronDown,
  ClipboardCopy,
  Columns3,
  FileCode,
  Link2,
  Maximize2,
  MousePointer2,
  Move,
  Network,
  Plus,
  ZoomIn,
  ZoomOut,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  RELATIONS as INITIAL_RELATIONS,
  SCHEMA as INITIAL_SCHEMA,
  type ChartColor,
  type Field,
  type Relation,
  type TableNode,
  colorBgClass,
  colorTextClass,
  generateSql,
} from "@/lib/mock-data"

type Tool = "select" | "move" | "connect"
type Lens = "schema" | "fields" | "relations"

const CARD_WIDTH = 240
const CARD_HEADER_HEIGHT = 44
const FIELD_ROW_HEIGHT = 26
const CARD_BODY_PADDING = 10

const ZOOM_MIN = 60
const ZOOM_MAX = 160
const ZOOM_STEP = 20

const COLOR_OPTIONS: ChartColor[] = [
  "chart-1",
  "chart-2",
  "chart-3",
  "chart-4",
  "chart-5",
]

const SNAP_POSITIONS: Record<string, { x: number; y: number }> = {
  customers: { x: 80, y: 60 },
  tickets: { x: 460, y: 60 },
  agents: { x: 80, y: 380 },
  notes: { x: 460, y: 380 },
}

function cardHeight(table: TableNode): number {
  return CARD_HEADER_HEIGHT + table.fields.length * FIELD_ROW_HEIGHT + CARD_BODY_PADDING
}

interface BezierResult {
  d: string
  mid: { x: number; y: number }
}

function bezierBetween(
  from: TableNode,
  to: TableNode,
  fromHeight: number,
  toHeight: number,
): BezierResult {
  const fcx = from.x + CARD_WIDTH / 2
  const fcy = from.y + fromHeight / 2
  const tcx = to.x + CARD_WIDTH / 2
  const tcy = to.y + toHeight / 2
  const dx = tcx - fcx
  const dy = tcy - fcy

  let x1: number, y1: number, x2: number, y2: number
  if (Math.abs(dx) >= Math.abs(dy)) {
    x1 = dx > 0 ? from.x + CARD_WIDTH : from.x
    y1 = fcy
    x2 = dx > 0 ? to.x : to.x + CARD_WIDTH
    y2 = tcy
    const cx = (x1 + x2) / 2
    return {
      d: `M ${x1} ${y1} C ${cx} ${y1}, ${cx} ${y2}, ${x2} ${y2}`,
      mid: { x: (x1 + x2) / 2, y: (y1 + y2) / 2 },
    }
  }
  x1 = fcx
  y1 = dy > 0 ? from.y + fromHeight : from.y
  x2 = tcx
  y2 = dy > 0 ? to.y : to.y + toHeight
  const cy = (y1 + y2) / 2
  return {
    d: `M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`,
    mid: { x: (x1 + x2) / 2, y: (y1 + y2) / 2 },
  }
}

function fieldKindLabel(field: Field): string {
  if (field.pk) return "PK"
  if (field.type === "fk") return "FK"
  return field.type
}

function fieldKindClass(field: Field): string {
  if (field.pk) return "bg-primary/10 text-primary dark:bg-primary/15"
  if (field.type === "fk") return "bg-accent/50 text-accent-foreground dark:bg-accent/40"
  return "bg-muted text-muted-foreground"
}

export function DesignSection() {
  const [zoom, setZoom] = useState(100)
  const [activeTool, setActiveTool] = useState<Tool>("select")
  const [lens, setLens] = useState<Lens>("schema")
  const [tables, setTables] = useState<TableNode[]>(INITIAL_SCHEMA)
  const [relations] = useState<Relation[]>(INITIAL_RELATIONS)
  const [activeTableId, setActiveTableId] = useState<string | null>(null)

  const [sqlOpen, setSqlOpen] = useState(false)
  const [sqlCopied, setSqlCopied] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newEn, setNewEn] = useState("")
  const [newColor, setNewColor] = useState<ChartColor>("chart-5")

  const dragRef = useRef<{
    id: string
    startX: number
    startY: number
    tableX: number
    tableY: number
  } | null>(null)

  const canvasSize = useMemo(() => {
    const maxX = Math.max(...tables.map((t) => t.x + CARD_WIDTH)) + 80
    const maxY = Math.max(...tables.map((t) => t.y + cardHeight(t))) + 80
    return { width: Math.max(maxX, 1200), height: Math.max(maxY, 720) }
  }, [tables])

  const handleAutoLayout = () => {
    setTables((prev) =>
      prev.map((t) => {
        const snap = SNAP_POSITIONS[t.id]
        return snap ? { ...t, x: snap.x, y: snap.y } : t
      }),
    )
  }

  const sql = useMemo(() => generateSql(tables), [tables])

  const handleTableMouseDown = useCallback(
    (e: React.MouseEvent, table: TableNode) => {
      setActiveTableId(table.id)
      if (activeTool !== "move") return
      e.preventDefault()
      dragRef.current = {
        id: table.id,
        startX: e.clientX,
        startY: e.clientY,
        tableX: table.x,
        tableY: table.y,
      }
      const onMove = (ev: MouseEvent) => {
        if (!dragRef.current) return
        const scale = zoom / 100
        const dx = (ev.clientX - dragRef.current.startX) / scale
        const dy = (ev.clientY - dragRef.current.startY) / scale
        setTables((prev) =>
          prev.map((t) =>
            t.id === dragRef.current!.id
              ? {
                  ...t,
                  x: Math.max(0, dragRef.current!.tableX + dx),
                  y: Math.max(0, dragRef.current!.tableY + dy),
                }
              : t,
          ),
        )
      }
      const onUp = () => {
        dragRef.current = null
        window.removeEventListener("mousemove", onMove)
        window.removeEventListener("mouseup", onUp)
      }
      window.addEventListener("mousemove", onMove)
      window.addEventListener("mouseup", onUp)
    },
    [activeTool, zoom],
  )

  const handleCopySql = async () => {
    try {
      await navigator.clipboard.writeText(sql)
      setSqlCopied(true)
      window.setTimeout(() => setSqlCopied(false), 1600)
    } catch {
      // clipboard may be unavailable in some contexts
    }
  }

  const handleAddTable = () => {
    const trimmed = newName.trim()
    const trimmedEn = newEn.trim()
    if (!trimmed || !trimmedEn) return
    const id = trimmedEn.toLowerCase().replace(/[^a-z0-9_]+/g, "_")
    if (tables.some((t) => t.id === id)) return
    const newTable: TableNode = {
      id,
      label: trimmed,
      en: trimmedEn,
      x: 80,
      y: canvasSize.height - 220,
      color: newColor,
      fields: [
        { name: "id", type: "uuid", pk: true },
        { name: "name", type: "string", required: true },
        { name: "created_at", type: "datetime" },
      ],
    }
    setTables((prev) => [...prev, newTable])
    setNewName("")
    setNewEn("")
    setNewColor("chart-5")
    setAddOpen(false)
  }

  return (
    <div className="flex flex-col h-full">
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
          <h2 className="text-base font-semibold">스키마 설계</h2>
          <span className="text-xs text-muted-foreground">
            테이블과 관계를 시각적으로 설계하세요
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-secondary rounded-md p-0.5 border border-border/60">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === "select" ? "default" : "ghost"}
                  size="icon-sm"
                  aria-label="선택"
                  onClick={() => setActiveTool("select")}
                  className="h-7 w-7"
                >
                  <MousePointer2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                선택 도구 - 노드 클릭하여 선택
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === "move" ? "default" : "ghost"}
                  size="icon-sm"
                  aria-label="이동"
                  onClick={() => setActiveTool("move")}
                  className="h-7 w-7"
                >
                  <Move className="w-3.5 h-3.5" strokeWidth={1.5} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                이동 도구 - 드래그하여 노드 위치 이동
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === "connect" ? "default" : "ghost"}
                  size="icon-sm"
                  aria-label="연결"
                  onClick={() => setActiveTool("connect")}
                  className="h-7 w-7"
                >
                  <Link2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={8}>
                연결 도구 - 테이블 간 관계 생성
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="w-px h-5 bg-border/60" />

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="축소"
              onClick={() => setZoom(Math.max(ZOOM_MIN, zoom - ZOOM_STEP))}
              disabled={zoom <= ZOOM_MIN}
              className="h-7 w-7 hover:bg-foreground/5"
            >
              <ZoomOut className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Button>
            <span className="text-xs w-10 text-center tabular-nums text-muted-foreground">
              {zoom}%
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="확대"
              onClick={() => setZoom(Math.min(ZOOM_MAX, zoom + ZOOM_STEP))}
              disabled={zoom >= ZOOM_MAX}
              className="h-7 w-7 hover:bg-foreground/5"
            >
              <ZoomIn className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="100% 복원"
              onClick={() => setZoom(100)}
              className="h-7 w-7 hover:bg-foreground/5"
            >
              <Maximize2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </Button>
          </div>

          <div className="w-px h-5 bg-border/60" />

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-sm border-border/60"
            onClick={() => setSqlOpen(true)}
          >
            <FileCode className="w-3.5 h-3.5" strokeWidth={1.5} />
            SQL 생성
          </Button>
          <Button size="sm" className="gap-1.5 h-8 text-sm" onClick={() => setAddOpen(true)}>
            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
            테이블 추가
          </Button>
        </div>
      </div>

      {/* Lens + Layout */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/60 bg-surface">
        <Tabs value={lens} onValueChange={(v) => setLens(v as Lens)}>
          <TabsList className="h-8">
            <TabsTrigger value="schema" className="gap-1.5 text-xs h-7 px-3">
              <Network className="w-3.5 h-3.5" strokeWidth={1.5} />
              스키마
            </TabsTrigger>
            <TabsTrigger value="fields" className="gap-1.5 text-xs h-7 px-3">
              <Columns3 className="w-3.5 h-3.5" strokeWidth={1.5} />
              필드
            </TabsTrigger>
            <TabsTrigger value="relations" className="gap-1.5 text-xs h-7 px-3">
              <Link2 className="w-3.5 h-3.5" strokeWidth={1.5} />
              관계
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground tabular-nums">
            {tables.length} 테이블 · {relations.length} 관계
          </span>
          {lens === "schema" && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 h-7 text-xs border-border/60"
              onClick={handleAutoLayout}
            >
              <AlignStartVertical className="w-3.5 h-3.5" strokeWidth={1.5} />
              정렬
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {lens === "schema" && (
        <SchemaLens
          tables={tables}
          relations={relations}
          zoom={zoom}
          activeTableId={activeTableId}
          activeTool={activeTool}
          canvasSize={canvasSize}
          onTableMouseDown={handleTableMouseDown}
        />
      )}
      {lens === "fields" && (
        <FieldsLens
          tables={tables}
          activeTableId={activeTableId}
          onSelect={setActiveTableId}
        />
      )}
      {lens === "relations" && (
        <RelationsLens tables={tables} relations={relations} />
      )}

      {/* SQL Dialog */}
      <Dialog open={sqlOpen} onOpenChange={setSqlOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-base">CREATE TABLE 문</DialogTitle>
            <DialogDescription className="text-xs">
              현재 스키마 기준 PostgreSQL 16 호환 SQL입니다.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-md border border-border/60 bg-muted/30 max-h-96 overflow-auto">
            <pre className="p-4 text-xs font-mono text-foreground whitespace-pre">
              {sql}
            </pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSqlOpen(false)} className="border-border/60">
              닫기
            </Button>
            <Button onClick={handleCopySql} className="gap-1.5">
              <ClipboardCopy className="w-3.5 h-3.5" strokeWidth={1.5} />
              {sqlCopied ? "복사됨" : "클립보드에 복사"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Table Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-base">새 테이블 추가</DialogTitle>
            <DialogDescription className="text-xs">
              이름과 색상을 지정하면 id (UUID, PK), name, created_at 필드가 함께 생성됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name" className="text-xs">한글 라벨</Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="예: 첨부파일"
                className="border-border/60"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-en" className="text-xs">영문 단수형</Label>
              <Input
                id="new-en"
                value={newEn}
                onChange={(e) => setNewEn(e.target.value)}
                placeholder="예: Attachment"
                className="border-border/60"
              />
              {newEn && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  → {newEn.toLowerCase()}s
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-xs">색상</Label>
              <div className="flex items-center gap-2">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    aria-pressed={newColor === c}
                    onClick={() => setNewColor(c)}
                    className={cn(
                      "w-7 h-7 rounded-md border transition-all",
                      colorBgClass(c),
                      newColor === c
                        ? "border-foreground scale-110"
                        : "border-transparent hover:scale-105",
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} className="border-border/60">
              취소
            </Button>
            <Button
              onClick={handleAddTable}
              disabled={!newName.trim() || !newEn.trim()}
            >
              생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

interface SchemaLensProps {
  tables: TableNode[]
  relations: Relation[]
  zoom: number
  activeTableId: string | null
  activeTool: Tool
  canvasSize: { width: number; height: number }
  onTableMouseDown: (e: React.MouseEvent, t: TableNode) => void
}

function SchemaLens({
  tables,
  relations,
  zoom,
  activeTableId,
  activeTool,
  canvasSize,
  onTableMouseDown,
}: SchemaLensProps) {
  const tableMap = useMemo(() => {
    const m = new Map<string, TableNode>()
    tables.forEach((t) => m.set(t.id, t))
    return m
  }, [tables])

  const paths = useMemo(() => {
    return relations
      .map((rel) => {
        const from = tableMap.get(rel.from)
        const to = tableMap.get(rel.to)
        if (!from || !to) return null
        const result = bezierBetween(from, to, cardHeight(from), cardHeight(to))
        return { rel, ...result }
      })
      .filter(
        (x): x is { rel: Relation; d: string; mid: { x: number; y: number } } =>
          x !== null,
      )
  }, [relations, tableMap])

  const dragHint =
    activeTool === "move" ? "드래그하여 위치 이동" : null

  return (
    <div className="flex-1 bg-muted/20 overflow-auto relative">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, var(--border) 1px, transparent 1px), linear-gradient(to bottom, var(--border) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          opacity: 0.4,
        }}
      />
      <div
        className="relative"
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          transform: `scale(${zoom / 100})`,
          transformOrigin: "top left",
        }}
      >
        <svg
          className="absolute inset-0 pointer-events-none"
          width={canvasSize.width}
          height={canvasSize.height}
          viewBox={`0 0 ${canvasSize.width} ${canvasSize.height}`}
        >
          {paths.map(({ rel, d }) => (
            <path
              key={rel.id}
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth={1}
              className="text-muted-foreground/50"
            />
          ))}
        </svg>

        {paths.map(({ rel, mid }) => (
          <div
            key={`${rel.id}-label`}
            className="absolute pointer-events-none"
            style={{
              left: mid.x,
              top: mid.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <Badge
              variant="outline"
              className="bg-background text-[10px] shadow-sm border-border/60"
            >
              {rel.cardinality}
            </Badge>
          </div>
        ))}

        {tables.map((table) => (
          <Card
            key={table.id}
            className={cn(
              "absolute py-0 gap-0 shadow-sm hover:shadow-md transition-shadow select-none border-border/60",
              activeTool === "move" ? "cursor-move" : "cursor-pointer",
              activeTableId === table.id && "ring-2 ring-primary",
            )}
            style={{ left: table.x, top: table.y, width: CARD_WIDTH }}
            onMouseDown={(e) => onTableMouseDown(e, table)}
          >
            <div
              className={cn(
                "px-3 py-2 rounded-t-md text-primary-foreground flex items-center justify-between",
                colorBgClass(table.color),
              )}
            >
              <span className="font-medium text-sm">{table.label}</span>
              <span className="text-[10px] opacity-80 font-mono">
                {table.en.toLowerCase()}s
              </span>
            </div>
            <div className="p-1.5">
              {table.fields.map((field) => (
                <div
                  key={field.name}
                  className="flex items-center justify-between px-2 py-1 text-sm hover:bg-foreground/[0.02] dark:hover:bg-foreground/[0.04] rounded"
                >
                  <span
                    className={cn(
                      "font-mono text-xs",
                      field.pk && "font-medium text-foreground",
                    )}
                  >
                    {field.name}
                    {field.required && !field.pk && (
                      <span className="text-destructive"> *</span>
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded font-mono",
                      fieldKindClass(field),
                    )}
                  >
                    {fieldKindLabel(field)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <Card className="absolute bottom-4 left-4 p-2.5 text-xs shadow-sm z-10 border-border/60">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-chart-1" />
            <span>테이블: {tables.length}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span>관계: {relations.length}</span>
          </div>
          {dragHint && (
            <span className="text-[10px] text-muted-foreground border-l border-border/60 pl-3">
              {dragHint}
            </span>
          )}
        </div>
      </Card>
    </div>
  )
}

interface FieldsLensProps {
  tables: TableNode[]
  activeTableId: string | null
  onSelect: (id: string) => void
}

function FieldsLens({ tables, activeTableId, onSelect }: FieldsLensProps) {
  return (
    <div className="flex-1 overflow-auto p-5 bg-muted/20">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">전체 필드 인벤토리</h3>
        <p className="text-xs text-muted-foreground">
          테이블별 컬럼 목록. 카드를 클릭하면 해당 테이블이 활성화됩니다.
        </p>
      </div>
      <div
        className="grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}
      >
        {tables.map((table) => (
          <Card
            key={table.id}
            className={cn(
              "py-0 gap-0 overflow-hidden cursor-pointer transition-shadow hover:shadow-md border-border/60",
              activeTableId === table.id && "ring-2 ring-primary",
            )}
            onClick={() => onSelect(table.id)}
          >
            <div
              className={cn(
                "px-3 py-2.5 text-primary-foreground flex items-center justify-between",
                colorBgClass(table.color),
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{table.label}</span>
                <span className="text-[10px] opacity-80 font-mono">
                  {table.en.toLowerCase()}
                </span>
              </div>
              <span className="text-[10px] opacity-80 tabular-nums">
                {table.fields.length}
              </span>
            </div>
            <ul>
              {table.fields.map((field) => (
                <li
                  key={field.name}
                  className="flex items-center justify-between px-3 py-1.5 text-sm border-b border-border/40 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-mono",
                        fieldKindClass(field),
                      )}
                    >
                      {fieldKindLabel(field)}
                    </span>
                    <span className="font-mono text-xs">
                      {field.name}
                      {field.required && !field.pk && (
                        <span className="text-destructive"> *</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    {field.ref && (
                      <span className="font-mono">→ {field.ref}</span>
                    )}
                    {field.enum && (
                      <span className="font-mono truncate max-w-28">
                        {field.enum.join(" · ")}
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  )
}

interface RelationsLensProps {
  tables: TableNode[]
  relations: Relation[]
}

function RelationsLens({ tables, relations }: RelationsLensProps) {
  const tableMap = useMemo(() => {
    const m = new Map<string, TableNode>()
    tables.forEach((t) => m.set(t.id, t))
    return m
  }, [tables])

  return (
    <div className="flex-1 overflow-auto p-5 bg-muted/20">
      <div className="mb-4">
        <h3 className="text-sm font-semibold">테이블 간 관계</h3>
        <p className="text-xs text-muted-foreground">
          외래키로 연결된 관계 목록. 카디널리티와 참조 컬럼을 확인하세요.
        </p>
      </div>
      <Card className="py-0 overflow-hidden border-border/60">
        {relations.length === 0 && (
          <div className="text-sm text-muted-foreground py-10 text-center">
            관계가 정의되지 않았습니다.
          </div>
        )}
        {relations.map((rel, idx) => {
          const from = tableMap.get(rel.from)
          const to = tableMap.get(rel.to)
          if (!from || !to) return null
          return (
            <div
              key={rel.id}
              className={cn(
                "flex items-center justify-between gap-4 px-4 py-3",
                idx > 0 && "border-t border-border/40",
              )}
            >
              <div className="flex items-center gap-2.5">
                <Badge
                  variant="outline"
                  className={cn("gap-1.5 border-border/60", colorTextClass(from.color))}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      colorBgClass(from.color),
                    )}
                  />
                  {from.label}
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {from.en.toLowerCase()}
                  </span>
                </Badge>
                <span className="text-muted-foreground text-xs">→</span>
                <Badge
                  variant="outline"
                  className={cn("gap-1.5 border-border/60", colorTextClass(to.color))}
                >
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      colorBgClass(to.color),
                    )}
                  />
                  {to.label}
                  <span className="text-muted-foreground font-mono text-[10px]">
                    {to.en.toLowerCase()}
                  </span>
                </Badge>
              </div>
              <div className="flex items-center gap-2.5 text-xs">
                <Badge variant="secondary" className="text-[10px]">{rel.cardinality}</Badge>
                <span className="font-mono text-[10px] text-muted-foreground">
                  {rel.label}
                </span>
              </div>
            </div>
          )
        })}
      </Card>
    </div>
  )
}
