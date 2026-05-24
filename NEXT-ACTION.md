# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-05-24 (kkh94 머신, 깊이 #5 — Wiki Trash · AppShell cleanup · Ask AI ⌘J · Settings 4탭 · Heatmap)

---

## 한 줄 요약

**P1·P2 폴리시 5건 일괄 완료(Wiki Trash·cleanup·Ask AI ⌘J·Settings 4탭·Heatmap). 다음: Chart reorder(drag) · 시간 트리거 firedKeys persist · Library promoted field 점프 · range/numeric 필터 등 폴리시.**

---

## ✅ 머지 완료

- `origin/main = d98f41c` — 이번 세션 1 commit 머지.
- 다른 머신: `git fetch && git checkout main && git pull && npm install`.

---

## 🎯 다음 작업

### 우선순위 높음
1. **AI_CLASSIFY 자동 실행** — ⚠ **사용자 명시 룰**: 사용자가 직접 요청할 때만 시작. 메모리 `feedback-ai-classify-user-triggered-only.md` 참조. Claude 자율 진행 ❌.

### 우선순위 중간
2. **Chart reorder (drag) + inline edit** — 현재 추가/삭제만. dnd lib 없이 화살표 버튼 또는 grab handle.
3. **Library promoted field → 원본 컬럼 점프** — 역참조 네비.
4. **시간 트리거 firedKeys persist** — 페이지 새로고침 dedupe 유지.
5. **Wiki Trash 통합 후속 — Wiki body diff/version history** (선택). 현재 단순 overwrite.
6. **Members 깊이** — 활동 로그 · last seen · 권한별 액션 차단(Viewer는 readonly 등).
7. **Theme accent color 프리셋** — Light/Dark 외 워크스페이스 색 1~3 옵션. Settings Appearance에 자리 마련.

### 우선순위 낮음
8. **Gallery/Timeline 커스터마이즈** — 카드 컬럼 선택 · Timeline 가로 Gantt.
9. **range/numeric/date 필터**.
10. **Schema pinch-zoom 트랙패드** + 멀티 테이블 템플릿 → N개 보드.
11. **MATCH_FROM_DROPDOWN sourceField 명시 선택** — 현재 휴리스틱(첫 text/select).
12. **Data Import** — Settings Data 탭 export 짝. JSON 업로드 → 검증 → 머지(보드 단위 conflict 처리).

### B4 (가장 마지막, 사용자 명시)
- 컬럼 ↔ Library 자산 링크 → Promote/Attach 일부 진행. 남은 건 "Use in table" (Library asset에서 시작).

---

## ✅ 이번 세션 완료 (1 commit)

### `d98f41c` — 깊이 일괄 #5
1. **Wiki 삭제 → trashedWikiPages** (store v9→v10 + 3rd Trash 탭 + AlertDialog 메시지)
2. **AppShell mount cleanupExpiredTrash 자동 호출** (hasHydrated 체크)
3. **Ask AI ⌘J 톱바 버튼** (Sparkles + Kbd · ⌘J · composer focus token)
4. **Settings 깊이 4탭** (General · Members + Owner 보호 + Invite · Appearance Theme · Data Export JSON)
5. **Heatmap 차트** (Dashboard builder 6번째 종류 · 2D grid + intensity opacity · 의존성 0)

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
- **시간 트리거 firedKeys = in-memory** (페이지 새로고침 시 reset).
- **Attached function 실행 = rule scan 전** — auto-fill이 룰 트리거 가능.
- **MATCH_FROM_DROPDOWN sourceField = 첫 text/select 컬럼** (휴리스틱).
- **외부 lib 도입 신중** — 모든 chart(SVG/div), Wiki 마크다운, Search, ER, Filter, Context 의존성 0 또는 기존 Radix.
- **시드 추가 시 store version bump + migrate** — v4→v5(Tasks), v5→v6(Wiki), v6→v7(Trash/Settings), v7→v8(schemaPositions), v8→v9(trashedRows), v9→v10(trashedWikiPages), v10→v11(settings.members).
- **NavStack ephemeral**.
- **Owner 보호 이중 단** — Settings Members UI 단(비노출) + store 액션 단(filter).
- **AppShell mount = `hasHydrated` 체크 후 cleanup** — zustand persist hydrate race 회피.
- **Ask AI 진입점 = requestAskAi 액션** — token으로 AiComposer focus 트리거.
- **Heatmap = 단일 hue + opacity intensity** — 다색 cmap ❌. var(--chart-1) opacity 0.18~1.0.
- **AI_CLASSIFY 자동 실행 = 사용자 명시 요청 시에만** — `feedback-ai-classify-user-triggered-only.md` 메모리 룰. Claude 자율 시작 ❌.

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
