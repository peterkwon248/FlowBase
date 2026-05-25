// FlowBase V2 — Import Step 1: 데이터 붙여넣기
// 설계: docs/02-design/features/flowbase-v2-phase3.design.md §4
// 출처: design-ref/prototype/import-modal.jsx Step1Paste

"use client"

import { useRef } from "react"
import { Check, Sparkles, Upload } from "lucide-react"
import { toast } from "sonner"
import {
  IMPORT_LIMITS,
  checkFileSize,
  formatBytes,
} from "@/lib/import-limits"
import {
  IMPORT_SOURCE_LABELS,
  type ImportSource,
} from "@/lib/import-normalizers"
import { stringifyDelimited, type ParsedTable } from "@/lib/parsers"

interface ImportStepPasteProps {
  raw: string
  parsed: ParsedTable | null
  columnCount: number
  source?: ImportSource
  onChange: (text: string) => void
  onUseSample: () => void
}

export function ImportStepPaste({
  raw,
  parsed,
  columnCount,
  source = "generic",
  onChange,
  onUseSample,
}: ImportStepPasteProps) {
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File | undefined) => {
    if (!file) return
    // 1) file size pre-check — hard block / warn confirm
    const sizeCheck = checkFileSize(file)
    if (!sizeCheck.ok) {
      toast.error(sizeCheck.message)
      return
    }
    if (sizeCheck.warn) {
      const proceed = window.confirm(
        `${sizeCheck.message}\n\nProceed anyway?`,
      )
      if (!proceed) return
    }

    // 2) xlsx (Excel) — binary. Web Worker로 parse → CSV로 변환 후 기존 flow에 합류.
    // transferable buffer로 worker에 zero-copy 전달. UI freeze ❌.
    const isXlsx =
      /\.xlsx?$/i.test(file.name) ||
      file.type.includes("spreadsheetml") ||
      file.type.includes("ms-excel")
    if (isXlsx) {
      try {
        const buf = await file.arrayBuffer()
        const { parseXlsxAsync } = await import("@/lib/xlsx-loader")
        const table = await parseXlsxAsync(buf)
        if (table.headers.length === 0 && table.rows.length === 0) {
          toast.warning("Empty Excel file — no rows found.")
          onChange("")
          return
        }
        onChange(stringifyDelimited(table, ","))
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown error"
        toast.error(`Failed to read Excel file — ${msg}`)
      }
      return
    }
    // 3) 텍스트(CSV/TSV/MD/TXT) — 기존 reader
    const reader = new FileReader()
    reader.onload = () => onChange(String(reader.result ?? ""))
    reader.onerror = () => toast.error("Failed to read file.")
    reader.readAsText(file)
  }

  const detected = parsed != null && parsed.rows.length > 0

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-[13px] font-medium">Paste data</span>
        <span className="text-[11.5px] text-muted-foreground">
          CSV · TSV · Markdown · Excel — auto-detect format
        </span>
        <div className="flex-1" />
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,.txt,.md,.markdown,.xlsx,.xls"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11.5px] text-muted-foreground hover:bg-foreground/[0.05]"
        >
          <Upload className="size-3" />
          Choose file
        </button>
        <button
          type="button"
          onClick={onUseSample}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-card px-2 py-1 text-[11.5px] text-muted-foreground hover:bg-foreground/[0.05]"
        >
          <Sparkles className="size-3 text-primary" />
          Use sample
        </button>
      </div>

      <textarea
        autoFocus
        value={raw}
        onChange={(e) => onChange(e.target.value)}
        placeholder={
          "Paste rows here — from Google Sheets, Excel, Notion, CSV, anywhere…\n\nname, company, date, quote\nLee Junho, Petal, 2026-05-18, Pricing is a bit steep…"
        }
        className="h-60 w-full resize-y rounded-lg border border-border bg-card p-3 font-mono text-[12.5px] leading-relaxed outline-none focus:ring-1 focus:ring-ring"
      />

      {detected && (
        <div className="flex items-center gap-2 rounded-md border border-primary/30 bg-primary/[0.06] px-3 py-2.5 text-[12.5px]">
          <Check className="size-3.5 shrink-0 text-primary" />
          <span className="font-medium">
            {parsed?.format?.toUpperCase()} detected — {parsed?.rows.length}{" "}
            rows · {columnCount} columns
          </span>
          {source !== "generic" && (
            <span
              data-import-source={source}
              className="ml-auto rounded bg-primary/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-primary"
            >
              {IMPORT_SOURCE_LABELS[source]}
            </span>
          )}
        </div>
      )}
      {!detected && raw.trim() !== "" && (
        <div className="rounded-md border border-border bg-muted px-3 py-2.5 text-[12.5px] text-muted-foreground">
          Couldn't parse — verify CSV, TSV, or Markdown table format.
        </div>
      )}

      <div className="text-[10.5px] leading-relaxed text-muted-foreground/80">
        Limits: up to {formatBytes(IMPORT_LIMITS.FILE_HARD_BYTES)} per file ·{" "}
        {IMPORT_LIMITS.ROW_HARD.toLocaleString()} rows ·{" "}
        {IMPORT_LIMITS.CELL_HARD.toLocaleString()} cells. Above{" "}
        {formatBytes(IMPORT_LIMITS.FILE_WARN_BYTES)} or{" "}
        {IMPORT_LIMITS.ROW_WARN.toLocaleString()} rows may slow the page.
      </div>
    </div>
  )
}
