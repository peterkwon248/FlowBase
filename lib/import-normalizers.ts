// FlowBase V2 — Import source detect + column normalize (Im-3)
// 출처: 상용화 backlog Im-3 — Notion/Airtable export 흡수.
//
// Notion · Airtable export는 모두 CSV. 우리 parser로 이미 처리 가능.
// 이 모듈은 그 위의 normalize layer — source 추정 + 잘 알려진 header 표준화 + type 추론.
// 추가 lib ❌ (의존성 0 LOCK).
//
// 추정 룰:
//   - Notion: headers에 `Created time`/`Last edited time`/`Last edited by` (lowercase 't') 존재
//   - Airtable: headers에 `Created Time`/`Last Modified Time`/`Last Modified By` (titlecase 'T') 존재
//   - 그 외: generic
//
// Normalize (header 라벨만 변환 — 데이터는 그대로):
//   - Notion `Created time` → `Created at` (보드 createdAt 일관성)
//   - Airtable `Created Time` → `Created at`
//   - 매칭 ❌면 원본 유지
//
// Type 추론 (Im-3 후속):
//   - 헤더 패턴으로 column type 자동 (sample inferType의 보조).
//   - "Created at"/"Due date"/날짜 헤더 → date
//   - "Status"/"State"/"Stage" → status
//   - "Person"/"Assigned to"/"Created by" → avatar
//   - "Tags"/"Multi-select" → text (multi-select column type 없음 — 후속 phase)
//
// 후속 (이번 패스 미포함):
//   - Multi-select column type 도입 ("tag1, tag2" → string[]) — 모든 view 영향
//   - Attachment URL 필드 → 별 컬럼 타입

import type { ColumnType, TicketStatus } from "@/types/flowbase"

export type ImportSource = "notion" | "airtable" | "generic"

// ─── Status value 매핑 — 다양 표현 → 한국어 enum (LOCK) ───
// status type 컬럼 import 시 cell 값에 적용. Notion/Airtable/Generic의 다양 status 표현 흡수.
// LOCK 키 4개: 미처리 · 진행중 · 대기 · 완료
//
// regex 룰 (case-insensitive):
//   - 완료: done · complete · finish · closed · cancel (cancelled 종료 의미로 완료에 매핑)
//   - 진행중: progress · 진행 · doing · active · wip
//   - 대기: wait · 대기 · hold · block · review (in review) · paus (pause/paused)
//   - 미처리 (fallback): todo · backlog · new · open · not started · planned 등
export function mapStatus(v: string): TicketStatus {
  const m = v.toLowerCase()
  if (/done|완료|complete|finish|closed|cancel/.test(m)) return "완료"
  if (/progress|진행|doing|active|wip/.test(m)) return "진행중"
  if (/wait|대기|hold|block|review|paus/.test(m)) return "대기"
  return "미처리"
}

// Notion export의 시스템 헤더 (lowercase 't' 특징)
const NOTION_HEADER_MAP: Record<string, string> = {
  "Created time": "Created at",
  "Last edited time": "Updated at",
  "Last edited by": "Edited by",
  "Created by": "Created by",
}

// Airtable export의 시스템 헤더 (titlecase 'T' 특징)
const AIRTABLE_HEADER_MAP: Record<string, string> = {
  "Created Time": "Created at",
  "Last Modified Time": "Updated at",
  "Last Modified By": "Modified by",
  "Created By": "Created by",
}

// detect markers — 1개라도 매칭되면 source 확정
const NOTION_MARKERS = [
  "Created time",
  "Last edited time",
  "Last edited by",
]
const AIRTABLE_MARKERS = [
  "Created Time",
  "Last Modified Time",
  "Last Modified By",
]

export function detectImportSource(headers: ReadonlyArray<string>): ImportSource {
  const set = new Set(headers)
  if (NOTION_MARKERS.some((m) => set.has(m))) return "notion"
  if (AIRTABLE_MARKERS.some((m) => set.has(m))) return "airtable"
  return "generic"
}

// source-aware header normalize. 매칭 ❌면 원본 유지.
export function normalizeImportHeaders(
  headers: ReadonlyArray<string>,
  source: ImportSource,
): string[] {
  if (source === "notion") {
    return headers.map((h) => NOTION_HEADER_MAP[h] ?? h)
  }
  if (source === "airtable") {
    return headers.map((h) => AIRTABLE_HEADER_MAP[h] ?? h)
  }
  return [...headers]
}

export const IMPORT_SOURCE_LABELS: Record<ImportSource, string> = {
  notion: "Notion",
  airtable: "Airtable",
  generic: "Generic CSV",
}

// ─── Header-based column type 추론 ───
// Notion/Airtable의 잘 알려진 헤더는 sample value 검사 전에 type 확정 가능.
// 예: "Status" 헤더 + 셀 값 "Done" — sample inferType은 single distinct → "text" 추론하지만,
// 우리는 "Status" 헤더면 무조건 status type.
//
// 룰 우선순위:
//   1. 정확 매치 (case-insensitive) — 알려진 헤더는 즉시 매핑
//   2. 키워드 포함 — 일반 변형 흡수 ("Due date" / "Start date" 등 모두 date)
//   3. null 반환 — caller가 sample inferType으로 fallback

const HEADER_TYPE_EXACT: Record<string, ColumnType> = {
  // date 류
  "created at": "date",
  "created time": "date",
  "updated at": "date",
  "last edited time": "date",
  "last modified time": "date",
  "due date": "date",
  "start date": "date",
  "end date": "date",
  // status
  "status": "status",
  "state": "status",
  "stage": "status",
  "progress": "status",
  // avatar (사람)
  "person": "avatar",
  "assignee": "avatar",
  "assigned to": "avatar",
  "owner": "avatar",
  "created by": "avatar",
  "edited by": "avatar",
  "modified by": "avatar",
  "author": "avatar",
  // num
  "count": "num",
  "amount": "num",
  "price": "num",
  "score": "num",
  // email
  "email": "email",
  "e-mail": "email",
}

// 키워드 포함 패턴 — 정확 매치 ❌면 substring 검사
const HEADER_TYPE_KEYWORDS: { keywords: string[]; type: ColumnType }[] = [
  { keywords: ["date"], type: "date" },
  { keywords: ["time"], type: "date" },
  { keywords: ["status", "state"], type: "status" },
  { keywords: ["email", "e-mail"], type: "email" },
  { keywords: ["assignee", "owner", "person", "author"], type: "avatar" },
]

export function inferColumnTypeByHeader(header: string): ColumnType | null {
  const norm = header.trim().toLowerCase()
  if (!norm) return null
  const exact = HEADER_TYPE_EXACT[norm]
  if (exact) return exact
  for (const rule of HEADER_TYPE_KEYWORDS) {
    if (rule.keywords.some((k) => norm.includes(k))) return rule.type
  }
  return null
}
