// FlowBase V2 — Schema ER 다이어그램 (positioned table cards + bezier edges)
// 출처: design-ref/prototype/schema-er.jsx ERDiagram
//
// 자동 레이아웃: 보드 순서대로 3-column grid (240 wide, gap 60). FK 컬럼이 가리키는
// 보드와 bezier curve로 연결, 중간에 cardinality pill.

"use client"

import { useMemo, useState } from "react"
import { KeyRound, Plus, RefreshCw, Sparkles } from "lucide-react"
import { TYPE_ICON } from "@/components/sheet/header-cell"
import { useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type { Board } from "@/types/flowbase"

const CARD_WIDTH = 240
const HEADER_H = 34
const ROW_H = 26
const CARD_PAD_BOTTOM = 8
const COL_GAP = 80
const ROW_GAP = 60
const COLS = 3
const VIEWPORT_PAD = 32

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

function layoutBoards(boards: Board[]): LayoutRect[] {
  const cardHeight = (b: Board) =>
    HEADER_H + b.columns.length * ROW_H + CARD_PAD_BOTTOM

  // row-major auto-layout. y는 같은 row 내 최대 높이로 정렬.
  const rows: Board[][] = []
  for (let i = 0; i < boards.length; i += COLS) {
    rows.push(boards.slice(i, i + COLS))
  }

  const result: LayoutRect[] = []
  let yCursor = VIEWPORT_PAD
  for (const row of rows) {
    let xCursor = VIEWPORT_PAD
    const rowH = Math.max(...row.map(cardHeight))
    for (const b of row) {
      const h = cardHeight(b)
      result.push({
        id: b.id,
        x: xCursor,
        y: yCursor,
        w: CARD_WIDTH,
        h,
        board: b,
      })
      xCursor += CARD_WIDTH + COL_GAP
    }
    yCursor += rowH + ROW_GAP
  }
  return result
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

  const layout = useMemo(() => layoutBoards(boardList), [boardList])
  const edges = useMemo(() => deriveEdges(boardList), [boardList])

  const [hovered, setHovered] = useState<string | null>(null)

  // 캔버스 크기 = 마지막 카드의 우/하단 + padding
  const canvasW = useMemo(() => {
    if (layout.length === 0) return 0
    return Math.max(...layout.map((r) => r.x + r.w)) + VIEWPORT_PAD
  }, [layout])
  const canvasH = useMemo(() => {
    if (layout.length === 0) return 0
    return Math.max(...layout.map((r) => r.y + r.h)) + VIEWPORT_PAD
  }, [layout])

  return (
    <div className="relative flex min-h-0 flex-1 overflow-auto bg-background">
      {/* Grid background — sub pattern */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--border-subtle) 0.7px, transparent 0.7px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div
        className="relative shrink-0"
        style={{ width: canvasW, height: canvasH }}
      >
        {/* Edges — behind cards */}
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
              hovered !== null && (hovered === a.id || hovered === b.id)
            const stroke = isActive ? "var(--primary)" : "var(--border)"
            return (
              <g
                key={i}
                opacity={hovered && !isActive ? 0.3 : 1}
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
                    fill={isActive ? "var(--primary)" : "var(--muted-foreground)"}
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
            hovered={hovered === r.id}
            onHover={setHovered}
          />
        ))}
      </div>

      {/* Empty state */}
      {boardList.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center text-[13px] text-muted-foreground">
          No boards yet.
        </div>
      )}

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
      </div>
    </div>
  )
}

function TableCard({
  rect,
  hovered,
  onHover,
}: {
  rect: LayoutRect
  hovered: boolean
  onHover: (id: string | null) => void
}) {
  const { board } = rect
  const color = board.colorVar ?? "var(--chart-1)"
  const accentBg = `color-mix(in oklch, ${color} 18%, var(--background))`

  return (
    <div
      data-er-card={board.id}
      onMouseEnter={() => onHover(board.id)}
      onMouseLeave={() => onHover(null)}
      className={cn(
        "absolute flex flex-col overflow-hidden rounded-lg border bg-card transition-all",
        hovered
          ? "border-primary/70 shadow-lg z-10"
          : "border-border-subtle shadow-sm",
      )}
      style={{
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
      }}
    >
      {/* Header */}
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
        <span className="font-mono text-[10.5px] opacity-70">
          {board.id}
        </span>
      </div>

      {/* Fields */}
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
                <KeyRound className="size-3 shrink-0 text-amber-500" strokeWidth={2} />
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
