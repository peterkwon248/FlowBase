// FlowBase V2 — AI 서버 어댑터 (Anthropic SDK 래퍼)
// 설계: docs/02-design/features/flowbase-v2-phase2.design.md §4.1
// 출처: design-ref/handoff/AI-CONTRACTS.md §0.1
//
// API 키는 서버 전용 — process.env.ANTHROPIC_API_KEY. 클라이언트 번들 노출 ❌.
// 이 파일은 app/api/ai/* 라우트에서만 import (파일명 _ 접두 = 라우트 아님).

import Anthropic from "@anthropic-ai/sdk"
import { NextResponse } from "next/server"

// 모델: AI-CONTRACTS + Phase 2 design D2 — theme/sentiment 대량 분류라 최신 안정 Sonnet.
// 변경 시 이 상수만 수정.
export const AI_MODEL = "claude-sonnet-4-6"

let cached: Anthropic | null = null

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY 미설정 — .env.local에 키를 추가하세요.")
  }
  if (!cached) cached = new Anthropic({ apiKey })
  return cached
}

interface AskOptions {
  // 정적 지시문 (system) — 동적 데이터(user)와 분리.
  // 참고: Sonnet prompt cache 최소 prefix(~2048 tok)보다 짧아 캐시 적중은 기대 ❌.
  system: string
  user: string
  maxTokens?: number
}

// 단일 메시지 호출 → 응답 텍스트. 분류는 thinking 불필요라 미사용.
export async function ask(opts: AskOptions): Promise<string> {
  const res = await getClient().messages.create({
    model: AI_MODEL,
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.system,
    messages: [{ role: "user", content: opts.user }],
  })
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
}

// 응답 텍스트에서 첫 JSON 배열 추출 (AI-CONTRACTS §0.1).
export function parseJsonArray(text: string): unknown[] {
  const m = text.match(/\[[\s\S]*\]/)
  if (!m) throw new Error("응답에 JSON 배열 없음: " + text.slice(0, 200))
  return JSON.parse(m[0]) as unknown[]
}

// 응답 텍스트에서 첫 JSON 객체 추출 (AI-CONTRACTS §0.1) — Phase 3 analyze-import.
export function parseJsonObject(text: string): Record<string, unknown> {
  const m = text.match(/\{[\s\S]*\}/)
  if (!m) throw new Error("응답에 JSON 객체 없음: " + text.slice(0, 200))
  return JSON.parse(m[0]) as Record<string, unknown>
}

// AI 라우트 공통 에러 응답 — 타입별 status 매핑 (shared/error-codes 기준).
export function aiErrorResponse(err: unknown): NextResponse {
  if (err instanceof Anthropic.RateLimitError) {
    return NextResponse.json(
      { error: "AI 사용량 한도 초과 — 잠시 후 다시 시도하세요." },
      { status: 429 },
    )
  }
  if (err instanceof Anthropic.AuthenticationError) {
    return NextResponse.json(
      { error: "AI 인증 실패 — ANTHROPIC_API_KEY를 확인하세요." },
      { status: 401 },
    )
  }
  const message = err instanceof Error ? err.message : "AI 호출 실패"
  return NextResponse.json({ error: message }, { status: 500 })
}
