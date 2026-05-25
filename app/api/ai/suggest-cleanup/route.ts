// FlowBase V2 — /api/ai/suggest-cleanup (B4)
// 컬럼별 cell 값 분포 → typo 통합 제안 + 빈 cell 패턴 제안.
// minimum: status/select/multiSelect 컬럼의 비슷한 값 통합만.
// LOCK: 자동 적용 ❌ — UI에서 개별 Accept/Dismiss로 적용.

import { type NextRequest, NextResponse } from "next/server"
import { aiErrorResponse, ask, parseJsonArray } from "../_anthropic"

export const runtime = "nodejs"

interface ColInfo {
  name: string
  label: string
  type: string
  // distinct 값 + count — typo 통합 후보 추출 source
  values: { value: string; count: number }[]
}

interface Body {
  boardLabel?: string
  columns?: ColInfo[]
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const cols = (body.columns ?? []).filter(
    (c) => c.values && c.values.length >= 2,
  )
  if (cols.length === 0) {
    return NextResponse.json({ suggestions: [] })
  }

  // 컬럼별 값 list — token 절약 위해 컬럼당 최대 30개.
  const colBlocks = cols
    .map((c) => {
      const vals = c.values
        .slice(0, 30)
        .map((v) => `  - "${v.value}" (${v.count})`)
        .join("\n")
      return `${c.label || c.name} [${c.type}]:\n${vals}`
    })
    .join("\n\n")

  const system =
    `You are FlowBase, a data cleanup assistant.\n` +
    `Find suspicious value pairs that LIKELY refer to the same thing but are spelled differently:\n` +
    `- Case differences: "Todo" / "todo" / "TODO"\n` +
    `- Spacing: "In progress" / "In  progress" / "In-progress"\n` +
    `- Typos: "Customer" / "Custmer"\n` +
    `- Abbreviation: "Mgr" / "Manager"\n` +
    `Do NOT merge semantically different values ("Sales" ≠ "Sales Ops").\n` +
    `\n` +
    `Output strict JSON array, each item:\n` +
    `  {"col": "<column name>", "from": "<source value>", "to": "<canonical value>", "reason": "<short>"}\n` +
    `Suggest at most 10 merges. Pick the most-used spelling as "to". Empty array if nothing to merge.`

  const user =
    `Board: ${body.boardLabel ?? "(unnamed)"}\n\n` +
    `Columns and value frequencies:\n\n${colBlocks}\n\n` +
    `Output the JSON array.`

  try {
    const text = await ask({ system, user, maxTokens: 1024 })
    const arr = parseJsonArray(text) as Array<{
      col?: string
      from?: string
      to?: string
      reason?: string
    }>
    const valid = arr
      .filter(
        (s) =>
          typeof s.col === "string" &&
          typeof s.from === "string" &&
          typeof s.to === "string" &&
          s.from !== s.to,
      )
      .map((s) => ({
        col: s.col!,
        from: s.from!,
        to: s.to!,
        reason: typeof s.reason === "string" ? s.reason : "",
      }))
    return NextResponse.json({ suggestions: valid })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
