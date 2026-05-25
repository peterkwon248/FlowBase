// FlowBase V2 — Conditional formatting (G7-A3)
// cell value 룰 평가 → tone 반환. sheet view td bg class에 사용.

import type { FormatRule, FormatTone } from "@/types/flowbase"

// 첫 매치 룰의 tone 반환. 매치 ❌면 null.
export function evalFormatRules(
  cellValue: unknown,
  rules?: FormatRule[],
): FormatTone | null {
  if (!rules || rules.length === 0) return null
  if (cellValue == null || cellValue === "") return null

  for (const rule of rules) {
    if (rule.kind === "lt" || rule.kind === "gt") {
      const n =
        typeof cellValue === "number"
          ? cellValue
          : typeof cellValue === "string"
            ? Number(cellValue.trim())
            : NaN
      if (!Number.isFinite(n)) continue
      if (rule.kind === "lt" && n < rule.value) return rule.tone
      if (rule.kind === "gt" && n > rule.value) return rule.tone
    } else if (rule.kind === "eq") {
      const cellStr = Array.isArray(cellValue)
        ? cellValue.map((v) => String(v)).join(",")
        : String(cellValue)
      if (cellStr === rule.value) return rule.tone
    } else if (rule.kind === "contains") {
      const cellStr = Array.isArray(cellValue)
        ? cellValue.map((v) => String(v)).join(",").toLowerCase()
        : String(cellValue).toLowerCase()
      if (cellStr.includes(rule.value.toLowerCase())) return rule.tone
    }
  }
  return null
}

// tone → tailwind bg/border classes (light + dark)
export const FORMAT_TONE_BG: Record<FormatTone, string> = {
  red: "bg-rose-100 dark:bg-rose-900/30",
  amber: "bg-amber-100 dark:bg-amber-900/30",
  emerald: "bg-emerald-100 dark:bg-emerald-900/30",
  blue: "bg-blue-100 dark:bg-blue-900/30",
}

export const FORMAT_TONE_LABEL: Record<FormatTone, string> = {
  red: "Red",
  amber: "Amber",
  emerald: "Green",
  blue: "Blue",
}
