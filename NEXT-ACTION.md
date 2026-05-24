# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-05-24 (kkh94 머신, 깊이 #4 — Dashboard builder + 시간 트리거 + Attached function)

---

## 한 줄 요약

**Dashboard builder + 시간 트리거 + Attached function 실 실행 완료. P1 시급 모두 끝. 다음: AI_CLASSIFY 자동 실행 · Ask AI ⌘J · Settings 멤버 · Wiki Trash · Heatmap 차트 등 폴리시.**

---

## ✅ 머지 완료

- `origin/main = 5db2376` — 이번 세션 13+ 신규 커밋 모두 머지.
- 다른 머신: `git fetch && git checkout main && git pull && npm install`.

---

## 🎯 다음 작업

### 우선순위 높음
1. **AI_CLASSIFY 자동 실행** — 현재 hint toast만. attached function이 AI_CLASSIFY일 때 inferBatch 자동 호출. 사용자가 cell editor에서 Apply하지 않아도 row_added 시 자동 분류.
2. **Wiki 삭제 → trashedWikiPages** — 현재 영구. types.TrashedWikiPage + store v9→v10 + trash dialog 3번째 탭.
3. **AppShell mount 시 cleanupExpiredTrash 자동 호출** — 다이얼로그 안 열어도 만료 정리.

### 우선순위 중간
4. **Ask AI ⌘J 톱바 버튼** — composer는 AI 패널 안에만.
5. **Settings 깊이**: 멤버/권한 탭 · 테마 프리셋 · 데이터 export.
6. **Heatmap 차트** — Dashboard builder의 6번째 차트 종류 (status × theme 등).
7. **Chart reorder (drag) + inline edit** — 현재 추가/삭제만.
8. **Library에서 promoted field → 원본 컬럼 점프** (역참조 네비).
9. **시간 트리거 firedKeys persist** — 페이지 새로고침 dedupe 유지.

### 우선순위 낮음
10. **Gallery/Timeline 커스터마이즈** — 카드 컬럼 선택 · Timeline 가로 Gantt.
11. **range/numeric/date 필터**.
12. **Schema pinch-zoom 트랙패드** + 멀티 테이블 템플릿 → N개 보드.
13. **MATCH_FROM_DROPDOWN sourceField 명시 선택** — 현재 휴리스틱(첫 text/select).

### B4 (가장 마지막, 사용자 명시)
- 컬럼 ↔ Library 자산 링크 → Promote/Attach 일부 진행. 남은 건 "Use in table" (Library asset에서 시작).

---

## ✅ 이번 세션 완료 (13+ 커밋)

### 1차 (6 커밋) — 큰 갭
1. Automations 실 트리거 엔진 (`12a65d3`) + 15 단위 테스트
2. 다중 필드 Filter (`bfbc3d3`)
3. 행 우클릭 (`26a0c28`)
4. Gallery + Timeline 뷰 (`0bdedfd`)
5. Bulk edit + ⌘D (`f6044e1`)
6. Wiki 새 페이지 + 검색 (`44d5003`)

### 2차 (2 커밋) — Schema/Dashboard
7. Schema pan/zoom + drag + New table (`2bdee40`)
8. Dashboard Line + 영어화 + Change type (`57fadb6`)

### 3차 (2 커밋) — 일관성/깊이
9. Workspace/Inbox 사이드바 (`fb79379`)
10. 사이드바 너비 + Automation log + Wiki 우클릭 + Trash 행 + Promote/Attach (`8909ec2`)

### 4차 (2 커밋) — Dashboard builder + 시간 트리거 + Attached function
11. Dashboard builder full + Stacked bar (`bb5a0cc`)
12. 시간 트리거 + Attached function (`5db2376`) + 14 신규 unit test

---

## 코드/디자인 컨벤션 (LOCK + 추가)

- **Status 키 LOCK 한국어 + `STATUS_LABELS` 맵 영어**.
- **`selectAsset(category, id)` 원자 액션**.
- **셸 푸터 status bar 영구**.
- **모든 navigation 모드는 사이드바** — Tables/Library/Wiki/Workspace/Inbox. Search 예외.
- **사이드바 너비 240px 통일**.
- **컬럼 변경 = undo 비대상**.
- **deleteBoard → trashedBoards · deleteRows → trashedRows · 30일 만료**.
- **acceptSuggestion = draft 상태**.
- **publishChange in store actions** + handledRef.
- **columnFilters와 filter 병존**.
- **Gallery/Timeline은 RowContextMenu 공유**.
- **Change type은 행 데이터 보존**.
- **schemaPositions persist**.
- **promoteColumnToLibraryField idempotent**.
- **Automation log는 active board만 push**.
- **Dashboard board.charts 비어 있으면 auto-derive 폴백**.
- **시간 트리거 firedKeys = in-memory** (페이지 새로고침 시 reset).
- **Attached function 실행 = rule scan 전** — auto-fill이 룰 트리거 가능.
- **MATCH_FROM_DROPDOWN sourceField = 첫 text/select 컬럼** (휴리스틱).
- **외부 lib 도입 신중** — 모든 chart(SVG/div), Wiki 마크다운, Search, ER, Filter, Context 의존성 0 또는 기존 Radix.
- **시드 추가 시 store version bump + migrate** — v4→v5(Tasks), v5→v6(Wiki), v6→v7(Trash/Settings), v7→v8(schemaPositions), v8→v9(trashedRows).
- **NavStack ephemeral**.

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
