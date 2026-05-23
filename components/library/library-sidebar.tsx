// FlowBase V2 — Library 사이드바 (5 카테고리 트리 + 자산 목록)
// 출처: design-ref/prototype/library-view.jsx LibrarySidebar
// 설계: docs/02-design/features/flowbase-v2-library.design.md §3

"use client"

import { useState } from "react"
import {
  BarChart3,
  Box,
  ChevronDown,
  Library as LibraryIcon,
  List,
  type LucideIcon,
  Search,
  Sigma,
  Type,
} from "lucide-react"
import { LIBRARY_CATEGORIES } from "@/lib/flowbase-library-seed"
import { useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type { Library, LibraryCategoryId } from "@/types/flowbase"

const CATEGORY_ICON: Record<LibraryCategoryId, LucideIcon> = {
  optionLists: List,
  fields: Type,
  templates: Box,
  functions: Sigma,
  dashboards: BarChart3,
}

const CATEGORY_COLOR: Record<LibraryCategoryId, string> = {
  optionLists: "text-chart-1",
  fields: "text-chart-3",
  templates: "text-chart-4",
  functions: "text-chart-2",
  dashboards: "text-chart-5",
}

function getAssets(
  library: Library,
  id: LibraryCategoryId,
): { id: string; name: string }[] {
  switch (id) {
    case "optionLists":
      return library.optionLists
    case "fields":
      return library.fields
    case "templates":
      return library.templates
    case "functions":
      return library.functions
    case "dashboards":
      return library.dashboards
  }
}

export function LibrarySidebar() {
  const library = useFlowBase((s) => s.library)
  const libCategory = useFlowBase((s) => s.libCategory)
  const libAssetId = useFlowBase((s) => s.libAssetId)
  const setLibCategory = useFlowBase((s) => s.setLibCategory)
  const selectAsset = useFlowBase((s) => s.selectAsset)

  // 모든 카테고리 기본 펼침
  const [expanded, setExpanded] = useState<
    Record<LibraryCategoryId, boolean>
  >({
    optionLists: true,
    fields: true,
    templates: true,
    functions: true,
    dashboards: true,
  })

  const toggleExpand = (id: LibraryCategoryId) => {
    setExpanded((e) => ({ ...e, [id]: !e[id] }))
  }

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-border-subtle bg-surface text-[13px]">
      {/* 헤더 */}
      <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2.5">
        <span className="flex size-5 items-center justify-center rounded bg-primary/15 text-primary">
          <LibraryIcon className="size-3" strokeWidth={1.75} />
        </span>
        <span className="text-[13px] font-semibold">Library</span>
      </div>

      {/* 검색 (placeholder — B3에서 활성) */}
      <div className="px-2.5 pb-1 pt-2.5">
        <div className="flex items-center gap-1.5 rounded-md border border-border-subtle bg-muted px-2 py-1 opacity-60">
          <Search className="size-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search library…"
            className="w-full bg-transparent text-[12px] outline-none placeholder:text-muted-foreground"
            disabled
          />
        </div>
      </div>

      {/* 카테고리 트리 */}
      <div className="flex-1 overflow-y-auto px-1.5 pb-3 pt-2">
        {LIBRARY_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICON[cat.id]
          const color = CATEGORY_COLOR[cat.id]
          const assets = getAssets(library, cat.id)
          const isOpen = expanded[cat.id]
          const isActive = !libAssetId && libCategory === cat.id
          return (
            <div key={cat.id} className="mb-0.5">
              <button
                type="button"
                onClick={() => {
                  toggleExpand(cat.id)
                  setLibCategory(cat.id)
                }}
                className={cn(
                  "flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[12.5px] font-semibold transition-colors",
                  isActive
                    ? "bg-foreground/[0.06] text-foreground"
                    : "text-foreground hover:bg-foreground/[0.04]",
                )}
              >
                <ChevronDown
                  className={cn(
                    "size-3 shrink-0 text-muted-foreground transition-transform",
                    !isOpen && "-rotate-90",
                  )}
                  strokeWidth={2.5}
                />
                <Icon
                  className={cn("size-3 shrink-0", color)}
                  strokeWidth={1.75}
                />
                <span className="flex-1">{cat.label}</span>
                <span className="text-[11px] font-normal tabular-nums text-muted-foreground">
                  {assets.length}
                </span>
              </button>
              {isOpen &&
                assets.map((asset) => {
                  const active = asset.id === libAssetId
                  return (
                    <button
                      key={asset.id}
                      type="button"
                      onClick={() => selectAsset(cat.id, asset.id)}
                      data-asset-id={asset.id}
                      className={cn(
                        "flex w-full items-center rounded-md py-1 pl-7 pr-2 text-left text-[12.5px] transition-colors",
                        active
                          ? "bg-foreground/[0.06] font-medium text-foreground"
                          : "text-muted-foreground hover:bg-foreground/[0.04]",
                      )}
                    >
                      <span className="truncate">{asset.name}</span>
                    </button>
                  )
                })}
            </div>
          )
        })}
      </div>

      {/* 푸터 힌트 */}
      <div className="border-t border-border-subtle px-3.5 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        정의는 한 번,
        <br />
        사용은 어디서나.
      </div>
    </aside>
  )
}
