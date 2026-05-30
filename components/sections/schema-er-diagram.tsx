// FlowBase V2 — Schema ER 다이어그램 (positioned cards + bezier edges + pan/zoom/drag)
// 출처: design-ref/prototype/schema-er.jsx ERDiagram
//
// auto-layout(3-col grid) 기본 위치. 사용자가 카드 헤더 드래그하면
// store.schemaPositions에 저장 → persisted. 캔버스 빈 곳 드래그=pan,
// wheel+ctrl=zoom (cursor anchor). 우상단 zoom controls + reset.

"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { KeyRound, Minus, Plus, RotateCcw, Search, Sparkles, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TYPE_ICON } from "@/components/sheet/header-cell"
import { selectIsViewer, useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type { Board } from "@/types/flowbase"
import { NewTableModal } from "./schema-new-table-modal"

const CARD_WIDTH = 240
const HEADER_H = 34
const ROW_H = 26
const CARD_PAD_BOTTOM = 8
const COL_GAP = 80
const ROW_GAP = 60
const COLS = 3
const VIEWPORT_PAD = 32
const ZOOM_MIN = 0.4
const ZOOM_MAX = 2

interface LayoutRect {
  id: string
  x: number
  y: number
  w: number
  h: number
  board: Board
}

interface Edge {
  fromId: string
  toId: string
  via: string
  cardinality: string
}

function cardHeight(b: Board): number {
  return HEADER_H + b.columns.length * ROW_H + CARD_PAD_BOTTOM
}

function autoLayout(boards: Board[]): Record<string, { x: number; y: number }> {
  const out: Record<string, { x: number; y: number }> = {}
  const rows: Board[][] = []
  for (let i = 0; i < boards.length; i += COLS) {
    rows.push(boards.slice(i, i + COLS))
  }
  let yCursor = VIEWPORT_PAD
  for (const row of rows) {
    let xCursor = VIEWPORT_PAD
    const rowH = Math.max(...row.map(cardHeight))
    for (const b of row) {
      out[b.id] = { x: xCursor, y: yCursor }
      xCursor += CARD_WIDTH + COL_GAP
    }
    yCursor += rowH + ROW_GAP
  }
  return out
}

function buildLayout(
  boards: Board[],
  positions: Record<string, { x: number; y: number }>,
): LayoutRect[] {
  const auto = autoLayout(boards)
  return boards.map((b) => {
    const pos = positions[b.id] ?? auto[b.id] ?? { x: 0, y: 0 }
    return {
      id: b.id,
      x: pos.x,
      y: pos.y,
      w: CARD_WIDTH,
      h: cardHeight(b),
      board: b,
    }
  })
}

interface Side {
  x: number
  y: number
}

function edgeEndpoints(a: LayoutRect, b: LayoutRect): [Side, Side] {
  const ax = a.x + a.w / 2
  const ay = a.y + a.h / 2
  const bx = b.x + b.w / 2
  const by = b.y + b.h / 2
  const dx = bx - ax
  const dy = by - ay
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx > 0) {
      return [
        { x: a.x + a.w, y: a.y + a.h / 2 },
        { x: b.x, y: b.y + b.h / 2 },
      ]
    }
    return [
      { x: a.x, y: a.y + a.h / 2 },
      { x: b.x + b.w, y: b.y + b.h / 2 },
    ]
  }
  if (dy > 0) {
    return [
      { x: a.x + a.w / 2, y: a.y + a.h },
      { x: b.x + b.w / 2, y: b.y },
    ]
  }
  return [
    { x: a.x + a.w / 2, y: a.y },
    { x: b.x + b.w / 2, y: b.y + b.h },
  ]
}

function bezierPath(p1: Side, p2: Side): string {
  const dx = Math.abs(p2.x - p1.x)
  const k = Math.max(40, dx / 2)
  const c1x = p1.x + (p2.x > p1.x ? k : -k)
  const c2x = p2.x + (p2.x > p1.x ? -k : k)
  return `M${p1.x},${p1.y} C${c1x},${p1.y} ${c2x},${p2.y} ${p2.x},${p2.y}`
}

function deriveEdges(boards: Board[]): Edge[] {
  const out: Edge[] = []
  for (const b of boards) {
    for (const c of b.columns) {
      if (c.type === "fk" && c.fk && c.fk !== b.id) {
        out.push({
          fromId: c.fk,
          toId: b.id,
          via: c.name,
          cardinality: "1:N",
        })
      }
    }
  }
  return out
}

export function SchemaERDiagram() {
  const boards = useFlowBase((s) => s.boards)
  const boardList = useMemo(() => Object.values(boards), [boards])
  const schemaPositions = useFlowBase((s) => s.schemaPositions)
  const setSchemaPosition = useFlowBase((s) => s.setSchemaPosition)
  const resetSchemaPositions = useFlowBase((s) => s.resetSchemaPositions)
  const switchBoard = useFlowBase((s) => s.switchBoard)
  const setActivityMode = useFlowBase((s) => s.setActivityMode)
  const isViewer = useFlowBase(selectIsViewer)
  const viewerTitle = isViewer ? "Viewers can't edit schema" : undefined

  const layout = useMemo(
    () => buildLayout(boardList, schemaPositions),
    [boardList, schemaPositions],
  )
  const edges = useMemo(() => deriveEdges(boardList), [boardList])

  const [hovered, setHovered] = useState<string | null>(null)
  const [focusedId, setFocusedId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [newTableOpen, setNewTableOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // 검색 하이라이트 = hover 우선, 없으면 focus된 테이블 (검색 후 포커스 유지).
  const highlightId = hovered ?? focusedId

  const results = useMemo(() => {
    const qq = query.trim().toLowerCase()
    if (!qq) return []
    return boardList
      .filter(
        (b) =>
          b.label.toLowerCase().includes(qq) ||
          b.id.toLowerCase().includes(qq),
      )
      .slice(0, 8)
  }, [query, boardList])

  // 드래그 상태: 캔버스 pan vs 카드 drag.
  const dragRef = useRef<
    | { kind: "pan"; startX: number; startY: number; startPan: { x: number; y: number } }
    | {
        kind: "card"
        id: string
        startX: number
        startY: number
        startCard: { x: number; y: number }
      }
    | null
  >(null)

  // 드래그 시작(pointerdown)에서 카드(노드 이동+선택) vs 빈 캔버스(pan)를 구분만 하고,
  // 실제 추적은 window의 pointermove/up 리스너가 담당(아래 useEffect).
  // ⚠ setPointerCapture ❌ — 카드 클릭 시 setSelectedId 리렌더가 lostpointercapture를
  // 발화시켜 드래그가 즉시 끊기던 결함(실 마우스에서만 재현)을 회피. window 리스너는
  // 리렌더·캡처 상실에 영향 없음 + 커서가 캔버스를 벗어나도 계속 추적(캔버스 표준 패턴).
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const target = e.target as HTMLElement
      if (target.closest("[data-er-toolbar]")) return // 툴바/검색은 자체 처리
      if (e.button !== 0) return // 주 버튼만
      const cardEl = target.closest("[data-er-card]") as HTMLElement | null
      if (cardEl) {
        const id = cardEl.getAttribute("data-er-card") ?? ""
        setSelectedId(id)
        setFocusedId(null) // 수동 선택이 검색 포커스 대체
        if (isViewer) return // viewer는 선택만, 이동 ❌
        const cur = layout.find((r) => r.id === id)
        if (!cur) return
        dragRef.current = {
          kind: "card",
          id,
          startX: e.clientX,
          startY: e.clientY,
          startCard: { x: cur.x, y: cur.y },
        }
      } else {
        // 빈 캔버스 = 선택·포커스 해제 + pan
        setSelectedId(null)
        setFocusedId(null)
        dragRef.current = {
          kind: "pan",
          startX: e.clientX,
          startY: e.clientY,
          startPan: pan,
        }
      }
    },
    [layout, isViewer, pan],
  )

  // 더블클릭 = 그 테이블을 Workspace(데이터)에서 열기.
  const openBoard = useCallback(
    (boardId: string) => {
      switchBoard(boardId)
      setActivityMode("tables")
      toast.success(`Opened ${boards[boardId]?.label ?? boardId}`, {
        id: "schema-open",
      })
    },
    [boards, switchBoard, setActivityMode],
  )

  // window 레벨 pointermove/up — dragRef가 활성일 때만 동작. zoom은 ref로 읽어
  // (리스너 재등록 없이 항상 최신 zoom 사용). mount 시 1회 등록.
  const zoomRef = useRef(zoom)
  zoomRef.current = zoom
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current
      if (!d) return
      e.preventDefault()
      if (d.kind === "pan") {
        setPan({
          x: d.startPan.x + (e.clientX - d.startX),
          y: d.startPan.y + (e.clientY - d.startY),
        })
      } else {
        const z = zoomRef.current
        const dx = (e.clientX - d.startX) / z // zoom 보정 (inverse-scale)
        const dy = (e.clientY - d.startY) / z
        setSchemaPosition(d.id, {
          x: Math.max(0, d.startCard.x + dx),
          y: Math.max(0, d.startCard.y + dy),
        })
      }
    }
    const onUp = () => {
      dragRef.current = null
    }
    window.addEventListener("pointermove", onMove, { passive: false })
    window.addEventListener("pointerup", onUp)
    window.addEventListener("pointercancel", onUp)
    return () => {
      window.removeEventListener("pointermove", onMove)
      window.removeEventListener("pointerup", onUp)
      window.removeEventListener("pointercancel", onUp)
    }
  }, [setSchemaPosition])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      // 트랙패드 pinch는 자동으로 ctrlKey true (브라우저 표준). ⌘/Ctrl + wheel도 동일.
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      // delta 비례 + cap — pinch(작은 delta)는 부드럽게, wheel(큰 delta)은 한 번에 너무 멀리 안 가게.
      const raw = -e.deltaY * 0.01
      const delta = Math.max(-0.3, Math.min(0.3, raw))
      setZoom((z) =>
        Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, +(z + delta).toFixed(2))),
      )
    },
    [],
  )

  const canvasW = useMemo(() => {
    if (layout.length === 0) return 600
    return Math.max(...layout.map((r) => r.x + r.w)) + VIEWPORT_PAD
  }, [layout])
  const canvasH = useMemo(() => {
    if (layout.length === 0) return 400
    return Math.max(...layout.map((r) => r.y + r.h)) + VIEWPORT_PAD
  }, [layout])

  // 검색 → 해당 테이블을 뷰포트 중앙으로 이동 + 하이라이트.
  const focusBoard = useCallback(
    (id: string) => {
      const rect = layout.find((r) => r.id === id)
      const el = containerRef.current
      if (!rect || !el) return
      const z = Math.max(zoom, 1) // 읽기 좋은 줌(≥100%) 보장
      const cx = rect.x + rect.w / 2
      const cy = rect.y + rect.h / 2
      setZoom(z)
      setPan({
        x: el.clientWidth / 2 - cx * z,
        y: el.clientHeight / 2 - cy * z,
      })
      setFocusedId(id)
      setQuery("")
    },
    [layout, zoom],
  )

  return (
    <>
      <div
        ref={containerRef}
        className="relative flex min-h-0 flex-1 cursor-grab touch-none select-none overflow-hidden bg-background active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onWheel={handleWheel}
      >
        {/* Grid bg (pan offset 반영) */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle, var(--border-subtle) 0.7px, transparent 0.7px)",
            backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
        />

        {/* Diagram inner — pan + zoom transform */}
        <div
          className="relative shrink-0"
          style={{
            width: canvasW,
            height: canvasH,
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Edges */}
          <svg
            className="pointer-events-none absolute inset-0"
            width={canvasW}
            height={canvasH}
            style={{ overflow: "visible" }}
          >
            {edges.map((e, i) => {
              const a = layout.find((r) => r.id === e.fromId)
              const b = layout.find((r) => r.id === e.toId)
              if (!a || !b) return null
              const [p1, p2] = edgeEndpoints(a, b)
              const path = bezierPath(p1, p2)
              const midX = (p1.x + p2.x) / 2
              const midY = (p1.y + p2.y) / 2
              const isActive =
                highlightId !== null &&
                (highlightId === a.id || highlightId === b.id)
              const stroke = isActive ? "var(--primary)" : "var(--border)"
              return (
                <g
                  key={i}
                  opacity={highlightId && !isActive ? 0.3 : 1}
                  style={{ transition: "opacity 160ms ease" }}
                >
                  <path
                    d={path}
                    fill="none"
                    stroke={stroke}
                    strokeWidth={isActive ? 1.75 : 1.25}
                  />
                  <circle cx={p1.x} cy={p1.y} r={3} fill={stroke} />
                  <circle cx={p2.x} cy={p2.y} r={3} fill={stroke} />
                  <g transform={`translate(${midX - 16} ${midY - 9})`}>
                    <rect
                      width="32"
                      height="18"
                      rx="4"
                      fill="var(--card)"
                      stroke={stroke}
                      strokeWidth="1"
                    />
                    <text
                      x="16"
                      y="13"
                      fontSize="10"
                      fontWeight="600"
                      fill={
                        isActive ? "var(--primary)" : "var(--muted-foreground)"
                      }
                      textAnchor="middle"
                      style={{ fontFamily: "var(--font-mono)" }}
                    >
                      {e.cardinality}
                    </text>
                  </g>
                </g>
              )
            })}
          </svg>

          {/* Cards */}
          {layout.map((r) => (
            <TableCard
              key={r.id}
              rect={r}
              active={highlightId === r.id}
              selected={selectedId === r.id}
              onHover={setHovered}
              onOpen={() => openBoard(r.id)}
            />
          ))}
        </div>

        {/* Empty state */}
        {boardList.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-[13px] text-muted-foreground">
            No boards yet.
          </div>
        )}

        {/* Search — top left (find & focus a table) */}
        {boardList.length > 0 && (
          <div
            className="absolute left-4 top-3 z-20 w-60"
            data-er-toolbar
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.75}
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && results[0]) focusBoard(results[0].id)
                  if (e.key === "Escape") {
                    setQuery("")
                    setFocusedId(null)
                  }
                }}
                placeholder="Find a table…"
                data-er-search
                className="h-8 bg-card pl-7 pr-7 text-[12px] shadow-sm"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  title="Clear search"
                  className="absolute right-1.5 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
                >
                  <X className="size-3" strokeWidth={2} />
                </button>
              )}
            </div>
            {query.trim() && (
              <div className="mt-1 overflow-hidden rounded-md border border-border bg-card shadow-md">
                {results.length === 0 ? (
                  <div className="px-3 py-2 text-[12px] text-muted-foreground">
                    No tables match.
                  </div>
                ) : (
                  results.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => focusBoard(b.id)}
                      data-er-search-result={b.id}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px] transition-colors hover:bg-foreground/[0.05]"
                    >
                      <span
                        className="size-2 shrink-0 rounded-full"
                        style={{ background: b.colorVar ?? "var(--chart-1)" }}
                      />
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {b.label}
                      </span>
                      <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground">
                        {b.id}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* Toolbar — top right */}
        <div
          className="absolute right-4 top-3 flex items-center gap-2"
          data-er-toolbar
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="inline-flex items-center gap-1 rounded-md border border-border bg-card p-1 shadow-sm">
            <ZoomBtn
              title="Zoom out"
              onClick={() =>
                setZoom((z) => Math.max(ZOOM_MIN, +(z - 0.1).toFixed(2)))
              }
            >
              <Minus className="size-3" strokeWidth={2} />
            </ZoomBtn>
            <span className="min-w-[40px] text-center text-[11px] tabular-nums text-muted-foreground">
              {Math.round(zoom * 100)}%
            </span>
            <ZoomBtn
              title="Zoom in"
              onClick={() =>
                setZoom((z) => Math.min(ZOOM_MAX, +(z + 0.1).toFixed(2)))
              }
            >
              <Plus className="size-3" strokeWidth={2} />
            </ZoomBtn>
            <span className="mx-1 h-4 w-px bg-border" />
            <ZoomBtn
              title={
                isViewer
                  ? "Viewers can reset zoom only (positions stay)"
                  : "Reset view + positions"
              }
              onClick={() => {
                setZoom(1)
                setPan({ x: 0, y: 0 })
                // viewer는 schema position 변경 ❌ — zoom/pan만 reset.
                if (!isViewer) resetSchemaPositions()
              }}
            >
              <RotateCcw className="size-3" strokeWidth={2} />
            </ZoomBtn>
          </div>
          <Button
            size="sm"
            onClick={() => setNewTableOpen(true)}
            disabled={isViewer}
            title={viewerTitle}
            className="h-8 gap-1.5 px-2.5 text-[12px]"
            data-action="schema-new-table"
          >
            <Plus className="size-3" strokeWidth={2} />
            New table
          </Button>
        </div>

        {/* Bottom meta */}
        <div className="pointer-events-none absolute bottom-3 left-4 inline-flex items-center gap-3.5 rounded-md border border-border bg-card/90 px-2.5 py-1 text-[11.5px] text-muted-foreground backdrop-blur-sm">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-chart-1" />
            Tables: <b className="font-semibold tabular-nums text-foreground">{boardList.length}</b>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-chart-4" />
            Relations: <b className="font-semibold tabular-nums text-foreground">{edges.length}</b>
          </span>
          <span className="opacity-60">·</span>
          <span>Drag a table to move · double-click to open · ⌘+wheel to zoom</span>
        </div>
      </div>

      <NewTableModal open={newTableOpen} onOpenChange={setNewTableOpen} />
    </>
  )
}

function TableCard({
  rect,
  active,
  selected,
  onHover,
  onOpen,
}: {
  rect: LayoutRect
  active: boolean
  selected: boolean
  onHover: (id: string | null) => void
  onOpen: () => void
}) {
  const { board } = rect
  const color = board.colorVar ?? "var(--chart-1)"
  const accentBg = `color-mix(in oklch, ${color} 18%, var(--background))`

  // pointerdown/이동/선택은 컨테이너(캔버스)가 일괄 처리 (setPointerCapture 위해).
  // 카드는 hover·더블클릭(open)만. ⚠ 위치(left/top) transition 금지 — 드래그 시 커서 추적 lag.
  return (
    <div
      data-er-card={board.id}
      data-er-card-selected={selected ? board.id : undefined}
      onDoubleClick={onOpen}
      onMouseEnter={() => onHover(board.id)}
      onMouseLeave={() => onHover(null)}
      title="Drag to move · double-click to open"
      className={cn(
        "absolute flex flex-col cursor-grab overflow-hidden rounded-lg border bg-card transition-[border-color,box-shadow] active:cursor-grabbing",
        selected
          ? "border-primary shadow-lg ring-2 ring-primary z-10"
          : active
            ? "border-primary/70 shadow-lg ring-2 ring-primary/40 z-10"
            : "border-border-subtle shadow-sm",
      )}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
      }}
    >
      <div
        className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-3"
        style={{
          height: HEADER_H,
          background: accentBg,
          color,
        }}
      >
        <span className="text-[13px] font-bold">{board.label}</span>
        <div className="flex-1" />
        <span className="font-mono text-[10.5px] opacity-70">{board.id}</span>
      </div>

      <div className="flex flex-1 flex-col pb-1">
        {board.columns.map((c) => {
          const isPk = c.name === "id"
          const isFk = c.type === "fk"
          const Icon = TYPE_ICON[c.type]
          return (
            <div
              key={c.name}
              className="flex items-center gap-2 px-3 text-[12px]"
              style={{ height: ROW_H }}
            >
              {isPk ? (
                <KeyRound
                  className="size-3 shrink-0 text-amber-500"
                  strokeWidth={2}
                />
              ) : (
                <Icon
                  className="size-3 shrink-0 text-muted-foreground"
                  strokeWidth={1.75}
                />
              )}
              <span
                className={cn(
                  "min-w-0 flex-1 truncate font-mono",
                  isPk ? "font-semibold" : "font-medium",
                )}
              >
                {c.name}
              </span>
              {c.ai && (
                <span className="inline-flex items-center gap-0.5 rounded bg-primary/15 px-1 py-0 text-[9px] font-bold text-primary">
                  <Sparkles className="size-2" />
                  AI
                </span>
              )}
              <TypeChip
                label={isPk ? "PK" : isFk ? "FK" : c.type}
                tone={isPk ? "amber" : isFk ? "violet" : "neutral"}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TypeChip({
  label,
  tone,
}: {
  label: string
  tone: "amber" | "violet" | "neutral"
}) {
  const cls =
    tone === "amber"
      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
      : tone === "violet"
        ? "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400"
        : "bg-muted text-muted-foreground"
  return (
    <span
      className={cn(
        "rounded px-1 py-0 font-mono text-[9.5px] font-semibold lowercase tracking-[0.02em]",
        cls,
      )}
    >
      {label}
    </span>
  )
}

function ZoomBtn({
  title,
  onClick,
  children,
}: {
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
    >
      {children}
    </button>
  )
}
