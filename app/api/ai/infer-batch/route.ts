// FlowBase V2 — /api/ai/infer-batch — Theme/Sentiment 일괄 분류
// 설계: docs/02-design/features/flowbase-v2-phase2.design.md §4.2
// 출처: design-ref/handoff/AI-CONTRACTS.md §1
//
// AI Activity 패널 "Apply all" 버튼이 호출. Claude로 분류 → {id,value}[] 반환.

import { type NextRequest, NextResponse } from "next/server"
import { AI_MODEL, aiErrorResponse, ask, parseJsonArray } from "../_anthropic"

export const runtime = "nodejs"

// AI-CONTRACTS §1 기본 theme 옵션
const THEME_OPTIONS = [
  "Pricing pushback",
  "Onboarding friction",
  "Feature: AI columns",
  "Sheet performance",
  "Sharing & roles",
  "Other",
]

interface InferRow {
  id: string
  [key: string]: unknown
}

export async function POST(req: NextRequest) {
  const t0 = Date.now()

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "잘못된 JSON 요청" }, { status: 400 })
  }

  const { column, sourceField, rows, themeOptions } = (body ?? {}) as {
    column?: string
    sourceField?: unknown
    rows?: unknown
    themeOptions?: unknown
  }

  if (column !== "theme" && column !== "sentiment") {
    return NextResponse.json(
      { error: "column은 'theme' 또는 'sentiment'여야 합니다." },
      { status: 400 },
    )
  }
  if (typeof sourceField !== "string" || sourceField.length === 0) {
    return NextResponse.json(
      { error: "sourceField(소스 텍스트 컬럼명)가 필요합니다." },
      { status: 400 },
    )
  }
  if (!Array.isArray(rows)) {
    return NextResponse.json({ error: "rows 배열 필요" }, { status: 400 })
  }
  if (rows.length === 0) {
    return NextResponse.json({ results: [], modelUsed: AI_MODEL, durationMs: 0 })
  }
  if (rows.length > 100) {
    return NextResponse.json(
      { error: "한 번에 최대 100개 행" },
      { status: 400 },
    )
  }

  const typedRows = rows as InferRow[]
  const list = typedRows
    .map((r) => `[${r.id}] ${String(r[sourceField] ?? "")}`)
    .join("\n")

  const opts =
    column === "theme"
      ? Array.isArray(themeOptions) && themeOptions.length > 0
        ? (themeOptions as string[])
        : THEME_OPTIONS
      : ["Positive", "Mixed", "Negative"]

  const system =
    column === "theme"
      ? `Classify each customer-interview quote into ONE of: ${opts.join(", ")}.\n` +
        `Reply ONLY with a JSON array, no prose, shape: [{"id":"INT-018","theme":"Pricing pushback"}, …]`
      : `Score the sentiment of each customer-interview quote as Positive, Mixed, or Negative.\n` +
        `Reply ONLY with a JSON array, no prose, shape: [{"id":"INT-018","sentiment":"Negative"}, …]`

  try {
    const text = await ask({ system, user: list, maxTokens: 4096 })
    const arr = parseJsonArray(text) as Array<{
      id?: string
      theme?: string
      sentiment?: string
    }>
    // id 매칭 — 누락된 row는 그대로 둠 (재시도 가능, AI-CONTRACTS §1 failure modes)
    const results = arr
      .filter((r) => r && typeof r.id === "string")
      .map((r) => ({
        id: r.id as string,
        value:
          column === "theme"
            ? String(r.theme ?? "Other")
            : String(r.sentiment ?? "Mixed"),
      }))

    return NextResponse.json({
      results,
      modelUsed: AI_MODEL,
      durationMs: Date.now() - t0,
    })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
