/* @jsx React.createElement */
// FlowBase — Workspace Templates: domain bundles (tables + dashboards + automations)

const LIB_WORKSPACES = [
  {
    id: "ws-cs",
    name: "CS Operations",
    icon: "📞",
    desc: "고객 문의 / 인터뷰 / Theme 분류 / Follow-up Tasks",
    tables: [
      {
        id: "ws-tbl-interviews", label: "Interviews", colorVar: "var(--chart-1)",
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
        seedRows: 5,
      },
      {
        id: "ws-tbl-tasks", label: "Tasks", colorVar: "var(--chart-5)",
        columns: [
          { name: "id", label: "ID", type: "text", width: 86, mono: true },
          { name: "title", label: "Title", type: "text", width: 240 },
          { name: "assignee", label: "Assignee", type: "text", width: 100 },
          { name: "status", label: "Status", type: "status", width: 116 },
          { name: "priority", label: "Priority", type: "select", width: 96 },
          { name: "due", label: "Due", type: "date", width: 110 },
        ],
        seedRows: 0,
      },
    ],
  },
  {
    id: "ws-ads",
    name: "Ad Performance",
    icon: "📈",
    desc: "이커머스 광고 효율 — Campaigns / Channels / Spend / ROAS",
    tables: [
      {
        id: "ws-tbl-campaigns", label: "Campaigns", colorVar: "var(--chart-2)",
        columns: [
          { name: "id", label: "ID", type: "text", width: 86, mono: true },
          { name: "name", label: "Campaign", type: "text", width: 200 },
          { name: "channel", label: "Channel", type: "select", width: 140 },
          { name: "spend", label: "Spend", type: "num", width: 110 },
          { name: "revenue", label: "Revenue", type: "num", width: 110 },
          { name: "impressions", label: "Impressions", type: "num", width: 120 },
          { name: "clicks", label: "Clicks", type: "num", width: 100 },
          { name: "conversions", label: "Conversions", type: "num", width: 110 },
          { name: "date", label: "Date", type: "date", width: 110 },
        ],
        seedRows: 0,
      },
    ],
  },
  {
    id: "ws-ecommerce",
    name: "Ecommerce",
    icon: "🛒",
    desc: "Orders / Products / Returns / Customers",
    tables: [
      {
        id: "ws-tbl-orders", label: "Orders", colorVar: "var(--chart-3)",
        columns: [
          { name: "id", label: "Order ID", type: "text", width: 86, mono: true },
          { name: "customer", label: "Customer", type: "text", width: 160 },
          { name: "product", label: "Product", type: "text", width: 200 },
          { name: "amount", label: "Amount", type: "num", width: 100 },
          { name: "status", label: "Status", type: "status", width: 116 },
          { name: "date", label: "Date", type: "date", width: 110 },
        ],
        seedRows: 0,
      },
      {
        id: "ws-tbl-returns", label: "Returns", colorVar: "var(--chart-4)",
        columns: [
          { name: "id", label: "Return ID", type: "text", width: 86, mono: true },
          { name: "order_id", label: "Order ID", type: "text", width: 110 },
          { name: "reason", label: "Reason", type: "select", width: 160 },
          { name: "status", label: "Status", type: "status", width: 116 },
        ],
        seedRows: 0,
      },
    ],
  },
];

Object.assign(window, { LIB_WORKSPACES });
