// FlowBase V2 — Search 팔레트 (⌘K 모달)
// 출처: design-ref/prototype/search-palette.jsx SearchPalette
//
// store.searchOpen으로 visibility 제어. 항상 마운트되어 ⌘K 입력 즉시 반응.
// 인덱스/필터는 lib/search-index.ts.

"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Search, X } from "lucide-react"
import {
  HighlightMatch,
  KIND_LABEL,
  KindBadge,
  useNavigateSearchItem,
} from "@/components/search/search-helpers"
import { Kbd } from "@/components/ui/kbd"
import { useFlowBase } from "@/lib/flowbase-store"
import {
  buildSearchIndex,
  filterSearch,
  type SearchItem,
  type SearchKind,
} from "@/lib/search-index"
import { cn } from "@/lib/utils"

const RESULT_LIMIT = 30

const KIND_ORDER: SearchKind[] = ["table", "library", "wiki", "row"]

export function SearchPalette() {
  const open = useFlowBase((s) => s.searchOpen)
  const setSearchOpen = useFlowBase((s) => s.setSearchOpen)
  const boards = useFlowBase((s) => s.boards)
  const library = useFlowBase((s) => s.library)
  const wikiPages = useFlowBase((s) => s.wikiPages)

  const [query, setQuery] = useState("")
  const [selectedIdx, setSelectedIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const close = useCallback(() => setSearchOpen(false), [setSearchOpen])
  const navigate = useNavigateSearchItem()

  // 모달 열릴 때 query 리셋 + input 포커스
  useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedIdx(0)
      // requestAnimationFrame: portal/렌더 후 input이 DOM에 있도록
      const id = requestAnimationFrame(() => inputRef.current?.focus())
      return () => cancelAnimationFrame(id)
    }
    return undefined
  }, [open])

  // 인덱스 — 모달 열린 동안만 (close 시엔 미사용이므로 메모 안 함)
  const index = useMemo(() => {
    if (!open) return []
    return buildSearchIndex(boards, library, wikiPages)
  }, [open, boards, library, wikiPages])

  const results = useMemo(
    () => filterSearch(index, query, RESULT_LIMIT),
    [index, query],
  )

  // query 바뀌면 첫 항목으로 리셋
  useEffect(() => {
    setSelectedIdx(0)
  }, [query])

  // 그룹화 — KIND_ORDER 따라 순서 유지하고 빈 그룹은 제외
  const groups = useMemo(() => {
    const buckets: Record<SearchKind, SearchItem[]> = {
      table: [],
      row: [],
      library: [],
      wiki: [],
    }
    for (const r of results) buckets[r.kind].push(r)
    return KIND_ORDER.map((k) => ({ kind: k, items: buckets[k] })).filter(
      (g) => g.items.length > 0,
    )
  }, [results])

  // 결과 평면 순서(↑↓ 인덱스 매핑) — 그룹 순서대로 재배열
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups])

  // 키보드 네비 — ↑/↓/Enter/Esc
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        close()
        return
      }
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIdx((i) => Math.min(i + 1, Math.max(flat.length - 1, 0)))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIdx((i) => Math.max(i - 1, 0))
        return
      }
      if (e.key === "Enter") {
        const item = flat[selectedIdx]
        if (item) {
          e.preventDefault()
          navigate(item, close)
        }
      }
    }
    window.addEventListener("keydown", onKey, true)
    return () => window.removeEventListener("keydown", onKey, true)
  }, [open, flat, selectedIdx, close, navigate])

  if (!open) return null

  let runningIdx = 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/60 pt-[12vh] backdrop-blur-sm"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-[min(640px,92vw)] max-h-[70vh] flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-2xl"
      >
        {/* Input */}
        <div className="flex items-center gap-2.5 border-b border-border-subtle px-4 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tables, rows, Library, Wiki…"
            className="flex-1 bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted-foreground"
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
          <Kbd className="text-[10px]">esc</Kbd>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-1.5">
          {flat.length === 0 ? (
            <div className="px-6 py-10 text-center text-[12.5px] text-muted-foreground">
              {query
                ? `No results for "${query}"`
                : "Start typing to search…"}
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.kind} className="mb-1.5 last:mb-0">
                <div className="px-2.5 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {KIND_LABEL[g.kind]} · {g.items.length}
                </div>
                {g.items.map((item) => {
                  const myIdx = runningIdx++
                  const isSelected = myIdx === selectedIdx
                  return (
                    <button
                      key={item.id}
                      type="button"
                      data-search-item-id={item.id}
                      onClick={() => navigate(item, close)}
                      onMouseEnter={() => setSelectedIdx(myIdx)}
                      className={cn(
                        "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
                        isSelected
                          ? "bg-foreground/[0.06]"
                          : "hover:bg-foreground/[0.04]",
                      )}
                    >
                      <KindBadge kind={item.kind} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-foreground">
                          <HighlightMatch text={item.title} query={query} />
                        </div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {item.subtitle}
                        </div>
                      </div>
                      {isSelected && (
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          ↵
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 border-t border-border-subtle px-3.5 py-2 text-[10.5px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Kbd className="text-[10px]">↑↓</Kbd>
            navigate
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd className="text-[10px]">↵</Kbd>
            open
          </span>
          <span className="inline-flex items-center gap-1">
            <Kbd className="text-[10px]">esc</Kbd>
            close
          </span>
          <div className="flex-1" />
          <span className="tabular-nums">
            {flat.length} result{flat.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  )
}
