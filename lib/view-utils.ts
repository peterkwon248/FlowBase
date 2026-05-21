// 디스플레이 자동 추천 원칙 (docs/MEMORY.md #5):
//   "데이터 도메인이 허용할 때만 활성화" — Notion/Airtable 비대 함정 회피.
//   현재 sheet-view PR 범위에서는 table/sheet만 반환. kanban/timeline/gallery/chart는 후속 PR.

import type { Field } from "./mock-data"

export type ViewMode = "table" | "sheet" | "kanban" | "timeline" | "gallery" | "chart"

export function getAvailableViews(fields: Field[]): ViewMode[] {
  const views: ViewMode[] = ["table", "sheet"]

  // 칸반: status 또는 category/tier 컬럼 존재 시
  const hasStatus = fields.some(
    (f) =>
      f.type === "status" ||
      (f.type === "select" && ["status", "category", "tier"].includes(f.name)),
  )
  if (hasStatus) views.push("kanban")

  // 타임라인/캘린더: datetime 컬럼 존재 시
  const hasDate = fields.some((f) => f.type === "datetime")
  if (hasDate) views.push("timeline")

  // TODO (후속 PR):
  //   첨부/이미지 컬럼 → "gallery"
  //   숫자 컬럼 ≥ 2 → "chart"

  return views
}
