# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-05-24 (kkh94 머신, 깊이 일괄 #2 — Schema 인터랙션 + Dashboard 개선)

---

## 한 줄 요약

**Schema가 진짜 드래그/줌 가능. New table 모달로 보드 생성. Dashboard 영어화 + Line trend. 컬럼 Change type. 다음: Dashboard builder full · 자동화 시간 트리거 · Promote to Library.**

---

## ✅ 머지 완료 (예정)

- 8 신규 커밋 (1차 6개 + 2차 2개) 모두 main으로.
- 다른 머신: `git fetch && git checkout main && git pull && npm install`.

---

## 🎯 다음 작업

### 우선순위 높음
1. **Dashboard builder full** — 사용자가 차트 추가/제거. board별 chart config 저장. Stacked bar/heatmap 차트 추가.
2. **Automations 시간 기반 트리거** — "every day at 09:00", "due date passes" cron-like. setInterval 또는 background tick.
3. **Promote to Library** — sheet column → Library Field. column-header-menu에 추가. addLibraryField 액션 + 다이얼로그.

### 우선순위 중간
4. **Attach function** — column에 Library Function 연결. updateColumn에 functionId 필드 + 자동 실행 후크.
5. **자동화 실행 로그** — Activity panel timeline에 trigger fire 기록.
6. **Wiki sidebar 페이지 우클릭** — Rename · Move category · Delete.
7. **Trash 깊이**: 행 단위 deletedRows · 30일 자동 만료.
8. **Settings 깊이**: 멤버/권한 탭 · 테마 프리셋 · 데이터 export.

### 우선순위 낮음
9. **Ask AI ⌘J 톱바 버튼**.
10. **Schema 깊이**: pinch-zoom 트랙패드 · 멀티 테이블 템플릿 → N개 보드 한 번에.
11. **Gallery/Timeline 커스터마이즈** — 카드 컬럼 선택 · Timeline 가로 Gantt.
12. **range/numeric/date 필터** — 현재 status/select만.

### B4 (가장 마지막, 사용자 명시)
- 컬럼 ↔ Library 자산 링크 · "Use in table" 흐름 · 템플릿으로 보드 생성.
- (참고: Promote to Library 일부는 이미 위 #3에 포함.)

---

## ✅ 이번 세션 완료 (깊이 일괄 8 커밋)

### 1차 (6 커밋)
1. **Automations 실제 트리거 엔진** (`12a65d3`) + 15 단위 테스트.
2. **다중 필드 Filter 팝오버** (`bfbc3d3`).
3. **행 우클릭 컨텍스트 메뉴** (`26a0c28`).
4. **Gallery + Timeline 뷰** (`0bdedfd`).
5. **Bulk edit + ⌘D 단축키** (`f6044e1`).
6. **Wiki 새 페이지 + 사이드바 검색** (`44d5003`).

### 2차 (2 커밋)
7. **Schema pan/zoom + drag + New table 모달** (`2bdee40`).
8. **Dashboard Line chart + 영어화 + 컬럼 Change type** (`57fadb6`).

---

## 코드/디자인 컨벤션 (LOCK + 추가)

- **Status 키 LOCK 한국어 + `STATUS_LABELS` 맵 영어 디스플레이**.
- **`selectAsset(category, id)` 원자 액션** — Library cross-category.
- **셸 푸터 status bar 영구** — Trash/Settings는 패널 ❌.
- **컬럼 변경 = undo 비대상**.
- **deleteBoard → trashedBoards** — permanentDeleteBoard만 진짜 삭제.
- **acceptSuggestion = draft 상태 룰** — 자동 active ❌.
- **publishChange in store actions** — middleware ❌. timestamp + handledRef.
- **columnFilters와 filter는 병존** — 둘 다 selectVisibleRows에 AND.
- **Gallery/Timeline은 RowContextMenu 공유**.
- **selectVisibleRows useMemo deps 일관** — 새 ephemeral state 추가 시 모든 view(Dashboard/Gallery/Timeline/Kanban) deps 갱신 필요.
- **Change type은 행 데이터 보존** — type만 바뀜.
- **schemaPositions persist** — 보드 삭제 후 복원 시에도 위치 보존(의도).
- **외부 lib 도입 신중** — 모든 chart(SVG path)·Wiki 마크다운·Search·ER·Filter·Context 의존성 0 또는 이미 있는 Radix.
- **시드 추가 시 store version bump + migrate** — v4→v5(Tasks), v5→v6(Wiki), v6→v7(Trash/Settings), v7→v8(schemaPositions).
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
