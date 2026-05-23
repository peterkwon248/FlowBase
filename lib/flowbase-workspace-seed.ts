// FlowBase V2 — Workspace 시드 (Automations + AI Suggestions)
// 출처: design-ref/prototype/automations.jsx

import type { AutomationRule, SuggestedAutomation } from "@/types/flowbase"

export const SEED_AUTOMATIONS: AutomationRule[] = [
  {
    id: "AUT-001",
    name: "Negative interviews → urgent task",
    when: {
      table: "interviews",
      event: "row added or sentiment changes to",
      value: "Negative",
    },
    then: [
      {
        action: "Add row to",
        target: "Tasks",
        detail: 'title: "Follow up with {name}", priority: Urgent',
      },
      { action: "Notify", target: "@peter" },
    ],
    status: "active",
    aiSuggested: true,
    runsThisWeek: 4,
    lastRun: "2 hours ago",
  },
  {
    id: "AUT-002",
    name: "Theme=Pricing → assign to sales",
    when: {
      table: "interviews",
      event: "AI Theme confirmed as",
      value: "Pricing pushback",
    },
    then: [
      { action: "Set", target: "priority", detail: "High" },
      { action: "Notify", target: "#sales-leads" },
    ],
    status: "active",
    runsThisWeek: 7,
    lastRun: "20 min ago",
  },
  {
    id: "AUT-003",
    name: "Daily summary at 9am",
    when: { table: "—", event: "every day at", value: "09:00 KST" },
    then: [
      {
        action: "Generate",
        target: "AI digest",
        detail: "yesterday's interviews by sentiment + theme",
      },
      { action: "Email to", target: "peter@flowbase.app" },
    ],
    status: "active",
    runsThisWeek: 7,
    lastRun: "Today 09:00",
  },
  {
    id: "AUT-004",
    name: "Overdue task → Waiting",
    when: {
      table: "tasks",
      event: "due date passes and status is",
      value: "In progress",
    },
    then: [
      { action: "Set status", target: "tasks", detail: "Waiting" },
      { action: "Notify", target: "{assignee}" },
    ],
    status: "paused",
    runsThisWeek: 0,
    lastRun: "5 days ago",
  },
  {
    id: "AUT-005",
    name: "Archive completed after 30 days",
    when: {
      table: "interviews",
      event: "status=Done for",
      value: "30 days",
    },
    then: [{ action: "Archive row", target: "interviews" }],
    status: "draft",
    runsThisWeek: 0,
    lastRun: "never",
  },
]

export const SEED_SUGGESTED_AUTOMATIONS: SuggestedAutomation[] = [
  {
    id: "SUG-001",
    summary: "Auto-create weekly Pricing pushback digest",
    detail:
      "You've had 5 Pricing pushback interviews this week — Claude can generate a Monday digest and add it as a new row in your Notes table.",
    confidence: 0.86,
  },
  {
    id: "SUG-002",
    summary: "Auto-flag tasks stuck in In progress 14+ days",
    detail:
      "3 tasks have been in In progress for over 2 weeks. Move them to Waiting with a comment summarizing what's blocking?",
    confidence: 0.73,
  },
  {
    id: "SUG-003",
    summary: "Slack ping on Negative + Urgent",
    detail:
      "When sentiment=Negative AND priority=Urgent, post the row to your Slack channel for live triage.",
    confidence: 0.91,
  },
]
