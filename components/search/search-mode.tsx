// FlowBase V2 — Search 모드 (액티비티 바 Search 풀페이지)
// 출처: design-ref/prototype/search-palette.jsx SearchPage
//
// 큰 input + 탭(All/Tables/Rows/Library/Wiki) + 평탄 리스트.
// ⌘K 모달과 동일 인덱스/필터 사용 — lib/search-index.ts.

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Search as SearchIcon, X } from "lucide-react"
import { EmptyState } from "@/components/board/empty-state"
import {
  HighlightMatch,
  KindBadge,
  useNavigateSearchItem,
} from "@/components/search/search-helpers"
import { useFlowBase } from "@/lib/flowbase-store"
import {
  buildSearchIndex,
  countByKind,
  filterSearch,
  type SearchKind,
} from "@/lib/search-index"
import { cn } from "@/lib/utils"

const PAGE_LIMIT = 200

type TabId = "all" | SearchKind

const TABS: { id: TabId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "table", label: "Tables" },
  { id: "row", label: "Rows" },
  { id: "library", label: "Library" },
  { id: "wiki", label: "Wiki" },
]

export function SearchMode() {
  const boards = useFlowBase((s) => s.boards)
  const library = useFlowBase((s) => s.library)
  const wikiPages = useFlowBase((s) => s.wikiPages)
  const navigate = useNavigateSearchItem()

  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<TabId>("all")
  const inputRef = useRef<HTMLInputElement>(null)

  // 모드 진입 시 input 포커스
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const index = useMemo(
    () => buildSearchIndex(boards, library, wikiPages),
    [boards, library, wikiPages],
  )

  const counts = useMemo(() => countByKind(index), [index])
  const totalCount = index.length

  const results = useMemo(
    () =>
      filterSearch(
        index,
        query,
        PAGE_LIMIT,
        tab === "all" ? undefined : tab,
      ),
    [index, query, tab],
  )

  return (
    <main className="flex min-w-0 flex-1 flex-col bg-background">
      {/* Header — input + tabs */}
      <div className="shrink-0 border-b border-border-subtle px-7 pb-3 pt-5">
        <div className="flex items-center gap-2.5 rounded-md border border-border bg-card px-3.5 py-2.5">
          <SearchIcon
            className="size-4 shrink-0 text-muted-foreground"
            strokeWidth={1.75}
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across the entire workspace…"
            className="flex-1 bg-transparent text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("")
                inputRef.current?.focus()
              }}
              className="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
              aria-label="Clear"
            >
              <X className="size-3" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          {TABS.map((t) => {
            const on = tab === t.id
            const cnt =
              t.id === "all" ? totalCount : counts[t.id as SearchKind]
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                data-search-tab={t.id}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12.5px] transition-colors",
                  on
                    ? "border border-transparent bg-foreground/[0.08] font-semibold text-foreground"
                    : "border border-border-subtle text-muted-foreground hover:border-border hover:text-foreground",
                )}
              >
                <span>{t.label}</span>
                <span className="text-[10.5px] tabular-nums opacity-70">
                  {cnt}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Results — flat list (no grouping in page mode) */}
      <div className="flex-1 overflow-y-auto px-7 pb-12 pt-4">
        {results.length === 0 ? (
          <EmptyState
            Icon={SearchIcon}
            title={
              query ? `No results for "${query}"` : "Search the workspace"
            }
            description={
              query
                ? "Try a different query, or pick a different category above."
                : "Start typing to search across tables, rows, Library, and Wiki."
            }
            className="mt-12"
          />
        ) : (
          <ul className="max-w-[820px] space-y-0.5">
            {results.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  data-search-item-id={item.id}
                  onClick={() => navigate(item)}
                  className="flex w-full items-center gap-3 rounded-md px-3.5 py-2.5 text-left transition-colors hover:bg-foreground/[0.04]"
                >
                  <KindBadge kind={item.kind} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-medium text-foreground">
                      <HighlightMatch text={item.title} query={query} />
                    </div>
                    <div className="truncate text-[11.5px] text-muted-foreground">
                      {item.subtitle}
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    →
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
