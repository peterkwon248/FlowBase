// FlowBase V2 — Wiki 페이지 상세 (제목 · 메타 · 본문 · 편집 모드)
// 출처: design-ref/prototype/wiki-view.jsx WikiPage
// Owner 아바타 + Verified 상태(만료 시 Re-verify 배너) + 마크다운 본문.
// Edit 버튼 → textarea 토글. 저장 시 updateWikiPage(body).

"use client"

import { useEffect, useState } from "react"
import { AlertTriangle, Check, Eye, History, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MarkdownBody } from "@/components/wiki/markdown-body"
import { WikiHistoryDialog } from "@/components/wiki/wiki-history-dialog"
import { useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import type { WikiPage } from "@/types/flowbase"

const DAY_MS = 86_400_000
const VERIFY_TTL_DAYS = 90

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function daysBetween(target: string): number {
  return Math.ceil((new Date(target).getTime() - Date.now()) / DAY_MS)
}

function isoPlusDays(days: number): string {
  return new Date(Date.now() + days * DAY_MS).toISOString().slice(0, 10)
}

export function WikiPageView({ page }: { page: WikiPage }) {
  const updateWikiPage = useFlowBase((s) => s.updateWikiPage)

  const today = todayIso()
  const isExpired = !!page.expiresAt && page.expiresAt < today
  const daysLeft = page.expiresAt ? daysBetween(page.expiresAt) : null

  const initial = (page.owner || "?")[0].toUpperCase()

  const [editMode, setEditMode] = useState(false)
  const [draftBody, setDraftBody] = useState(page.body)
  const [historyOpen, setHistoryOpen] = useState(false)
  // 페이지 전환 시 draft 리셋
  useEffect(() => {
    setEditMode(false)
    setDraftBody(page.body)
  }, [page.id, page.body])

  const revisionCount = page.revisions?.length ?? 0

  const reVerify = () => {
    updateWikiPage(page.id, {
      verified: true,
      verifiedAt: today,
      expiresAt: isoPlusDays(VERIFY_TTL_DAYS),
    })
  }

  const saveEdit = () => {
    updateWikiPage(page.id, { body: draftBody, updatedAt: today })
    setEditMode(false)
  }

  const cancelEdit = () => {
    setDraftBody(page.body)
    setEditMode(false)
  }

  return (
    <div
      className="flex-1 overflow-y-auto bg-background"
      data-page-body={page.id}
    >
      <div className="mx-auto max-w-[760px] px-10 pb-20 pt-6">
        {/* Breadcrumb */}
        <div className="mb-5 flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span>peter&apos;s workspace</span>
          <span className="opacity-50">/</span>
          <span>Wiki</span>
          <span className="opacity-50">/</span>
          <span>{page.category}</span>
          <span className="opacity-50">/</span>
          <span className="font-semibold text-foreground">{page.title}</span>
        </div>

        {/* Verified expiry banner */}
        {page.verified && isExpired && (
          <div className="mb-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-[12.5px] font-medium text-destructive">
            <AlertTriangle className="size-3.5 shrink-0" strokeWidth={2} />
            <span>
              Verification expired (before {page.expiresAt}). Owner re-verification needed.
            </span>
            <div className="flex-1" />
            <button
              type="button"
              onClick={reVerify}
              className="rounded-md bg-destructive px-2.5 py-1 text-[11.5px] font-semibold text-destructive-foreground transition-opacity hover:opacity-90"
            >
              Re-verify
            </button>
          </div>
        )}

        {/* Title + Edit toggle */}
        <div className="mb-2 flex items-start gap-3">
          <h1 className="flex-1 text-[32px] font-bold leading-tight tracking-[-0.02em] text-foreground">
            {page.title}
          </h1>
          {!editMode ? (
            <div className="mt-2 flex gap-1.5">
              {revisionCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setHistoryOpen(true)}
                  className="h-8 gap-1.5 px-2.5 text-[12px] text-muted-foreground"
                  title={`${revisionCount} previous version${revisionCount === 1 ? "" : "s"}`}
                  data-wiki-history={page.id}
                >
                  <History className="size-3" strokeWidth={2} />
                  History
                  <span className="ml-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground/[0.08] px-1 text-[9.5px] tabular-nums">
                    {revisionCount}
                  </span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditMode(true)}
                className="h-8 gap-1.5 px-2.5 text-[12px]"
                data-wiki-edit-toggle={page.id}
              >
                <Pencil className="size-3" strokeWidth={2} />
                Edit
              </Button>
            </div>
          ) : (
            <div className="mt-2 flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEdit}
                className="h-8 px-2.5 text-[12px] text-muted-foreground"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={saveEdit}
                className="h-8 gap-1.5 px-2.5 text-[12px]"
                data-wiki-save={page.id}
              >
                <Check className="size-3" strokeWidth={2.5} />
                Save
              </Button>
            </div>
          )}
        </div>

        {/* Metadata row */}
        <div className="mb-6 flex flex-wrap items-center gap-3.5 border-b border-border-subtle pb-3.5 text-[12px] text-muted-foreground">
          <span>{page.category}</span>
          <span className="opacity-40">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-flex size-[18px] items-center justify-center rounded-full text-[9px] font-bold text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--chart-2), var(--chart-4))",
              }}
            >
              {initial}
            </span>
            <span>
              Owner:{" "}
              <b className="font-semibold text-foreground">{page.owner}</b>
            </span>
          </span>
          <span className="opacity-40">·</span>
          <span>Last updated: {page.updatedAt}</span>
          <div className="flex-1" />
          {page.verified && !isExpired ? (
            <span
              title={`Verified by ${page.owner} on ${page.verifiedAt}. Expires ${page.expiresAt} (${daysLeft}d left).`}
              className={cn(
                "inline-flex items-center gap-1 rounded-full bg-success-bg px-2.5 py-0.5 text-[11.5px] font-semibold text-success-fg",
              )}
            >
              <Check className="size-2.5" strokeWidth={3} />
              Verified · {daysLeft}d left
            </span>
          ) : !page.verified ? (
            <button
              type="button"
              onClick={reVerify}
              className="rounded-full border border-dashed border-border px-2.5 py-0.5 text-[11.5px] font-medium text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
            >
              Mark as verified
            </button>
          ) : null}
        </div>

        {/* Body — edit or preview */}
        {editMode ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Pencil className="size-3" />
                Markdown editor
              </span>
              <span className="inline-flex items-center gap-1">
                <Eye className="size-3" />
                Save to see rendered output
              </span>
            </div>
            <textarea
              value={draftBody}
              onChange={(e) => setDraftBody(e.target.value)}
              spellCheck={false}
              className="min-h-[400px] w-full rounded-md border border-border bg-card px-4 py-3 font-mono text-[13px] leading-[1.6] text-foreground outline-none transition-colors focus:border-primary"
              data-wiki-editor={page.id}
              autoFocus
            />
            <p className="text-[10.5px] text-muted-foreground">
              Supported: # / ## / ### headings, - / 1. lists, | tables |, `inline code`, **bold**.
            </p>
          </div>
        ) : (
          <MarkdownBody source={page.body} />
        )}
      </div>

      <WikiHistoryDialog
        page={page}
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
    </div>
  )
}
