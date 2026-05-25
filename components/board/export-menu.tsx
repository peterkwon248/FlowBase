// FlowBase V2 — Board export menu (CSV / Markdown)
// 출처: 상용화 backlog Im-1 — CSV/MD 양방향. lib/parsers의 stringify 사용.
//
// active board → CSV 또는 Markdown 파일로 다운로드. viewer도 사용 가능 (read-only).
// JSON 전체 export는 Settings > Data에 별도 유지 (워크스페이스 단위).
//
// LOCK:
//   - status/select 값은 raw 그대로 (한국어 키 보존 — round-trip 정확도)
//   - 파일명: `{boardLabel-sanitized}-YYYYMMDD.{ext}`

"use client"

import { useRef } from "react"
import { Download, FileSpreadsheet, FileText, Hash } from "lucide-react"
import { toast } from "sonner"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  boardToTable,
  stringifyDelimited,
  stringifyMarkdownTable,
} from "@/lib/parsers"
import { selectActiveBoard, useFlowBase } from "@/lib/flowbase-store"

function todayStr(): string {
  return new Date().toISOString().slice(0, 10).replace(/-/g, "")
}

// 파일명 sanitize — 공백/특수문자 → -. 길이 cap.
function sanitize(label: string): string {
  return (
    label
      .trim()
      .replace(/[\s/\\:*?"<>|]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "board"
  )
}

export function ExportMenu() {
  const board = useFlowBase(selectActiveBoard)
  const anchorRef = useRef<HTMLAnchorElement>(null)

  if (!board) return null

  const triggerDownload = (content: string, filename: string, mime: string) => {
    const a = anchorRef.current
    if (!a) return
    const blob = new Blob([content], { type: mime })
    triggerBlobDownload(blob, filename)
  }

  const triggerBlobDownload = (blob: Blob, filename: string) => {
    const a = anchorRef.current
    if (!a) return
    const url = URL.createObjectURL(blob)
    a.href = url
    a.download = filename
    a.click()
    // Safari/Chrome 호환 — revoke는 다음 tick에
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const exportCsv = () => {
    const table = boardToTable(board)
    const csv = stringifyDelimited(table, ",")
    const filename = `${sanitize(board.label)}-${todayStr()}.csv`
    triggerDownload(csv, filename, "text/csv;charset=utf-8")
    toast.success(`Exported ${filename}`, {
      id: "export-csv",
      description: `${board.rows.length} rows · ${board.columns.length} columns`,
    })
  }

  const exportMarkdown = () => {
    const table = boardToTable(board)
    const md = stringifyMarkdownTable(table)
    const filename = `${sanitize(board.label)}-${todayStr()}.md`
    triggerDownload(md, filename, "text/markdown;charset=utf-8")
    toast.success(`Exported ${filename}`, {
      id: "export-md",
      description: `${board.rows.length} rows · ${board.columns.length} columns`,
    })
  }

  const exportXlsx = async () => {
    const filename = `${sanitize(board.label)}-${todayStr()}.xlsx`
    const toastId = toast.loading("Building Excel file…", { id: "export-xlsx" })
    try {
      // dynamic import — xlsx lib은 lazy load (main bundle 보호 LOCK)
      const { tableToXlsxBlob } = await import("@/lib/xlsx-loader")
      const table = boardToTable(board)
      const blob = await tableToXlsxBlob(table, sanitize(board.label).slice(0, 31))
      triggerBlobDownload(blob, filename)
      toast.success(`Exported ${filename}`, {
        id: toastId,
        description: `${board.rows.length} rows · ${board.columns.length} columns`,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown error"
      toast.error(`Excel export failed — ${msg}`, { id: toastId })
    }
  }

  return (
    <>
      {/* hidden anchor — Blob 다운로드 트리거 (Settings > Data 패턴 답습) */}
      <a ref={anchorRef} className="hidden" aria-hidden />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            data-action="export-menu"
            className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-foreground/[0.05]"
          >
            <Download className="size-3" strokeWidth={1.75} />
            Export
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuLabel className="text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
            Export this board
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={exportCsv}
            className="gap-2 text-[12px]"
            data-export="csv"
          >
            <FileText className="size-3" strokeWidth={1.75} />
            <span className="flex-1">CSV</span>
            <span className="text-[10px] text-muted-foreground">.csv</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={exportMarkdown}
            className="gap-2 text-[12px]"
            data-export="md"
          >
            <Hash className="size-3" strokeWidth={1.75} />
            <span className="flex-1">Markdown table</span>
            <span className="text-[10px] text-muted-foreground">.md</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={exportXlsx}
            className="gap-2 text-[12px]"
            data-export="xlsx"
          >
            <FileSpreadsheet className="size-3" strokeWidth={1.75} />
            <span className="flex-1">Excel</span>
            <span className="text-[10px] text-muted-foreground">.xlsx</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
