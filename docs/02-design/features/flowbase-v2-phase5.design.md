# FlowBase V2 — Phase 5 (앱 셸 완성 + 키보드 단축키) Design

> 작성: 2026-05-21 · Phase: PDCA Design
> Plan: [flowbase-v2.plan.md §8 Phase 5](../../01-plan/features/flowbase-v2.plan.md)
> 정본: `design-ref/prototype/{prototype-shell.jsx, prototype-app.jsx, library-view.jsx}` + `handoff/COMPONENT-MAP.md §2`
> 선행: Phase 1~4 완료 (`feat/kanban-dashboard`, 미커밋)
> 🚦 **구현 전 검토 게이트 대상** — §10 결정/Q 확인 후 코드 착수.

## 0. 배경

지금 셸은 `헤더 + [보드 영역 | AI 패널]`뿐 — 좌측 레일이 없고 패널을 닫을 수 없다. Phase 5는 **Activity bar + Sidebar**를 좌측에 붙이고, 3개 패널(activityBar·sidebar·aiPanel)을 햄버거 메뉴·키보드·엣지 chevron으로 토글 가능하게 한다. 스토어 `panels` 상태 + `togglePanel`/`showAllPanels`/`hideAllPanels` + persist는 **Phase 1A에서 이미 완비** → Phase 5는 UI만.

## 1. 범위

**In**
- ✅ `components/board/activity-bar.tsx` — 44px 좌측 레일 (로고 + 최소 nav)
- ✅ `components/board/board-sidebar.tsx` — 보드 패널 (BOARDS 목록 + New/Import)
- ✅ `components/board/panels-menu.tsx` — 햄버거 드롭다운 (3 패널 토글 + Show/Hide all)
- ✅ `components/board/edge-collapse.tsx` · `expand-tab.tsx` — 패널 엣지 닫기 chevron + 재오픈 탭
- ✅ `components/board/filter-chips.tsx` — status 필터 chip 줄
- ✅ `components/board/board-header.tsx` — 헤더 추출 (햄버거 포함)
- ✅ `lib/keyboard-shortcuts.ts` 확장 — ⌘⇧A · ⌘⇧F · ⌘B · ⌘N
- ✅ `app/page.tsx` — 셸 레이아웃 (activity bar + sidebar 슬롯 + 패널 조건부 렌더)

**Out (후속)**
- ❌ 보드 rename/delete, Schema 뷰 (Phase 6 — 멀티 보드)
- ❌ Inbox/Library/Wiki 모드 (plan §5 비목표 — Activity bar는 장식 nav만)
- ❌ Detail bar(4번째 패널) — V2 `PanelState`는 3개만, 도입 ❌
- ❌ 모바일 전용 레이아웃 (데스크톱 우선 — D6)

## 2. 셸 레이아웃 — `app/page.tsx`

```
flex min-h-[100dvh] flex-col
 ├─ <BoardHeader/>  (h-12 — 햄버거 + breadcrumb + 검색 + 테마)
 └─ flex flex-1 min-h-0
     ├─ {panels.activityBar && <ActivityBar/>}     44px
     ├─ {panels.sidebar && <BoardSidebar/>}        240px
     ├─ flex-1  보드 영역 (타이틀 블록 + 뷰)
     │   └─ 닫힌 패널 있으면 <ExpandTab/> floating
     └─ {panels.aiPanel && <AiActivityPanel/>}     340px
```

- 각 패널 우/좌 엣지에 `<EdgeCollapse/>` chevron — 클릭 시 해당 패널 `togglePanel`.
- 패널이 닫혀 있으면 보드 영역 가장자리에 `<ExpandTab/>` (재오픈 floating 탭).
- `AiActivityPanel`은 현재 항상 렌더 → `{panels.aiPanel && …}`로 변경.

## 3. Activity bar — `activity-bar.tsx`

출처: `library-view.jsx` `InteractiveActivityBar`. **V2 MVP는 최소** (D2):
- 44px 폭, 로고 "F" + Tables 아이콘(활성·단일) + 하단 Settings 플레이스홀더.
- 프로토타입의 Inbox/Workspace/Library/Wiki 모드는 범위 밖 — 넣지 않음.
- `panels.activityBar`로 토글.

## 4. Board sidebar — `board-sidebar.tsx`

출처: `prototype-shell.jsx` `InteractiveSidebar`. 240px 폭.
- 헤더: 워크스페이스 라벨 ("peter's workspace").
- 액션: "New board" + "Import data" 버튼 (Import는 Phase 3 `ImportDialog` 오픈).
- **BOARDS 목록**: 스토어 `boards` 나열, 클릭 → `switchBoard` (전환만 — D3). 활성 보드 강조 (좌측 primary 바 + 색 dot `colorVar`).
- 보드 rename/delete는 Phase 6. Pinned views·용량 표시는 장식/생략.
- `panels.sidebar`로 토글.

## 5. Panels menu — `panels-menu.tsx`

출처: `prototype-shell.jsx` `PanelsMenu`. `BoardHeader` 좌측 햄버거 버튼.
- shadcn `DropdownMenu` — 3행(Activity bar ⌘⇧A · Sidebar ⌘⇧F · AI panel ⌘B) 체크 토글 + 구분선 + "Show all panels" / "Hide all panels".
- 각 행: 패널 미니 글리프 + 라벨 + kbd 힌트 + 체크.

## 6. Edge collapse / Expand tab

출처: `prototype-shell.jsx` `EdgeCollapse`·`ExpandTab`.
- `EdgeCollapse` — 패널 엣지(16×28 chevron), 클릭 → `togglePanel`. sidebar 우엣지·aiPanel 좌엣지.
- `ExpandTab` — 패널 닫힘 시 보드 영역 가장자리 floating 탭, 클릭 → 다시 토글. aiPanel 탭엔 pending 카운트 배지(선택).

## 7. Filter chips — `filter-chips.tsx`

출처: `prototype-shell.jsx` `FilterChips`. status 4종 chip + Clear.
- 스토어 `filter: TicketStatus[]` + `setFilter`. chip = status 아이콘 + 라벨 + 카운트, LOCK 색.
- 위치: 타이틀 블록 줄 (뷰 스위처 옆 또는 아래, Q2).
- status 컬럼 없는 보드 → 미표시.

## 8. 키보드 단축키 — `lib/keyboard-shortcuts.ts` 확장

기존 ⌘Z/⌘⇧Z/Delete에 추가 (출처 `prototype-app.jsx` 1005~1013):

| 키 | 동작 |
|---|---|
| ⌘⇧A | `togglePanel("activityBar")` |
| ⌘⇧F | `togglePanel("sidebar")` |
| ⌘B | `togglePanel("aiPanel")` |
| ⌘N | `addRow()` (active board에 새 행) |

- 입력 필드 포커스 중엔 무시 (기존 가드 재사용). ⌘N은 시트 외 뷰에서도 행 추가.

## 9. LOCK·가드

- status 색 — filter-chips는 `statusColorClass`/`statusBgClass`.
- Phosphor(status) · lucide(일반) · Geist. minimalist dense.
- framer-motion ❌ — 패널 열고닫음은 즉시 토글(또는 CSS width transition 정도만).
- 패널 상태는 스토어 persist (Phase 1A `partialize`에 `panels` 포함 — 새로고침 유지).
- 데이터 변경 ❌ (셸 작업 — 단 ⌘N은 `addRow`).

## 10. 결정 기록 / 미결 질문

| # | 결정 |
|---|---|
| D1 | 패널 상태(`panels`·토글 액션·persist)는 Phase 1A 스토어 그대로 — Phase 5는 UI만. |
| D2 | Activity bar는 최소 장식 레일 (로고 + Tables + Settings). Inbox/Library/Wiki 모드 ❌ (범위 밖). |
| D3 | Phase 5 Sidebar의 BOARDS 목록은 **전환(`switchBoard`)만**. rename/delete/Schema는 Phase 6. |
| D4 | 키보드 ⌘⇧A·⌘⇧F·⌘B·⌘N — `keyboard-shortcuts.ts` 확장. |
| D5 | 헤더를 `board-header.tsx`로 추출 (현재 `page.tsx` 인라인 → 컴포넌트화, 햄버거 포함). |
| D6 | 데스크톱 우선. 모바일 전용 레이아웃·자동 패널 닫기는 후속. |
| **Q1** | Activity bar — (a) 최소 레일 포함(권장, store에 `activityBar` 있음) / (b) Phase 5는 sidebar+aiPanel 2패널만, activity bar는 Phase 6+. 권장 **(a)**. |
| **Q2** | filter-chips 위치 — (a) 타이틀 블록 줄에 인라인 / (b) 타이틀 아래 별도 줄. 권장 **(a)** (dense). |
| **Q3** | 옛 `components/app-sidebar.tsx`(PR #4, V2 미사용) — Phase 5에서 삭제할지. 권장: 옛 `sections/*`와 함께 Phase 6에서 일괄 정리 (Phase 5는 신규만). |

## 11. 마일스톤

- **5A — 패널 셸**: `activity-bar` · `board-sidebar` · `board-header`(햄버거) · `app/page.tsx` 레이아웃 + 조건부 렌더.
- **5B — 토글 UX + 단축키**: `panels-menu` · `edge-collapse` · `expand-tab` · `filter-chips` · `keyboard-shortcuts` 확장.

## 12. 다음 행동

1. 🚦 **검토 게이트** — 본 문서 + §10(Q1·Q2·Q3) 사용자 검토.
2. Phase 5A — 셸 레이아웃.
3. Phase 5B — 토글 UX + 단축키.
