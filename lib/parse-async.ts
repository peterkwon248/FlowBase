// FlowBase V2 — Parse async wrapper (Worker spawn + Promise)
// 출처: 상용화 backlog 실용성 — import_step_paste의 handlePaste 비동기화.
//
// Worker 미지원 환경(SSR, 일부 브라우저)은 sync fallback.
// 첫 호출에 worker spawn. 재사용 — 단일 instance.

import { parseAny, type ParsedTable } from "@/lib/parsers"

let _worker: Worker | null = null
let _pendingResolvers: Map<
  string,
  { resolve: (v: ParsedTable) => void; reject: (e: Error) => void }
> = new Map()

function getOrCreateWorker(): Worker | null {
  if (typeof Worker === "undefined") return null
  if (_worker) return _worker
  try {
    // Next.js Turbopack 지원 패턴 — new URL(..., import.meta.url) + type: module
    _worker = new Worker(
      new URL("./workers/parse-worker.ts", import.meta.url),
      { type: "module" },
    )
    console.info("[parse-async] Web Worker spawned successfully")
    _worker.addEventListener("message", (e: MessageEvent) => {
      const data = e.data as {
        id: string
        ok: boolean
        result?: ParsedTable
        error?: string
      }
      const pending = _pendingResolvers.get(data.id)
      if (!pending) return
      _pendingResolvers.delete(data.id)
      if (data.ok && data.result) {
        pending.resolve(data.result)
      } else {
        pending.reject(new Error(data.error ?? "Unknown parser error"))
      }
    })
    _worker.addEventListener("error", () => {
      // worker fatal — pending 모두 reject + worker null reset (다음 호출에 fallback)
      for (const [, p] of _pendingResolvers) {
        p.reject(new Error("Worker crashed"))
      }
      _pendingResolvers.clear()
      _worker?.terminate()
      _worker = null
    })
    return _worker
  } catch (err) {
    console.warn("[parse-async] Worker spawn failed, fallback to sync:", err)
    return null
  }
}

// 비동기 parse — Worker 시도, 실패/미지원 시 sync fallback.
// 큰 입력에서도 main thread block ❌.
export async function parseAnyAsync(text: string): Promise<ParsedTable> {
  const worker = getOrCreateWorker()
  if (!worker) {
    // SSR or 미지원 — sync fallback (main thread block 가능)
    return parseAny(text)
  }
  const id = `parse-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`
  return new Promise<ParsedTable>((resolve, reject) => {
    _pendingResolvers.set(id, { resolve, reject })
    worker.postMessage({ id, text })
    // 타임아웃 안전망 — 30초 초과 시 reject
    setTimeout(() => {
      if (_pendingResolvers.has(id)) {
        _pendingResolvers.delete(id)
        reject(new Error("Parse timeout (30s)"))
      }
    }, 30_000)
  })
}

// 테스트/디버그용 — worker 강제 종료 (예: hot reload)
export function disposeParseWorker(): void {
  if (_worker) {
    _worker.terminate()
    _worker = null
  }
  _pendingResolvers.clear()
}
