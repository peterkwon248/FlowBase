// FlowBase V2 — "+" 컬럼 추가 드롭다운 (헤더 마지막 셀)
// 출처: design-ref/prototype/add-column.jsx AddColumnButton
//
// Basic types 7종 + Library Field 6개(@Model · @Handling 등) 선택.
// addColumn 호출 후 기본값으로 행 빈 셀 자동 렌더.

"use client"

import {
  AtSign,
  Calculator,
  Calendar,
  CircleDot,
  Hash,
  Link2,
  List,
  Plus,
  Sparkles,
  Tags,
  Type,
  User,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { selectIsViewer, useFlowBase } from "@/lib/flowbase-store"
import type { ColumnDef, ColumnType } from "@/types/flowbase"
import { cn } from "@/lib/utils"

const BASIC_TYPES: {
  type: ColumnType
  label: string
  Icon: typeof Type
  defaultLabel: string
  defaults?: Partial<ColumnDef>
}[] = [
  { type: "text", label: "Text", Icon: Type, defaultLabel: "Text" },
  { type: "num", label: "Number", Icon: Hash, defaultLabel: "Number" },
  { type: "date", label: "Date", Icon: Calendar, defaultLabel: "Date" },
  { type: "email", label: "Email", Icon: AtSign, defaultLabel: "Email" },
  {
    type: "select",
    label: "Select",
    Icon: List,
    defaultLabel: "Select",
    defaults: { options: ["Option 1", "Option 2"] },
  },
  {
    type: "multiSelect",
    label: "Multi-select",
    Icon: Tags,
    defaultLabel: "Tags",
    defaults: { options: ["Tag 1", "Tag 2"] },
  },
  {
    type: "status",
    label: "Status",
    Icon: CircleDot,
    defaultLabel: "Status",
  },
  { type: "avatar", label: "Person", Icon: User, defaultLabel: "Person" },
  {
    type: "formula",
    label: "Formula",
    Icon: Calculator,
    defaultLabel: "Formula",
    defaults: { formula: "", formulaResultType: "text" },
  },
]

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40) || "col"
}

export function AddColumnMenu() {
  const library = useFlowBase((s) => s.library)
  const addColumn = useFlowBase((s) => s.addColumn)
  const boards = useFlowBase((s) => s.boards)
  const isViewer = useFlowBase(selectIsViewer)
  const boardList = Object.values(boards)

  const handleBasic = (
    type: ColumnType,
    defaultLabel: string,
    extra?: Partial<ColumnDef>,
  ) => {
    const baseName = slugify(defaultLabel)
    addColumn({
      name: baseName,
      label: defaultLabel,
      type,
      width: 140,
      ...extra,
    })
    // Formula 컬럼은 추가 후 즉시 editor 열기 (사용자가 expression 입력 필요).
    if (type === "formula" && typeof window !== "undefined") {
      // store가 이름 충돌 시 자동 증가 — 마지막 추가된 컬럼 찾아서 dispatch.
      requestAnimationFrame(() => {
        try {
          const board =
            useFlowBase.getState().boards[useFlowBase.getState().activeBoardId]
          const last = board?.columns[board.columns.length - 1]
          if (last && last.type === "formula") {
            window.dispatchEvent(
              new CustomEvent("flowbase-edit-formula", {
                detail: { colName: last.name },
              }),
            )
          }
        } catch {
          // silent
        }
      })
    }
  }

  // Relation(FK) — 타겟 보드를 참조하는 컬럼 생성. 값 = 타겟 row id (FkCell이 렌더).
  // 새 컬럼으로만 생성 (기존 컬럼 타입 변경 ❌ — 기존 값이 row id가 아니라 무효).
  const handleFk = (targetBoardId: string) => {
    const target = boards[targetBoardId]
    if (!target) return
    addColumn({
      name: slugify(target.label),
      label: target.label,
      type: "fk",
      fk: targetBoardId,
      width: 160,
    })
  }

  const handleLibField = (fieldId: string) => {
    const f = library.fields.find((x) => x.id === fieldId)
    if (!f) return
    // A3-2: optionListId 우선 해석 (config.options는 인라인 fallback)
    let options: string[] | undefined
    if (f.config.optionListId) {
      const list = library.optionLists.find(
        (l) => l.id === f.config.optionListId,
      )
      options = list?.options.map((o) => o.label)
    } else if (f.config.options) {
      options = f.config.options.map((o) => o.label)
    }
    addColumn({
      name: slugify(f.name),
      label: f.name,
      type: f.type,
      width: 140,
      options,
      libraryFieldId: f.id, // 자동 link (Library에서 가져왔으니 자연 link)
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          title={isViewer ? "Viewers can't add columns" : "Add column"}
          disabled={isViewer}
          className={cn(
            "flex h-full w-full items-center justify-center text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground",
            isViewer && "cursor-not-allowed opacity-50",
          )}
          data-action="add-column"
        >
          <Plus className="size-4" strokeWidth={2} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
          Basic types
        </DropdownMenuLabel>
        {BASIC_TYPES.map(({ type, label, Icon, defaultLabel, defaults }) => (
          <DropdownMenuItem
            key={type}
            onSelect={() => handleBasic(type, defaultLabel, defaults)}
            className="gap-2"
          >
            <Icon
              className="size-3.5 text-muted-foreground"
              strokeWidth={1.75}
            />
            <span>{label}</span>
          </DropdownMenuItem>
        ))}
        {boardList.length > 0 && (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2" data-add-relation>
              <Link2
                className="size-3.5 text-muted-foreground"
                strokeWidth={1.75}
              />
              <span>Relation</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuLabel className="text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
                Link to table
              </DropdownMenuLabel>
              {boardList.map((b) => (
                <DropdownMenuItem
                  key={b.id}
                  onSelect={() => handleFk(b.id)}
                  className="gap-2"
                  data-relation-target={b.id}
                >
                  <span className="font-mono text-[11px] text-muted-foreground">
                    →
                  </span>
                  <span className="truncate">{b.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}
        {library.fields.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="flex items-center gap-1 text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
              <Sparkles className="size-2.5 text-primary" />
              From Library
            </DropdownMenuLabel>
            {library.fields.slice(0, 8).map((f) => (
              <DropdownMenuItem
                key={f.id}
                onSelect={() => handleLibField(f.id)}
                className="gap-2"
              >
                <span className="rounded bg-muted px-1 py-0.5 font-mono text-[9.5px] text-muted-foreground">
                  {f.type}
                </span>
                <span className="truncate">{f.name}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
