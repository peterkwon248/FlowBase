// FlowBase V2 — Tasks 보드 시드 (멀티 테이블)
// 프로토타입 CS Operations 도메인의 두 번째 테이블 (interviews + tasks).
// 출처: design-ref/prototype/library-data.jsx tpl-cs-domain.tasks

import { PRIORITY_OPTIONS } from "@/lib/flowbase-seed"
import type { Board, ColumnDef, TableRow } from "@/types/flowbase"

export const SEED_TASKS_BOARD_ID = "tasks"

const COLUMNS: ColumnDef[] = [
  { name: "id", label: "ID", type: "text", width: 86, mono: true },
  { name: "title", label: "Title", type: "text", width: 300 },
  {
    name: "assignee",
    label: "Assignee",
    type: "avatar",
    width: 140,
    subtitleField: "team",
  },
  { name: "status", label: "Status", type: "status", width: 116 },
  {
    name: "priority",
    label: "Priority",
    type: "select",
    width: 96,
    options: PRIORITY_OPTIONS,
  },
  { name: "due", label: "Due", type: "date", width: 110, mono: true },
]

const ROWS: TableRow[] = [
  {
    id: "TASK-018",
    title: "Follow up with Min-ji on pricing",
    assignee: "Sarah",
    team: "Sales",
    status: "미처리",
    priority: "Urgent",
    due: "2026-05-25",
  },
  {
    id: "TASK-017",
    title: "Review Sarah's onboarding feedback",
    assignee: "Daniel",
    team: "Product",
    status: "진행중",
    priority: "High",
    due: "2026-05-23",
  },
  {
    id: "TASK-016",
    title: "Fix sheet performance on 300+ rows",
    assignee: "Aisha",
    team: "Eng",
    status: "진행중",
    priority: "High",
    due: "2026-05-24",
  },
  {
    id: "TASK-015",
    title: "Draft Pricing pushback digest",
    assignee: "Peter",
    team: "PM",
    status: "대기",
    priority: "Med",
    due: "2026-05-26",
  },
  {
    id: "TASK-014",
    title: "Confirm sharing roles spec",
    assignee: "Maya",
    team: "Product",
    status: "미처리",
    priority: "Med",
    due: "2026-05-28",
  },
  {
    id: "TASK-013",
    title: "Run weekly Customer Feedback dashboard",
    assignee: "Eitan",
    team: "PM",
    status: "완료",
    priority: "Low",
    due: "2026-05-19",
  },
  {
    id: "TASK-012",
    title: "Reach out to Han Seungho for AI feedback",
    assignee: "Sarah",
    team: "Sales",
    status: "진행중",
    priority: "Med",
    due: "2026-05-23",
  },
  {
    id: "TASK-011",
    title: "Investigate Negative sentiment cluster",
    assignee: "Aisha",
    team: "Eng",
    status: "미처리",
    priority: "High",
    due: "2026-05-25",
  },
]

export function createSeedTasksBoard(): Board {
  const ts = new Date().toISOString()
  return {
    id: SEED_TASKS_BOARD_ID,
    label: "Tasks",
    colorVar: "var(--chart-5)",
    idPrefix: "TASK-",
    columns: COLUMNS,
    rows: ROWS,
    aiHistory: [],
    createdAt: ts,
    updatedAt: ts,
  }
}
