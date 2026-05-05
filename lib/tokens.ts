// visual: light+dark semantic color tokens — Linear style, WCAG AA compliant
// This file provides badge/label class helpers with proper dark mode support.
// Re-exports for backwards compatibility with existing imports from mock-data.ts

import type { Tone, ChartColor } from "@/lib/mock-data"

/**
 * Badge classes for each tone — includes both light and dark mode variants.
 * Border opacity at 60% per Linear style guide.
 */
export function toneBadgeClassDual(tone: Tone): string {
  switch (tone) {
    case "destructive":
      return "bg-danger-bg text-danger-fg border-destructive/20 dark:border-destructive/30"
    case "primary":
      return "bg-primary/10 text-primary border-primary/20 dark:bg-primary/15 dark:border-primary/30"
    case "warning":
      return "bg-warning-bg text-warning-fg border-warning/25 dark:border-warning/35"
    case "success":
      return "bg-success-bg text-success-fg border-success/20 dark:border-success/30"
    case "muted":
      return "bg-muted text-muted-foreground border-border/60"
    case "chart-1":
      return "bg-chart-1/10 text-chart-1 border-chart-1/20 dark:bg-chart-1/15 dark:border-chart-1/30"
    case "chart-2":
      return "bg-chart-2/10 text-chart-2 border-chart-2/20 dark:bg-chart-2/15 dark:border-chart-2/30"
    case "chart-3":
      return "bg-chart-3/10 text-chart-3 border-chart-3/20 dark:bg-chart-3/15 dark:border-chart-3/30"
    case "chart-4":
      return "bg-chart-4/10 text-chart-4 border-chart-4/20 dark:bg-chart-4/15 dark:border-chart-4/30"
    case "chart-5":
      return "bg-chart-5/10 text-chart-5 border-chart-5/20 dark:bg-chart-5/15 dark:border-chart-5/30"
  }
}

/**
 * Dot indicator classes for each tone — solid color dots.
 */
export function toneDotClassDual(tone: Tone): string {
  switch (tone) {
    case "destructive":
      return "bg-destructive"
    case "primary":
      return "bg-primary"
    case "warning":
      return "bg-warning"
    case "success":
      return "bg-success"
    case "muted":
      return "bg-muted-foreground"
    case "chart-1":
      return "bg-chart-1"
    case "chart-2":
      return "bg-chart-2"
    case "chart-3":
      return "bg-chart-3"
    case "chart-4":
      return "bg-chart-4"
    case "chart-5":
      return "bg-chart-5"
  }
}

/**
 * Background color classes for chart colors.
 */
export function colorBgClassDual(c: ChartColor): string {
  switch (c) {
    case "chart-1":
      return "bg-chart-1"
    case "chart-2":
      return "bg-chart-2"
    case "chart-3":
      return "bg-chart-3"
    case "chart-4":
      return "bg-chart-4"
    case "chart-5":
      return "bg-chart-5"
  }
}

/**
 * Text color classes for chart colors.
 */
export function colorTextClassDual(c: ChartColor): string {
  switch (c) {
    case "chart-1":
      return "text-chart-1"
    case "chart-2":
      return "text-chart-2"
    case "chart-3":
      return "text-chart-3"
    case "chart-4":
      return "text-chart-4"
    case "chart-5":
      return "text-chart-5"
  }
}

/**
 * Priority indicator — left dot style (Linear-style minimal priority indicator).
 * Returns classes for a small dot on the left side of a card/row.
 * Light mode uses darker/saturated colors, dark mode uses brighter variants.
 */
export function priorityDotClass(priority: "Urgent" | "High" | "Med" | "Low"): string {
  switch (priority) {
    case "Urgent":
      // Light: deeper red, Dark: bright red
      return "bg-red-600 dark:bg-red-500"
    case "High":
      // Light: deeper orange, Dark: bright orange
      return "bg-orange-600 dark:bg-orange-400"
    case "Med":
      // Light: deeper blue, Dark: bright blue
      return "bg-blue-600 dark:bg-blue-400"
    case "Low":
      // Light: medium gray, Dark: lighter gray
      return "bg-slate-500 dark:bg-slate-400"
  }
}

/**
 * Priority text color — for icons and text labels.
 * Light mode uses darker shades, dark mode uses brighter shades.
 */
export function priorityTextClass(priority: "Urgent" | "High" | "Med" | "Low"): string {
  switch (priority) {
    case "Urgent":
      return "text-red-600 dark:text-red-400"
    case "High":
      return "text-orange-600 dark:text-orange-400"
    case "Med":
      return "text-blue-600 dark:text-blue-400"
    case "Low":
      return "text-slate-500 dark:text-slate-400"
  }
}

/**
 * Status indicator — for kanban columns and badges.
 * Light mode uses darker/saturated colors, dark mode uses brighter variants.
 */
export function statusColorClass(status: "미처리" | "진행중" | "대기" | "완료"): string {
  switch (status) {
    case "미처리":
      // Light: deeper blue, Dark: lighter blue (cool "needs attention" tone)
      return "text-blue-600 dark:text-blue-400"
    case "진행중":
      // Light: deeper yellow/amber, Dark: bright yellow
      return "text-amber-600 dark:text-yellow-400"
    case "대기":
      // Light: deeper purple, Dark: bright purple
      return "text-violet-600 dark:text-violet-400"
    case "완료":
      // Light: deeper green, Dark: bright green
      return "text-emerald-600 dark:text-emerald-400"
  }
}

/**
 * Status badge background — subtle background with proper contrast.
 */
export function statusBgClass(status: "미처리" | "진행중" | "대기" | "완료"): string {
  switch (status) {
    case "미처리":
      return "bg-blue-200 dark:bg-blue-900/30"
    case "진행중":
      return "bg-amber-200 dark:bg-yellow-900/30"
    case "대기":
      return "bg-violet-200 dark:bg-violet-900/30"
    case "완료":
      return "bg-emerald-200 dark:bg-emerald-900/30"
  }
}

/**
 * Card hover class — Linear-style subtle hover effect.
 */
export const cardHoverClass = "hover:bg-foreground/[0.02] dark:hover:bg-foreground/[0.03]"

/**
 * Row hover class — very subtle background change.
 */
export const rowHoverClass = "hover:bg-foreground/[0.02] dark:hover:bg-foreground/[0.04]"

/**
 * Border class — 1px with reduced opacity (Linear style).
 */
export const subtleBorderClass = "border border-border/60"

/**
 * Focus ring class — Linear-style focus indicator.
 */
export const focusRingClass = "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
