// FlowBase V2 — Import 다이얼로그 (3-step 위저드)
// 설계: docs/02-design/features/flowbase-v2-phase3.design.md §4·6·7
// 출처: design-ref/prototype/import-modal.jsx ImportModal
//
// Paste → Review → AI columns → 새 제네릭 보드 생성 (design D1).

"use client"

import { useEffect, useMemo, useState } from "react"
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
INT-101,Lee Junho,Petal,2026-05-18,todo,"가격이 좀 부담스러운데 무료 플랜이 있나요"
INT-102,Mira Tan,Forge,2026-05-17,progress,"새 컬럼 만드는 게 한 번에 안 보여요"
INT-103,Park Jisoo,Halo,2026-05-16,done,"AI 추천이 너무 좋아요. 시간 절약됨"
INT-104,Eli Park,Solo PM,2026-05-15,waiting,"공유 링크 권한 단순했으면"
INT-105,Yuna Kim,Drift,2026-05-15,todo,"엑셀에서 붙여넣기가 잘 안 됨"`

// status 텍스트 → 한국어 enum (IMPORT-SPEC §3). status type 컬럼에만 적용 (D3).
function mapStatus(v: string): TicketStatus {
  const m = v.toLowerCase()
  if (/done|완료|complete/.test(m)) return "완료"
  if (/progress|진행/.test(m)) return "진행중"
  if (/wait|대기|hold/.test(m)) return "대기"
  return "미처리"
}

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
function buildColumns(p: ParsedTable | null, header: boolean): WizardColumn[] {
  if (!p || p.rows.length === 0) return []
  const first = p.rows[0]
  const dataRows = header ? p.rows.slice(1) : p.rows
  const used = new Set<string>()
  return first.map((cell, i) => {
    const base = header ? normalizeHeader(cell, i) : `col_${i + 1}`
    let name = base
    let suffix = 2
    while (used.has(name)) name = `${base}_${suffix++}`
    used.add(name)
    return {
      name,
      label: (header ? cell : `Column ${i + 1}`) || `Column ${i + 1}`,
      type: inferType(dataRows.slice(0, 50).map((r) => r[i])),
    }
  })
}

const STEPS = ["붙여넣기", "검토", "AI 컬럼"]

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

  const handlePaste = (text: string) => {
    setRaw(text)
    const p = parseAny(text)
    setParsed(p)
    setColumns(buildColumns(p, headerRow))
  }

  const toggleHeader = () => {
    const next = !headerRow
    setHeaderRow(next)
    setColumns(buildColumns(parsed, next))
  }

  const goToReview = () => {
    if (dataRows.length > 1000) {
      toast.warning("대용량 import — 잠시 걸릴 수 있습니다.")
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
            : "다시 시도하세요"
      toast.error(`AI 분석 실패 — ${msg}`)
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
        row[c.name] = c.type === "status" ? mapStatus(v) : v
      })
      return row
    })

    const label = (summary?.rowKind ?? "").trim() || "가져온 데이터"
    const boardId = createBoard(label, boardColumns, rows)
    switchBoard(boardId)
    onOpenChange(false)
    toast.success(`${rows.length}개 행을 "${label}" 보드로 가져왔습니다.`)
  }

  const canContinue = parsed != null && dataRows.length > 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[calc(100dvh-3rem)] flex-col gap-0 p-0 sm:max-w-4xl">
        <DialogHeader className="flex-row items-center gap-3 border-b border-border-subtle px-5 py-3.5">
          <div className="flex flex-col gap-0.5">
            <DialogTitle className="text-sm">데이터 가져오기</DialogTitle>
            <DialogDescription className="text-[11.5px]">
              Google Sheets · Excel · Notion · CSV / Markdown 표를 붙여넣으세요
            </DialogDescription>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1 text-[11px]">
            {STEPS.map((label, i) => (
              <span
                key={label}
                className={cn(
                  "rounded px-1.5 py-0.5",
                  step === i + 1
                    ? "bg-primary/15 font-semibold text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {i + 1}. {label}
              </span>
            ))}
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-auto p-5">
          {step === 1 && (
            <ImportStepPaste
              raw={raw}
              parsed={parsed}
              columnCount={columns.length}
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
              `${dataRows.length}행 · ${columns.length}컬럼`}
          </span>
          <div className="flex-1" />

          {step === 1 && (
            <>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] text-muted-foreground hover:bg-foreground/[0.05]"
              >
                취소
              </button>
              <button
                type="button"
                onClick={goToReview}
                disabled={!canContinue}
                className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-foreground disabled:opacity-50"
              >
                계속
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
                뒤로
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
                {analyzing ? "분석 중…" : "AI로 분석"}
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
                뒤로
              </button>
              <button
                type="button"
                onClick={handleImport}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-semibold text-primary-foreground"
              >
                <Check className="size-3.5" />
                {dataRows.length}개 행 가져오기
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
