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

// components.jsx INTERVIEWS 10행 — status 한국어 변환, votes·confirmed augmentation
const SEED_ROWS: TableRow[] = [
  { id: "INT-018", name: "민지호", company: "Folio", date: "2026-05-17", theme: "Pricing pushback", sentiment: "Negative", votes: { positive: 0, mixed: 1, negative: 3 }, status: "미처리", priority: "Urgent", quote: "월 39불은 솔직히 비싸요. 팀 단위면 모를까…", themeConfirmed: false, sentimentConfirmed: false },
  { id: "INT-017", name: "Sarah Lim", company: "Northbeam", date: "2026-05-16", theme: "Onboarding friction", sentiment: "Mixed", votes: { positive: 1, mixed: 2, negative: 1 }, status: "진행중", priority: "High", quote: "처음 5분이 제일 헷갈렸어요. import 어디서 시작하는지…", themeConfirmed: false, sentimentConfirmed: true },
  { id: "INT-016", name: "조현우", company: "Indie", date: "2026-05-14", theme: "Feature: AI columns", sentiment: "Positive", votes: { positive: 2, mixed: 1, negative: 0 }, status: "완료", priority: "Med", quote: "이거 진짜 좋네요. 시트만 던지면 알아서 정리해주는 느낌.", themeConfirmed: true, sentimentConfirmed: true },
  { id: "INT-015", name: "Daniel Park", company: "Halo Labs", date: "2026-05-13", theme: "Sheet performance", sentiment: "Negative", votes: { positive: 0, mixed: 1, negative: 3 }, status: "대기", priority: "High", quote: "300줄 넘으면 입력이 살짝 느려져요. 안 보일 만큼은 아닌데.", themeConfirmed: true, sentimentConfirmed: false },
  { id: "INT-014", name: "정유진", company: "Cloudpaper", date: "2026-05-13", theme: "Sharing & roles", sentiment: "Mixed", votes: { positive: 1, mixed: 2, negative: 1 }, status: "미처리", priority: "Med", quote: "view-only 링크는 따로 만들 수 있나요?", themeConfirmed: false, sentimentConfirmed: false },
  { id: "INT-013", name: "Aisha K.", company: "Margin", date: "2026-05-12", theme: "Pricing pushback", sentiment: "Negative", votes: { positive: 0, mixed: 1, negative: 3 }, status: "미처리", priority: "Urgent", quote: "Notion이 비슷한 거 무료로 주는데 굳이…", themeConfirmed: false, sentimentConfirmed: true },
  { id: "INT-012", name: "한승호", company: "Levy", date: "2026-05-11", theme: "Feature: AI columns", sentiment: "Positive", votes: { positive: 2, mixed: 1, negative: 0 }, status: "진행중", priority: "Med", quote: "AI 추천 카드 좋아요. 자동 적용 아니라서 더 좋아요.", themeConfirmed: true, sentimentConfirmed: true },
  { id: "INT-011", name: "Maya R.", company: "Foundry", date: "2026-05-10", theme: "Onboarding friction", sentiment: "Mixed", votes: { positive: 1, mixed: 2, negative: 1 }, status: "완료", priority: "Low", quote: "샘플 데이터 있으면 빠를 듯.", themeConfirmed: true, sentimentConfirmed: true },
  { id: "INT-010", name: "박서연", company: "Pleo", date: "2026-05-09", theme: "Sharing & roles", sentiment: "Positive", votes: { positive: 2, mixed: 1, negative: 0 }, status: "대기", priority: "Med", quote: "권한 모델 단순해서 좋아요. 3단계면 충분.", themeConfirmed: false, sentimentConfirmed: false },
  { id: "INT-009", name: "Eitan G.", company: "Solo PM", date: "2026-05-08", theme: "Sheet performance", sentiment: "Mixed", votes: { positive: 1, mixed: 2, negative: 1 }, status: "미처리", priority: "Low", quote: "키보드 단축키만 좀 더 있으면 완벽.", themeConfirmed: true, sentimentConfirmed: true },
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
