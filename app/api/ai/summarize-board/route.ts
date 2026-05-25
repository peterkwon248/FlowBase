// FlowBase V2 — /api/ai/summarize-board (B2)
// 컬럼 + 행 분포 + code 기반 insights → 2-3문장 자연어 요약.
// LOCK: 명시 click + 자동 적용 ❌ (단순 표시만).

import { type NextRequest, NextResponse } from "next/server"
import { aiErrorResponse, ask } from "../_anthropic"

export const runtime = "nodejs"

interface Body {
  boardLabel?: string
  domain?: string
  rowCount?: number
  columns?: { name: string; label: string; type: string }[]
  // code 기반 insights — period_change / top_categories / outliers 등 hint로 전달.
  insightsHint?: string[]
  // 샘플 행 (최대 10)
  sampleRows?: Record<string, unknown>[]
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const cols = body.columns ?? []
  if (cols.length === 0) {
    return NextResponse.json(
      { error: "columns required" },
      { status: 400 },
    )
  }
  const samples = (body.sampleRows ?? []).slice(0, 10)

  const colSummary = cols
    .map((c) => `${c.label || c.name} (${c.type})`)
    .join(", ")
  const samplePreview = samples
    .map((r, i) => `Row ${i + 1}: ${JSON.stringify(r).slice(0, 200)}`)
    .join("\n")
  const hintBlock = (body.insightsHint ?? [])
    .map((h) => `- ${h}`)
    .join("\n")

  const system =
    `You are FlowBase, a concise data analyst.\n` +
    `Output rules:\n` +
    `- 2-3 short sentences total. Plain text, no markdown.\n` +
    `- Lead with the *most important* takeaway (what changed, what stands out).\n` +
    `- Mention specific numbers/categories from the data.\n` +
    `- Match the language of the column labels (Korean if Korean, English otherwise).\n` +
    `- Do NOT add disclaimers or "I'm an AI" preambles.`

  const user =
    `Board: ${body.boardLabel ?? "(unnamed)"}\n` +
    (body.domain ? `Domain: ${body.domain}\n` : "") +
    `Rows: ${body.rowCount ?? samples.length}\n` +
    `Columns: ${colSummary}\n` +
    (hintBlock ? `\nCode-detected highlights:\n${hintBlock}\n` : "") +
    (samples.length > 0 ? `\nSample rows:\n${samplePreview}\n` : "") +
    `\nWrite the takeaway in 2-3 sentences.`

  try {
    const text = await ask({ system, user, maxTokens: 400 })
    return NextResponse.json({ summary: text.trim() })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
