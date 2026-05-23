# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-05-23 (kkh94 머신, 셸 chrome 보정 + 감사 완료)

---

## 한 줄 요약

**Breadth P0 100% + 셸 chrome 보정 완료. 다음은 깊이/품질 — 가장 시급한 갭: (1) 컬럼 추가/편집 (Sheet "+"가 죽어있음), (2) Trash/Settings 실제 동작, (3) 시드 deep 영어화.**

---

## ✅ 머지 완료

- `origin/main` = `96ff20d` (셸 chrome 보정 포함).
- 다른 머신에서 이어가기: `git fetch && git checkout main && git pull && npm install`.

---

## 🎯 다음 작업 — 깊이/품질 P1

### 1. 컬럼 추가/편집 (Sheet)
**현재**: 헤더에 "+" 셀이 보이지만 클릭해도 아무 일 안 일어남. `addColumn` 액션 자체가 store에 없음.
**필요**:
- store: `addColumn(boardId, col: ColumnDef)`, `updateColumn(boardId, name, patch)`, `deleteColumn(boardId, name)`, `renameColumn`
- UI: "+" 클릭 → 드롭다운 (basic types · Library Field 선택 · Smart fill)
- 컬럼 헤더 우클릭/`...` 메뉴: Promote to Library · Delete · Attach function · Rename
- 참조: `design-ref/prototype/add-column.jsx` (`AddColumnButton`, `ColumnHeaderMenu`, `AttachFunctionPanel`, `SmartFillStep`)

### 2. Trash · Settings 실제 동작
**현재**: status-bar 클릭 시 `toast.info("... coming soon")`
**Trash**: store에 `deletedBoards` / `deletedRows` 트래킹, 30일 만료 정책. Trash 클릭 → 풀페이지 또는 모달로 복원 UI.
**Settings**: 모달. 첫 탭 = 워크스페이스 (이름·아바타·이론 storage). 향후 멤버/권한.

### 3. 시드 deep 영어화
- `flowbase-library-seed.ts` — 모델명/처리방식/사업부 카테고리 자산명 + 옵션 라벨 (M-PEN-III 같은 모델 코드는 유지, "단순변심" 같은 한국어 옵션은 영어로)
- `flowbase-workspace-seed.ts` — 룰 잔여 한국어
- `flowbase-seed.ts` (Customer Interviews) — 한국어 quote/name

---

## 📋 그 외 갭 (감사 보고서 기반)

### Sheet 영역
- **다중 필드 Filter 팝오버** (`view-controls.jsx` `FilterMenu`) — 현재 status chips만.
- **다중 키 Sort 메뉴** — 현재 헤더 클릭 단일 키.
- **Bulk edit** (선택 행 값 일괄 설정) — 현재 Delete만.
- **Save as Library template** — 컬럼 셋을 Library로 promote.
- **우클릭 컨텍스트 메뉴** — 코드 전체 `onContextMenu` 0건.

### Workspace
- **Schema ER 다이어그램** — 위치 박스 + SVG 엣지 (현재 flat grid + 텍스트 관계 리스트). `schema-er.jsx` 참고.
- **Automations 실행 엔진** — 룰 카드 렌더만, 데이터 변경 시 발화 ❌. `rule-engine.jsx` + `automation-engine.jsx` 포팅.

### Library
- **B3 인라인 편집** — rename · 옵션 색상/추가 · field config.
- **Workspace 템플릿 → 보드 생성** (`workspace-templates.jsx` `LIB_WORKSPACES`).

### Wiki
- **본문 편집 모드** — 현재 `<MarkdownBody source={...}/>` 읽기 전용. textarea + Edit 버튼 + sanitize.
- **사이드바 검색** — 현재 `<input disabled>`.

### 뷰
- **Gallery view** (`view-grid.jsx`) — 카드 그리드.
- **Timeline view** (`view-timeline.jsx`) — Gantt/캘린더.
- **Dashboard builder** — Line/Area/Stacked 차트 + "+ Add chart" 카탈로그.

### 셸
- **Ask AI ⌘J 톱바 버튼** — composer는 AI 패널 안에만.

### B4 (가장 마지막, 사용자 명시)
- 컬럼 ↔ Library 자산 링크
- "Use in table" 흐름
- 템플릿으로 보드 생성

---

## ✅ 이번 세션 추가 완료 (셸 chrome 보정 — `96ff20d`)

- **status-bar.tsx** (신규) — 셸 푸터, 모든 패널 상태 무관 always visible.
- **nav-cluster.tsx** (신규) — 시계(history) · ‹ · ›.
- store: `NavEntry` · `navStack` · `navIndex` + `goBack`/`goForward`/`jumpToNavEntry` 액션, 7개 navigation 액션이 자동 pushNav.
- 사이드바 푸터 / 액티비티 바 Settings 제거 → status bar 단일화.
- 검색창 ⌘K Kbd 힌트 + 검색창 클릭으로 팔레트 열기.
- PanelsMenu Korean → English.

---

## 코드/디자인 컨벤션 (LOCK)

- **Status 키 LOCK 한국어 + `STATUS_LABELS` 맵으로 디스플레이 영어** — `types/flowbase.ts`.
- **`selectAsset(category, id)` 원자 액션** — Library cross-category 클릭.
- **셸 푸터 status bar 영구** — Trash/Settings는 패널 ❌, status bar에 (hide-all 시에도 접근).
- **테스트 셀렉터 속성** — `data-asset-id`, `data-panel-id`, `data-workspace-item`, `data-page-id`, `data-search-tab`, `data-search-item-id`.
- **시드 추가 시 store version bump + migrate** — v4→v5(Tasks), v5→v6(Wiki).
- **외부 lib 도입 신중** — Wiki 마크다운/Search 모두 의존성 0.
- **NavStack는 ephemeral** — persist ❌, 다른 머신 history 혼란 방지.

---

## 환경 정보

| | |
|---|---|
| GitHub | https://github.com/peterkwon248/FlowBase (private) |
| 기준 브랜치 | `main` (`origin/main = 96ff20d`) |
| 미리보기 | http://localhost:3000 (`npm run dev`) |
| 패키지 매니저 | npm · 테스트 `npm test` 또는 `npx vitest run` |
| 명령어 | `/before-work` · `/after-work` — `.claude/commands/` (git 추적) |

---

## 머신

kkh94 (`C:\Users\kkh94\OneDrive\Desktop\FlowBase`). 다음 머신: `git fetch && git checkout main && git pull && npm install`.
