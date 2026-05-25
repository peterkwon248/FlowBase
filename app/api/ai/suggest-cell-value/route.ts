// FlowBase V2 — /api/ai/suggest-cell-value (G6-1)
// 단일 cell AI 제안 — row의 다른 cell값과 col 메타로 적절한 값 추측.
// LOCK: 명시 click + 자동 적용 ❌ → toast Apply 후만 cell 변경.

import { type NextRequest, NextResponse } from "next/server"
import { aiErrorResponse, ask } from "../_anthropic"

export const runtime = "nodejs"

interface Body {
  boardLabel?: string
  columnName?: string
  columnLabel?: string
  columnType?: string
  // 해당 column의 기존 options (select/multiSelect/status용)
  columnOptions?: string[]
  // 행의 다른 cell 값들 (context). key=col name
  rowContext?: Record<string, unknown>
  // 같은 column의 다른 row sample (분포 참고용, 최대 10)
  columnSamples?: string[]
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.columnName || !body.columnType) {
    return NextResponse.json(
      { error: "columnName and columnType required" },
      { status: 400 },
    )
  }

  const ctxEntries = Object.entries(body.rowContext ?? {})
    .filter(([, v]) => v != null && v !== "")
    .slice(0, 30)
  const ctx = ctxEntries
    .map(([k, v]) => `${k}: ${JSON.stringify(v).slice(0, 80)}`)
    .join("\n")
  const optList = (body.columnOptions ?? []).slice(0, 30)
  const samples = (body.columnSamples ?? []).slice(0, 10)

  const constraint = optList.length > 0
    ? `\nMust be one of: ${optList.join(" | ")}`
    : body.columnType === "multiSelect" && samples.length > 0
      ? `\nExisting values: ${samples.join(", ")}`
      : ""

  const system =
    `You are FlowBase, suggesting a single cell value.\n` +
    `Output rules:\n` +
    `- Output ONLY the value text (no quotes, no explanation, no markdown)\n` +
    `- For multiSelect: comma-separated values\n` +
    `- For date: YYYY-MM-DD\n` +
    `- For num: plain number\n` +
    `- For email: plain email\n` +
    `- For select/status: pick from options if provided\n` +
    `- Keep it short (under 60 chars)\n` +
    `- Match the language of the row context`

  const user =
    `Column: ${body.columnLabel || body.columnName} (${body.columnType})${constraint}\n` +
    (ctx ? `Row context:\n${ctx}\n` : "(no other cells filled)\n") +
    (samples.length > 0
      ? `Other rows in this column: ${samples.slice(0, 5).join(", ")}\n`
      : "") +
    `\nSuggest the value.`

  try {
    const text = (await ask({ system, user, maxTokens: 100 })).trim()
    if (!text) {
      return NextResponse.json(
        { error: "AI returned empty value" },
        { status: 502 },
      )
    }
    // 결과 안전화 — 따옴표/마크다운 제거 (LLM이 가끔 출력)
    const cleaned = text
      .replace(/^["'`]+|["'`]+$/g, "")
      .replace(/^\*+|\*+$/g, "")
      .trim()
    return NextResponse.json({ value: cleaned })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
