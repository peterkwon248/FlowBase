// FlowBase V2 — Formula editor Dialog (G7-C C-F4)
// column-header-menu의 "Edit formula"가 진입점. parse 라이브 검증 + dependsOn 미리보기.

"use client"

import { useMemo, useState } from "react"
import { Calculator, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useFlowBase } from "@/lib/flowbase-store"
import { extractDeps, parseFormula } from "@/lib/formula"
import type { ColumnDef, FormulaResultType } from "@/types/flowbase"

interface FormulaEditorDialogProps {
  col: ColumnDef
  open: boolean
  onOpenChange: (o: boolean) => void
}

const RESULT_TYPES: { value: FormulaResultType; label: string }[] = [
  { value: "text", label: "Text" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "boolean", label: "Boolean (Yes / No)" },
]

const EXAMPLES = [
  {
    label: "Concat columns",
    src: 'concat(prop("name"), " · ", prop("status"))',
  },
  {
    label: "If statement",
    src: 'if(prop("priority") == "Urgent", "🚨 urgent", "OK")',
  },
  { label: "Math", src: 'mul(prop("price"), prop("quantity"))' },
  { label: "Today", src: "today()" },
]

export function FormulaEditorDialog({
  col,
  open,
  onOpenChange,
}: FormulaEditorDialogProps) {
  const updateColumn = useFlowBase((s) => s.updateColumn)
  const [src, setSrc] = useState(col.formula ?? "")
  const [resultType, setResultType] = useState<FormulaResultType>(
    col.formulaResultType ?? "text",
  )

  // open 토글 시 col에서 fresh로
  // (controlled dialog — open=true로 바뀔 때 col 변화 반영)
  // simple: key prop으로 강제 remount. 또는 useEffect로 sync.

  const validation = useMemo(() => {
    if (!src.trim()) return { ok: true, deps: [] as string[], hint: "Empty" }
    try {
      const ast = parseFormula(src)
      return { ok: true, deps: extractDeps(ast), hint: "" }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return { ok: false, deps: [], hint: msg }
    }
  }, [src])

  const handleSave = () => {
    updateColumn(col.name, {
      formula: src,
      formulaResultType: resultType,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator
              className="size-4 text-muted-foreground"
              strokeWidth={1.75}
            />
            Edit formula — {col.label || col.name}
          </DialogTitle>
          <DialogDescription className="text-[12px]">
            Reference other columns with{" "}
            <code className="rounded bg-muted px-1 font-mono">
              prop(&quot;name&quot;)
            </code>
            . Functions: concat · if · add/sub/mul/div · round · lower · upper ·
            length · today · format.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="formula-src" className="text-[12px]">
              Expression
            </Label>
            <textarea
              id="formula-src"
              value={src}
              onChange={(e) => setSrc(e.target.value)}
              spellCheck={false}
              className="min-h-[120px] w-full resize-y rounded-md border border-border bg-background px-2.5 py-2 font-mono text-[12px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder='concat(prop("name"), " · ", prop("status"))'
              autoFocus
            />
            {src.trim() && (
              <div
                className={`text-[11px] ${
                  validation.ok ? "text-emerald-600" : "text-rose-500"
                }`}
              >
                {validation.ok ? (
                  <>
                    ✓ Valid
                    {validation.deps.length > 0 && (
                      <span className="ml-2 text-muted-foreground">
                        Depends on:{" "}
                        {validation.deps.map((d, i) => (
                          <span key={d}>
                            {i > 0 && ", "}
                            <code className="rounded bg-muted px-1 font-mono">
                              {d}
                            </code>
                          </span>
                        ))}
                      </span>
                    )}
                  </>
                ) : (
                  <>⚠ {validation.hint}</>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="formula-result-type" className="text-[12px]">
              Result type
            </Label>
            <Select
              value={resultType}
              onValueChange={(v) => setResultType(v as FormulaResultType)}
            >
              <SelectTrigger
                id="formula-result-type"
                className="h-8 text-[12px]"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESULT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Examples
            </div>
            <ul className="space-y-0.5">
              {EXAMPLES.map((ex) => (
                <li key={ex.src}>
                  <button
                    type="button"
                    onClick={() => setSrc(ex.src)}
                    className="w-full rounded px-2 py-1 text-left text-[11.5px] hover:bg-foreground/[0.04]"
                  >
                    <span className="text-muted-foreground">{ex.label}:</span>{" "}
                    <code className="font-mono">{ex.src}</code>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!validation.ok}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
