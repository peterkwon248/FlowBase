// FlowBase V2 — /api/ai/infer-batch 라우트 테스트
// 설계: docs/02-design/features/flowbase-v2-phase2.design.md §14 Q2
// 출처: design-ref/handoff/AI-CONTRACTS.md §7 (mock Anthropic client)
//
// _anthropic 모듈을 mock — 실 Claude 호출 없이 라우트 로직(매핑·가드)만 검증.

import { describe, expect, it, vi } from "vitest"

vi.mock("@/app/api/ai/_anthropic", () => ({
  AI_MODEL: "claude-sonnet-4-6",
  ask: vi.fn(),
  parseJsonArray: (text: string) => {
    const m = text.match(/\[[\s\S]*\]/)
    if (!m) throw new Error("no JSON array")
    return JSON.parse(m[0]) as unknown[]
  },
  aiErrorResponse: () =>
    new Response(JSON.stringify({ error: "mock error" }), { status: 500 }),
}))

import { ask } from "@/app/api/ai/_anthropic"
import { POST } from "@/app/api/ai/infer-batch/route"

const mockAsk = vi.mocked(ask)

function makeReq(body: unknown): Parameters<typeof POST>[0] {
  return new Request("http://localhost/api/ai/infer-batch", {
    method: "POST",
    body: JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0]
}

describe("POST /api/ai/infer-batch", () => {
  it("theme 분류 응답을 {id,value}[]로 매핑한다", async () => {
    mockAsk.mockResolvedValueOnce(
      '[{"id":"INT-018","theme":"Pricing pushback"}]',
    )
    const res = await POST(
      makeReq({
        column: "theme",
        sourceField: "quote",
        rows: [{ id: "INT-018", quote: "비싸요" }],
      }),
    )
    const data = await res.json()
    expect(data.results).toEqual([
      { id: "INT-018", value: "Pricing pushback" },
    ])
    expect(data.modelUsed).toBe("claude-sonnet-4-6")
  })

  it("sentiment 값 누락 시 Mixed로 fallback한다", async () => {
    mockAsk.mockResolvedValueOnce('[{"id":"INT-018"}]')
    const res = await POST(
      makeReq({
        column: "sentiment",
        sourceField: "quote",
        rows: [{ id: "INT-018", quote: "x" }],
      }),
    )
    const data = await res.json()
    expect(data.results).toEqual([{ id: "INT-018", value: "Mixed" }])
  })

  it("sourceField로 지정한 컬럼 값을 프롬프트에 넣는다", async () => {
    mockAsk.mockResolvedValueOnce('[{"id":"R-1","theme":"Other"}]')
    await POST(
      makeReq({
        column: "theme",
        sourceField: "comment",
        rows: [{ id: "R-1", comment: "좋은 피드백" }],
      }),
    )
    expect(mockAsk).toHaveBeenCalledWith(
      expect.objectContaining({ user: "[R-1] 좋은 피드백" }),
    )
  })

  it("빈 rows는 빈 결과를 반환한다", async () => {
    const res = await POST(
      makeReq({ column: "theme", sourceField: "quote", rows: [] }),
    )
    const data = await res.json()
    expect(data.results).toEqual([])
  })

  it("100행 초과는 400을 반환한다", async () => {
    const rows = Array.from({ length: 101 }, (_, i) => ({
      id: `R-${i}`,
      quote: "x",
    }))
    const res = await POST(
      makeReq({ column: "theme", sourceField: "quote", rows }),
    )
    expect(res.status).toBe(400)
  })

  it("잘못된 column은 400을 반환한다", async () => {
    const res = await POST(makeReq({ column: "bogus", rows: [] }))
    expect(res.status).toBe(400)
  })

  it("sourceField 누락 시 400을 반환한다", async () => {
    const res = await POST(
      makeReq({ column: "theme", rows: [{ id: "R-1", quote: "x" }] }),
    )
    expect(res.status).toBe(400)
  })
})
