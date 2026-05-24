// FlowBase V2 — 컬럼 헤더 "..." 메뉴 (Rename · Delete)
// 출처: design-ref/prototype/add-column.jsx ColumnHeaderMenu
//
// id 컬럼은 메뉴 ❌ (보호). 다른 모든 컬럼은 트리거 노출.
// Rename은 prompt() — 빠른 구현; 풀 인라인 편집은 향후.

"use client"

import { useState } from "react"
import {
  Check,
  Link2,
  List,
  MoreHorizontal,
  Pencil,
  Sigma,
  Sparkles,
  Trash2,
  Type,
} from "lucide-react"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { TYPE_ICON } from "@/components/sheet/header-cell"
import { useFlowBase } from "@/lib/flowbase-store"
import type { ColumnDef, ColumnType } from "@/types/flowbase"

const CHANGEABLE_TYPES: { type: ColumnType; label: string }[] = [
  { type: "text", label: "Text" },
  { type: "num", label: "Number" },
  { type: "date", label: "Date" },
  { type: "email", label: "Email" },
  { type: "select", label: "Select" },
  { type: "status", label: "Status" },
  { type: "avatar", label: "Person" },
]

export function ColumnHeaderMenu({ col }: { col: ColumnDef }) {
  const renameColumn = useFlowBase((s) => s.renameColumn)
  const deleteColumn = useFlowBase((s) => s.deleteColumn)
  const updateColumn = useFlowBase((s) => s.updateColumn)
  const promoteColumn = useFlowBase((s) => s.promoteColumnToLibraryField)
  const attachFunction = useFlowBase((s) => s.attachFunctionToColumn)
  const library = useFlowBase((s) => s.library)

  const [renameOpen, setRenameOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [draftLabel, setDraftLabel] = useState(col.label || col.name)

  if (col.name === "id") return null

  const openRename = () => {
    setDraftLabel(col.label || col.name)
    setRenameOpen(true)
  }

  const submitRename = () => {
    const newLabel = draftLabel.trim()
    if (!newLabel) {
      setRenameOpen(false)
      return
    }
    // 라벨만 변경 — key는 보존 (행 데이터 안 깨짐)
    renameColumn(col.name, col.name, newLabel)
    setRenameOpen(false)
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            title="Column options"
            onClick={(e) => e.stopPropagation()}
            className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/60 transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
            data-column-menu={col.name}
          >
            <MoreHorizontal className="size-3.5" strokeWidth={2} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={openRename} className="gap-2">
            <Pencil className="size-3.5 text-muted-foreground" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <Type className="size-3.5 text-muted-foreground" />
              <span>Change type</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              className="w-40"
              data-column-change-type={col.name}
            >
              {CHANGEABLE_TYPES.map(({ type, label }) => {
                const Icon = TYPE_ICON[type]
                const on = col.type === type
                return (
                  <DropdownMenuItem
                    key={type}
                    onSelect={() => {
                      if (!on) updateColumn(col.name, { type })
                    }}
                    className="gap-2"
                    data-column-type-option={type}
                  >
                    <Icon
                      className="size-3.5 text-muted-foreground"
                      strokeWidth={1.75}
                    />
                    <span className="flex-1">{label}</span>
                    {on && (
                      <Check
                        className="size-3 text-primary"
                        strokeWidth={3}
                      />
                    )}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          {/* A3-1: Library OptionList을 select/status 컬럼에 적용 (개별 적용 UI). */}
          {/* 깊은 link(optionListId 참조)는 후속 — 현재는 col.options 덮어쓰기. */}
          {(col.type === "select" || col.type === "status") && (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="gap-2">
                <List
                  className="size-3.5 text-muted-foreground"
                  strokeWidth={1.75}
                />
                <span>Apply OptionList</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent
                className="w-56"
                data-column-apply-optionlist={col.name}
              >
                {library.optionLists.length === 0 ? (
                  <div className="px-2 py-1.5 text-[12px] text-muted-foreground">
                    No OptionLists in Library yet.
                  </div>
                ) : (
                  library.optionLists.map((list) => {
                    const values = list.options.map((o) => o.label)
                    return (
                      <DropdownMenuItem
                        key={list.id}
                        onSelect={() => {
                          updateColumn(col.name, { options: values })
                          toast.success(
                            `Applied "${list.name}" to ${col.label || col.name}`,
                            {
                              description: `${values.length} options replaced. ⌘Z to undo.`,
                            },
                          )
                        }}
                        className="gap-2"
                        data-apply-optionlist-option={list.id}
                      >
                        <span className="flex shrink-0 items-center gap-0.5">
                          {/* 처음 3 옵션의 color dot — 시각 식별 */}
                          {list.options.slice(0, 3).map((o, i) => (
                            <span
                              key={i}
                              aria-hidden
                              className="size-1.5 rounded-full"
                              style={{ background: o.color }}
                            />
                          ))}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[12.5px]">
                            {list.name}
                          </div>
                          <div className="truncate text-[10.5px] text-muted-foreground">
                            {list.options.length} options
                          </div>
                        </div>
                      </DropdownMenuItem>
                    )
                  })
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => {
              const id = promoteColumn(col.name)
              if (id) {
                toast.success(
                  col.libraryFieldId
                    ? `Already linked to Library Field`
                    : `Promoted "${col.label || col.name}" to Library`,
                  {
                    description: `Available across boards as a reusable Field.`,
                  },
                )
              }
            }}
            className="gap-2"
            data-column-promote={col.name}
          >
            <Sparkles className="size-3.5 text-primary" strokeWidth={1.75} />
            <span>
              {col.libraryFieldId ? "Linked to Library" : "Promote to Library"}
            </span>
            {col.libraryFieldId && (
              <Check className="ml-auto size-3 text-primary" strokeWidth={3} />
            )}
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <Sigma
                className="size-3.5 text-muted-foreground"
                strokeWidth={1.75}
              />
              <span>Attach function</span>
              {col.functionId && (
                <Link2
                  className="ml-auto size-3 text-primary"
                  strokeWidth={2}
                />
              )}
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent
              className="w-52"
              data-column-attach-function={col.name}
            >
              <DropdownMenuItem
                onSelect={() => {
                  attachFunction(col.name, null)
                  toast.info(`Detached function from "${col.label || col.name}"`)
                }}
                className="gap-2"
              >
                <span className="flex size-3.5 items-center justify-center">
                  {!col.functionId && (
                    <Check
                      className="size-3 text-primary"
                      strokeWidth={3}
                    />
                  )}
                </span>
                <span className="text-muted-foreground">None</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {library.functions.map((fn) => {
                const on = col.functionId === fn.id
                return (
                  <DropdownMenuItem
                    key={fn.id}
                    onSelect={() => {
                      attachFunction(col.name, fn.id)
                      toast.success(
                        `Attached ${fn.name} to "${col.label || col.name}"`,
                        { description: fn.desc },
                      )
                    }}
                    className="gap-2"
                    data-attach-function-option={fn.id}
                  >
                    <span className="flex size-3.5 items-center justify-center">
                      {on && (
                        <Check
                          className="size-3 text-primary"
                          strokeWidth={3}
                        />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-mono text-[11.5px]">
                        {fn.name}
                      </div>
                      <div className="truncate text-[10.5px] text-muted-foreground">
                        {fn.label}
                      </div>
                    </div>
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setConfirmDelete(true)}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="size-3.5" />
            Delete column
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename column</DialogTitle>
            <DialogDescription className="text-[12px]">
              Changes the display label. The underlying field key stays as{" "}
              <code className="rounded bg-muted px-1 font-mono text-[11px]">
                {col.name}
              </code>{" "}
              to keep your row data intact.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="col-label" className="text-[12px]">
              Label
            </Label>
            <Input
              id="col-label"
              autoFocus
              value={draftLabel}
              onChange={(e) => setDraftLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename()
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete column &ldquo;{col.label || col.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              All cell values in this column will be removed. This cannot be
              undone with ⌘Z (column changes aren&apos;t tracked yet).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteColumn(col.name)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
