// FlowBase V2 — Import 다이얼로그 (3-step 위저드)
// 설계: docs/02-design/features/flowbase-v2-phase3.design.md §4·6·7
// 출처: design-ref/prototype/import-modal.jsx ImportModal
//
// Paste → Review → AI columns → 새 제네릭 보드 생성 (design D1).

"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  type AnalyzeImportRes,
  ThrottleError,
  analyzeImport,
} from "@/lib/flowbase-ai"
import { SENTIMENT_OPTIONS, THEME_OPTIONS } from "@/lib/flowbase-seed"
import { useFlowBase } from "@/lib/flowbase-store"
import {
  IMPORT_LIMITS,
  checkParsedSize,
  checkStorageBudget,
  estimatePayloadBytes,
  isQuotaError,
  quotaExceededMessage,
} from "@/lib/import-limits"
import {
  IMPORT_SOURCE_LABELS,
  type ImportSource,
  detectImportSource,
  inferColumnTypeByHeader,
  mapStatus,
  normalizeImportHeaders,
} from "@/lib/import-normalizers"
import { splitMultiValue } from "@/lib/multi-select"
import { parseAnyAsync } from "@/lib/parse-async"
import {
  type ParsedTable,
  inferType,
  normalizeHeader,
  parseAny,
} from "@/lib/parsers"
import { cn } from "@/lib/utils"
import type { ColumnDef, ColumnType, TableRow, TicketStatus } from "@/types/flowbase"
import { ImportStepAi } from "./import-step-ai"
import { ImportStepPaste } from "./import-step-paste"
import { ImportStepReview, type WizardColumn } from "./import-step-review"

// 프로토타입 import-modal.jsx SAMPLE_CSV
const SAMPLE_CSV = `id,name,company,date,status,quote
INT-101,Lee Junho,Petal,2026-05-18,todo,"Is there a free plan? The pricing is a bit steep."
INT-102,Mira Tan,Forge,2026-05-17,progress,"Creating new columns isn't intuitive."
INT-103,Park Jisoo,Halo,2026-05-16,done,"AI suggestions are great — saves a lot of time."
INT-104,Eli Park,Solo PM,2026-05-15,waiting,"Wish share link permissions were simpler."
INT-105,Yuna Kim,Drift,2026-05-15,todo,"Pasting from Excel doesn't work well."`

// status 값 매핑은 lib/import-normalizers.ts의 mapStatus로 이동 (단위 테스트 가능)

function widthForType(t: ColumnType): number {
  switch (t) {
    case "num":
      return 96
    case "date":
      return 110
    case "status":
      return 116
    case "select":
      return 140
    case "email":
      return 180
    default:
      return 200
  }
}

// 파싱 결과 + 헤더 여부 → WizardColumn[] (중복 헤더는 _N suffix, D5)
// source != 'generic'면 Notion/Airtable 시스템 헤더를 표준 라벨로 normalize.
// type 추론 우선순위 (Im-3 강화):
//   1. header pattern (예: "Status" → status, "Created at" → date) — Notion/Airtable 자동 인식
//   2. sample value inferType — fallback (header에 단서 없으면)
function buildColumns(
  p: ParsedTable | null,
  header: boolean,
  source: ImportSource = "generic",
): WizardColumn[] {
  if (!p || p.rows.length === 0) return []
  const rawFirst = p.rows[0]
  const first = header
    ? normalizeImportHeaders(rawFirst, source)
    : rawFirst
  const dataRows = header ? p.rows.slice(1) : p.rows
  const used = new Set<string>()
  return first.map((cell, i) => {
    const base = header ? normalizeHeader(cell, i) : `col_${i + 1}`
    let name = base
    let suffix = 2
    while (used.has(name)) name = `${base}_${suffix++}`
    used.add(name)
    const label = (header ? cell : `Column ${i + 1}`) || `Column ${i + 1}`
    // header pattern 우선, sample inferType은 fallback
    const headerType = header ? inferColumnTypeByHeader(label) : null
    const sampleType = inferType(dataRows.slice(0, 50).map((r) => r[i]))
    return {
      name,
      label,
      type: headerType ?? sampleType,
    }
  })
}

const STEPS = ["Paste", "Review", "AI columns"]

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const createBoard = useFlowBase((s) => s.createBoard)
  const switchBoard = useFlowBase((s) => s.switchBoard)

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [raw, setRaw] = useState("")
  const [parsed, setParsed] = useState<ParsedTable | null>(null)
  const [headerRow, setHeaderRow] = useState(true)
  const [columns, setColumns] = useState<WizardColumn[]>([])
  const [source, setSource] = useState<ImportSource>("generic")
  const [aiTheme, setAiTheme] = useState(false)
  const [aiSentiment, setAiSentiment] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [summary, setSummary] = useState<AnalyzeImportRes | null>(null)
  const [analyzeError, setAnalyzeError] = useState(false)

  // 닫히면 초기화
  useEffect(() => {
    if (!open) {
      setStep(1)
      setRaw("")
      setParsed(null)
      setHeaderRow(true)
      setColumns([])
      setSource("generic")
      setAiTheme(false)
      setAiSentiment(false)
      setSummary(null)
      setAnalyzeError(false)
    }
  }, [open])

  const dataRows = useMemo(
    () =>
      parsed ? (headerRow ? parsed.rows.slice(1) : parsed.rows) : [],
    [parsed, headerRow],
  )

  // parse race 방지 — 짧은 시간 안 여러 onChange 시 가장 최근 결과만 적용
  const parseTokenRef = useRef(0)
  const handlePaste = async (text: string) => {
    setRaw(text)
    // 빈 text는 sync로 즉시 reset (worker 호출 안 함)
    if (!text.trim()) {
      setParsed(null)
      setColumns([])
      setSource("generic")
      return
    }
    const myToken = ++parseTokenRef.current
    let p: ParsedTable
    try {
      // Worker로 parse — UI freeze 없이 대용량도 부드러움. fallback은 parse-async 내부.
      p = await parseAnyAsync(text)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "parse failed"
      toast.error(`Parse failed — ${msg}`)
      return
    }
    // race: 더 최근 호출이 있으면 result 버림
    if (myToken !== parseTokenRef.current) return

    // hard limit 체크 — 50,000행 또는 500,000 cells 초과면 거부
    if (p.rows.length > 0) {
      const cols = p.rows[0]?.length ?? 0
      const dataRowCount = p.rows.length - 1 // header 1행 제외 추정
      const sizeCheck = checkParsedSize(Math.max(0, dataRowCount), cols)
      if (!sizeCheck.ok) {
        toast.error(sizeCheck.message)
        setParsed({ format: p.format, rows: [] })
        setColumns([])
        setSource("generic")
        return
      }
    }
    setParsed(p)
    const detected =
      headerRow && p.rows.length > 0
        ? detectImportSource(p.rows[0])
        : "generic"
    setSource(detected)
    setColumns(buildColumns(p, headerRow, detected))
  }

  const toggleHeader = () => {
    const next = !headerRow
    setHeaderRow(next)
    // header 토글 시 source 재계산 (header=false면 source detect 안 함)
    const nextSource =
      next && parsed && parsed.rows.length > 0
        ? detectImportSource(parsed.rows[0])
        : "generic"
    setSource(nextSource)
    setColumns(buildColumns(parsed, next, nextSource))
  }

  const goToReview = () => {
    // warn-tier check — confirm 다이얼로그 (사용자 선택 진행)
    const sizeCheck = checkParsedSize(dataRows.length, columns.length)
    if (sizeCheck.warn) {
      const proceed = window.confirm(
        `${sizeCheck.message}\n\nProceed?`,
      )
      if (!proceed) return
    } else if (!sizeCheck.ok) {
      // 안전망 (handlePaste에서 잡혔어야 함)
      toast.error(sizeCheck.message)
      return
    }
    setStep(2)
  }

  const handleAnalyze = async () => {
    if (!parsed) return
    setAnalyzing(true)
    setAnalyzeError(false)
    try {
      const res = await analyzeImport(
        columns.map((c) => c.label),
        dataRows.slice(0, 15),
      )
      setSummary(res)
      setAiTheme(res.suggestTheme)
      setAiSentiment(res.suggestSentiment)
    } catch (err) {
      setAnalyzeError(true)
      setSummary(null)
      const msg =
        err instanceof ThrottleError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Try again"
      toast.error(`AI analysis failed — ${msg}`)
    } finally {
      setAnalyzing(false)
      setStep(3)
    }
  }

  const handleImport = () => {
    if (!parsed || dataRows.length === 0) return

    const idCol: ColumnDef = {
      name: "id",
      label: "ID",
      type: "text",
      width: 86,
      mono: true,
    }
    // 데이터 컬럼명을 예약명(id·theme·sentiment) 및 서로 간 충돌로부터 dedup
    const reserved = new Set<string>(["id"])
    if (aiTheme) reserved.add("theme")
    if (aiSentiment) reserved.add("sentiment")
    const usedNames = new Set(reserved)
    const resolved = columns.map((c) => {
      let name = c.name
      let suffix = 2
      while (usedNames.has(name)) name = `${c.name}_${suffix++}`
      usedNames.add(name)
      return { ...c, name }
    })
    const dataCols: ColumnDef[] = resolved.map((c) => ({
      name: c.name,
      label: c.label,
      type: c.type,
      width: widthForType(c.type),
    }))
    const aiCols: ColumnDef[] = []
    if (aiTheme) {
      aiCols.push({
        name: "theme",
        label: "Theme",
        type: "select",
        width: 180,
        ai: true,
        options: THEME_OPTIONS,
      })
    }
    if (aiSentiment) {
      aiCols.push({
        name: "sentiment",
        label: "Sentiment",
        type: "select",
        width: 112,
        ai: true,
        options: SENTIMENT_OPTIONS,
      })
    }
    const boardColumns = [idCol, ...dataCols, ...aiCols]

    const rows: TableRow[] = dataRows.map((cells, idx) => {
      const row: TableRow = {
        id: `ROW-${String(idx + 1).padStart(3, "0")}`,
        themeConfirmed: !aiTheme,
        sentimentConfirmed: !aiSentiment,
      }
      resolved.forEach((c, i) => {
        const v = cells[i] ?? ""
        if (c.type === "status") {
          row[c.name] = mapStatus(v)
        } else if (c.type === "multiSelect") {
          // CSV cell "tag1, tag2" → ["tag1","tag2"]. 빈 값/공백은 제거 + 중복 제거.
          row[c.name] = splitMultiValue(v)
        } else {
          row[c.name] = v
        }
      })
      return row
    })

    const label = (summary?.rowKind ?? "").trim() || "Imported data"

    // storage 사전 가드 — payload 크기 추정 + 현재 localStorage 사용량 + browser quota 비교
    const payloadBytes = estimatePayloadBytes({ boardColumns, rows })
    const budget = checkStorageBudget(payloadBytes)
    if (!budget.ok) {
      toast.error(budget.message)
      return
    }
    if (budget.warn) {
      const proceed = window.confirm(`${budget.message}\n\nProceed anyway?`)
      if (!proceed) return
    }

    try {
      const boardId = createBoard(label, boardColumns, rows)
      switchBoard(boardId)
      onOpenChange(false)
      toast.success(`Imported ${rows.length} rows into "${label}"`)
    } catch (err) {
      // zustand persist가 sync setItem 시 throw하면 잡힘.
      // QuotaExceededError이면 명시 메시지, 그 외는 generic.
      if (isQuotaError(err)) {
        toast.error(quotaExceededMessage(payloadBytes))
      } else {
        const msg = err instanceof Error ? err.message : "unknown error"
        toast.error(`Import failed — ${msg}`)
      }
    }
  }

  const canContinue = parsed != null && dataRows.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-3rem)] flex-col gap-0 p-0 sm:max-w-4xl">
        <DialogHeader className="flex-row items-center gap-3 border-b border-border-subtle px-5 py-3.5">
          <div className="flex flex-col gap-0.5">
            <DialogTitle className="text-sm">Import data</DialogTitle>
            <DialogDescription className="text-[11.5px]">
              Paste from Google Sheets, Excel, Notion, CSV, or Markdown table
            </DialogDescription>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1 text-[11px]">
            {STEPS.map((label, i) => {
              const target = (i + 1) as 1 | 2 | 3
              // Step 1 (Paste) — 항상 가능. Step 2 (Review) — parsed 있어야. Step 3 (AI columns) — Review 통과 후만.
              const canJump =
                target === 1 ||
                (target === 2 && canContinue) ||
                (target === 3 && canContinue && step >= 3)
              const isActive = step === target
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    if (canJump && !isActive) setStep(target)
                  }}
                  disabled={!canJump}
                  data-import-step-nav={target}
                  title={
                    canJump
                      ? `Go to ${label}`
                      : target === 2
                        ? "Paste data first"
                        : "Review columns first"
                  }
                  className={cn(
                    "rounded px-1.5 py-0.5 transition-colors",
                    isActive
                      ? "bg-primary/15 font-semibold text-primary"
                      : canJump
                        ? "bg-muted text-muted-foreground hover:bg-foreground/[0.08] hover:text-foreground cursor-pointer"
                        : "bg-muted text-muted-foreground/50 cursor-not-allowed",
                  )}
                >
                  {target}. {label}
                </button>
              )
            })}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          {step === 1 && (
            <ImportStepPaste
              raw={raw}
              parsed={parsed}
              columnCount={columns.length}
              source={source}
              onChange={handlePaste}
              onUseSample={() => handlePaste(SAMPLE_CSV)}
            />
          )}
          {step === 2 && (
            <ImportStepReview
              columns={columns}
              dataRows={dataRows}
              headerRow={headerRow}
              onColumnsChange={setColumns}
              onToggleHeader={toggleHeader}
            />
          )}
          {step === 3 && (
            <ImportStepAi
              summary={summary}
              analyzeError={analyzeError}
              aiTheme={aiTheme}
              aiSentiment={aiSentiment}
              onToggleTheme={() => setAiTheme((v) => !v)}
              onToggleSentiment={() => setAiSentiment((v) => !v)}
            />
          )}
        </div>

        <div className="flex items-center gap-2.5 border-t border-border-subtle px-5 py-3">
          <span className="text-xs text-muted-foreground">
            {canContinue &&
              `${dataRows.length} rows · ${columns.length} columns`}
          </span>
          <div className="flex-1" />

          {step === 1 && (
            <>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] text-muted-foreground hover:bg-foreground/[0.05]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={goToReview}
                disabled={!canContinue}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-foreground disabled:opacity-50"
              >
                Continue
                <ChevronRight className="size-3.5" />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] text-muted-foreground hover:bg-foreground/[0.05]"
              >
                <ChevronLeft className="size-3.5" />
                Back
              </button>
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={analyzing}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-foreground disabled:opacity-60"
              >
                {analyzing ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                {analyzing ? "Analyzing…" : "Analyze with AI"}
              </button>
            </>
          )}

          {step === 3 && (
            <>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] text-muted-foreground hover:bg-foreground/[0.05]"
              >
                <ChevronLeft className="size-3.5" />
                Back
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-foreground"
              >
                <Check className="size-3.5" />
                Import {dataRows.length} rows
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
