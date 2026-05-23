# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-05-24 (kkh94 머신, P1 시급 6건 완료 — 컬럼/Trash/Settings/시드/Schema/Automations/Wiki)

---

## 한 줄 요약

**P1 시급 6건 모두 완료 — 컬럼 CRUD · Trash/Settings 실작동 · 시드 영어화 · Schema ER · Automations 토글 · Wiki 편집. 다음은 깊이 (자동화 엔진 · 추가 뷰 · 컬럼 메뉴 확장).**

---

## ✅ 머지 완료

- 최신: `bf02ebb` Wiki edit · `4969e50` Automations · `7694d76` Schema ER · `a7a1c77` 시드 · `a4935af` Trash/Settings · `d911c06` 컬럼.
- 다른 머신: `git fetch && git checkout main && git pull && npm install`.

---

## 🎯 다음 작업 — 깊이 (사용자 명시 후순위 외)

### 우선순위 높음
1. **Automations 실제 트리거 엔진** — `lib/automation-runtime.ts` 신규. zustand subscribe로 row 변경 감지 → rule When 평가 → Then 실행. 우선 "row added" 트리거 + "Set value" / "Notify(log)" 두 액션 지원.
2. **컬럼 헤더 확장 메뉴**: Promote to Library · Attach function · Change type 인플레이스.
3. **Gallery view** (`design-ref/prototype/view-grid.jsx`) — 첨부 컬럼 없으면 metadata 그리드.
4. **Timeline view** (`design-ref/prototype/view-timeline.jsx`) — 일정 컬럼 있을 때 Gantt/캘린더.

### 우선순위 중간
5. **Dashboard builder** — Line/Area/Stacked 추가 + "+ Add chart" 카탈로그.
6. **다중 필드 Filter 팝오버** — 현재 status chips만. Theme/Sentiment/Priority 필터.
7. **Bulk edit** (선택 행 값 일괄 설정) — 현재 Delete만.
8. **우클릭 컨텍스트 메뉴** — 행 메뉴 (`design-ref/prototype/context-menu.jsx`).
9. **Schema 깊이**: pan/zoom · drag reposition · "New table from template" 모달.
10. **Wiki 깊이**: 새 페이지 생성 · 사이드바 검색 활성화 · live preview.

### 우선순위 낮음
11. **Ask AI ⌘J 톱바 버튼** — composer는 AI 패널 안에만.
12. **Trash 깊이**: 행 단위 deletedRows · 30일 자동 만료.
13. **Settings 깊이**: 멤버/권한 탭 · 테마 프리셋 · 데이터 export.

### B4 (가장 마지막, 사용자 명시)
- 컬럼 ↔ Library 자산 링크 · "Use in table" 흐름 · 템플릿으로 보드 생성.

---

## ✅ 이번 세션 완료 (P1 시급 6건 = 2 배치)

### 시급 #1 — 컬럼 / Trash · Settings / 시드
- 컬럼 CRUD (`d911c06`): addColumn/deleteColumn/renameColumn/updateColumn + "+" 드롭다운 + 헤더 "..." 메뉴.
- Trash · Settings (`a4935af`): TrashedBoard·WorkspaceSettings 타입 · 4 신규 액션 · 2 다이얼로그 · settings로 워크스페이스 라벨 동기화.
- 시드 영어화 (`a7a1c77`): Library/Workspace/Interviews 한국어 자산명·옵션·quote 모두 영어. Status 키 LOCK 보존.

### 시급 #2 — Schema / Automations / Wiki
- Schema ER (`7694d76`): positioned 박스 + bezier 엣지 + 3 sub-tab.
- Automations 동작 (`4969e50`): toggle/delete/test-run/accept/dismiss + 다이얼로그.
- Wiki 편집 (`bf02ebb`): Edit 토글 + textarea + Save/Cancel.

---

## 코드/디자인 컨벤션 (LOCK)

- **Status 키 LOCK 한국어 + `STATUS_LABELS` 맵으로 디스플레이만 영어**.
- **`selectAsset(category, id)` 원자 액션** — Library cross-category 클릭.
- **셸 푸터 status bar 영구** — Trash/Settings는 패널 ❌.
- **컬럼 변경 = undo 비대상** — UI에서 명시(AlertDialog 메시지).
- **deleteBoard는 trashedBoards로 이동** — 진짜 삭제는 permanentDeleteBoard만.
- **acceptSuggestion = draft 상태 룰** — 자동 active ❌ ("AI 추천 + 사람 확정").
- **테스트 셀렉터 속성** — `data-asset-id`, `data-panel-id`, `data-workspace-item`, `data-page-id`, `data-search-tab`, `data-search-item-id`, `data-action`, `data-column-menu`, `data-trashed-board`, `data-er-card`, `data-schema-sub`, `data-automation-id`, `data-automation-menu`, `data-suggestion-id`, `data-wiki-edit-toggle`, `data-wiki-editor`, `data-wiki-save`.
- **시드 추가 시 store version bump + migrate** — v4→v5(Tasks), v5→v6(Wiki), v6→v7(Trash/Settings).
- **외부 lib 도입 신중** — Wiki 마크다운/Search/ER 다이어그램 모두 의존성 0.
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
