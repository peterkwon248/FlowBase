// FlowBase V2 — /api/ai/analyze-import — Import 데이터 분석
// 설계: docs/02-design/features/flowbase-v2-phase3.design.md §5
// 출처: design-ref/handoff/AI-CONTRACTS.md §2
//
// Import 모달 Step 3 — 붙여넣은 데이터의 요약 + AI 컬럼(theme/sentiment) 추천.

import { type NextRequest, NextResponse } from "next/server"
import { aiErrorResponse, ask, parseJsonObject } from "../_anthropic"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "잘못된 JSON 요청" }, { status: 400 })
  }

  const { headers, sampleRows } = (body ?? {}) as {
    headers?: unknown
    sampleRows?: unknown
  }

  if (!Array.isArray(headers) || headers.length === 0) {
    return NextResponse.json({ error: "headers 배열 필요" }, { status: 400 })
  }
  if (!Array.isArray(sampleRows)) {
    return NextResponse.json({ error: "sampleRows 배열 필요" }, { status: 400 })
  }

  const headersJoined = (headers as string[]).join(" | ")
  const sampleJoined = (sampleRows as string[][])
    .slice(0, 15)
    .map((r) => (Array.isArray(r) ? r.join(" | ") : String(r)))
    .join("\n")

  const system =
    `You are analyzing a spreadsheet for a customer feedback / knowledge board.\n` +
    `Return a JSON object:\n` +
    `{\n` +
    `  "summary": "<1 sentence — what this data is>",\n` +
    `  "suggestTheme": <true if a 'theme' AI column would add value>,\n` +
    `  "suggestSentiment": <true if a 'sentiment' AI column would add value>,\n` +
    `  "rowKind": "<short noun phrase: 'customer interviews' | 'tasks' | 'launch checklist' | ...>"\n` +
    `}\n` +
    `Reply ONLY with the JSON object, nothing else.`

  const user = `Headers: ${headersJoined}\n\nSample rows:\n${sampleJoined}`

  try {
    const text = await ask({ system, user, maxTokens: 512 })
    const obj = parseJsonObject(text)
    return NextResponse.json({
      summary: String(obj.summary ?? ""),
      suggestTheme: obj.suggestTheme === true,
      suggestSentiment: obj.suggestSentiment === true,
      rowKind: String(obj.rowKind ?? ""),
    })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
