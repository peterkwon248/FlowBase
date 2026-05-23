// FlowBase V2 — Library 시드 (워크스페이스 자산 카탈로그)
// 출처: design-ref/prototype/library-data.jsx
// 설계: docs/02-design/features/flowbase-v2-library.design.md §1
//
// Note: 이 시드는 영어. Status 키(TicketStatus: 미처리/진행중/대기/완료)는 LOCK
// 한국어 보존이지만, Library 내부 자산명/옵션 라벨은 사용자 노출이라 영어로.
// keywords 배열은 AI 매칭용이라 영어 우선.

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
    desc: "Shared option sets — dropdowns, tags, categories. Define once and many columns can share the same options.",
  },
  {
    id: "fields",
    label: "Fields",
    desc: "Column definitions — name, type, options, default, validation bundled together.",
  },
  {
    id: "templates",
    label: "Templates",
    desc: "Bundles of Fields with recommended views. Spin up repeated tables fast.",
  },
  {
    id: "functions",
    label: "Functions",
    desc: "Reusable smart functions — MATCH, EXTRACT, AI_CLASSIFY. Logic that auto-fills cells.",
  },
  {
    id: "dashboards",
    label: "Dashboards",
    desc: "Curated dashboard layouts. Auto-recommended when a board's columns match the signature.",
  },
]

const OPTION_LISTS: OptionList[] = [
  {
    id: "ol-modelno",
    name: "Model",
    desc: "Product model codes",
    usedIn: ["Tasks.model", "Returns.model"],
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
    name: "Handling type",
    desc: "How the CS case is being processed",
    usedIn: ["Tasks.handling"],
    options: [
      { id: "remorse", label: "Buyer's remorse", color: "oklch(0.78 0.10 25)" },
      { id: "wrong_model", label: "Wrong model exchange", color: "oklch(0.80 0.09 50)" },
      { id: "defect_exchange", label: "Defect exchange", color: "oklch(0.83 0.10 80)" },
      { id: "defect_refund", label: "Defect refund", color: "oklch(0.82 0.09 150)" },
      { id: "as", label: "A/S (warranty)", color: "oklch(0.80 0.08 220)" },
      { id: "ship_err_exchange", label: "Shipping error exchange", color: "oklch(0.80 0.06 250)" },
      { id: "ship_err_refund", label: "Shipping error refund", color: "oklch(0.78 0.06 290)" },
      { id: "carrier_exchange", label: "Carrier damage exchange", color: "oklch(0.55 0.05 280)" },
      { id: "carrier_refund", label: "Carrier damage refund", color: "oklch(0.65 0.18 25)" },
      { id: "pickup_only", label: "Pickup only", color: "oklch(0.58 0.10 60)" },
    ],
  },
  {
    id: "ol-business",
    name: "Business unit",
    desc: "Sales channel / business unit",
    usedIn: ["Tasks.channel"],
    options: [
      { id: "design_story", label: "Design Story", color: "var(--chart-1)" },
      { id: "naver", label: "Naver", color: "var(--chart-2)" },
      { id: "coupang", label: "Coupang", color: "var(--chart-3)" },
      { id: "murray_b2b", label: "Murray B2B", color: "var(--chart-4)" },
      { id: "yeongtong", label: "Yeongtong Trecents", color: "var(--chart-5)" },
    ],
  },
]

const FIELDS: LibraryField[] = [
  {
    id: "fld-receivedAt",
    name: "Received at",
    type: "date",
    desc: "When the customer inquiry was received",
    usedIn: ["Tasks.received_at"],
    config: {
      required: true,
      default: "today",
      format: "YYYY-MM-DD",
      validation: "Future dates not allowed",
    },
  },
  {
    id: "fld-productName",
    name: "Product name",
    type: "text",
    desc: "Original product title from the order",
    usedIn: ["Tasks.product_name", "Returns.product_name"],
    config: { required: true, multiline: true },
  },
  {
    id: "fld-modelno",
    name: "Model",
    type: "select",
    desc: "Uses the @Model option list",
    usedIn: ["Tasks.model"],
    config: { optionListId: "ol-modelno", required: true },
  },
  {
    id: "fld-status",
    name: "Workflow status",
    type: "status",
    desc: "Where the case is in the workflow",
    usedIn: ["Tasks.status"],
    config: {
      options: [
        { id: "received", label: "Pickup requested", color: "todo" },
        { id: "inspect", label: "Inspecting", color: "progress" },
        { id: "waiting", label: "Waiting", color: "waiting" },
        { id: "done", label: "Done", color: "done" },
      ],
      default: "received",
    },
  },
  {
    id: "fld-memo",
    name: "Notes",
    type: "text",
    desc: "Long-form notes and special remarks",
    usedIn: [],
    config: { multiline: true },
  },
]

const TEMPLATES: LibraryTemplate[] = [
  {
    id: "tpl-cscase",
    name: "CS Case",
    desc: "Standard CS team case (pickup → done)",
    icon: "📦",
    usedIn: ["Tasks"],
    fields: ["fld-receivedAt", "fld-productName", "fld-modelno", "fld-status", "fld-memo"],
    extraFields: [
      { name: "handling", type: "select", config: { optionListId: "ol-treatment" } },
      { name: "channel", type: "select", config: { optionListId: "ol-business" } },
    ],
    recommendedViews: ["sheet", "kanban"],
    defaultGroupBy: "status",
  },
  {
    id: "tpl-lead",
    name: "Lead tracker",
    desc: "Sales lead pipeline by stage",
    icon: "🎯",
    usedIn: [],
    fields: [],
    extraFields: [
      { name: "Company", type: "text" },
      { name: "Contact", type: "text" },
      { name: "Stage", type: "status" },
      { name: "Est. revenue", type: "num" },
    ],
    recommendedViews: ["kanban", "chart"],
  },
  {
    id: "tpl-cs-domain",
    name: "CS Operations",
    desc: "Customer interviews + Follow-up tasks domain (2 tables)",
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
    desc: "Orders + Returns (2 tables)",
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
    label: "Extract option from text",
    icon: "🔍",
    desc: "Scans the source column text and returns the first value matching the Option List",
    usedIn: ["Tasks.model (auto)", "Tasks.channel (auto)"],
    params: [
      { name: "source", type: "column", desc: "Text column to scan" },
      { name: "match_against", type: "optionList", desc: "Option list to match against" },
      {
        name: "mode",
        type: "enum",
        desc: "partial | exact | AI",
        options: ["partial", "exact", "AI"],
      },
    ],
    example: "product_name='[Design Story] Murray M-Pen-III' → model='M-PEN-III'",
  },
  {
    id: "rule-ai-classify",
    name: "AI_CLASSIFY",
    label: "AI classify",
    icon: "🤖",
    desc: "Claude reads the source column and classifies it into the best-matching option",
    usedIn: ["Interviews.theme", "Interviews.sentiment"],
    params: [
      { name: "source", type: "column", desc: "Text column to classify" },
      { name: "categories", type: "optionList", desc: "Candidate option list" },
      { name: "prompt", type: "text", desc: "Instruction prompt" },
    ],
    example: "quote='Sign-up flow on first screen is too long' → theme='Onboarding friction'",
  },
  {
    id: "rule-extract",
    name: "EXTRACT_REGEX",
    label: "Regex extract",
    icon: "✂",
    desc: "Returns the first regex capture group",
    usedIn: [],
    params: [
      { name: "source", type: "column", desc: "Source column" },
      { name: "pattern", type: "regex", desc: "Regex pattern" },
    ],
    example: "product_name='[AS pickup][Design Story]...' + /\\[(.*?)\\]/ → 'AS pickup'",
  },
]

const DASHBOARDS: LibraryDashboard[] = [
  {
    id: "dash-customer-feedback",
    name: "Customer Feedback",
    desc: "Customer interviews, surveys, and feedback analysis",
    icon: "💬",
    usedIn: ["Interviews"],
    signature: {
      required: [
        { type: "select", keywords: ["sentiment"] },
        { type: "select", keywords: ["theme", "category"] },
      ],
      preferred: [{ type: "date" }, { type: "status" }],
    },
    slots: {
      sentiment: { type: "select", keywords: ["sentiment"] },
      theme: { type: "select", keywords: ["theme"] },
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
    desc: "Status × Priority × Due date workflow",
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
    desc: "Ecommerce ad efficiency — ROAS and per-channel analysis",
    icon: "📈",
    usedIn: [],
    signature: {
      required: [{ type: "num", keywords: ["spend", "cost"] }],
      preferred: [
        { type: "num", keywords: ["revenue", "sales"] },
        { type: "select", keywords: ["channel"] },
        { type: "date" },
      ],
    },
    slots: {
      spend: { type: "num", keywords: ["spend", "cost"] },
      revenue: { type: "num", keywords: ["revenue", "sales"] },
      channel: { type: "select", keywords: ["channel"] },
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
