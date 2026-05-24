// FlowBase V2 — Automation 런타임 엔진 (active 룰 발화)
// 출처 컨셉: design-ref/prototype/{automation-engine,rule-engine}.jsx
//
// 동작
// 1. store.lastChange를 useEffect로 구독 → 변경 발생할 때마다 active 룰 스캔.
// 2. matches(rule.when, change)가 true면 executeRule.
// 3. executeRule은 then 배열 순회하며 액션 실행 + testRunAutomation(id)로
//    runsThisWeek++ 카운트.
//
// 제한 (v0)
// - row_added · sentiment changes to · AI Theme confirmed as 트리거만 지원.
// - 시간 기반 트리거(every day at, due date passes)는 skip (별도 cron 레이어 필요).
// - 액션: Notify(toast), Set/Set status(updateRow), Add row to(addRowToBoard)
//   외 미지원은 toast로 stub 알림.

"use client"

import { useEffect, useRef } from "react"
import { toast } from "sonner"
import { useFlowBase } from "@/lib/flowbase-store"
import type {
  AutomationRule,
  AutomationStep,
  AutomationTrigger,
  ChangeEvent,
  TableRow,
} from "@/types/flowbase"

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

// ─── 컴포넌트 (셸에 mount) ──────────────────────────────────────────

export function AutomationRuntime() {
  const lastChange = useFlowBase((s) => s.lastChange)
  // automations는 zustand 구독으로 받고, 핸들러에서 getState로 항상 fresh 액세스
  const handledRef = useRef<number>(0)

  useEffect(() => {
    if (!lastChange) return
    if (lastChange.timestamp === handledRef.current) return
    handledRef.current = lastChange.timestamp

    const s = useFlowBase.getState()
    const board = s.boards[lastChange.boardId]
    const boardLabel = board?.label ?? lastChange.boardId
    for (const rule of s.automations) {
      if (matches(rule, lastChange, boardLabel)) {
        executeRule(rule, lastChange)
      }
    }
  }, [lastChange])

  return null
}
