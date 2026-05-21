/* @jsx React.createElement */
// FlowBase — Automation Engine: WHEN-THEN rule executor.
//
// Triggers supported:
//   - "row.added"        — fired after a new row created
//   - "row.changed"      — fired after a cell value changes
//
// Actions supported:
//   - "addRow"     params: { table: tableId, fields: {...} (token-expanded from source row) }
//   - "setCell"    params: { col: string, value: string|tokenExpr }
//   - "notify"     params: { message: tokenExpr } — logs to aiHistory
//
// Rules are stored as a list with: { id, name, when: {trigger, table, condition}, then: [actions], status }
// Token syntax: {colName} expands to source row's field value.

function expandTokens(template, row) {
  if (typeof template !== "string") return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => String(row?.[key] ?? "(?)"));
}

function rowMatchesCondition(row, condition) {
  if (!condition) return true;
  // condition: { col, op, value }
  // op: "equals" | "notEquals" | "contains" | "exists"
  const val = row[condition.col];
  if (condition.op === "equals")    return String(val) === String(condition.value);
  if (condition.op === "notEquals") return String(val) !== String(condition.value);
  if (condition.op === "contains")  return String(val ?? "").includes(condition.value || "");
  if (condition.op === "exists")    return val !== undefined && val !== null && val !== "";
  if (condition.op === "changed")   return condition.changedFields?.includes(condition.col);
  return true;
}

// Run all rules matching given trigger + table + row, mutating state via callbacks
function runAutomations({ rules, trigger, tableId, row, changedFields, env }) {
  // env: { tablesById, setTablesById, pushHistory, setToast }
  if (!rules || rules.length === 0) return [];
  const fired = [];

  rules.forEach(rule => {
    if (rule.status !== "active") return;
    if (rule.when?.trigger !== trigger) return;
    if (rule.when?.table && rule.when.table !== tableId) return;
    // For row.changed: optionally only fire when specific field changed
    if (trigger === "row.changed" && rule.when?.condition?.op === "changed") {
      if (!changedFields?.includes(rule.when.condition.col)) return;
    }
    // Condition check (col/op/value)
    if (rule.when?.condition && !rowMatchesCondition(row, rule.when.condition)) return;

    // Execute then-actions
    const log = [];
    (rule.then || []).forEach(action => {
      if (action.action === "addRow") {
        const targetTbl = env.tablesById[action.table];
        if (!targetTbl) { log.push({ kind: "skip", text: `Target table ${action.table} not found` }); return; }
        const id = (action.idPrefix || "AUTO-") + Date.now().toString(36) + "-" + Math.floor(Math.random() * 100);
        const newRow = { id };
        Object.entries(action.fields || {}).forEach(([k, v]) => {
          newRow[k] = expandTokens(v, row);
        });
        env.setTablesById(prev => ({
          ...prev,
          [action.table]: { ...prev[action.table], rows: [newRow, ...(prev[action.table].rows || [])] },
        }));
        log.push({ kind: "addRow", text: `Added ${id} to ${targetTbl.label}` });
      } else if (action.action === "setCell") {
        env.setTablesById(prev => {
          const t = prev[tableId];
          if (!t) return prev;
          const newRows = t.rows.map(r => r.id === row.id ? { ...r, [action.col]: expandTokens(action.value, row) } : r);
          return { ...prev, [tableId]: { ...t, rows: newRows } };
        });
        log.push({ kind: "setCell", text: `Set ${action.col} = ${expandTokens(action.value, row)}` });
      } else if (action.action === "notify") {
        const msg = expandTokens(action.message || action.target, row);
        log.push({ kind: "notify", text: `Notified: ${msg}` });
      }
    });

    fired.push({ rule, log, time: new Date().toISOString().slice(11, 16) });
    if (env.pushHistory) env.pushHistory({
      title: `⚙ Automation fired: ${rule.name}`,
      detail: log.map(l => l.text).join(" · ") || "ran with no actions",
      time: new Date().toISOString().slice(11, 16),
    });
  });

  if (fired.length > 0 && env.setToast) {
    env.setToast({
      kind: "success",
      message: `${fired.length} automation${fired.length > 1 ? "s" : ""} ran · ${fired[0].rule.name}${fired.length > 1 ? "..." : ""}`,
    });
  }

  return fired;
}

// Convert UI display rule (AUTOMATION_RULES seed) to the executor format
function compileSeedRule(r) {
  // The seed rules in automations.jsx are illustration-shape. We can't reliably
  // execute them. So we expose a separate executableRules list.
  return r;
}

// Seed executable automations — these actually run against the prototype data
const EXECUTABLE_AUTOMATIONS = [
  {
    id: "exec-negative-to-task",
    name: "Negative sentiment → urgent task",
    desc: "When Interviews row changes sentiment to Negative, add a follow-up to Tasks",
    status: "active",
    when: {
      trigger: "row.changed",
      table: "interviews",
      condition: { col: "sentiment", op: "equals", value: "Negative" },
    },
    then: [
      {
        action: "addRow",
        table: "tasks",
        idPrefix: "TSK-AUTO-",
        fields: {
          title: "Follow up with {name} ({company}) — Negative sentiment",
          related: "{id}",
          assignee: "peter",
          status: "todo",
          priority: "Urgent",
          due: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10),
          created: new Date().toISOString().slice(0, 10),
        },
      },
      { action: "notify", message: "Created urgent task for {name}" },
    ],
  },
  {
    id: "exec-pricing-high",
    name: "Pricing pushback → High priority",
    desc: "When Theme = Pricing pushback, set Priority to High",
    status: "active",
    when: {
      trigger: "row.changed",
      table: "interviews",
      condition: { col: "theme", op: "equals", value: "Pricing pushback" },
    },
    then: [
      { action: "setCell", col: "priority", value: "High" },
      { action: "notify", message: "{name} flagged for sales review" },
    ],
  },
];

Object.assign(window, {
  runAutomations,
  rowMatchesCondition,
  expandTokens,
  EXECUTABLE_AUTOMATIONS,
});
