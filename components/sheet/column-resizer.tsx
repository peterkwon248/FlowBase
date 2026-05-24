// FlowBase V2 — 시트 컬럼 리사이저 (drag로 너비 조정 · 더블클릭 auto-fit)
// 출처: Excel/Google Sheets 패턴. 외부 lib ❌ (raw mouse event).
//
// 헤더 셀(`<th>`) 우측 경계 4px 핸들. width 변경은 viewSettings.sheet.columnWidths에 persist (보드 spec ColumnDef 안 건드림).
// auto-fit 측정: 같은 컬럼의 모든 `[data-column]` 자식 element scrollWidth max + padding.

"use client"

import type React from "react"
import { useFlowBase } from "@/lib/flowbase-store"

const MIN_WIDTH = 60
const MAX_WIDTH = 600
const AUTOFIT_PAD = 28 // td padding(20) + 여유

function readCurrentWidths(): Record<string, number> {
  const s = useFlowBase.getState()
  return s.viewSettings[s.activeBoardId]?.sheet?.columnWidths ?? {}
}

function clamp(w: number): number {
  return Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, Math.round(w)))
}

interface ColumnResizerProps {
  colName: string
  tableRef: React.RefObject<HTMLTableElement | null>
}

export function ColumnResizer({ colName, tableRef }: ColumnResizerProps) {
  const setViewOption = useFlowBase((s) => s.setViewOption)

  const startDrag = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const th = (e.currentTarget as HTMLElement).closest(
      "th",
    ) as HTMLTableCellElement | null
    if (!th) return
    const startX = e.clientX
    const startWidth = th.getBoundingClientRect().width
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"

    const onMove = (ev: MouseEvent) => {
      const next = clamp(startWidth + (ev.clientX - startX))
      setViewOption("sheet", {
        columnWidths: { ...readCurrentWidths(), [colName]: next },
      })
    }
    const onUp = () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }

  const autoFit = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const table = tableRef.current
    if (!table) return

    // header + 모든 body cell 측정. data-column이 부여된 td/th의 첫 children scrollWidth max.
    const cells = table.querySelectorAll<HTMLElement>(
      `[data-column="${CSS.escape(colName)}"]`,
    )
    let max = 0
    cells.forEach((cell) => {
      // cell(td/th)의 직접 자식 element들의 scrollWidth max. table-fixed에서도 콘텐츠 실 너비 반영.
      Array.from(cell.children).forEach((child) => {
        if (child instanceof HTMLElement) {
          if (child.scrollWidth > max) max = child.scrollWidth
        }
      })
    })
    const next = clamp(max + AUTOFIT_PAD)
    setViewOption("sheet", {
      columnWidths: { ...readCurrentWidths(), [colName]: next },
    })
  }

  return (
    <div
      onMouseDown={startDrag}
      onDoubleClick={autoFit}
      onClick={(e) => e.stopPropagation()}
      role="separator"
      aria-orientation="vertical"
      aria-label={`Resize ${colName} column (double-click to fit)`}
      title="Drag to resize · Double-click to fit"
      className="absolute right-0 top-0 z-20 h-full w-1.5 cursor-col-resize select-none transition-colors hover:bg-primary/40 active:bg-primary/60"
    />
  )
}
