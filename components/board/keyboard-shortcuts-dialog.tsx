// FlowBase V2 — Keyboard shortcuts help dialog (P2)
// ⌘/ 또는 ⌘? 단축키로 토글. CustomEvent flowbase-toggle-shortcuts-help listener.
// 카테고리별 그룹 — Navigation / Editing / Search / Panels.

"use client"

import { useEffect, useState } from "react"
import { Keyboard } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Kbd } from "@/components/ui/kbd"

interface ShortcutGroup {
  label: string
  items: { keys: string[]; description: string }[]
}

const GROUPS: ShortcutGroup[] = [
  {
    label: "Search & navigation",
    items: [
      { keys: ["⌘", "K"], description: "Open search palette" },
      { keys: ["⌘", "J"], description: "Ask AI (focus composer)" },
      { keys: ["⌘", "/"], description: "Show keyboard shortcuts (this)" },
    ],
  },
  {
    label: "Editing",
    items: [
      { keys: ["⌘", "N"], description: "Add new row" },
      { keys: ["⌘", "D"], description: "Duplicate selected rows" },
      { keys: ["Delete"], description: "Delete selected rows (move to Trash)" },
      { keys: ["⌘", "Z"], description: "Undo" },
      { keys: ["⌘", "⇧", "Z"], description: "Redo" },
    ],
  },
  {
    label: "Panels",
    items: [
      { keys: ["⌘", "⇧", "A"], description: "Toggle Activity bar" },
      { keys: ["⌘", "⇧", "F"], description: "Toggle Sidebar" },
      { keys: ["⌘", "B"], description: "Toggle AI panel" },
      { keys: ["⌘", "I"], description: "Toggle Detail bar" },
    ],
  },
  {
    label: "Sheet cell",
    items: [
      { keys: ["↑", "↓", "←", "→"], description: "Move focused cell" },
      { keys: ["Enter"], description: "Edit focused cell" },
      { keys: ["Esc"], description: "Cancel editing / close popover" },
      { keys: ["Tab"], description: "Next cell (autocomplete commit)" },
    ],
  },
]

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const handler = () => setOpen((o) => !o)
    window.addEventListener("flowbase-toggle-shortcuts-help", handler)
    return () =>
      window.removeEventListener("flowbase-toggle-shortcuts-help", handler)
  }, [])
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="size-4" />
            Keyboard shortcuts
          </DialogTitle>
          <DialogDescription className="text-[12px]">
            Press <Kbd className="text-[10.5px]">⌘</Kbd>
            <Kbd className="text-[10.5px]">/</Kbd> any time to open this.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {GROUPS.map((g) => (
            <section key={g.label}>
              <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {g.label}
              </div>
              <ul className="space-y-1">
                {g.items.map((it, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between gap-3 text-[12.5px]"
                  >
                    <span className="text-foreground">{it.description}</span>
                    <span className="inline-flex items-center gap-0.5">
                      {it.keys.map((k, j) => (
                        <Kbd key={j} className="text-[10.5px]">
                          {k}
                        </Kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
