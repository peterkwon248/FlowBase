// FlowBase V2 — Import Step 2: 컬럼 검토
// 설계: docs/02-design/features/flowbase-v2-phase3.design.md §4
// 출처: design-ref/prototype/import-modal.jsx Step2Review

"use client"

import { TYPE_ICON } from "@/components/sheet/header-cell"
import type { ColumnType } from "@/types/flowbase"
import { cn } from "@/lib/utils"

// Import 위저드가 다루는 컬럼 (보드 ColumnDef로 커밋 전 임시 형태)
export interface WizardColumn {
  name: string
  label: string
  type: ColumnType
}

// 사용자가 Review에서 고를 수 있는 타입.
// Im-3 후속: avatar 추가 — Notion/Airtable의 Person/Assigned to 컬럼을 자연 매핑.
// reaction/button/fk는 여전히 비대상 (cell value가 복합 객체).
const TYPE_OPTIONS: ColumnType[] = [
  "text",
  "num",
  "date",
  "email",
  "select",
  "status",
  "avatar",
]

interface ImportStepReviewProps {
  columns: WizardColumn[]
  dataRows: string[][]
  headerRow: boolean
  onColumnsChange: (cols: WizardColumn[]) => void
  onToggleHeader: () => void
}

export function ImportStepReview({
  columns,
  dataRows,
  headerRow,
  onColumnsChange,
  onToggleHeader,
}: ImportStepReviewProps) {
  const preview = dataRows.slice(0, 8)

  const updateColumn = (idx: number, patch: Partial<WizardColumn>) => {
    onColumnsChange(
      columns.map((c, i) => (i === idx ? { ...c, ...patch } : c)),
    )
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex items-center gap-3">
        <span className="text-[13px] font-medium">Review columns</span>
        <span className="text-[11.5px] text-muted-foreground">
          Type auto-detected — click to change.
        </span>
        <div className="flex-1" />
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-[12.5px]">
          <input
            type="checkbox"
            checked={headerRow}
            onChange={onToggleHeader}
          />
          First row is header
        </label>
      </div>

      <div className="overflow-auto rounded-lg border border-border bg-card">
        <table className="w-full border-separate border-spacing-0 text-[12.5px]">
          <thead>
            <tr>
              {columns.map((col, i) => {
                const Icon = TYPE_ICON[col.type]
                return (
                  <th
                    key={i}
                    className="sticky top-0 min-w-[140px] border-b border-r border-border-subtle bg-surface px-3 py-2.5 text-left last:border-r-0"
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon
                        className="size-3.5 shrink-0 text-muted-foreground"
                        strokeWidth={1.5}
                      />
                      <input
                        value={col.label}
                        onChange={(e) =>
                          updateColumn(i, { label: e.target.value })
                        }
                        className="w-full bg-transparent text-[12.5px] font-semibold outline-none"
                      />
                    </div>
                    <select
                      value={col.type}
                      onChange={(e) =>
                        updateColumn(i, {
                          type: e.target.value as ColumnType,
                        })
                      }
                      className="mt-1 rounded border border-border-subtle bg-muted px-1 py-0.5 font-mono text-[11px] text-muted-foreground outline-none"
                    >
                      {TYPE_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {preview.map((row, ri) => (
              <tr key={ri}>
                {columns.map((col, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      "max-w-[240px] truncate border-b border-r border-border-subtle px-3 py-1.5 last:border-r-0",
                      ri === preview.length - 1 && "border-b-0",
                      (col.type === "num" || col.type === "date") &&
                        "font-mono text-muted-foreground",
                    )}
                  >
                    {row[ci] || (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <span className="text-[11.5px] tabular-nums text-muted-foreground">
        {dataRows.length} rows · {columns.length} columns
        {dataRows.length > 8 && ` · previewing 8 rows`}
      </span>
    </div>
  )
}
