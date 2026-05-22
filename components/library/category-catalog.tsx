// FlowBase V2 — Library 카테고리 카탈로그 (자산 카드 그리드)
// 출처: design-ref/prototype/library-view.jsx CategoryCatalog
// 설계: docs/02-design/features/flowbase-v2-library.design.md §3

"use client"

import type { ReactNode } from "react"
import {
  BarChart3,
  Box,
  List,
  type LucideIcon,
  Sigma,
  Type,
} from "lucide-react"
import { LIBRARY_CATEGORIES } from "@/lib/flowbase-library-seed"
import { useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type {
  Library,
  LibraryCategoryId,
  LibraryDashboard,
  LibraryField,
  LibraryFunction,
  LibraryTemplate,
  OptionList,
} from "@/types/flowbase"

const CATEGORY_ICON: Record<LibraryCategoryId, LucideIcon> = {
  optionLists: List,
  fields: Type,
  templates: Box,
  functions: Sigma,
  dashboards: BarChart3,
}

const CATEGORY_TINT: Record<LibraryCategoryId, string> = {
  optionLists: "text-chart-1",
  fields: "text-chart-3",
  templates: "text-chart-4",
  functions: "text-chart-2",
  dashboards: "text-chart-5",
}

const CATEGORY_BG: Record<LibraryCategoryId, string> = {
  optionLists: "bg-chart-1/15",
  fields: "bg-chart-3/15",
  templates: "bg-chart-4/15",
  functions: "bg-chart-2/15",
  dashboards: "bg-chart-5/15",
}

export function CategoryCatalog() {
  const library = useFlowBase((s) => s.library)
  const libCategory = useFlowBase((s) => s.libCategory)
  const libAssetId = useFlowBase((s) => s.libAssetId)
  const setLibAsset = useFlowBase((s) => s.setLibAsset)

  const meta = LIBRARY_CATEGORIES.find((c) => c.id === libCategory)
  if (!meta) return null

  const Icon = CATEGORY_ICON[libCategory]
  const tint = CATEGORY_TINT[libCategory]
  const bg = CATEGORY_BG[libCategory]
  const count = countAssets(library, libCategory)

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-background">
      {/* 카테고리 헤더 */}
      <div className="shrink-0 px-6 pb-3 pt-5">
        <div className="mb-1.5 flex items-center gap-2.5">
          <span
            className={cn(
              "inline-flex size-8 items-center justify-center rounded-md",
              bg,
              tint,
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} />
          </span>
          <h1 className="text-[22px] font-bold tracking-[-0.02em]">
            {meta.label}
          </h1>
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
            {count}
          </span>
        </div>
        <p className="pl-[42px] text-[13px] text-muted-foreground">
          {meta.desc}
        </p>
      </div>

      {/* 자산 카드 그리드 */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 px-6 pb-8">
        {renderCards(library, libCategory, libAssetId, setLibAsset)}
      </div>
    </div>
  )
}

function countAssets(library: Library, id: LibraryCategoryId): number {
  switch (id) {
    case "optionLists":
      return library.optionLists.length
    case "fields":
      return library.fields.length
    case "templates":
      return library.templates.length
    case "functions":
      return library.functions.length
    case "dashboards":
      return library.dashboards.length
  }
}

function renderCards(
  library: Library,
  id: LibraryCategoryId,
  selectedId: string | null,
  onSelect: (id: string | null) => void,
): ReactNode {
  switch (id) {
    case "optionLists":
      return library.optionLists.map((a) => (
        <OptionListCard
          key={a.id}
          asset={a}
          active={a.id === selectedId}
          onSelect={() => onSelect(a.id)}
        />
      ))
    case "fields":
      return library.fields.map((a) => (
        <FieldCard
          key={a.id}
          asset={a}
          active={a.id === selectedId}
          onSelect={() => onSelect(a.id)}
        />
      ))
    case "templates":
      return library.templates.map((a) => (
        <TemplateCard
          key={a.id}
          asset={a}
          active={a.id === selectedId}
          onSelect={() => onSelect(a.id)}
        />
      ))
    case "functions":
      return library.functions.map((a) => (
        <FunctionCard
          key={a.id}
          asset={a}
          active={a.id === selectedId}
          onSelect={() => onSelect(a.id)}
        />
      ))
    case "dashboards":
      return library.dashboards.map((a) => (
        <DashboardCard
          key={a.id}
          asset={a}
          active={a.id === selectedId}
          onSelect={() => onSelect(a.id)}
        />
      ))
  }
}

interface CardProps<T> {
  asset: T
  active: boolean
  onSelect: () => void
}

function CardShell({
  active,
  onSelect,
  name,
  usedCount,
  children,
}: {
  active: boolean
  onSelect: () => void
  name: string
  usedCount: number
  children?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border bg-card p-3.5 text-left transition-colors",
        active
          ? "border-primary bg-foreground/[0.02]"
          : "border-border-subtle hover:border-border hover:bg-foreground/[0.02]",
      )}
    >
      <div className="flex items-center gap-2">
        <span className="flex-1 text-[14px] font-semibold">{name}</span>
        {usedCount > 0 ? (
          <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-primary">
            {usedCount} in use
          </span>
        ) : (
          <span className="text-[10.5px] text-muted-foreground">unused</span>
        )}
      </div>
      {children}
    </button>
  )
}

function OptionListCard({ asset, active, onSelect }: CardProps<OptionList>) {
  return (
    <CardShell
      active={active}
      onSelect={onSelect}
      name={asset.name}
      usedCount={asset.usedIn.length}
    >
      {asset.desc && (
        <div className="text-[12px] text-muted-foreground">{asset.desc}</div>
      )}
      <div className="mt-1 flex flex-wrap gap-1">
        {asset.options.slice(0, 5).map((o) => (
          <span
            key={o.id}
            className="rounded-full px-2 py-0.5 text-[11px] font-medium"
            style={{
              background: `color-mix(in oklch, ${o.color} 22%, transparent)`,
              color: o.color,
            }}
          >
            {o.label}
          </span>
        ))}
        {asset.options.length > 5 && (
          <span className="text-[11px] text-muted-foreground">
            +{asset.options.length - 5}
          </span>
        )}
      </div>
    </CardShell>
  )
}

function FieldCard({ asset, active, onSelect }: CardProps<LibraryField>) {
  return (
    <CardShell
      active={active}
      onSelect={onSelect}
      name={asset.name}
      usedCount={asset.usedIn.length}
    >
      {asset.desc && (
        <div className="text-[12px] text-muted-foreground">{asset.desc}</div>
      )}
      <div className="mt-1 flex items-center gap-1.5">
        <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
          {asset.type}
        </span>
        {asset.config.required && (
          <span className="text-[10.5px] font-semibold text-destructive">
            required
          </span>
        )}
      </div>
    </CardShell>
  )
}

function TemplateCard({ asset, active, onSelect }: CardProps<LibraryTemplate>) {
  const fieldCount = asset.multiTable
    ? (asset.tables?.reduce((n, t) => n + t.columns.length, 0) ?? 0)
    : (asset.fields?.length ?? 0) + (asset.extraFields?.length ?? 0)
  return (
    <CardShell
      active={active}
      onSelect={onSelect}
      name={asset.name}
      usedCount={asset.usedIn.length}
    >
      {asset.desc && (
        <div className="text-[12px] text-muted-foreground">{asset.desc}</div>
      )}
      <div className="mt-1 flex flex-wrap items-center gap-1.5">
        <span className="rounded bg-muted px-1.5 py-0.5 text-[10.5px] text-muted-foreground">
          {fieldCount} fields
        </span>
        {asset.multiTable && (
          <span className="rounded bg-primary/15 px-1.5 py-0.5 text-[10.5px] font-semibold text-primary">
            {asset.tables?.length ?? 0} tables
          </span>
        )}
        {asset.recommendedViews && asset.recommendedViews.length > 0 && (
          <span className="text-[10.5px] text-muted-foreground">
            {asset.recommendedViews.join(" · ")}
          </span>
        )}
      </div>
    </CardShell>
  )
}

function FunctionCard({ asset, active, onSelect }: CardProps<LibraryFunction>) {
  return (
    <CardShell
      active={active}
      onSelect={onSelect}
      name={asset.label || asset.name}
      usedCount={asset.usedIn.length}
    >
      {asset.desc && (
        <div className="text-[12px] text-muted-foreground">{asset.desc}</div>
      )}
      {asset.example && (
        <div className="mt-1 truncate rounded bg-muted px-2 py-1 font-mono text-[10.5px] text-muted-foreground">
          {asset.example}
        </div>
      )}
    </CardShell>
  )
}

function DashboardCard({
  asset,
  active,
  onSelect,
}: CardProps<LibraryDashboard>) {
  return (
    <CardShell
      active={active}
      onSelect={onSelect}
      name={asset.name}
      usedCount={asset.usedIn.length}
    >
      {asset.desc && (
        <div className="text-[12px] text-muted-foreground">{asset.desc}</div>
      )}
      <div className="mt-1 text-[10.5px] text-muted-foreground">
        {asset.charts.length} charts
      </div>
    </CardShell>
  )
}
