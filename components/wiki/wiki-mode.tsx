// FlowBase V2 — Wiki 모드 (액티비티 바 Wiki)
//
// [Wiki 사이드바 | 페이지 상세]
// 선택된 페이지가 존재하면 본문, 없으면 안내.

"use client"

import { WikiPageView } from "@/components/wiki/wiki-page"
import { WikiSidebar } from "@/components/wiki/wiki-sidebar"
import { useFlowBase } from "@/lib/flowbase-store"

export function WikiMode() {
  const pages = useFlowBase((s) => s.wikiPages)
  const selectedId = useFlowBase((s) => s.wikiSelectedId)

  const page =
    pages.find((p) => p.id === selectedId) ?? pages[0] ?? undefined

  return (
    <>
      <WikiSidebar />
      {page ? (
        <WikiPageView page={page} />
      ) : (
        <div className="flex min-w-0 flex-1 items-center justify-center bg-background text-[13px] text-muted-foreground">
          Select a page on the left or create a new one.
        </div>
      )}
    </>
  )
}
