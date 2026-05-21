/* @jsx React.createElement */
// FlowBase — Rule engine: real executors for Library Rules.

// ─────────────────────────────────────────────────────────────
// MATCH_FROM_DROPDOWN
//   Scans the source column text and returns the FIRST matching
//   option from a Library Option List. Normalizes hyphens/spaces.
// ─────────────────────────────────────────────────────────────

function ruleMatchFromDropdown(params, row) {
  const sourceText = String(row[params.source] ?? "");
  if (!sourceText) return null;
  const ol = LIBRARY.optionLists.find(o => o.id === params.match_against);
  if (!ol) return null;
  const mode = params.mode || "partial";

  const normalize = (s) => String(s).toLowerCase().replace(/[-\s_]+/g, "");
  const target = normalize(sourceText);

  if (mode === "exact") {
    return ol.options.find(o => normalize(o.label) === target || normalize(o.id) === target)?.label ?? null;
  }

  // partial (case-insensitive, hyphen-insensitive)
  for (const o of ol.options) {
    const needle = normalize(o.label);
    if (needle && target.includes(needle)) return o.label;
    const idNeedle = normalize(o.id);
    if (idNeedle && idNeedle !== needle && target.includes(idNeedle)) return o.label;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// EXTRACT_REGEX
//   Returns the FIRST capture group of the regex match (or full match).
// ─────────────────────────────────────────────────────────────

function ruleExtractRegex(params, row) {
  const sourceText = String(row[params.source] ?? "");
  if (!sourceText || !params.pattern) return null;
  try {
    const re = new RegExp(params.pattern);
    const m = sourceText.match(re);
    return m ? (m[1] ?? m[0]) : null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// AI_CLASSIFY — async via window.claude.complete()
// Returns a Promise<string|null>
// ─────────────────────────────────────────────────────────────

async function ruleAiClassify(params, row) {
  const sourceText = String(row[params.source] ?? "");
  if (!sourceText) return null;
  const ol = LIBRARY.optionLists.find(o => o.id === params.categories);
  if (!ol) return null;
  const labels = ol.options.map(o => o.label);
  const prompt = `${params.prompt || "다음 텍스트를 가장 적합한 카테고리로 분류하세요."}

카테고리: ${labels.join(", ")}

텍스트: ${sourceText}

가장 적합한 카테고리 라벨 하나만 정확히 출력하세요. 다른 말 금지.`;
  try {
    const text = await window.claude.complete(prompt);
    const trimmed = String(text).trim();
    // Match against label list
    const match = labels.find(l => trimmed.includes(l));
    return match || null;
  } catch {
    return null;
  }
}

// ─────────────────────────────────────────────────────────────
// Dispatcher
//   Sync rules return a value immediately; async rules return a Promise.
// ─────────────────────────────────────────────────────────────

function executeRule(rule, row) {
  if (!rule || !rule.ruleId) return null;
  const params = rule.params || {};
  switch (rule.ruleId) {
    case "rule-match":        return ruleMatchFromDropdown(params, row);
    case "rule-extract":      return ruleExtractRegex(params, row);
    case "rule-ai-classify":  return ruleAiClassify(params, row);
    default: return null;
  }
}

function isAsyncRule(rule) {
  return rule?.ruleId === "rule-ai-classify";
}

// Get human label for a rule id
function ruleLabel(ruleId) {
  return ((LIBRARY.functions || LIBRARY.rules || []).find(r => r.id === ruleId)?.label) || ruleId;
}

Object.assign(window, { executeRule, isAsyncRule, ruleLabel });
