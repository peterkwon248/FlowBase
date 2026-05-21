# FlowBase V2 — Phase 6 (멀티 보드 + Schema 뷰) Design

> 작성: 2026-05-21 · Phase: PDCA Design
> Plan: [flowbase-v2.plan.md §8 Phase 6](../../01-plan/features/flowbase-v2.plan.md)
> 정본: `design-ref/prototype/{prototype-shell.jsx InteractiveSidebar, schema-er.jsx}` + `handoff/COMPONENT-MAP.md §2`
> 선행: Phase 1~5 완료 (`feat/kanban-dashboard`, 미커밋)
> 🚦 **구현 전 검토 게이트 대상** — §7 결정/Q 확인 후 코드 착수.

## 0. 배경

스토어는 Phase 1A부터 `boards: Record<string, Board>` 멀티 보드 구조 + `switchBoard`/`createBoard`/`deleteBoard`. Phase 5 사이드바가 보드 목록 + 전환 + "새 보드"까지 했다. Phase 6은 **보드 rename/delete**를 더해 사이드바를 완성하고, 보드들의 컬럼 구조를 보는 **Schema 뷰**를 추가한다. 7단계 중 마지막 기능 Phase (Phase 7 = BaaS).

## 1. 범위

**In**
- ✅ 스토어 `renameBoard(id, label)` 추가 (`deleteBoard`는 Phase 1A 존재)
- ✅ 사이드바 보드 행 `…` 메뉴 — rename(인라인) / delete(확인)
- ✅ `components/sections/schema-view.tsx` — 보드별 컬럼 인벤토리 카드 + fk 관계 목록
- ✅ `ViewMode`에 `"schema"` 추가 + view-switcher 4번째 탭

**Out (후속)**
- ❌ ER 캔버스 — zoom/pan/드래그/bezier 연결선 (`schema-er.jsx` `ERDiagram`). MVP는 카드만
- ❌ Library 템플릿 기반 보드 생성 (`NewTableModal` — Library는 plan §5 비목표)
- ❌ 컬럼 추가/삭제/타입변경 UI (별도 Phase)
- ❌ 옛 코드 대량 삭제 (`app-sidebar.tsx`·`sections/*`·`app/{trash,workspaces}`·`mock-*`) — Q2

## 2. 멀티 보드 — 스토어 + 사이드바

### 2.1 스토어 (`lib/flowbase-store.ts`)
- **`renameBoard(boardId, label)`** 추가 — `boards[id].label` 갱신 + `updatedAt`. persist 대상.
- `deleteBoard` (Phase 1A) — 마지막 보드는 삭제 불가(이미 가드). 활성 보드 삭제 시 다른 보드로 전환(이미 처리).
- 멀티보드 데이터 격리(`boards` Record, 보드별 rows/columns/aiHistory)는 Phase 1A 완비 — UI만 추가 (plan §8).

### 2.2 사이드바 (`board-sidebar.tsx` 확장)
- 보드 행 hover 시 우측에 `…` 버튼 → shadcn `DropdownMenu`.
  - **이름 변경** — 행 라벨을 인라인 `<input>`으로 전환(Q1), Enter 확정 / Esc 취소 → `renameBoard`.
  - **삭제** — 확인 후 `deleteBoard`. 보드 1개면 메뉴 항목 비활성(Q3).
- "새 보드"·전환은 Phase 5 그대로.

## 3. Schema 뷰 — `schema-view.tsx`

출처: `schema-er.jsx` `FieldsInventory` (ER 캔버스가 아닌 **카드 인벤토리** 패턴 — D4).

- **워크스페이스 레벨** — active board 무관, 스토어 `boards` 전체를 렌더 (D3).
- **보드 카드** — 보드마다 카드 1개: 헤더(색 dot `colorVar` + 라벨 + 컬럼 수) + 컬럼 행 목록.
  - 컬럼 행 = 타입 아이콘(`TYPE_ICON`, header-cell 재사용) + `name`(mono) + 타입 칩. `id`는 PK 칩, `type:"fk"`는 FK 칩.
- **관계 섹션** — `type:"fk"` 컬럼을 모아 `{from 보드} → {col.fk 대상 보드}` 목록. fk 컬럼 없으면 "관계 없음" 안내 (시드 보드는 fk 없음).
- 레이아웃 — `grid` auto-fill 카드. minimalist dense.

## 4. 뷰 진입 — view-switcher 4번째 탭

- `types/flowbase.ts` `ViewMode`에 `"schema"` 추가 (기존 주석 "schema는 뷰 아님"은 D3로 번복).
- `view-switcher.tsx` — Sheet | Kanban | Dashboard | **Schema** 4탭. Schema는 항상 활성(컬럼 조건 없음).
- `app/page.tsx` — `effectiveView === "schema"` → `<SchemaView/>`. SchemaView는 active board 무관 전 보드 렌더.

## 5. LOCK·가드

- 데이터 모델 = 제네릭. Schema 카드는 board `columns` 그대로 — 하드코딩 ❌.
- status 색 — Schema는 status 미사용. Phosphor/lucide · Geist · minimalist dense.
- 보드 변경(`renameBoard`/`deleteBoard`)은 persist. rows 변경 아님 — undo 스택 대상 ❌ (보드 메타).
- framer-motion ❌.

## 6. 마일스톤

- **6A — 멀티 보드**: 스토어 `renameBoard` · 사이드바 `…` 메뉴(rename 인라인 + delete).
- **6B — Schema 뷰**: `ViewMode` 확장 · `schema-view.tsx` · view-switcher 4탭 · page 분기.

## 7. 결정 기록 / 미결 질문

| # | 결정 |
|---|---|
| D1 | 스토어에 `renameBoard` 추가. 멀티보드 구조·`deleteBoard`는 Phase 1A 그대로. |
| D2 | 보드 rename/delete는 사이드바 행 `…` DropdownMenu. |
| D3 | **Schema = 4번째 뷰 탭** (`ViewMode += "schema"`). Phase 1의 "schema ≠ view" 노트를 MVP 단순화 위해 번복 — SchemaView는 active board 무관 워크스페이스(전 보드) 렌더. 별도 라우트/앱 모드 도입 ❌. |
| D4 | Schema 뷰 = 보드별 컬럼 인벤토리 카드 (`FieldsInventory` 패턴). ER 캔버스(zoom/pan/bezier)는 후속. |
| **Q1** | 보드 rename UX — (a) 사이드바 행 인라인 편집(권장) / (b) 별도 다이얼로그. 권장 **(a)**. |
| **Q2** | 옛 V2-미사용 코드(`app-sidebar.tsx`·`components/sections/{data,design,operations,settings,trash,workspaces}-section.tsx`·`app/trash`·`app/workspaces`·`lib/mock-*`) 정리 — (a) Phase 6에서 일괄 삭제 / (b) **별건 정리 작업으로 분리**. `lib/tokens.ts`가 `lib/mock-data.ts`의 타입(`Tone`/`ChartColor`)에 의존하는 등 얽혀 있어 신중. 권장 **(b)**. |
| **Q3** | `viewByBoardId`에 `"schema"`가 보드별로 저장됨(보드 전환 시 기억) — MVP에선 수용. 보드 1개일 때 delete 메뉴 비활성. 이의 시 조정. |

## 8. 다음 행동

1. 🚦 **검토 게이트** — 본 문서 + §7(Q1·Q2) 사용자 검토.
2. Phase 6A — 스토어 `renameBoard` → 사이드바 `…` 메뉴.
3. Phase 6B — `ViewMode` 확장 → `schema-view.tsx` → view-switcher → page 분기.
