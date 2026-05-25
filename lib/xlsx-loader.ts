// FlowBase V2 — xlsx (Excel) 양방향 어댑터 (Im-2)
// 출처: 상용화 backlog Im-2 — sample SheetJS 사용. dynamic import + code split LOCK.
//
// LOCK (Key Design #18):
//   - xlsx lib은 절대 top-level import ❌ — main bundle 보호 (~400KB+)
//   - 첫 호출 시 `import('xlsx')` lazy load → 모듈 캐시
//   - 첫 sheet만 사용 (multi-sheet은 후속). row 데이터 모두 string으로 정규화.
//
// Watch out: `xlsx` (SheetJS community npm 버전)에 알려진 prototype pollution + ReDoS
// vulnerability 있음. 사용자가 자기 디바이스에서 자기 파일을 import하는 시나리오는 위험
// 낮음. 신뢰할 수 없는 xlsx를 직접 받는 시나리오 도입 시 (Phase 3+ 클라우드 sync) 재검토 필요.

import type { SerializableTable } from "@/lib/parsers"

// 모듈 캐시 — 첫 호출만 import('xlsx'), 이후 같은 promise 반환
let _xlsxPromise: Promise<typeof import("xlsx")> | null = null

export function loadXlsx(): Promise<typeof import("xlsx")> {
  if (!_xlsxPromise) {
    _xlsxPromise = import("xlsx")
  }
  return _xlsxPromise
}

// xlsx ArrayBuffer → SerializableTable (첫 sheet, header + body)
// 동기 main thread version — Worker 미지원/실패 시 parseXlsxAsync의 fallback.
export async function parseXlsxToTable(
  buffer: ArrayBuffer,
): Promise<SerializableTable> {
  const XLSX = await loadXlsx()
  const wb = XLSX.read(buffer, { type: "array" })
  const firstName = wb.SheetNames[0]
  if (!firstName) return { headers: [], rows: [] }
  const ws = wb.Sheets[firstName]
  // header: 1 → 2D array. raw: false → 모든 셀 string. defval: "" → 빈 셀 ""
  const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    raw: false,
    defval: "",
  })
  if (aoa.length === 0) return { headers: [], rows: [] }
  const headerRow = (aoa[0] ?? []) as unknown[]
  const dataRows = aoa.slice(1) as unknown[][]
  return {
    headers: headerRow.map((h) => (h == null ? "" : String(h))),
    rows: dataRows.map((r) => r.map((c) => (c == null ? "" : String(c)))),
  }
}

// ─── Web Worker 비동기 version ───
// xlsx lib은 worker bundle 안에서 lazy load. 큰 파일도 UI freeze ❌.
// Worker 미지원/spawn 실패 시 sync parseXlsxToTable로 fallback.

let _xlsxWorker: Worker | null = null
const _xlsxPending: Map<
  string,
  { resolve: (v: SerializableTable) => void; reject: (e: Error) => void }
> = new Map()

function getOrCreateXlsxWorker(): Worker | null {
  if (typeof Worker === "undefined") return null
  if (_xlsxWorker) return _xlsxWorker
  try {
    _xlsxWorker = new Worker(
      new URL("./workers/xlsx-worker.ts", import.meta.url),
      { type: "module" },
    )
    console.info("[xlsx-loader] xlsx Web Worker spawned successfully")
    _xlsxWorker.addEventListener("message", (e: MessageEvent) => {
      const data = e.data as {
        id: string
        ok: boolean
        result?: SerializableTable
        error?: string
      }
      const pending = _xlsxPending.get(data.id)
      if (!pending) return
      _xlsxPending.delete(data.id)
      if (data.ok && data.result) pending.resolve(data.result)
      else pending.reject(new Error(data.error ?? "Unknown xlsx error"))
    })
    _xlsxWorker.addEventListener("error", () => {
      for (const [, p] of _xlsxPending) {
        p.reject(new Error("xlsx worker crashed"))
      }
      _xlsxPending.clear()
      _xlsxWorker?.terminate()
      _xlsxWorker = null
    })
    return _xlsxWorker
  } catch (err) {
    console.warn(
      "[xlsx-loader] xlsx worker spawn failed, fallback to sync:",
      err,
    )
    return null
  }
}

// 비동기 parse — Worker 시도, 실패 시 sync fallback.
// buffer는 transferable — worker에 zero-copy 전달 (큰 파일 효율).
export async function parseXlsxAsync(
  buffer: ArrayBuffer,
): Promise<SerializableTable> {
  const worker = getOrCreateXlsxWorker()
  if (!worker) {
    // SSR or 미지원 — sync fallback (main thread block 가능)
    return parseXlsxToTable(buffer)
  }
  const id = `xlsx-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`
  return new Promise<SerializableTable>((resolve, reject) => {
    _xlsxPending.set(id, { resolve, reject })
    // transferable — buffer 소유권 이전 (호출자는 더 이상 사용 ❌)
    worker.postMessage({ id, buffer }, [buffer])
    // 60초 타임아웃 (큰 xlsx는 더 오래 걸릴 수 있어 parse보다 길게)
    setTimeout(() => {
      if (_xlsxPending.has(id)) {
        _xlsxPending.delete(id)
        reject(new Error("xlsx parse timeout (60s)"))
      }
    }, 60_000)
  })
}

export function disposeXlsxWorker(): void {
  if (_xlsxWorker) {
    _xlsxWorker.terminate()
    _xlsxWorker = null
  }
  _xlsxPending.clear()
}

// SerializableTable → xlsx Blob. 단일 sheet "Sheet1".
export async function tableToXlsxBlob(
  table: SerializableTable,
  sheetName = "Sheet1",
): Promise<Blob> {
  const XLSX = await loadXlsx()
  const aoa: unknown[][] = [table.headers, ...table.rows]
  const ws = XLSX.utils.aoa_to_sheet(aoa)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  const buf = XLSX.write(wb, {
    type: "array",
    bookType: "xlsx",
  }) as ArrayBuffer
  return new Blob([buf], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
}
