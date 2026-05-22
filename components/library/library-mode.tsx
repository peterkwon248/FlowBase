// FlowBase V2 — Library 모드 (액티비티 바 Library)
// 설계: docs/02-design/features/flowbase-v2-library.design.md §3
//
// [Library 사이드바 | 카테고리 카탈로그] — B1 읽기 전용 브라우즈.
// 자산 디테일 뷰는 B2.

"use client"

import { CategoryCatalog } from "@/components/library/category-catalog"
import { LibrarySidebar } from "@/components/library/library-sidebar"

export function LibraryMode() {
  return (
    <>
      <LibrarySidebar />
      <CategoryCatalog />
    </>
  )
}
