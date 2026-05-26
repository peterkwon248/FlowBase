// FlowBase V2 — lib/import-limits.ts 테스트

import { describe, expect, it } from "vitest"
import {
  IMPORT_LIMITS,
  checkFileSize,
  checkParsedSize,
  formatBytes,
  isQuotaError,
  quotaExceededMessage,
} from "@/lib/import-limits"

function mkFile(bytes: number): File {
  // size 직접 set 어려움 — File 생성 시 ArrayBuffer 크기로
  const buf = new Uint8Array(bytes)
  return new File([buf], "test.csv", { type: "text/csv" })
}

describe("formatBytes", () => {
  it("단위별 사람 친화 표시", () => {
    expect(formatBytes(512)).toBe("512 B")
    expect(formatBytes(2048)).toBe("2.0 KB")
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB")
    expect(formatBytes(2 * 1024 * 1024 * 1024)).toBe("2.00 GB")
  })
})

describe("checkFileSize", () => {
  it("작은 파일 → ok", () => {
    const r = checkFileSize(mkFile(100))
    expect(r.ok).toBe(true)
    expect(r.warn).toBe(false)
  })
  it("10MB 초과 → warn", () => {
    const r = checkFileSize(mkFile(IMPORT_LIMITS.FILE_WARN_BYTES + 1))
    expect(r.ok).toBe(true)
    expect(r.warn).toBe(true)
    if (r.ok && r.warn) {
      expect(r.message).toMatch(/Large file/)
    }
  })
  it("50MB 초과 → block", () => {
    const r = checkFileSize(mkFile(IMPORT_LIMITS.FILE_HARD_BYTES + 1))
    expect(r.ok).toBe(false)
    expect(r.warn).toBe(false)
    if (!r.ok) {
      expect(r.message).toMatch(/File too large/)
      expect(r.message).toMatch(/Max 50.0 MB/)
    }
  })
})

describe("checkParsedSize", () => {
  it("작은 데이터 → ok", () => {
    const r = checkParsedSize(100, 10)
    expect(r.ok).toBe(true)
    expect(r.warn).toBe(false)
  })
  it("5,000행 초과 → warn", () => {
    const r = checkParsedSize(5_001, 10)
    expect(r.ok).toBe(true)
    expect(r.warn).toBe(true)
    if (r.ok && r.warn) {
      expect(r.message).toMatch(/Large import/)
    }
  })
  it("50,000행 초과 → block", () => {
    const r = checkParsedSize(50_001, 10)
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.message).toMatch(/Too many rows/)
      expect(r.message).toMatch(/Max 50,000/)
    }
  })
  it("500,000 cells 초과 → block (rows × cols)", () => {
    const r = checkParsedSize(10_000, 60) // 600,000 cells
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.message).toMatch(/Too many cells/)
    }
  })
})

describe("isQuotaError", () => {
  it("QuotaExceededError name detect", () => {
    const err = new Error("Quota exceeded")
    err.name = "QuotaExceededError"
    expect(isQuotaError(err)).toBe(true)
  })
  it("Firefox NS_ERROR_DOM_QUOTA_REACHED detect", () => {
    const err = new Error("test")
    err.name = "NS_ERROR_DOM_QUOTA_REACHED"
    expect(isQuotaError(err)).toBe(true)
  })
  it("message에 'quota' 또는 'storage' 포함하면 detect", () => {
    expect(isQuotaError(new Error("LocalStorage quota full"))).toBe(true)
    expect(isQuotaError(new Error("Storage limit reached"))).toBe(true)
  })
  it("일반 에러 → false", () => {
    expect(isQuotaError(new Error("network error"))).toBe(false)
    expect(isQuotaError(null)).toBe(false)
    expect(isQuotaError("string error")).toBe(false)
  })
})

describe("quotaExceededMessage", () => {
  it("추가 크기 포함된 안내 메시지", () => {
    const msg = quotaExceededMessage(2 * 1024 * 1024)
    expect(msg).toMatch(/Storage full/)
    expect(msg).toMatch(/2.0 MB/)
    expect(msg).toMatch(/deleting old boards|exporting|splitting/)
  })
})
