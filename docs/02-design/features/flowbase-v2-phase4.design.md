# FlowBase V2 — Phase 4 (Kanban + Dashboard) Design

> 작성: 2026-05-21 · Phase: PDCA Design
> Plan: [flowbase-v2.plan.md §8 Phase 4](../../01-plan/features/flowbase-v2.plan.md)
> 정본: `design-ref/prototype/{prototype-shell.jsx KanbanView, chart-dashboard.jsx GenericDashboard, view-controls.jsx VIEW_TYPES}` + `handoff/COMPONENT-MAP.md §2`
> 선행: Phase 1~3 완료 (`main` 머지). 작업 브랜치 `feat/kanban-dashboard`
> 🚦 **구현 전 검토 게이트 대상** — §9 결정/Q 확인 후 코드 착수.

## 0. 배경

지금까지 보드는 시트 뷰 하나뿐이다. Phase 4는 **같은 데이터를 보는 두 번째·세 번째 표면** — Kanban(상태별 칸)과 Dashboard(집계 차트) — 을 추가하고, 셋을 즉시 전환하는 **뷰 스위처**를 붙인다. 스토어의 `viewByBoardId`·`setView`·`selectActiveView`는 Phase 1A에서 이미 완비됨.

## 1. 범위

**In**
- ✅ `components/board/view-switcher.tsx` — Sheet | Kanban | Dashboard 3-탭 토글
- ✅ `components/sections/kanban-view.tsx` — status 컬럼별 칸 + 카드 + 이동 버튼
- ✅ `components/sections/dashboard-view.tsx` + `components/charts/*` — 제네릭 집계 (KPI + 차트)
- ✅ `app/page.tsx` — `selectActiveView()`로 sheet/kanban/chart 분기 렌더

**Out (후속)**
- ❌ Grid(Gallery)·Timeline 뷰 (`ViewMode`엔 있으나 plan §8 Phase 4 범위 밖)
- ❌ Schema 뷰 (Phase 6)
- ❌ 드래그앤드롭 — Kanban 이동은 버튼 (D1)
- ❌ 임의 컬럼 groupBy — Kanban 그룹은 status 고정 (D5)
- ❌ "Ask AI to build a custom chart" (프로토타입 푸터 버튼 — 후속)

## 2. 뷰 전환 — `view-switcher.tsx`

- 스토어 `selectActiveView(state)` 읽고 `setView(v)` 호출. ViewMode 중 Phase 4는 `sheet`·`kanban`·`chart` 3종 ("chart"=Dashboard 라벨).
- 프로토타입 `view-controls.jsx` `VIEW_TYPES` 기준 — 세그먼티드 컨트롤(아이콘+라벨).
- **뷰 지원 판정** (D2): active board `columns` 기반.
  - Kanban — `type:"status"` 컬럼 있어야 활성. 없으면 탭 disabled + tooltip "status 컬럼 필요".
  - Dashboard — 항상 활성 (자체 빈 상태 보유, §4).
  - Sheet — 항상 활성.
- 위치: `app/page.tsx` 타이틀 블록 (현재 "rows·columns" + Import/실행취소/New row 줄). 뷰 스위처를 그 줄 좌측에 배치.

## 3. Kanban 뷰 — `kanban-view.tsx`

출처: `prototype-shell.jsx` `KanbanView`.

- **칸 4개** — `STATUS_OPTIONS` (미처리/진행중/대기/완료). 칸 헤더 = status 아이콘(Phosphor) + 라벨 + 카운트. LOCK 색 (`statusColorClass`).
- **카드** — `selectVisibleRows`(필터/검색 적용)를 status로 그룹핑. 카드 내용은 board `columns`에서 파생 (`deriveCardConfig`, D6):
  - title — 첫 `avatar`/`text` 컬럼 값 (없으면 `id`)
  - subtitle — 가장 긴 자유 텍스트 컬럼 (quote류), 2줄 clamp
  - badge — 첫 `select` 컬럼 값
  - date — 첫 `date` 컬럼 값
  - priority — `priority` 이름 컬럼 있으면 표시
- **카드 이동** — 카드 하단에 다른 status로 가는 버튼들(`→진행중` 등). 클릭 → `updateRow(rowId, { status })` (D1 — DnD ❌). `updateRow`는 undo 스냅샷 push → ⌘Z 반영 ↔ 시트.
- **선택** — 카드 체크박스 → `setSelected` (시트와 공유하는 `selectedRowIds`).
- status 컬럼 없는 보드: view-switcher가 Kanban 진입을 막으므로 빈 상태 불필요 (안전망으로 안내 1줄만).

## 4. Dashboard 뷰 — `dashboard-view.tsx` (제네릭)

출처: `chart-dashboard.jsx` `GenericDashboard` (interview 전용 `DashboardView`가 아닌 **제네릭** 패턴 — D3).

- **KPI 타일 행** — Total rows + categorical 컬럼 distinct 카운트 (최대 3).
- **categorical 컬럼별 집계** (`status`/`select`/`priority`) — 값별 카운트 → 랭킹 막대. status/priority/sentiment는 의미 색, 그 외는 chart 팔레트 해시.
- **numeric 컬럼 요약** — sum/avg/min/max.
- **hero 차트** (recharts, §5) — categorical 1번째 → Donut, 2번째 → 세로 Bar. 보드에 해당 컬럼 없으면 생략.
- **빈 상태** — categorical·numeric 컬럼 0개면 "집계할 컬럼이 없습니다" 안내 카드.
- 데이터는 `selectVisibleRows` (필터/검색 추종 — plan §8 Done "Dashboard가 filter/search 추종").

## 5. 차트 컴포넌트 — `components/charts/*`

`recharts` 2.15.0 설치됨 + `components/ui/chart.tsx`(shadcn 래퍼) 존재. COMPONENT-MAP §2는 recharts 권장.

| 파일 | 역할 | 구현 |
|---|---|---|
| `kpi-tile.tsx` | 큰 숫자 + 라벨 + delta/hint | div |
| `chart-card.tsx` | 차트 카드 래퍼 (제목 + accent dot) | div |
| `category-bar.tsx` | categorical 값별 랭킹 막대 | div (per-column 집계) |
| `donut-chart.tsx` | hero — 1번째 categorical 분포 | recharts `PieChart` |
| `bar-chart.tsx` | hero — 2번째 categorical 분포 | recharts `BarChart` |

- **혼합 전략** (Q1): per-column 집계는 div 막대(가볍고 개수 가변), hero 2개만 recharts. 프로토타입의 순수 SVG 차트는 디자인 의도 참고만 (COMPONENT-MAP §2).
- 색: `lib/tokens.ts` — status는 `statusColorClass`, 그 외 `--chart-1~5`. framer-motion ❌, recharts 기본 애니메이션은 `isAnimationActive={false}` 또는 최소.

## 6. `app/page.tsx` 뷰 라우팅

```
보드 영역 본문:
  const view = useFlowBase(selectActiveView)
  view === "sheet"  → <SheetView/>      (기존)
  view === "kanban" → <KanbanView/>
  view === "chart"  → <DashboardView/>
```
- 헤더·AI 패널·타이틀 블록은 뷰 무관 공통. 뷰 스위처는 타이틀 블록.
- 키보드 네비/복붙은 sheet 전용 — kanban/chart에선 비활성 (이미 `enabled` 플래그 존재).

## 7. LOCK·가드

- **Status 색** — Kanban 칸 헤더·Dashboard status 집계 모두 `statusColorClass`/`statusBgClass` (미처리=blue). `STATUS_TONE` ❌.
- status/priority 아이콘 = Phosphor, 일반 = lucide. Geist.
- minimalist dense — Kanban 카드/Dashboard 카드 정보 밀도 유지, 매크로 화이트스페이스 ❌.
- framer-motion ❌. recharts 애니메이션 최소. 약한 그림자/토큰만.
- Kanban 이동·Dashboard는 데이터 변경이 `updateRow` 경유 → ⌘Z 일관.

## 8. 마일스톤

- **4A — 뷰 스위처 + Kanban**: `view-switcher.tsx` · `kanban-view.tsx` · `app/page.tsx` 분기. status 이동 ↔ 시트 반영 검증.
- **4B — Dashboard**: `components/charts/*` · `dashboard-view.tsx`. 제네릭 집계 + 필터/검색 추종 검증.

## 9. 결정 기록 / 미결 질문

| # | 결정 |
|---|---|
| D1 | Kanban 카드 이동 = 이동 버튼(`→{status}`). DnD 라이브러리 도입 ❌ (프로토타입 방식, 의존성·모션 최소). |
| D2 | view-switcher는 board `columns`로 뷰 지원 판정 — Kanban은 status 컬럼 필수, 없으면 탭 disabled. |
| D3 | Dashboard = **제네릭 집계**(`GenericDashboard` 패턴). interview 전용 하드코딩 `DashboardView` 폐기 — 임포트 보드에서도 동작 (Phase 1·3 제네릭 일관). |
| D4 | 뷰 전환 상태는 Phase 1A 스토어(`viewByBoardId`·`setView`·`selectActiveView`) 그대로 — 스토어 변경 ❌. |
| D5 | Kanban 그룹 컬럼 = `status` 고정 (MVP). 임의 컬럼 groupBy는 후속. |
| D6 | Kanban 카드 표시 필드는 board `columns`에서 파생(`deriveCardConfig`) — 보드별 하드코딩 ❌. |
| **Q1** | Dashboard 차트 — (a) per-column은 div 막대 + hero 2개만 recharts (권장, 가벼움), (b) 전부 recharts, (c) 전부 div(의존성 0). 권장 **(a)**. |
| **Q2** | status 컬럼 없는 보드의 Kanban 탭 — (a) disabled + tooltip (권장), (b) 항상 보이되 빈 상태 안내. 권장 **(a)**. |
| **Q3** | Grid(Gallery)·Timeline 뷰 — Phase 4 범위 밖 확정. view-switcher는 3탭(Sheet/Kanban/Dashboard)만. 이의 시 조정. |

## 10. 다음 행동

1. 🚦 **검토 게이트** — 본 문서 + §9(Q1·Q2·Q3) 사용자 검토.
2. Phase 4A — `view-switcher` → `kanban-view` → `page.tsx` 분기.
3. Phase 4B — `components/charts/*` → `dashboard-view`.
