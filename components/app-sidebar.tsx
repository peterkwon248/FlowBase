// visual mockup: workspace-ux (logic-free)
// Linear-style sidebar — 240px, compact header with workspace switcher, active workspace highlight
"use client"

import { useState } from "react"
import {
  LayoutGrid,
  Table2,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  Trash2,
  BarChart3,
} from "lucide-react"
import { TRASH_ITEMS } from "@/lib/mock-trash"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { WorkspaceSwitcher } from "@/components/workspace-switcher"
import {
  WORKSPACES,
  ACTIVE_WORKSPACE_ID,
  workspaceColorDotClass,
} from "@/lib/mock-workspaces"

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  badge?: number
}

const mainNavItems: NavItem[] = [
  { id: "design", label: "설계", icon: LayoutGrid },
  { id: "data", label: "데이터", icon: Table2 },
  { id: "operations", label: "운영", icon: ClipboardList, badge: 12 },
]

interface AppSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function AppSidebar({ activeSection, onSectionChange }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  // Get active workspaces (non-archived)
  const activeWorkspaces = WORKSPACES.filter((w) => !w.archived)

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border/60 transition-all duration-200",
        collapsed ? "w-14" : "w-60"
      )}
    >
      {/* Header - Workspace Switcher */}
      <div className="flex items-center justify-between px-2 py-2 border-b border-sidebar-border/60">
        <WorkspaceSwitcher collapsed={collapsed} />
        {!collapsed && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-sidebar-foreground hover:bg-foreground/5 shrink-0"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
          </Button>
        )}
      </div>

      {/* Quick Actions - tight spacing */}
      {!collapsed && (
        <div className="px-2 py-2 space-y-1">
          <Button className="w-full justify-start gap-2 h-8 text-sm font-medium" size="sm">
            <Plus className="w-4 h-4" strokeWidth={1.5} />
            새 워크스페이스
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2 h-8 text-sm font-medium border-border/60" size="sm">
            <Upload className="w-4 h-4" strokeWidth={1.5} />
            CSV 업로드
          </Button>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-2 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <span className="px-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
            메인
          </span>
        )}
        <div className="mt-1.5 space-y-0.5">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors",
                activeSection === item.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-foreground/5",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary text-primary-foreground rounded-full tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </button>
          ))}
        </div>

        {/* Dashboard - separate group */}
        {!collapsed && (
          <>
            <div className="mt-5 pt-3 border-t border-sidebar-border/40">
              <span className="px-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                전체 보기
              </span>
            </div>
            <div className="mt-1.5 space-y-0.5">
              <button
                onClick={() => console.log("navigate /dashboard")}
                className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-sidebar-foreground hover:bg-foreground/5 transition-colors"
              >
                <BarChart3 className="w-4 h-4 shrink-0" strokeWidth={1.5} />
                <span className="flex-1 text-left">대시보드</span>
              </button>
            </div>
          </>
        )}

        {/* Workspaces with active highlight */}
        {!collapsed && (
          <>
            <div className="mt-5 pt-3 border-t border-sidebar-border/40">
              <span className="px-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                워크스페이스
              </span>
            </div>
            <div className="mt-1.5 space-y-0.5">
              {activeWorkspaces.map((workspace) => {
                const isActive = workspace.id === ACTIVE_WORKSPACE_ID
                return (
                  <button
                    key={workspace.id}
                    onClick={() => console.log("switch to workspace:", workspace.id)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors relative",
                      isActive
                        ? "bg-foreground/[0.03] font-semibold text-sidebar-foreground"
                        : "text-sidebar-foreground hover:bg-foreground/5"
                    )}
                  >
                    {/* Active indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-primary rounded-full" />
                    )}
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full shrink-0",
                        workspaceColorDotClass(workspace.color)
                      )}
                    />
                    <span className="flex-1 text-left truncate">{workspace.name}</span>
                    <span className="text-[11px] text-muted-foreground tabular-nums">
                      {workspace.tables}
                    </span>
                  </button>
                )
              })}
            </div>
          </>
        )}
      </nav>

      {/* Footer - compact */}
      <div className="px-2 py-2 border-t border-sidebar-border/60">
        <div className={cn("flex items-center", collapsed ? "justify-center gap-1" : "justify-between")}>
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground hover:bg-foreground/5"
              onClick={() => console.log("navigate /settings")}
            >
              <Settings className="w-4 h-4" strokeWidth={1.5} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-sidebar-foreground hover:bg-foreground/5 relative"
              onClick={() => console.log("navigate /trash")}
            >
              <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              {TRASH_ITEMS.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 text-[9px] font-medium bg-primary text-primary-foreground rounded-full flex items-center justify-center tabular-nums">
                  {TRASH_ITEMS.length > 9 ? "9+" : TRASH_ITEMS.length}
                </span>
              )}
            </Button>
          </div>
          <div className="flex items-center gap-0.5">
            <ThemeToggle />
            {collapsed && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-sidebar-foreground hover:bg-foreground/5"
                onClick={() => setCollapsed(false)}
              >
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </Button>
            )}
          </div>
        </div>
      </div>
    </aside>
  )
}
