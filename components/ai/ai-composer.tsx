// FlowBase V2 — AI Composer (하단 자유 질의 입력창)
// 설계: docs/02-design/features/flowbase-v2-phase2.design.md §7
// 출처: design-ref/prototype/prototype.jsx InteractiveActivityPanel (composer)

"use client"

import { useState } from "react"
import { Send } from "lucide-react"

interface AiComposerProps {
  busy: boolean
  onSend: (text: string) => void
}

export function AiComposer({ busy, onSend }: AiComposerProps) {
  const [input, setInput] = useState("")

  const submit = () => {
    const text = input.trim()
    if (!text || busy) return
    setInput("")
    onSend(text)
  }

  return (
    <div className="rounded-lg border border-border bg-card p-2">
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.nativeEvent.isComposing) {
            e.preventDefault()
            submit()
          }
        }}
        placeholder="AI에게 질문…"
        className="w-full bg-transparent px-1 py-0.5 text-[12.5px] outline-none placeholder:text-muted-foreground"
      />
      <div className="mt-1 flex items-center gap-1.5">
        <span className="rounded border border-border-subtle bg-muted px-1 font-mono text-[10px] text-muted-foreground">
          ↵
        </span>
        <span className="text-[11px] text-muted-foreground">
          {busy ? "응답 중…" : "전송"}
        </span>
        <div className="flex-1" />
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="inline-flex items-center gap-1 rounded bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground disabled:opacity-60"
        >
          <Send className="size-3" />
          전송
        </button>
      </div>
    </div>
  )
}
