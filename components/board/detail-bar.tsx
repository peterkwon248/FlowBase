// FlowBase V2 — Detail bar (4번째 패널) — 선택/포커스 행 디테일
// 출처: design-ref/prototype/prototype-shell.jsx PanelsMenu(detailBar)
//
// Tables 모드에서 사용 — 활성 보드의 마지막 포커스/선택 행을 컬럼별로 표시.
// 토글: 햄버거 > Detail bar 또는 ⌘I.

"use client"

import { Fragment } from "react"
import { X } from "lucide-react"
import { selectActiveBoard, useFlowBase } from "@/lib/flowbase-store"

function formatValue(v: unknown): string {
  if (v === null || v === undefined || v === "") return "—"
  if (typeof v === "boolean") return v ? "예" : "아니오"
  if (typeof v === "object") {
    try {
      return JSON.stringify(v)
    } catch {
      return "—"
    }
  }
  return String(v)
}

export function DetailBar() {
  const board = useFlowBase(selectActiveBoard)
  const selectedRowIds = useFlowBase((s) => s.selectedRowIds)
  const focusedCell = useFlowBase((s) => s.focusedCell)
  const togglePanel = useFlowBase((s) => s.togglePanel)

  if (!board) return null

  // 우선순위: 포커스된 셀의 행 > 마지막 선택 행
  const targetRowId =
    focusedCell?.row ?? selectedRowIds[selectedRowIds.length - 1] ?? null
  const row = targetRowId
    ? board.rows.find((r) => r.id === targetRowId)
    : null

  return (
    <aside className="flex w-[300px] shrink-0 flex-col border-l border-border-subtle bg-surface">
      {/* 헤더 */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border-subtle px-3.5">
        <span className="text-[13px] font-semibold">Detail</span>
        {selectedRowIds.length > 1 && (
          <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
            {selectedRowIds.length} 선택
          </span>
        )}
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => togglePanel("detailBar")}
          title="닫기 (⌘I)"
          className="flex size-5 items-center justify-center rounded text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      </div>

      {/* 내용 */}
      <div className="flex-1 overflow-y-auto p-3.5">
        {!row ? (
          <div className="rounded-md border border-dashed border-border bg-card p-4 text-center text-[12px] text-muted-foreground">
            행을 선택하거나 셀에 포커스하면 상세가 표시됩니다.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
                {row.id}
              </span>
              {row.themeConfirmed === false && (
                <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  AI theme pending
                </span>
              )}
              {row.sentimentConfirmed === false && (
                <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                  AI sentiment pending
                </span>
              )}
            </div>
            <dl className="grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1.5 text-[12.5px]">
              {board.columns.map((col) => {
                if (col.name === "id") return null
                const v = row[col.name]
                return (
                  <Fragment key={col.name}>
                    <dt className="font-medium text-muted-foreground">
                      {col.label || col.name}
                    </dt>
                    <dd className="min-w-0 break-words">{formatValue(v)}</dd>
                  </Fragment>
                )
              })}
            </dl>
          </div>
        )}
      </div>
    </aside>
  )
}
