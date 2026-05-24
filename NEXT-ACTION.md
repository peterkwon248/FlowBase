# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-05-24 (kkh94 머신, 깊이 #6 — Timeline Gantt · Filter (2-step + range) · Display 옵션 · Chart reorder · Library 점프)

---

## 한 줄 요약

**P2 폴리시 6건 일괄(Timeline Gantt 재작성 + Filter 2-step + range/num/date + Display 4 view 옵션 + Chart reorder + Library 점프). 다음: 시간 트리거 firedKeys persist · Members 깊이(Viewer readonly) · Theme accent · Data Import · Gallery/Timeline 커스터마이즈 등.**

---

## ✅ 머지 완료

- `origin/main = a818f82` — 이번 세션 1 commit 머지.
- 다른 머신: `git fetch && git checkout main && git pull && npm install`.

---

## 🎯 다음 작업

### 우선순위 높음
1. **AI_CLASSIFY 자동 실행** — ⚠ **사용자 명시 룰**: 사용자가 직접 요청할 때만 시작. 메모리 `feedback-ai-classify-user-triggered-only.md` 참조. Claude 자율 진행 ❌.

### 우선순위 중간
2. **시간 트리거 firedKeys persist** — 페이지 새로고침 dedupe 유지. localStorage 저장.
3. **Members 깊이** — 활동 로그 · last seen · **Viewer readonly 차단** (mutation 액션에 role 체크).
4. **Theme accent color 프리셋** — Settings Appearance 자리 마련됨. CSS variable 토글.
5. **Data Import** (Settings Data 탭 export 짝) — JSON 업로드 + 검증 + 머지.
6. **dangling viewSettings cleanup** — 보드 영구 삭제 시 viewSettings 키 잔존 — `permanentDeleteBoard`에서 cleanup.
7. **Chart toolbar 터치 UX** — group-hover로만 표시. 모바일/터치엔 부재.

### 우선순위 낮음
8. **Filter "And/Or" multi-condition per column** — 현재 in/range/date-range 각 단일. 향후 ≥/≤/contains 등 확장.
9. **Gallery/Timeline 커스터마이즈 후속** — 카드 컬럼 reorder · Gantt 주 단위 group · zoom.
10. **Schema pinch-zoom 트랙패드** + 멀티 테이블 → N개 보드.
11. **MATCH_FROM_DROPDOWN sourceField 명시 선택**.
12. **legacy 액션 제거** — `setColumnFilter`/`toggleColumnFilter` (현재 `setColumnCondition`/`toggleColumnInValue` 위임 후방호환). 점진 호출처 정리.

### B4 (가장 마지막, 사용자 명시)
- 컬럼 ↔ Library 자산 링크 → Promote/Attach 일부 진행. 남은 건 "Use in table" (Library asset에서 시작).

---

## ✅ 이번 세션 완료 (1 commit)

### `a818f82` — 깊이 일괄 #6
1. **Timeline Gantt 재작성** (사용자 보고 fix) — 월별 카드 리스트 폐기 → design-ref/prototype Gantt 답습
2. **Filter Popover 2-step inline 재구현** (사용자 보고 fix) — DropdownMenu Sub 폐기, 컬럼 hue dot
3. **Filter range/numeric/date** — FilterCondition union, num/date 컬럼 picker
4. **viewSettings 인프라 + Display 버튼 + 4 view 옵션** — Linear "Display" 패턴
5. **Chart reorder + inline edit** — ↑↓ swap + ⋯ menu (Rename · Width)
6. **Library promoted field 점프** — Used in chip 클릭 → 원본 컬럼

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
- **시드 추가 시 store version bump + migrate** — v4→v5(Tasks), v5→v6(Wiki), v6→v7(Trash/Settings), v7→v8(schemaPositions), v8→v9(trashedRows), v9→v10(trashedWikiPages), v10→v11(settings.members), v11→v12(viewSettings).
- **NavStack ephemeral**.
- **Owner 보호 이중 단** — Settings Members UI 단(비노출) + store 액션 단(filter).
- **AppShell mount = `hasHydrated` 체크 후 cleanup** — zustand persist hydrate race 회피.
- **Ask AI 진입점 = requestAskAi 액션** — token으로 AiComposer focus 트리거.
- **Heatmap = 단일 hue + opacity intensity** — 다색 cmap ❌. var(--chart-1) opacity 0.18~1.0.
- **AI_CLASSIFY 자동 실행 = 사용자 명시 요청 시에만** — `feedback-ai-classify-user-triggered-only.md` 메모리 룰. Claude 자율 시작 ❌.
- **Filter cascade ❌ → Popover 2-step inline** — DropdownMenu Sub는 좁은 화면 한계. 후속 nested menu도 같은 패턴.
- **DropdownMenu Sub z-stacking** — SubContent z-[60] (main z-50 위) + sideOffset 6.
- **컬럼별 hue dot** — Filter 등 type icon만으론 변별 부족할 때 chart-{1..5} 안정 매핑.
- **viewSettings 보드별 + view별 persist** (store v12) — Display 옵션 모델.
- **Filter columnFilters = discriminated union** (`FilterCondition`) — in/range/date-range. legacy 액션 점진 삭제.
- **selectVisibleRows useMemo deps = [board, search, filter, sort, columnFilters]** — 신규 ephemeral 필터 추가 시 모든 view useMemo 갱신 일관성.
- **zustand 셀렉터 default 패턴** — `(s) => s.foo ?? {}` ❌ 무한 루프. 모듈 스코프 상수 또는 raw 구독.
- **Chart reorder = ↑↓ 버튼** (DnD lib ❌, Kanban 카드 이동과 같은 패턴).

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
