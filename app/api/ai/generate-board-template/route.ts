// FlowBase V2 — /api/ai/generate-board-template (G6-2)
// prompt → ColumnDef[] + seed rows JSON. New board 진입점.
// LOCK: 자동 적용 ❌ — preview 후 사용자 Create 클릭 시만 createBoard.

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

interface ColumnSpec {
  name: string
  label: string
  type: AllowedType
  options?: string[]
}

interface Body {
  prompt?: string
}

export async function POST(req: NextRequest) {
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const prompt = (body.prompt ?? "").trim()
  if (!prompt) {
    return NextResponse.json({ error: "prompt required" }, { status: 400 })
  }

  const system =
    `You are FlowBase, generating a starter data board from a user prompt.\n` +
    `Output strict JSON: {"label": string, "columns": ColumnSpec[], "rows": Row[]}\n` +
    `\n` +
    `ColumnSpec shape:\n` +
    `  {"name": "snake_case_key", "label": "Display Name", "type": "<TYPE>", "options"?: string[]}\n` +
    `\n` +
    `Allowed types: text, num, date, email, select, multiSelect, status, avatar.\n` +
    `  - "status" → MUST use Korean keys ["미처리","진행중","대기","완료"] (LOCK). Don't include options for status.\n` +
    `  - "select"/"multiSelect" → include options array (3-8 items).\n` +
    `  - "avatar" for assignee/owner person.\n` +
    `  - "date" YYYY-MM-DD strings in rows.\n` +
    `\n` +
    `Rules:\n` +
    `- 4-7 columns total (don't include "id" — added automatically)\n` +
    `- 5 example rows reflecting realistic variety\n` +
    `- Label = concise board name (2-5 words)\n` +
    `- Match the user's language (Korean if Korean prompt)\n` +
    `- column.name = snake_case (a-z 0-9 _), unique\n`

  const user = `User prompt: ${prompt}\n\nGenerate the board JSON.`

  try {
    const text = await ask({ system, user, maxTokens: 2048 })
    const json = parseJsonObject(text)
    const label = typeof json.label === "string" ? json.label.trim() : ""
    const cols = Array.isArray(json.columns) ? json.columns : []
    const rows = Array.isArray(json.rows) ? json.rows : []

    if (!label || cols.length === 0) {
      return NextResponse.json(
        { error: "AI returned invalid template" },
        { status: 502 },
      )
    }
    // sanitize columns
    const validCols: ColumnSpec[] = []
    const seenNames = new Set<string>()
    for (const c of cols) {
      if (!c || typeof c !== "object") continue
      const cc = c as Record<string, unknown>
      const name = typeof cc.name === "string" ? cc.name.trim() : ""
      const colLabel = typeof cc.label === "string" ? cc.label.trim() : name
      const type = String(cc.type ?? "")
      if (!name || !ALLOWED_TYPES.includes(type as AllowedType)) continue
      if (seenNames.has(name)) continue
      seenNames.add(name)
      const safe = name.toLowerCase().replace(/[^a-z0-9_]+/g, "_").replace(/^_|_$/g, "")
      const finalName = safe || `col_${validCols.length + 1}`
      const opts =
        Array.isArray(cc.options) && (type === "select" || type === "multiSelect")
          ? (cc.options as unknown[])
              .filter((o) => typeof o === "string")
              .map((o) => String(o))
              .slice(0, 12)
          : undefined
      validCols.push({
        name: finalName,
        label: colLabel || finalName,
        type: type as AllowedType,
        options: opts,
      })
    }
    if (validCols.length === 0) {
      return NextResponse.json(
        { error: "No valid columns generated" },
        { status: 502 },
      )
    }
    // sanitize rows — 컬럼 매칭만 유지 (id 제외, 추가 컬럼 무시)
    const validRows: Record<string, unknown>[] = []
    const validColNames = new Set(validCols.map((c) => c.name))
    for (const r of rows.slice(0, 10)) {
      if (!r || typeof r !== "object") continue
      const row: Record<string, unknown> = {}
      for (const [k, v] of Object.entries(r as Record<string, unknown>)) {
        if (validColNames.has(k)) row[k] = v
      }
      if (Object.keys(row).length > 0) validRows.push(row)
    }
    return NextResponse.json({
      label,
      columns: validCols,
      rows: validRows,
    })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
