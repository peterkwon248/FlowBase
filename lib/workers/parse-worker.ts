// FlowBase V2 — Parse Web Worker (CSV/TSV/MD)
// 출처: 상용화 backlog 실용성 — import 시 main thread freeze 제거.
//
// 사용: lib/parse-async.ts가 이 worker를 spawn해서 parseAny 호출.
// xlsx는 lib 자체가 무거워 별 worker로 분리 (후속) — 이 worker는 text 포맷만.

/// <reference lib="webworker" />

import { parseAny, type ParsedTable } from "@/lib/parsers"

interface ParseRequest {
  id: string
  text: string
}

type ParseResponse =
  | { id: string; ok: true; result: ParsedTable }
  | { id: string; ok: false; error: string }

const worker = self as unknown as DedicatedWorkerGlobalScope

worker.addEventListener("message", (e: MessageEvent<ParseRequest>) => {
  const { id, text } = e.data
  try {
    const result = parseAny(text)
    worker.postMessage({ id, ok: true, result } satisfies ParseResponse)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    worker.postMessage({ id, ok: false, error: msg } satisfies ParseResponse)
  }
})

// TypeScript module — export empty (worker 자체는 import도 export도 안 함이 정상이지만 module 모드 위함)
export {}
