// FlowBase V2 — xlsx (Excel) Web Worker (Im-2 후속)
// 출처: 상용화 backlog 실용성 — 큰 xlsx file upload 시 UI freeze 제거.
//
// 별 worker로 분리한 이유:
//   - xlsx lib(~400KB) 자체가 무거워 parse-worker와 통합 시 CSV path도 영향
//   - xlsx는 file upload 시 한 번만 호출 → 첫 spawn cost 한 번만 발생 → 분리 OK
//   - worker 내부에서 lazy `import('xlsx')` — chunk split 보존
//
// 메시지 프로토콜:
//   req:  { id, buffer: ArrayBuffer }   ← transferable로 zero-copy
//   resp: { id, ok: true, result: SerializableTable } | { id, ok: false, error: string }

/// <reference lib="webworker" />

interface XlsxRequest {
  id: string
  buffer: ArrayBuffer
}

interface SerializableTable {
  headers: string[]
  rows: string[][]
}

type XlsxResponse =
  | { id: string; ok: true; result: SerializableTable }
  | { id: string; ok: false; error: string }

const worker = self as unknown as DedicatedWorkerGlobalScope

worker.addEventListener("message", async (e: MessageEvent<XlsxRequest>) => {
  const { id, buffer } = e.data
  try {
    // Worker 안에서 lazy import — xlsx chunk가 worker bundle에 코드 분할
    const XLSX = await import("xlsx")
    const wb = XLSX.read(buffer, { type: "array" })
    const firstName = wb.SheetNames[0]
    if (!firstName) {
      worker.postMessage({
        id,
        ok: true,
        result: { headers: [], rows: [] },
      } satisfies XlsxResponse)
      return
    }
    const ws = wb.Sheets[firstName]
    const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, {
      header: 1,
      raw: false,
      defval: "",
    })
    if (aoa.length === 0) {
      worker.postMessage({
        id,
        ok: true,
        result: { headers: [], rows: [] },
      } satisfies XlsxResponse)
      return
    }
    const headerRow = (aoa[0] ?? []) as unknown[]
    const dataRows = aoa.slice(1) as unknown[][]
    const result: SerializableTable = {
      headers: headerRow.map((h) => (h == null ? "" : String(h))),
      rows: dataRows.map((r) => r.map((c) => (c == null ? "" : String(c)))),
    }
    worker.postMessage({ id, ok: true, result } satisfies XlsxResponse)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    worker.postMessage({ id, ok: false, error: msg } satisfies XlsxResponse)
  }
})

export {}
