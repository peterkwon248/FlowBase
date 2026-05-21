// FlowBase V2 — KPI 타일 (큰 숫자 + 라벨)
// 설계: docs/02-design/features/flowbase-v2-phase4.design.md §5
// 출처: design-ref/prototype/chart-dashboard.jsx KpiTile

interface KpiTileProps {
  label: string
  value: string | number
  hint?: string
}

export function KpiTile({ label, value, hint }: KpiTileProps) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border-subtle bg-card px-4 py-3.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
        {label}
      </span>
      <span className="text-[26px] font-bold leading-none tracking-tight tabular-nums">
        {value}
      </span>
      {hint && (
        <span className="text-[11.5px] text-muted-foreground">{hint}</span>
      )}
    </div>
  )
}
