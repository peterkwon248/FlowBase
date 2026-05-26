// FlowBase V2 — 헤더 nav-cluster (시계 · ‹ · ›)
// 출처: design-ref/prototype/nav-history.jsx NavCluster
//
// 인메모리 navStack/navIndex 기반. 시계 클릭 → 최근 history 드롭다운.
// 모드/보드/자산/페이지 변경이 store 액션을 통해 push되어 자동 트래킹.

"use client"

import { useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Clock } from "lucide-react"
import { useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"

export function NavCluster() {
  const navStack = useFlowBase((s) => s.navStack)
  const navIndex = useFlowBase((s) => s.navIndex)
  const goBack = useFlowBase((s) => s.goBack)
  const goForward = useFlowBase((s) => s.goForward)
  const jumpToNavEntry = useFlowBase((s) => s.jumpToNavEntry)

  const canBack = navIndex > 0
  const canForward = navIndex >= 0 && navIndex < navStack.length - 1
  const hasHistory = navStack.length > 0

  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // 바깥 클릭 시 닫기
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [open])

  return (
    <div className="inline-flex shrink-0 items-center gap-1">
      <div ref={wrapRef} className="relative">
        <NavButton
          active={hasHistory}
          title="Recent history"
          onClick={() => setOpen((o) => !o)}
        >
          <Clock className="size-3.5" strokeWidth={1.75} />
        </NavButton>
        {open && hasHistory && (
          <div className="absolute left-0 top-full z-50 mt-1 max-h-[360px] w-[280px] overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-md">
            <div className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              Recent
            </div>
            {[...navStack]
              .slice(0, 20)
              .map((entry, displayIdx) => {
                const realIdx = navStack.length - 1 - displayIdx
                const active = realIdx === navIndex
                return (
                  <button
                    key={`${entry.key}-${realIdx}`}
                    type="button"
                    onClick={() => {
                      jumpToNavEntry(realIdx)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-left text-[12.5px] transition-colors",
                      active
                        ? "bg-foreground/[0.08] text-foreground"
                        : "text-foreground hover:bg-foreground/[0.04]",
                    )}
                  >
                    <span className="inline-flex size-[18px] shrink-0 items-center justify-center rounded bg-muted text-[10px] text-muted-foreground">
                      {entry.mode[0].toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{entry.label}</div>
                      {entry.sub && (
                        <div className="truncate text-[10.5px] text-muted-foreground">
                          {entry.sub}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
          </div>
        )}
      </div>
      <NavButton
        active={canBack}
        title="Back"
        onClick={() => goBack()}
      >
        <ChevronLeft className="size-3.5" strokeWidth={2} />
      </NavButton>
      <NavButton
        active={canForward}
        title="Forward"
        onClick={() => goForward()}
      >
        <ChevronRight className="size-3.5" strokeWidth={2} />
      </NavButton>
    </div>
  )
}

function NavButton({
  active,
  title,
  onClick,
  children,
}: {
  active: boolean
  title: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={!active}
      className={cn(
        "flex size-6 items-center justify-center rounded-md border border-border-subtle bg-card text-muted-foreground transition-colors",
        active
          ? "cursor-pointer hover:bg-foreground/[0.06] hover:text-foreground"
          : "opacity-35",
      )}
    >
      {children}
    </button>
  )
}
