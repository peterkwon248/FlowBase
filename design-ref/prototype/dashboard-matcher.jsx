/* @jsx React.createElement */
// FlowBase — Dashboard Template matcher + slot resolver + apply logic.

// ─────────────────────────────────────────────────────────────
// matchSignature(dashboardTemplate, columns) → { score, matched, slots }
//
// Returns:
//   - score: 0-100 fit quality
//   - matched: boolean (signature.required all satisfied?)
//   - slots: { slotName → columnName } resolved mapping
// ─────────────────────────────────────────────────────────────

function _matchColumn(spec, columns, used) {
  // spec = { type?, keywords? } — find a column matching type and/or any keyword
  for (const c of columns) {
    if (used.has(c.name)) continue;
    if (spec.type && c.type !== spec.type) continue;
    if (spec.keywords && spec.keywords.length > 0) {
      const cName = String(c.name || "").toLowerCase();
      const cLabel = String(c.label || "").toLowerCase();
      const hit = spec.keywords.some(k => {
        const kw = k.toLowerCase();
        return cName.includes(kw) || cLabel.includes(kw);
      });
      if (!hit) continue;
    }
    return c.name;
  }
  // Fallback: ignore keywords, match type only
  if (spec.keywords && spec.type) {
    for (const c of columns) {
      if (used.has(c.name)) continue;
      if (c.type === spec.type) return c.name;
    }
  }
  return null;
}

function matchSignature(dashboard, columns) {
  if (!dashboard?.signature) return { score: 0, matched: false, slots: {} };
  const used = new Set();
  const slots = {};

  // 1. Resolve required
  let requiredHits = 0;
  for (const spec of dashboard.signature.required || []) {
    const col = _matchColumn(spec, columns, used);
    if (col) { used.add(col); requiredHits++; }
  }
  const matched = requiredHits === (dashboard.signature.required?.length || 0);

  // 2. Resolve named slots (for chart rendering)
  if (dashboard.slots) {
    for (const [slotName, spec] of Object.entries(dashboard.slots)) {
      const col = _matchColumn(spec, columns, new Set()); // slots can reuse
      if (col) slots[slotName] = col;
    }
  }

  // 3. Score
  const required = dashboard.signature.required?.length || 0;
  const preferred = dashboard.signature.preferred?.length || 0;
  let preferredHits = 0;
  if (matched) {
    for (const spec of dashboard.signature.preferred || []) {
      const col = _matchColumn(spec, columns, new Set());
      if (col) preferredHits++;
    }
  }
  const score = matched
    ? 60 + (preferred > 0 ? (preferredHits / preferred) * 40 : 40)
    : (requiredHits / Math.max(1, required)) * 40;

  return { score: Math.round(score), matched, slots };
}

// ─────────────────────────────────────────────────────────────
// Find the BEST matching dashboard template for given columns
// ─────────────────────────────────────────────────────────────

function findBestDashboardMatch(columns, dashboards) {
  const dbs = dashboards || (window.LIBRARY?.dashboards || []);
  let best = null;
  for (const d of dbs) {
    const m = matchSignature(d, columns);
    if (m.matched && (!best || m.score > best.score)) {
      best = { dashboard: d, ...m };
    }
  }
  return best;
}

// ─────────────────────────────────────────────────────────────
// Apply template — produce concrete charts array (replacing $slot refs)
// ─────────────────────────────────────────────────────────────

function applyDashboardTemplate(template, slots) {
  const resolve = (val) => {
    if (typeof val !== "string") return val;
    if (val.startsWith("$")) {
      const slot = val.slice(1);
      return slots[slot] || null;
    }
    return val;
  };
  return template.charts
    .map((spec, i) => {
      const out = { id: "tpl-" + template.id + "-" + i };
      for (const [k, v] of Object.entries(spec)) {
        out[k] = resolve(v);
      }
      // Drop charts whose required column slot wasn't resolved
      if (out.metricCol === null && out.metric && out.metric !== "count") return null;
      if (out.dim === null && (out.type === "bar" || out.type === "donut")) return null;
      if ((out.dimX === null || out.dimY === null) && (out.type === "heatmap" || out.type === "stacked-bar")) return null;
      if (out.dateCol === null && (out.type === "line" || out.type === "area")) return null;
      return out;
    })
    .filter(Boolean);
}

Object.assign(window, {
  matchSignature, findBestDashboardMatch, applyDashboardTemplate,
});
