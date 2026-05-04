// visual mockup: trash (logic-free)
"use client"

import { useMemo, useState } from "react"
import {
  Briefcase,
  Columns3,
  Database,
  RotateCcw,
  Rows3,
  Search,
  Trash2,
  Upload,
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"
import {
  KIND_TONE,
  TRASH_ITEMS,
  type TrashItem,
  type TrashItemKind,
} from "@/lib/mock-trash"

type SortKey = "expires" | "deleted" | "kind"
type FilterKind = "all" | TrashItemKind

const KIND_ICONS: Record<TrashItemKind, React.ElementType> = {
  row: Rows3,
  field: Columns3,
  table: Database,
  import: Upload,
  workspace: Briefcase,
}

const KIND_LABELS: Record<TrashItemKind, string> = {
  row: "행",
  field: "필드",
  table: "테이블",
  import: "Import",
  workspace: "워크스페이스",
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "오늘"
  if (diffDays === 1) return "어제"
  if (diffDays < 7) return `${diffDays}일 전`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`
  return `${Math.floor(diffDays / 30)}개월 전`
}

function daysUntilExpiry(dateStr: string): number {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = date.getTime() - now.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}

function formatExpiryText(dateStr: string): string {
  const days = daysUntilExpiry(dateStr)
  if (days <= 0) return "만료됨"
  if (days === 1) return "1일 후"
  return `${days}일 후`
}

export default function TrashPage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [filterKind, setFilterKind] = useState<FilterKind>("all")
  const [sortKey, setSortKey] = useState<SortKey>("expires")
  const [search, setSearch] = useState("")

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<TrashItem | null>(null)
  const [emptyDialogOpen, setEmptyDialogOpen] = useState(false)

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let items = [...TRASH_ITEMS]

    // Filter by kind
    if (filterKind !== "all") {
      items = items.filter((item) => item.kind === filterKind)
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.source.toLowerCase().includes(q)
      )
    }

    // Sort
    items.sort((a, b) => {
      switch (sortKey) {
        case "expires":
          return new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()
        case "deleted":
          return new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime()
        case "kind":
          return a.kind.localeCompare(b.kind)
        default:
          return 0
      }
    })

    return items
  }, [filterKind, sortKey, search])

  // Count by kind
  const kindCounts = useMemo(() => {
    const counts: Record<FilterKind, number> = {
      all: TRASH_ITEMS.length,
      row: 0,
      field: 0,
      table: 0,
      import: 0,
      workspace: 0,
    }
    TRASH_ITEMS.forEach((item) => {
      counts[item.kind]++
    })
    return counts
  }, [])

  const allSelected =
    filteredItems.length > 0 && filteredItems.every((item) => selectedIds.has(item.id))
  const someSelected = selectedIds.size > 0

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filteredItems.map((item) => item.id)))
    }
  }

  const handleSelectItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleDeleteSingle = (item: TrashItem) => {
    setDeleteTarget(item)
    setDeleteDialogOpen(true)
  }

  const handleDeleteSelected = () => {
    setDeleteTarget(null)
    setDeleteDialogOpen(true)
  }

  const isEmpty = TRASH_ITEMS.length === 0

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-semibold">휴지통</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            삭제한 항목은 30일간 보관됩니다
          </p>
        </div>
        <Button
          variant="ghost"
          className="text-destructive hover:text-destructive hover:bg-destructive/10"
          disabled={isEmpty}
          onClick={() => setEmptyDialogOpen(true)}
        >
          모두 비우기
        </Button>
      </div>

      {isEmpty ? (
        // Empty state
        <div className="flex-1 flex flex-col items-center justify-center min-h-[400px]">
          <Trash2 className="w-16 h-16 text-muted-foreground/40" strokeWidth={1} />
          <p className="mt-4 text-base font-medium text-foreground">
            휴지통이 비어 있습니다
          </p>
          <p className="mt-1 text-sm text-muted-foreground max-w-md text-center">
            삭제한 항목은 30일간 여기에 보관되어 언제든 복원할 수 있습니다
          </p>
        </div>
      ) : (
        <>
          {/* Filter/Search toolbar */}
          <div className="flex items-center gap-4 px-6 py-3 border-b border-border/60 bg-surface">
            {/* Search */}
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="항목 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 border-border/60"
              />
            </div>

            {/* Kind filter chips */}
            <div className="flex items-center gap-1.5 flex-1">
              {(["all", "row", "field", "table", "import", "workspace"] as FilterKind[]).map(
                (kind) => (
                  <button
                    key={kind}
                    onClick={() => setFilterKind(kind)}
                    className={cn(
                      "px-2.5 py-1 text-xs font-medium rounded-md border transition-colors",
                      filterKind === kind
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:bg-foreground/5"
                    )}
                  >
                    {kind === "all" ? "전체" : KIND_LABELS[kind]} ({kindCounts[kind]})
                  </button>
                )
              )}
            </div>

            {/* Sort */}
            <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
              <SelectTrigger className="w-36 h-9 border-border/60">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expires">만료 임박</SelectItem>
                <SelectItem value="deleted">삭제일 순</SelectItem>
                <SelectItem value="kind">종류별</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk action bar */}
          {someSelected && (
            <div className="flex items-center justify-between px-6 py-2 bg-muted/50 border-b border-border/60 sticky top-0 z-10">
              <span className="text-sm font-medium">{selectedIds.size}개 선택됨</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 border-border/60"
                  onClick={() => console.log("restore selected")}
                >
                  <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
                  복원
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={handleDeleteSelected}
                >
                  <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                  영구 삭제
                </Button>
              </div>
            </div>
          )}

          {/* Table */}
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow className="hover:bg-transparent border-border/60">
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="전체 선택"
                    />
                  </TableHead>
                  <TableHead className="w-[40%]">이름</TableHead>
                  <TableHead className="w-[10%]">종류</TableHead>
                  <TableHead className="w-[15%]">출처</TableHead>
                  <TableHead className="w-[12%]">삭제 일시</TableHead>
                  <TableHead className="w-[12%]">만료까지</TableHead>
                  <TableHead className="w-[10%]">액션</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => {
                  const Icon = KIND_ICONS[item.kind]
                  const daysLeft = daysUntilExpiry(item.expiresAt)
                  const isExpiringSoon = daysLeft <= 3
                  const isSelected = selectedIds.has(item.id)

                  return (
                    <TableRow
                      key={item.id}
                      className={cn(
                        "group border-border/60",
                        isSelected
                          ? "bg-foreground/[0.05]"
                          : "hover:bg-foreground/[0.03]"
                      )}
                    >
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleSelectItem(item.id)}
                          aria-label={`${item.name} 선택`}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
                          <span className="truncate font-medium">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] font-medium border", KIND_TONE[item.kind])}
                        >
                          {KIND_LABELS[item.kind]}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {item.source}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatRelativeDate(item.deletedAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {isExpiringSoon && (
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
                          )}
                          <span
                            className={cn(
                              "text-sm",
                              isExpiringSoon
                                ? "text-rose-600 dark:text-rose-400 font-medium"
                                : "text-muted-foreground"
                            )}
                          >
                            {formatExpiryText(item.expiresAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-foreground/5"
                            onClick={() => console.log("restore", item.id)}
                          >
                            <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleDeleteSingle(item)}
                          >
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>영구 삭제 확인</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget
                ? `"${deleteTarget.name}"을(를) 영구 삭제합니다. 이 행동은 되돌릴 수 없습니다.`
                : `${selectedIds.size}개 항목을 영구 삭제합니다. 되돌릴 수 없습니다.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/60">취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => console.log("delete confirmed")}
            >
              영구 삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty all dialog */}
      <AlertDialog open={emptyDialogOpen} onOpenChange={setEmptyDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>휴지통 비우기</AlertDialogTitle>
            <AlertDialogDescription>
              휴지통의 모든 항목 ({TRASH_ITEMS.length}개)을 영구 삭제합니다. 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border/60">취소</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => console.log("empty all confirmed")}
            >
              모두 삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
