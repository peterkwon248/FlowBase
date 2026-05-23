// FlowBase V2 — 미니 마크다운 렌더러 (Wiki 페이지 본문 전용)
// 출처: design-ref/prototype/wiki-view.jsx parseMarkdown + renderBlock + renderInline
// 지원: h1~h3, ul, ol, table, p, inline `code`, **bold**
// 의도적으로 의존성 ❌ — 외부 markdown lib 없이 시드 마크다운만 안정 렌더.

import type { JSX, ReactNode } from "react"
import { cn } from "@/lib/utils"

type Block =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "p"; text: string }
  | { kind: "ul"; items: string[] }
  | { kind: "ol"; items: string[] }
  | { kind: "table"; rows: string[][] }

function parseMarkdown(src: string): Block[] {
  const lines = src.split("\n")
  const blocks: Block[] = []
  let cur: Block | null = null
  const flush = (): void => {
    if (cur) {
      blocks.push(cur)
      cur = null
    }
  }
  for (const line of lines) {
    // heading
    const hMatch = line.match(/^(#{1,3})\s+(.+)$/)
    if (hMatch) {
      flush()
      blocks.push({
        kind: "heading",
        level: hMatch[1].length as 1 | 2 | 3,
        text: hMatch[2],
      })
      continue
    }
    // unordered list
    const liMatch = line.match(/^[-*]\s+(.+)$/)
    if (liMatch) {
      if (!cur || cur.kind !== "ul") {
        flush()
        cur = { kind: "ul", items: [] }
      }
      cur.items.push(liMatch[1])
      continue
    }
    // ordered list
    const olMatch = line.match(/^\d+\.\s+(.+)$/)
    if (olMatch) {
      if (!cur || cur.kind !== "ol") {
        flush()
        cur = { kind: "ol", items: [] }
      }
      cur.items.push(olMatch[1])
      continue
    }
    // table — | a | b | c |
    if (line.startsWith("|") && line.indexOf("|", 1) > 0) {
      if (!cur || cur.kind !== "table") {
        flush()
        cur = { kind: "table", rows: [] }
      }
      const cells = line
        .split("|")
        .slice(1, -1)
        .map((s) => s.trim())
      // separator row: "|---|---|"
      if (cells.every((c) => /^[-:]+$/.test(c))) continue
      cur.rows.push(cells)
      continue
    }
    // empty line — flush current block
    if (line.trim() === "") {
      flush()
      continue
    }
    // paragraph
    if (!cur || cur.kind !== "p") {
      flush()
      cur = { kind: "p", text: line }
    } else {
      cur.text += " " + line
    }
  }
  flush()
  return blocks
}

// inline: `code` + **bold**. 가장 가까운 매치를 순서대로 처리.
function renderInline(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let rest = text
  let key = 0
  while (rest.length > 0) {
    const codeM = rest.match(/`([^`]+)`/)
    const boldM = rest.match(/\*\*([^*]+)\*\*/)
    const cands = [codeM, boldM].filter(
      (m): m is RegExpMatchArray => m !== null,
    )
    if (cands.length === 0) {
      out.push(rest)
      break
    }
    const next = cands.reduce((a, b) =>
      (a.index ?? 0) < (b.index ?? 0) ? a : b,
    )
    const idx = next.index ?? 0
    if (idx > 0) out.push(rest.slice(0, idx))
    if (next === codeM) {
      out.push(
        <code
          key={"c" + key++}
          className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.88em]"
        >
          {next[1]}
        </code>,
      )
    } else {
      out.push(
        <b key={"b" + key++} className="font-semibold text-foreground">
          {next[1]}
        </b>,
      )
    }
    rest = rest.slice(idx + next[0].length)
  }
  return out
}

function renderBlock(b: Block, key: number): JSX.Element | null {
  if (b.kind === "heading") {
    if (b.level === 1) {
      return (
        <h2
          key={key}
          className="mb-3 mt-7 text-[24px] font-bold tracking-[-0.01em] text-foreground"
        >
          {renderInline(b.text)}
        </h2>
      )
    }
    if (b.level === 2) {
      return (
        <h3
          key={key}
          className="mb-2.5 mt-6 text-[19px] font-bold tracking-[-0.01em] text-foreground"
        >
          {renderInline(b.text)}
        </h3>
      )
    }
    return (
      <h4
        key={key}
        className="mb-2 mt-5 text-[15.5px] font-bold tracking-[-0.01em] text-foreground"
      >
        {renderInline(b.text)}
      </h4>
    )
  }
  if (b.kind === "p") {
    return (
      <p key={key} className="mb-3 last:mb-0">
        {renderInline(b.text)}
      </p>
    )
  }
  if (b.kind === "ul") {
    return (
      <ul
        key={key}
        className="mb-3 ml-5 list-disc space-y-1 marker:text-muted-foreground"
      >
        {b.items.map((it, i) => (
          <li key={i}>{renderInline(it)}</li>
        ))}
      </ul>
    )
  }
  if (b.kind === "ol") {
    return (
      <ol
        key={key}
        className="mb-3 ml-5 list-decimal space-y-1 marker:text-muted-foreground"
      >
        {b.items.map((it, i) => (
          <li key={i}>{renderInline(it)}</li>
        ))}
      </ol>
    )
  }
  if (b.kind === "table") {
    const [head, ...rest] = b.rows
    return (
      <div
        key={key}
        className="mb-4 overflow-hidden rounded-md border border-border-subtle"
      >
        <table className="w-full border-collapse text-[13px]">
          {head && (
            <thead>
              <tr>
                {head.map((c, i) => (
                  <th
                    key={i}
                    className="border-b border-border-subtle bg-muted px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground"
                  >
                    {renderInline(c)}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {rest.map((row, ri) => (
              <tr key={ri}>
                {row.map((c, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      "px-3 py-2 align-top",
                      ri < rest.length - 1 && "border-b border-border-subtle",
                    )}
                  >
                    {renderInline(c)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }
  return null
}

export function MarkdownBody({ source }: { source: string }) {
  const blocks = parseMarkdown(source)
  return (
    <div className="text-[14px] leading-[1.7] text-foreground">
      {blocks.map((b, i) => renderBlock(b, i))}
    </div>
  )
}
