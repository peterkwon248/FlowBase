// FlowBase V2 — Automation 런타임 엔진 (active 룰 발화)
// 출처 컨셉: design-ref/prototype/{automation-engine,rule-engine}.jsx
//
// 동작
// 1. store.lastChange를 useEffect로 구독 → 변경 발생할 때마다 active 룰 스캔.
// 2. matches(rule.when, change)가 true면 executeRule.
// 3. executeRule은 then 배열 순회하며 액션 실행 + testRunAutomation(id)로
//    runsThisWeek++ 카운트.
//
// 시간 기반 트리거 (v1)
// - setInterval 1분 tick.
// - "every day at HH:MM" — 현재 시각이 HH:MM ± 30초 윈도우면 발화. dedupe:
//   같은 날짜 한 번만 (firedKey = `${ruleId}:${YYYY-MM-DD}`).
// - "due date passes [+ status=X]" — 행마다 1회 (firedKey =
//   `${ruleId}:${boardId}:${rowId}`). 행 due가 오늘 이전 + status match.
//
// 액션: Notify(toast), Set/Set status(updateRow), Add row to(addRowToBoard)
// 외 미지원은 toast로 stub 알림.

"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { useFlowBase } from "@/lib/flowbase-store"
import type {
  AutomationRule,
  AutomationStep,
  AutomationTrigger,
  Board,
  ChangeEvent,
  ColumnDef,
  TableRow,
} from "@/types/flowbase"

// ─── 시간 기반 트리거 파서 + 매칭 ────────────────────────────────────

export type TimeTrigger =
  | { kind: "daily"; hour: number; minute: number }
  | { kind: "dueDate"; statusEquals?: string }
  | null

// when.event 텍스트를 시간 트리거 종류로 분류. null이면 row-event 트리거.
export function parseTimeTrigger(when: AutomationTrigger): TimeTrigger {
  if (when.table && when.table !== "—") {
    // table-based but might still be time. 둘 다일 수 있음.
  }
  const event = (when.event ?? "").toLowerCase()
  const value = (when.value ?? "").trim()

  // "every day at" — value에 "09:00", "9:30 KST" 같은 시간.
  if (event.includes("every day at")) {
    const m = value.match(/(\d{1,2}):(\d{2})/)
    if (m) {
      const hour = parseInt(m[1], 10)
      const minute = parseInt(m[2], 10)
      if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
        return { kind: "daily", hour, minute }
      }
    }
  }

  // "due date passes [and status is]"
  if (event.includes("due date passes")) {
    const statusEquals = value && value !== "" ? value : undefined
    return { kind: "dueDate", statusEquals }
  }

  return null
}

// daily: 현재 분이 정확히 매치되어야 발화 (1분 tick이라 가능).
export function shouldFireDaily(
  trigger: { kind: "daily"; hour: number; minute: number },
  now: Date,
): boolean {
  return now.getHours() === trigger.hour && now.getMinutes() === trigger.minute
}

// dueDate: row.due가 today 이전 + status 일치 시 발화.
export function shouldFireDueDate(
  trigger: { kind: "dueDate"; statusEquals?: string },
  row: TableRow,
  now: Date,
): boolean {
  const due = row.due
  if (typeof due !== "string" || !due) return false
  const dueDate = new Date(due)
  if (!Number.isFinite(dueDate.getTime())) return false
  // due가 오늘보다 이전 (자정 기준)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (dueDate.getTime() >= today.getTime()) return false
  if (trigger.statusEquals) {
    return row.status === trigger.statusEquals
  }
  return true
}

// ─── 매칭 ──────────────────────────────────────────────────────────

function normalizeTableName(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, "")
}

function tableMatches(when: AutomationTrigger, boardId: string, boardLabel: string): boolean {
  if (!when.table || when.table === "—") return false
  const w = normalizeTableName(when.table)
  return (
    w === normalizeTableName(boardId) ||
    w === normalizeTableName(boardLabel)
  )
}

export function matches(
  rule: AutomationRule,
  change: ChangeEvent,
  boardLabel: string,
): boolean {
  if (rule.status !== "active") return false
  if (!tableMatches(rule.when, change.boardId, boardLabel)) return false

  const event = rule.when.event.toLowerCase()
  const value = rule.when.value

  // row_added: "row added or sentiment changes to" — value=Negative
  // → 매칭 조건: 새 행이고 sentiment === value (또는 단순 row added)
  if (change.kind === "row_added") {
    if (event.includes("row added")) {
      // value 조건이 명시되어 있으면 검증
      if (event.includes("changes to") || event.includes("=")) {
        const cellValueMatches = matchesValue(change.next, event, value)
        return cellValueMatches
      }
      return true
    }
  }

  if (change.kind === "row_updated") {
    // "sentiment changes to" Negative
    if (event.includes("sentiment changes to")) {
      return change.next.sentiment === value && change.prev?.sentiment !== value
    }
    // "AI Theme confirmed as" — confirmed가 false → true 전이 + theme === value
    if (event.includes("ai theme confirmed as")) {
      return (
        change.prev?.themeConfirmed === false &&
        change.next.themeConfirmed === true &&
        change.next.theme === value
      )
    }
    // "row added or sentiment changes to" — updated 경로도 같은 룰이 발화
    if (event.includes("sentiment") && event.includes("changes to")) {
      return change.next.sentiment === value && change.prev?.sentiment !== value
    }
  }

  return false
}

// event 텍스트로부터 어떤 필드가 value와 일치해야 하는지 추측. 휴리스틱.
function matchesValue(row: TableRow, event: string, value: string): boolean {
  const fields = ["sentiment", "theme", "status", "priority"] as const
  for (const f of fields) {
    if (event.includes(f) && row[f] === value) return true
  }
  return false
}

// ─── 실행 ──────────────────────────────────────────────────────────

function executeRule(rule: AutomationRule, change: ChangeEvent): void {
  const s = useFlowBase.getState()

  // runs/lastRun 갱신
  s.testRunAutomation(rule.id)

  // AI Activity timeline에 기록 — 트리거 보드의 aiHistory에 append (current board 컨텍스트)
  const triggerBoard = s.boards[change.boardId]
  if (triggerBoard && s.activeBoardId === change.boardId) {
    s.pushAi({
      kind: "manual",
      title: `Automation: ${rule.name}`,
      detail: `${rule.when.event} → ${rule.then.map((t) => t.action).join(", ")}`,
      status: "applied",
      rowIds: [change.rowId],
    })
  }

  for (const step of rule.then) {
    try {
      executeStep(rule, step, change)
    } catch (err) {
      toast.error(`Automation step failed (${rule.name})`, {
        description: String(err),
      })
    }
  }
}

function executeStep(
  rule: AutomationRule,
  step: AutomationStep,
  change: ChangeEvent,
): void {
  const s = useFlowBase.getState()
  const action = step.action.toLowerCase()

  if (action.includes("notify")) {
    toast.info(`🔔 ${rule.name}`, {
      description: `Notify ${step.target}${step.detail ? ` · ${step.detail}` : ""}`,
    })
    return
  }

  if (action === "set" || action.startsWith("set ")) {
    // "Set" target=priority detail=High  OR  "Set status" target=tasks detail=Waiting
    // 트리거 row가 있는 보드 기준으로 패치 — column=target, value=detail.
    const board = s.boards[change.boardId]
    if (!board) return
    // "Set status"인 경우: target=field name이 아닌 경우라도 status로 처리
    const isSetStatus = action.includes("status")
    const fieldKey = isSetStatus ? "status" : step.target
    if (!fieldKey || !step.detail) return
    // detail이 "field: value" 형식이면 parse
    let key = fieldKey
    let val: string = step.detail
    if (step.detail.includes(":")) {
      const [k, v] = step.detail.split(":").map((x) => x.trim())
      key = k
      val = v
    }
    s.updateRow(change.rowId, { [key]: val })
    toast.success(`✓ ${rule.name}`, {
      description: `Set ${key}=${val} on ${change.rowId}`,
    })
    return
  }

  if (action.includes("add row")) {
    // step.target = target board label/id
    const targetBoardId = findBoardId(step.target)
    if (!targetBoardId) {
      toast.warning(`Automation: target board "${step.target}" not found`)
      return
    }
    // detail이 "title: ..., priority: ..." 형태 → 파싱
    const patch = parseRowDetail(step.detail || "", change.next)
    const newId = s.addRowToBoard(targetBoardId, patch)
    if (newId) {
      toast.success(`✓ ${rule.name}`, {
        description: `Added ${newId} to ${step.target}`,
      })
    }
    return
  }

  // 미지원: Generate / Email to / Archive row 등
  toast.info(`Automation step "${step.action}" not yet implemented (${rule.name})`)
}

function findBoardId(target: string): string | null {
  const s = useFlowBase.getState()
  const t = normalizeTableName(target)
  for (const b of Object.values(s.boards)) {
    if (
      normalizeTableName(b.id) === t ||
      normalizeTableName(b.label) === t
    ) {
      return b.id
    }
  }
  return null
}

// detail 문자열 파싱: 'title: "Follow up with {name}", priority: Urgent'
// {name} 같은 토큰은 source row 값으로 치환.
export function parseRowDetail(detail: string, source: TableRow): Partial<TableRow> {
  const out: Partial<TableRow> = {}
  // 쉼표로 분할, key: value 페어
  const pairs = detail.split(",").map((s) => s.trim()).filter(Boolean)
  for (const p of pairs) {
    const m = p.match(/^([a-zA-Z_]+)\s*:\s*(.+)$/)
    if (!m) continue
    const k = m[1]
    let v = m[2].trim().replace(/^["']|["']$/g, "")
    // {token} 치환
    v = v.replace(/\{(\w+)\}/g, (_, key) => {
      const src = source[key]
      return src == null ? "" : String(src)
    })
    out[k] = v
  }
  return out
}

// ─── Attached function 실행 ──────────────────────────────────────────
//
// 컬럼에 attachFunctionToColumn으로 functionId가 설정된 경우, row 변경 시
// 해당 함수를 실행해 컬럼 값을 자동 계산.
//
// 지원 (v1)
// - MATCH_FROM_DROPDOWN: 같은 행의 첫 text-ish 컬럼을 source로 삼아 column.options
//   substring 매치. 첫 매치값 set. options 없으면 skip.
// - AI_CLASSIFY: graceful toast (실 호출은 별도 inferBatch 경로 사용 권장).
// - EXTRACT_REGEX: skip (regex 파라미터 정의 UI 미구현).
//
// dedupe: 같은 (rowId, colName) 키를 같은 timestamp로 한 번만 처리.

function findSourceField(board: Board, targetCol: string): string | null {
  for (const c of board.columns) {
    if (c.name === targetCol) continue
    if (c.name === "id") continue
    if (c.type === "text" || c.type === "select") return c.name
  }
  return null
}

function runMatchFromDropdown(
  boardId: string,
  rowId: string,
  row: TableRow,
  col: ColumnDef,
): { changed: boolean; value?: string } {
  const s = useFlowBase.getState()
  const board = s.boards[boardId]
  if (!board || !col.options || col.options.length === 0) {
    return { changed: false }
  }
  const sourceField = findSourceField(board, col.name)
  if (!sourceField) return { changed: false }
  const sourceText = String(row[sourceField] ?? "").toLowerCase()
  if (!sourceText) return { changed: false }
  for (const opt of col.options) {
    if (sourceText.includes(opt.toLowerCase())) {
      // 같은 값이면 skip
      if (row[col.name] === opt) return { changed: false }
      // updateRow는 active board 대상 → 다른 보드면 직접 patch
      if (boardId === s.activeBoardId) {
        s.updateRow(rowId, { [col.name]: opt })
      } else {
        // active 아닌 보드는 publishChange 없는 직접 patch
        const ts = new Date().toISOString()
        const target = s.boards[boardId]
        if (!target) return { changed: false }
        useFlowBase.setState({
          boards: {
            ...s.boards,
            [boardId]: {
              ...target,
              rows: target.rows.map((r) =>
                r.id === rowId
                  ? { ...r, [col.name]: opt, updatedAt: ts }
                  : r,
              ),
              updatedAt: ts,
            },
          },
        })
      }
      return { changed: true, value: opt }
    }
  }
  return { changed: false }
}

function runAttachedFunctions(change: ChangeEvent): void {
  const s = useFlowBase.getState()
  const board = s.boards[change.boardId]
  if (!board) return
  const wired = board.columns.filter((c) => c.functionId)
  if (wired.length === 0) return

  for (const col of wired) {
    const fn = s.library.functions.find((f) => f.id === col.functionId)
    if (!fn) continue
    if (fn.name === "MATCH_FROM_DROPDOWN") {
      const result = runMatchFromDropdown(
        change.boardId,
        change.rowId,
        change.next,
        col,
      )
      if (result.changed) {
        toast.success(`✨ ${fn.name}`, {
          description: `Set ${col.label || col.name} = ${result.value}`,
        })
      }
    } else if (fn.name === "AI_CLASSIFY") {
      // 실제 inferBatch 호출은 AI 패널의 명시적 Apply all 플로우로. 여기는 hint.
      // 토스트 폭주 방지: row_added만 알림.
      if (change.kind === "row_added") {
        toast.info(`${fn.name} ready for ${col.label || col.name}`, {
          description: "Open the AI panel to apply classifications.",
        })
      }
    } else {
      // EXTRACT_REGEX 등 — UI 미구현.
      if (change.kind === "row_added") {
        toast.info(
          `${fn.name} on ${col.label || col.name} — runtime pending`,
        )
      }
    }
  }
}

// ─── 시간 기반 fire (executeRule 재사용하되 change는 합성) ────────────

function syntheticChange(boardId: string, rowId: string, row: TableRow): ChangeEvent {
  return {
    kind: "row_updated",
    boardId,
    rowId,
    next: row,
    prev: row,
    timestamp: Date.now(),
  }
}

// ─── firedKeys persist (localStorage) ─────────────────────────────────
//
// 페이지 새로고침 후에도 같은 daily/dueDate 트리거 중복 발화 ❌.
// daily 키 형식: `${ruleId}:YYYY-MM-DD` (30일 이전 자동 cleanup)
// dueDate 키 형식: `${ruleId}:${boardId}:${rowId}` (보드/행 살아있는 동안 유지)

const FIRED_KEYS_STORAGE_KEY = "flowbase-automation-firedKeys-v1"
const DAILY_KEY_TTL_MS = 30 * 86_400_000

function loadFiredKeys(): Set<string> {
  try {
    const raw = localStorage.getItem(FIRED_KEYS_STORAGE_KEY)
    if (!raw) return new Set()
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return new Set()
    // 30일 이전 daily 키 제거
    const cutoff = Date.now() - DAILY_KEY_TTL_MS
    const filtered = (parsed as string[]).filter((k) => {
      const m = k.match(/^[^:]+:(\d{4})-(\d{2})-(\d{2})$/)
      if (!m) return true // dueDate or other format — keep
      const t = new Date(`${m[1]}-${m[2]}-${m[3]}`).getTime()
      return Number.isFinite(t) && t >= cutoff
    })
    return new Set(filtered)
  } catch {
    return new Set()
  }
}

function saveFiredKeys(keys: Set<string>): void {
  try {
    localStorage.setItem(
      FIRED_KEYS_STORAGE_KEY,
      JSON.stringify(Array.from(keys)),
    )
  } catch {
    // quota 초과 / private mode 등 silent fail
  }
}

function checkTimeTriggers(firedKeys: Set<string>): void {
  const s = useFlowBase.getState()
  const now = new Date()
  const dayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`
  const beforeSize = firedKeys.size

  for (const rule of s.automations) {
    if (rule.status !== "active") continue
    const trigger = parseTimeTrigger(rule.when)
    if (!trigger) continue

    if (trigger.kind === "daily") {
      const key = `${rule.id}:${dayKey}`
      if (firedKeys.has(key)) continue
      if (!shouldFireDaily(trigger, now)) continue
      firedKeys.add(key)
      // 합성 change (boardId="" — Notify/Generate 액션 위주라 OK)
      executeRule(rule, {
        kind: "row_updated",
        boardId: "",
        rowId: "",
        next: { id: "" },
        timestamp: now.getTime(),
      })
    }

    if (trigger.kind === "dueDate") {
      // 모든 보드의 행 스캔 (rule.when.table 매치는 휴리스틱)
      for (const board of Object.values(s.boards)) {
        // 테이블 라벨이 명시되어 있으면 match
        const w = (rule.when.table ?? "").trim().toLowerCase()
        if (
          w &&
          w !== "—" &&
          w !== board.id.toLowerCase() &&
          w !== board.label.toLowerCase()
        ) {
          continue
        }
        for (const row of board.rows) {
          if (!shouldFireDueDate(trigger, row, now)) continue
          const key = `${rule.id}:${board.id}:${row.id}`
          if (firedKeys.has(key)) continue
          firedKeys.add(key)
          executeRule(rule, syntheticChange(board.id, row.id, row))
        }
      }
    }
  }

  // 새 키가 추가됐을 때만 localStorage 저장 (불필요한 IO 회피)
  if (firedKeys.size !== beforeSize) {
    saveFiredKeys(firedKeys)
  }
}

// ─── 컴포넌트 (셸에 mount) ──────────────────────────────────────────

const TIME_TICK_MS = 60_000 // 1분

export function AutomationRuntime() {
  const lastChange = useFlowBase((s) => s.lastChange)
  // automations는 zustand 구독으로 받고, 핸들러에서 getState로 항상 fresh 액세스
  const handledRef = useRef<number>(0)
  // 시간 기반 발화 dedupe 키 — localStorage persist (페이지 새로고침 후에도 유지).
  const firedKeysRef = useRef<Set<string>>(new Set())

  // row 변경 트리거 — automation rules + attached functions 둘 다
  useEffect(() => {
    if (!lastChange) return
    if (lastChange.timestamp === handledRef.current) return
    handledRef.current = lastChange.timestamp

    const s = useFlowBase.getState()
    const board = s.boards[lastChange.boardId]
    const boardLabel = board?.label ?? lastChange.boardId

    // 1) Attached functions 먼저 실행 (자동 채움이 자동화의 트리거가 될 수 있도록)
    runAttachedFunctions(lastChange)

    // 2) Automation rules
    for (const rule of s.automations) {
      if (matches(rule, lastChange, boardLabel)) {
        executeRule(rule, lastChange)
      }
    }
  }, [lastChange])

  // 시간 기반 트리거 — 1분 tick. mount 즉시 1회 + 이후 60s마다.
  useEffect(() => {
    // mount 시 localStorage에서 firedKeys 복원 (30일 이전 daily 자동 cleanup).
    firedKeysRef.current = loadFiredKeys()
    checkTimeTriggers(firedKeysRef.current)
    const id = setInterval(
      () => checkTimeTriggers(firedKeysRef.current),
      TIME_TICK_MS,
    )

    // 외부에서 firedKeys 변경 시 (permanentDeleteBoard cleanup 등) — ref 즉시 reload.
    // 다음 1분 tick 기다리지 않고 stale ref 해소.
    const onChanged = () => {
      firedKeysRef.current = loadFiredKeys()
    }
    window.addEventListener("flowbase-firedkeys-changed", onChanged)

    return () => {
      clearInterval(id)
      window.removeEventListener("flowbase-firedkeys-changed", onChanged)
    }
  }, [])

  return null
}
