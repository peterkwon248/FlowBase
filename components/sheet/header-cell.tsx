// FlowBase V2 — 시트 헤더 셀 (타입 아이콘 + 라벨 + AI 배지 + 정렬)
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §6
// 출처: design-ref/prototype/{sheet.jsx FieldTypeGlyph, prototype.jsx InteractiveSheet thead}

"use client"

import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  AtSign,
  Calendar,
  CircleDot,
  Hash,
  Link2,
  List,
  MousePointerClick,
  SmilePlus,
  Sparkles,
  Type,
  User,
} from "lucide-react"
import type { ColumnDef, ColumnType, SortDir } from "@/types/flowbase"
import { cn } from "@/lib/utils"

// 컬럼 타입 아이콘 맵 — Import 위저드(import-step-review)에서도 재사용
export const TYPE_ICON: Record<ColumnType, typeof Type> = {
  text: Type,
  num: Hash,
  date: Calendar,
  email: AtSign,
  select: List,
  status: CircleDot,
  avatar: User,
  reaction: SmilePlus,
  button: MousePointerClick,
  fk: Link2,
}

interface HeaderCellProps {
  col: ColumnDef
  // 이 컬럼이 현재 정렬 키이면 방향, 아니면 null
  sortDir: SortDir | null
  onSort: () => void
}

export function HeaderCell({ col, sortDir, onSort }: HeaderCellProps) {
  const Icon = TYPE_ICON[col.type] ?? Type
  const sorted = sortDir !== null

  return (
    <button
      type="button"
      onClick={onSort}
      className="flex w-full items-center gap-1.5 text-left"
    >
      <Icon className="size-3.5 text-muted-foreground" strokeWidth={1.5} />
      <span
        className={cn(
          "text-xs font-medium",
          sorted ? "text-foreground" : "text-muted-foreground",
        )}
      >
        {col.label?.trim() || col.name}
      </span>
      {col.ai && (
        <span className="inline-flex items-center gap-0.5 rounded bg-primary/15 px-1 py-px text-[10px] font-semibold text-primary">
          <Sparkles className="size-2" />
          AI
        </span>
      )}
      <span className="flex-1" />
      {sortDir === "asc" ? (
        <ArrowUp className="size-3 text-primary" />
      ) : sortDir === "desc" ? (
        <ArrowDown className="size-3 text-primary" />
      ) : (
        <ArrowUpDown className="size-3 text-muted-foreground/50" />
      )}
    </button>
  )
}
