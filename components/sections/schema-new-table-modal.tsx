// FlowBase V2 — "New table" 모달 (Schema ER 우상단 + 버튼)
// 출처: design-ref/prototype/schema-er.jsx NewTableModal
//
// Library Template 카드 그리드 + Blank table. 이름 입력 → createBoard.
// Template은 fields/extraFields 둘 다 → ColumnDef[]로 변환.

"use client"

import { useEffect, useState } from "react"
import { Box, Check, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type {
  ColumnDef,
  LibraryField,
  LibraryTemplate,
} from "@/types/flowbase"

type Selection = { kind: "template"; id: string } | { kind: "blank" } | null

const FALLBACK_COLUMNS: ColumnDef[] = [
  { name: "id", label: "ID", type: "text", width: 86, mono: true },
  { name: "title", label: "Title", type: "text", width: 240 },
  { name: "status", label: "Status", type: "status", width: 116 },
]

function fieldToColumn(f: LibraryField, idx: number): ColumnDef {
  return {
    name: f.name.toLowerCase().replace(/[^a-z0-9_]+/g, "_") || `col_${idx}`,
    label: f.name,
    type: f.type,
    width: 140,
    options: f.config.options?.map((o) => o.label),
  }
}

function templateToColumns(
  tpl: LibraryTemplate,
  libraryFields: LibraryField[],
): ColumnDef[] {
  if (tpl.multiTable && tpl.tables && tpl.tables.length > 0) {
    // 멀티 테이블: 첫 테이블의 컬럼만 (단일 보드 생성 컨텍스트)
    return tpl.tables[0].columns
  }
  const cols: ColumnDef[] = [
    { name: "id", label: "ID", type: "text", width: 86, mono: true },
  ]
  const resolvedFields = (tpl.fields || [])
    .map((fid) => libraryFields.find((f) => f.id === fid))
    .filter((f): f is LibraryField => f !== undefined)
  resolvedFields.forEach((f, i) => cols.push(fieldToColumn(f, i)))
  if (tpl.extraFields) {
    tpl.extraFields.forEach((ef, i) =>
      cols.push({
        name: ef.name.toLowerCase().replace(/[^a-z0-9_]+/g, "_") || `extra_${i}`,
        label: ef.name,
        type: ef.type,
        width: 140,
      }),
    )
  }
  return cols
}

export function NewTableModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  const library = useFlowBase((s) => s.library)
  const createBoard = useFlowBase((s) => s.createBoard)
  const switchBoard = useFlowBase((s) => s.switchBoard)
  const setActivityMode = useFlowBase((s) => s.setActivityMode)

  const [selected, setSelected] = useState<Selection>(null)
  const [name, setName] = useState("")

  useEffect(() => {
    if (open) {
      setSelected(null)
      setName("")
    }
  }, [open])

  // 템플릿 선택 시 이름 자동 suggest
  useEffect(() => {
    if (selected?.kind === "template" && !name.trim()) {
      const tpl = library.templates.find((t) => t.id === selected.id)
      if (tpl) setName(tpl.name)
    }
  }, [selected, name, library.templates])

  const canCreate = selected !== null && name.trim().length > 0

  const create = () => {
    if (!canCreate || selected === null) return
    let columns: ColumnDef[] = FALLBACK_COLUMNS
    if (selected.kind === "template") {
      const tpl = library.templates.find((t) => t.id === selected.id)
      if (tpl) columns = templateToColumns(tpl, library.fields)
    }
    const id = createBoard(name.trim(), columns, [])
    switchBoard(id)
    setActivityMode("tables")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-4rem)] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border-subtle px-5 py-3.5">
          <DialogTitle className="text-[14px]">Create a new table</DialogTitle>
          <DialogDescription className="text-[12px]">
            Pick a Library template or start blank.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5">
          {library.templates.length > 0 && (
            <>
              <div className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                From Library template
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5">
                {library.templates.map((tpl) => {
                  const on =
                    selected?.kind === "template" && selected.id === tpl.id
                  const isMulti = !!tpl.multiTable && (tpl.tables?.length ?? 0) > 0
                  const fieldsCount = isMulti
                    ? (tpl.tables?.reduce(
                        (n, t) => n + t.columns.length,
                        0,
                      ) ?? 0)
                    : (tpl.fields?.length ?? 0) +
                      (tpl.extraFields?.length ?? 0)
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() =>
                        setSelected({ kind: "template", id: tpl.id })
                      }
                      data-new-table-template={tpl.id}
                      className={cn(
                        "flex flex-col gap-1.5 rounded-lg border p-3 text-left transition-colors",
                        on
                          ? "border-primary bg-primary/[0.06]"
                          : "border-border-subtle bg-card hover:border-border",
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-6 shrink-0 items-center justify-center rounded bg-chart-4/15 text-chart-4">
                          <Box className="size-3" strokeWidth={1.75} />
                        </span>
                        <span className="flex-1 truncate text-[13px] font-semibold">
                          {tpl.name}
                        </span>
                        {on && (
                          <Check
                            className="size-3 shrink-0 text-primary"
                            strokeWidth={3}
                          />
                        )}
                      </div>
                      {tpl.desc && (
                        <div className="line-clamp-2 text-[11.5px] leading-relaxed text-muted-foreground">
                          {tpl.desc}
                        </div>
                      )}
                      <div className="mt-0.5 flex flex-wrap gap-1">
                        {isMulti && (
                          <span className="rounded bg-primary/15 px-1.5 py-0 text-[10px] font-semibold text-primary">
                            {tpl.tables?.length ?? 0} tables (first used)
                          </span>
                        )}
                        <span className="rounded bg-muted px-1.5 py-0 text-[10px] text-muted-foreground">
                          {fieldsCount} fields
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </>
          )}

          <div className="mb-2.5 mt-5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
            Or start from scratch
          </div>
          <button
            type="button"
            onClick={() => setSelected({ kind: "blank" })}
            data-new-table-template="blank"
            className={cn(
              "flex w-full items-center gap-3 rounded-lg border px-3.5 py-3 text-left transition-colors",
              selected?.kind === "blank"
                ? "border-primary bg-primary/[0.06]"
                : "border-border-subtle bg-card hover:border-border",
            )}
          >
            <span className="inline-flex size-7 shrink-0 items-center justify-center rounded bg-muted text-muted-foreground">
              <Plus className="size-3.5" strokeWidth={2} />
            </span>
            <div className="flex-1">
              <div className="text-[13px] font-semibold">Blank table</div>
              <div className="text-[11.5px] text-muted-foreground">
                Add columns later from the sheet header.
              </div>
            </div>
            {selected?.kind === "blank" && (
              <Check className="size-3.5 text-primary" strokeWidth={3} />
            )}
          </button>
        </div>

        <DialogFooter className="flex-row items-center gap-2 border-t border-border-subtle px-5 py-3">
          <div className="flex-1 space-y-0">
            <Label htmlFor="new-table-name" className="sr-only">
              Table name
            </Label>
            <Input
              id="new-table-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && canCreate) create()
              }}
              placeholder="Table name (e.g. CS Returns)"
              data-new-table-name
            />
          </div>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canCreate}
            onClick={create}
            className="gap-1.5"
            data-new-table-create
          >
            <Plus className="size-3" strokeWidth={2} />
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
