// FlowBase V2 — Generate board from AI prompt (G6-2)
// 사용자 입력 prompt → AI가 ColumnDef + seed rows 생성 → preview → Create.
// LOCK: 자동 적용 ❌ (preview 후 Create 클릭 시만 createBoard).

"use client"

import { useState } from "react"
import { Sparkles, Wand2 } from "lucide-react"
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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFlowBase } from "@/lib/flowbase-store"
import type { ColumnDef, TableRow } from "@/types/flowbase"

interface ColumnSpec {
  name: string
  label: string
  type: ColumnDef["type"]
  options?: string[]
}

interface Template {
  label: string
  columns: ColumnSpec[]
  rows: Record<string, unknown>[]
}

interface GenerateBoardDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SUGGESTIONS = [
  "Track customer support tickets",
  "Marketing campaign ROI tracker",
  "Sales pipeline & deals",
  "HR employee performance",
  "Personal habit tracker",
  "Stock portfolio with dividends",
]

export function GenerateBoardDialog({ open, onOpenChange }: GenerateBoardDialogProps) {
  const createBoard = useFlowBase((s) => s.createBoard)
  const switchBoard = useFlowBase((s) => s.switchBoard)
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [template, setTemplate] = useState<Template | null>(null)

  const reset = () => {
    setPrompt("")
    setTemplate(null)
  }

  const handleGenerate = async () => {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setTemplate(null)
    try {
      const res = await fetch("/api/ai/generate-board-template", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim() }),
      })
      const data = (await res.json()) as Template & { error?: string }
      if (!res.ok) {
        toast.error(data.error || "AI generation failed")
        return
      }
      setTemplate({ label: data.label, columns: data.columns, rows: data.rows })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "AI call failed")
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    if (!template) return
    // ColumnSpec → ColumnDef (id 컬럼 store가 자동 추가 — 일부 createBoard 구현 차이 검토 필요)
    const cols: ColumnDef[] = template.columns.map((c) => ({
      name: c.name,
      label: c.label,
      type: c.type,
      width: 140,
      ...(c.options ? { options: c.options } : {}),
    }))
    // seed rows — TableRow 형식. id는 createBoard가 row 인자 받을 때 추가하지 않으면 별도 부여.
    // 안전하게 row id 자동 생성.
    const rows: TableRow[] = template.rows.map((r, i) => ({
      id: `ROW-${String(i + 1).padStart(3, "0")}`,
      ...r,
    }))
    const id = createBoard(template.label, cols, rows)
    switchBoard(id)
    toast.success(`Created "${template.label}" with ${rows.length} rows`)
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reset()
        onOpenChange(o)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="size-4 text-primary" />
            Generate board with AI
          </DialogTitle>
          <DialogDescription className="text-[12px]">
            Describe what you want to track. AI generates columns + a few example rows. You
            review and click Create to apply.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="generate-prompt" className="text-[12px]">
            What do you want to track?
          </Label>
          <Input
            id="generate-prompt"
            autoFocus
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !loading && prompt.trim()) handleGenerate()
            }}
            placeholder="e.g. CS tickets for SaaS — status, customer, priority, SLA hours"
            className="text-[12.5px]"
            disabled={loading}
            data-input="generate-prompt"
          />
          {/* 빠른 시작 suggestion chips */}
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setPrompt(s)}
                disabled={loading}
                className="rounded-full border border-border-subtle px-2 py-0.5 text-[10.5px] text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {template && (
          <div
            data-template-preview
            className="max-h-[280px] space-y-2 overflow-y-auto rounded-md border border-border-subtle bg-card p-3"
          >
            <div className="text-[11.5px] font-semibold text-foreground">
              Suggested: {template.label}
            </div>
            <div className="text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
              Columns ({template.columns.length})
            </div>
            <div className="flex flex-wrap gap-1">
              {template.columns.map((c) => (
                <span
                  key={c.name}
                  className="inline-flex items-center gap-1 rounded border border-border-subtle bg-muted px-1.5 py-0.5 text-[10.5px]"
                >
                  <span className="font-medium">{c.label}</span>
                  <span className="text-muted-foreground">{c.type}</span>
                </span>
              ))}
            </div>
            <div className="mt-2 text-[10.5px] uppercase tracking-[0.06em] text-muted-foreground">
              Sample rows ({template.rows.length})
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[10.5px]">
                <thead>
                  <tr>
                    {template.columns.slice(0, 4).map((c) => (
                      <th key={c.name} className="border-b border-border-subtle px-1.5 py-1 text-left">
                        {c.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {template.rows.slice(0, 3).map((r, i) => (
                    <tr key={i}>
                      {template.columns.slice(0, 4).map((c) => {
                        const v = r[c.name]
                        const display = v == null ? "—" : Array.isArray(v) ? v.join(", ") : String(v)
                        return (
                          <td key={c.name} className="border-b border-border-subtle px-1.5 py-1 text-muted-foreground">
                            {display.slice(0, 30)}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {!template ? (
            <Button
              size="sm"
              onClick={handleGenerate}
              disabled={!prompt.trim() || loading}
              data-action="generate-board"
            >
              <Sparkles className="mr-1 size-3" />
              {loading ? "Generating…" : "Generate"}
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTemplate(null)}
              >
                Re-generate
              </Button>
              <Button
                size="sm"
                onClick={handleCreate}
                data-action="create-from-template"
              >
                Create board
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
