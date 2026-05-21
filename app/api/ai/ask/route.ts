// FlowBase V2 — /api/ai/ask — AI Composer 자유 질의
// 설계: docs/02-design/features/flowbase-v2-phase2.design.md §4.3
// 출처: design-ref/handoff/AI-CONTRACTS.md §3
//
// AI Activity 패널 하단 입력창. 행을 수정하지 않는 읽기 전용 Q&A.

import { type NextRequest, NextResponse } from "next/server"
import { aiErrorResponse, ask } from "../_anthropic"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "잘못된 JSON 요청" }, { status: 400 })
  }

  const { prompt, context } = (body ?? {}) as {
    prompt?: string
    context?: { boardLabel?: string; rowCount?: number }
  }

  if (typeof prompt !== "string" || prompt.trim() === "") {
    return NextResponse.json({ error: "prompt 필요" }, { status: 400 })
  }

  const boardLabel = context?.boardLabel ?? "this board"
  const rowCount = context?.rowCount ?? 0

  const system =
    `You are FlowBase, an assistant inside a data-board app.\n` +
    `The user is on the "${boardLabel}" board with ${rowCount} rows.\n` +
    `Respond in 1-2 short sentences. Korean if the user wrote Korean, English otherwise.`

  try {
    const text = await ask({ system, user: prompt, maxTokens: 1024 })
    return NextResponse.json({ text })
  } catch (err) {
    return aiErrorResponse(err)
  }
}
