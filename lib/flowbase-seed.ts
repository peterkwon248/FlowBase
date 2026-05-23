// FlowBase V2 — 시드 보드 ("Customer Interviews")
// 출처: design-ref/prototype/{components.jsx INTERVIEWS, tables-data.jsx COLUMNS_BY_TABLE.interviews,
//        prototype.jsx initialRows()}
// 설계: docs/02-design/features/flowbase-v2-phase1.design.md §3
// status는 한국어 enum, votes·confirmed 플래그는 prototype.jsx initialRows() augmentation.

import type { Board, ColumnDef, TableRow, TicketStatus } from "@/types/flowbase"

export const SEED_BOARD_ID = "interviews"

// AI-CONTRACTS §1 기본 theme 옵션
export const THEME_OPTIONS: string[] = [
  "Pricing pushback",
  "Onboarding friction",
  "Feature: AI columns",
  "Sheet performance",
  "Sharing & roles",
  "Other",
]
export const SENTIMENT_OPTIONS: string[] = ["Positive", "Mixed", "Negative"]
export const PRIORITY_OPTIONS: string[] = ["Urgent", "High", "Med", "Low"]
export const STATUS_OPTIONS: TicketStatus[] = ["미처리", "진행중", "대기", "완료"]

// 프로토타입 tables-data.jsx COLUMNS_BY_TABLE.interviews — 11컬럼
const SEED_COLUMNS: ColumnDef[] = [
  { name: "id", label: "ID", type: "text", width: 86, mono: true },
  { name: "name", label: "Name", type: "avatar", width: 150, subtitleField: "company" },
  { name: "company", label: "Company", type: "text", width: 130 },
  { name: "date", label: "Date", type: "date", width: 110, mono: true },
  { name: "theme", label: "Theme", type: "select", width: 180, ai: true, options: THEME_OPTIONS },
  { name: "sentiment", label: "Sentiment", type: "select", width: 112, ai: true, options: SENTIMENT_OPTIONS },
  { name: "votes", label: "Votes", type: "reaction", width: 150 },
  { name: "status", label: "Status", type: "status", width: 116 },
  { name: "priority", label: "Priority", type: "select", width: 96, options: PRIORITY_OPTIONS },
  { name: "quote", label: "Quote", type: "text", width: 380 },
  { name: "actions", label: " ", type: "button", width: 130, buttonLabel: "Reclassify", buttonAction: "reclassify" },
]

// components.jsx INTERVIEWS 10행 — status 키는 LOCK 한국어 enum 유지, quote/name은 영어화
const SEED_ROWS: TableRow[] = [
  { id: "INT-018", name: "Min Jiho", company: "Folio", date: "2026-05-17", theme: "Pricing pushback", sentiment: "Negative", votes: { positive: 0, mixed: 1, negative: 3 }, status: "미처리", priority: "Urgent", quote: "$39 a month is honestly expensive. Maybe for a team, but…", themeConfirmed: false, sentimentConfirmed: false },
  { id: "INT-017", name: "Sarah Lim", company: "Northbeam", date: "2026-05-16", theme: "Onboarding friction", sentiment: "Mixed", votes: { positive: 1, mixed: 2, negative: 1 }, status: "진행중", priority: "High", quote: "The first 5 minutes were the most confusing. Where do I start an import…", themeConfirmed: false, sentimentConfirmed: true },
  { id: "INT-016", name: "Jo Hyunwoo", company: "Indie", date: "2026-05-14", theme: "Feature: AI columns", sentiment: "Positive", votes: { positive: 2, mixed: 1, negative: 0 }, status: "완료", priority: "Med", quote: "This is really nice. Drop in a sheet and it just sorts itself out.", themeConfirmed: true, sentimentConfirmed: true },
  { id: "INT-015", name: "Daniel Park", company: "Halo Labs", date: "2026-05-13", theme: "Sheet performance", sentiment: "Negative", votes: { positive: 0, mixed: 1, negative: 3 }, status: "대기", priority: "High", quote: "Past 300 rows typing gets a touch sluggish. Not unbearable, but noticeable.", themeConfirmed: true, sentimentConfirmed: false },
  { id: "INT-014", name: "Jung Yujin", company: "Cloudpaper", date: "2026-05-13", theme: "Sharing & roles", sentiment: "Mixed", votes: { positive: 1, mixed: 2, negative: 1 }, status: "미처리", priority: "Med", quote: "Can I generate a view-only link separately?", themeConfirmed: false, sentimentConfirmed: false },
  { id: "INT-013", name: "Aisha K.", company: "Margin", date: "2026-05-12", theme: "Pricing pushback", sentiment: "Negative", votes: { positive: 0, mixed: 1, negative: 3 }, status: "미처리", priority: "Urgent", quote: "Notion does something similar for free — why pay?", themeConfirmed: false, sentimentConfirmed: true },
  { id: "INT-012", name: "Han Seungho", company: "Levy", date: "2026-05-11", theme: "Feature: AI columns", sentiment: "Positive", votes: { positive: 2, mixed: 1, negative: 0 }, status: "진행중", priority: "Med", quote: "The AI suggestion cards are great. Even better that they're not auto-applied.", themeConfirmed: true, sentimentConfirmed: true },
  { id: "INT-011", name: "Maya R.", company: "Foundry", date: "2026-05-10", theme: "Onboarding friction", sentiment: "Mixed", votes: { positive: 1, mixed: 2, negative: 1 }, status: "완료", priority: "Low", quote: "Sample data would make this faster to grok.", themeConfirmed: true, sentimentConfirmed: true },
  { id: "INT-010", name: "Park Seoyeon", company: "Pleo", date: "2026-05-09", theme: "Sharing & roles", sentiment: "Positive", votes: { positive: 2, mixed: 1, negative: 0 }, status: "대기", priority: "Med", quote: "The permission model is simple — three tiers is enough.", themeConfirmed: false, sentimentConfirmed: false },
  { id: "INT-009", name: "Eitan G.", company: "Solo PM", date: "2026-05-08", theme: "Sheet performance", sentiment: "Mixed", votes: { positive: 1, mixed: 2, negative: 1 }, status: "미처리", priority: "Low", quote: "Just need a few more keyboard shortcuts and it'd be perfect.", themeConfirmed: true, sentimentConfirmed: true },
]

const SEED_TIMESTAMP = "2026-05-21T00:00:00.000Z"

// 시드 보드 새 인스턴스 (스토어 초기 상태용 — 매 호출 새 객체).
export function createSeedBoard(): Board {
  return {
    id: SEED_BOARD_ID,
    label: "Customer Interviews",
    colorVar: "var(--chart-1)",
    idPrefix: "INT-",
    columns: SEED_COLUMNS.map((c) => ({ ...c })),
    rows: SEED_ROWS.map((r) => ({ ...r })),
    aiHistory: [],
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
  }
}
