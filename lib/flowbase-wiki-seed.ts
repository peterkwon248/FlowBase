// FlowBase V2 — Wiki 시드 페이지
// 출처: design-ref/prototype/wiki-view.jsx SEED_PAGES
// 본문은 영어화(시드 deep 번역 P1 항목과 일관). 한국어 잔존 ❌ 정책.

import type { WikiPage } from "@/types/flowbase"

export const WIKI_CATEGORIES = [
  "Concepts",
  "Runbooks",
  "Reference",
  "Onboarding",
  "Team",
] as const

export const SEED_WIKI_PAGES: WikiPage[] = [
  {
    id: "wiki-library-intro",
    title: "Library guide",
    category: "Concepts",
    owner: "peter",
    verified: true,
    verifiedAt: "2026-05-15",
    expiresAt: "2026-08-15",
    updatedAt: "2026-05-17",
    body: `# What is the Library?

The Library is your workspace's **reusable definitions store**. Cell options, column definitions, table templates, and auto-fill logic all live in one place — and you pull from it anywhere.

The defining difference from spreadsheets: when the same dropdown is used in 5 tables, in the Library you **define it once**. Add an option and all 5 update instantly.

## Four asset types

### Option Lists
Shared sets of options. Examples: \`@Model\` (M-PEN-III, POGOPIN, DWHM-1 …), \`@Handling\`, \`@Business unit\`.

Multiple columns can share the same option list. When the \`Order model\` column and the \`Return model\` column both reference \`@Model\`, adding one option updates both columns immediately.

### Fields
Packaged column definitions. Name + type + options + default + validation rules bundled together.

Example: \`@ReceivedAt\` = { date, required, default: today, validation: future dates not allowed }

When adding a column to a new table, pulling in \`@ReceivedAt\` applies every setting automatically.

### Templates
A bundle of multiple Fields plus recommended view settings. The CS team's \`@CS Case\` template includes 6 fields + Board view recommendation + group-by status.

Pick a template when creating a new table and you have a complete structure in 5 seconds.

### Functions
Reusable smart functions. (Previously called: Rules.)

- \`MATCH_FROM_DROPDOWN\` — auto-extract an option from text
- \`AI_CLASSIFY\` — Claude analyzes meaning and classifies
- \`EXTRACT_REGEX\` — regex extraction

Unlike spreadsheet functions, these **know about the database**. \`MATCH_FROM_DROPDOWN(productName, @Model)\` references the Library's Model option list directly.

## Relationship with Tables

| Action | In Tables | In Library |
|---|---|---|
| Add column | "+" button → pick a Field | Define or edit the Field itself |
| Add option | Type into the cell | Add to @optionList — reflected everywhere |
| New table | Schema → pick a Template | Define and manage the Template itself |

## Promote — bidirectional

You don't have to pre-define everything in the Library. Build dropdowns freely in Tables, then when you think "I'll probably use this elsewhere too," promote it from the column header menu → **Promote to Library**.`,
  },
  {
    id: "wiki-cs-runbook",
    title: "CS case handling procedure",
    category: "Runbooks",
    owner: "peter",
    verified: true,
    verifiedAt: "2026-05-10",
    expiresAt: "2026-06-10",
    updatedAt: "2026-05-10",
    body: `# CS case handling procedure

## Registering a new case
1. Check incoming customer channels (email / KakaoTalk / Naver TalkTalk)
2. Tasks table → "+ New row" → review auto-filled model name
3. Confirm auto-classified handling type (marked with a sparkle)
4. Adjust manually if needed

## Choosing handling type
- **Buyer's remorse**: within 7 days, unused
- **Wrong model exchange**: customer ordered the wrong model
- **Defect exchange / refund**: product defect
- **A/S**: in-warranty repair
- **Shipping error exchange / refund**: our shipping mistake
- **Carrier damage exchange / refund**: damaged in transit

## Status workflow
\`Pickup requested\` → \`Inspecting\` → \`Waiting\` → \`Done\`

Drag in Board view or edit the cell directly to move between states.`,
  },
  {
    id: "wiki-keyboard-shortcuts",
    title: "Keyboard shortcuts",
    category: "Reference",
    owner: "peter",
    verified: true,
    verifiedAt: "2026-05-12",
    expiresAt: "2026-11-12",
    updatedAt: "2026-05-12",
    body: `# Keyboard shortcuts

## Panel toggles
- \`⌘B\` — AI panel
- \`⌘⇧A\` — Activity bar
- \`⌘⇧F\` — Sidebar
- \`⌘I\` — Detail bar

## Editing
- \`⌘Z\` — Undo
- \`⌘⇧Z\` — Redo
- \`Delete\` / \`Backspace\` — Delete selected row

## Search
- \`⌘K\` — Quick search`,
  },
  {
    id: "wiki-onboarding",
    title: "New hire onboarding",
    category: "Onboarding",
    owner: "minji",
    verified: false,
    verifiedAt: null,
    expiresAt: null,
    updatedAt: "2026-05-05",
    body: `# New hire onboarding (draft)

## Day 1
- Workspace tour
- Introduction to the 4 Library asset types
- Walk through your first case

## Day 2-3
- Understanding table relationships in Schema
- Learning the Automations flow

(This document is a work in progress. Not verified.)`,
  },
  {
    id: "wiki-glossary",
    title: "Glossary",
    category: "Reference",
    owner: "peter",
    verified: true,
    verifiedAt: "2026-04-30",
    expiresAt: "2026-10-30",
    updatedAt: "2026-04-30",
    body: `# Glossary

**Library** — The workspace's reusable definitions store.
**Option List** — Set of options for a dropdown/tag.
**Field** — Packaged column definition (type + options + validation, etc.).
**Template** — A bundle of fields + recommended views.
**Function** — Reusable logic that auto-fills a cell value.
**Schema** — The table structures and relationships in a workspace.
**Automation** — A row/event-triggered workflow (across Tables).
**Promote** — Lifting a definition created in a table up into the Library.
**Cascade** — When a Library asset edit propagates to every usage automatically.
**Smart fill** — Wiring a Function to auto-populate a new column.`,
  },
  {
    id: "wiki-team",
    title: "Team directory",
    category: "Team",
    owner: "peter",
    verified: true,
    verifiedAt: "2026-05-01",
    expiresAt: "2026-08-01",
    updatedAt: "2026-05-01",
    body: `# Team directory

## CS team
- **Minji Ho** — Head of CS · sets case priority
- **Seungho Han** — CS Specialist · buyer's remorse / exchanges
- **Seoyeon Park** — CS Specialist · defects / A/S

## Product
- **peter** — PM · runs the workspace
- **Daniel Park** — Eng Lead · Smart fill / Functions

## Reporting line
Minji Ho → peter (1:1 every Monday)`,
  },
]

export function createSeedWikiPages(): WikiPage[] {
  // 깊은 복사 ❌ — 시드는 immutable로 다룬다. 스토어에서 추가/수정 시에만 새 배열 생성.
  return SEED_WIKI_PAGES.map((p) => ({ ...p }))
}
