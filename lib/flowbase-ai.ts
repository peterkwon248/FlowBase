"use client"

// FlowBase V2 — AI 클라이언트 어댑터 (/api/ai/* fetch 래퍼)
// 설계: docs/02-design/features/flowbase-v2-phase2.design.md §5
// 출처: design-ref/handoff/AI-CONTRACTS.md §0 · §5
//
// 가드: 같은 endpoint 5초 throttle, infer-batch 100행 chunk.
// 서버 라우트(app/api/ai/*)도 이 파일의 타입을 import.

// ── 공유 타입 ─────────────────────────────────────────────────────
// id + sourceField로 지정한 텍스트 컬럼만 담는다 (전체 행 전송 ❌).
export interface InferBatchRow {
  id: string
  [key: string]: unknown
}

export interface InferResult {
  id: string
  value: string
}

export interface InferBatchRes {
  results: InferResult[]
  modelUsed: string
  durationMs: number
}

export interface AskRes {
  text: string
}

export interface AnalyzeImportRes {
  summary: string
  suggestTheme: boolean
  suggestSentiment: boolean
  rowKind: string
}

export type AiColumn = "theme" | "sentiment"

// throttle 위반 — 호출부가 toast로 안내
export class ThrottleError extends Error {
  constructor() {
    super("Try again in a moment (5s rate limit).")
    this.name = "ThrottleError"
  }
}

// ── throttle (AI-CONTRACTS §5) ────────────────────────────────────
const THROTTLE_MS = 5000

function throttleKey(endpoint: string): string {
  return `flowbase-ai-last-${endpoint}`
}

function checkThrottle(endpoint: string): void {
  try {
    const last = Number(localStorage.getItem(throttleKey(endpoint)) ?? "0")
    if (Date.now() - last < THROTTLE_MS) throw new ThrottleError()
  } catch (err) {
    if (err instanceof ThrottleError) throw err
    // localStorage 접근 불가(SSR 등) — throttle 스킵
  }
}

function markCall(endpoint: string): void {
  try {
    localStorage.setItem(throttleKey(endpoint), String(Date.now()))
  } catch {
    // 무시
  }
}

// ── 공통 fetch 래퍼 (throttle 미포함 — 호출부에서 1회 검사) ──────────
async function callAI<TRes>(endpoint: string, body: unknown): Promise<TRes> {
  const res = await fetch(`/api/ai/${endpoint}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    let message = `${res.status}`
    try {
      const data = (await res.json()) as { error?: string }
      if (data?.error) message = data.error
    } catch {
      // 본문 파싱 실패 — status만
    }
    throw new Error(message)
  }
  return res.json() as Promise<TRes>
}

// ── infer-batch — 100행 chunk + progress 콜백 ─────────────────────
const CHUNK_SIZE = 100

export async function inferBatch(
  column: AiColumn,
  rows: InferBatchRow[],
  sourceField: string,
  onProgress?: (done: number, total: number) => void,
): Promise<InferResult[]> {
  checkThrottle("infer-batch")
  markCall("infer-batch")

  if (rows.length <= CHUNK_SIZE) {
    const res = await callAI<InferBatchRes>("infer-batch", {
      column,
      sourceField,
      rows,
    })
    return res.results
  }

  // 100행 초과 — 순차 chunk
  const merged: InferResult[] = []
  for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
    const chunk = rows.slice(i, i + CHUNK_SIZE)
    const res = await callAI<InferBatchRes>("infer-batch", {
      column,
      sourceField,
      rows: chunk,
    })
    merged.push(...res.results)
    onProgress?.(Math.min(i + CHUNK_SIZE, rows.length), rows.length)
  }
  return merged
}

// ── ask — 자유 질의 ───────────────────────────────────────────────
export async function askAI(
  prompt: string,
  context: { boardLabel: string; rowCount: number },
): Promise<string> {
  checkThrottle("ask")
  markCall("ask")
  const res = await callAI<AskRes>("ask", { prompt, context })
  return res.text
}

// ── analyze-import — Import 데이터 요약 + AI 컬럼 추천 (Phase 3) ───
export async function analyzeImport(
  headers: string[],
  sampleRows: string[][],
): Promise<AnalyzeImportRes> {
  checkThrottle("analyze-import")
  markCall("analyze-import")
  return callAI<AnalyzeImportRes>("analyze-import", { headers, sampleRows })
}
