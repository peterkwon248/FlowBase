// FlowBase V2 — Import 한계치 + check helpers
// 출처: 상용화 backlog 실용성 — UI freeze · localStorage quota 방어.
//
// 한계 결정 근거:
//   - localStorage browser 한계: Chrome 10MB · Firefox 5MB · Safari 5MB → 5MB가 안전 기준
//   - sync parsing UI freeze: 50,000행 · ~10MB가 main thread block 임계
//   - virtual scrolling ❌ — sheet view DOM 폭증 방어
//   - xlsx lib은 메모리 호그(매 행 마다 객체) — 더 보수적 한계 권장
//
// LOCK:
//   - hard limit 초과 → block + toast.error (사용자 진행 ❌)
//   - warn limit 초과 → confirm dialog + 진행 가능 (사용자 선택)
//   - localStorage quota error → 새 보드 rollback + 명시 toast

export const IMPORT_LIMITS = {
  // file size (byte)
  FILE_WARN_BYTES: 10 * 1024 * 1024, // 10MB — confirm 다이얼로그
  FILE_HARD_BYTES: 50 * 1024 * 1024, // 50MB — block
  // row count (parsed)
  ROW_WARN: 5_000, // 5,000 — confirm + warning toast (기존 1,000 → 5,000으로 완화)
  ROW_HARD: 50_000, // 50,000 — block
  // cell count = rows × columns (xlsx 깊은 sheet 방어)
  CELL_HARD: 500_000, // 50K × 10col 정도
} as const

// 사람-친화 byte 표시
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export type LimitCheck =
  | { ok: true; warn: false }
  | { ok: true; warn: true; message: string }
  | { ok: false; warn: false; message: string }

export function checkFileSize(file: File): LimitCheck {
  const size = file.size
  if (size > IMPORT_LIMITS.FILE_HARD_BYTES) {
    return {
      ok: false,
      warn: false,
      message: `File too large (${formatBytes(size)}). Max ${formatBytes(
        IMPORT_LIMITS.FILE_HARD_BYTES,
      )}.`,
    }
  }
  if (size > IMPORT_LIMITS.FILE_WARN_BYTES) {
    return {
      ok: true,
      warn: true,
      message: `Large file (${formatBytes(size)}) — import may be slow or freeze the page.`,
    }
  }
  return { ok: true, warn: false }
}

export function checkParsedSize(rows: number, cols: number): LimitCheck {
  if (rows > IMPORT_LIMITS.ROW_HARD) {
    return {
      ok: false,
      warn: false,
      message: `Too many rows (${rows.toLocaleString()}). Max ${IMPORT_LIMITS.ROW_HARD.toLocaleString()}.`,
    }
  }
  const cells = rows * cols
  if (cells > IMPORT_LIMITS.CELL_HARD) {
    return {
      ok: false,
      warn: false,
      message: `Too many cells (${cells.toLocaleString()} = ${rows.toLocaleString()} × ${cols}). Max ${IMPORT_LIMITS.CELL_HARD.toLocaleString()}.`,
    }
  }
  if (rows > IMPORT_LIMITS.ROW_WARN) {
    return {
      ok: true,
      warn: true,
      message: `Large import (${rows.toLocaleString()} rows) — may slow down rendering.`,
    }
  }
  return { ok: true, warn: false }
}

// localStorage quota 추정 — quota error 발생 시 명시 메시지 만들기 helper.
// 실제 quota는 try/catch로 잡고, 이 helper로 메시지 통일.
export function quotaExceededMessage(
  approxAdded: number,
): string {
  return `Storage full — workspace may already be near the 5–10MB browser limit. Tried to add ${formatBytes(
    approxAdded,
  )}. Consider deleting old boards, exporting before import, or splitting the file.`
}

// quota error detect — browser별 error 이름이 다양
export function isQuotaError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const name = err.name
  return (
    name === "QuotaExceededError" ||
    name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    err.message.toLowerCase().includes("quota") ||
    err.message.toLowerCase().includes("storage")
  )
}

// localStorage 사용량 추정 — 모든 key+value length 합 (UTF-16 가정 × 2가 정확하지만 char count도 충분 대략).
// SSR 안전 — typeof localStorage check.
export function currentLocalStorageBytes(): number {
  if (typeof localStorage === "undefined") return 0
  let total = 0
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (!k) continue
      const v = localStorage.getItem(k) ?? ""
      total += k.length + v.length
    }
  } catch {
    // 일부 환경 (e.g. SecurityError) — 0 반환
    return 0
  }
  return total
}

// 추정: 5MB가 안전 — Safari/Firefox 한계.
// 10MB 넘으면 거의 모든 브라우저에서 fail.
export const STORAGE_QUOTA_WARN_BYTES = 5 * 1024 * 1024
export const STORAGE_QUOTA_HARD_BYTES = 10 * 1024 * 1024

// 추가하려는 payload 크기 추정 — JSON.stringify length 그대로 (대략 char count).
export function estimatePayloadBytes(payload: unknown): number {
  try {
    return JSON.stringify(payload).length
  } catch {
    return 0
  }
}

// 현재 + 추가 size로 storage 체크. import 전 사전 확인.
export function checkStorageBudget(addedBytes: number): LimitCheck {
  const current = currentLocalStorageBytes()
  const total = current + addedBytes
  if (total > STORAGE_QUOTA_HARD_BYTES) {
    return {
      ok: false,
      warn: false,
      message: `Workspace storage would exceed browser limit. Current ${formatBytes(
        current,
      )} + ${formatBytes(addedBytes)} = ${formatBytes(
        total,
      )} (browser cap ~${formatBytes(STORAGE_QUOTA_HARD_BYTES)}).`,
    }
  }
  if (total > STORAGE_QUOTA_WARN_BYTES) {
    return {
      ok: true,
      warn: true,
      message: `Workspace will use ${formatBytes(total)} of storage (${formatBytes(
        STORAGE_QUOTA_WARN_BYTES,
      )} is the safe Safari/Firefox limit). Save may fail.`,
    }
  }
  return { ok: true, warn: false }
}
