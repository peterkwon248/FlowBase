// FlowBase V2 — Data cleanup dialog (B4, AI)
// 사용자가 명시 click → 컬럼 값 분포 수집 → AI에 typo 통합 제안 요청.
// 각 제안은 개별 Apply (col 전체에서 from→to 일괄 변경). Dismiss로 무시.
// LOCK: 자동 적용 ❌ — 모든 변경은 사용자 클릭.

"use client"

import { useMemo, useState } from "react"
import { ArrowRight, Sparkles, Wand2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useFlowBase } from "@/lib/flowbase-store"
import type { Board } from "@/types/flowbase"

interface Suggestion {
  col: string
  from: string
  to: string
  reason: string
}

interface CleanupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  board: Board
}

// 컬럼별 distinct value + count — typo 후보 source.
function collectValues(board: Board) {
  return board.columns
    .filter(
      (c) =>
        c.name !== "id" &&
        (c.type === "status" ||
          c.type === "select" ||
          c.type === "multiSelect" ||
          c.type === "text" ||
          c.type === "avatar"),
    )
    .map((c) => {
      const counts = new Map<string, number>()
      for (const r of board.rows) {
        const v = r[c.name]
        if (v == null || v === "") continue
        const keys: string[] = Array.isArray(v)
          ? v.map((x) => (x == null ? "" : String(x).trim())).filter(Boolean)
          : [String(v).trim()]
        for (const k of keys) {
          if (!k) continue
          counts.set(k, (counts.get(k) ?? 0) + 1)
        }
      }
      return {
        name: c.name,
        label: c.label,
        type: c.type,
        values: Array.from(counts.entries())
          .map(([value, count]) => ({ value, count }))
          .sort((a, b) => b.count - a.count),
      }
    })
    .filter((c) => c.values.length >= 2)
}

export function CleanupDialog({ open, onOpenChange, board }: CleanupDialogProps) {
  const updateRow = useFlowBase((s) => s.updateRow)

  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null)
  const [applied, setApplied] = useState<Set<number>>(new Set())
  const [dismissed, setDismissed] = useState<Set<number>>(new Set())

  const candidateCount = useMemo(() => collectValues(board).length, [board])

  const analyze = async () => {
    if (loading) return
    setLoading(true)
    setSuggestions(null)
    setApplied(new Set())
    setDismissed(new Set())
    try {
      const cols = collectValues(board)
      const res = await fetch("/api/ai/suggest-cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          boardLabel: board.label,
          columns: cols,
        }),
      })
      const data = (await res.json()) as {
        suggestions?: Suggestion[]
        error?: string
      }
      if (!res.ok) {
        toast.error(data.error || "AI cleanup failed")
        return
      }
      setSuggestions(data.suggestions ?? [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI call failed")
    } finally {
      setLoading(false)
    }
  }

  const applyOne = (s: Suggestion, idx: number) => {
    let changed = 0
    for (const r of board.rows) {
      const v = r[s.col]
      if (Array.isArray(v)) {
        if (v.includes(s.from)) {
          const next = v.map((x) => (x === s.from ? s.to : x))
          // dedupe
          const seen = new Set<string>()
          const dedupNext: string[] = []
          for (const k of next) {
            const ks = String(k)
            if (!seen.has(ks)) {
              seen.add(ks)
              dedupNext.push(ks)
            }
          }
          updateRow(r.id, { [s.col]: dedupNext })
          changed += 1
        }
      } else if (typeof v === "string" && v === s.from) {
        updateRow(r.id, { [s.col]: s.to })
        changed += 1
      }
    }
    setApplied((prev) => new Set(prev).add(idx))
    toast.success(`Applied: ${changed} row${changed === 1 ? "" : "s"} merged`)
  }

  const remaining = suggestions
    ? suggestions.filter((_, i) => !applied.has(i) && !dismissed.has(i)).length
    : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="size-4 text-primary" />
            Cleanup suggestions
          </DialogTitle>
          <DialogDescription className="text-[12px]">
            AI scans value spellings and proposes safe merges (Todo / todo / TODO). All merges
            require your click.
          </DialogDescription>
        </DialogHeader>

        {!suggestions && (
          <div className="rounded-md border border-border-subtle bg-card p-4 text-center">
            <Sparkles className="mx-auto mb-2 size-6 text-primary" />
            <div className="mb-1 text-[13px] font-medium">
              Analyze {candidateCount} column
              {candidateCount === 1 ? "" : "s"} with AI
            </div>
            <p className="mb-3 text-[11.5px] text-muted-foreground">
              No automatic changes. Each suggestion is yours to accept or skip.
            </p>
            <Button
              size="sm"
              onClick={analyze}
              disabled={loading || candidateCount === 0}
              data-action="cleanup-analyze"
            >
              {loading ? "Analyzing…" : "Analyze"}
            </Button>
          </div>
        )}

        {suggestions && suggestions.length === 0 && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4 text-center text-[12px] text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
            ✓ No obvious typos or duplicates found.
          </div>
        )}

        {suggestions && suggestions.length > 0 && (
          <div className="max-h-[400px] space-y-2 overflow-y-auto">
            {suggestions.map((s, i) => {
              const isApplied = applied.has(i)
              const isDismissed = dismissed.has(i)
              if (isApplied || isDismissed) return null
              const col = board.columns.find((c) => c.name === s.col)
              return (
                <div
                  key={i}
                  data-cleanup-suggestion={i}
                  className="rounded-md border border-border-subtle bg-card p-2.5"
                >
                  <div className="mb-1 text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
                    {col?.label || s.col}
                  </div>
                  <div className="flex items-center gap-2 text-[12.5px]">
                    <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400">
                      {s.from}
                    </span>
                    <ArrowRight className="size-3 shrink-0 text-muted-foreground" />
                    <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                      {s.to}
                    </span>
                  </div>
                  {s.reason && (
                    <div className="mt-1 text-[11px] text-muted-foreground">
                      {s.reason}
                    </div>
                  )}
                  <div className="mt-2 flex gap-1.5">
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => applyOne(s, i)}
                      className="h-6 px-2 text-[11px]"
                      data-action="cleanup-apply"
                    >
                      Apply
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setDismissed((prev) => new Set(prev).add(i))
                      }
                      className="h-6 px-2 text-[11px] text-muted-foreground"
                    >
                      <X className="mr-0.5 size-3" />
                      Skip
                    </Button>
                  </div>
                </div>
              )
            })}
            {remaining === 0 && (
              <div className="rounded-md border border-border-subtle bg-muted/30 p-3 text-center text-[12px] text-muted-foreground">
                All suggestions resolved.
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {suggestions && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSuggestions(null)
              }}
            >
              Re-analyze
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
