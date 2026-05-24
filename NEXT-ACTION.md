# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-05-24 (kkh94 머신, 폴리시 + 통합 인프라 commit `49a1767`)

---

## 한 줄 요약

**컬럼 리사이즈 + 레이아웃 spill fix + pill 일괄 + 스마트 메모리 + EventStore 통합(A·C·D·E·F1) 완료. 다음: 토론 backlog A 그룹(스마트 메모리 Phase 1B · Sheet groupBy · Library 자산 개별 적용 UI) 또는 잔여 폴리시.**

---

## ✅ 머지 완료

- `origin/main = 49a1767` (이번 세션 push 후 머지).
- 다른 머신: `git fetch && git checkout main && git pull && npm install`.

---

## 🎯 다음 작업

### 우선순위 높음
1. **AI_CLASSIFY 자동 실행** — ⚠ **사용자 명시 룰**: 사용자가 직접 요청할 때만 시작. 메모리 `feedback-ai-classify-user-triggered-only.md` 참조. Claude 자율 진행 ❌.

### 우선순위 중간
2. ~~**다른 pill 일괄 점검**~~ ✅ 완료 (`49a1767` — 11 곳)
3. **남은 mutation enforcement** — #8에서 핵심 14개만. 나머지(commitAiCell/dismissAiCell/promote/attach/updateSettings/addMember/removeMember/automation 액션/setSchemaPosition 등 30+) viewer 가드.
4. **UI 단 viewer disable** — button disabled / readonly 표시 (현재는 시도 시 toast만).
5. **Theme accent oklch 시각 튜닝** — light/dark 4 accent 브라우저 검증 후.
6. **Data Import skip summary** — id 충돌 skip된 항목 카운트 표시.

### 우선순위 낮음
6. **Filter And/Or multi-condition per column** — 현재 in/range/date-range 각 단일. ≥/≤/contains 등 추가.
7. **Gallery/Timeline 커스터마이즈 후속** — 카드 컬럼 reorder · Gantt 주 단위 group · zoom.
8. **Schema pinch-zoom 트랙패드** + 멀티 테이블 → N개 보드.
9. **MATCH_FROM_DROPDOWN sourceField 명시 선택**.
10. **Chart toolbar 터치 UX** — group-hover 한계.
11. **Wiki body diff/version history**.
12. **firedKeys cleanup runtime ref sync** — permanentDeleteBoard 후 즉시 ref reset (현재 다음 1분 tick).

### B4 (가장 마지막, 사용자 명시)
- 컬럼 ↔ Library 자산 링크 → Promote/Attach 일부 진행. 남은 건 "Use in table" (Library asset에서 시작).

---

## 🧠 깊은 토론 backlog (2026-05-24 세션)

> 6 토픽 + 스마트 메모리 2 phase. 자세한 차원 분석·코드 설계는 SESSION-LOG 같은 날 entry 참조.

### A 그룹 (즉시 가치 + 작은 effort)

- ~~**A1. 스마트 메모리 — Phase 1 (workspace vocabulary)**~~ ✅ 완료 (`49a1767`)
  - workspaceMemory store + learnFromPatch + scope=`{colName}::{libraryFieldId}` 격리 + 30일+50개 cap
  - Cell editor select popover "Recent" 섹션 + "+" promote 버튼 (F1)
  - **남은 Phase 1B**: text cell autocomplete (input + suggestion list UI)
  - **남은 F2**: col.libraryFieldId 있으면 Library OptionList에도 sync (cross-board promote)

- **A2. Sheet groupBy + 다중 sort (Linear식 Display 핵심)**
  - 현재: Kanban만 groupBy, sort는 단일 키. Sheet는 groupBy ❌
  - Sheet view에 status/select 컬럼 기준 group header (Linear 패턴)
  - Sort: 다중 키 (`[{key, dir}, ...]`) — priority desc, dueDate asc 같은 preset
  - 가치 ↑ (보드 깊게 쓰는 사용자에 큰 효과). 효용 ⭕

- **A3. Library 자산 개별 적용 UI (insight 핵심)**
  - 현재: Library 자산은 template 일괄 적용만. 개별 surface에서 명시 선택 ❌
  - 컬럼 헤더 메뉴: "Use OptionList from Library" (type=select/status에 옵션 묶음 교체)
  - 컬럼 추가 메뉴: "Add from Library Field" (단일 필드 import, 현재 template만)
  - Filter value 드롭다운: OptionList 명시 선택
  - 핵심: 사용자 insight = OptionList/Field = building block, 활용 surface에서 명시 선택 UI 부족

### B 그룹 (큰 변화, 별도 phase)

- **B1. 스마트 메모리 — Phase 2 (확장)** — A1 ✅ 완료, 이어서 가능
  - `recentFilters` + `recentSorts` snapshot store
  - Filter UI에 "Recent" 탭, Filter 자체에 "Recent filters" 메뉴
  - **Library promote bridge toast** — frequency 5+ 도달 시 "‘Q1 goal’ 5번 사용 → Save as option" 권유 (명시 click 시만 Library 등록)
  - 컬럼 추가 시 cross-board type 자동 제안

- **B3. EventStore Phase F2/B (후속)** — A·C·D·E·F1 ✅ 완료
  - F2: col.libraryFieldId 있을 때 Library OptionList에 sync (현재는 col.options 인라인만)
  - B: AppShell mount 시 events 만료 cleanup hook (현재는 appendEvent에서 처리 — nice-to-have)
  - aiHistory deprecation (현재 호환 유지, 향후 events derived 전환)

- **B2. Event/Comment/Thread/Snooze (협업 enabler)**
  - 현재 `ChangeEvent`(publishChange) 확장:
    ```ts
    type Event =
      | { kind: "row_added"|"row_updated", ... }  // 이미 있음
      | { kind: "comment_added", row, threadId, body, author }
      | { kind: "snooze", item, untilTs, by }
      | { kind: "mention", target, by }
    ```
  - Detail bar 하단: row comment thread + activity log
  - Inbox: 자기 mention/snoozed 항목 모음
  - Cell hover: comment 개수 badge
  - 스누즈: Inbox item ephemeral 상태 (setInterval — automation-runtime 패턴 재사용)
  - **선행 조건**: Phase 2 W11 (멤버 실 분리). 현재 멤버는 demo라 협업 layer 도입 일러요

### C 그룹 (부차적, 필요 시 nudge)

- **C1. OptionList 영역별 분리 + Saved view**
  - 이미 부분 가능 — 각 보드 status 컬럼이 다른 `optionListId` 참조 가능
  - 명시 surface 부족 — 컬럼 생성 시 "어떤 OptionList?" 선택 UI 필요 (A3에 포함)
  - **Saved view** = Linear 패턴 — Library에 새 카테고리 `views` (Filter+Display+Sort 묶어 저장). 별도 작업

- **C2. Wiki + Inbox 노티스 결합**
  - 별도 노티스 surface 만들지 않고, Wiki에 "Pin to inbox" 토글 → 모든 멤버 Inbox에 자동 알림
  - 위키 영속 + 인박스 알림 + 자동 연결. 새 surface ❌
  - **선행**: B2의 mention/Inbox 구조 정착 후

### 위험 신호 (스마트 메모리 도입 시)

1. **Cross-board 오염** — "status" 컬럼이 보드별 의미 다를 수 있음 → `libraryFieldId` 같은 경우만 공유
2. **민감 정보 누수** — password/email 패턴 자동 제외 옵션
3. **AI 학습 씨앗 충돌** — Memory를 AI 컨텍스트 활용 시 사용자 명시 룰(AI_CLASSIFY 자율 ❌)과 충돌. 명시 click 시만 OK (Phase 2+ 후속)
4. **localStorage 비대** — 30일 expire + 50개 cap 필수

---

## ✅ 이번 세션 완료 (1 commit · 큰 통합)

### `49a1767` — feat: 컬럼 리사이즈 + 레이아웃 polish + pill 일관 + EventStore + 스마트 메모리
- **UI polish** 3 — 컬럼 리사이즈(drag+autofit, viewSettings persist) · 레이아웃 spill fix(min-w-0 LOCK) · pill nowrap 일괄 11 곳
- **스마트 메모리 Phase 1** — workspaceMemory store + Cell editor select Recent 섹션 + scope 격리 + 30일/50개 cap + Recent "+" promote 버튼
- **EventStore Phase A·C·D·E·F1** — events store(90일/1000개 cap) + migrate(aiHistory 백필) + Workspace > History UI + Detail bar Activity 탭 + AI panel Timeline events derive + Recent promote bridge
- 18 파일 변경 · 1142+/71− lines

### 직전 commits (같은 날)
- `a7e91c5` fix(ui): status pill 줄바꿈 — whitespace-nowrap 3 곳
- `1cb045e` 폴리시 #9: Filter contains · Gallery cardFields ↑↓ reorder · Timeline month scale
- `951e82e` 폴리시 #8: Members enforcement 14 mutation · firedKeys dueDate cleanup · Data Import 메타 확장
- `568526d` 폴리시 #7: Filter cascade hover · legacy 제거 · firedKeys persist · Theme accent · Data Import 기본 · Members 깊이 minimum
- `a818f82` 깊이 #6: Timeline Gantt · Filter 2-step · Display 옵션 · Chart reorder · Library 점프

---

## 코드/디자인 컨벤션 (LOCK + 추가)

- **Status 키 LOCK 한국어 + `STATUS_LABELS` 맵 영어**.
- **`selectAsset(category, id)` 원자 액션**.
- ~~셸 푸터 status bar 영구~~ → **Trash/Settings/Storage는 BoardHeader 우측** (2026-05-24 사용자 요청, `d263373`). StatusBar 컴포넌트 폐기.
- **모든 navigation 모드는 사이드바** — Tables/Library/Wiki/Workspace/Inbox. Search 예외.
- **사이드바 너비 240px 통일**.
- **컬럼 변경 = undo 비대상**.
- **deleteBoard → trashedBoards · deleteRows → trashedRows · deleteWikiPage → trashedWikiPages · 30일 만료**.
- **acceptSuggestion = draft 상태**.
- **publishChange in store actions** + handledRef.
- **columnFilters와 filter 병존**.
- **Gallery/Timeline은 RowContextMenu 공유**.
- **Change type은 행 데이터 보존**.
- **schemaPositions persist**.
- **promoteColumnToLibraryField idempotent**.
- **Automation log는 active board만 push**.
- **Dashboard board.charts 비어 있으면 auto-derive 폴백**.
- **시간 트리거 firedKeys = localStorage persist** (30일 cleanup) — 페이지 새로고침 후에도 dedupe.
- **Attached function 실행 = rule scan 전** — auto-fill이 룰 트리거 가능.
- **MATCH_FROM_DROPDOWN sourceField = 첫 text/select 컬럼** (휴리스틱).
- **외부 lib 도입 신중** — 모든 chart(SVG/div), Wiki 마크다운, Search, ER, Filter, Context 의존성 0 또는 기존 Radix.
- **시드 추가 시 store version bump + migrate** — v4→v5(Tasks), v5→v6(Wiki), v6→v7(Trash/Settings), v7→v8(schemaPositions), v8→v9(trashedRows), v9→v10(trashedWikiPages), v10→v11(settings.members), v11→v12(viewSettings), v12→v13(settings.currentUserId).
- **NavStack ephemeral**.
- **Owner 보호 이중 단** — Settings Members UI 단(비노출) + store 액션 단(filter).
- **AppShell mount = `hasHydrated` 체크 후 cleanup** — zustand persist hydrate race 회피.
- **status pill / pill 류 = `whitespace-nowrap` 강제** — 좁은 cell에서 wrap 방지. 모든 status/priority/badge pill에 일관 적용. **flex-wrap 컨테이너 안이어도 *개별 pill 자체*는 한 줄 유지** (49a1767 강화 — 11 곳 일괄).
- **flex-col 자식 컨테이너는 `min-w-0` 명시** — overflow-auto만으론 부족 (flex item min-width auto 기본값 → 자식 intrinsic이 부모 강제 부풀림). 새 view/panel 추가 시 강제. (49a1767 — 5 view + tables-mode toolbar wrap)
- **시트 컬럼 width = viewSettings.columnWidths** — ColumnDef.width fallback. 보드 spec 안 건드림. drag resize + dblclick auto-fit (column-resizer.tsx, MIN 60 / MAX 600 / autofit padding 28).
- **EventStore = single source for all action timelines** — `state.events` persist · append-only · 90일 expire · 1000개 cap. 4 곳 분산(`lastChange`/`aiHistory`/`undoStack`/`workspaceMemory`)을 통합. derived views: Workspace > History (전역) · Detail bar > Activity (row scoped) · AI panel Timeline (kind=ai_* + board scoped). 새 이벤트 추가 시 `events`에 push만으로 모든 view 자동 반영.
- **Memory ≠ Library** — `workspaceMemory`는 자동 cache (frequency view), Library는 명시 자산. **자동 promote ❌, 사용자 명시 click 시만** (Cell editor Recent "+" 버튼 → col.options 인라인 추가). Memory scope=`{colName}::{libraryFieldId}`로 cross-board 의미 충돌 격리. 30일 expire + scope당 50개 cap.
- **Ask AI 진입점 = requestAskAi 액션** — token으로 AiComposer focus 트리거.
- **Heatmap = 단일 hue + opacity intensity** — 다색 cmap ❌. var(--chart-1) opacity 0.18~1.0.
- **AI_CLASSIFY 자동 실행 = 사용자 명시 요청 시에만** — `feedback-ai-classify-user-triggered-only.md` 메모리 룰. Claude 자율 시작 ❌.
- **Filter = DropdownMenu Sub cascade hover (Linear 정확)** — 2-step inline은 Notion 패턴이라 잘못 매핑. cascade 정답.
- **DropdownMenu Sub z-stacking** — SubContent z-[60] (main z-50 위) + sideOffset 6.
- **컬럼별 hue dot** — Filter 등 type icon만으론 변별 부족할 때 chart-{1..5} 안정 매핑.
- **viewSettings 보드별 + view별 persist** (store v12) — Display 옵션 모델. permanentDeleteBoard에서 dangling key cleanup.
- **Filter columnFilters = discriminated union** (`FilterCondition`) — in/range/date-range.
- **selectVisibleRows useMemo deps = [board, search, filter, sort, columnFilters]** — 모든 view 일관.
- **zustand 셀렉터 default 패턴** — `(s) => s.foo ?? {}` ❌ 무한 루프. 모듈 스코프 상수 또는 raw 구독.
- **Chart reorder = ↑↓ 버튼** (DnD lib ❌, Kanban 카드 이동과 같은 패턴).
- **Theme accent = data-theme-accent attribute on documentElement** — 4 preset (purple/blue/emerald/amber), oklch 변종 light/dark.
- **Members role enforcement** — `roleCanEdit(role): boolean` (owner/admin/member ✅, viewer ❌). 현재 addRow만 demo 가드, 다음 폴리시에서 전체 mutation 확장.
- **Data Import = 보드만 머지** — id 충돌 시 새 id 부여 (`${originalId}-imported-${ts}`). library/wiki/automations 등은 후속.

---

## 환경 정보

| | |
|---|---|
| GitHub | https://github.com/peterkwon248/FlowBase (private) |
| 기준 브랜치 | `main` |
| 미리보기 | http://localhost:3000 (`npm run dev`) |
| 패키지 매니저 | npm · 테스트 `npm test` 또는 `npx vitest run` |
| 명령어 | `/before-work` · `/after-work` — `.claude/commands/` (git 추적) |

---

## 머신

kkh94 (`C:\Users\kkh94\OneDrive\Desktop\FlowBase`). 다음 머신: `git fetch && git checkout main && git pull && npm install`.
