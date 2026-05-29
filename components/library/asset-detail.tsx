// FlowBase V2 — Library 자산 디테일 (5 카테고리별, 읽기 전용 B2)
// 출처: design-ref/prototype/library-view.jsx AssetDetail
// 설계: docs/02-design/features/flowbase-v2-library.design.md §4 B2

"use client"

import { type ReactNode, useEffect, useRef, useState } from "react"
import {
  ArrowLeft,
  ArrowUpRight,
  BarChart3,
  Box,
  Link as LinkIcon,
  List,
  type LucideIcon,
  Pencil,
  Plus,
  Sigma,
  Type,
  X,
} from "lucide-react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { LIBRARY_CATEGORIES } from "@/lib/flowbase-library-seed"
import { selectIsViewer, useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type {
  ChartType,
  ChartWidth,
  ColumnType,
  FieldConfig,
  Library,
  LibraryCategoryId,
  LibraryDashboard,
  LibraryField,
  LibraryFunction,
  LibraryFunctionParam,
  LibraryTemplate,
  OptionItem,
  OptionList,
  ViewMode,
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

// OptionList 옵션 recolor 팔레트 — 디자인 토큰만 (inline hex 금지 LOCK).
const OPTION_PALETTE = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
]

export function AssetDetail() {
  const library = useFlowBase((s) => s.library)
  const libCategory = useFlowBase((s) => s.libCategory)
  const libAssetId = useFlowBase((s) => s.libAssetId)

  if (!libAssetId) return null

  switch (libCategory) {
    case "optionLists": {
      const a = library.optionLists.find((x) => x.id === libAssetId)
      return a ? (
        <Shell asset={a}>
          <OptionListBody asset={a} />
        </Shell>
      ) : null
    }
    case "fields": {
      const a = library.fields.find((x) => x.id === libAssetId)
      return a ? (
        <Shell asset={a}>
          <FieldBody asset={a} library={library} />
        </Shell>
      ) : null
    }
    case "templates": {
      const a = library.templates.find((x) => x.id === libAssetId)
      return a ? (
        <Shell asset={a}>
          <TemplateBody asset={a} library={library} />
        </Shell>
      ) : null
    }
    case "functions": {
      const a = library.functions.find((x) => x.id === libAssetId)
      return a ? (
        <Shell asset={a}>
          <FunctionBody asset={a} />
        </Shell>
      ) : null
    }
    case "dashboards": {
      const a = library.dashboards.find((x) => x.id === libAssetId)
      return a ? (
        <Shell asset={a}>
          <DashboardBody asset={a} />
        </Shell>
      ) : null
    }
  }
}

// "BoardLabel.columnName" — 첫 점 기준 분할. (board.label에 점 있으면 first-match 휴리스틱)
function parseUsedIn(s: string): { boardLabel: string; colName: string } | null {
  const idx = s.indexOf(".")
  if (idx <= 0) return null
  return { boardLabel: s.slice(0, idx), colName: s.slice(idx + 1) }
}

// ─── Shell ───
function Shell({
  asset,
  children,
}: {
  asset: { id: string; name: string; desc?: string; usedIn: string[] }
  children: ReactNode
}) {
  const libCategory = useFlowBase((s) => s.libCategory)
  const setLibAsset = useFlowBase((s) => s.setLibAsset)
  const boards = useFlowBase((s) => s.boards)
  const switchBoard = useFlowBase((s) => s.switchBoard)
  const setActivityMode = useFlowBase((s) => s.setActivityMode)
  const setFocused = useFlowBase((s) => s.setFocused)
  const setSelected = useFlowBase((s) => s.setSelected)
  const isViewer = useFlowBase(selectIsViewer)
  // Q14-C2: 카테고리별 update action — 인라인 rename에 사용.
  const updateLibraryOptionList = useFlowBase((s) => s.updateLibraryOptionList)
  const updateLibraryField = useFlowBase((s) => s.updateLibraryField)
  const updateLibraryTemplate = useFlowBase((s) => s.updateLibraryTemplate)
  const updateLibraryFunction = useFlowBase((s) => s.updateLibraryFunction)
  const updateLibraryDashboard = useFlowBase((s) => s.updateLibraryDashboard)
  const meta = LIBRARY_CATEGORIES.find((c) => c.id === libCategory)

  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(asset.name)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    setDraft(asset.name)
  }, [asset.name])
  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  const commitRename = () => {
    const next = draft.trim()
    setEditing(false)
    if (!next || next === asset.name) {
      setDraft(asset.name)
      return
    }
    const id = asset.id
    if (libCategory === "optionLists") updateLibraryOptionList(id, { name: next })
    else if (libCategory === "fields") updateLibraryField(id, { name: next })
    else if (libCategory === "templates") updateLibraryTemplate(id, { name: next })
    else if (libCategory === "functions") updateLibraryFunction(id, { name: next })
    else if (libCategory === "dashboards") updateLibraryDashboard(id, { name: next })
    toast.success("Renamed")
  }

  if (!meta) return null

  // usedIn 문자열을 분해 → 매칭되는 board/column 찾아 점프.
  const jump = (used: string) => {
    const parsed = parseUsedIn(used)
    if (!parsed) {
      toast.error(`Cannot parse "${used}"`)
      return
    }
    const board = Object.values(boards).find(
      (b) => b.label === parsed.boardLabel,
    )
    if (!board) {
      toast.error(`Board "${parsed.boardLabel}" not found`)
      return
    }
    // 컬럼 매칭 — 이름 또는 라벨로
    const col = board.columns.find(
      (c) => c.name === parsed.colName || c.label === parsed.colName,
    )
    switchBoard(board.id)
    setActivityMode("tables")
    if (col && board.rows.length > 0) {
      setSelected([board.rows[0].id])
      setFocused({ row: board.rows[0].id, col: col.name })
      toast.success(`Jumped to ${parsed.boardLabel} · ${col.label || col.name}`)
    } else if (!col) {
      toast.warning(`Column "${parsed.colName}" missing — opened board only`)
    }
  }

  const canJump = (used: string): boolean => {
    const parsed = parseUsedIn(used)
    if (!parsed) return false
    return Object.values(boards).some((b) => b.label === parsed.boardLabel)
  }

  const Icon = CATEGORY_ICON[libCategory]
  const tint = CATEGORY_TINT[libCategory]
  const bg = CATEGORY_BG[libCategory]
  const singular = meta.label.endsWith("s")
    ? meta.label.slice(0, -1)
    : meta.label

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-y-auto bg-background">
      {/* breadcrumb */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border-subtle px-6 py-2.5 text-[12px]">
        <button
          type="button"
          onClick={() => setLibAsset(null)}
          className="inline-flex items-center gap-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" strokeWidth={2} />
          {meta.label}
        </button>
        <span className="text-muted-foreground/40">/</span>
        <span className="font-semibold">{asset.name}</span>
      </div>

      {/* 헤더 */}
      <div className="shrink-0 px-6 pb-4 pt-5">
        <div className="flex items-start gap-2.5">
          <span
            className={cn(
              "inline-flex size-9 shrink-0 items-center justify-center rounded-md",
              bg,
              tint,
            )}
          >
            <Icon className="size-4" strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {editing ? (
                <Input
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      commitRename()
                    }
                    if (e.key === "Escape") {
                      setDraft(asset.name)
                      setEditing(false)
                    }
                  }}
                  className="h-9 max-w-md text-[20px] font-bold tracking-[-0.02em]"
                  data-library-rename-input
                />
              ) : (
                <h1
                  className={cn(
                    "group flex items-center gap-1 text-[20px] font-bold tracking-[-0.02em]",
                    !isViewer && "cursor-text",
                  )}
                  onClick={() => {
                    if (!isViewer) setEditing(true)
                  }}
                  title={
                    isViewer
                      ? "Viewers can't rename"
                      : "Click to rename"
                  }
                  data-library-asset-name
                >
                  {asset.name}
                  {!isViewer && (
                    <Pencil
                      className="size-3 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100"
                      strokeWidth={1.75}
                    />
                  )}
                </h1>
              )}
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                {singular}
              </span>
            </div>
            {asset.desc && (
              <p className="mt-1 text-[13px] text-muted-foreground">
                {asset.desc}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Used in — 각 항목 클릭 시 해당 보드/컬럼으로 점프 */}
      <div className="px-6 pb-1">
        <Section title="Used in" count={asset.usedIn.length}>
          {asset.usedIn.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {asset.usedIn.map((u) => {
                const jumpable = canJump(u)
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => jump(u)}
                    disabled={!jumpable}
                    data-library-jump={u}
                    title={jumpable ? "Jump to source column" : "Source board not found"}
                    className={cn(
                      "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 font-mono text-[11.5px] font-medium transition-colors",
                      jumpable
                        ? "cursor-pointer bg-primary/15 text-primary hover:bg-primary/25"
                        : "cursor-not-allowed bg-muted text-muted-foreground/60",
                    )}
                  >
                    <span>{u}</span>
                    {jumpable && (
                      <ArrowUpRight
                        className="size-2.5"
                        strokeWidth={2.25}
                      />
                    )}
                  </button>
                )
              })}
            </div>
          ) : (
            <p className="text-[12.5px] text-muted-foreground">
              Not used anywhere yet.
            </p>
          )}
        </Section>
      </div>

      {/* body */}
      <div className="px-6 pb-8">{children}</div>
    </div>
  )
}

function Section({
  title,
  count,
  children,
}: {
  title: string
  count?: number
  children: ReactNode
}) {
  return (
    <section className="mb-5">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          {title}
        </span>
        {typeof count === "number" && (
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10.5px] tabular-nums text-muted-foreground">
            {count}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}

function DefRow({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <>
      <dt className="text-[12px] font-medium text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </>
  )
}

// ─── Option List ───
// C2: 옵션 추가/삭제/라벨 rename/색상 변경 (non-viewer). updateLibraryOptionList 재사용
// (ensureCanEdit 가드 포함). viewer는 기존 read-only.
function OptionListBody({ asset }: { asset: OptionList }) {
  const isViewer = useFlowBase(selectIsViewer)
  const updateLibraryOptionList = useFlowBase((s) => s.updateLibraryOptionList)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState("")

  const update = (options: OptionItem[]) =>
    updateLibraryOptionList(asset.id, { options })

  const setColor = (id: string, color: string) =>
    update(asset.options.map((o) => (o.id === id ? { ...o, color } : o)))

  const commitLabel = (id: string) => {
    const next = draft.trim()
    setEditingId(null)
    if (!next) return
    update(asset.options.map((o) => (o.id === id ? { ...o, label: next } : o)))
  }

  const remove = (id: string) =>
    update(asset.options.filter((o) => o.id !== id))

  const addOption = () => {
    const id = `opt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`
    const color = OPTION_PALETTE[asset.options.length % OPTION_PALETTE.length]
    update([...asset.options, { id, label: "New option", color }])
    setEditingId(id)
    setDraft("New option")
  }

  if (isViewer) {
    return (
      <Section title="Options" count={asset.options.length}>
        <div className="overflow-hidden rounded-lg border border-border-subtle bg-card">
          {asset.options.map((o, i) => (
            <div
              key={o.id}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2",
                i < asset.options.length - 1 && "border-b border-border-subtle",
              )}
            >
              <span
                className="size-3.5 shrink-0 rounded-full"
                style={{
                  background: o.color,
                  boxShadow: `0 0 0 3px color-mix(in oklch, ${o.color} 22%, transparent)`,
                }}
              />
              <span className="flex-1 text-[13px] font-medium">{o.label}</span>
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
                {o.id}
              </span>
            </div>
          ))}
        </div>
      </Section>
    )
  }

  return (
    <Section title="Options" count={asset.options.length}>
      <div className="overflow-hidden rounded-lg border border-border-subtle bg-card">
        {asset.options.map((o, i) => (
          <div
            key={o.id}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2",
              i < asset.options.length - 1 && "border-b border-border-subtle",
            )}
          >
            {/* 색상 picker */}
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  title="Change color"
                  data-option-color={o.id}
                  className="size-3.5 shrink-0 rounded-full transition-transform hover:scale-110"
                  style={{
                    background: o.color,
                    boxShadow: `0 0 0 3px color-mix(in oklch, ${o.color} 22%, transparent)`,
                  }}
                />
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2" align="start">
                <div className="flex gap-1.5">
                  {OPTION_PALETTE.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(o.id, c)}
                      title="Set color"
                      data-option-swatch={c}
                      className={cn(
                        "size-5 rounded-full transition-transform hover:scale-110",
                        o.color === c &&
                          "ring-2 ring-foreground ring-offset-1 ring-offset-popover",
                      )}
                      style={{ background: c }}
                    />
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* 라벨 — 클릭 시 인라인 편집 */}
            {editingId === o.id ? (
              <Input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={() => commitLabel(o.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    commitLabel(o.id)
                  }
                  if (e.key === "Escape") setEditingId(null)
                }}
                className="h-7 flex-1 text-[13px] font-medium"
                data-option-label-input={o.id}
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingId(o.id)
                  setDraft(o.label)
                }}
                className="flex-1 cursor-text rounded px-1 py-0.5 text-left text-[13px] font-medium transition-colors hover:bg-foreground/[0.04]"
                title="Click to rename"
                data-option-label={o.id}
              >
                {o.label}
              </button>
            )}

            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
              {o.id}
            </span>

            <button
              type="button"
              onClick={() => remove(o.id)}
              title="Remove option"
              data-option-remove={o.id}
              className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="size-3" strokeWidth={2} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addOption}
          data-option-add
          className={cn(
            "flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground",
            asset.options.length > 0 && "border-t border-border-subtle",
          )}
        >
          <Plus className="size-3.5" strokeWidth={2} />
          Add option
        </button>
      </div>
    </Section>
  )
}

// ─── Field ───
// C2 후속: config 편집 (non-viewer) — required/default/format/validation + OptionList 링크.
// type·inline options는 read-only. viewer는 기존 read-only.
function FieldBody({
  asset,
  library,
}: {
  asset: LibraryField
  library: Library
}) {
  const isViewer = useFlowBase(selectIsViewer)
  const updateLibraryField = useFlowBase((s) => s.updateLibraryField)
  const c = asset.config
  const olRef = c.optionListId
    ? library.optionLists.find((o) => o.id === c.optionListId)
    : null

  // 텍스트 config — local draft(blur commit). asset 전환 시 resync.
  const [draft, setDraft] = useState({
    default: c.default ?? "",
    format: c.format ?? "",
    validation: c.validation ?? "",
  })
  useEffect(() => {
    setDraft({
      default: c.default ?? "",
      format: c.format ?? "",
      validation: c.validation ?? "",
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asset.id])

  if (isViewer) {
    return (
      <Section title="Definition">
        <div className="rounded-lg border border-border-subtle bg-card p-4">
          <dl className="grid grid-cols-[max-content_1fr] items-baseline gap-x-4 gap-y-2.5 text-[13px]">
            <DefRow label="Type">
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">
                {asset.type}
              </code>
            </DefRow>
            {olRef && (
              <DefRow label="Options">
                <span className="inline-flex items-center gap-1.5">
                  <LinkIcon className="size-2.5 text-primary" strokeWidth={2} />
                  <span className="font-mono">@{olRef.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    ({olRef.options.length} options)
                  </span>
                </span>
              </DefRow>
            )}
            {c.options && c.options.length > 0 && (
              <DefRow label="Options">
                <div className="flex flex-wrap gap-1">
                  {c.options.map((o) => (
                    <span
                      key={o.id}
                      className="whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium"
                    >
                      {o.label}
                    </span>
                  ))}
                </div>
              </DefRow>
            )}
            {c.required !== undefined && (
              <DefRow label="Required">
                <span
                  className={cn(
                    "whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold",
                    c.required
                      ? "bg-destructive/15 text-destructive"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {c.required ? "Required" : "Optional"}
                </span>
              </DefRow>
            )}
            {c.default && (
              <DefRow label="Default">
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">
                  {c.default}
                </code>
              </DefRow>
            )}
            {c.format && (
              <DefRow label="Format">
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">
                  {c.format}
                </code>
              </DefRow>
            )}
            {c.validation && (
              <DefRow label="Validation">
                <span className="text-[12.5px]">{c.validation}</span>
              </DefRow>
            )}
          </dl>
        </div>
      </Section>
    )
  }

  const patchConfig = (patch: Partial<FieldConfig>) =>
    updateLibraryField(asset.id, { config: { ...c, ...patch } })

  const commitText = (key: "default" | "format" | "validation") =>
    patchConfig({ [key]: draft[key].trim() || undefined })

  return (
    <Section title="Definition">
      <div className="rounded-lg border border-border-subtle bg-card p-4">
        <dl className="grid grid-cols-[max-content_1fr] items-center gap-x-4 gap-y-3 text-[13px]">
          <DefRow label="Type">
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]">
              {asset.type}
            </code>
          </DefRow>

          <DefRow label="Required">
            <button
              type="button"
              onClick={() => patchConfig({ required: !c.required })}
              data-field-required={c.required ? "true" : "false"}
              className={cn(
                "whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors",
                c.required
                  ? "bg-destructive/15 text-destructive hover:bg-destructive/25"
                  : "bg-muted text-muted-foreground hover:bg-foreground/[0.08]",
              )}
            >
              {c.required ? "Required" : "Optional"}
            </button>
          </DefRow>

          <DefRow label="Option list">
            <Select
              value={c.optionListId ?? "_none"}
              onValueChange={(v) =>
                patchConfig({ optionListId: v === "_none" ? undefined : v })
              }
            >
              <SelectTrigger
                className="h-7 w-[220px] text-[12px]"
                data-field-optionlist
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_none">None</SelectItem>
                {library.optionLists.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name} ({o.options.length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </DefRow>

          <DefRow label="Default">
            <Input
              value={draft.default}
              onChange={(e) =>
                setDraft((d) => ({ ...d, default: e.target.value }))
              }
              onBlur={() => commitText("default")}
              placeholder="—"
              className="h-7 max-w-[260px] text-[12px]"
              data-field-default
            />
          </DefRow>

          <DefRow label="Format">
            <Input
              value={draft.format}
              onChange={(e) =>
                setDraft((d) => ({ ...d, format: e.target.value }))
              }
              onBlur={() => commitText("format")}
              placeholder="—"
              className="h-7 max-w-[260px] text-[12px]"
              data-field-format
            />
          </DefRow>

          <DefRow label="Validation">
            <Input
              value={draft.validation}
              onChange={(e) =>
                setDraft((d) => ({ ...d, validation: e.target.value }))
              }
              onBlur={() => commitText("validation")}
              placeholder="—"
              className="h-7 max-w-[260px] text-[12px]"
              data-field-validation
            />
          </DefRow>

          {c.options && c.options.length > 0 && (
            <DefRow label="Inline options">
              <div className="flex flex-wrap gap-1">
                {c.options.map((o) => (
                  <span
                    key={o.id}
                    className="whitespace-nowrap rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium"
                  >
                    {o.label}
                  </span>
                ))}
              </div>
            </DefRow>
          )}
        </dl>
      </div>
    </Section>
  )
}

// ─── Template ───
// C2 잔여: 단일 테이블 편집 (non-viewer) — linked fields 추가/삭제 · extraFields
// 추가/삭제/rename/type · recommendedViews 토글 · defaultGroupBy. multiTable는
// read-only 유지 (B4 scope). viewer는 기존 read-only.
const COLUMN_TYPES: ColumnType[] = [
  "text",
  "num",
  "date",
  "email",
  "select",
  "multiSelect",
  "status",
  "avatar",
  "reaction",
  "button",
  "fk",
  "formula",
]
const VIEW_MODES: ViewMode[] = ["sheet", "kanban", "chart", "grid", "timeline"]

function TemplateBody({
  asset,
  library,
}: {
  asset: LibraryTemplate
  library: Library
}) {
  const isViewer = useFlowBase(selectIsViewer)
  const updateLibraryTemplate = useFlowBase((s) => s.updateLibraryTemplate)

  // Multi-table — read-only (B4 scope).
  if (asset.multiTable && asset.tables && asset.tables.length > 0) {
    return (
      <>
        <Section title="Multi-table domain" count={asset.tables.length}>
          <div className="rounded-lg border border-primary/20 bg-primary/[0.04] px-3 py-2 text-[12px] leading-relaxed text-muted-foreground">
            This template creates{" "}
            <strong className="text-foreground">
              {asset.tables.length} tables
            </strong>{" "}
            at once (enabled in B4).
          </div>
        </Section>
        {asset.tables.map((t) => (
          <Section key={t.key} title={t.label} count={t.columns.length}>
            <FieldList
              items={t.columns.map((c) => ({
                label: c.label || c.name,
                type: c.type,
              }))}
            />
          </Section>
        ))}
        {asset.recommendedViews && asset.recommendedViews.length > 0 && (
          <Section title="Recommended views">
            <div className="flex flex-wrap gap-1.5">
              {asset.recommendedViews.map((v) => (
                <span
                  key={v}
                  className="whitespace-nowrap rounded-full bg-foreground/[0.06] px-2.5 py-0.5 text-[12px] font-medium"
                >
                  {v}
                </span>
              ))}
            </div>
          </Section>
        )}
      </>
    )
  }

  const resolvedFields = (asset.fields || [])
    .map((fid) => library.fields.find((f) => f.id === fid))
    .filter((f): f is LibraryField => f !== undefined)
  const extras = asset.extraFields || []

  // Single-table viewer — read-only.
  if (isViewer) {
    const total = resolvedFields.length + extras.length
    return (
      <>
        <Section title="Fields" count={total}>
          <FieldList
            items={[
              ...resolvedFields.map((f) => ({
                label: f.name,
                type: f.type,
                linked: true,
              })),
              ...extras.map((f) => ({
                label: f.name,
                type: f.type,
                linked: false,
              })),
            ]}
          />
        </Section>
        {asset.recommendedViews && asset.recommendedViews.length > 0 && (
          <Section title="Recommended views">
            <div className="flex flex-wrap gap-1.5">
              {asset.recommendedViews.map((v) => (
                <span
                  key={v}
                  className="rounded-full bg-foreground/[0.06] px-2.5 py-0.5 text-[12px] font-medium"
                >
                  {v}
                </span>
              ))}
            </div>
          </Section>
        )}
        {asset.defaultGroupBy && (
          <Section title="Default group by">
            <code className="rounded bg-muted px-2 py-0.5 font-mono text-[12px]">
              {asset.defaultGroupBy}
            </code>
          </Section>
        )}
      </>
    )
  }

  // Single-table editor.
  const linkedIds = asset.fields ?? []
  const available = library.fields.filter((f) => !linkedIds.includes(f.id))
  const removeField = (id: string) =>
    updateLibraryTemplate(asset.id, {
      fields: linkedIds.filter((x) => x !== id),
    })
  const addField = (id: string) =>
    updateLibraryTemplate(asset.id, { fields: [...linkedIds, id] })

  const patchExtras = (
    extraFields: NonNullable<LibraryTemplate["extraFields"]>,
  ) => updateLibraryTemplate(asset.id, { extraFields })
  const addExtra = () =>
    patchExtras([...extras, { name: "newField", type: "text" }])
  const removeExtra = (index: number) =>
    patchExtras(extras.filter((_, i) => i !== index))
  const patchExtra = (
    index: number,
    patch: Partial<{ name: string; type: ColumnType }>,
  ) =>
    patchExtras(extras.map((e, i) => (i === index ? { ...e, ...patch } : e)))

  const views = asset.recommendedViews ?? []
  const toggleView = (v: ViewMode) => {
    const next = views.includes(v)
      ? views.filter((x) => x !== v)
      : [...views, v]
    updateLibraryTemplate(asset.id, {
      recommendedViews: next.length ? next : undefined,
    })
  }

  return (
    <>
      <Section title="Linked fields" count={resolvedFields.length}>
        <div className="overflow-hidden rounded-lg border border-border-subtle bg-card">
          {resolvedFields.map((f, i) => (
            <div
              key={f.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2",
                i < resolvedFields.length - 1 &&
                  "border-b border-border-subtle",
              )}
            >
              <LinkIcon className="size-3 shrink-0 text-primary" strokeWidth={2} />
              <span className="flex-1 text-[13px]">{f.name}</span>
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
                {f.type}
              </span>
              <button
                type="button"
                onClick={() => removeField(f.id)}
                title="Unlink field"
                data-template-field-remove={f.id}
                className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="size-3" strokeWidth={2} />
              </button>
            </div>
          ))}
          {available.length > 0 ? (
            <div
              className={cn(
                "px-3 py-2",
                resolvedFields.length > 0 && "border-t border-border-subtle",
              )}
            >
              <Select value="_add" onValueChange={(v) => addField(v)}>
                <SelectTrigger
                  className="h-7 w-full text-[12px] text-muted-foreground"
                  data-template-field-add
                >
                  <span className="inline-flex items-center gap-2">
                    <Plus className="size-3.5" strokeWidth={2} />
                    Link a field…
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_add" disabled className="hidden">
                    Link a field…
                  </SelectItem>
                  {available.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.name} ({f.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div
              className={cn(
                "px-3 py-2 text-[12px] text-muted-foreground",
                resolvedFields.length > 0 && "border-t border-border-subtle",
              )}
            >
              All library fields linked.
            </div>
          )}
        </div>
      </Section>

      <Section title="Extra fields" count={extras.length}>
        <div className="overflow-hidden rounded-lg border border-border-subtle bg-card">
          {extras.map((f, i) => (
            <ExtraFieldRow
              key={i}
              field={f}
              isLast={i === extras.length - 1}
              onPatch={(patch) => patchExtra(i, patch)}
              onRemove={() => removeExtra(i)}
            />
          ))}
          <button
            type="button"
            onClick={addExtra}
            data-template-extra-add
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground",
              extras.length > 0 && "border-t border-border-subtle",
            )}
          >
            <Plus className="size-3.5" strokeWidth={2} />
            Add extra field
          </button>
        </div>
      </Section>

      <Section title="Recommended views">
        <div className="flex flex-wrap gap-1.5">
          {VIEW_MODES.map((v) => {
            const on = views.includes(v)
            return (
              <button
                key={v}
                type="button"
                onClick={() => toggleView(v)}
                data-template-view={v}
                aria-pressed={on}
                className={cn(
                  "whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12px] font-medium transition-colors",
                  on
                    ? "bg-primary/15 text-primary hover:bg-primary/25"
                    : "bg-foreground/[0.06] text-muted-foreground hover:bg-foreground/[0.1]",
                )}
              >
                {v}
              </button>
            )
          })}
        </div>
      </Section>

      <Section title="Default group by">
        <DefaultGroupByEditor
          assetId={asset.id}
          value={asset.defaultGroupBy ?? ""}
          onCommit={(v) =>
            updateLibraryTemplate(asset.id, {
              defaultGroupBy: v.trim() || undefined,
            })
          }
        />
      </Section>
    </>
  )
}

function ExtraFieldRow({
  field,
  isLast,
  onPatch,
  onRemove,
}: {
  field: { name: string; type: ColumnType }
  isLast: boolean
  onPatch: (patch: Partial<{ name: string; type: ColumnType }>) => void
  onRemove: () => void
}) {
  const [name, setName] = useState(field.name)
  useEffect(() => {
    setName(field.name)
  }, [field.name])

  const commitName = () => {
    const next = name.trim()
    if (!next || next === field.name) {
      setName(field.name)
      return
    }
    onPatch({ name: next })
  }

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-3 py-2",
        !isLast && "border-b border-border-subtle",
      )}
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={commitName}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            commitName()
          }
          if (e.key === "Escape") setName(field.name)
        }}
        className="h-7 flex-1 text-[13px]"
        data-template-extra-name
      />
      <Select
        value={field.type}
        onValueChange={(v) => onPatch({ type: v as ColumnType })}
      >
        <SelectTrigger
          className="h-7 w-[120px] text-[12px]"
          data-template-extra-type
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COLUMN_TYPES.map((t) => (
            <SelectItem key={t} value={t}>
              {t}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button
        type="button"
        onClick={onRemove}
        title="Remove extra field"
        data-template-extra-remove
        className="flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <X className="size-3" strokeWidth={2} />
      </button>
    </div>
  )
}

function DefaultGroupByEditor({
  assetId,
  value,
  onCommit,
}: {
  assetId: string
  value: string
  onCommit: (v: string) => void
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => {
    setDraft(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId])
  return (
    <Input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) onCommit(draft)
      }}
      placeholder="Field name to group by…"
      className="h-7 max-w-[260px] font-mono text-[12px]"
      data-template-groupby
    />
  )
}

function FieldList({
  items,
}: {
  items: { label: string; type: string; linked?: boolean }[]
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border-subtle bg-card">
      {items.map((it, i) => (
        <div
          key={i}
          className={cn(
            "flex items-center gap-2 px-3 py-2",
            i < items.length - 1 && "border-b border-border-subtle",
          )}
        >
          <span className="w-5 text-right font-mono text-[11px] text-muted-foreground">
            {i + 1}
          </span>
          <span className="flex-1 text-[13px]">{it.label}</span>
          {it.linked && (
            <LinkIcon className="size-3 text-primary" strokeWidth={2} />
          )}
          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
            {it.type}
          </span>
        </div>
      ))}
    </div>
  )
}

// ─── Function ───
// C2 잔여: params CRUD + example 편집 (non-viewer). updateLibraryFunction 재사용
// (ensureCanEdit 가드). viewer는 기존 read-only.
const PARAM_TYPES: LibraryFunctionParam["type"][] = [
  "column",
  "optionList",
  "enum",
  "text",
  "regex",
]

function FunctionBody({ asset }: { asset: LibraryFunction }) {
  const isViewer = useFlowBase(selectIsViewer)
  const updateLibraryFunction = useFlowBase((s) => s.updateLibraryFunction)

  const patchParams = (params: LibraryFunctionParam[]) =>
    updateLibraryFunction(asset.id, { params })
  const patchParam = (index: number, patch: Partial<LibraryFunctionParam>) =>
    patchParams(
      asset.params.map((p, i) => (i === index ? { ...p, ...patch } : p)),
    )
  const removeParam = (index: number) =>
    patchParams(asset.params.filter((_, i) => i !== index))
  const addParam = () =>
    patchParams([...asset.params, { name: "newParam", type: "text", desc: "" }])

  if (isViewer) {
    return (
      <>
        <Section title="Parameters" count={asset.params.length}>
          <div className="overflow-hidden rounded-lg border border-border-subtle bg-card">
            {asset.params.map((p, i) => (
              <div
                key={p.name}
                className={cn(
                  "px-3 py-2.5",
                  i < asset.params.length - 1 &&
                    "border-b border-border-subtle",
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[13px] font-medium">
                    {p.name}
                  </span>
                  <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
                    {p.type}
                  </span>
                </div>
                <div className="mt-0.5 text-[12px] text-muted-foreground">
                  {p.desc}
                </div>
                {p.options && p.options.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {p.options.map((o) => (
                      <span
                        key={o}
                        className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10.5px]"
                      >
                        {o}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
        {asset.example && (
          <Section title="Example">
            <pre className="whitespace-pre-wrap rounded-lg bg-muted p-3 font-mono text-[12px] text-muted-foreground">
              {asset.example}
            </pre>
          </Section>
        )}
      </>
    )
  }

  return (
    <>
      <Section title="Parameters" count={asset.params.length}>
        <div className="overflow-hidden rounded-lg border border-border-subtle bg-card">
          {asset.params.map((p, i) => (
            <ParamEditRow
              key={i}
              param={p}
              isLast={i === asset.params.length - 1}
              onPatch={(patch) => patchParam(i, patch)}
              onRemove={() => removeParam(i)}
            />
          ))}
          <button
            type="button"
            onClick={addParam}
            data-param-add
            className={cn(
              "flex w-full items-center gap-2 px-3 py-2 text-left text-[12.5px] text-muted-foreground transition-colors hover:bg-foreground/[0.04] hover:text-foreground",
              asset.params.length > 0 && "border-t border-border-subtle",
            )}
          >
            <Plus className="size-3.5" strokeWidth={2} />
            Add parameter
          </button>
        </div>
      </Section>
      <Section title="Example">
        <ExampleEditor
          assetId={asset.id}
          value={asset.example ?? ""}
          onCommit={(v) =>
            updateLibraryFunction(asset.id, { example: v.trim() || undefined })
          }
        />
      </Section>
    </>
  )
}

function ParamEditRow({
  param,
  isLast,
  onPatch,
  onRemove,
}: {
  param: LibraryFunctionParam
  isLast: boolean
  onPatch: (patch: Partial<LibraryFunctionParam>) => void
  onRemove: () => void
}) {
  const [name, setName] = useState(param.name)
  const [desc, setDesc] = useState(param.desc)
  const [optDraft, setOptDraft] = useState("")
  useEffect(() => {
    setName(param.name)
    setDesc(param.desc)
  }, [param.name, param.desc])

  const commitName = () => {
    const next = name.trim()
    if (!next || next === param.name) {
      setName(param.name)
      return
    }
    onPatch({ name: next })
  }
  const commitDesc = () => {
    if (desc !== param.desc) onPatch({ desc })
  }
  const options = param.options ?? []
  const addOption = () => {
    const v = optDraft.trim()
    setOptDraft("")
    if (v && !options.includes(v)) onPatch({ options: [...options, v] })
  }
  const removeOption = (o: string) =>
    onPatch({ options: options.filter((x) => x !== o) })

  return (
    <div
      className={cn(
        "flex flex-col gap-2 px-3 py-2.5",
        !isLast && "border-b border-border-subtle",
      )}
    >
      <div className="flex items-center gap-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={commitName}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              commitName()
            }
            if (e.key === "Escape") setName(param.name)
          }}
          className="h-7 max-w-[180px] font-mono text-[13px] font-medium"
          data-param-name
        />
        <Select
          value={param.type}
          onValueChange={(v) =>
            onPatch({ type: v as LibraryFunctionParam["type"] })
          }
        >
          <SelectTrigger className="h-7 w-[130px] text-[12px]" data-param-type>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PARAM_TYPES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={onRemove}
          title="Remove parameter"
          data-param-remove
          className="ml-auto flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-3" strokeWidth={2} />
        </button>
      </div>
      <Input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        onBlur={commitDesc}
        placeholder="Description"
        className="h-7 text-[12px]"
        data-param-desc
      />
      <div className="flex flex-wrap items-center gap-1">
        {options.map((o) => (
          <span
            key={o}
            className="inline-flex items-center gap-1 whitespace-nowrap rounded bg-muted px-1.5 py-0.5 font-mono text-[10.5px]"
          >
            {o}
            <button
              type="button"
              onClick={() => removeOption(o)}
              title="Remove option"
              className="text-muted-foreground/50 transition-colors hover:text-destructive"
            >
              <X className="size-2.5" strokeWidth={2.5} />
            </button>
          </span>
        ))}
        <Input
          value={optDraft}
          onChange={(e) => setOptDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault()
              addOption()
            }
          }}
          onBlur={addOption}
          placeholder="+ option"
          className="h-6 w-[90px] text-[11px]"
          data-param-option-add
        />
      </div>
    </div>
  )
}

function ExampleEditor({
  assetId,
  value,
  onCommit,
}: {
  assetId: string
  value: string
  onCommit: (v: string) => void
}) {
  const [draft, setDraft] = useState(value)
  useEffect(() => {
    setDraft(value)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assetId])
  return (
    <Textarea
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) onCommit(draft)
      }}
      placeholder="Usage example…"
      className="min-h-20 rounded-lg bg-muted/40 font-mono text-[12px]"
      data-function-example
    />
  )
}

// ─── Dashboard ───
// C2 잔여: charts CRUD (non-viewer) — title · type(ChartType) · width(ChartWidth)
// 편집 + 추가/삭제. updateLibraryDashboard 재사용 (ensureCanEdit 가드). charts.type/
// width는 string 저장 — enum 값 그대로. viewer는 기존 read-only.
const CHART_TYPES: ChartType[] = [
  "kpi",
  "bar",
  "donut",
  "line",
  "stacked-bar",
  "heatmap",
  "scatter",
  "histogram",
  "pivot",
  "bullet",
  "funnel",
]
const CHART_WIDTHS: ChartWidth[] = ["quarter", "half", "two-thirds", "full"]

function DashboardBody({ asset }: { asset: LibraryDashboard }) {
  const isViewer = useFlowBase(selectIsViewer)
  const updateLibraryDashboard = useFlowBase((s) => s.updateLibraryDashboard)

  if (isViewer) {
    return (
      <Section title="Charts" count={asset.charts.length}>
        <div className="grid grid-cols-2 gap-2">
          {asset.charts.map((c, i) => (
            <div
              key={i}
              className="flex flex-col gap-1 rounded-lg border border-border-subtle bg-card p-3"
            >
              <div className="flex items-center gap-1.5">
                <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[10.5px] text-muted-foreground">
                  {c.type}
                </span>
                <span className="text-[10.5px] text-muted-foreground">
                  {c.width}
                </span>
              </div>
              <div className="text-[13px] font-medium">{c.title}</div>
            </div>
          ))}
        </div>
      </Section>
    )
  }

  const patchCharts = (charts: LibraryDashboard["charts"]) =>
    updateLibraryDashboard(asset.id, { charts })
  const patchChart = (
    index: number,
    patch: Partial<LibraryDashboard["charts"][number]>,
  ) =>
    patchCharts(
      asset.charts.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    )
  const removeChart = (index: number) =>
    patchCharts(asset.charts.filter((_, i) => i !== index))
  const addChart = () =>
    patchCharts([
      ...asset.charts,
      { type: "bar", title: "New chart", width: "half" },
    ])

  return (
    <Section title="Charts" count={asset.charts.length}>
      <div className="grid grid-cols-2 gap-2">
        {asset.charts.map((c, i) => (
          <ChartEditCard
            key={i}
            chart={c}
            onPatch={(patch) => patchChart(i, patch)}
            onRemove={() => removeChart(i)}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={addChart}
        data-chart-add
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-subtle py-2 text-[12.5px] text-muted-foreground transition-colors hover:border-border hover:bg-foreground/[0.04] hover:text-foreground"
      >
        <Plus className="size-3.5" strokeWidth={2} />
        Add chart
      </button>
    </Section>
  )
}

function ChartEditCard({
  chart,
  onPatch,
  onRemove,
}: {
  chart: LibraryDashboard["charts"][number]
  onPatch: (patch: Partial<LibraryDashboard["charts"][number]>) => void
  onRemove: () => void
}) {
  const [title, setTitle] = useState(chart.title)
  useEffect(() => {
    setTitle(chart.title)
  }, [chart.title])

  const commitTitle = () => {
    const next = title.trim()
    if (!next || next === chart.title) {
      setTitle(chart.title)
      return
    }
    onPatch({ title: next })
  }

  // charts.type/width는 string — seed에 enum 밖 값("one-third", "area") 존재.
  // 현재 값이 표준 목록에 없으면 옵션에 포함해 표시·round-trip 보존.
  const typeOptions: string[] = (CHART_TYPES as string[]).includes(chart.type)
    ? CHART_TYPES
    : [...CHART_TYPES, chart.type]
  const widthOptions: string[] = (CHART_WIDTHS as string[]).includes(chart.width)
    ? CHART_WIDTHS
    : [...CHART_WIDTHS, chart.width]

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-card p-3">
      <div className="flex items-center gap-1.5">
        <Select value={chart.type} onValueChange={(v) => onPatch({ type: v })}>
          <SelectTrigger
            className="h-6 w-[120px] font-mono text-[11px]"
            data-chart-type
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={chart.width} onValueChange={(v) => onPatch({ width: v })}>
          <SelectTrigger
            className="h-6 w-[110px] text-[11px]"
            data-chart-width
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {widthOptions.map((w) => (
              <SelectItem key={w} value={w}>
                {w}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={onRemove}
          title="Remove chart"
          data-chart-remove
          className="ml-auto flex size-5 shrink-0 items-center justify-center rounded text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <X className="size-3" strokeWidth={2} />
        </button>
      </div>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={commitTitle}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault()
            commitTitle()
          }
          if (e.key === "Escape") setTitle(chart.title)
        }}
        placeholder="Chart title"
        className="h-7 text-[13px] font-medium"
        data-chart-title
      />
    </div>
  )
}
