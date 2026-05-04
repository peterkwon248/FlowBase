// visual: Linear-style sidebar — 240px, compact header, subtle borders, tight spacing
"use client"

import { useState } from "react"
import {
  Database,
  LayoutGrid,
  Table2,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

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

const workspaces = [
  { id: "1", name: "고객 상담 DB", tables: 5 },
  { id: "2", name: "재고 관리", tables: 3 },
  { id: "3", name: "프로젝트 추적", tables: 8 },
]

interface AppSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

export function AppSidebar({ activeSection, onSectionChange }: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border/60 transition-all duration-200",
        collapsed ? "w-14" : "w-60"
      )}
    >
      {/* Header - compact */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-sidebar-border/60">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Database className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={1.5} />
            </div>
            <span className="font-semibold text-sm text-sidebar-foreground">FlowDB</span>
          </div>
        )}
        {collapsed && (
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center mx-auto">
            <Database className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={1.5} />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-7 w-7 text-sidebar-foreground hover:bg-foreground/5", collapsed && "hidden")}
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
        </Button>
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

        {/* Workspaces */}
        {!collapsed && (
          <>
            <div className="mt-5 pt-3 border-t border-sidebar-border/40">
              <span className="px-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                워크스페이스
              </span>
            </div>
            <div className="mt-1.5 space-y-0.5">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm text-sidebar-foreground hover:bg-foreground/5 transition-colors"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  <span className="flex-1 text-left truncate">{workspace.name}</span>
                  <span className="text-[11px] text-muted-foreground tabular-nums">{workspace.tables}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Footer - compact */}
      <div className="px-2 py-2 border-t border-sidebar-border/60">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground hover:bg-foreground/5">
              <Settings className="w-4 h-4" strokeWidth={1.5} />
            </Button>
          )}
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
    </aside>
  )
}
