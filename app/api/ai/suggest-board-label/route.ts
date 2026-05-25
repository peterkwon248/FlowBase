// FlowBase V2 — /api/ai/suggest-board-label (B1)
// 컬럼 + 샘플 행을 분석해서 보드 이름 제안.
// LOCK: 자동 적용 ❌ — 사용자가 dialog에서 Accept 클릭 시만 renameBoard.

import { type NextRequest, NextResponse } from "next/server"
import { aiErrorResponse, ask, parseJsonObject } from "../_anthropic"

export const runtime = "nodejs"

interface Body {
  currentLabel?: string
  columns?: { name: string; label: string; type: string }[]
  sampleRows?: Record<string, unknown>[] // 최대 5개 첫 행
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const cols = body.columns ?? []
  const samples = (body.sampleRows ?? []).slice(0, 5)

  if (cols.length === 0) {
    return NextResponse.json(
      { error: "columns required (at least 1)" },
      { status: 400 },
    )
  }

  const colSummary = cols
    .map((c) => `${c.label || c.name} (${c.type})`)
    .join(", ")
  const samplePreview = samples
    .map((r, i) => `Row ${i + 1}: ${JSON.stringify(r).slice(0, 200)}`)
    .join("\n")

  const system =
    `You are FlowBase, an assistant that suggests concise, descriptive board names.\n` +
    `Output rules:\n` +
    `- 2-5 words, no quotes\n` +
    `- Reflect the domain (CS/HR/Sales/Marketing/Finance/Stock/etc.)\n` +
    `- If a date or period is obvious, include it (e.g., "Q1 2026")\n` +
    `- Match the language of the column labels (Korean if Korean, English otherwise)\n` +
    `- Output strict JSON: {"suggested": string, "domain": string, "reasoning": string}`

  const user =
    `Current name: ${body.currentLabel ?? "(unnamed)"}\n` +
    `Columns: ${colSummary}\n` +
    (samples.length > 0
      ? `Sample rows:\n${samplePreview}\n`
      : "(no sample rows)\n") +
    `\nSuggest a better board name.`

  try {
    const text = await ask({ system, user, maxTokens: 256 })
    const json = parseJsonObject(text)
    const suggested =
      typeof json.suggested === "string" ? json.suggested.trim() : ""
    if (!suggested) {
      return NextResponse.json(
        { error: "AI did not return a valid suggestion" },
        { status: 502 },
      )
    }
    return NextResponse.json({
      suggested,
      domain: typeof json.domain === "string" ? json.domain : "",
      reasoning:
        typeof json.reasoning === "string" ? json.reasoning : "",
    })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
