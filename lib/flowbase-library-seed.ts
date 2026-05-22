// FlowBase V2 — Library 시드 (워크스페이스 자산 카탈로그)
// 출처: design-ref/prototype/library-data.jsx
// 설계: docs/02-design/features/flowbase-v2-library.design.md §1

import type {
  Library,
  LibraryCategoryId,
  LibraryDashboard,
  LibraryField,
  LibraryFunction,
  LibraryTemplate,
  OptionList,
} from "@/types/flowbase"

export interface LibraryCategoryMeta {
  id: LibraryCategoryId
  label: string
  desc: string
}

export const LIBRARY_CATEGORIES: LibraryCategoryMeta[] = [
  {
    id: "optionLists",
    label: "Option Lists",
    desc: "공유 가능한 옵션 집합 — 드롭다운·태그·카테고리. 한 번 정의하면 여러 컬럼이 같은 옵션을 공유.",
  },
  {
    id: "fields",
    label: "Fields",
    desc: "컬럼 정의 — 이름·타입·옵션·기본값·검증 규칙을 묶은 한 패키지.",
  },
  {
    id: "templates",
    label: "Templates",
    desc: "여러 Field의 묶음 + 권장 view 설정. 반복되는 테이블을 빠르게 생성.",
  },
  {
    id: "functions",
    label: "Functions",
    desc: "재사용 가능한 스마트 함수 — MATCH·EXTRACT·AI_CLASSIFY. 셀을 자동 채우는 로직.",
  },
  {
    id: "dashboards",
    label: "Dashboards",
    desc: "여러 차트가 큐레이션된 풀 dashboard. 컬럼 시그니처에 맞으면 자동 추천.",
  },
]

const OPTION_LISTS: OptionList[] = [
  {
    id: "ol-modelno",
    name: "모델명",
    desc: "제품 모델 코드",
    usedIn: ["Tasks.모델명", "Returns.모델명"],
    options: [
      { id: "M-PEN-III", label: "M-PEN-III", color: "var(--chart-1)" },
      { id: "POGOPIN", label: "POGOPIN", color: "var(--chart-2)" },
      { id: "DWHM-1", label: "DWHM-1", color: "var(--chart-3)" },
      { id: "PF-10", label: "PF-10", color: "var(--chart-4)" },
      { id: "COOL-MIST", label: "COOL-MIST", color: "var(--chart-5)" },
    ],
  },
  {
    id: "ol-treatment",
    name: "처리방식",
    desc: "CS 처리 유형",
    usedIn: ["Tasks.처리방식"],
    options: [
      { id: "단순변심", label: "단순변심", color: "oklch(0.78 0.10 25)" },
      { id: "변심교환", label: "변심교환 (오주문)", color: "oklch(0.80 0.09 50)" },
      { id: "불량교환", label: "불량교환", color: "oklch(0.83 0.10 80)" },
      { id: "불량환불", label: "불량환불", color: "oklch(0.82 0.09 150)" },
      { id: "AS", label: "A/S (보상판매)", color: "oklch(0.80 0.08 220)" },
      { id: "오배송교환", label: "오배송 교환", color: "oklch(0.80 0.06 250)" },
      { id: "오배송환불", label: "오배송 환불", color: "oklch(0.78 0.06 290)" },
      { id: "사고교환", label: "택배사 사고 교환", color: "oklch(0.55 0.05 280)" },
      { id: "사고환불", label: "택배사 사고 환불", color: "oklch(0.65 0.18 25)" },
      { id: "수거완료", label: "수거하면 끝", color: "oklch(0.58 0.10 60)" },
    ],
  },
  {
    id: "ol-business",
    name: "사업부",
    desc: "판매 채널/사업부",
    usedIn: ["Tasks.사업부"],
    options: [
      { id: "디자인스토리", label: "디자인스토리", color: "var(--chart-1)" },
      { id: "네이버", label: "네이버", color: "var(--chart-2)" },
      { id: "쿠팡", label: "쿠팡", color: "var(--chart-3)" },
      { id: "머레이B2B", label: "머레이 B2B", color: "var(--chart-4)" },
      { id: "영통트레센츠", label: "영통트레센츠", color: "var(--chart-5)" },
    ],
  },
]

const FIELDS: LibraryField[] = [
  {
    id: "fld-receivedAt",
    name: "접수일",
    type: "date",
    desc: "고객 문의 접수 시점",
    usedIn: ["Tasks.접수일"],
    config: {
      required: true,
      default: "today",
      format: "YYYY-MM-DD",
      validation: "미래 날짜 불가",
    },
  },
  {
    id: "fld-productName",
    name: "상품명",
    type: "text",
    desc: "주문서의 원본 상품명",
    usedIn: ["Tasks.상품명", "Returns.상품명"],
    config: { required: true, multiline: true },
  },
  {
    id: "fld-modelno",
    name: "모델명",
    type: "select",
    desc: "@모델명 옵션 리스트 사용",
    usedIn: ["Tasks.모델명"],
    config: { optionListId: "ol-modelno", required: true },
  },
  {
    id: "fld-status",
    name: "처리상태",
    type: "status",
    desc: "워크플로우 단계",
    usedIn: ["Tasks.처리상태"],
    config: {
      options: [
        { id: "received", label: "수거접수", color: "todo" },
        { id: "inspect", label: "검수중", color: "progress" },
        { id: "waiting", label: "대기", color: "waiting" },
        { id: "done", label: "완료", color: "done" },
      ],
      default: "received",
    },
  },
  {
    id: "fld-memo",
    name: "메모",
    type: "text",
    desc: "긴 메모·특이사항",
    usedIn: [],
    config: { multiline: true },
  },
]

const TEMPLATES: LibraryTemplate[] = [
  {
    id: "tpl-cscase",
    name: "CS 케이스",
    desc: "CS팀 표준 케이스 관리 (수거~완료)",
    icon: "📦",
    usedIn: ["Tasks"],
    fields: ["fld-receivedAt", "fld-productName", "fld-modelno", "fld-status", "fld-memo"],
    extraFields: [
      { name: "처리방식", type: "select", config: { optionListId: "ol-treatment" } },
      { name: "사업부", type: "select", config: { optionListId: "ol-business" } },
    ],
    recommendedViews: ["sheet", "kanban"],
    defaultGroupBy: "처리상태",
  },
  {
    id: "tpl-lead",
    name: "Lead 추적",
    desc: "영업 리드 단계 추적",
    icon: "🎯",
    usedIn: [],
    fields: [],
    extraFields: [
      { name: "회사", type: "text" },
      { name: "담당자", type: "text" },
      { name: "단계", type: "status" },
      { name: "예상 매출", type: "num" },
    ],
    recommendedViews: ["kanban", "chart"],
  },
  {
    id: "tpl-cs-domain",
    name: "CS Operations",
    desc: "고객 인터뷰 + Follow-up Tasks 통합 도메인 (2 tables)",
    icon: "📞",
    usedIn: [],
    multiTable: true,
    tables: [
      {
        key: "interviews",
        label: "Interviews",
        colorVar: "var(--chart-1)",
        columns: [
          { name: "id", label: "ID", type: "text", width: 86, mono: true },
          { name: "name", label: "Name", type: "text", width: 140 },
          { name: "company", label: "Company", type: "text", width: 140 },
          { name: "date", label: "Date", type: "date", width: 110 },
          { name: "theme", label: "Theme", type: "select", width: 160 },
          { name: "sentiment", label: "Sentiment", type: "select", width: 110 },
          { name: "status", label: "Status", type: "status", width: 116 },
          { name: "priority", label: "Priority", type: "select", width: 96 },
          { name: "quote", label: "Quote", type: "text", width: 320 },
        ],
      },
      {
        key: "tasks",
        label: "Tasks",
        colorVar: "var(--chart-5)",
        columns: [
          { name: "id", label: "ID", type: "text", width: 86, mono: true },
          { name: "title", label: "Title", type: "text", width: 240 },
          { name: "assignee", label: "Assignee", type: "text", width: 100 },
          { name: "status", label: "Status", type: "status", width: 116 },
          { name: "priority", label: "Priority", type: "select", width: 96 },
          { name: "due", label: "Due", type: "date", width: 110 },
        ],
      },
    ],
    recommendedViews: ["sheet", "kanban", "chart"],
  },
  {
    id: "tpl-ecom-domain",
    name: "Ecommerce",
    desc: "Orders + Returns 통합 (2 tables)",
    icon: "🛒",
    usedIn: [],
    multiTable: true,
    tables: [
      {
        key: "orders",
        label: "Orders",
        colorVar: "var(--chart-3)",
        columns: [
          { name: "id", label: "Order ID", type: "text", width: 86, mono: true },
          { name: "customer", label: "Customer", type: "text", width: 160 },
          { name: "product", label: "Product", type: "text", width: 200 },
          { name: "amount", label: "Amount", type: "num", width: 100 },
          { name: "status", label: "Status", type: "status", width: 116 },
          { name: "date", label: "Date", type: "date", width: 110 },
        ],
      },
      {
        key: "returns",
        label: "Returns",
        colorVar: "var(--chart-4)",
        columns: [
          { name: "id", label: "Return ID", type: "text", width: 86, mono: true },
          { name: "order_id", label: "Order ID", type: "text", width: 110 },
          { name: "reason", label: "Reason", type: "select", width: 160 },
          { name: "status", label: "Status", type: "status", width: 116 },
        ],
      },
    ],
    recommendedViews: ["sheet"],
  },
]

const FUNCTIONS: LibraryFunction[] = [
  {
    id: "rule-match",
    name: "MATCH_FROM_DROPDOWN",
    label: "텍스트에서 옵션 추출",
    icon: "🔍",
    desc: "소스 컬럼 텍스트를 스캔해 Option List와 매칭되는 첫 값을 반환",
    usedIn: ["Tasks.모델명 (auto)", "Tasks.사업부 (auto)"],
    params: [
      { name: "source", type: "column", desc: "스캔할 텍스트 컬럼" },
      { name: "match_against", type: "optionList", desc: "매칭할 Option List" },
      {
        name: "mode",
        type: "enum",
        desc: "partial | exact | AI",
        options: ["partial", "exact", "AI"],
      },
    ],
    example: "상품명='[디자인스토리]머레이 M-Pen-III' → 모델명='M-PEN-III'",
  },
  {
    id: "rule-ai-classify",
    name: "AI_CLASSIFY",
    label: "AI 분류",
    icon: "🤖",
    desc: "Claude가 소스 컬럼을 읽고 Option List 중 가장 적합한 값으로 분류",
    usedIn: ["Interviews.theme", "Interviews.sentiment"],
    params: [
      { name: "source", type: "column", desc: "분류할 텍스트 컬럼" },
      { name: "categories", type: "optionList", desc: "분류 후보 옵션 리스트" },
      { name: "prompt", type: "text", desc: "AI 지시문" },
    ],
    example: "quote='첫 화면 가입 흐름이 너무 길어요' → theme='Onboarding friction'",
  },
  {
    id: "rule-extract",
    name: "EXTRACT_REGEX",
    label: "정규식 추출",
    icon: "✂",
    desc: "정규식 첫 캡처 그룹 추출",
    usedIn: [],
    params: [
      { name: "source", type: "column", desc: "소스 컬럼" },
      { name: "pattern", type: "regex", desc: "정규식 패턴" },
    ],
    example: "상품명='[AS수거][디자인스토리]...' + /\\[(.*?)\\]/ → 'AS수거'",
  },
]

const DASHBOARDS: LibraryDashboard[] = [
  {
    id: "dash-customer-feedback",
    name: "Customer Feedback",
    desc: "고객 인터뷰 · 설문 · 피드백 분석",
    icon: "💬",
    usedIn: ["Interviews"],
    signature: {
      required: [
        { type: "select", keywords: ["sentiment", "감정"] },
        { type: "select", keywords: ["theme", "주제", "카테고리"] },
      ],
      preferred: [{ type: "date" }, { type: "status" }],
    },
    slots: {
      sentiment: { type: "select", keywords: ["sentiment", "감정"] },
      theme: { type: "select", keywords: ["theme", "주제"] },
      status: { type: "status" },
      priority: { type: "select", keywords: ["priority"] },
      date: { type: "date" },
    },
    charts: [
      { type: "kpi", title: "Total rows", width: "quarter" },
      { type: "kpi", title: "Positive %", width: "quarter" },
      { type: "kpi", title: "Urgent", width: "quarter" },
      { type: "kpi", title: "Latest entry", width: "quarter" },
      { type: "line", title: "Entries per week", width: "two-thirds" },
      { type: "donut", title: "Sentiment", width: "one-third" },
      { type: "bar", title: "Top themes", width: "half" },
      { type: "heatmap", title: "Status × Theme", width: "half" },
    ],
  },
  {
    id: "dash-workflow",
    name: "Workflow tracker",
    desc: "Status × Priority × Due date 워크플로우",
    icon: "✓",
    usedIn: ["Tasks"],
    signature: {
      required: [{ type: "status" }],
      preferred: [
        { type: "select", keywords: ["priority"] },
        { type: "date", keywords: ["due"] },
      ],
    },
    slots: {
      status: { type: "status" },
      priority: { type: "select", keywords: ["priority"] },
      due: { type: "date", keywords: ["due"] },
    },
    charts: [
      { type: "kpi", title: "Total tasks", width: "quarter" },
      { type: "kpi", title: "Open", width: "quarter" },
      { type: "kpi", title: "Overdue", width: "quarter" },
      { type: "kpi", title: "Done %", width: "quarter" },
      { type: "donut", title: "By status", width: "one-third" },
      { type: "bar", title: "Priority distribution", width: "two-thirds" },
    ],
  },
  {
    id: "dash-ad-performance",
    name: "Ad Performance",
    desc: "이커머스 광고 효율 — ROAS · 채널별 분석",
    icon: "📈",
    usedIn: [],
    signature: {
      required: [{ type: "num", keywords: ["spend", "비용"] }],
      preferred: [
        { type: "num", keywords: ["revenue", "매출"] },
        { type: "select", keywords: ["channel", "채널"] },
        { type: "date" },
      ],
    },
    slots: {
      spend: { type: "num", keywords: ["spend", "비용"] },
      revenue: { type: "num", keywords: ["revenue", "매출"] },
      channel: { type: "select", keywords: ["channel", "채널"] },
      date: { type: "date" },
    },
    charts: [
      { type: "kpi", title: "Total spend", width: "quarter" },
      { type: "kpi", title: "Total revenue", width: "quarter" },
      { type: "kpi", title: "ROAS", width: "quarter" },
      { type: "kpi", title: "Conversions", width: "quarter" },
      { type: "area", title: "Spend over time", width: "two-thirds" },
      { type: "donut", title: "Channel mix", width: "one-third" },
    ],
  },
]

export function createSeedLibrary(): Library {
  return {
    optionLists: OPTION_LISTS,
    fields: FIELDS,
    templates: TEMPLATES,
    functions: FUNCTIONS,
    dashboards: DASHBOARDS,
  }
}
