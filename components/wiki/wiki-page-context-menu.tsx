// FlowBase V2 — Wiki 사이드바 페이지 우클릭 메뉴
// Rename(Dialog) · Move to category(submenu) · Delete(AlertDialog).

"use client"

import { useMemo, useState, type ReactNode } from "react"
import { FolderInput, Pencil, Trash2 } from "lucide-react"
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
import { Button } from "@/components/ui/button"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { selectIsViewer, useFlowBase } from "@/lib/flowbase-store"
import type { WikiPage } from "@/types/flowbase"

export function WikiPageContextMenu({
  page,
  children,
}: {
  page: WikiPage
  children: ReactNode
}) {
  const wikiPages = useFlowBase((s) => s.wikiPages)
  const updateWikiPage = useFlowBase((s) => s.updateWikiPage)
  const deleteWikiPage = useFlowBase((s) => s.deleteWikiPage)
  const isViewer = useFlowBase(selectIsViewer)

  const [renameOpen, setRenameOpen] = useState(false)
  const [draftTitle, setDraftTitle] = useState(page.title)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const categories = useMemo(() => {
    const set = new Set<string>()
    for (const p of wikiPages) set.add(p.category || "Uncategorized")
    set.add("Concepts")
    set.add("Runbooks")
    set.add("Reference")
    set.add("Onboarding")
    set.add("Team")
    return Array.from(set).sort()
  }, [wikiPages])

  const openRename = () => {
    setDraftTitle(page.title)
    setRenameOpen(true)
  }

  const saveRename = () => {
    const t = draftTitle.trim()
    if (t) updateWikiPage(page.id, { title: t })
    setRenameOpen(false)
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild data-wiki-page-trigger={page.id}>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem
            onSelect={openRename}
            disabled={isViewer}
            className="gap-2"
          >
            <Pencil className="size-3.5 text-muted-foreground" />
            Rename
          </ContextMenuItem>
          <ContextMenuSub>
            <ContextMenuSubTrigger className="gap-2" disabled={isViewer}>
              <FolderInput className="size-3.5 text-muted-foreground" />
              <span>Move to</span>
            </ContextMenuSubTrigger>
            <ContextMenuSubContent
              className="w-40"
              data-wiki-move-target={page.id}
            >
              {categories.map((cat) => (
                <ContextMenuItem
                  key={cat}
                  onSelect={() => updateWikiPage(page.id, { category: cat })}
                  disabled={isViewer}
                  className="gap-2"
                  data-wiki-move-to={cat}
                >
                  <span
                    className={
                      cat === page.category
                        ? "font-semibold text-foreground"
                        : ""
                    }
                  >
                    {cat}
                  </span>
                  {cat === page.category && (
                    <span className="ml-auto text-[10px] text-muted-foreground">
                      current
                    </span>
                  )}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>
          <ContextMenuSeparator />
          <ContextMenuItem
            onSelect={() => setConfirmDelete(true)}
            disabled={isViewer}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <Trash2 className="size-3.5" />
            Delete
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Rename page</DialogTitle>
            <DialogDescription className="text-[12px]">
              The page URL/ID stays the same.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="wiki-rename" className="text-[12px]">
              Title
            </Label>
            <Input
              id="wiki-rename"
              autoFocus
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveRename()
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete &ldquo;{page.title}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              The page moves to trash and is permanently deleted after 30 days.
              You can restore it from Trash any time before then.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteWikiPage(page.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
