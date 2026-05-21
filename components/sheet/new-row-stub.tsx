// FlowBase V2 — 시트 하단 "+ New row" 행
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §6
// 출처: design-ref/prototype/prototype.jsx InteractiveSheet (add row hint)

"use client"

import { Plus } from "lucide-react"

interface NewRowStubProps {
  colSpan: number
  onAdd: () => void
}

export function NewRowStub({ colSpan, onAdd }: NewRowStubProps) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        onClick={onAdd}
        className="cursor-pointer px-2.5 py-2 text-muted-foreground hover:bg-foreground/[0.03]"
      >
        <span className="inline-flex items-center gap-1.5 text-[12.5px]">
          <Plus className="size-3" />
          New row
        </span>
      </td>
    </tr>
  )
}
