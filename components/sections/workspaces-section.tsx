"use client"

import { useMemo, useState } from "react"
import {
  Archive,
  Calendar,
  MoreHorizontal,
  Plus,
  Search,
  Table2,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import {
  WORKSPACES,
  ACTIVE_WORKSPACE_ID,
  workspaceColorDotClass,
  type Workspace,
} from "@/lib/mock-workspaces"

type FilterTab = "all" | "active" | "archived"

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" })
}

export function WorkspacesSection() {
  const [search, setSearch] = useState("")
  const [filterTab, setFilterTab] = useState<FilterTab>("all")

  const filteredWorkspaces = useMemo(() => {
    let items = [...WORKSPACES]

    // Filter by tab
    if (filterTab === "active") {
      items = items.filter((w) => !w.archived)
    } else if (filterTab === "archived") {
      items = items.filter((w) => w.archived)
    }

    // Filter by search
    if (search.trim()) {
      const q = search.toLowerCase()
      items = items.filter((w) => w.name.toLowerCase().includes(q))
    }

    return items
  }, [filterTab, search])

  const counts = useMemo(() => {
    return {
      all: WORKSPACES.length,
      active: WORKSPACES.filter((w) => !w.archived).length,
      archived: WORKSPACES.filter((w) => w.archived).length,
    }
  }, [])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-surface">
        <div>
          <h2 className="text-lg font-semibold">워크스페이스</h2>
          <p className="text-xs text-muted-foreground">모든 워크스페이스를 관리합니다</p>
        </div>
        <Button size="sm" className="gap-1.5 h-8 text-sm">
          <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
          새 워크스페이스
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/60 bg-surface">
        <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as FilterTab)}>
          <TabsList className="h-8">
            <TabsTrigger value="all" className="text-xs h-7 px-3">
              전체 ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="active" className="text-xs h-7 px-3">
              활성 ({counts.active})
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-xs h-7 px-3">
              보관됨 ({counts.archived})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="워크스페이스 검색"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 border-border/60"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {filteredWorkspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center">
              <Search className="w-8 h-8 text-muted-foreground/40" strokeWidth={1} />
            </div>
            <p className="mt-4 text-base font-medium">워크스페이스를 찾을 수 없습니다</p>
            <p className="mt-1 text-sm text-muted-foreground">검색어를 변경하거나 필터를 조정하세요</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                isActive={workspace.id === ACTIVE_WORKSPACE_ID}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface WorkspaceCardProps {
  workspace: Workspace
  isActive: boolean
}

function WorkspaceCard({ workspace, isActive }: WorkspaceCardProps) {
  return (
    <Card
      className={cn(
        "group border-border/60 hover:shadow-md transition-shadow cursor-pointer",
        isActive && "ring-2 ring-primary",
        workspace.archived && "opacity-60"
      )}
      onClick={() => console.log("select workspace:", workspace.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={cn(
                "w-3 h-3 rounded-full shrink-0",
                workspaceColorDotClass(workspace.color)
              )}
            />
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                {workspace.name}
                {isActive && (
                  <span className="text-[10px] font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                    활성
                  </span>
                )}
                {workspace.archived && (
                  <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                    보관됨
                  </span>
                )}
              </CardTitle>
              {workspace.description && (
                <CardDescription className="text-xs mt-0.5 line-clamp-1">
                  {workspace.description}
                </CardDescription>
              )}
            </div>
          </div>
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
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => console.log("open", workspace.id)}>
                열기
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => console.log("edit", workspace.id)}>
                수정
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {workspace.archived ? (
                <DropdownMenuItem onClick={() => console.log("unarchive", workspace.id)}>
                  보관 해제
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => console.log("archive", workspace.id)}>
                  <Archive className="w-3.5 h-3.5 mr-2" strokeWidth={1.5} />
                  보관
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => console.log("delete", workspace.id)}
              >
                삭제
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Table2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>{workspace.tables} 테이블</span>
          </div>
          {workspace.members && (
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>{workspace.members}명</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 ml-auto">
            <Calendar className="w-3.5 h-3.5" strokeWidth={1.5} />
            <span>{formatDate(workspace.updatedAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
