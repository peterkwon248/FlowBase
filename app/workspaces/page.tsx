// visual mockup: workspace-ux (logic-free)
"use client"

import { useState } from "react"
import {
  Plus,
  Search,
  MoreHorizontal,
  ArrowLeft,
  Users,
  Table2,
  Pencil,
  Archive,
  Trash2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  WORKSPACES,
  ACTIVE_WORKSPACE_ID,
  workspaceColorDotClass,
  formatRelativeTime,
} from "@/lib/mock-workspaces"

type StatusFilter = "all" | "active" | "archived"
type SortOption = "name" | "recent" | "tables"

export default function WorkspacesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [sortOption, setSortOption] = useState<SortOption>("recent")

  // Filter workspaces
  const filteredWorkspaces = WORKSPACES.filter((w) => {
    // Status filter
    if (statusFilter === "active" && w.archived) return false
    if (statusFilter === "archived" && !w.archived) return false

    // Search filter
    if (
      searchQuery &&
      !w.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    return true
  }).sort((a, b) => {
    switch (sortOption) {
      case "name":
        return a.name.localeCompare(b.name)
      case "recent":
        return (
          new Date(b.lastActivityAt).getTime() -
          new Date(a.lastActivityAt).getTime()
        )
      case "tables":
        return b.tables - a.tables
      default:
        return 0
    }
  })

  const statusFilters: { value: StatusFilter; label: string; count: number }[] = [
    { value: "all", label: "전체", count: WORKSPACES.length },
    { value: "active", label: "활성", count: WORKSPACES.filter((w) => !w.archived).length },
    { value: "archived", label: "아카이브", count: WORKSPACES.filter((w) => w.archived).length },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/60 bg-background/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => console.log("navigate back")}
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={1.5} />
              </Button>
              <div>
                <h1 className="text-xl font-semibold">워크스페이스</h1>
                <p className="text-sm text-muted-foreground">
                  전체 워크스페이스를 관리합니다
                </p>
              </div>
            </div>
            <Button
              className="gap-2"
              onClick={() => console.log("create new workspace")}
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
              새 워크스페이스
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-6">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
            <Input
              placeholder="이름으로 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 pl-9 text-sm"
            />
          </div>

          {/* Status filter chips */}
          <div className="flex items-center gap-1.5">
            {statusFilters.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                  statusFilter === filter.value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {filter.label}
                <span className="ml-1.5 text-xs opacity-70">{filter.count}</span>
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Sort */}
          <Select value={sortOption} onValueChange={(v) => setSortOption(v as SortOption)}>
            <SelectTrigger className="w-36 h-9 text-sm">
              <SelectValue placeholder="정렬" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">최근 활동</SelectItem>
              <SelectItem value="name">이름</SelectItem>
              <SelectItem value="tables">테이블 수</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Cards Grid */}
        {filteredWorkspaces.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkspaces.map((workspace) => {
              const isActive = workspace.id === ACTIVE_WORKSPACE_ID
              return (
                <Card
                  key={workspace.id}
                  className={cn(
                    "group cursor-pointer transition-all hover:shadow-md",
                    "border-border/60 hover:border-border",
                    workspace.archived && "opacity-60"
                  )}
                  onClick={() => console.log("switch to workspace:", workspace.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={cn(
                            "w-2.5 h-2.5 rounded-full shrink-0",
                            workspaceColorDotClass(workspace.color)
                          )}
                        />
                        <span className="font-semibold text-sm">
                          {workspace.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {isActive && (
                          <Badge
                            variant="default"
                            className="text-[10px] px-1.5 py-0"
                          >
                            활성
                          </Badge>
                        )}
                        {workspace.archived && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] px-1.5 py-0"
                          >
                            아카이브
                          </Badge>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="w-4 h-4" strokeWidth={1.5} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            <DropdownMenuItem onClick={() => console.log("rename")}>
                              <Pencil className="w-4 h-4 mr-2" strokeWidth={1.5} />
                              이름 변경
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => console.log("archive")}>
                              <Archive className="w-4 h-4 mr-2" strokeWidth={1.5} />
                              {workspace.archived ? "복원" : "아카이브"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => console.log("delete")}
                            >
                              <Trash2 className="w-4 h-4 mr-2" strokeWidth={1.5} />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Table2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span>{workspace.tables}개 테이블</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span>{workspace.members}명</span>
                      </div>
                      <span className="ml-auto">
                        {formatRelativeTime(workspace.lastActivityAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Table2 className="w-8 h-8 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg font-medium mb-1">
              {searchQuery || statusFilter !== "all"
                ? "검색 결과가 없습니다"
                : "아직 워크스페이스가 없습니다"}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {searchQuery || statusFilter !== "all"
                ? "다른 검색어나 필터를 시도해보세요"
                : "첫 워크스페이스를 만들어 시작하세요"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button
                className="gap-2"
                onClick={() => console.log("create new workspace")}
              >
                <Plus className="w-4 h-4" strokeWidth={1.5} />
                첫 워크스페이스 만들기
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
