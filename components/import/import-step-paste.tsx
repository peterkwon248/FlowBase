// FlowBase V2 — Import Step 1: 데이터 붙여넣기
// 설계: docs/02-design/features/flowbase-v2-phase3.design.md §4
// 출처: design-ref/prototype/import-modal.jsx Step1Paste

"use client"

import { useRef } from "react"
import { Check, Sparkles, Upload } from "lucide-react"
import type { ParsedTable } from "@/lib/parsers"

interface ImportStepPasteProps {
  raw: string
  parsed: ParsedTable | null
  columnCount: number
  onChange: (text: string) => void
  onUseSample: () => void
}

export function ImportStepPaste({
  raw,
  parsed,
  columnCount,
  onChange,
  onUseSample,
}: ImportStepPasteProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onChange(String(reader.result ?? ""))
    reader.readAsText(file)
  }

  const detected = parsed != null && parsed.rows.length > 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-medium">데이터 붙여넣기</span>
        <span className="text-[11.5px] text-muted-foreground">
          CSV · TSV · Markdown 표 — 포맷 자동 감지
        </span>
        <div className="flex-1" />
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,.txt"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11.5px] text-muted-foreground hover:bg-foreground/[0.05]"
        >
          <Upload className="size-3" />
          파일 선택
        </button>
        <button
          type="button"
          onClick={onUseSample}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11.5px] text-muted-foreground hover:bg-foreground/[0.05]"
        >
          <Sparkles className="size-3 text-primary" />
          샘플 사용
        </button>
      </div>

      <textarea
        autoFocus
        value={raw}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          "여기에 행을 붙여넣으세요 — Google Sheets · Excel · Notion · CSV 어디서든…\n\nname, company, date, quote\nLee Junho, Petal, 2026-05-18, 가격이 부담스러워요…"
        }
        className="h-60 w-full resize-y rounded-lg border border-border bg-card p-3 font-mono text-[12.5px] leading-relaxed outline-none focus:ring-1 focus:ring-ring"
      />

      {detected && (
        <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/[0.06] px-3 py-2.5 text-[12.5px]">
          <Check className="size-3.5 shrink-0 text-primary" />
          <span className="font-medium">
            {parsed?.format?.toUpperCase()} 감지 — {parsed?.rows.length}행 ·{" "}
            {columnCount}컬럼
          </span>
        </div>
      )}
      {!detected && raw.trim() !== "" && (
        <div className="rounded-md border border-border bg-muted px-3 py-2.5 text-[12.5px] text-muted-foreground">
          데이터를 인식하지 못했습니다 — CSV · TSV · Markdown 표 형식인지
          확인하세요.
        </div>
      )}
    </div>
  )
}
