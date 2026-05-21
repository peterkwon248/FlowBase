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

// 사용자가 Review에서 고를 수 있는 타입 (avatar/reaction/button/fk는 import 비대상)
const TYPE_OPTIONS: ColumnType[] = [
  "text",
  "num",
  "date",
  "email",
  "select",
  "status",
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
        <span className="text-[13px] font-medium">컬럼 검토</span>
        <span className="text-[11.5px] text-muted-foreground">
          타입은 자동 감지됩니다 — 클릭해서 변경하세요.
        </span>
        <div className="flex-1" />
        <label className="inline-flex cursor-pointer items-center gap-1.5 text-[12.5px]">
          <input
            type="checkbox"
            checked={headerRow}
            onChange={onToggleHeader}
          />
          첫 행이 헤더
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
        {dataRows.length}행 · {columns.length}컬럼
        {dataRows.length > 8 && ` · 미리보기는 8행`}
      </span>
    </div>
  )
}
