// FlowBase V2 — Board sidebar (240px 보드 패널)
// 설계: docs/02-design/features/flowbase-v2-phase{5,6}.design.md
// 출처: design-ref/prototype/prototype-shell.jsx InteractiveSidebar
//
// BOARDS 목록 — 전환(switchBoard) + 행 … 메뉴(이름 변경 인라인 / 삭제). Phase 6.
// Trash/Settings/스토리지는 status-bar.tsx (셸 푸터, 항상 표시)로 이동.

"use client"

import { useState } from "react"
import { MoreHorizontal, Plus, Upload } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"

interface BoardSidebarProps {
  onImport: () => void
}

export function BoardSidebar({ onImport }: BoardSidebarProps) {
  const boards = useFlowBase((s) => s.boards)
  const activeBoardId = useFlowBase((s) => s.activeBoardId)
  const switchBoard = useFlowBase((s) => s.switchBoard)
  const createBoard = useFlowBase((s) => s.createBoard)
  const renameBoard = useFlowBase((s) => s.renameBoard)
  const deleteBoard = useFlowBase((s) => s.deleteBoard)
  const settings = useFlowBase((s) => s.settings)

  // 인라인 이름 변경 중인 보드 id (Q1 — 인라인)
  const [editingId, setEditingId] = useState<string | null>(null)

  const boardList = Object.values(boards)

  const handleNewBoard = () => {
    const id = createBoard("New board")
    switchBoard(id)
  }

  const commitRename = (id: string, value: string) => {
    if (value.trim()) renameBoard(id, value)
    setEditingId(null)
  }

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border-subtle bg-surface">
      {/* 워크스페이스 헤더 */}
      <div className="flex items-center gap-2 border-b border-border-subtle px-3.5 py-2.5">
        <span className="flex size-[18px] items-center justify-center rounded bg-primary text-[11px] font-bold text-primary-foreground">
          {settings.workspaceInitial}
        </span>
        <span className="text-[13px] font-semibold">{settings.workspaceLabel}</span>
      </div>

      {/* 액션 */}
      <div className="flex flex-col gap-1 p-2.5">
        <button
          type="button"
          onClick={handleNewBoard}
          className="flex items-center gap-2 rounded-md bg-primary px-2.5 py-1.5 text-[13px] font-medium text-primary-foreground"
        >
          <Plus className="size-3.5" />
          New board
        </button>
        <button
          type="button"
          onClick={onImport}
          className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-[13px] hover:bg-foreground/[0.05]"
        >
          <Upload className="size-3.5" />
          Import data
        </button>
      </div>

      {/* BOARDS 목록 */}
      <div className="px-3.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        Boards
      </div>
      <nav className="flex flex-col gap-0.5 px-2">
        {boardList.map((b) => {
          const active = b.id === activeBoardId
          const editing = editingId === b.id
          return (
            <div
              key={b.id}
              className={cn(
                "group relative flex items-center rounded-md text-[13px]",
                active
                  ? "bg-foreground/[0.06]"
                  : "hover:bg-foreground/[0.04]",
              )}
            >
              {active && (
                <span className="absolute inset-y-1 left-0 w-0.5 rounded-full bg-primary" />
              )}

              {editing ? (
                <input
                  autoFocus
                  defaultValue={b.label}
                  onBlur={(e) => commitRename(b.id, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename(b.id, e.currentTarget.value)
                    else if (e.key === "Escape") setEditingId(null)
                  }}
                  className="m-1 min-w-0 flex-1 rounded border border-input bg-background px-1.5 py-1 text-[13px] outline-none focus:ring-1 focus:ring-ring"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => switchBoard(b.id)}
                  className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left"
                >
                  <span
                    aria-hidden
                    className="size-[7px] shrink-0 rounded-full"
                    style={{ background: b.colorVar ?? "var(--chart-1)" }}
                  />
                  <span
                    className={cn("flex-1 truncate", active && "font-semibold")}
                  >
                    {b.label}
                  </span>
                  <span className="tabular-nums text-[11px] text-muted-foreground group-hover:hidden">
                    {b.rows.length}
                  </span>
                </button>
              )}

              {!editing && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      aria-label={`${b.label} menu`}
                      className="mr-1 hidden size-6 items-center justify-center rounded text-muted-foreground hover:bg-foreground/[0.08] group-hover:flex data-[state=open]:flex"
                    >
                      <MoreHorizontal className="size-3.5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-36">
                    <DropdownMenuItem onSelect={() => setEditingId(b.id)}>
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={boardList.length <= 1}
                      onSelect={() => {
                        if (
                          window.confirm(`Delete board "${b.label}"?`)
                        ) {
                          deleteBoard(b.id)
                        }
                      }}
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          )
        })}
      </nav>

      <div className="flex-1" />
    </aside>
  )
}
