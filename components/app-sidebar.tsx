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
  Search,
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
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Database className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sidebar-foreground">FlowDB</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Database className="w-4 h-4 text-primary-foreground" />
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("h-8 w-8 text-sidebar-foreground", collapsed && "hidden")}
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick Actions */}
      {!collapsed && (
        <div className="p-3 space-y-2">
          <Button className="w-full justify-start gap-2" size="sm">
            <Plus className="w-4 h-4" />
            새 워크스페이스
          </Button>
          <Button variant="outline" className="w-full justify-start gap-2" size="sm">
            <Upload className="w-4 h-4" />
            CSV 업로드
          </Button>
        </div>
      )}

      {/* Search */}
      {!collapsed && (
        <div className="px-3 pb-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-sidebar-accent rounded-md">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="검색..."
              className="bg-transparent border-none outline-none text-sm flex-1 text-sidebar-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
            메인
          </span>
        )}
        <div className="mt-2 space-y-1">
          {mainNavItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                activeSection === item.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                collapsed && "justify-center px-2"
              )}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1 text-left">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
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
            <div className="mt-6">
              <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                워크스페이스
              </span>
            </div>
            <div className="mt-2 space-y-1">
              {workspaces.map((workspace) => (
                <button
                  key={workspace.id}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
                >
                  <div className="w-2 h-2 rounded-full bg-accent" />
                  <span className="flex-1 text-left truncate">{workspace.name}</span>
                  <span className="text-xs text-muted-foreground">{workspace.tables}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-sidebar-border">
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && (
            <Button variant="ghost" size="icon" className="h-9 w-9 text-sidebar-foreground">
              <Settings className="w-4 h-4" />
            </Button>
          )}
          <ThemeToggle />
          {collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-sidebar-foreground"
              onClick={() => setCollapsed(false)}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
