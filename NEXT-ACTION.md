# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-05-24 (kkh94 머신, fix #1 — status pill 줄바꿈)

---

## 한 줄 요약

**Status pill whitespace-nowrap 3 곳 fix(사용자 보고). 다음: 다른 pill 일괄 점검 · 남은 mutation enforcement · UI 단 viewer disable · Filter And/Or 본격 · 우선순위 낮음 마무리.**

---

## ✅ 머지 완료

- `origin/main = a7e91c5` (push 후 머지).
- 다른 머신: `git fetch && git checkout main && git pull && npm install`.

---

## 🎯 다음 작업

### 우선순위 높음
1. **AI_CLASSIFY 자동 실행** — ⚠ **사용자 명시 룰**: 사용자가 직접 요청할 때만 시작. 메모리 `feedback-ai-classify-user-triggered-only.md` 참조. Claude 자율 진행 ❌.

### 우선순위 중간
2. **다른 pill 일괄 점검** — priority pill / library category pill 등 wrap 가능성. status pill과 같은 nowrap 컨벤션 적용.
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

## ✅ 이번 세션 완료 (1 commit)

### `a7e91c5` — fix(ui): status pill 줄바꿈
- 사용자 보고 — Sheet "In progress" 2줄 wrap.
- 3 곳 (editable-cell·gallery-view·filter-chips)에 whitespace-nowrap 일관 적용.
- status pill = 한 줄 유지 LOCK 컨벤션 추가.

### 직전 commits (같은 날)
- `1cb045e` 폴리시 #9: Filter contains · Gallery cardFields ↑↓ reorder · Timeline month scale
- `951e82e` 폴리시 #8: Members enforcement 14 mutation · firedKeys dueDate cleanup · Data Import 메타 확장
- `568526d` 폴리시 #7: Filter cascade hover · legacy 제거 · firedKeys persist · Theme accent · Data Import 기본 · Members 깊이 minimum
- `a818f82` 깊이 #6: Timeline Gantt · Filter 2-step · Display 옵션 · Chart reorder · Library 점프

---

## 코드/디자인 컨벤션 (LOCK + 추가)

- **Status 키 LOCK 한국어 + `STATUS_LABELS` 맵 영어**.
- **`selectAsset(category, id)` 원자 액션**.
- **셸 푸터 status bar 영구**.
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
- **status pill / pill 류 = `whitespace-nowrap` 강제** — 좁은 cell에서 wrap 방지. 모든 status/priority/badge pill에 일관 적용.
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
