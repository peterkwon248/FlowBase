// FlowBase V2 — /api/ai/suggest-column-type (B3)
// 컬럼명 + sample 값들 → 적절한 type 제안 + 이유.
// LOCK: 명시 click + Accept (자동 적용 ❌).

import { type NextRequest, NextResponse } from "next/server"
import { aiErrorResponse, ask, parseJsonObject } from "../_anthropic"

export const runtime = "nodejs"

const ALLOWED_TYPES = [
  "text",
  "num",
  "date",
  "email",
  "select",
  "multiSelect",
  "status",
  "avatar",
] as const

type AllowedType = typeof ALLOWED_TYPES[number]

interface Body {
  columnName?: string
  columnLabel?: string
  currentType?: string
  sampleValues?: unknown[] // 최대 20
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  if (!body.columnName) {
    return NextResponse.json({ error: "columnName required" }, { status: 400 })
  }
  const samples = (body.sampleValues ?? [])
    .slice(0, 20)
    .map((v) => (v == null ? "" : String(v)))
    .filter((s) => s.length > 0)

  const system =
    `You are FlowBase, choosing the best column type for a sheet.\n` +
    `Allowed types: text, num, date, email, select, multiSelect, status, avatar.\n` +
    `Pick the ONE that best fits both the column name AND the sample values.\n` +
    `Rules:\n` +
    `- "status" only for short workflow stages (Todo / In progress / Done). Use "select" for general categories.\n` +
    `- "multiSelect" if cells look like comma-separated tags.\n` +
    `- "avatar" for person/assignee names.\n` +
    `- "email" only if values match email format.\n` +
    `- "num" only if all sample values are numeric.\n` +
    `- "date" for YYYY-MM-DD or similar.\n` +
    `Output strict JSON: {"type": "...", "confidence": 0-1, "reasoning": "..."}`

  const user =
    `Column name: ${body.columnName}\n` +
    (body.columnLabel ? `Display label: ${body.columnLabel}\n` : "") +
    (body.currentType ? `Current type: ${body.currentType}\n` : "") +
    `Sample values (${samples.length}):\n` +
    samples.slice(0, 20).map((s) => `- ${s}`).join("\n")

  try {
    const text = await ask({ system, user, maxTokens: 256 })
    const json = parseJsonObject(text)
    const type = String(json.type ?? "")
    if (!ALLOWED_TYPES.includes(type as AllowedType)) {
      return NextResponse.json(
        { error: `AI returned invalid type: ${type}` },
        { status: 502 },
      )
    }
    return NextResponse.json({
      type,
      confidence:
        typeof json.confidence === "number" ? json.confidence : 0.5,
      reasoning: typeof json.reasoning === "string" ? json.reasoning : "",
    })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
