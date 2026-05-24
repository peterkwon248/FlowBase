# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-05-24 (kkh94 머신, 깊이 일괄 6 커밋)

---

## 한 줄 요약

**자동화 엔진이 진짜 발화 + Filter 다중 필드 + 우클릭 메뉴 + Gallery/Timeline 뷰 + Bulk edit + ⌘D + Wiki 페이지 생성/검색 모두 추가. 다음 깊이: Schema pan/zoom · Dashboard builder · 컬럼 헤더 확장.**

---

## ✅ 머지 완료 (예정)

- 6 신규 커밋 모두 main으로 (after-work 진행 중).
- 다른 머신: `git fetch && git checkout main && git pull && npm install`.

---

## 🎯 다음 작업 — 깊이 (사용자 명시 후순위 외)

### 우선순위 높음
1. **Schema pan/zoom + drag reposition + "New table from template" 모달** (`design-ref/prototype/schema-er.jsx`).
2. **Dashboard builder** — Line/Area/Stacked 차트 추가 + "+ Add chart" 카탈로그 (`design-ref/prototype/dashboard-builder.jsx`).
3. **컬럼 헤더 확장 메뉴**: Promote to Library · Attach function · Change type 인플레이스 (`design-ref/prototype/add-column.jsx`).

### 우선순위 중간
4. **자동화 시간 기반 트리거** — "every day at 09:00", "due date passes" 처리. cron-like.
5. **자동화 실행 로그** — Activity panel timeline에 trigger fire 기록.
6. **Wiki sidebar 페이지 우클릭** — Rename · Move category · Delete.
7. **Trash 깊이**: 행 단위 deletedRows · 30일 자동 만료.
8. **Settings 깊이**: 멤버/권한 탭 · 테마 프리셋 · 데이터 export.

### 우선순위 낮음
9. **Ask AI ⌘J 톱바 버튼** — composer는 AI 패널 안에만.
10. **Gallery/Timeline 커스터마이즈** — 카드 컬럼 선택 · Timeline 가로 Gantt.
11. **range/numeric/date 필터** — 현재 status/select만.

### B4 (가장 마지막, 사용자 명시)
- 컬럼 ↔ Library 자산 링크 · "Use in table" 흐름 · 템플릿으로 보드 생성.

---

## ✅ 이번 세션 완료 (깊이 일괄 6 커밋)

1. **Automations 실제 트리거 엔진** (`12a65d3`) — lastChange + AutomationRuntime + matches/executeRule. 15 신규 unit test.
2. **다중 필드 Filter 팝오버** (`bfbc3d3`) — columnFilters + FilterMenu(submenu) + ActiveFilterChips.
3. **행 우클릭 컨텍스트 메뉴** (`26a0c28`) — duplicateRow + Open detail/Duplicate/Copy ID/Delete.
4. **Gallery + Timeline 뷰** (`0bdedfd`) — view-switcher 5종 + 두 새 컴포넌트.
5. **Bulk edit + ⌘D 단축키** (`f6044e1`) — bulk-edit-menu + keyboard ⌘D.
6. **Wiki 새 페이지 + 사이드바 검색** (`44d5003`) — addWikiPage/deleteWikiPage + + 버튼 + 검색 활성.

---

## 코드/디자인 컨벤션 (LOCK + 추가)

- **Status 키 LOCK 한국어 + `STATUS_LABELS` 맵 영어 디스플레이**.
- **`selectAsset(category, id)` 원자 액션** — Library cross-category.
- **셸 푸터 status bar 영구** — Trash/Settings는 패널 ❌.
- **컬럼 변경 = undo 비대상** — UI에서 명시.
- **deleteBoard → trashedBoards** — permanentDeleteBoard만 진짜 삭제.
- **acceptSuggestion = draft 상태 룰** — 자동 active ❌.
- **publishChange in store actions** — middleware ❌. timestamp + handledRef로 useEffect 제어.
- **columnFilters와 filter는 병존** — 둘 다 selectVisibleRows에 AND.
- **Gallery/Timeline은 RowContextMenu 공유** — 시트 외 뷰도 동일 액션.
- **테스트 셀렉터 속성** — `data-asset-id`, `data-panel-id`, `data-workspace-item`, `data-page-id`, `data-search-tab`, `data-search-item-id`, `data-action`, `data-column-menu`, `data-trashed-board`, `data-er-card`, `data-schema-sub`, `data-automation-id`, `data-automation-menu`, `data-suggestion-id`, `data-wiki-edit-toggle`, `data-wiki-editor`, `data-wiki-save`, `data-row-context-trigger`, `data-filter-col`, `data-filter-value`, `data-active-filter`, `data-gallery-card`, `data-timeline-group`, `data-timeline-row`, `data-bulk-edit-col`, `data-bulk-edit-value`, `data-wiki-new-page`, `data-wiki-sidebar-search`.
- **시드 추가 시 store version bump + migrate** — v4→v5(Tasks), v5→v6(Wiki), v6→v7(Trash/Settings).
- **외부 lib 도입 신중** — Wiki 마크다운/Search/ER/Filter/Context 모두 의존성 0(또는 이미 있는 Radix).
- **NavStack는 ephemeral** — persist ❌.

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
