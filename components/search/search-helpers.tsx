// FlowBase V2 — Search 공통 유틸 (kind 아이콘/스타일/하이라이트)
// SearchPalette · SearchMode 양쪽에서 재사용.

import type { ReactNode } from "react"
import {
  BookText,
  Database,
  type LucideIcon,
  Rows3,
  Sparkles,
} from "lucide-react"
import { useFlowBase } from "@/lib/flowbase-store"
import type { SearchItem, SearchKind } from "@/lib/search-index"

const KIND_ICON: Record<SearchKind, LucideIcon> = {
  table: Database,
  row: Rows3,
  library: Sparkles,
  wiki: BookText,
}

const KIND_TINT: Record<SearchKind, string> = {
  table: "bg-chart-1/15 text-chart-1",
  row: "bg-muted text-muted-foreground",
  library: "bg-primary/15 text-primary",
  wiki: "bg-chart-3/15 text-chart-3",
}

export function KindBadge({ kind }: { kind: SearchKind }) {
  const Icon = KIND_ICON[kind]
  return (
    <span
      className={`inline-flex size-6 shrink-0 items-center justify-center rounded ${KIND_TINT[kind]}`}
    >
      <Icon className="size-3.5" strokeWidth={1.75} />
    </span>
  )
}

export const KIND_LABEL: Record<SearchKind, string> = {
  table: "Tables",
  row: "Rows",
  library: "Library",
  wiki: "Wiki",
}

// 매치된 substring을 강조. 매치 없으면 원본 텍스트.
export function HighlightMatch({
  text,
  query,
}: {
  text: string
  query: string
}): ReactNode {
  const q = query.trim()
  if (!q) return text
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx < 0) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="rounded-sm bg-primary/25 px-0.5 text-foreground">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  )
}

// SearchItem 페이로드를 받아 zustand 액션 디스패치. 호출 후 onAfter() 옵션 — 모달 닫기 등.
export function useNavigateSearchItem(): (
  item: SearchItem,
  onAfter?: () => void,
) => void {
  const switchBoard = useFlowBase((s) => s.switchBoard)
  const setActivityMode = useFlowBase((s) => s.setActivityMode)
  const setSelected = useFlowBase((s) => s.setSelected)
  const selectAsset = useFlowBase((s) => s.selectAsset)
  const setWikiPage = useFlowBase((s) => s.setWikiPage)
  const togglePanel = useFlowBase((s) => s.togglePanel)

  return (item, onAfter) => {
    const p = item.payload
    if (p.kind === "table") {
      switchBoard(p.boardId)
      setActivityMode("tables")
    } else if (p.kind === "row") {
      switchBoard(p.boardId)
      setActivityMode("tables")
      setSelected([p.rowId])
      // 디테일 바가 닫혀 있으면 열어줘서 행 디테일이 보이도록
      const panels = useFlowBase.getState().panels
      if (!panels.detailBar) togglePanel("detailBar")
    } else if (p.kind === "library") {
      setActivityMode("library")
      selectAsset(p.category, p.assetId)
    } else if (p.kind === "wiki") {
      setActivityMode("wiki")
      setWikiPage(p.pageId)
    }
    onAfter?.()
  }
}
