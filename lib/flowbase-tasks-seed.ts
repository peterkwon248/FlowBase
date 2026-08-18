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
    title: "민지님과 가격 관련 후속 논의",
    assignee: "Sarah",
    team: "Sales",
    status: "미처리",
    priority: "Urgent",
    due: "2026-05-25",
  },
  {
    id: "TASK-017",
    title: "Sarah의 온보딩 피드백 검토",
    assignee: "Daniel",
    team: "Product",
    status: "진행중",
    priority: "High",
    due: "2026-05-23",
  },
  {
    id: "TASK-016",
    title: "300행 이상 시트 성능 개선",
    assignee: "Aisha",
    team: "Eng",
    status: "진행중",
    priority: "High",
    due: "2026-05-24",
  },
  {
    id: "TASK-015",
    title: "가격 저항 다이제스트 초안 작성",
    assignee: "Peter",
    team: "PM",
    status: "대기",
    priority: "Med",
    due: "2026-05-26",
  },
  {
    id: "TASK-014",
    title: "공유 권한 스펙 확정",
    assignee: "Maya",
    team: "Product",
    status: "미처리",
    priority: "Med",
    due: "2026-05-28",
  },
  {
    id: "TASK-013",
    title: "주간 고객 피드백 대시보드 실행",
    assignee: "Eitan",
    team: "PM",
    status: "완료",
    priority: "Low",
    due: "2026-05-19",
  },
  {
    id: "TASK-012",
    title: "한승호님에게 AI 피드백 요청",
    assignee: "Sarah",
    team: "Sales",
    status: "진행중",
    priority: "Med",
    due: "2026-05-23",
  },
  {
    id: "TASK-011",
    title: "부정 감성 클러스터 분석",
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
