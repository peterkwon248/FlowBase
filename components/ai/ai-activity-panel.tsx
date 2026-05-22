// FlowBase V2 — AI Activity 패널 (우측 사이드 패널)
// 설계: docs/02-design/features/flowbase-v2-phase2.design.md §7·8·9
// 출처: design-ref/prototype/prototype.jsx InteractiveActivityPanel
//
// Pending(미확정 AI 셀) + Timeline(aiHistory) + Composer(자유 질의).
// "Apply all" → Claude infer-batch → acceptAllAi. 진행/에러는 sonner toast.

"use client"

import { useMemo, useState } from "react"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"
import {
  type AiColumn,
  type InferBatchRow,
  ThrottleError,
  askAI,
  inferBatch,
} from "@/lib/flowbase-ai"
import { selectActiveBoard, useFlowBase } from "@/lib/flowbase-store"
import { cn } from "@/lib/utils"
import { AiComposer } from "./ai-composer"
import { PendingCard } from "./pending-card"
import { TimelineItem } from "./timeline-item"

interface ChatMessage {
  role: "user" | "ai"
  content: string
}

const COLUMN_LABEL: Record<AiColumn, string> = {
  theme: "Theme",
  sentiment: "Sentiment",
}

// 시드 인터뷰 보드의 소스 텍스트 컬럼 — infer-batch가 이 값을 읽어 분류한다.
const SOURCE_FIELD = "quote"

export function AiActivityPanel() {
  const board = useFlowBase(selectActiveBoard)
  const acceptAllAi = useFlowBase((s) => s.acceptAllAi)
  const dismissAllAi = useFlowBase((s) => s.dismissAllAi)
  const pushAi = useFlowBase((s) => s.pushAi)

  // 채팅 thread는 패널 로컬 state — persist ❌ (design D3)
  const [chat, setChat] = useState<ChatMessage[]>([])
  const [composerBusy, setComposerBusy] = useState(false)
  const [applying, setApplying] = useState<AiColumn | null>(null)

  const rows = board?.rows ?? []
  const pendingTheme = useMemo(
    () => rows.filter((r) => r.themeConfirmed === false),
    [rows],
  )
  const pendingSentiment = useMemo(
    () => rows.filter((r) => r.sentimentConfirmed === false),
    [rows],
  )
  const pendingTotal = pendingTheme.length + pendingSentiment.length
  const aiHistory = board?.aiHistory ?? []

  // "Apply all" — Claude로 분류 → 확정 적용 (1 undo 단위). 클릭이 곧 사람의 확정.
  const handleApply = async (column: AiColumn) => {
    const pending = column === "theme" ? pendingTheme : pendingSentiment
    if (pending.length === 0 || applying) return

    setApplying(column)
    const toastId = toast.loading(`${pending.length}개 행 분류 중…`)
    try {
      const inputRows: InferBatchRow[] = pending.map((r) => ({
        id: r.id,
        [SOURCE_FIELD]: String(r[SOURCE_FIELD] ?? ""),
      }))
      const results = await inferBatch(
        column,
        inputRows,
        SOURCE_FIELD,
        (done, total) =>
          toast.loading(`분류 중 ${done}/${total}…`, { id: toastId }),
      )
      if (results.length === 0) {
        toast.error("AI 응답에 결과가 없습니다 — 다시 시도하세요.", {
          id: toastId,
        })
        return
      }
      acceptAllAi(column, results)
      pushAi({
        kind: "infer",
        title: `${COLUMN_LABEL[column]} ${results.length}개 행 분류·적용`,
        detail: "Claude가 분류 → 확정",
        status: "applied",
        rowIds: results.map((r) => r.id),
      })
      toast.success(`${results.length}개 행 적용 완료 · ⌘Z로 되돌리기`, {
        id: toastId,
      })
    } catch (err) {
      const msg =
        err instanceof ThrottleError
          ? err.message
          : err instanceof Error
            ? err.message
            : "다시 시도하세요"
      toast.error(`AI 분류 실패 — ${msg}`, { id: toastId })
    } finally {
      setApplying(null)
    }
  }

  // "Dismiss" — pending 일괄 보류 해제 (값 유지, Claude 호출 ❌)
  const handleDismiss = (column: AiColumn) => {
    const pending = column === "theme" ? pendingTheme : pendingSentiment
    if (pending.length === 0) return
    dismissAllAi(column)
    pushAi({
      kind: "infer",
      title: `${COLUMN_LABEL[column]} ${pending.length}개 보류 해제`,
      status: "dismissed",
      rowIds: pending.map((r) => r.id),
    })
    toast.success("보류 해제됨 · ⌘Z로 되돌리기")
  }

  const handleAsk = async (text: string) => {
    if (composerBusy) return
    setChat((c) => [...c, { role: "user", content: text }])
    setComposerBusy(true)
    try {
      const answer = await askAI(text, {
        boardLabel: board?.label ?? "FlowBase",
        rowCount: rows.length,
      })
      setChat((c) => [...c, { role: "ai", content: answer }])
      pushAi({
        kind: "ask",
        title: text.length > 40 ? `${text.slice(0, 40)}…` : text,
        detail: answer.length > 80 ? `${answer.slice(0, 80)}…` : answer,
        status: "applied",
      })
    } catch (err) {
      const msg =
        err instanceof ThrottleError
          ? err.message
          : err instanceof Error
            ? err.message
            : "실패"
      setChat((c) => [...c, { role: "ai", content: `(오류) ${msg}` }])
      toast.error(`AI 응답 실패 — ${msg}`)
    } finally {
      setComposerBusy(false)
    }
  }

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l border-border-subtle bg-surface">
      {/* 헤더 */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border-subtle px-3.5">
        <Sparkles className="size-3.5 text-primary" />
        <span className="text-[13px] font-semibold">AI Activity</span>
        {pendingTotal > 0 && (
          <span className="rounded bg-primary/15 px-1.5 py-px text-[10px] font-semibold tabular-nums text-primary">
            {pendingTotal} pending
          </span>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {/* Pending */}
        {pendingTotal > 0 && (
          <div className="px-3.5 pb-2 pt-3">
            <div className="mb-2 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
              Pending — 확인 필요
            </div>
            {pendingTheme.length > 0 && (
              <PendingCard
                column="theme"
                count={pendingTheme.length}
                busy={applying === "theme"}
                onApply={() => handleApply("theme")}
                onDismiss={() => handleDismiss("theme")}
              />
            )}
            {pendingSentiment.length > 0 && (
              <PendingCard
                column="sentiment"
                count={pendingSentiment.length}
                busy={applying === "sentiment"}
                onApply={() => handleApply("sentiment")}
                onDismiss={() => handleDismiss("sentiment")}
              />
            )}
          </div>
        )}

        {/* Timeline */}
        <div className="border-t border-border-subtle px-3.5 py-3">
          <div className="mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
            Timeline
          </div>
          {aiHistory.length === 0 ? (
            <div className="text-xs leading-relaxed text-muted-foreground">
              아직 AI 활동이 없습니다.
            </div>
          ) : (
            <div className="relative pl-3.5">
              <div className="absolute bottom-1.5 left-1 top-1.5 w-px bg-border" />
              {aiHistory
                .slice()
                .reverse()
                .map((entry) => (
                  <TimelineItem key={entry.id} entry={entry} />
                ))}
            </div>
          )}
        </div>
      </div>

      {/* Composer + 채팅 thread */}
      <div className="shrink-0 border-t border-border-subtle p-3">
        {chat.length > 0 && (
          <div className="mb-2 flex max-h-64 flex-col gap-1.5 overflow-y-auto">
            {chat.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "max-w-[92%] rounded-lg border border-border-subtle px-2.5 py-1.5",
                  m.role === "user"
                    ? "self-end bg-primary/10"
                    : "self-start bg-card",
                )}
              >
                <div
                  className={cn(
                    "mb-0.5 text-[9.5px] font-semibold uppercase tracking-[0.05em]",
                    m.role === "user"
                      ? "text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {m.role === "user" ? "You" : "AI"}
                </div>
                <div className="whitespace-pre-wrap text-xs leading-relaxed">
                  {m.content}
                </div>
              </div>
            ))}
          </div>
        )}
        <AiComposer busy={composerBusy} onSend={handleAsk} />
      </div>
    </aside>
  )
}
