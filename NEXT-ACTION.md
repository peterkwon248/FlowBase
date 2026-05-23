# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-05-24 (kkh94 머신, P1 깊이 일괄 완료)

---

## 한 줄 요약

**P1 깊이 3건 일괄 완료 — 컬럼 추가/편집 · Trash/Settings 실작동 · 시드 영어화. 다음은 감사 보고서의 큰 갭 — Schema ER · Automations 엔진 · Wiki 본문 편집.**

---

## ✅ 머지 완료

- 최신 작업: `a7a1c77` (seed 영어화) → `a4935af` (Trash/Settings) → `d911c06` (컬럼).
- 다른 머신: `git fetch && git checkout main && git pull && npm install`.

---

## 🎯 다음 작업 — 감사 보고서 나머지 갭

### 우선순위 높음
1. **Schema ER 다이어그램** (`design-ref/prototype/schema-er.jsx`) — 현재 flat grid + 텍스트 관계 리스트. 위치 박스 + SVG 엣지로 교체. 드래그 ❌ 일단 정적 배치.
2. **Automations 실행 엔진** (`rule-engine.jsx` + `automation-engine.jsx`) — 룰 카드 렌더만, 실제 데이터 변경 시 발화 ❌. middleware 또는 subscribe로 row 변경 감지 → 매치되는 rule 실행. play/pause/edit/delete 버튼도.
3. **Wiki 본문 편집** — 현재 `<MarkdownBody source={...}/>` 읽기 전용. Edit 버튼 → textarea 토글. updateWikiPage 액션은 이미 있음.

### 우선순위 중간
4. **컬럼 헤더 추가 기능**: Promote to Library · Attach function · Change type 인플레이스.
5. **다중 필드 Filter 팝오버** (`view-controls.jsx` `FilterMenu`) — 현재 status chips만.
6. **Bulk edit** (선택 행 값 일괄 설정) — 현재 Delete만.
7. **Gallery view** (`view-grid.jsx`) — 카드 그리드.
8. **Timeline view** (`view-timeline.jsx`) — Gantt/캘린더.

### 우선순위 낮음
9. **Dashboard builder** — Line/Area/Stacked 차트 + "+ Add chart" 카탈로그.
10. **우클릭 컨텍스트 메뉴** — 행 메뉴 (`context-menu.jsx`).
11. **Ask AI ⌘J 톱바 버튼**.
12. **Trash 깊이**: 행 단위 deletedRows · 30일 자동 만료.
13. **Settings 깊이**: 멤버/권한 탭 · 테마 프리셋 · 데이터 export.

### B4 (가장 마지막, 사용자 명시)
- 컬럼 ↔ Library 자산 링크
- "Use in table" 흐름
- 템플릿으로 보드 생성

---

## ✅ 이번 세션 완료 (P1 깊이 일괄 — `d911c06` · `a4935af` · `a7a1c77`)

### 컬럼 추가/편집
- store: addColumn / deleteColumn / renameColumn / updateColumn.
- `add-column-menu.tsx` — Basic 7 type + Library Field 8 동적 dropdown.
- `column-header-menu.tsx` — Rename(Dialog) + Delete(AlertDialog).
- `header-cell.tsx`/`sheet-view.tsx` — 정렬 + "..." 메뉴 + "+" 셀.

### Trash · Settings
- types: TrashedBoard · WorkspaceSettings. store v6→v7.
- `deleteBoard` → trashedBoards로 push (복원 가능, 마지막 보드 보호).
- 액션: restoreBoard · permanentDeleteBoard · emptyTrash · updateSettings.
- `trash-dialog.tsx` — Restore↺ / Delete forever🗑 / Empty trash.
- `settings-dialog.tsx` — Workspace name + Initial + Storage bar.
- board-header / board-sidebar 하드코딩 → settings.workspaceLabel/Initial.

### 시드 deep 영어화
- Library: Option Lists/Fields/Templates/Functions/Dashboards 한국어 자산명·옵션·desc 모두 영어. usedIn 키 표기도 영어.
- Workspace: AUT-004/005 잔여 한국어 + SUG-002 영어화.
- Interviews: 10 시드 행 이름(transliteration: Min Jiho 등) + quote 영어.
- Status 키 LOCK 한국어 enum 유지(미처리/진행중/대기/완료).

---

## 코드/디자인 컨벤션 (LOCK)

- **Status 키 LOCK 한국어 + `STATUS_LABELS` 맵으로 디스플레이만 영어**.
- **`selectAsset(category, id)` 원자 액션** — Library cross-category 클릭.
- **셸 푸터 status bar 영구** — Trash/Settings는 패널 ❌.
- **컬럼 변경 = undo 비대상** — UI에서 명시(AlertDialog 메시지).
- **deleteBoard는 trashedBoards로 이동** — 진짜 삭제는 permanentDeleteBoard만.
- **테스트 셀렉터 속성** — `data-asset-id`, `data-panel-id`, `data-workspace-item`, `data-page-id`, `data-search-tab`, `data-search-item-id`, `data-action`, `data-column-menu`, `data-trashed-board`.
- **시드 추가 시 store version bump + migrate** — v4→v5(Tasks), v5→v6(Wiki), v6→v7(Trash/Settings).
- **외부 lib 도입 신중** — Wiki 마크다운/Search 모두 의존성 0.
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
