// FlowBase V2 — Formula editor Dialog (G7-C C-F4)
// column-header-menu의 "Edit formula"가 진입점. parse 라이브 검증 + dependsOn 미리보기.

"use client"

import { useMemo, useRef, useState } from "react"
import { Calculator } from "lucide-react"
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
import { TYPE_ICON } from "@/components/sheet/header-cell"
import { selectActiveBoard, useFlowBase } from "@/lib/flowbase-store"
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
  { label: "Multi-select join", src: 'joinProp("tags", " · ")' },
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
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Q6-B3: 컬럼 autocomplete — board.columns 리스트에서 prop("name") 형태로 삽입.
  // 자기 자신은 제외 (순환 의존 가드는 store에 있지만 UI에서도 미리 차단).
  const board = useFlowBase(selectActiveBoard)
  const availableColumns = useMemo(() => {
    if (!board) return []
    return board.columns.filter((c) => c.name !== col.name && c.name !== "id")
  }, [board, col.name])

  // 컬럼 chip 클릭 시 textarea cursor 위치에 prop("name") 삽입.
  const insertProp = (colName: string) => {
    const ta = textareaRef.current
    const snippet = `prop("${colName}")`
    if (!ta) {
      // ref 없으면 append
      setSrc((prev) => prev + snippet)
      return
    }
    const start = ta.selectionStart ?? src.length
    const end = ta.selectionEnd ?? src.length
    const next = src.slice(0, start) + snippet + src.slice(end)
    setSrc(next)
    // cursor를 삽입 후 위치로
    requestAnimationFrame(() => {
      if (!ta) return
      const pos = start + snippet.length
      ta.focus()
      ta.setSelectionRange(pos, pos)
    })
  }

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
            . Functions: concat · if · add/sub/mul/div · round · abs/mod/floor/
            ceil · lower/upper/length/trim · contains/startsWith/endsWith/
            replace · today/format/dateAdd/weekOfYear · joinProp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="formula-src" className="text-[12px]">
              Expression
            </Label>
            <textarea
              id="formula-src"
              ref={textareaRef}
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

          {/* Q6-B3: 사용 가능한 컬럼 chip — 클릭 시 cursor 위치에 prop("name") 삽입 */}
          {availableColumns.length > 0 && (
            <div>
              <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                Insert column reference
              </div>
              <div className="flex flex-wrap gap-1">
                {availableColumns.map((c) => {
                  const Icon = TYPE_ICON[c.type] ?? null
                  return (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => insertProp(c.name)}
                      className="inline-flex items-center gap-1 rounded-md border border-border-subtle bg-card px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-foreground/[0.05] hover:text-foreground"
                      title={`Insert prop("${c.name}")`}
                      data-formula-column={c.name}
                    >
                      {Icon && (
                        <Icon className="size-3" strokeWidth={1.75} />
                      )}
                      <span className="font-mono">{c.name}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

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
