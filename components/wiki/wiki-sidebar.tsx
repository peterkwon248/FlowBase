// FlowBase V2 — Wiki 사이드바 (카테고리 트리 + 페이지 리스트)
// 출처: design-ref/prototype/wiki-view.jsx WikiSidebar
// 패턴: components/library/library-sidebar.tsx와 동일 구조.

"use client"

import { useMemo, useState } from "react"
import { BookText, ChevronDown, FileText, Plus, Search, X } from "lucide-react"
import { useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type { WikiPage } from "@/types/flowbase"

function groupByCategory(pages: WikiPage[]): Record<string, WikiPage[]> {
  const out: Record<string, WikiPage[]> = {}
  for (const p of pages) {
    const cat = p.category || "Uncategorized"
    if (!out[cat]) out[cat] = []
    out[cat].push(p)
  }
  return out
}

function filterPages(pages: WikiPage[], query: string): WikiPage[] {
  const q = query.trim().toLowerCase()
  if (!q) return pages
  return pages.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      p.body.toLowerCase().includes(q),
  )
}

export function WikiSidebar() {
  const pages = useFlowBase((s) => s.wikiPages)
  const selectedId = useFlowBase((s) => s.wikiSelectedId)
  const setWikiPage = useFlowBase((s) => s.setWikiPage)
  const addWikiPage = useFlowBase((s) => s.addWikiPage)

  const [query, setQuery] = useState("")
  const filtered = useMemo(() => filterPages(pages, query), [pages, query])
  const grouped = useMemo(() => groupByCategory(filtered), [filtered])
  const categories = useMemo(() => Object.keys(grouped).sort(), [grouped])

  // 모든 카테고리 기본 펼침
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const toggle = (cat: string) =>
    setCollapsed((c) => ({ ...c, [cat]: !c[cat] }))

  return (
    <aside className="flex w-[260px] shrink-0 flex-col border-r border-border-subtle bg-surface text-[13px]">
      {/* 헤더 */}
      <div className="flex items-center gap-2 border-b border-border-subtle px-3 py-2.5">
        <span className="flex size-5 items-center justify-center rounded bg-chart-3/15 text-chart-3">
          <BookText className="size-3" strokeWidth={1.75} />
        </span>
        <span className="flex-1 text-[13px] font-semibold">Wiki</span>
        <button
          type="button"
          title="New page"
          onClick={() => addWikiPage()}
          data-wiki-new-page
          className="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-foreground/[0.06] hover:text-foreground"
        >
          <Plus className="size-3" strokeWidth={2} />
        </button>
      </div>

      {/* 검색 — 활성 (title/category/body 매치) */}
      <div className="px-2.5 pb-1 pt-2.5">
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-md border bg-muted px-2 py-1 transition-colors",
            query ? "border-border" : "border-border-subtle",
          )}
        >
          <Search className="size-3 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages…"
            data-wiki-sidebar-search
            className="w-full bg-transparent text-[12px] outline-none placeholder:text-muted-foreground"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="flex size-3 items-center justify-center rounded text-muted-foreground hover:text-foreground"
              title="Clear"
            >
              <X className="size-2.5" strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* 카테고리 트리 */}
      <div className="flex-1 overflow-y-auto px-1.5 pb-3 pt-2">
        {categories.length === 0 && (
          <div className="px-3 py-6 text-center text-[11.5px] text-muted-foreground">
            {query ? `No pages matching "${query}"` : "No pages yet."}
          </div>
        )}
        {categories.map((cat) => {
          const isCollapsed = !!collapsed[cat]
          const items = grouped[cat]
          return (
            <div key={cat} className="mb-0.5">
              <button
                type="button"
                onClick={() => toggle(cat)}
                className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground hover:bg-foreground/[0.04]"
              >
                <ChevronDown
                  className={cn(
                    "size-3 shrink-0 transition-transform",
                    isCollapsed && "-rotate-90",
                  )}
                  strokeWidth={2.5}
                />
                <span className="flex-1">{cat}</span>
                <span className="text-[10.5px] font-normal tabular-nums text-muted-foreground/70">
                  {items.length}
                </span>
              </button>
              {!isCollapsed &&
                items.map((p) => {
                  const active = p.id === selectedId
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setWikiPage(p.id)}
                      data-page-id={p.id}
                      className={cn(
                        "relative flex w-full items-center gap-1.5 rounded-md py-1.5 pl-7 pr-2 text-left text-[12.5px] transition-colors",
                        active
                          ? "bg-foreground/[0.06] font-medium text-foreground"
                          : "text-muted-foreground hover:bg-foreground/[0.04]",
                      )}
                    >
                      {active && (
                        <span className="absolute inset-y-1 left-2 w-0.5 rounded bg-primary" />
                      )}
                      <FileText
                        className={cn(
                          "size-3 shrink-0",
                          p.verified
                            ? "text-success-fg"
                            : "text-muted-foreground",
                        )}
                        strokeWidth={1.75}
                      />
                      <span className="flex-1 truncate">{p.title}</span>
                      {!p.verified && (
                        <span
                          title="Unverified"
                          className="rounded bg-destructive/15 px-1 py-0 text-[9px] font-semibold text-destructive"
                        >
                          DRAFT
                        </span>
                      )}
                    </button>
                  )
                })}
            </div>
          )
        })}
      </div>

      {/* 푸터 힌트 */}
      <div className="border-t border-border-subtle px-3.5 py-2.5 text-[11px] leading-relaxed text-muted-foreground">
        Verified knowledge,
        <br />
        owners guarantee.
      </div>
    </aside>
  )
}
