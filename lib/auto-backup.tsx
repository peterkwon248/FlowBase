// FlowBase V2 — 자동 snapshot backup (G4-2)
// 30분 interval로 lastChange.timestamp 검사 → 직전 backup 후 변경 있었으면 자동 snapshot.
// label prefix "Auto · " — 사용자 명시 snapshot과 구분. cap 5개 자동 trim.
// LOCK:
//   - 사용자 명시 save와 분리 (별 prefix)
//   - 자동 trim은 "Auto · " prefix만 cap (사용자 명시 snapshot은 영원 유지)
//   - tab inactive 시 setInterval pause는 브라우저 native 동작 (별 처리 ❌)
//   - localStorage에 lastAutoBackupTs persist — page reload 후에도 30분 base 유지

"use client"

import { useEffect } from "react"
import { useFlowBase } from "@/lib/flowbase-store"

const AUTO_BACKUP_INTERVAL_MS = 30 * 60 * 1000 // 30분
const AUTO_BACKUP_CAP = 5 // 자동 snapshot 최대 개수
const LS_LAST_BACKUP = "flowbase-auto-backup-ts"
const AUTO_PREFIX = "Auto · "

function fmtTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function readLastBackupTs(): number {
  if (typeof window === "undefined") return 0
  const raw = window.localStorage.getItem(LS_LAST_BACKUP)
  const n = raw ? Number(raw) : 0
  return Number.isFinite(n) ? n : 0
}

function writeLastBackupTs(ts: number) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(LS_LAST_BACKUP, String(ts))
}

// 자동 snapshot 만들고 cap 초과 시 가장 오래된 auto snapshot 삭제.
function runAutoBackup() {
  const s = useFlowBase.getState()
  const lastChangeTs = s.lastChange?.timestamp ?? 0
  const lastBackupTs = readLastBackupTs()

  // 변경 없으면 skip — 빈 snapshot 의미 ❌
  if (lastChangeTs <= lastBackupTs) return

  const now = Date.now()
  const label = `${AUTO_PREFIX}${fmtTime(new Date(now))}`

  s.saveSnapshot(label, "auto-backup")
  writeLastBackupTs(now)

  // cap — Auto prefix 5개 초과면 오래된 것 trim. 직접 setState로 자동 prefix만 필터.
  const after = useFlowBase.getState()
  const autoSnaps = after.snapshots
    .filter((sn) => sn.label.startsWith(AUTO_PREFIX))
    .sort((a, b) => a.ts - b.ts)
  if (autoSnaps.length > AUTO_BACKUP_CAP) {
    const toRemove = autoSnaps.slice(0, autoSnaps.length - AUTO_BACKUP_CAP)
    for (const sn of toRemove) {
      after.deleteSnapshot(sn.id)
    }
  }
}

export function AutoBackupRuntime() {
  useEffect(() => {
    // mount 시 즉시 한 번 (직전 30분 안 변경 있었으면)
    runAutoBackup()
    const id = window.setInterval(runAutoBackup, AUTO_BACKUP_INTERVAL_MS)
    return () => window.clearInterval(id)
  }, [])
  return null
}
