// FlowBase V2 — Library 모드 (액티비티 바 Library)
// 설계: docs/02-design/features/flowbase-v2-library.design.md §3
//
// [Library 사이드바 | 카탈로그 OR 자산 디테일]
// libAssetId가 있고 해당 자산이 실제 존재하면 디테일, 아니면 카탈로그.

"use client"

import { AssetDetail } from "@/components/library/asset-detail"
import { CategoryCatalog } from "@/components/library/category-catalog"
import { LibrarySidebar } from "@/components/library/library-sidebar"
import { useFlowBase } from "@/lib/flowbase-store"
import type { Library, LibraryCategoryId } from "@/types/flowbase"

function assetExists(
  library: Library,
  cat: LibraryCategoryId,
  id: string,
): boolean {
  switch (cat) {
    case "optionLists":
      return library.optionLists.some((a) => a.id === id)
    case "fields":
      return library.fields.some((a) => a.id === id)
    case "templates":
      return library.templates.some((a) => a.id === id)
    case "functions":
      return library.functions.some((a) => a.id === id)
    case "dashboards":
      return library.dashboards.some((a) => a.id === id)
  }
}

export function LibraryMode() {
  const library = useFlowBase((s) => s.library)
  const libCategory = useFlowBase((s) => s.libCategory)
  const libAssetId = useFlowBase((s) => s.libAssetId)

  const showDetail =
    libAssetId !== null && assetExists(library, libCategory, libAssetId)

  return (
    <>
      <LibrarySidebar />
      {showDetail ? <AssetDetail /> : <CategoryCatalog />}
    </>
  )
}
