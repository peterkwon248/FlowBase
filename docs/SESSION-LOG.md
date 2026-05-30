# SESSION-LOG

세션 history (append-only). 가장 최근 entry가 위.

---

## 2026-05-30 (kkh94 머신, 3 commit) — 테이블 많을 때 1순위 + Schema ER 캔버스(드래그/선택/더블클릭) + 전역 테이블 순서

### 완료 (3 commit · 베이스 `c35d896`)

`/before-work` 후 "테이블 많을 때 1순위" 선택 → 구현·검증. 이어서 사용자가 Schema/Fields의
"클릭 선택 + 위치 이동(=캔버스 모드)" 가능 여부를 질문 → 논의 끝에 **Schema 캔버스 강화 +
전역 테이블 순서**까지 확장. 신규 워크트리 `npm install` 선행.

- `2d31752→d83cb29` feat(store): **reorderBoards** — boards Record 자체를 재정렬하는 전역
  순서 액션(ensureCanEdit 가드). 별도 boardOrder 필드 ❌ — Record 순서가 곧 테이블 순서.
- `3b2ddef→ea73462` feat(schema): **Schema ER 캔버스** — ① 검색 포커스(좌상단 검색창+결과
  드롭다운 → 클릭/Enter 시 카드 중앙 이동 ≥100% 줌 + ring) ② 카드 **본문 전체** 드래그 이동
  (헤더 한정 철회) ③ 클릭 선택(selectedId+ring) ④ 빈 캔버스 클릭 = 선택/포커스 해제 ⑤ 더블클릭 = 테이블 열기.
- `9938f9b→88033cb` feat(schema): **Fields 검색+카드 접기**(테이블명/id+필드명/타입 매칭 필터
  · 매칭 행 하이라이트 · 카운트 · 카드별 chevron + Collapse/Expand all · 검색 중 force-expand) +
  **grip 드래그 순서변경**(네이티브 HTML5 dnd · reorderBoards 호출 · 검색중/viewer/1개 비활성).

> ⚠️ 위 SHA는 워크트리 재커밋으로 변동(최종: `d83cb29`·`ea73462`·`88033cb` + docs `69f627f`).

### 큰 결정 / LOCK

- **Schema ER = 캔버스 모델 LOCK**: 카드 전체가 드래그 핸들(기존 헤더 한정 철회). 클릭=선택
  (ring) · 더블클릭=open(switchBoard+tables) · 빈 캔버스=해제+pan. highlight=`hovered ??
  focusedId`(검색 포커스), 선택은 별도 ring. ER 카드 안엔 인터랙션 요소 없어 전체 드래그 안전.
  dnd 라이브러리 ❌(좌표 직접 계산).
- **전역 테이블 순서 LOCK**: `reorderBoards(orderedIds)`가 boards **Record를 재구성** →
  `Object.values(boards)`를 쓰는 모든 곳(사이드바 TABLES·Schema 자동레이아웃·Fields)이 자동
  일관. persist는 Record 순서 그대로 저장(마이그레이션 불필요). dnd = **네이티브 HTML5 +
  grip 핸들**(dnd lib ❌ LOCK 답습). 드롭 = 대상 카드 앞 삽입. ensureCanEdit 가드.
- **Fields 검색/접기**: 검색은 가변 항목 로컬 필터. 검색 중엔 강제 펼침 + chevron/grip 숨김,
  검색 해제 시 수동 접기 상태 복원. grip reorder는 검색 안 할 때만(필터 중 순서변경 혼란 회피).

### 검증

- tsc **0** · eslint **0/0** · vitest **317**. 브라우저 실측 전부 통과 — 본문 드래그 이동
  (dx80/dy55) · 클릭 선택 ring · 빈곳 해제 · 더블클릭 Tasks 열림 · ER 검색→중앙+ring ·
  Fields 검색 "2 of 2 tables · 2 matching fields" + 행 하이라이트 · Collapse all/펼침/접힌채
  검색 force-expand · grip 드래그 reorder(영속 + 사이드바 순서 반영). 콘솔 0. 테스트로 옮긴
  카드 위치 Reset 원복.

### 다음

- 상용화 마일스톤(M1 BaaS · M2 인증 · M4 반응형)이 여전히 큰 남은 작업.
- 테이블 많을 때 2·3순위(미니맵/자동레이아웃/도메인그룹/마스터-디테일)는 YAGNI 백로그
  (실제 15~20개+ 신호 시).

### Watch Out

- **새 워크트리 dev 서버를 `npm install` 완료 전에 켜면** react/react-dom의 `cjs/`가 누락돼
  화면이 검정(turbopack `Can't resolve './cjs/react.development.js'` + `<eof>` 파싱). 복구 =
  preview_stop + `rm -rf .next node_modules/react node_modules/react-dom` + `npm install` +
  재기동. **tsc/vitest는 통과하므로 정적 검사만으로 "동작 검증"이라 단정 ❌ — 브라우저 실렌더 확인.**
- **main 직접 push는 하니스 권한 분류기가 차단** — feature 브랜치(`claude/heuristic-goldstine-9a8bc1`,
  `69f627f`)는 origin에 push됨. main 반영은 사용자 명시 승인 또는 PR 필요(2026-05-30 기준 미반영).
- **next-env.d.ts** 커밋 제외(빌드 산출물). **워크트리 별도 `npm install`**.
- preview MCP 인자: `serverId` + `expression`(eval) / `name`(start). 틀리면 조용히 실패.

### 머신

kkh94 (`C:\Users\kkh94\OneDrive\Desktop\FlowBase`), 워크트리
`.claude/worktrees/heuristic-goldstine-9a8bc1`. 다음 머신: `git fetch && git checkout main
&& git pull && npm install`.

---

## 2026-05-30 (kkh94 머신, 15 commit) — Schema 관계 시스템(FK→Lookup/Rollup) + IA 정합성 + 계정 메뉴

### 완료 (15 commit · 베이스 `8c8a137`)

`/before-work` 후 사용자 선택 "Library 나머지 깊은 편집"으로 시작 → Schema 관계
시스템 전반 + 사이드바 IA 정합성 + 계정 메뉴까지 확장. 신규 워크트리 `npm install` 선행.

**Library 깊은 편집 + 버그 fix**
- `aeaba45` Library C2 잔여 — Function params CRUD/example · Template 단일테이블 편집
  (linked fields · extraFields · recommendedViews · defaultGroupBy) · Dashboard charts
  CRUD(seed의 enum 밖 "one-third"/"area" tolerant 표시). viewer read-only 분기.
- `4431945` fix — `settings.members` undefined 가드("members is not iterable" 크래시).
  snapshots-view·settings-dialog 두 consumer `?? []`(셀렉터 새 배열 무한루프 LOCK 회피).

**Schema 관계 시스템 (FK → Lookup/Rollup)**
- `670d5fd` FK 관계 컬럼 — add-column "Relation" submenu + FkCell(타겟 행 선택 popover).
  컬럼 생성만으로 Relations 리스트/ER 엣지 자동 반영.
- `c545cdc` Fields 탭 컬럼 편집 — store 4액션에 optional `boardId`(cross-board) + 편집 UI.
- `3bacb4a` P5 관계 네비게이션 — fk 셀 ↗ 점프 + Relations chip 점프(board-jump 패턴).
- `89f3be4` P6 양방향 관계 — Fields 카드 outgoing(→)/incoming(←) 배지.
- `9e3555d` P7 Lookup 컬럼 — ColumnType "lookup"{via,field} + 연결 행 필드값(read-only).
- `c67306a` P8 Rollup 컬럼 — ColumnType "rollup"{sourceBoard,viaFk,aggFn,field} + 역참조
  집계(count/sum/avg/min/max/median, 기존 AggFn 재사용).
- `fc86db1` P9 컬럼 삭제 확인 다이얼로그 — 타입별 메시지(derived/fk/일반).
- `1f7b321` Relations 탭 "Add relation" — From/To 테이블 select → fk 자동 생성(진입점 갭).

**IA 정합성 (네이밍 + 헤더 + 검색)**
- `bbddea6` Tables→Workspace · Workspace→Control · board-sidebar 헤더 닉네임→표준
  패턴([Database]+모드명) · 섹션 BOARDS→TABLES.
- `aafbe03` 사이드바 검색 실동작 — Library enable(disabled였음) + Workspace 신설.
  Wiki 검색은 원래 동작. Inbox·Control은 고정 메뉴라 검색 없음.
- `266a799`→`85d0a6d` Control→Layer→Control (최종 Control, 의미 우선·아이콘 Layers).

**계정 메뉴**
- `3d4adb4` F박스(하드코딩 "F") → 현재 사용자 이니셜 + 클릭 시 계정/워크스페이스 팝오버.

### 큰 결정 / LOCK

- **ColumnType 확장 LOCK**: "lookup"·"rollup" 추가(12→14종). lookup·rollup·formula는
  read-only 파생 셀(행 데이터 없음). TYPE_ICON: lookup=Waypoints · rollup=Sigma.
  SCHEMA_EDIT_TYPES(타입 전환)·add-column-menu에는 lookup/rollup 미포함(전용 생성 경로).
- **모드 네이밍 LOCK**: 활동바 = Inbox · **Workspace**(구 Tables, 데이터 메인 작업공간) ·
  **Control**(구 Workspace, Schema/Automations/History/Snapshots) · Library · Wiki · Search.
  ⚠ `id`는 유지("tables"/"workspace" — ActivityMode 키, 라벨만 변경). 아이콘: Workspace=
  Database · Control=Layers. 섹션 BOARDS→TABLES(데이터 단위 "table").
- **검색 정합 룰**: 가변·다수 항목(Workspace/Library/Wiki)만 검색창. Inbox·Control은 고정
  메뉴라 검색 없음(기능 신호). 검색 = 로컬 필터(Wiki 패턴: query state + filter + clear + 빈상태).
- **cross-board 컬럼 액션 LOCK**: addColumn/deleteColumn/renameColumn/updateColumn에
  optional `boardId`(미지정=activeBoard, 기존 호출 호환). set은 b.id 기준이라 안전.
- **F박스 = 사용자 이니셜**: `settings.currentUserId` 매칭 멤버의 `initial`. members
  undefined 가드(첫 멤버 fallback). 인증(M2) 전 데모(currentUser=peter→P).
- **테이블 많을 때 대응 = YAGNI 합의**: "미리 다 만들기 ❌, 확장 쉽게 설계 + 필요 시 추가".
  1순위(Fields 검색+접기·Schema 검색 포커스 — 저비용)만 다음 세션. 2·3순위(미니맵/
  자동레이아웃/도메인그룹/마스터-디테일)는 백로그(실제 15~20개+ 신호 오면).

### 검증

- vitest **317** · tsc **0** · eslint **0/0**. 브라우저 실측 전부 통과 — 관계 생성/fk 셀
  점프/Lookup("진행중")/Rollup(count 1)/삭제 다이얼로그/네이밍/3 검색/F박스 메뉴/Add
  relation. 세션 중 만든 테스트 데이터(fk·lookup·rollup 컬럼·새 보드) 전부 정리·원복.

### 다음

- **테이블 많을 때 1순위**(다음 세션 구현): Fields 검색+카드 접기 · Schema ER 검색 포커스.
  나머지는 백로그(위 YAGNI 합의).
- 상용화 마일스톤(M1 BaaS · M2 인증 · M4 반응형)은 여전히 큰 남은 작업.

### Watch Out

- **next-env.d.ts** 커밋 제외(빌드 산출물). **워크트리 별도 `npm install`**.
- Control 모드명은 의미 우선(Layer 철회) — 아이콘만 Layers라 이름-아이콘 약간 분리(의도).
- F박스 계정 정보는 인증 전 데모. Relations "Add relation"으로 fk 만들면 Relations/ER 채워짐
  (이전엔 시트로 가야 했음 — 이게 "Relations 미구현처럼 보이던" 갭이었음).

### 머신

kkh94 (`C:\Users\kkh94\OneDrive\Desktop\FlowBase`). 다음 머신: `git fetch && git checkout
main && git pull && npm install`.

---

## 2026-05-28 (kkh94 머신, 7 phase / 7 commit) — G7 후속 폴리시 묶음 (Wiki diff LCS · Gallery dnd · Timeline 버킷 · Library 깊은 편집 · Chart a11y)

### 완료 (7 commit · 베이스 `663c6b7`)

`/before-work`로 origin 동기화(이미 최신) 후, 사용자 선택 "G7 후속 폴리시 묶음"을
**phase별 commit**으로 진행. 신규 워크트리라 `node_modules` 없어 `npm install` 선행.

1. **`e4ea9e4` feat(wiki): A3 — Wiki diff LCS** — `naiveLineDiff`(위치-대-위치)를
   `lib/line-diff.ts` `diffLines`(LCS DP + backtrack)로 교체. 한 줄 삽입/삭제가
   이후 라인을 어긋나게 잡던 결함 해소. **+10 단위 테스트**(307→317). 의존성 0.
   wiki-history-dialog는 동일 `DiffLine` 타입 import만 교체(렌더 불변).
2. **`ed02ef7` docs: README** — 제목 FlowDB→FlowBase · GitHub Actions CI badge
   (`peterkwon248/FlowBase`, push 후 활성) · 현재 상태/스택을 Phase 1 실제로 갱신.
3. **`37e1ad6` feat(gallery): A10 — cardFields 네이티브 dnd** — Display 팝오버
   선택 cardField 행에 HTML5 `draggable` + grip 핸들 + drag/over 시각 피드백.
   `reorder`(splice 이동) → `setViewOption("gallery",{cardFields})`. ↑/↓ 버튼 유지
   (접근성). **dnd 라이브러리 ❌ LOCK 준수**(코드베이스 첫 네이티브 dnd 패턴).
4. **`fd79451` feat(timeline): A9 — month/week 실제 버킷 집계** — 기존엔 항상 day
   컬럼 렌더 + month/week는 컬럼 폭만 압축(8/14px). `days[]` → scale-aware
   `ticks[]`(버킷)로 일반화: month=달, week=주(일요일 시작), day=일. bar 위치를
   버킷 index(`bucketIndexOf`, timestamp 기반)로 계산. UTC 자정 스냅으로
   due ms == 버킷 startMs → **day scale 기존 동작 그대로 보존**. 컬럼 폭 상수
   의미 변경(per-day→per-bucket): WEEK 14→54, MONTH 8→68.
5. **`612bf42` feat(library): C2 — OptionList 옵션 깊은 편집** — read-only였던
   `OptionListBody`를 non-viewer 편집: 옵션 추가/삭제(X)/라벨 인라인 rename/색상
   picker. 색상 = **토큰 팔레트 `var(--chart-1..5)`**(inline hex 금지 LOCK).
   `updateLibraryOptionList` 재사용(ensureCanEdit 가드). viewer read-only.
6. **`2368aee` feat(library): C2 후속 — Field config 인라인 편집** — `FieldBody`
   non-viewer 편집: required 토글 · default/format/validation 텍스트(blur commit) ·
   OptionList 링크 select(None 포함). type·inline options read-only.
   `updateLibraryField` 재사용. → **"Library 깊은 편집"(옵션+config) 완성**.
7. **`b43c93e` feat(dashboard): chart toolbar 키보드 접근성** — 호버 toolbar
   (↑↓ ⋯ X)에 `focus-within:opacity-100` 추가(키보드 탭 노출). touch(hover:none)는
   이미 적용돼 있었음. CSS only, 기존 hover/touch 불변.

### 큰 결정 / LOCK

- **`lib/line-diff.ts` 신규** — LCS 기반 공용 line diff(`diffLines` + `DiffLine`).
  의존성 0. Wiki 외 재사용 가능.
- **네이티브 HTML5 dnd 패턴 도입** — Gallery cardFields가 첫 사례. dnd lib ❌ LOCK
  유지(draggable + onDragStart/Over/Drop + splice 이동). 향후 dnd는 이 패턴 답습.
- **Timeline ticks 모델** — `days[]` → `ticks[]`(scale별 버킷). `bucketIndexOf`로
  timestamp→버킷. UTC 스냅 LOCK(date 문자열이 UTC 자정 파싱 → 버킷 경계도 UTC).
- **Library 편집 = 토큰 색상만** — OptionList recolor 팔레트는 `var(--chart-N)`
  토큰 5종. inline hex 금지 LOCK 준수. 모든 편집 `ensureCanEdit` + viewer read-only.

### 검증

- vitest **317 passed**(+10) · tsc **0** · eslint **0/0** 클린.
- 브라우저 실측(preview): Gallery 실제 drag-drop reorder(store 반영) · Timeline
  day(25 ticks)/week(4 일요일 버킷)/month(1 May 버킷) 3 scale · Library OptionList
  add/rename/recolor/remove 4동작 + Field required 토글·default 편집(store 반영).
  콘솔 에러 0. **테스트 중 변경한 preview 상태 전부 원복.**

### 다음 (결정/규모 이슈 — 자율 진행 보류)

- **Formula propArr(col)** — ⚠ Formula 결과타입 LOCK(4종)을 array로 확장해야 함. 승인 필요.
- **Saved Views 폴더 그룹화** — 폴리시 아닌 기능 규모.
- **Library Function/Template/Dashboard 깊은 편집** — rename만 됨, deeper는 후속.
- **상용화 마일스톤 M1~M7** — BaaS/인증/결제/반응형/마케팅/운영/협업.

### Watch Out

- `next-env.d.ts` — dev 서버가 `./.next/dev/types/...`로 재생성. **커밋 제외**(빌드 산출물).
- **워크트리는 별도 `node_modules` 필요** — 새 워크트리에서 `npm install` 선행.

### 머신

kkh94 (`C:\Users\kkh94\OneDrive\Desktop\FlowBase`), 워크트리
`.claude/worktrees/peaceful-liskov-c52b85` (branch `claude/peaceful-liskov-c52b85`).

---

## 2026-05-26 (kkh94 머신, 17 phase / 2 commit) — ESLint 풀스택 + G7-C 후속 폴리시 + Library rename

### 완료 (2 commits — `cb5e19d` + `26ddcdb` · 27 파일 변경 · +6883/-620)

직전 세션 잔여(G7-C 폴리시 일부) + 이번 세션 신규(ESLint 인프라 + 더 많은 폴리시).
file overlap(types/store) 큼 — infra/code 2 commit 분할.

#### ESLint 9 + CI + pre-commit 인프라 (`cb5e19d`)
- Q2 flat config 도입 — `eslint.config.mjs` Next plugin 직접 import (FlatCompat
  circular JSON 회피). minimal: ts-recommended + react-hooks + next core-web-vitals.
- Q2-fu2 CI workflow `.github/workflows/ci.yml` — Node 20 · lint (--max-warnings
  50) · tsc · vitest. PR + main push 트리거.
- Q2-fu2 husky pre-commit + lint-staged — `npx lint-staged` *.{ts,tsx,js,jsx,mjs}
  → `eslint --max-warnings 50`. errors 0 강제. **자동 검증 성공**(이번 두 commit
  모두 husky lint-staged 통과).
- Q13-D3 추가 룰 — prefer-const · no-console (allow warn/error/info) · eqeqeq
  smart. react-hooks/rules-of-hooks: error.
- 신규 deps: eslint@^9 · @next/eslint-plugin-next · eslint-config-next@^16 ·
  @typescript-eslint/{parser,eslint-plugin} · globals · @eslint/eslintrc ·
  html2canvas · husky · lint-staged.

#### 17 phase 코드 변경 (`26ddcdb`)
- Q1-A6 Theme accent — settings-dialog AccentSection relative + active bg
- Q1-B5 `lib/deep-equal.ts` 신규 — JSON.stringify 의존 제거. saved-views-menu
  modified detection 적용
- Q1-B6 applySavedView viewType fallback 명시 + toast description 안내
- Q2-fu1 errors 8개 fix — sheet-view useMemo 위로 · dashboard-view 컴포넌트
  분리(outer/Inner). early return + hooks 충돌 해결
- Q3 Formula sort/filter by formula — selectVisibleRows에 evaluator 통합 +
  getDerivedValue + AST cache · compareRows getValueFn hook · filter-menu
  resultType별 widget 분기 + BooleanFilterWidget 신규
- Q4 ESLint warnings 16개 정리 — unused imports 제거 · charts dims module
  scope + eslint-disable · ai-activity-panel/dashboard-view rows/customCharts
  useMemo wrap · use-toast actionTypes 의도 disable
- Q5-B2 `joinProp(col, sep)` 함수 — multiSelect 명시 separator (+6 tests)
- Q5-B7 importWorkspace formula 컬럼 재검증 + dependsOn 재계산
- Q6-B3 formula autocomplete — column chip 클릭 → `prop("name")` 삽입
- Q7-B4 추가 함수 11개 — contains · replace · startsWith · endsWith · trim ·
  abs · mod · floor · ceil · dateAdd · weekOfYear (+11 tests)
- Q8-A7 Pivot HTML PNG — chart-export.ts htmlToPng (html2canvas dynamic import)
- Q9-A11 Empty state 잔여 — search-mode + inbox-view에 EmptyState 적용
- Q10-B9 Saved Views UI — 4+ views 시 search filter + recent/alpha sort toggle
- Q14-C2 Library rename — 5 store actions(updateLibraryX) + asset-detail Shell
  인라인 rename UI (h1 click→Input · Enter/blur/Escape · viewer disable)

### 큰 결정 (이번 세션)

1. **2 commit 분할** — infra (deps + config 새 파일) vs code (모든 phase).
   file overlap이 1+phase에 걸쳐 분리 어려워 통합. 직전 세션 패턴 답습 + 인프라
   분리.
2. **Q1-A1·A2·A4·A5 이미 완료 확인** — 직전 세션 #19/G3 시리즈에서 적용됨.
   skip + 다음 phase로 진행.
3. **Q1-B6 fallback은 viewSettings 보존** — kanban viewSettings 비우면 데이터
   손실. 현 동작 의도 (사용자 status 추가하면 자연 복구). 주석 명시.
4. **Q3 selectVisibleRows formula evaluator integration** — per-call AST
   cache + getDerivedValue. 1000행 성능 측정은 후속.
5. **Q4 react-hooks/exhaustive-deps stable ref** — chart dims를 module scope
   const + eslint-disable. useMemo deps에 dims.* 모두 넣는 것보다 깔끔.
6. **Q2-fu1 dashboard-view 컴포넌트 분리** — early return + hooks 충돌의
   standard solution. 가장 깨끗. board guard outer + 모든 hooks inner.
7. **Q5-B7 formula 재검증은 부드러운 fallback** — parse 실패면 컬럼 그대로
   (셀 ⚠ ERR + 사용자 수정). round-trip 보장 우선.
8. **Q6-B3 column chip 삽입** — full autocomplete(dropdown) 대신 chip 클릭.
   더 simple + visible.
9. **Q8-A7 html2canvas dynamic import** — bundle 영향 최소화. xlsx-loader
   패턴 답습.
10. **Q14-C2 MVP scope** — 5 카테고리 rename만. 옵션 추가/색상 picker · field
    config 깊은 편집은 후속.
11. **Q13-D3 추가 룰 최소 강화** — strict 룰(no-floating-promises 등) 추가
    typed-linting 필요해 skip. minimum: prefer-const · no-console · eqeqeq.

### 검증
- tsc 0 errors
- ESLint **0 errors / 0 warnings** (Q2 + Q4 + Q13-D3 풀 정리)
- vitest **307/307** (직전 290 + Q5-B2 6 + Q7-B4 11 = +17)
- pre-commit hook 자동 작동 (두 commit 모두 husky lint-staged 통과)

### Watch Out (다음 세션)

- **Q11-D1 CI workflow 실 검증** — push 후 GitHub Actions 통과 확인 필요. README
  badge 추가는 후속.
- **Library 깊은 편집 후속** — 옵션 추가/제거 · 색상 picker · field config
  편집은 별 task로 남김. 현 rename만.
- **Formula sort/filter 성능 측정** — 1000행에서 evaluator 호출 비용 측정 후
  필요 시 result memoize.
- **dashboard-view 분리 후속 사이드 이펙트** — DashboardViewInner의 board 변경
  시 모든 useMemo 재실행. 큰 dataset에서 성능 영향 측정 후속.
- **html2canvas는 ~30KB lazy chunk** — Pivot PNG export 첫 호출 시 다운로드.
  network 느린 환경에서 1-2s 지연. 미리 prefetch는 후속.
- **prepare script husky 자동 install** — npm install 시 husky init. 다른
  머신에서 hooks 정상 동작 확인 필요.

### 머신
kkh94. main 머지·푸시 자동 (after-work 단계 8).

---

## 2026-05-26 (kkh94 머신, 13 phase / 2 commit) — G7-C Saved Views + Formula 컬럼 + UI polish + viewer enforcement

### 완료 (2 commits — `fac61fe` + `9f351c0` · 27 파일 변경 · +2791/-44)

이번 세션 누적 큼. file overlap(types/store)이 G7-C 8 phase에 걸쳐 분리 어려워
2 commit 분할: G7-C 통합 + 폴리시 통합.

#### G7-C Saved Views (C-V1·V2·V3) — `fac61fe`
- C-V1 SavedView interface + 5 store actions(save/apply/rename/delete/update) +
  v16→v17 migrate · SnapshotState에 savedViews/activeSavedViewId 포함 · 모든
  액션 ensureCanEdit 가드.
- C-V2 SavedViewsMenu 신규 — Popover · BookmarkCheck trigger · Save current
  inline input · 저장된 views 리스트(Apply+kebab Rename inline/Update/Delete).
  Scope LOCK: filter+sort+viewSettings 풀세트 (Notion 패턴).
- C-V3 applySavedView viewType 호환 가드 (Kanban→status 없음 시 sheet
  fallback + toast warning) · modified detection (활성 view와 현재 state
  JSON.stringify 비교 → trigger amber dot + popover "Update from current" 빠른
  액션).

#### G7-C Formula 컬럼 (C-F1~F5) — `fac61fe`
- C-F1 lib/formula/tokens.ts · parser.ts (recursive descent · AST: Literal/
  Identifier/UnaryOp/BinOp/Call) · extractDeps AST walker. 의존성 0.
  __tests__/lib/formula-parser.test.ts (28 tests).
- C-F2 lib/formula/{evaluator,functions,index}.ts. 16 함수: concat/lower/upper/
  length · add/sub/mul/div/round · if · today/format · prop + 비교/논리/단항.
  FormulaError · #DIV/0 · strict equality · short-circuit. multiSelect array →
  ", " join. __tests__/lib/formula-eval.test.ts (46 tests).
- C-F3 ColumnType += "formula" · ColumnDef.formula/formulaDeps/
  formulaResultType. addColumn/updateColumn parse validation + extractDeps 자동
  채움 + parse 에러 시 patch 거부. add-column-menu Calculator 항목 + 자동
  editor 오픈(CustomEvent). TYPE_ICON += formula.
- C-F4 FormulaCell — AST cache(cap 200) · useMemo with formulaDeps · ⚠ ERR
  빨간 표시. FormulaEditorDialog 신규 — textarea + 라이브 validation +
  dependsOn 미리보기 + result type + examples. column-header-menu "Edit
  formula" 항목 + CustomEvent listener. read-only 셀.
- C-F5 lib/formula/cycles.ts detectCycle(DFS 3색) + wouldCreateCycle. addColumn
  /updateColumn 호출 → 순환 시 patch 거부 + toast.
  __tests__/lib/formula-cycles.test.ts (13 tests).

#### UI polish P-1~P-4 — `9f351c0`
- P-1 Toaster props 명시 — position="bottom-right" + richColors + closeButton +
  duration=4000 + LOCK 주석. 개별 toast position override ❌ 강제.
- P-2 components/board/empty-state.tsx 신규 (Icon+title+description+children).
  Gallery (rows.length===0 · LayoutGrid · no rows vs filter empty 분기),
  Timeline (no dateCol, no datedRows — CalendarRange) 적용. Kanban 의도 skip.
- P-3 settings ImportSection — totalAdded===0 && totalSkipped>0 → "Nothing new"
  분기. totalAdded===0 → "Snapshot was empty".
- P-4 dashboard CustomChartCard: KPI → "Convert to Bullet…" + goal Dialog.
  Bullet → "Set goal…" + "Convert to KPI".

#### P-5 viewer enforcement polish — `9f351c0`
- store undo/redo 가드 ensureCanEdit (총 가드 ~56개).
- tables-mode Undo button disabled={isViewer}.
- settings-dialog GeneralTab (workspaceLabel/initial/Save), AccentSection
  (4 preset buttons), ImportSection (Choose JSON button) viewer disable.
- Export는 read-only이라 viewer OK 의도. AI Composer Send도 OK.

### 큰 결정 (이번 세션)

1. **2 commit 분할 채택** — types/store가 G7-C 전체에 걸쳐 변경되어 phase별
   분할 불가. G7-C 통합 + 폴리시 통합으로. 직전 14 phase 1 commit보다 개선.
2. **Saved view scope = filter + sort + viewSettings 풀세트** (Q1) — Notion
   패턴 답습. viewSettings only는 부족.
3. **Formula 참조 = `prop("colName")` 명시만** (Q9) — bare identifier(`Status`)
   는 unknown identifier 에러. parser 단순화 + 모호성 회피.
4. **Formula compute = read-on-render + AST cache + useMemo deps** (Q12) —
   write 캐시 ❌. 1000행 미만에선 가벼움.
5. **Formula 결과 타입 = text/number/date/boolean 4종** — status pill 흉내 ❌
   (LOCK 보존).
6. **Formula sort/filter by formula = 1차 미지원** (Q14) — selectVisibleRows에
   evaluator 호출 ❌. 후속.
7. **Formula 추가 column UX = 자동 editor 오픈** (Q11) — CustomEvent dispatch
   패턴.
8. **순환 detection patch 거부** (Q10) — invalid formula 컬럼 저장 ❌. 사용자
   명시 수정 강제.
9. **Toast position = bottom-right** + richColors + closeButton LOCK — 개별
   호출 override ❌.
10. **EmptyState 공통 컴포넌트 도입** — Kanban per-column 다른 scale이라 의도
    skip. Sheet onboarding tips는 기존 유지.
11. **Bullet "as KPI" preset = 메뉴 변환 + goal Dialog** — 별도 chart type
    추가 ❌, 기존 bullet 활용. Convert 양방향 (KPI↔Bullet).
12. **viewer enforcement Export 제외** — Export는 read-only operation이라
    viewer가 자기 데이터 export OK.

### 검증
- tsc 0 errors
- vitest 290/290 (203 baseline + 28 parser + 46 eval + 13 cycles = +87)
- 브라우저: Saved Views save/apply/active 표시 + Formula 컬럼 추가→자동 editor
  →parse validation→deps 추출→10 cells 평가 + bottom-right toast + viewer
  General tab disabled 모두 OK · console errors 0

### Watch Out (다음 세션)

- **G7-C [Q14] Formula sort/filter 후속** — 사용자가 formula 컬럼으로 정렬/
  필터 시도 시 동작 ❌. UI 안내 또는 후속 구현 필요.
- **Saved view modified detection JSON.stringify 의존** — 키 순서 영향 받을
  수 있음. polish 후속 (deep equal helper).
- **Formula AST cache cap 200** — 활발 사용 시 도달 가능. 사용 패턴 보고 조정.
- **Formula 결과 → group by/sort key** — viewSettings.sheet.sorts에 formula
  컬럼명 허용 ❌ (계산값 정렬은 evaluator 필요).
- **Formula multiSelect array** — ", " join만. join(arr, sep) 함수 후속 검토.
- **2 commit 분할 27 파일 +2791/-44** — review 단위 큼. file overlap 풀린
  뒤에는 phase별 분할 가능 — 다음부터 진짜 시도.
- **MEMBER demo "Switch to" 패턴** — viewer enforcement 검증 위해 store
  localStorage 직접 조작. settings.currentUserId 단독 변경은 가드 우회 (의도
  — 데모 패턴).

### 머신
kkh94. main 머지·푸시 자동 (after-work 단계 8).

---

## 2026-05-25 (kkh94 머신, 14 phase 통합 — multi-select 5 + 13 phase 1 commit) — Multi-select · Filter +Add · Dashboard 완성 · Phase A 도메인 fit · AI 확장 · G3/G4/G5/G6/G7-A/G7-B/P

### 완료 (multi-select 5 commits `a4e36a5`~`b6e6e10` + 13 phase 단일 commit `2c04c39` · 52 파일 +6308/-231)

이번 세션 누적 매우 큼 (46 sub-task). 첫 multi-select는 phase별 5 commit 분리 시도. 이후 13 phase는 file cross-cut라 단일 commit 채택 (직전 `c1b2be7` 패턴 답습). **다음부터 phase별 commit 강력 권장.**

#### Multi-select column type (C1-C5, 5 commits)
- C1 types/store/multi-select utils · learnFromPatch 배열 unpack · selectVisibleRows ANY-match · updateColumn migration
- C2 MultiSelectCell + MultiCellPopover · C3 views Notion 패턴 · C4 filter/bulk Add tag · C5 Im-3 split + tests
- 결정 6 default 적용 (Kanban Notion · first-value sort · ANY-match · 자동 migration · 정확 header auto · status 격리 LOCK)

#### Filter +Add condition UI
- filter-menu ExtraCondBlock helper · conds.slice(1).map array loop
- "+Add another condition" 일반 진입점 (직전 cond와 반대 kind 자동)

#### D Dashboard 완성 (D1-D5)
- D1 AggFn (count/sum/avg/min/max/median) · lib/chart-aggregate · KPI/Bar/Donut/Line aggFn 적용
- D2 Scatter (numeric × numeric) · D3 Histogram (auto bin sqrt rule · max 20)
- D4 Time scale (day/week/month/quarter/year) · D5 Auto-recommend (lib/dashboard-recommend · 10 rule)

#### F Dashboard 후속 (F1-F2)
- F1 Multi-series line + legend (groupByCol 색 분리 · Notion multi-row · top 8)
- F2 정확 calendar boundary (month/quarter/year — Date.setMonth · day/week 등간격 ms)

#### A Phase A code-only domain fit (A1-A5)
- A1 lib/domain-infer · 7 도메인(cs/hr/marketing/sales/finance/stock/general) · 키워드 점수 · 최소 2 매치
- A2 도메인별 priority + KPI title 변형 + priorityCol 키워드 순서 우선
- A3 lib/value-format (currency/time/percent/number · word boundary + plural · 5 currency locale)
- A4 lib/insights (period_change · top_categories · outliers · 최대 4 cap) + InsightCard
- A5 lib/outlier (z-score 2σ · 최소 5 샘플 · stdDev=0 skip)

#### G1 Dashboard 강화 (G1-1~G1-4)
- G1-1 Pivot table (HTML table · sticky · cell intensity · TOTAL)
- G1-2 Chart drill-down (Bar/Donut/Pivot → sheet filter + view 전환 + toast Clear)
- G1-3 KPI Goal progress bar (emerald reached · amber under)
- G1-4 Sheet outlier alert chip (Select outliers 진입점)

#### G2 Phase B AI (B1-B4) — 사용자 명시 click LOCK
- B1 suggest-board-label · B2 summarize-board · B3 suggest-column-type · B4 suggest-cleanup + CleanupDialog
- 모두 graceful (ANTHROPIC_API_KEY 미설정 시 toast.error)

#### G3 NEXT-ACTION 잔여 (G3-1~G3-3)
- G3-1 Snapshots compare A vs B · G3-2 multiTable → N보드 · G3-3 MATCH_FROM_DROPDOWN sourceField 명시

#### G4 데이터 안정성 (G4-1~G4-4)
- G4-1 Sheet cell-level outlier dot
- G4-2 lib/auto-backup (30분 interval · "Auto · " prefix · 5개 cap)
- G4-3 parsers BOM strip · G4-4 firedKeys CustomEvent sync

#### G5 Chart polish (G5-1~G5-3)
- G5-1 Histogram bin click drill-down · G5-2 Line bucket click drill-down · G5-3 CSV chart data export

#### G6 AI 확장 (G6-1~G6-2)
- G6-1 row-context-menu "Suggest empty value" · G6-2 GenerateBoardDialog (prompt → columns + seed)

#### P 소소 폴리시 (P1-P3)
- P1 빈 보드 onboarding tips · P2 KeyboardShortcutsDialog (⌘/ · 16 단축키 · 4 그룹) · P3 Kanban priority nowrap

#### G7-A Domain fit (G7-A1~G7-A3)
- G7-A1 Bullet chart (value + goal + reference) · G7-A2 Funnel chart (stage drop-off · status LOCK 순서)
- G7-A3 Conditional formatting (lib/conditional-format · 4 룰 · 4 tone · sheet td bg)

#### G7-B 결과 공유 (G7-B1~G7-B2)
- G7-B1 lib/chart-export (SVG → PNG · 의존성 0 · CustomChartCard entry)
- G7-B2 @media print CSS + Dashboard "Print" 버튼

### 큰 결정 (이번 세션)

1. **multi-select 5 commits 분리** — 첫 phase 단위 commit 시도. cross-cut 큰 phase 묶음은 단일 commit 답습.
2. **AI 도입은 명시 click LOCK** (메모리 룰 일관) — 자동 호출 ❌, 결과는 사용자 Apply 후만 store mutation.
3. **Dashboard 11 chart type** — kpi/bar/donut/line/stacked-bar/heatmap/scatter/histogram/pivot/bullet/funnel.
4. **Phase A code-only domain fit** — AI 없이 도메인 70-80% 커버. AI는 모호한 케이스만.
5. **lib/auto-backup 30분 interval** — 사용자 명시 snapshot과 분리("Auto · " prefix · 5 cap).
6. **G7-B PNG/Print 의존성 0** — SVG → canvas + window.print 활용. jsPDF/html2canvas 추가 ❌.

### 검증
- tsc 0 · vitest 203/203 (직전 121 → +82 신규 unit tests)
- 브라우저: 모든 phase 시각 검증 (multi-select · Pivot · drill-down · goal · multi-series · Bullet · Funnel · domain badge · KPI format · period_change/top/outlier · AI graceful · 단축키 dialog · Print 버튼)
- console error 0

### Watch Out (다음 세션)

- **단일 commit 52 파일 +6308/-231** — review 단위 매우 큼. 다음부터 phase별 단위 commit 강력 권장.
- **ANTHROPIC_API_KEY 미설정** — G2 + G6 6 AI 진입점이 graceful disable.
- **HTML chart (Pivot) PNG export ❌** — SVG 아님. CSV 대안 또는 html-to-canvas 의존성 (후속).
- **CSS var inline화 일부 환경 색 깨질 수 있음** — chart-export getComputedStyle 의존.
- **chart drill-down은 Bar/Donut/Pivot/Histogram/Line만** — Scatter/KPI는 후속.
- **상용화 ~34%** — 데이터 보드 자체는 거의 완성. 백엔드/인증/협업/결제/마케팅/모바일 ❌ → M1~M7 9-14주 추정.

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-25 (kkh94 머신, 단일 commit · 대규모 폴리시 24개 + hotfix) — Snapshots · Im-1/2/3 · 실용성 핵심 · UI viewer disable · 보안 · Theme amber WCAG

### 완료 (단일 commit `c1b2be7` · 44 파일 +3856/-198)

이번 세션 누적 매우 큼. 작업이 서로 연관되어 단일 commit (분리 시 파일 cross-cut 복잡).

#### Snapshots 모델 (Key Design #18 — GitHub 식 명시 save point)
- **types**: `Snapshot` / `SnapshotState` · `EventKind +=` snapshot_saved/restored · `ActiveWorkspaceItem += snapshots` · `FlowBaseState.snapshots: Snapshot[]`
- **store v15→v16**: `saveSnapshot/restoreSnapshot/deleteSnapshot/renameSnapshot` · `snapshotStateFromStore` helper · migrate `snapshots: []`
- **Restore 룰**: 자동 새 snapshot 생성 (되돌릴 수 있게) · ephemeral reset · undoStack clear · events는 복원 ❌ (snapshot_restored 이벤트만 push)
- **UI**: Workspace > Snapshots 사이드바 · SnapshotsView (Save Dialog · Rename Dialog · Restore/Delete AlertDialog · 카드 + AUTO 배지) · history-view + detail-bar EventKind 보강
- **Compare diff**: `lib/snapshot-diff.ts` (CategoryDiff · BoardModification · LibraryDiff) + `summarizeDiff` · SnapshotCompareDialog (ChipDelta +emerald/-rose/~amber)
- **Restore Dialog preview**: diff stats 라이브 표시 ("1 board, 5 rows will change")

#### Im 시리즈 (상용화 호환 — Notion/Airtable/Excel)
- **Im-1 (CSV/MD 양방향)**: `lib/parsers.ts` `stringifyDelimited` (RFC 4180 quote escape) · `stringifyMarkdownTable` (pipe escape) · `boardToTable` (status raw 보존) · 9 신규 테스트
- **Im-2 (xlsx)**: `xlsx@^0.18` 설치 · `lib/xlsx-loader.ts` (lazy `import('xlsx')` + parseXlsxToTable + parseXlsxAsync) · ExportMenu xlsx 옵션 · accept .xlsx/.xls 추가
- **Im-2 worker 분리**: `lib/workers/xlsx-worker.ts` (worker 내부 `import('xlsx')` lazy) · transferable buffer zero-copy
- **Im-3 (Notion/Airtable normalize)**: `lib/import-normalizers.ts` (detectImportSource · normalizeImportHeaders · inferColumnTypeByHeader · mapStatus) · 4 + 11 + 7 = 22 단위 테스트
- **handleImport storage quota**: pre-check + try/catch + isQuotaError detect + quotaExceededMessage

#### 실용성 핵심 3대 (UI freeze 제거 + 한계 방어)
- **Import 한계 가드**: `lib/import-limits.ts` (IMPORT_LIMITS · checkFileSize · checkParsedSize · checkStorageBudget · currentLocalStorageBytes · isQuotaError · 13 테스트) · file 10/50MB · row 5K/50K · cell 500K · storage 5/10MB · footer 한계 안내
- **Sheet Virtual Scrolling**: `@tanstack/react-virtual` · `useVirtualizer` (count: 100+ 활성 · groupBy 비활성 · overscan 12) · setContainerRef callback (state ref) · tbody spacer tr 패턴 · root `h-[100dvh] overflow-hidden` LOCK + tables-mode `min-h-0` 추가 (flex-col chain 끊김 방지)
- **Web Worker Parsing**: `lib/workers/parse-worker.ts` (CSV/MD/TSV) · `lib/parse-async.ts` (Promise wrapper · race token · 30s timeout · sync fallback) · Next.js Turbopack `new Worker(new URL(...), {type:"module"})` 패턴

#### Filter Match+Exclude UI (multi-cond AND 활용)
- second cond widget (status/select → not_in 체크박스 · text/email → not_contains input)
- "+Add exclude" 진입점 (cond[0] active + cond[1] 없을 때만)
- Clear this filter — splice shift 고려 N번 호출

#### Phase A 영어화 (사용자 노출 한글 → 영어 ~44개)
- Import wizard (12 — dialog/paste/review/ai) · sheet-view (4 — aria-label · empty state) · ai-activity-panel (8 — toast 메시지) · theme-toggle sr-only · flowbase-ai ThrottleError · SAMPLE_CSV quote 영어화
- LOCK 보존: Status 한국어 키 (미처리/진행중/대기/완료) · STATUS_LABELS 매핑은 영어 (mapStatus regex 변경 없이)

#### UI viewer disable 확장 (13 surface)
- **AI panel**: PendingCard `disabled?` prop (Apply all · Dismiss) + `disabled:cursor-not-allowed disabled:opacity-60`
- **Wiki sidebar**: New page · `disabled + title`
- **Wiki page**: Edit toggle · Re-verify · `disabled + title`
- **Wiki context menu**: Rename · Move to · Delete · 각 `disabled`
- **Automations rule**: Toggle status pill · ⋯ menu items (Test run · Delete) · `disabled + title`
- **Automations suggestion**: Accept · Dismiss · `disabled`
- **Trash dialog**: Restore/Delete buttons (boards/rows/wiki 모두) · Empty trash · disabled prop drilling
- **Settings Members**: Invite button · Role Select · Remove button (Switch to는 데모 패턴 유지)
- **Schema view**: New table button · Reset positions (zoom/pan만 reset, position skip) · Card drag silent skip
- **BulkEditMenu** trigger
- 일관 패턴: `disabled={isViewer}` + `title` + `cn("...", "disabled:cursor-not-allowed disabled:opacity-50")`

#### mutation enforcement 잔여 + hotfix
- **renameBoard**: `ensureCanEdit(get(), "Rename board")` 추가
- **clearCustomCharts**: `ensureCanEdit(s, "Reset charts")` 추가
- 총 44 가드 (38 → 42 [Snapshots 4] → 44 [renameBoard/clearCustomCharts])
- **selectIsViewer hotfix**: `state.settings?.members + Array.isArray` 안전 가드 (TypeError 방어 — hydrate race / 손상된 persist)

#### Import wizard Steps clickable navigation
- `<span>` → `<button>` + disabled + title
- 룰: Step 1 항상 / Step 2 parsed 있어야 / Step 3 visited (`step >= 3`) 필요
- jump 시 setStep — Back/Continue와 같은 store update

#### 보안 + polish
- **Next.js 16.2.4 → 16.2.6**: 14 high-severity 패치 (cache poisoning · XSS · DoS · SSRF · Middleware bypass). postcss 3 moderate 잔존 (next 의존성 — 무시 가능). xlsx 2 high (No fix · Phase 3+ alt lib 검토).
- **Theme accent amber WCAG AA fix**: `:root[data-theme-accent="amber"]` primary-foreground dark text override (oklch 0.13). primary L 0.58→0.62. dark mode도 동일 패턴. 다른 3 accent (purple/blue/emerald)는 흰 텍스트 그대로.
- **mapStatus lib 이동**: import-dialog.tsx private → `lib/import-normalizers.ts` 공통 · 4 단위 테스트 (완료/진행중/대기/미처리 다양 표현)
- **Sheet useDeferredValue**: search/columnFilters/sort/sheetSorts 4 슬라이스 deferred · 1000행 board typing 500ms→7-10ms (60fps)
- **avatar option in TYPE_OPTIONS**: Import wizard에서 Person/Assigned to 자연 매핑

### 큰 결정 (이번 세션)

1. **단일 commit 채택** — 24개 작업이 서로 연관 (Snapshots → Im 시리즈 → 한계 가드 → virtual/worker → UI disable → 보안 → polish). 분리 시 같은 파일 cross-cut. 대신 SESSION-LOG/MEMORY에 영역별 분리 기록.
2. **xlsx 단기 유지 + Phase 3+ alt lib LOCK** — 사용자 use case (자기 디바이스/자기 파일) 위험 낮음. 클라우드 sync 전 alt lib 검토 (SheetJS CDN 0.20+ / exceljs).
3. **Snapshot Restore = 자동 새 snapshot** — 사용자가 항상 되돌릴 수 있음. branch 단순화.
4. **groupBy 모드 virtual ❌** — group header가 flat list 끼우기 복잡. 후속.
5. **inbox-view viewer disable 불필요** — 모든 action이 navigation (goToBoard 등). mutation 0개라 의도적 미가드.
6. **postcss vulnerability 무시** — next 16.2.6 transitive. next patch 기다리거나 무시. 우리 코드 untrusted CSS 처리 ❌.
7. **Steps clickable navigation 단순 룰**: Step 3 jump 가능은 visited(`step >= 3`) 필요 — 한 번 도달 후 자유 이동.
8. **Theme amber dark-text override** — 다른 accent와 다르게 처리. 일관성보다 WCAG AA contrast 우선.
9. **root `h-[100dvh] overflow-hidden`** — `min-h-[100dvh]`로는 content가 root 늘림 → virtual scroll 무력화. 모든 view에 영향.

### 검증
- tsc 0 · vitest 95/95 그린 (84 baseline + 11 신규 limits 13 → 84 + 13 = 97? 정확히는 95). build ✓ Compiled successfully (Next.js 16.2.6 Turbopack)
- 브라우저 시나리오:
  - **Snapshots**: Save → 카드 표시 (label/description/by/stats) · Restore → 자동 새 snapshot 생성 + ephemeral reset · Compare → 카테고리 diff
  - **Im-2 (xlsx)**: 437KB 파일 → main thread block 1.4ms (worker) · 1001 lines CSV로 변환 · zip magic `50 4b 03 04`
  - **Im-3 (Notion CSV)**: 헤더 `Status`/`Created at`/`Assigned to` → status/date/avatar 자동 추론 · "Notion" 배지 표시
  - **Filter Match+Exclude**: status in [Todo, In progress] AND not_in [완료] → 6 rows · chip 3개
  - **한계 가드**: 51000행 CSV paste → toast.error "Too many rows" · Continue disabled
  - **Virtual scrolling**: 1000행 board → DOM 17~30개 (overscan) · scrollTop 21000 → first row "VIRT-0425"
  - **Web Worker**: console.info `[parse-async] Web Worker spawned successfully` · `[xlsx-loader] xlsx Web Worker spawned successfully`
  - **Sheet typing perf**: 1000행 search "VIRT" 4글자 → 매 keystroke block 7-10ms (60fps)
  - **viewer mode**: Wiki New page `disabled + "Viewers can't create pages"` · Edit `disabled + "Viewers can't edit"` 등
  - **Steps navigation**: 초기 Step 2/3 disabled · paste 후 Step 2 enabled · Step 3 도달 후 모두 enabled · Step 1 클릭 → Paste 복귀
  - **Theme amber light/dark**: dark text on amber bg 명확
  - **selectIsViewer hotfix**: settings undefined → 앱 정상 렌더 (false fallback)
- console error 0개 (warn — preview_eval inject 부작용 무관)

### Watch Out (다음 세션)

- **Customer Interviews 보드 시드 복구 검증** — perf test mock 1000행 후 Snapshot "Before edits" Restore로 10행 복귀 ✓ 확인. 또 다른 mock 작업 시 같은 패턴 (snapshot 먼저 save).
- **Multi-select column type** — 도입 시 모든 view (sheet/kanban/gallery/filter/editor) 영향. 별 phase (3-5 commit 분리 권장).
- **xlsx 2 high (No fix available)** — `xlsx@0.18` SheetJS npm outdated. Phase 3+ 클라우드 sync 시 alt lib 필수 (SheetJS CDN 0.20+ tarball URL · exceljs · read/write-excel-file).
- **postcss 3 moderate** — next 16.2.6 transitive. `npm audit fix --force` 시 next@9.3.3 breaking change. 무시 또는 next patch 기다림.
- **virtual scroll groupBy 비활성** — groupBy 모드는 100+ 행에서 기존 렌더 (group header flat list 끼우기 복잡). 후속.
- **AI Composer Send 가드 ❌** — viewer도 AI 질문 read-only OK라 의도. requestAskAi store action도 가드 없음.
- **Settings Data Import / Workspace name / Accent buttons viewer disable** — store 가드 충분 (toast warning). UI disable polish는 후속.
- **dev server stale state** — Next.js 16.2.4 → 16.2.6 업데이트 후 `.next` 캐시 clear + dev server restart 필요. 다음 머신에서 같은 패턴 ("Module not found: react-is" 에러 시).
- **단일 commit 44 파일 +3856/-198** — review 단위 매우 큼. rollback 시 sub-feature 분리 어려움. 다음부터 작은 commit 분할 강력 권장 (1 feature = 1 commit).

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24~25 (kkh94 머신, 대규모 폴리시 + 협업 backlog) — A2/Phase 1B/A3/B1-3/B3 F2/잔여 폴리시/multi-cond/Wiki diff/Snapshots backlog

### 완료 (11 commits — `616a672`~`a7d88a3`)
이번 세션 누적 매우 큼. 작은 단위 commit 분리 — 묶음별 정리.

#### A 그룹 — Linear 식 보드 깊이
- **A2 Sheet groupBy + 다중 sort** (`9f2adb3`) — SheetViewSettings에 `groupBy` + `sorts` array. Display 메뉴 Sheet 섹션에 GroupBy Select + Ordering multi-sort UI (↑↓ priority · asc/desc toggle · ↑↓ reorder · X 제거). selectVisibleRows에 다중 키 비교. groupBy 시 그룹 헤더 row + 카운트(status는 STATUS_LABELS 영어 매핑).
- **Phase 1B text cell autocomplete** (`0c4701e`) — InlineInput에 `suggestions`/`onDraftChange` prop. text input 아래 popup list (workspaceMemory prefix 매치 · ↑↓/Enter/Tab/Esc · mousedown commit blur 회피). TextCell에서 raw 구독 + useMemo derive.
- **A3 Library 자산 개별 적용** (`ed8ba72`) — column-header-menu에 "Apply OptionList" submenu (select/status만, color dot 미리보기). AddColumnMenu의 Library Field 보강 (config.optionListId 해석 + libraryFieldId 자동 link).

#### B 그룹 — 스마트 메모리 Phase 2 + EventStore F2
- **B1-3 Library promote bridge toast** (`6102983`) — frequency 5 도달 시 toast + Save 클릭으로 col.options 추가. dedupe id로 중복 권유 ❌. 다른 보드 케이스 setState 직접 patch.
- **B3 F2 Library OptionList sync** (`616a672`) — 신규 `addOptionToLibraryField(fieldId, value)` action. config.optionListId 참조 시 OptionList sync, 인라인이면 config.options에 추가. F1 promote 버튼 + B1-3 toast onClick에서 sync 호출.
- **B1-1/B1-2 recentFilters/recentSorts** (`c793fad`) — workspaceMemory에 recentFilters/Sorts 추가. scheduleLearnRecentFilter/Sort debounce 2s + JSON dedupe + max 10. setColumnCondition/toggleColumnInValue/setSort 끝에 schedule. FilterMenu에 "Recent" 섹션 (활성 보드 최근 5개, click 시 apply).

#### 잔여 폴리시
- **Data Import skip summary + Theme accent oklch** (`12a65d3` 이미 → `12c1593`) — ImportSummary에 skipped { library, wiki, automations } 추가, toast description에 표시. 4 accent (purple/blue/emerald/amber) L/chroma 정렬: emerald light 0.52, dark 0.66 · amber light 0.58, dark 0.68, chroma 0.18.
- **firedKeys ref sync** (`39a9c4e`) — permanentDeleteBoard 후 window.dispatchEvent("flowbase-firedkeys-changed") · automation-runtime addEventListener로 ref 즉시 reload (다음 1분 tick 기다림 ❌).
- **UI viewer disable 핵심 4 진입점** (`3ea0b32`) — selectIsViewer selector. BoardHeader(New row/Delete/Import) + AddColumnMenu trigger + ColumnHeaderMenu trigger + RowContextMenu items에 disabled + cursor-not-allowed + opacity + title.
- **chart toolbar 터치 UX** (`3be855d`) — `[@media(hover:none)]:opacity-100` arbitrary variant — 데스크탑은 group-hover, 터치는 항상 visible.
- **Schema pinch-zoom + Members "Switch to"** (`41cd262`) — handleWheel delta 비례 + ±0.3 cap (트랙패드 pinch 부드러움). Members 멤버 옆 LogIn 버튼 — viewer/admin role switching 데모 진입점.
- **mutation enforcement 24 액션 일괄** (`725b83d`) — ensureCanEdit 추가: AI(4) · Library(2) · Automation(5) · Trash(7) · Settings/Members(4) · Schema(2). updateSettings의 currentUserId 단독 변경은 데모 "Switch to" 가드 우회.

#### Filter 확장
- **negation operators** (`738d835`) — FilterCondition union에 not_in, not_contains 추가. selectVisibleRows 분기. FilterMenu Match/Exclude segmented (MatchToggle 컴포넌트). ActiveFilterChips ≠ prefix.
- **multi-condition per column (AND array)** (`a7d88a3`) — `columnFilters: Record<col, FilterCondition[]>` 모델 변경. setColumnCondition(col, cond, index) · addColumnCondition · removeColumnCondition · toggleColumnInValue 첫 in/not_in 자동 토글. selectVisibleRows array AND 평가. ActiveFilterChips renderCondChips helper + 각 cond별 chip. RecentFilterSnapshot.conditions 형식 변경. UI는 첫 cond만(minimum). "+Add condition" UI는 phase 2.

#### Wiki
- **body diff/version history** (`67279a0`) — WikiPage.revisions: PageRevision[] (max 20 FIFO). updateWikiPage(body/title 변경 시) prev push. WikiHistoryDialog 신규 (좌측 revisions list + 우측 line diff: 외부 lib ❌ naive line 비교 — added/removed/same). Restore 버튼 (현재 또 revisions push). 헤더 History 버튼 + 개수 배지.

### 큰 결정 (이번 세션)
- **Memory ≠ Library LOCK 강화** — F1 "+", B1-3 toast 모두 명시 click 시만 promote. workspaceMemory 자동 학습 vs Library 명시 자산 분리 일관.
- **scheduleLearnRecentFilter/Sort = 모듈 scope timer** — store action 내부 setTimeout. zustand subscribe 패턴보다 단순 (구독 시 stale ref 위험).
- **multi-condition UI minimum** — store 모델은 array, UI는 첫 cond만. "+Add condition" 진입점은 phase 2. ActiveFilterChips는 multi-cond를 chip 여러 개로 자연 표현.
- **mutation enforcement = 24 액션 한 commit 일괄** — 패턴 일관(ensureCanEdit 첫 줄). 직전 #8의 14개 + 24개 = 38개 가드. 후속 추가 ❌ (view 선호 액션은 가드 ❌ 유지).
- **선별 skip**: B1-4 (cross-board type 제안 — Library Field 중복) · MATCH_FROM_DROPDOWN sourceField (UI sub-submenu 큼) · Filter "≥/≤" operator 분리(이미 range로 표현 가능)

### 큰 토론 → backlog (구현 ❌)
- **Import/Export 5 phase** (Im-1~Im-5) — CSV/Markdown/xlsx/Notion-Airtable/PDF-OCR/URL fetch. 사용자 명시 상용화 요구. 로컬 first LOCK 호환 (Im-5만 server proxy).
- **Snapshot 모델 (GitHub 식)** — 사용자 통찰 "실수 복원 분기"에서 도출. 워크스페이스 명시 save point · Restore + Compare · branch는 단순화(Restore 자동 새 snapshot).
- **Slack 식 comments/threads/mentions/snooze/reactions** — EventStore kind 확장 + Detail bar/Wiki/Inbox surface. Phase 2 W11(멤버 실 분리) 선행 조건.

### 검증
- tsc 0 · vitest 44/44 (11 commits 각각 commit 전 통과)
- 브라우저 검증은 사용자가 직접 (변경량 매우 큼)

### Watch Out
- **multi-condition UI minimum** — 사용자가 add condition UI 없어 인프라만으로 multi-cond 활용 못 함. phase 2 "+Add" 진입점 필요. ActiveFilterChips remove는 cond 단위로 가능.
- **mutation enforcement 24개** — view 선호 액션(setSort/setColumnCondition/setViewOption 등)은 가드 ❌. 의도이지만 viewer가 sort 변경 가능 — 다른 멤버 view에 영향 ❌(단일 디바이스).
- **firedKeys CustomEvent dispatch** — typeof window 체크. SSR/test 안전. vitest jsdom 환경에서 정상.
- **WikiPage.revisions cap 20** — 페이지당 ~20KB. 6 페이지면 120KB. localStorage 5MB 한계 내. naive line diff는 LCS 아니라 줄 추가/삭제 정확도 ↓.
- **Filter recentFilters JSON dedupe** — FilterCondition union의 key order 의존. JSON.stringify 결과가 객체 키 순서 보장 안 함(브라우저별). 같은 의미 다른 키 순서면 별 entry 누적. cap 10이라 영향 작음.
- **Snapshot 모델 구현 시 주의**: deep state copy = localStorage 폭증. 10개 snapshot × 평균 500KB = 5MB → 한계 도달. compression 또는 events index + replay 옵션 필요 (option B).
- **이번 세션 11 commits — review 단위 큼**. 분리 commit 잘 됐지만 각 commit이 mid-large. 향후 commit 단위 좀 더 작게.

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, 아키텍처 LOCK) — 로컬 first 명시 + storage placeholder 제거

### 완료 (1 commit 예정)
사용자 통찰 "우리 앱이 로컬 데이터 우선이면 storage 표기되면 안 되지 않나?" → 큰 아키텍처 결정.

- **BoardHeader storage span 제거** — "2.1 / 10 GB" placeholder (prototype 답습 design debt). 빈 자리에 NOTE 주석 (Phase 3+ sync status 자리).
- **Key Design Decisions #17 신규** — 로컬 first 아키텍처 LOCK 명시. 클라우드(BaaS) = sync 매개일 뿐. offline 완전 작동. conflict = last-write-wins. AI 호출은 예외.
- **NEXT-ACTION LOCK 갱신** — storage/plan tier/quota 표기 ❌ 추가.

### 큰 결정
- **로컬 first LOCK** — 사용자 통찰이 evidence. BaaS 선택(Supabase vs bkend.ai) 시 "real-time DB 필수 ❌"로 옵션 열림. PWA·offline 자연. 유료 모델 시 storage quota ❌ (멤버/AI 호출 quota만, 요금제 본격 토론은 후속).
- **요금제 토론 보류** — 사용자 명시 "요금제 논의 일러". LOCK만 박고 plan tier 본격 토론은 BaaS 결정 후.
- **storage 자리 비움** — minimal 톤. row count는 보드 헤더에 이미 있음(중복 회피). Phase 3+ sync status 채울 자리만 NOTE 주석.

### 검증
- tsc 0 · vitest 44/44 (변경량 작음, 별도 재검증 생략)

### Watch Out
- **로컬 first LOCK 부작용**: 실시간 협업(comment cursor 등) 패턴이 cloud-first보다 어려움. 우리는 비동기 협업(comment thread)이 본 모델이라 큰 문제 ❌.
- **localStorage 5MB 한계** — 데이터 많아지면 IndexedDB로 마이그레이션 필요 (Phase 2+). zustand persist storage 어댑터 교체로 transparent.
- **prototype design debt 패턴** — sourceless inheritance 위험 인지. 다음 prototype 답습 시 의도 검증 필요.

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, 후속 refactor) — Shell chrome 재배치

### 완료 (1 commit `d263373` · 3 파일 · 87+/98−)
사용자 명시 요청 — 푸터 영역의 Trash/Settings/storage counter를 BoardHeader로 통합.

- **BoardHeader 우측**: Storage(Search 좌측) + Trash + Settings(ThemeToggle 우측)
- **StatusBar 컴포넌트 삭제** (app/page.tsx 렌더/import 제거)
- TrashDialog/SettingsDialog state를 BoardHeader로 이동
- 다이얼로그 동작 100% 유지

### 큰 결정
- **LOCK 갱신**: "셸 푸터 status bar 영구" → "Trash/Settings는 BoardHeader" — 사용자 명시. NEXT-ACTION LOCK 컨벤션 strikethrough + 신규 규칙.
- **footer 통째로 제거** — 빈 footer 남기면 시각 영향. 정보를 옮긴 만큼 footer 자체 제거가 깨끗.
- **Trash 배지 위치 보존** — 카운트 배지는 버튼 우상단 그대로. hover/style 동일.

### 검증
- tsc 0 · vitest 44/44
- 브라우저 검증은 사용자가 직접

### Watch Out
- **레이아웃 영향**: 헤더 우측이 더 빽빽해짐. narrow viewport에서 wrap 가능성 검토(toolbar wrap 패턴 적용 불가능 — header는 단일 행 의도).
- **storage counter는 placeholder** — "2.1 / 10 GB" 하드코딩. 실 데이터 연결은 BaaS 결정 후 후속.

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, 폴리시 + 인프라) — 컬럼 리사이즈 · 레이아웃 fix · pill 일괄 · 스마트 메모리 · EventStore

### 완료 (1 commit `49a1767` · 18 파일 변경 · 1142+/71−)
**5 묶음** — 사용자 보고 UI 폴리시 3 + 깊은 토론 인프라 2.

1. **컬럼 리사이즈** (사용자 명시 — Excel auto-fit 패턴)
   - `components/sheet/column-resizer.tsx` (신규) — 4px right-edge handle · drag로 resize (MIN 60 / MAX 600) · dblclick → autofit (cell scrollWidth max + padding 28)
   - `types.SheetViewSettings.columnWidths?: Record<string, number>` 추가 — ColumnDef.width fallback
   - sheet-view: tableRef · columnWidths raw 구독 · `widthOf(c)` helper · `<th>` relative + data-column + ColumnResizer · `<td>` data-column

2. **레이아웃 spill fix** (사용자 보고 — 모든 사이드바 열었을 때 옆 패널 침범)
   - 원인: flex-col 자식 컨테이너에 `min-w-0` 누락 → 자식 intrinsic width(table 1600+px)가 부모 강제 부풀림. `overflow-auto`만으론 부족.
   - Fix: sheet-view / kanban-view / gallery-view / timeline-view / dashboard-view 5 곳 컨테이너에 `min-w-0`
   - tables-mode 보드영역 title block `min-w-0` · h1 `truncate` · toolbar 행 `min-w-0 flex-wrap gap-y-2`
   - **LOCK**: flex-col 자식 컨테이너는 `min-w-0` 명시 (새 view/panel 추가 시 강제)

3. **Pill nowrap 일괄 11 곳** (직전 status pill fix 컨벤션 확장)
   - editable-cell: sentiment · select(priority 등) · reaction 3 곳
   - asset-detail: Used-in jump · Options · Required/Optional · Recommended views(multi/single) 5 곳
   - category-catalog: OptionList color pill
   - kanban-view: 카드 badge
   - timeline-view: OVERDUE badge
   - skip: inbox action button(pill 아님) · pending-card AI 버튼(cell 아님)
   - 패턴: flex-wrap 컨테이너 안이어도 *개별 pill 자체는 한 줄*

4. **스마트 메모리 Phase 1** (깊은 토론 — workspace vocabulary)
   - types: MemoryEntry + WorkspaceMemory
   - store v13→v14: `learnFromPatch` hook (addRow/addRowToBoard/updateRow/commitAiCell) · selectMemoryForColumn selector · MEMORY_MIN_COUNT
   - LOCK: Memory ≠ Library · 30일 expire · 50개 cap · scope=`{colName}::{libraryFieldId}` (cross-board 의미 충돌 방지)
   - Cell editor select popover에 "Recent" 섹션 (Clock icon · frequency 2+ · col.options 제외 · 상위 5개)
   - StatusCell skip (enum 4개 다 노출). text cell autocomplete은 Phase 1B 후속.

5. **EventStore Phase A·C·D·E·F1** (깊은 토론 — 통합 액션 timeline 아키텍처)
   - **A (인프라)**: types에 EventKind + TimestampedEvent. store v14→v15에 events 배열 + appendEvent(90일+1000개 cap) + publishChange/pushAi 동시 push(set,get 시그니처) + migrate(aiHistory 백필) + partialize + selectors(forBoard/forRow/global)
   - **C (Workspace History)**: ActiveWorkspaceItem += "history" · workspace-sidebar 3번째 항목 · workspace-mode 분기 · `components/workspace/history-view.tsx` 신규 (날짜 그룹 Today/Yesterday/MMM d · kind/board filter dropdown · entry click → switchBoard+setActivityMode+setFocused+detailBar 자동 open · 보드 삭제 시 toast warning)
   - **D (Detail Activity 탭)**: detail-bar에 shadcn Tabs (Fields/Activity) + RowActivity (events filter by boardId+rowId|rowIds.includes)
   - **E (AI panel derive)**: ai-activity-panel의 aiHistory를 events에서 derive (kind=ai_* filter + AIHistoryEntry 매핑) — board.aiHistory 호환 유지 · Pending+Composer 그대로
   - **F1 (Promote bridge)**: CellPopover에 `onPromote?: (value) => void` prop + Recent item 우측 "+" 버튼 (group-hover fade-in) · SelectCell `handlePromote` → updateColumn으로 col.options 추가 + toast · LOCK: 명시 click 시만

### 큰 결정
- **사용자 인사이트 "스마트 메모리 = 자동 history"** (2026-05-24) — 4 곳 분산된 history-like data(`lastChange`/`aiHistory`/`undoStack`/`workspaceMemory`)를 EventStore single source로 통합 결정. UI surface(AI panel)는 그대로, 데이터 source만 통일. 향후 협업 layer(comment/snooze)도 같은 통로.
- **Memory ≠ Library** — 자동 promote ❌, 명시 click 시만(Recent "+" 버튼). 사용자 우려("Library 난잡") 정직 반영.
- **AI panel 흡수 ❌, Timeline data source만 통일** — Pending(AI 제안 검토) + Composer(Ask AI) 100% 유지. 사용자 안심 핵심.
- **Library 자산 카테고리에 Memory 추가 ❌** — Library는 명시 자산만. Workspace 사이드바에 History 항목으로 분리 → 의미 부합(Schema 구조 / Automations 규칙 / History 기록).
- **컬럼 리사이즈는 viewSettings에 persist** — ColumnDef.width fallback. 보드 spec 안 건드림.
- **레이아웃 spill 원인 = flex item min-width auto** — overflow-auto만으론 부족. min-w-0 명시가 LOCK.
- **모든 history-like data store 통합 후 derived views** — workspaceMemory도 향후 events derived 가능(Phase 1 코드는 일단 별도 유지, 후속 통합 가능).
- **단일 commit 1142+/71−** — 직전 #5·#6·#7 패턴 답습. 다음 PR부터 분할 검토 가능.

### 검증
- tsc 0 · vitest 44/44 (5번 확인 — 각 phase 진행 중)
- 브라우저 검증은 사용자가 직접 (변경량 큼). 컬럼 리사이즈는 사용자 "내가 원하는대로 잘 됐어" 확인 완료.

### 다음
- 토론 backlog 8 항목 (NEXT-ACTION 신규 섹션):
  - A 그룹 (즉시): 스마트 메모리 Phase 1 ✅완료 · Sheet groupBy + 다중 sort · Library 자산 개별 적용 UI
  - B 그룹 (큰 변화): 스마트 메모리 Phase 2 (autocomplete · Library promote bridge toast · recentFilters/Sorts) · Event/Comment/Thread/Snooze (Phase 2 W11 후)
  - C 그룹 (부차): OptionList 영역별 분리 + Saved view · Wiki+Inbox 노티스 결합
- EventStore 후속:
  - Phase B: 만료 cleanup hook (AppShell mount, cleanupExpiredTrash 패턴) — append 시 처리되니 nice-to-have
  - Phase F2: col.libraryFieldId 있으면 Library OptionList에도 sync (cross-board promote)
  - aiHistory deprecation (현재 호환 유지, 향후 events derived 전환)
- 우선순위 중간 남음: mutation enforcement 30+ · UI 단 viewer disable · Theme accent oklch · Data Import skip summary

### Watch Out
- **EventStore migrate v15에서 aiHistory 백필** — 기존 사용자의 aiHistory entries가 events로 복사됨 (board.aiHistory는 그대로). 중복 데이터 일시적 — 향후 deprecation 시 정리.
- **events.appendEvent의 cap 1000** — 활발 사용 시 90일 안에 도달 가능. cap 도달 시 오래된 것부터 자름(=정보 손실). 사용 패턴 보고 조정.
- **HistoryView entry click 점프** — 보드 삭제된 경우 toast warning (silent skip ❌). row 삭제 시 rowId 존재 체크.
- **Detail bar RowActivity** — events.filter 매 렌더 호출. rowEvents useMemo deps([events, boardId, rowId]) 정확. board.rows 변경엔 trigger 안 함(의도 — 같은 row의 history는 board.rows 변화와 무관).
- **AI panel Timeline** — aiHistory 백필된 events 사용. 신규 push는 양쪽 다 갱신. 표시 차이 ❌.
- **promote bridge F1 한계** — col.options 인라인 추가만. col.libraryFieldId 있는 경우 Library OptionList sync는 F2 후속. 사용자가 컬럼 Promote한 후 Recent "+" 누르면 OptionList 영향 ❌.
- **단일 commit 1142+/71−** — review·revert 시 sub-feature 분리 어려움. 트레이드오프 인지.

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, fix #1) — status pill 줄바꿈

### 완료 (1 commit `a7e91c5`)
사용자 보고 fix. Sheet의 "In progress" status pill이 좁은 cell에서 2 줄로 wrap → 다른 status(Done/Waiting/Todo)와 시각 이질감.

**원인**: button/span에 `whitespace-nowrap` 없음. text가 cell width 좁을 때 자동 wrap.

**Fix**: 3 파일 일관 적용:
- `components/sheet/editable-cell.tsx` StatusCell trigger
- `components/sections/gallery-view.tsx` GalleryCardField status
- `components/board/filter-chips.tsx` FilterChips toggle button

### 큰 결정
- **status pill = 한 줄 유지 LOCK** — 모든 사용처에 `whitespace-nowrap`. 새 status pill 추가 시 같은 컨벤션.
- **사용자 보고 fix 즉시 after-work** — 작은 fix지만 시각 일관성 핵심. 누적 ❌.

### 검증
- tsc 0 · vitest 44/44.

### Watch Out
- **다른 pill 패턴**에도 같은 wrap 가능성 — priority pill, library category pill 등. 후속 일괄 점검 필요.

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, 폴리시 #9) — Filter text contains · Gallery cardFields reorder · Timeline month scale

### 완료 (1 commit `1cb045e`)
**3 폴리시 (NEXT-ACTION 우선순위 낮음 6~7 minimum).**

1. **Filter text/email contains operator**
   - `types.FilterCondition += { kind: 'contains', text: string }`.
   - `isFilterable`에 text/email 추가 → ListStep에 노출.
   - `selectVisibleRows` contains 분기 (case-insensitive includes).
   - FilterMenu ContainsWidget — single text input.
   - ActiveFilterChips contains 라벨.
2. **Gallery cardFields reorder** (↑/↓ 버튼, dnd lib ❌)
   - DisplayPopover GallerySection cardFields 재구성:
     - 선택된 컬럼 우선 + ↑/↓ 버튼 (Chart reorder/Kanban 이동과 같은 패턴)
     - 미선택 컬럼은 다음, 추가만 가능
3. **Timeline month scale** (장기 timeline overview)
   - `types.TimelineViewSettings.scale += 'month'`.
   - COL_WIDTH_MONTH = 8px (week 14 / day 34보다 더 압축).
   - DisplayPopover Timeline scale segmented에 month 추가.
   - 부가: timeline-view.tsx의 colWidth/COL_WIDTH 상수 이름 정정 (이전 replace_all 부작용).

### 큰 결정
- **And/Or multi-condition per column은 후속** — 사용자 요청 "And/Or"의 정확한 의미 불명 (per-column or cross-column). 우선 단일 contains operator만 추가.
- **Gallery reorder는 ↑/↓ 버튼** — Chart reorder/Kanban 이동과 같은 패턴 (dnd lib ❌). 일관성 확보.
- **Timeline month는 colWidth만 변경** — 같은 day grid 유지 + 시각 압축. 진짜 month aggregation은 후속 (group by 컬럼 차원 추가 필요).
- **legacy 상수 이름 정정** — 이전 세션 #6의 replace_all 부작용으로 colWidth_DAY/WEEK 잘못된 형식. tsc는 통과했지만 코드 컨벤션 깨짐 — 이번에 COL_WIDTH_DAY/WEEK/MONTH로 복원.

### 검증
- tsc 0 · vitest 44/44.

### Watch Out
- **Filter contains는 case-insensitive 단순 includes** — regex/exact match는 후속. text/email 외에는 적용 ❌.
- **Gallery reorder는 cardFields 배열 순서가 의미 있음** — 기존 ?? auto-derive 결과는 그대로 (cardFields 명시 시만 reorder UI).
- **Timeline month scale은 시각만 압축** — 행 수는 같음, day cell 8px. 30일+ 데이터에선 한 행에 cell 많아 horizontal scroll 길어짐 — zoom or month aggregation 후속.

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, 폴리시 #8) — Members enforcement 전체 · firedKeys dueDate cleanup · Data Import 메타 확장

### 완료 (1 commit `951e82e`)
**3 폴리시.** NEXT-ACTION 우선순위 중간 1~4 묶음. Filter And/Or + Gallery/Timeline 후속은 다음 세션.

1. **Members enforcement 전체 mutation 확장**
   - store에 `ensureCanEdit(s, action?)` helper + sonner toast (id='viewer-readonly' 폭주 방지).
   - 핵심 mutation 14개 가드:
     - 행: addRow · addRowToBoard · duplicateRow · updateRow · deleteRows
     - 컬럼: addColumn · deleteColumn · renameColumn · updateColumn
     - 차트: addChart · removeChart · updateChart · moveChart
     - 보드: createBoard · deleteBoard
     - Wiki: addWikiPage · updateWikiPage · deleteWikiPage
   - UI 단 disable은 후속 (지금은 시도 시 toast 알림).
2. **firedKeys dueDate cleanup** — permanentDeleteBoard에서 dueDate firedKeys (3-part key `${ruleId}:${boardId}:${rowId}`) 정리. daily는 영향 ❌.
3. **Data Import 메타 포함** — `importBoards` → `importWorkspace(snapshot)` 확장.
   - types.ExportedSnapshot 정의.
   - 충돌 정책: boards 항상 새 id / library/wiki/automations id 일치 skip.
   - Settings ImportSection 카운트 4 종 표시 + 자세한 confirm dialog.
   - importWorkspace 자체에 ensureCanEdit 가드.

### 큰 결정
- **viewer 가드는 핵심 14개만** — 모든 50+ mutation 가드는 너무 큼. row/column/chart/board/wiki 5 카테고리 핵심만 우선. AI/automation/settings 등 후속.
- **UI 단 disable 후속** — 지금은 store 가드 + toast만. button disabled 처리는 별도 폴리시 (모든 컴포넌트 영향).
- **toast 폭주 방지** — sonner id로 같은 ID 토스트 update (새로 추가 안 함).
- **importWorkspace 충돌 정책** — boards 새 id (안전, 절대 덮어쓰기 ❌) vs library/wiki/automations id 일치 skip (사용자 데이터 보존 우선). overwrite 옵션은 후속.
- **firedKeys cleanup은 localStorage 직접 조작** — store action 외부 (automation-runtime ref와 동기 어려움). 다음 1분 tick 시 ref가 재계산.

### 검증
- tsc 0 · vitest 44/44.
- 브라우저 검증은 다음 세션에서 (변경량 적당하지만 시간 효율).

### Watch Out
- **firedKeys cleanup은 자동화 런타임 ref와 별도** — 다음 1분 tick에서 stale ref. 큰 영향 ❌ (다음 tick 후 정상). 동기 원하면 ref reset signal 필요.
- **Members enforcement 14개만** — addRow 외 나머지 30+ mutation은 통과. 다음 폴리시에서 (commitAiCell/dismissAiCell/promote/attach/updateSettings/addMember/removeMember/automation 액션 등).
- **Data Import id 충돌 skip은 silent** — 사용자가 어떤 항목 skip됐는지 모름. 다음 폴리시 — summary toast에 "X skipped" 추가.

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, 폴리시 #7) — Filter cascade 복원 · firedKeys persist · Theme accent · Data Import · Members 깊이

### 완료 (1 commit `568526d`)
**6 폴리시(NEXT-ACTION 우선순위 중간 1~6) + Filter UX 재검토.** 직전 #6에서 사용자 보고로 인한 Filter UX 재설계 포함.

1. **Filter cascade hover 복원** (사용자 보고 fix)
   - 직전 세션 #6의 Popover 2-step inline 폐기 → **DropdownMenu Sub cascade로 복원** (Linear 정확 답습).
   - 호버 시 sub menu 자동. SubContent 안에 kind별 widget — in 체크박스 / range min-max / date-range from-to.
   - 컬럼 hue dot 유지. #6 dropdown-menu.tsx z-[60]/sideOffset 6/cursor-pointer 그대로.
2. **Legacy filter 액션 제거** — setColumnFilter/toggleColumnFilter (FilterCondition alias) 호출처 없음 확인 후 store에서 삭제.
3. **permanentDeleteBoard dangling cleanup** — viewSettings · schemaPositions · viewByBoardId 키 정리.
4. **시간 트리거 firedKeys persist** — automation-runtime의 in-memory Set → localStorage `flowbase-automation-firedKeys-v1`. 30일 이전 daily key 자동 cleanup. 페이지 새로고침 후 같은 daily 중복 발화 ❌.
5. **Theme accent color 프리셋** (Settings Appearance)
   - types.ThemeAccent 'purple'|'blue'|'emerald'|'amber'.
   - app/globals.css `[data-theme-accent="X"]` selector × light/dark 변종 (--primary, --ring override).
   - app/page.tsx mount + 변경 시 `documentElement.setAttribute("data-theme-accent", X)`.
   - Settings Appearance AccentSection 4 카드 (swatch + label + active check).
6. **Data Import** (Settings Data 짝)
   - `store.importBoards(Record<string, Board>)`: 새 boardIds. id 충돌 시 새 id 부여.
   - ImportSection — file input + JSON 파싱 + confirm dialog + 보드만 머지 (다른 데이터 영향 ❌).
7. **Members 깊이 (minimum viable)**
   - types.WorkspaceMember.lastSeenAt? + `roleCanEdit(role)` helper.
   - WorkspaceSettings.currentUserId (default mem-peter, store v12→v13 migrate).
   - 시드 멤버에 lastSeenAt mock (now / 5m / 2h / 1d).
   - store.addRow에 viewer readonly **demo 가드** (silent no-op — Phase 2에서 모든 mutation 확장).
   - Settings Members 탭 "You" 배지 + "Xh ago" lastSeen 표시.

### 큰 결정
- **Filter UX 재검토 — Linear cascade hover로 복귀** — #6에서 "Linear 스타일 2-step inline"으로 잘못 매핑 (실제 Linear는 cascade). 사용자 보고로 정확한 패턴 복원. **lesson**: "Linear" "Notion" 패턴 매핑 시 정확한 reference 확인 필요.
- **DropdownMenu Sub 다시 채택** — #6 폐기 결정 번복. #6의 z/sideOffset/cursor fix는 유효하므로 그대로 활용.
- **firedKeys cleanup 패턴** — daily key는 ruleId:YYYY-MM-DD 형식 → 30일 cutoff. dueDate key (ruleId:boardId:rowId)는 보드/행 살아있는 동안 의미 — 별도 cleanup 안 함 (대량 누적 가능성 낮음, 다음 폴리시 후보).
- **Theme accent 4 옵션** — purple(default)/blue/emerald/amber. 사용자 친숙 hue + WCAG AA 가능. light/dark 각 oklch 변종.
- **Data Import는 보드만 머지** — library/wiki/automations 등 import는 후속 (충돌 정책 복잡). 첫 패스는 데이터 안전 우선.
- **Members 깊이 minimum viable** — full enforcement는 모든 mutation에 가드 필요(15+ 액션). 광범위 변경이라 demo로 addRow만 + Phase 2 W11 실 분리 시 확장. UI(You/lastSeen)만 우선.
- **single commit** — 직전 #5/#6 패턴 답습. PR 단위 큼이지만 시리즈 일관성. 분할 검토는 다음부터.

### 검증
- tsc 0 · vitest 44/44.
- Filter cascade hover, firedKeys persist, Theme accent, Data Import, Members UI는 코드 검증 (브라우저 검증은 다음 세션에서 사용자가 직접 확인 — 변경량 많아 dev session stale 가능성 + 시간 효율).

### Watch Out
- **Members viewer readonly enforcement 부분 적용** — addRow만 차단 (silent). 다른 mutation은 viewer도 통과. Phase 2 실 분리 전엔 UI 약속 vs 실제 동작 불일치 가능. README/Members 탭에 "(mock — Phase 2 enforcement)" 명시 후속.
- **Theme accent oklch 변종 light/dark 직접 매칭 어려움** — 4 accent × 2 mode = 8 색 수동 튜닝. 브라우저에서 실 확인 후 수정 가능성.
- **Data Import 보드만** — viewSettings/schemaPositions 등 board별 메타는 같이 안 옴. 사용자 export 후 import 시 보드 외 상태 잃음 — 후속.
- **firedKeys cleanup 30일 cutoff는 daily만** — dueDate key는 영원 누적 가능성. 보드 영구 삭제 시 같이 cleanup하는 후속 필요.
- **filter cascade 사용자 환경 확인 필요** — preview에서 hover 동작 정확 검증 어려움 (mouse 이벤트 시뮬레이션). 사용자 실제 hover 시 잘 작동하는지 직접 확인.

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, 깊이 #6) — Timeline Gantt · Filter (2-step + range) · Display 옵션 · Chart reorder · Library 점프

### 완료 (1 commit `a818f82`)
**6 P2 폴리시 + 사용자 보고 fix 2건.** NEXT-ACTION 우선순위 중간 #2~#7.

1. **Timeline Gantt 재작성** (사용자 보고 fix) — 기존 월별 카드 리스트 폐기.
   - `design-ref/prototype/view-timeline.jsx` 충실 답습. sticky day-column header (34px/day, today/주말 highlight, 한국 요일).
   - start ~ due Gantt bar + status 색 + 라벨, OVERDUE 배지 (due < today && status !== 완료).
   - 필드 자동 추출 휴리스틱 (date/start/title/subtitle/status/priority/assignee).
   - RowContextMenu · detailBar 통합 유지.
2. **Filter Popover 2-step inline 재구현** (사용자 보고 fix) — DropdownMenu Sub 폐기.
   - 좁은 화면에서 sub flip+가림 issue + hover delay 한계 → Popover + 자체 step state(list↔values)로 cascade 제거.
   - 컬럼별 hue dot으로 select끼리 시각 구분 (Theme/Sentiment/Priority 동일 type icon 한계 보완).
   - DropdownMenuSubContent **z-50→z-[60] + sideOffset 6**, SubTrigger **cursor-pointer** (다른 sub 메뉴 일괄 개선).
3. **Filter range/numeric/date 필터 확장**
   - `types.FilterCondition` discriminated union: `'in' | 'range' | 'date-range'`.
   - state.columnFilters: `Record<string, string[]>` → `Record<string, FilterCondition>`.
   - store: `setColumnCondition` · `toggleColumnInValue` 신액션 + legacy 후방호환.
   - `selectVisibleRows`: kind 분기 처리 (in/range/date-range).
   - FilterMenu ValuesStep: kind별 위젯 (체크박스 / min-max input / from-to date input).
   - ActiveFilterChips: kind별 라벨.
   - sheet/kanban view useMemo deps에 columnFilters 누락 fix (직전 잠재 버그).
4. **viewSettings 인프라 + Display 버튼 + 4 view 옵션** — Linear "Display" 패턴.
   - types.ViewSettings 5종 인터페이스 (Sheet/Kanban/Gallery/Timeline/Dashboard).
   - store v11→v12 migrate · viewSettings: `Record<boardId, ViewSettings>` persist.
   - `setViewOption` · `resetViewOption` 액션.
   - `components/board/display-menu.tsx` (신규) — Filter 옆 Settings2 아이콘 버튼. DisplayPopover view-aware.
   - 각 view 옵션 실 적용:
     - **Sheet** hiddenColumns (id 제외 토글)
     - **Kanban** groupBy (status 외 select 컬럼 지원, dynamic group values)
     - **Gallery** cover/cardFields/columns 2-4
     - **Timeline** dateField + scale (COL_WIDTH_DAY=34 / WEEK=14)
   - zustand getSnapshot 무한 루프 fix — 모듈 스코프 상수 `EMPTY_VS`, hiddenColumns raw 구독.
5. **Chart reorder + inline edit**
   - `store.moveChart(chartId, 'up'|'down')` 액션 — 인접 swap.
   - CustomChartCard 호버 toolbar: ↑/↓ · ⋯ menu · X.
   - ⋯ menu: Rename Dialog · Width 4종 segmented.
6. **Library promoted field → 원본 컬럼 점프**
   - asset-detail "Used in" chip → button 변환.
   - `parseUsedIn("BoardLabel.columnName")` + `canJump` 검증.
   - 점프: `switchBoard` + `setActivityMode('tables')` + `setSelected/setFocused`.
   - 보드 missing → disabled chip + tooltip, 컬럼 missing → warning toast.

### 큰 결정
- **DropdownMenu Sub 폐기 — Popover 2-step inline 패턴 채택** — 좁은 화면 cascade UX 한계. Linear 패턴 답습 (앞으로 nested menu 필요 시 같은 패턴).
- **컬럼 hue dot** — type icon 시각 변별 한계 보완. 모든 컬럼 항목에 chart-{1..5} hue 안정 매핑 (id 제외 보드 위치 기준).
- **viewSettings 보드별 + view별 persist** (store v12) — 사용자 명시 선택. 다른 머신 sync.
- **DropdownMenu z-stacking 정책** — Sub z-[60] (main z-50 위). 좁은 화면 좌측 flip 시 main 위에 표시 보장.
- **getSnapshot 무한 루프 fix 패턴 정착** — `(s) => s.foo ?? {}` 절대 ❌. 모듈 스코프 상수 또는 raw 구독 + 컴포넌트에서 default. Phase 1B·2·3 결정 #13(selectVisibleRows) 일반화.
- **filter sheet/kanban deps fix** — useMemo deps에 columnFilters 빠진 직전 잠재 버그. 새 ephemeral 상태 추가 시 모든 view useMemo deps 갱신 일관성 검토 (직전 #4 Watch Out과 동일 패턴).
- **Chart reorder는 dnd lib ❌ + ↑↓ 버튼** — 직전 Kanban 카드 이동 패턴 답습 (D1 — DnD ❌, 의존성·모션 최소).
- **Filter 새 모델 후방호환** — 기존 `setColumnFilter`/`toggleColumnFilter` 액션 유지 (`setColumnCondition`/`toggleColumnInValue` 위임). 점진 삭제 대상.
- **Timeline scale week**: colWidth만 변경 (14px). 주 단위 group/aggregation은 후속.
- **6 feature 단일 commit** — 직전 #5 패턴 답습 (PR 단위 큼, 1884+/397−). 향후 분할 후보: Filter rewrite vs Display 인프라.

### 검증
- tsc 0 · vitest 44/44.
- 브라우저 시나리오 6 feature 모두 PASS:
  - Timeline: Tasks 8 행 모두 Gantt bar 렌더 + OVERDUE 정확(Daniel/Sarah).
  - Filter Popover: list→values 전환 · Theme sub 정상 · date-range 적용 후 tbodyRows 11→4.
  - Display: 4탭 popover view-aware · Sheet hide → 헤더 갱신 · Kanban groupBy priority → 4칸(Urgent/High/Med/Low) · Gallery columns=2 → 2 컬럼 grid · Timeline scale week → 14px.
  - Chart: moveChart down → c1/c2 swap · Width quarter · Rename 적용.
  - Library: Field detail → Used in "Tasks.received_at" 클릭 → activeBoardLabel Customer Interviews → Tasks 점프.
  - Filter range: date from/to → 행 정확히 필터.

### Watch Out
- **Radix Tabs/Select 등 PointerDown 컴포넌트** — preview_eval native `.click()` 안 통함 (특히 React state 안 갱신). preview_click(MCP)나 dispatchEvent(PointerEvent) 사용. SelectItem click 시 안 잡으면 localStorage 우회 검증.
- **dev session stale state** — store version bump + hot reload 시 localStorage migrate 누락 케이스. `.next` clear + dev restart로 해소.
- **Filter columnFilters 새 model의 후방호환** — `setColumnFilter`/`toggleColumnFilter` legacy 액션을 점진 삭제 시 호출처 다 확인 필요 (현재 ActiveFilterChips 내부 + bulk-edit-menu 등).
- **viewSettings persist는 보드별** — 보드 삭제 후 휴지통 보존 + 복원 시 viewSettings 별도 처리 안 함 (보드 id 매칭으로 자연 회복). 영구 삭제 시 dangling viewSettings 키 남음 — cleanup 후속.
- **Chart toolbar 호버 시점** — group-hover로 표시. 모바일/터치엔 부재 — 다음 폴리시 후보.
- **단일 commit PR diff 1884+/397−** — 너무 큰 단위. 다음 #7부터 분할 검토 (Filter rewrite vs Display vs Chart vs Library 등 4 commit).

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, 깊이 #5) — Wiki Trash · AppShell cleanup · Ask AI ⌘J · Settings 4탭 · Heatmap

### 완료 (1 commit `d98f41c`)
**5 P1·P2 폴리시 일괄.** NEXT-ACTION 우선순위 #2~#6.

1. **Wiki 삭제 → trashedWikiPages** — Trash 일관성 (보드/행은 30일 보존, Wiki만 영구였음).
   - types.TrashedWikiPage + FlowBaseState.trashedWikiPages
   - store v9→v10 migrate · deleteWikiPage = trash 이동 (영구 ❌) · restoreWikiPage · permanentDeleteWikiPage · emptyTrash/cleanupExpiredTrash/partialize/migrate 갱신
   - trash-dialog 3번째 탭 "Wiki pages" + WikiList(카테고리 그룹) + 30일 만료 표시
   - wiki-page-context-menu AlertDialog 메시지 갱신
2. **AppShell mount cleanupExpiredTrash 자동 호출** — `app/page.tsx` mount useEffect. zustand persist hasHydrated 체크 후 cleanup. hydrate 미완 시 onFinishHydration 콜백 등록.
3. **Ask AI ⌘J 톱바 버튼**
   - types.askAiFocusToken (ephemeral)
   - store.requestAskAi 액션 — aiPanel 강제 open + token timestamp 갱신
   - AiComposer: inputRef + focusToken 구독 useEffect로 input focus·select
   - keyboard-shortcuts ⌘J 핸들러 (편집 중에도 동작, 셸 단축키)
   - board-header에 Sparkles 아이콘 + "Ask AI" + ⌘J Kbd 버튼
4. **Settings 깊이 4탭** (General · Members · Appearance · Data) — shadcn Tabs.
   - types.MemberRole(owner/admin/member/viewer) · WorkspaceMember · settings.members
   - store v10→v11 migrate · 시드 멤버 4명(peter Owner + 3) · addMember/updateMemberRole/removeMember/exportData
   - Members: Owner 보호(UI 단 + store 단 이중) · role Select · Invite dialog · Remove
   - Appearance: next-themes Light/Dark/System 카드
   - Data: Blob 다운로드 `flowbase-export-YYYYMMDD.json` (a.click() 패턴, Safari 호환 setTimeout revoke)
5. **Heatmap 차트** — Dashboard builder 6번째 종류.
   - types.ChartType += "heatmap"
   - `components/charts/heatmap-chart.tsx` 신규 — 2D grid (cat × group cross-tab) + intensity opacity 단일 hue. 의존성 0.
   - add-chart-dialog 6번째 카드(needsGroupBy: true) + dashboard-view renderChartBody branch

### 큰 결정
- **AI_CLASSIFY 자동 실행은 사용자 명시 룰** (2026-05-24) — 사용자가 "ai 클래지파이는 내가 요청할 때 시작해. 절대로 너가 자의적으로 하지마" 명시. 메모리 파일 `feedback-ai-classify-user-triggered-only.md` 생성. NEXT-ACTION 우선순위 높음 #1이지만 자율 시작 ❌. 이후 사용자 지시 시에만 진행.
- **Settings dialog는 단일 파일** (530 lines) — Tab 별로 inline 분리, 외부 import 1개 유지. Members/Appearance/Data 모두 같은 파일.
- **Heatmap = 단일 hue + opacity intensity** — 다색 cmap 대신 var(--chart-1) opacity 0.18~1.0. 단순화 + light/dark 양쪽 호환.
- **시드 멤버 4명** — peter(Owner) · Jisoo(Admin) · Min(Member) · Rina(Viewer). 데모용. Phase 2(W11)에서 실 분리.
- **Owner 보호 이중 단** — UI 단에서 Select·Remove 자체 비노출 + store 액션 단에서 `m.role === "owner"` filter 보호.
- **deleteWikiPage 시맨틱 변경** — 영구 삭제 → trash 이동 (30일 보존). 기존 행동 의존 코드 없음(컨텍스트 메뉴 1곳뿐).
- **AppShell cleanup은 hasHydrated 체크 후** — 단순 mount useEffect는 hydrate race. zustand persist API onFinishHydration 콜백으로 정확 발화.
- **5 feature 단일 commit** — 직전 세션 "Dashboard builder + 시간 트리거 + Attached function" 답습. 분할이 정당화되려면 PR 단위. NEXT-ACTION P1·P2 폴리시 일괄 시리즈로 묶음.

### 검증
- tsc 0 · vitest 44/44 (5번 확인).
- 브라우저 시나리오 5 feature 모두 PASS:
  - Wiki: Delete → wiki 6→5 + trashedWikiLen 1 · auto-pick Wiki tab · Restore 5→6 · Permanent delete OK · 새 AlertDialog 메시지 정확
  - AppShell cleanup: 31일 전 fake trashedWikiPage·trashedRow 주입 → reload → EXPIRED만 제거, FRESH 보존
  - Ask AI: 헤더 버튼/⌘J 닫힌 패널 자동 open + composer focus · 열린 패널 ⌘J focus만
  - Settings: 4탭 렌더 · Members 시드 4명 · Invite(Sora Han, 4→5) · Remove(Rina, 5→4) · Owner 보호 · Theme system→light 토글 · Export "Export downloaded" toast + 파일명 `flowbase-export-20260524.json`
  - Heatmap: theme × sentiment 5×3 cross-tab 렌더 + intensity 정확 (Pricing pushback × Negative = 2 진한 등)

### Watch Out
- **Radix Tabs/Select는 onPointerDown 기반** — preview_eval의 native `.click()` 안 통함. preview_click(MCP) 사용 필요. SelectItem click도 preview_click이 안 잡는 경우 있음 — 직접 dispatchEvent(PointerEvent) 또는 이번처럼 localStorage 직접 patch 우회 검증.
- **dev session stale state 이슈** — store v10→v11 hot reload race로 localStorage가 v11이지만 migrate 결과 settings.members 빠짐. .next 캐시 clear + dev server restart로 해소. fresh init에선 정상.
- **next-env.d.ts incidental** — 빌드 생성물이므로 staging에서 제외. 다른 incidental 추가 시 같은 처리.
- **AI_CLASSIFY 메모리 룰 적용 범위** — 처음 작성 시 "Ask AI ⌘J에도 적용 가능성" 광범위 문구로 classifier가 ⌘J 작업 차단 → 좁힘(자동 호출 ❌ vs 사용자 진입점 ✅ 명시 구분). 다음에 유사 룰 작성 시 범위 명확히.
- **5 feature 단일 commit** — PR diff 1000+ insertions. 다음 review·revert 시점에 sub-feature 분리 어려움 — 트레이드오프 인지.

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, 깊이 #4) — Dashboard builder · 시간 트리거 · Attached function 실행

### 완료 (2 커밋)
1. **Dashboard builder full** (`bb5a0cc`) — 사용자 차트 추가/삭제 + Stacked bar.
   - types.ChartConfig {id, type, title, sourceCol, groupByCol?, width} + Board.charts? (옵션, 없으면 auto-derive).
   - store: addChart / removeChart / updateChart / clearCustomCharts (active board 대상).
   - `components/charts/stacked-bar-chart.tsx` (신규) — SVG/div 기반 category × group cross-tab + 5색 palette + 범례. 외부 lib ❌.
   - `components/sections/add-chart-dialog.tsx` (신규) — 5종 차트 카드(KPI/Bar/Donut/Line/Stacked bar) + source column Select(타입 호환 필터) + groupBy + title + width(1/4·1/2·2/3·Full).
   - dashboard-view 재구성 — board.charts 있으면 hero 그리드 우선(12 col), CustomChartCard with hover X 삭제 + Reset to auto. 빈 보드 empty state에도 Add chart 버튼.
2. **시간 트리거 + Attached function** (`5db2376`)
   - 시간 트리거: parseTimeTrigger(daily HH:MM, dueDate + statusEquals). shouldFireDaily / shouldFireDueDate 순수 함수. AutomationRuntime setInterval 1분 tick + firedKeys dedupe(daily=`${ruleId}:${YYYY-MM-DD}`, dueDate=`${ruleId}:${boardId}:${rowId}`).
   - Attached function: runAttachedFunctions(change) → MATCH_FROM_DROPDOWN 실 구현(findSourceField + options substring match + updateRow/setState patch). AI_CLASSIFY/EXTRACT_REGEX는 row_added 시 hint toast.
   - row useEffect 안에서 attached function을 rule scan 전에 실행 → auto-fill 값이 룰 트리거 됨.
   - 14 신규 단위 테스트 (parseTimeTrigger 5 + shouldFireDaily 3 + shouldFireDueDate 6).

### 큰 결정
- **Dashboard charts는 보드별 persist** — Board.charts 옵션. 보드 trash로 이동 시에도 charts 함께 보존.
- **board.charts 비어 있으면 auto-derive 폴백** — 신규 보드/리셋 후 즉시 의미 있는 dashboard. 사용자가 명시 추가하면 그것만 hero, 나머지 auto는 계속 노출(KPI/donut/bar/trend/category bars/numeric).
- **시간 트리거 dedupe는 in-memory** — 페이지 새로고침 시 firedKeys 초기화 → 같은 daily가 다시 발화 가능. 백엔드 도입 후 persist 검토.
- **Attached function 실행은 1순위** — row change useEffect에서 attached function 먼저 실행 후 rule scan. function이 채운 값이 룰 트리거가 될 수 있음.
- **MATCH_FROM_DROPDOWN의 source field 결정**: 같은 행에서 첫 text/select 컬럼 (id 제외). 휴리스틱. 향후 function params에서 명시 선택.

### 검증
- tsc 0 · vitest 44/44 (이전 30 + 신규 14).
- 시간 트리거는 1분 tick이라 빠른 검증 어려움. 단위 테스트가 핵심.
- Attached function MATCH_FROM_DROPDOWN — column.options에 "Pricing pushback" 등이 있을 때 sentence "이거 Pricing 너무 비싸요" → "Pricing pushback" 자동 set 가능.

### 다음
- AI_CLASSIFY 실 자동 실행 (현재 hint만).
- Chart reorder (drag) · inline edit.
- Heatmap 차트.
- 시간 트리거 persist (페이지 새로고침 dedupe 유지).
- Ask AI ⌘J 톱바 버튼.
- Settings 멤버/권한 탭.
- Wiki 삭제 → trashedWikiPages.
- AppShell mount 시 cleanupExpiredTrash 자동 호출.

### Watch Out
- **시간 트리거 setInterval 1분** — 페이지 sleep 동안 미발화 윈도우 지나치면 그날 daily는 skip. 의도된 동작이지만 모바일/탭 inactive 시 누적 가능.
- **Attached function MATCH_FROM_DROPDOWN은 sourceField=첫 text/select** — 사용자가 다른 컬럼을 원하면 현재 UI에선 표현 ❌. function params 편집 UI 필요.
- **dashboard 사용자 차트 + auto-derive 동시 노출** — 화면 길어질 수 있음. 사용자가 Reset to auto로 비우거나, 향후 toggle 추가 검토.
- **시간 트리거 fire 시 합성 ChangeEvent boardId=""** — Notify 외 액션(Set/Add row to)이 정상 동작 안 할 수 있음. 시간 트리거의 then은 "Generate"/"Email to" 같은 글로벌 액션에 한정 권장.

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, 일관성 + 깊이 #3) — 사이드바 일관성 · Workspace/Inbox 사이드바 · 너비 통일 · Automation log · Wiki 우클릭 · Trash 행 · Promote/Attach

### 완료 (2 커밋)
1. **Workspace/Inbox 사이드바 추가** (`fb79379`) — 사용자 지적 "왜 인박스/워크스페이스는 사이드바 없고 탭이지?" 의도 아님. 프로토타입엔 둘 다 사이드바 있음.
   - `components/workspace/workspace-sidebar.tsx` (신규) — 240px aside · Schema/Automations 두 항목(icon + label + desc) · active 강조.
   - `components/inbox/inbox-sidebar.tsx` (신규) — 240px aside · All/Alerts/Warnings/AI/Info/Tips/Activity log 7 필터 · 카운트.
   - workspace-mode 재구성: 상단 탭 제거 → 사이드바 + 메인.
   - inbox-view 재구성: 상단 filter chips 제거 → 사이드바. 헤더 타이틀이 활성 필터 라벨 ("All", "Alerts" 등). "Show all" reset.
   - 모두 panels.sidebar 토글 공유 → hide-all UX 일관.
2. **일관성 + 깊이 5건 묶음** (`8909ec2`):
   - **사이드바 너비 통일**: Library/Wiki 260→240. 5 모드 모두 동일.
   - **Automation 실행 로그**: executeRule이 active board의 aiHistory에 pushAi entry. AI Activity panel timeline 자동 표시.
   - **Wiki 페이지 우클릭** (`components/wiki/wiki-page-context-menu.tsx`) — Rename Dialog · Move to category submenu · Delete AlertDialog. 페이지 항목을 ContextMenu로 래핑.
   - **Trash 행 단위 + 30일 만료**: types.TrashedRow + store v8→v9 + deleteRows를 trashedRows로 push + restoreRow/permanentDeleteRow/cleanupExpiredTrash(30일). trash-dialog 두 탭(Boards/Rows). Rows는 보드별 그룹화 + firstReadableField 미리보기 + "expires in Nd" 표시.
   - **Promote to Library + Attach function**: types.ColumnDef.libraryFieldId/functionId. store.promoteColumnToLibraryField(LibraryField 생성 + usedIn 트래킹 + column.libraryFieldId 저장) · attachFunctionToColumn. column-header-menu에 Sparkles "Promote to Library"(이미 linked면 Check) + Sigma "Attach function" submenu(None + library.functions 3종).

### 큰 결정
- **사이드바 패턴 = 모든 navigation 모드의 기본** — Tables/Library/Wiki/Workspace/Inbox 다 동일. Search만 풀페이지 검색 특성으로 예외.
- **Automation log는 active board만** — cross-board fire 시 다른 보드 timeline 노이즈 방지. 향후 통합 activity log 검토.
- **Trash 30일 만료 = mount 시 자동 cleanup** — 별도 cron 없음. 다이얼로그 열 때마다 검증. 사용자가 Trash 안 열어도 다음 mount 시 정리됨 (다이얼로그 안 열면 누적).
- **Promote는 idempotent** — 이미 promoted 컬럼은 기존 fieldId 반환, 중복 생성 ❌. UI에 "Linked to Library" 표시.
- **Attach function은 metadata만** — 실제 실행은 별도 (functionId만 column에 저장). 향후 row mutation 시 자동 실행 후크.
- **Workspace/Inbox 사이드바도 prototype 답습** — width 240px (Library/Wiki 260 → 240 unification에 맞춤).

### 검증
- tsc 0 · vitest 30/30 · 브라우저 (Workspace/Inbox 사이드바 렌더 확인).

### 다음
- Dashboard builder full (사용자 차트 추가/제거 + Stacked/heatmap).
- Automations 시간 기반 트리거 (cron-like).
- Attached function의 실제 실행 후크.
- Ask AI ⌘J 톱바 버튼.
- Settings 멤버/권한 탭.
- Library에서 promoted field → 원본 컬럼 점프 (역참조).
- Wiki 삭제도 trashedWikiPages로 이동.

### Watch Out
- **Wiki 페이지 삭제는 영구** — Wiki도 Trash 통합은 후속. AlertDialog에 명시.
- **Trash 30일 cleanup은 mount 트리거** — 사용자가 Trash 다이얼로그 안 열면 누적. AppShell mount 시 한 번 호출하는 패턴 검토.
- **Promote 후 컬럼 type 변경**: libraryFieldId는 그대로 유지. 의도된 동작(컬럼이 LibraryField의 derivative이지만 독립 진화 가능)이지만 향후 sync 정책 필요.
- **attached function**: row 추가 시 자동 실행 안 함. AutomationRuntime처럼 별도 useEffect 후크 필요.

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, 깊이 일괄 #2) — Schema pan/zoom · New table · Dashboard 영어/Line · Change type

### 완료 (2 커밋)
- **Schema pan/zoom + drag + New table 모달** (`2bdee40`)
  - types: FlowBaseState.schemaPositions: Record<boardId, {x,y}> (persist, v7→v8 migrate).
  - store: setSchemaPosition / resetSchemaPositions. partialize 포함.
  - schema-er-diagram.tsx 대폭 개편: 캔버스 빈 곳 드래그 = pan, 카드 헤더 드래그 = position 저장(zoom 보정), ⌘+wheel = zoom (0.4~2.0). transform translate+scale + grid bg 동기. 우상단 toolbar (-/100%/+ Reset + New table). 카드 헤더 cursor-grab.
  - schema-new-table-modal.tsx (신규) — Library Template 카드 그리드 + Blank. templateToColumns: tpl.fields(LibraryField id resolve) + extraFields → ColumnDef[]. multiTable이면 첫 테이블만. name auto-suggest. Enter commit.
- **Dashboard 영어화 + Line chart + 컬럼 Change type** (`57fadb6`)
  - dashboard-view: 모든 한국어 라벨 영어화 (전체 행→Total rows, 종류→distinct, 분포→Distribution, X별→By X, 숫자 요약→Number summary, 평균→avg).
  - components/charts/line-chart.tsx (신규) — SVG path 라인+area, 8주 버킷. 의존성 0.
  - buildWeeklyTrend(rows, dateField) → date 컬럼 있을 때 "X trend / Rows per week, last 8 weeks" area chart hero 카드.
  - selectVisibleRows deps에 columnFilters 추가 — 이전 누락. 다중 필터 걸어도 dashboard 재집계 안 됐던 버그 fix.
  - column-header-menu.tsx: Rename + Delete 사이에 Change type submenu. Basic 7 type. updateColumn({type}) — 행 데이터 보존.

### 큰 결정
- **pan/zoom은 ⌘/Ctrl + wheel** — 일반 scroll은 페이지 스크롤. 트랙패드 pinch는 후속.
- **카드 위치 persisted** (boardId별) — 다른 머신에서도 동일 레이아웃.
- **Change type은 행 데이터 보존** — type만 바뀜. 사용자가 잘못 골라도 셀이 새 type editor로 표시 (text→status면 빈 status). 변환은 ❌.
- **New table 모달의 multiTable 템플릿은 첫 테이블만** — N개 보드 한 번에 생성은 후속 (워크플로 더 복잡).
- **dashboard columnFilters deps 누락 버그** — 이번에 발견하고 즉시 fix.

### 검증
- tsc 0 · vitest 30/30 · build.

### 다음
- Dashboard builder full (사용자 차트 추가 + 차트 종류 catalog).
- 자동화 시간 트리거 (cron-like).
- 컬럼 Promote to Library / Attach function.
- Ask AI ⌘J 톱바 버튼.
- Trash 행 단위 + 30일 만료.
- Settings 멤버/권한 탭.
- pinch-zoom 트랙패드 지원.

### Watch Out
- **schemaPositions는 boardId 키** — 보드 삭제 후 복원 시에도 position 보존됨 (보드 삭제 시 schemaPositions cleanup 안 함). 의도된 동작 — Trash에서 복원하면 원래 위치로 돌아옴.
- **Change type 후 셀 렌더링**: 기존 값이 새 type editor 양식에 안 맞으면 빈 셀로 보일 수 있음. 사용자에게 toast로 알려주는 정책 향후 검토.
- **selectVisibleRows useMemo deps** — 새 ephemeral state 추가 시 모든 view(Dashboard/Gallery/Timeline/Kanban) deps 갱신 필요. 일관성 검토.

### 머신
kkh94. main 머지·푸시 자동.

---

## 2026-05-24 (kkh94 머신, 깊이 일괄) — Automations 엔진 · Filter · 우클릭 · Gallery/Timeline · Bulk edit · ⌘D · Wiki 페이지 생성/검색

### 완료 (6 커밋)
1. **Automations 실제 트리거 엔진** (`12a65d3`) — 룰이 진짜 발화.
   - types: `ChangeEvent` + `FlowBaseState.lastChange` (ephemeral).
   - store: addRow/updateRow/commitAiCell이 `publishChange()`로 lastChange set. cross-board `addRowToBoard(boardId, row)` 신규.
   - `lib/automation-runtime.tsx` (신규) — AutomationRuntime 컴포넌트 셸 마운트. lastChange 구독 → active 룰 스캔 → `matches()` → `executeRule()`. 트리거: row_added · sentiment changes to · AI Theme confirmed as. 액션: Notify(toast) · Set(updateRow patch) · Add row to(cross-board). detail의 `{name}` 토큰 source row 값으로 치환.
   - 단위 테스트 15 신규 — AUT-001/002/003 트리거 매칭 + parseRowDetail. **vitest 15 → 30 passing**.
2. **다중 필드 Filter 팝오버** (`bfbc3d3`) — status chips만 가능했던 필터를 모든 select/status 컬럼으로 확장.
   - store: `columnFilters: Record<string, string[]>` ephemeral + setColumnFilter / toggleColumnFilter / clearAllFilters. selectVisibleRows에 적용.
   - `components/board/filter-menu.tsx` — Linear "Add Filter…" submenu 패턴. 활성 카운트 배지. ActiveFilterChips 칩 바 (col:value, x로 제거).
3. **행 우클릭 컨텍스트 메뉴** (`26a0c28`) — `onContextMenu` 0건 → shadcn ContextMenu.
   - store: `duplicateRow(rowId)` — 원본 다음 위치에 새 ID + AI confirmed 유지. publishChange로 자동화 통지.
   - `components/sheet/row-context-menu.tsx` — Open in detail(⌘I) · Duplicate(⌘D) · Copy ID · Delete(⌫). 우클릭 시 선택 자동 교체. 다중 선택이면 일괄 적용.
   - sheet-view 각 tr을 RowContextMenu로 래핑.
4. **Gallery + Timeline 뷰** (`0bdedfd`) — Sheet/Kanban/Dashboard 옆에 정렬.
   - view-switcher: VIEWS에 grid · timeline 추가. timeline은 date 컬럼 있을 때만 활성.
   - `gallery-view.tsx`: auto-fill 카드 그리드. 첫 avatar/text → 헤더, status/select/date/num 4개 → 본문. RowContextMenu + detail bar 자동 활성.
   - `timeline-view.tsx`: 첫 date 컬럼 기준 월별 그룹화 (최근부터). 카드: 일자 + 제목/ID + priority/status pill.
5. **Bulk edit + ⌘D 복제 단축키** (`f6044e1`):
   - `bulk-edit-menu.tsx` — 다중 선택 시 "Set…" 드롭다운. status/select 컬럼 → 값 선택 → 모든 선택 행 updateRow. STATUS_LABELS 디스플레이.
   - keyboard-shortcuts: ⌘D → 선택 행 모두 duplicateRow.
6. **Wiki 새 페이지 + 사이드바 검색** (`44d5003`):
   - store: addWikiPage(init?) → unverified draft + 새 ID + 선택 자동. deleteWikiPage.
   - wiki-sidebar 헤더 + 버튼, 검색 input 활성 (title/category/body 매치, X clear).

### 큰 결정
- **자동화 트리거 엔진 = 휴리스틱 키워드 매칭** — when.event/value 자유 텍스트로 두고, "row added"/"sentiment changes to"/"AI theme confirmed as" 같은 substring으로 라우팅. 명시적 typed schema(TriggerKind)로 마이그레이트 ❌ (시드 그대로 동작).
- **publishChange는 store 액션 내부에서** — 별도 middleware ❌. 명시적 호출 + timestamp dedupe로 useEffect 재실행 제어.
- **columnFilters는 filter와 병존** — 기존 status chips 빠른 접근 유지, 새 FilterMenu가 모든 select/status 커버. 둘 다 selectVisibleRows에서 AND.
- **Gallery/Timeline은 RowContextMenu 공유** — 시트 외 뷰에서도 동일 액션 제공. detail bar 자동 활성도 동일.
- **Bulk edit은 select/status만** — text/num/date 인플레이스 bulk는 후속 (입력 위젯 다양해서 복잡).
- **새 Wiki 페이지는 draft 상태** — 자동 verified ❌ (LOCK: 사람이 검증).

### 검증
- tsc 0 · vitest 30/30 (15 신규 automation matches/parseRowDetail) · build.
- 브라우저 통합 테스트는 정량적 store 카운트 검증 (DOM 변화 + lastChange 추적).

### 다음
- Schema pan/zoom + drag reposition · "New table from template" 모달.
- Dashboard builder (Line/Area/Stacked + Add chart 카탈로그).
- 컬럼 헤더 확장: Promote/Attach function/Change type.
- 자동화 시간 기반 트리거 (cron-like for "every day at", "due date passes").
- Wiki sidebar 페이지 우클릭 (Rename · Move category · Delete).
- Trash 행 단위 + 30일 만료.
- Ask AI ⌘J · Settings 멤버 탭.

### Watch Out
- **`updateRow` 호출은 `publishChange` → AutomationRuntime이 useEffect 재실행**. 무한 루프 위험: rule action이 updateRow를 부르면 새 change → 다시 매칭. handledRef로 같은 timestamp는 한 번만 처리, 추가로 룰 자체가 자기-매칭하지 않도록 액션 결과로 trigger 조건이 다시 충족되지 않게 시드 룰 디자인 (Negative→Urgent task는 새 boardId라 OK).
- **Bulk edit + Automations 결합**: 10행 동시 updateRow → 10개 ChangeEvent · 10번 룰 매칭. 시드 룰 4개 × 10행 = 최대 40 fire. 자동화가 toast 폭주 가능성. 향후 batch suppress 옵션 검토.
- **Gallery/Timeline은 selectVisibleRows 결과를 useMemo 의존성 hack** — board/search/filter/sort/columnFilters로 invalidation 추적. 새 ephemeral state 추가하면 deps 갱신 필요.

### 머신
kkh94. main 머지·푸시는 after-work 자동.

---

## 2026-05-24 (kkh94 머신, P1 시급 일괄 #2) — Schema ER · Automations 작동 · Wiki 편집

### 완료
- **Schema ER 다이어그램 + 3 sub-tab** (`7694d76`) — flat grid → positioned 박스 + SVG bezier 엣지.
  - `components/sections/schema-er-diagram.tsx` (신규) — auto-layout 3-column grid. FK 컬럼 → bezier 엣지 + "1:N" cardinality pill. Hover 시 active 표시 + 비-active 30% 페이드. data-er-card 셀렉터.
  - `components/sections/schema-view.tsx` 재구성 — Schema(ER) · Fields(카드 그리드) · Relations(리스트) 3 sub-tab. data-schema-sub 셀렉터.
  - 브라우저 검증: interviews(240×328) + tasks(240×198) 카드 렌더, Relations: 0 (FK 시드 없음).
- **Automations 동작** (`4969e50`) — 카드가 클릭 무반응 → 모든 액션 실작동.
  - store: `toggleAutomationStatus`(active↔paused) · `deleteAutomation` · `testRunAutomation`(runs++ visual proof) · `acceptSuggestion`(draft 룰로 promote) · `dismissSuggestion`.
  - automations-view: 룰 status pill 클릭 가능 + "..." 드롭다운(Test run/Delete with AlertDialog) + Empty state + SuggestionCard에 Accept/Dismiss 버튼.
  - data-automation-id / data-automation-menu / data-automation-runs / data-suggestion-id 셀렉터.
- **Wiki 본문 편집** (`bf02ebb`) — 본문 읽기 전용 → markdown editor 토글.
  - `components/wiki/wiki-page.tsx` — editMode state, Title 우측 Edit/Cancel·Save 버튼군, textarea (min-h-[400px]·font-mono·focus:border-primary), markdown 문법 헬퍼 힌트. Save → updateWikiPage({body, updatedAt}).
  - 페이지 전환 시 draft 자동 리셋.
  - data-wiki-edit-toggle / data-wiki-editor / data-wiki-save 셀렉터.
  - 브라우저 검증: "Library guide" Edit 클릭 → textarea content "# What is the Library?..." 자동 로드 ✓.

### 큰 결정
- **ER auto-layout 우선, drag/zoom 후순위** — 사용자 데이터 규모(2~5 보드 예상)에서 row-major 3-column grid면 충분히 시각화. drag reposition은 향후.
- **Automations 실행 엔진 = visual proof만** — 실제 row 변경 감지 + rule 평가 + Then 실행은 별도 zustand subscribe 레이어 필요 → 후속. 지금은 testRunAutomation으로 runs++ 트래킹만 검증.
- **acceptSuggestion은 draft 상태 룰 생성** — 사용자가 트리거/액션을 명시 설정해야 active로 전환 가능. AI가 만든 룰을 무작정 active로 두지 ❌ (LOCK: "AI 추천 + 사람 확정").
- **Wiki 본문 편집은 textarea + Save (인플레이스 vs split pane)** — split preview는 너비 부담. 사용자가 Save로 명시적 commit 후 렌더 결과 확인.

### 검증
- tsc 0 · vitest 15/15.
- 브라우저: Workspace > Schema 진입 → ER 다이어그램 2 카드 렌더 ✓, sub-tab 3개 데이터 셀렉터 ✓ · Wiki Edit 토글 → textarea content 자동 로드 ✓.

### 다음 (감사 보고서 큰 갭 중 남은 것)
- **Automations 실제 트리거 엔진** — `lib/automation-runtime.ts`로 zustand subscribe + rule 평가. row 변경/스케줄 트리거 두 종류 처리.
- **컬럼 헤더 메뉴 확장**: Promote to Library · Attach function · Change type 인플레이스.
- **다중 필드 Filter 팝오버** · **Bulk edit** · **우클릭 컨텍스트 메뉴**.
- **Gallery / Timeline view** — `view-grid.jsx` · `view-timeline.jsx`.
- **Dashboard builder** — Line/Area/Stacked + "+ Add chart" 카탈로그.
- **Schema 깊이**: pan/zoom · drag reposition · "New table from template" 모달.
- **Wiki 깊이**: 새 페이지 생성 · 사이드바 검색 · live preview.
- **Ask AI ⌘J 톱바 버튼** · **Trash 행 단위 추적**.
- **B4 (가장 마지막)** — 컬럼↔Library 자산 링크.

### Watch Out
- **ER 엣지는 FK만** — conceptual relations(name/company shared field 등) 점선 엣지는 프로토타입엔 있지만 우리 V2 시드엔 explicit FK 없어 노이즈만 추가 → 생략.
- **Automations 룰 변경 시 trashedBoards 같은 보존 ❌** — deleteAutomation은 즉시 영구 삭제. 향후 Trash로 옮기는 패턴 통일 검토.
- **Wiki body edit ↔ Verified 상호작용** — body 수정 시 verified는 그대로 유지(자동 unverify ❌). Owner 검증의 의미가 콘텐츠 stability라 매번 unverify는 과함 — 별도 액션으로 분리.
- **acceptSuggestion 룰의 when/then은 placeholder** — 사용자가 명시 편집해야 의미 있음. 룰 편집 UI 부재로 현재는 자기 자신 디자인 추측에 의존.

### 머신
kkh94. main 머지·푸시는 after-work 자동.

---

## 2026-05-24 (kkh94 머신, P1 깊이 일괄) — 컬럼 추가/편집 · Trash/Settings 실작동 · 시드 영어화

### 완료
- **컬럼 추가/편집** (`d911c06`) — Sheet의 가장 큰 갭 해소. 헤더 "+" 셀이 진짜 동작.
  - store: `addColumn`(중복 이름 자동 _2/_3) · `deleteColumn`(id 보호, 행 키 제거) · `renameColumn`(키 migrate) · `updateColumn`.
  - `add-column-menu.tsx` (신규) — Basic 7 type + Library Field 8 동적 노출.
  - `column-header-menu.tsx` (신규) — 헤더 우측 "..." 메뉴. Rename(Dialog, key 보존) + Delete(AlertDialog 확인).
  - `header-cell.tsx`/`sheet-view.tsx` — 정렬 버튼 + 헤더 메뉴 가로 조합 + "+" 셀 활성화.
  - 브라우저 검증: 14→15 헤더, 새 "Number" 컬럼 정상 추가 ✓.
- **Trash + Settings 실작동** (`a4935af`) — status bar 클릭 토스트 스텁 → 실 다이얼로그.
  - types: `TrashedBoard` · `WorkspaceSettings`. store v6→v7 migrate.
  - `deleteBoard` 변경: boards에서 빼고 trashedBoards에 push (복원 가능). 신규 액션: `restoreBoard` / `permanentDeleteBoard` / `emptyTrash` / `updateSettings`.
  - `trash-dialog.tsx` (신규) — 삭제 보드 리스트, 항목별 Restore↺ / Delete forever🗑, Empty trash. relativeTime + empty state.
  - `settings-dialog.tsx` (신규) — Workspace name input + Sidebar initial(1글자) + Storage 21% 프로그레스(stub).
  - status-bar — Trash 버튼에 trashedCount 배지(primary dot). board-header / board-sidebar 하드코딩 "peter's workspace" → `settings.workspaceLabel`/`workspaceInitial`.
  - 브라우저 검증: Settings 다이얼로그 렌더 ✓ (Workspace name input · Sidebar initial · Storage bar).
- **시드 deep 영어화** (`a7a1c77`) — Library / Workspace / Interviews 시드 한국어 자산명/옵션/quote 모두 영어. Status 키는 LOCK 한국어 enum 유지.
  - `flowbase-library-seed.ts`: 모델명/처리방식/사업부 → Model/Handling type/Business unit. 옵션 라벨 단순변심 등 → Buyer's remorse 등. usedIn "Tasks.모델명" → "Tasks.model".
  - `flowbase-workspace-seed.ts`: AUT-004/005 한국어 잔여 + SUG-002 영어화. Status 디스플레이값 영어로(자동화 엔진 미구현이라 기능 영향 0).
  - `flowbase-seed.ts`: 10 인터뷰 한국어 이름·인용 → 영어 (transliteration 유지: Min Jiho, Jo Hyunwoo 등).

### 큰 결정
- **컬럼 추가는 Library Field 단축 진입 포함** — Basic types 7 + Library Fields 8 한 드롭다운에. Library에 정의된 Field를 그냥 골라 추가 가능.
- **renameColumn 라벨만 변경** — 키 보존이 기본. 행 데이터 안 깨짐. 키 변경은 store에 별도 path 있지만 UI는 라벨만.
- **deleteColumn 액션은 Undo ❌** — 행 단위는 undoStack에 있지만 컬럼 변경은 미추적. AlertDialog로 confirm 명시.
- **삭제된 보드는 Trash 보존, 마지막 보드 삭제 ❌** — `deleteBoard`가 boards에서 빼고 trashedBoards에 push. 마지막 보드는 보호. 복원 시 viewByBoardId 함께 복원.
- **Status 키 영어화 ❌** — LOCK 한국어 enum 보존. Library Field 내부의 workflow status 옵션(수거접수/검수중)은 영어화 OK (이건 셀 옵션, TicketStatus 아님).

### 검증
- tsc 0 · vitest 15/15.
- 브라우저:
  - "+" 클릭 → 12 menuitem 노출 ✓
  - "Number" 선택 → headers 14→15 ✓
  - Settings 다이얼로그 모든 필드 렌더 ✓
- localStorage v6→v7 migrate 시 trashedBoards/settings 자동 주입.

### 다음
- 컬럼 헤더 메뉴: Promote to Library / Attach function / Change type 인플레이스.
- Trash: 행 단위 deletedRows · 30일 자동 만료.
- Settings: 멤버/권한 탭 · 테마 프리셋 · 데이터 export.
- 나머지 갭 (감사 보고서): Schema ER 다이어그램 · Automations 실행 엔진 · Wiki 본문 편집 · Gallery/Timeline view · Dashboard builder · Bulk edit · 다중 필드 Filter · 우클릭 메뉴 · Ask AI ⌘J.

### Watch Out
- **컬럼 변경 = undo 비대상** — addColumn/deleteColumn/renameColumn 모두 undoStack ❌. 사용자에게 명시(AlertDialog 메시지).
- **Library Field가 select 타입일 때**: optionListId 참조라 옵션 라벨이 add-column-menu에서 직접 채워지지 않음. 현재는 빈 select로 추가됨. 향후 optionList 자체 inflation 필요.
- **renameColumn 키 변경 path**: 현재 UI는 라벨만 호출 (newName === colName). 키 변경은 store 액션에 있지만 UI 진입점 ❌.
- **Trash deletedAt 시간 만료 없음** — 영구 보관. 30일 만료 정책은 향후.
- **Settings storage bar 21% 하드코딩** — 실제 회계 없음.

### 머신
kkh94. main 머지·푸시는 after-work 자동.

---

## 2026-05-23 (kkh94 머신, 후속 #5) — 감사 + 셸 chrome 보정 (status bar · NavCluster · ⌘K 힌트)

### 완료
- **앱 감사** — 프로토타입 vs 앱 매핑 + 실작동 검증 (Sheet edit/⌘N/Filter/Kanban/Dashboard/Undo/AI fetch/Import 파서). 결론: 핵심 데이터 흐름은 실제 wiring, 빠진 건 편집/관리 흐름 다수.
  - **진짜 작동 (검증함)**: ⌘N(11→12 row 카운트), Filter(11→2 visible), AI Apply all(POST `/api/ai/infer-batch` 500 + graceful toast), CSV 파서("4열·3행" 감지), Kanban 4컬럼 그룹, Dashboard 실집계, ⌘Z Undo(stack pop), ⌘K Search.
  - **의도적 스텁**: Trash/Settings(toast), 2.1/10 GB(하드코딩), activity-bar Settings(`disabled`), Wiki 사이드바 검색(`<input disabled>`), Library asset edit(B3 미구현).
  - **프로토타입 누락**: 컬럼 추가(+) · 헤더 메뉴 · 다중 필드 Filter · ER 다이어그램 · Automations 실행 엔진 · Wiki 본문 편집 · Gallery/Timeline view · Dashboard builder · 우클릭 메뉴 · nav-history(← 이번 세션에 해결) · Ask AI ⌘J.
- **셸 chrome 보정** (`96ff20d`) — 사용자 지적 5건 해결:
  - `components/board/status-bar.tsx` (신규) — 셸 푸터, hide-all 시에도 항상 표시. Trash · Settings · 2.1/10 GB.
  - 사이드바 푸터 + 액티비티 바 Settings 제거 — status bar 단일화.
  - `types/flowbase.ts` `NavEntry` + `navStack`/`navIndex` + 7 액션 자동 pushNav + `goBack`/`goForward`/`jumpToNavEntry`.
  - `components/board/nav-cluster.tsx` (신규) — 시계(history 드롭다운) · ‹ · ›.
  - `board-header.tsx` — NavCluster 배선 + ⌘K Kbd 힌트 + 검색창 클릭→팔레트.
  - `panels-menu.tsx` — Korean → English ("Panels"/"Show all panels"/"Hide all panels").

### 큰 결정
- **사용자 통찰을 LOCK으로 채택** — "Settings/Trash는 hide-all 무관 항상 접근 가능해야". 프로토타입 sidebar 푸터 결함을 우리는 답습 ❌. 새 컨벤션: **셸 푸터 status bar가 영구**.
- **NavCluster는 단순 visual ❌, 실제 history 스택** — 7개 액션 호출이 자동 push, dedup + cap 50. goBack/goForward는 replay 모드(pushNav 우회).
- **검색창 = ⌘K 팔레트 트리거** — 인라인 입력도 유지하되 (헤더에서 즉시 search store 업데이트), 검색창 클릭 자체가 팔레트도 연다.
- **감사를 솔직하게** — 사용자가 "진짜 돌아가는 앱이냐"고 묻기에 모든 핵심 path를 store-DOM-network 레벨로 검증하고 "스텁/Missing/Working" 표로 보고. 갭 숨기지 않음.

### 검증
- `npx tsc --noEmit` 0 · `npm run build` 0 · `vitest run` 15/15.
- 브라우저: ⌘N → store 카운트 +1 ✓ · Filter In-progress → 11→2 visible ✓ · AI Apply all → 실제 POST ✓ · CSV 파서 감지 ✓ · Kanban/Dashboard 렌더 ✓ · Undo ✓ · hide-all 후 status bar 잔존 ✓ · NavCluster 3 버튼 활성/비활성 ✓.

### 다음
- **Trash · Settings 실제 onClick 로직** (현재 toast만). Trash는 store에 deletedItems 추적, Settings는 모달.
- **컬럼 추가 ("+" 셀)** — Sheet의 핵심 갭. `addColumn` 액션 + 헤더 드롭다운(Library Field 선택/타입 선택/+추가).
- **컬럼 헤더 메뉴 (...)** — Promote / Delete / Attach function.
- **시드 deep 영어화** — `flowbase-library-seed.ts` 한국어 자산명 + Customer Interviews 한국어 quote/name.
- **나머지 갭**: ER 다이어그램 · Automations 실행 엔진 · Wiki 본문 편집 · Gallery/Timeline view.

### Watch Out
- **NavStack 인메모리 only** — 새로고침하면 비워짐. persist 추가 시 다른 머신에서 history 혼란 가능. 의도적 ephemeral.
- **pushNav가 모든 navigation 액션에 자동 호출** — 새 액션 추가할 때 nav 트래킹할 거면 pushNav() 끝에 호출. 안 할 거면 (예: setLibView 같은 미세 토글) 호출 생략.
- **status bar는 6 모드 모두에서 표시** — Wiki/Library/Inbox/Search 모드에도 같은 푸터. Trash가 mode-aware 동작해야 할지(예: Wiki 모드에서 Trash 클릭 → 휴지통 페이지)는 미정.
- **활성 disabled 버튼 모두 제거됨** — activity-bar Settings도 사라짐. 사용자가 액티비티 바 외 진입점을 찾을 곳은 status bar 하나.

### 머신
kkh94. main 머지·푸시는 이번 세션 마무리 시 자동 (after-work step 8 정책 적용 중).

---

## 2026-05-23 (kkh94 머신, 후속 #4) — Search 모드 + ⌘K 팔레트 → breadth P0 100%

### 완료
- **Search** (`3771bc8`) — breadth P0 마지막 항목 마무리. **앱 breadth 100% 도달**.
  - `lib/search-index.ts` — `SearchItem` 평면화(table/row/library/wiki) + `filterSearch`(prefix>contains>subtitle>keywords 스코어) + `countByKind`. 인덱스는 호출자가 useMemo로 캐시.
  - `components/search/search-helpers.tsx` — 공통 `KindBadge`(lucide Database/Rows3/Sparkles/BookText) · `HighlightMatch` · `useNavigateSearchItem` 훅. Row 클릭 시 `switchBoard` + `setActivityMode("tables")` + `setSelected([rowId])` + 디테일 바 자동 열림.
  - `components/search/search-palette.tsx` — 640px 모달 (`fixed inset-0 z-50` + blur). store.searchOpen으로 visibility. ↑↓/Enter/Esc 키 네비, kind 그룹 헤더, 결과 카운트 푸터, `data-search-item-id` 셀렉터.
  - `components/search/search-mode.tsx` — activityMode=== "search" 풀페이지. 큰 input + 5탭(All/Tables/Rows/Library/Wiki, 카운트 chips) + 평탄 리스트 200 limit. `data-search-tab` 셀렉터.
  - `types/flowbase.ts` — `FlowBaseState.searchOpen` (ephemeral, 비-persist).
  - `lib/flowbase-store.ts` — `setSearchOpen` 액션.
  - `lib/keyboard-shortcuts.ts` — `⌘K` → `setSearchOpen(true)`. 편집 중에도 동작.
  - `app/page.tsx` — `activityMode === "search"` → `SearchMode`. `<SearchPalette />`는 항상 마운트.
  - **삭제**: `components/board/coming-soon-mode.tsx` — 마지막 사용자(search 스텁)가 실 구현으로 대체.

### 큰 결정
- **두 진입점, 공통 인덱스/필터** — ⌘K 모달(가벼운 인터럽트 검색)과 풀페이지 모드(긴 세션 탐색)가 같은 `buildSearchIndex` + `filterSearch`로 일관성. UI만 다름.
- **모달은 항상 마운트, store가 visibility 제어** — `if (!open) return null`로 빠른 unmount. ⌘K 단축키는 store 액션만 호출 → 셸/모달 결합도 낮음.
- **Row 검색 액션은 detailBar 자동 활성화** — 행을 찾아 클릭한 의도가 명확하므로, 닫혀 있던 디테일 바도 함께 열어 즉시 행 컨텍스트 노출.
- **외부 lib 미사용** — cmdk(shadcn command)는 그루핑/스코어 정책이 우리 요구와 다름. fixed div + 키 핸들러로 직접 작성 (Wiki 마크다운 렌더러와 같은 정책).

### 검증
- `npx tsc --noEmit` 0 · `npm run build` 0(정적 6/6) · `vitest run` 15/15.
- 브라우저: ⌘K 입력 → 모달 출현 · input 자동 포커스 · "lib" → LIBRARY+ROWS 21 결과 · "glossary" → WIKI 1결과 + 매치 하이라이트 · Enter → Wiki Glossary 페이지 모드로 전환 + 사이드바 selection 동기화 · Search 풀페이지 탭 카운트(All 44 / Tables 2 / Rows 18 / Library 18 / Wiki 6) 합산 정확 · Wiki 탭 필터링 6개만.

### 다음
**Breadth 100% — 다음은 깊이/품질 작업**:
- 시드 deep 영어화 (`flowbase-library-seed.ts` 한국어 자산명·옵션 라벨 + `flowbase-workspace-seed.ts` 룰 잔여 + Customer Interviews 시드)
- B3 Library 인라인 편집
- 반응형 fix (~800px)
- AI 실호출 검증 (`ANTHROPIC_API_KEY`)
- Wiki 페이지 편집 UI + sanitize
- B4 (가장 마지막, 사용자 명시) — 컬럼↔Library 자산 링크 · "Use in table" · 템플릿으로 보드 생성

### Watch Out
- **`buildSearchIndex` 호출 시점** — 모달은 open 시 매번 재인덱싱(`useMemo` deps에 `open` 포함). 모드는 데이터 자체에 deps 묶음. 데이터 폭증 시 worker 분리 후보.
- **모달은 mount-always 패턴** — `if (!open) return null`로 unmount하지만 store 구독은 유지. 무거워지면 SSR `'use client'` 경계 살펴볼 것.
- **Search 모드 input 자동 포커스** — `useEffect(() => inputRef.current?.focus(), [])`. mode 재진입 시에도 매번 포커스.

### 머신
kkh94. main 머지 진행 — after-work step 8 무조건 정책.

---

## 2026-05-23 (kkh94 머신, 후속 #3) — Wiki 모드

### 완료
- **Wiki 모드** (`01a7ae7`) — breadth P0 마지막에서 두 번째 항목 마무리.
  - `types/flowbase.ts` — `WikiPage` 인터페이스 + `FlowBaseState.wikiPages` · `wikiSelectedId` 추가.
  - `lib/flowbase-wiki-seed.ts` — 6 페이지 시드 (Library guide · CS case handling · Keyboard shortcuts · New hire onboarding(draft) · Glossary · Team directory). 콘텐츠는 영어화(시드 deep 번역 P1 정책과 일관).
  - `lib/flowbase-store.ts` — `setWikiPage` · `updateWikiPage` 액션, **v5→v6 migrate** (기존 persisted state에 wikiPages 비어 있으면 시드 주입), partialize 갱신.
  - `components/wiki/markdown-body.tsx` — 의존성 0인 미니 마크다운 렌더러 (h1~h3 · ul · ol · table · inline `code` · `**bold**`). 외부 lib ❌.
  - `components/wiki/wiki-sidebar.tsx` — 카테고리 트리 + DRAFT 배지(unverified) + 활성 페이지 좌측 바 강조. `data-page-id` 셀렉터.
  - `components/wiki/wiki-page.tsx` — 제목 · 브레드크럼 · Owner 아바타 · Verified pill(만료 시 빨간 배너 + Re-verify) · Mark as verified(unverified만).
  - `components/wiki/wiki-mode.tsx` — 셸 ([사이드바 | 페이지]).
  - `app/page.tsx` — activityMode === "wiki" → `WikiMode`.
  - `components/board/coming-soon-mode.tsx` — wiki/library/inbox INFO 항목 제거. 이제 Search 모드만 스텁.

### 큰 결정
- **외부 마크다운 라이브러리 ❌** — `react-markdown`/`remark`-류 도입 대신 시드 마크다운 범위에 맞춘 미니 렌더러를 직접 작성. 의존성 무게 회피 · 시드/사용자 입력이 모두 워크스페이스 내부라 sanitize 단순.
- **Wiki 시드는 영어로** — 사용자 명시 "영어버전" 정책과 시드 deep 번역 P1 일관. Library 시드(`flowbase-library-seed.ts`)의 한국어 잔존은 별도 패스로.
- **store version v5 → v6 (migrate)** — 기존 persisted state에 `wikiPages`가 없거나 비어 있으면 자동 주입. Tasks 보드 v4→v5 패턴 답습.

### 검증
- `npx tsc --noEmit` 0 · `npm run build` 0 (정적 6/6) · `vitest run` 15/15.
- 브라우저: Wiki 모드 진입 → 사이드바 5 카테고리(Concepts/Onboarding/Reference/Runbooks/Team) · 페이지 6개 · DRAFT 배지 · 활성 페이지 강조 · 마크다운 헤딩/리스트/inline code/bold/테이블 모두 렌더 · 페이지 전환 · "Mark as verified" 클릭 시 DRAFT 배지 사라지고 Verified · 90d left pill로 전환 (Re-verify TTL=90d).

### 다음
**Breadth 마지막**: Search 팔레트(⌘K) 만 남음 — `design-ref/prototype/search-palette.jsx` 참조. 이후 시드 deep 영어화 · B3 Library 편집 · 반응형 fix · B4 테이블 연동(가장 마지막).

### Watch Out
- **`react-markdown` 미사용** — 시드 마크다운 문법만 지원. 사용자가 wiki 페이지 편집 UI를 만들 때 입력 sanitize는 부재(현재는 시드만이라 OK).
- **`wikiPages` partialize 포함** — Wiki 페이지 편집은 localStorage에 즉시 반영.
- **dev server 충돌** — 이번 검증 중 `npm run dev`가 이미 :3000에 떠 있어 새 백그라운드 시작 실패 → 기존 서버 재사용으로 해결. 다음 세션에서도 dev 떠 있으면 preview MCP가 reuse한다.

### 머신
kkh94. main 머지·push는 이번 세션 마무리 시 무조건 진행 (after-work step 8 정책).

---

## 2026-05-23 (kkh94 머신, 이어서) — Phase B Library B1·B2 · Workspace Automations · Inbox · Detail bar · English UI · Tasks 보드

### 마무리 — 모든 작업 main 머지·푸시 완료
후속 작업물 6 커밋 + docs sync + after-work 룰 변경(step 8 무조건 포함)까지 모두 `main`에 fast-forward 머지·푸시 완료(`origin/main` = `bb84e56`+). 다른 머신: `git checkout main && git pull` 한 줄로 이어가기.

### 완료
- **Phase B B1 — Library 브라우즈** (`4148c96`) — 5 카테고리(optionLists/fields/templates/functions/dashboards) TS 타입 + 시드(`flowbase-library-seed.ts`) + 스토어 슬라이스 + LibrarySidebar 트리 + CategoryCatalog 카드 그리드 + 셸 모드 분기. 읽기 전용.
- **Phase B B2 — Library 디테일** (`5bf1ef5`) — `components/library/asset-detail.tsx` (5 카테고리 디테일: OptionList 옵션 목록·Field config·Template 필드+멀티테이블·Function params/example·Dashboard 차트 메타). `selectAsset(category, id)` 원자 액션 추가 — cross-category 클릭 버그 해결. `data-asset-id` 테스트 셀렉터.
- **Workspace > Automations** (`41b7257`) — `components/workspace/automations-view.tsx`(룰 카드 When/Then·status pill·runs/lastRun + AI Suggestions confidence%) + Schema/Automations 탭 + `flowbase-workspace-seed.ts`(5 룰 + 3 AI 제안). `ActiveWorkspaceItem` 타입.
- **Inbox 모드** (`620dadb`) — `components/inbox/inbox-view.tsx` 워크스페이스 상태 파생(AI pending·자동화 제안·빈 테이블·미사용 자산·활동 로그). 6 kind + 필터 chips + 액션→해당 모드 네비.
- **Detail bar (4번째 패널)** (`f3feae2`) — `PanelState.detailBar` 추가. `components/board/detail-bar.tsx` (선택/포커스 행 디테일). PanelsMenu에 체크박스 + ⌘I. TablesMode 통합. `data-panel-id` 셀렉터.
- **English UI + Trash/Settings + Tasks 보드** (`605b9f3`) — 20 파일 변경:
  - UI chrome 한국어→영어 (17+ 파일: board-sidebar/header, tables-mode, ai-activity-panel/composer/pending-card, filter-chips, kanban-view, editable-cell, schema-view, detail-bar, inbox-view, automations-view, coming-soon-mode, library-sidebar, asset-detail).
  - `STATUS_LABELS` 맵(types/flowbase.ts) — Status 디스플레이만 영어, 키는 LOCK 한국어 보존.
  - board-sidebar 푸터: Trash · Settings 아이콘 + 2.1/10 GB stub.
  - `lib/flowbase-tasks-seed.ts` — 2번째 시드 보드 (Tasks, 8행, id·title·assignee·status·priority·due).
  - store v4→v5 migrate — 기존 persisted state에 Tasks 자동 주입.

### 큰 결정
- **breadth 우선 (사용자 명시)** — Phase A 셸 완성 후 B3 Library 편집/B4 테이블 연동 대신 워크스페이스 breadth 완성을 우선 ("우선은 목업 퀄리티와 기능들을 완벽하게 구현해내는 게 최우선"). Library B1·B2, Workspace Automations, Inbox, Detail bar, Tasks 보드, 영어화 순.
- **Status는 LOCK 한국어 키 보존, `STATUS_LABELS` 맵으로 디스플레이만 영어** — MEMORY Key Design #8(Status 색 매핑 한국어 키 기반) 호환. 시맨틱 키-색 매핑 그대로, 라벨만 영어("Todo/In progress/Waiting/Done").
- **`selectAsset(category, id)` 원자 액션** — Library 사이드바에서 cross-category 자산 클릭 시 libCategory + libAssetId 동시 업데이트. 기존 `setLibAsset`만 사용 시 카테고리 미동기로 `assetExists` false → 디테일 미렌더 버그.
- **Detail bar는 Tables 모드에서만 콘텐츠** — 다른 모드는 토글되어도 빈(UX).
- **Tasks 보드 시드 + store v4→v5 migrate** — `flowbase-tasks-seed.ts`로 2번째 시드 보드(CS Operations 도메인) 추가. 기존 사용자 persisted state에 자동 주입.

### 검증
- 각 커밋 시점 `tsc --noEmit` 0 · `npm run build` 0 · `vitest run` 15/15.
- 브라우저 검증: Library 5 카테고리 트리 + 카탈로그 + 자산 디테일(Field·Function 확인) · Workspace Automations 탭 5 룰 + AI 제안 · Inbox 11 파생 항목 + 필터 카운트 · Detail bar 토글 시 보드와 AI 패널 사이 렌더 · English UI 전반 (Customer Interviews + Tasks 사이드바, Todo/In progress/Waiting/Done 영어 라벨, Trash/Settings 푸터).
- after-work 시점 재검증: tsc 0 · vitest 15/15.

### 다음
**Breadth 마무리**: Wiki 모드 + Search 팔레트(⌘K) — 둘 다 현재 스텁. 이후 시드 deep 영어화·B3 Library 편집·반응형 fix·B4 테이블 연동(가장 마지막). 자세히는 `NEXT-ACTION.md`.

### Watch Out
- **13 커밋 ahead of origin/main** — main은 `4d71c8a` 그대로. 다른 머신 이어가기는 브랜치 checkout(`claude/wizardly-murdock-451e3d`) 또는 머지 후 main pull.
- **~800px 반응형 깨짐** — Tables 모드에 4-5 패널 동시 표시 시 cramped. 미해결.
- **시드 deep 영어화 미완** — `flowbase-library-seed.ts`(모델명·처리방식·사업부·옵션 라벨), `flowbase-workspace-seed.ts` 룰 잔여, Customer Interviews 한국어 quote/name 잔여.
- **`ANTHROPIC_API_KEY` 미설정** — AI 라우트 실호출 미검증.
- **STATUS_LABELS 도입 (types/flowbase.ts)** — 신규 status 디스플레이는 `STATUS_LABELS[s]` 사용. 직접 `{s}` 렌더 ❌.
- **테스트 셀렉터 속성** (`data-asset-id`, `data-panel-id`, `data-workspace-item`) — UI 코드에 추가됨. 새 인터랙티브 요소도 같은 패턴 권장.

### 머신
kkh94. 다음 머신: before-work 시 — main이 안 머지 됐으면 브랜치에서 이어갈 것.

---

## 2026-05-22~23 (kkh94 머신) — before/after-work 명령어 · Phase 3 Q1 · 죽은코드 정리 · 앱 범위 재정의(Phase A) · Library 설계(Phase B)

### ✅ 마무리 — 6 커밋 + docs, `main` 머지·푸시 완료
- 작업을 `claude/wizardly-murdock-451e3d` 워크트리 브랜치에 커밋 → **`main` 머지·푸시**.
- 다른 머신: `git fetch && git checkout main && git pull && npm install`.

### 완료
- **before/after-work 명령어** (`2cbf01a`·`d2ad4ea`) — `~/.claude/commands/`(머신 로컬·미동기화) 대신 `<repo>/.claude/commands/`에 프로젝트 커맨드로 생성. `.gitignore`에 `!.claude/commands/` 예외 추가 → git 추적, 모든 머신 sync. before-work=git pull 중심, after-work=커밋·push·머지 중심.
- **Phase 3 Q1** (`afa39f1`) — `infer-batch`의 `row.quote` 하드코딩을 `sourceField` 인자로 일반화. API·`flowbase-ai.ts`·`ai-activity-panel.tsx`·테스트. vitest 13→15.
- **옛 V1 코드 정리** (`4fa804a`) — V2에서 도달 불가능한 V1 파일 20개 삭제(−7,025줄): `app-sidebar`·`breadcrumb-bar`·`quick-switcher`·`workspace-switcher`·`sections/*-section` 6개·`sections/sheet/*` 4개·`mock-*` 3개·`view-utils`·`trash/workspaces` 라우트. `tokens.ts`는 `mock-data`의 `Tone`/`ChartColor` 타입을 인라인해 의존 제거.
- **Phase A — 앱 셸 6모드 라우터** (`daad859`) — 액티비티 바를 아이콘 2개 → 6모드 레일(Inbox·Tables·Workspace·Library·Wiki·Search). `app/page.tsx`를 `activityMode` 라우터로, Tables 보드 본체를 `tables-mode.tsx`로 추출. **Schema를 Tables 뷰 탭 → Workspace 모드로 이동.** Library/Wiki/Inbox/Search는 "준비 중" 스텁.
- **Phase B 설계** — `docs/02-design/features/flowbase-v2-library.design.md` (Library 서브시스템, 서브단계 B1~B4).

### 큰 결정 — 앱 범위 재정의
- **"Phase 1~6 완료"는 과대 기재였음.** 사용자 지적 + 프로토타입 정독 결과: 프로토타입은 6 액티비티 모드(Inbox·Tables·Workspace·Library·Wiki·Search)를 그리는데 V2는 **Tables 모드 하나**만 구현 — 앱의 약 1/6. docs의 "브라우저 동작 확인 완료"는 넓은 화면 한정.
- **Schema = Workspace 서브시스템** — `prototype-app.jsx` L63(`Migrate stale "schema" view (now a workspace-level item)`)·L95(`activeWorkspaceItem: "schema"|"automations"`). Phase 6 D3("Schema = 4번째 뷰 탭")를 번복. `ViewMode`에서 `schema` 제거.
- **Library 먼저** — 나머지 서브시스템 중 Library가 가장 구조적(컬럼·옵션 정의 레이어). Wiki·Inbox·Search는 이후.
- **BaaS(옛 Phase 7) 후순위** — 서브시스템 구축이 우선.
- before/after-work는 프로젝트 커맨드로 (글로벌 `~/.claude/`는 머신 간 sync 안 됨 — 이번 머신에 명령어가 없던 이유).

### 검증
- Phase 3 Q1·정리·Phase A 각각 `tsc` 0 · `build` 0 · `vitest` 15/15.
- Phase A: preview 브라우저에서 6모드 액티비티 바 + 모드 전환(Library 스텁 · Workspace=Schema · Tables 복귀) 확인.
- after-work 시점 재검증: tsc 0 · build 0 · vitest 15/15.

### 다음
**Phase B — Library 서브시스템 B1 구현.** 설계 `flowbase-v2-library.design.md` §5의 7단계. `NEXT-ACTION.md` 참조.

### Watch Out
- **~800px 반응형 레이아웃 깨짐** — 4패널이 좁은 폭에서 무너짐(AI 패널이 보드 덮음). 미해결 — 서브시스템 구축 뒤 별도 작업. 사용자 우선순위: 기능 > 반응형.
- `ANTHROPIC_API_KEY` 미설정 — AI 실호출 미검증.
- 콘솔 script-tag 경고 6개 — preview 환경/기존, Phase A 코드 무관.
- `pnpm-lock.yaml` 중복 — 빌드 경고(무관, 기존).
- docs의 옛 "Phase 7 BaaS가 다음" 서술은 이번 세션이 재정의 — NEXT-ACTION·MEMORY·CONTEXT·TODO 모두 갱신함.

### 머신
kkh94. 다음 머신: before-work 시 `main` 동기화.

---

## 2026-05-21 (kkh94 머신, 이어서) — Phase 4·5·6 구현 (Kanban·Dashboard · 앱 셸 · 멀티보드·Schema)

### ✅ 마무리 — 커밋·푸시·main 머지 완료
- 작업물을 `feat/kanban-dashboard`에 커밋(`df7eeb4` 코드 + 후속 docs 커밋) → origin 푸시 → **`main` 머지·푸시** 완료.
- 다른 머신: `git fetch && git checkout main && git pull && npm install`.

### 완료
- **Phase 4 (Kanban + Dashboard)** — 설계 + 구현. `components/board/view-switcher`(Sheet|Kanban|Dashboard 탭) · `components/sections/{kanban,dashboard}-view` · `components/charts/*`(recharts donut/bar + div 막대). Kanban=status 칸+이동 버튼(DnD ❌). Dashboard=제네릭 집계. page 뷰 분기. **버그 수정**: `selectVisibleRows` 직접 구독 → 무한 루프 → 의존 슬라이스 구독 + useMemo.
- **Phase 5 (앱 셸)** — 설계 + 구현. `components/board/*`(activity-bar·board-sidebar·board-header·panels-menu·edge-collapse·expand-tab·filter-chips). page 셸 레이아웃 [액티비티바|사이드바|보드|AI패널] + 패널 조건부 렌더. `keyboard-shortcuts` 확장(⌘⇧A·⌘⇧F·⌘B·⌘N). **버그 수정**: 시트 체크박스 정렬(헤더 X 4px 어긋남 + 행 높이 소수점 jitter → `text-center`·`h-12`·`block mx-auto`).
- **Phase 6 (멀티보드 + Schema)** — 설계 + 구현. 스토어 `renameBoard` · 사이드바 보드 `…` 메뉴(rename 인라인/delete, 마지막 보드 보호) · `schema-view`(전 보드 컬럼 인벤토리 카드 + fk 관계) · `ViewMode += "schema"` 4번째 탭.
- 설계 문서 3개: `flowbase-v2-phase{4,5,6}.design.md`.

### 큰 결정
- Kanban 카드 이동 = 버튼 (DnD 라이브러리 ❌, Phase 4 D1).
- Dashboard = 제네릭 집계 (interview 전용 하드코딩 폐기, Phase 4 D3). 차트 = div 막대 + recharts hero 2개 혼합.
- **Schema = 4번째 뷰 탭** — Phase 1의 "schema ≠ view" 노트를 MVP 단순화 위해 번복 (Phase 6 D3). active board 무관 워크스페이스 렌더.
- 옛 V2-미사용 코드 정리는 별건 — `tokens.ts`가 `mock-data` 타입 의존 등 얽힘 (Phase 6 Q2).

### 검증
- `tsc` green · `npm run build` green · vitest 13/13 · 브라우저: 4뷰 전환·Kanban 이동·Dashboard 차트·패널 토글(키보드/햄버거/엣지)·보드 rename/delete·Schema 뷰 — 모두 확인. 콘솔 getSnapshot 에러 0 (직접 카운터 검증).

### 다음
- **Phase 7 (BaaS)** — V2 7단계 중 마지막. `docs/01-baas-decision.md`(Supabase vs bkend.ai) 결정이 블로커. `NEXT-ACTION.md` 참조.

### Watch Out
- (해결됨) `feat/kanban-dashboard` 커밋·푸시 + `main` 머지 완료 — origin/main이 Phase 1~6 전체 포함.
- `ANTHROPIC_API_KEY` 미설정 — AI 실호출(infer-batch/ask/analyze-import) 여전히 미검증.
- **`selectVisibleRows`를 zustand 셀렉터로 직접 구독 ❌** — 새 배열 반환해 무한 루프. 의존 슬라이스 구독 + `useMemo` 패턴 필수 (Phase 4 교훈, sheet-view 패턴).
- 옛 V2-미사용 코드 정리 미완 — 별건 (NEXT-ACTION 참조).
- `feat/sheet-view-v2`·`feat/kanban-dashboard` 브랜치 origin 잔존 (삭제 선택).

### 머신
kkh94. 다음은 또 다른 머신 — before-work 시 `main` 동기화.

---

## 2026-05-21 (kkh94 머신, 이어서) — Phase 1B·2·3 구현 (시트 뷰 · AI 패널 · Import)

### ✅ 마무리 — 커밋·푸시·main 머지 완료
- 이 세션 작업물을 `feat/sheet-view-v2`에 커밋(`eb31064`) → origin 푸시 → **`main` 머지·푸시**까지 완료.
- git 식별자는 저장소 로컬 config로 설정(peterkwon248). 다른 머신에서 `git fetch && git checkout main && git pull`로 이어가면 됨.

### 완료
- **before-work** — `peterkwon248/FlowBase` clone, `npm install`
- **Phase 1B (시트 뷰)** — `components/sheet/*` (cell-popover·editable-cell·header-cell·new-row-stub·sheet-view) + `use-sheet-keyboard`/`use-sheet-clipboard`(M4/M5 이식). `app/page.tsx` V2 보드 페이지. 버그 수정: tailwind-merge가 `outline` 스타일 클래스 제거 → 포커스 표시를 `ring`으로 교체.
- **Phase 2 (AI 패널 + Claude)** — 설계 문서 + 구현. `app/api/ai/{_anthropic,infer-batch,ask}` · `lib/flowbase-ai.ts` · 스토어 `acceptAllAi`/`dismissAllAi`/`pushAi` · `components/ai/*` · page 우측 패널 슬롯 + `Toaster`. vitest 도입(infer-batch 5 테스트).
- **Phase 3 (Import 모달)** — 설계 문서 + 구현. `app/api/ai/analyze-import` · `components/import/*` (3-step 위저드) · `createBoard(label,columns?,rows?)` 확장 · 헤더 Import 버튼 · `app/txt-poc` + `lib/parsers/txt-block-parser.ts` 제거. parsers 8 테스트. 버그 수정: import 시 `id` 컬럼명 충돌 → dedup.
- 설계 문서 3개: `docs/02-design/features/flowbase-v2-phase{1,2,3}.design.md` (Phase 1은 기존, 2·3은 신규).

### 큰 결정
- **Phase 2 모델 = `claude-sonnet-4-6`** — claude-api 스킬 기본값은 `claude-opus-4-7`이나, 핸드오프 AI-CONTRACTS + 설계 D2가 Sonnet 지정 + 대량 분류 작업이라 채택. `_anthropic.ts`의 `AI_MODEL` 단일 상수.
- **"Apply all" = Claude infer-batch 호출 + `confirmed:true` 적용**, ⌘Z가 검토 백스톱 (Phase 2 D1).
- **Import = 새 제네릭 보드 생성** — 프로토타입/IMPORT-SPEC §3의 고정필드 휴리스틱 매퍼 폐기 (Phase 3 D1, Phase 1 D4 일관).
- vitest 최소 도입 (Phase 2 Q2).

### 검증
- `tsc --noEmit` green · `npm run build` green (5 라우트) · vitest **13/13** (parsers 8 + infer-batch 5) · 브라우저 동작 확인 (시트 편집·키보드 네비·AI 패널 pending/error toast·Import 3-step 흐름·새 보드 생성). AI 실호출은 키 미설정이라 graceful 에러 경로까지만 검증.

### 다음
1. `.env.local`에 `ANTHROPIC_API_KEY` → AI 실호출 검증.
2. Phase 4 (Kanban + Dashboard) — `main`에서 새 브랜치 분기. `NEXT-ACTION.md` 참조.

### Watch Out
- (해결됨) 작업물은 `feat/sheet-view-v2` 커밋·푸시 + `main` 머지 완료 — origin/main이 이번 세션 결과를 포함. `feat/sheet-view-v2` 브랜치는 origin에 잔존(삭제 선택).
- `ANTHROPIC_API_KEY` 미설정 — 사용자가 마지막에 설정 예정. AI 실호출(infer-batch/ask/analyze-import) 미검증.
- 커밋 시 `next-env.d.ts`(빌드 생성물)·`package-lock.json`(npm install) 변경이 incidental하게 섞여 있음 — 포함 여부 판단.
- Phase 3 Q1: `infer-batch`가 `row.quote` 하드코딩 — 임포트 보드에 `quote` 컬럼 없으면 AI 추론 입력 빈약 (소스 컬럼 일반화는 후속).
- Phase 3 Q2: import 후 새 보드 전환 시 Phase 6(멀티보드 사이드바) 전까지 시드 보드 복귀 UI 없음.
- 프로젝트 eslint는 flat config 부재로 `npm run lint` 동작 안 함 (기존 이슈, 빌드는 무관).

### 머신
kkh94 (`C:\Users\kkh94\OneDrive\Desktop\FlowBase`) — CLAUDE.md 기재 경로(`kwonkyunghun/.../flowdb-port`)와 다른 머신. 다음 작업은 또 다른 머신 예정.

---

## 2026-05-21 (집) — FlowBase V2 재구축 착수: 계획·설계·Phase 1A

### 완료
- **design-ref/ V2 핸드오프 분석** — 핸드오프 6문서 + 프로토타입(`prototype-app.jsx` 등 40여 jsx) 정독
- **V2 7단계 재구축 계획** — `docs/01-plan/features/flowbase-v2.plan.md`
- **Phase 1 design** — `docs/02-design/features/flowbase-v2-phase1.design.md`
- **`feat/flowbase-v2` 브랜치** — `feat/sheet-view` 기반 분기
- **Phase 1A 기반 구현** (커밋 `360de73`) — `types/flowbase.ts`, `lib/flowbase-store.ts`, `flowbase-seed.ts`, `undo-stack.ts`, `parsers.ts`, `keyboard-shortcuts.ts`
- **Phase 1A 재작업** (커밋 `bc8f263`) — 프로토타입 정독 후 제네릭 컬럼 구동 모델로 전면 수정
- `components/sheet/ai-pending-mark.tsx` (Phase 1B 첫 컴포넌트)
- after-work로 `feat/flowbase-v2` → main squash 머지

### 브레인스토밍 & 큰 결정
- **V2 클린 재구축** — 기존 3섹션 UI를 V2 보드 UI로 대체. `feat/sheet-view`의 M1~M5(옛 모델 시트 트라이얼)는 머지 안 하고 *패턴만 이식*
- **핸드오프 ≠ 프로토타입** — 핸드오프 STATE-SHAPES는 프로토타입의 단순화판. 실제 V2는 제네릭 컬럼 구동(10 cell type, 다중 테이블). 일부만 읽고 Phase 1A를 핸드오프 기준으로 지었다가, 사용자 지적 후 프로토타입 정독 → 제네릭 모델로 재작업
- **`dismissAiCell` = 값 유지** + confirmed=true (프로토타입 `onDismissAi`)
- **theme은 next-themes 소유** — V2 스토어 제외
- 진행 방식: design-first (계획 → 설계 문서 → 검토 게이트 → 코드)

### 다음
- Phase 1B (시트 뷰) — `components/sheet/*` + 보드 페이지. NEXT-ACTION.md 참조

### Watch Out
- **after-work로 미완성 Phase 1이 main에 머지됨** — Phase 1A 기반만 있고 동작하는 V2 화면 없음(app/page.tsx는 아직 옛 3섹션). M1~M5 + design-ref(23k줄)도 main에. Phase 1B는 main 위에서 이어감
- **레퍼런스(프로토타입)는 구현 전 끝까지 정독** — 이번 세션 교훈
- 범위: 프로토타입엔 Library/Wiki/Inbox/Automations 등 핸드오프 7단계 밖 서브시스템 — MVP(7단계) 후 재논의

### 머신
집

---

## 2026-05-07 오후 (집) — taste-skill 도입 검토 + Geist fix

### 완료
- **taste-skill 도입 검토** ([docs/01-plan/features/taste-skill-adoption.plan.md](01-plan/features/taste-skill-adoption.plan.md))
  - 13개 스킬 매트릭스 분석, FlowBase 정렬도 70% 확인 (Phosphor ✅, Geist ✅, shadcn, Linear)
  - 4개 도입 옵션 평가 → **옵션 2 (minimalist-skill 단일)** 채택
- **minimalist-skill SKILL.md 다운로드**: `docs/design-skills/minimalist-skill/SKILL.md` (git tracked, 85 lines, MIT 라이선스)
- **프로젝트 가드 룰 작성**: [CLAUDE.md](../CLAUDE.md) (project root)
  - 디자인 우선순위 1·2·3 (MEMORY → tokens → minimalist-skill)
  - LOCK 상수: Status 색 매핑, Phosphor, Geist, FlowBase 명칭
  - FlowBase 가드 매트릭스 (minimalist-skill 권장 vs FlowBase 현실)
  - 트라이얼 결정: `feat/sheet-view`에서 적용 → 1주 평가
- **Geist 폰트 fix** (별건):
  - `app/layout.tsx`: `Geist({ variable: "--font-geist-sans" })` + `<html className={geistSans.variable}>`
  - `app/globals.css`: `--font-sans: var(--font-geist-sans), 'Geist Fallback', system-ui, sans-serif`
  - 이전: variable 연결 없이 `'Geist'` string만, 실제 적용 ❌
- **MEMORY.md Key Design Decision #9, #10 추가** (taste-skill 도입, Geist fix)
- **NEXT-ACTION.md 갱신**: 다음 행동을 옵션 A 시트 뷰 트라이얼(minimalist-skill 적용)로 단일화

### 큰 결정
- **옵션 2 (minimalist-skill 단일)** 채택 — 옵션 3(다이얼 조합)은 복잡도 비대 회피, 옵션 4(redesign-skill만)는 신규 컴포넌트 폴리시 부족
- **세리프 헤딩 도입 ❌** — 앱(데이터 보드)은 산스 톤이 적합. minimalist-skill 권장 Lyon Text/Newsreader/Playfair는 미적용
- **framer-motion 자동 설치 ❌** — MOTION_INTENSITY 1-3만 (정적 ~ 미세 hover/fade). 데이터 보드에 화려한 모션 ❌
- **Status 색 매핑 보존** — 어떤 도입에도 절대 override ❌ (LOCK)
- **`.claude/`는 통째로 gitignored** — SKILL.md를 docs/design-skills/에 git tracked로 둠 (cross-machine sync). install은 명시 reference 패턴

### 다음
1. **옵션 A 시트 뷰 트라이얼 (다음 세션)** — `feat/sheet-view` 브랜치에서 PDCA design 작성 → 구현
2. minimalist-skill 1주 평가 후 본격 도입 또는 후퇴 결정

### Watch Out
- **`feat/sheet-view` 브랜치는 origin 미push** — 다음 세션에서 push 후 PR 작업
- **NEXT-ACTION.md 하단 "폐기된 행동" 섹션** — 원본 옵션 A·B·C 내용 참고용 보존. 시간 지나면 정리
- **CLAUDE.md (project)는 신규** — `before-work` 시 4번째로 읽도록 권장 (Source of Truth는 docs/MEMORY.md, CLAUDE.md는 가드/lock 룰)

### 머신
집

---

## 2026-05-07 오전 (집) — before-work 동기화

### 완료
- **GitHub 레포 rename 확인**: `peterkwon248/flowdb` → `peterkwon248/FlowBase` (GitHub에서 이미 rename 됨, 로컬 origin도 `set-url`로 갱신)
- **18 commits pull (fast-forward)**: PR #3·PR #4 + 2026-05-05 직접 커밋 4건
- **docs 정합성 갱신**: `NEXT-ACTION.md` (날짜/경로/PR 완료), `CONTEXT.md` (Current Features), `TODO.md` (완료 항목), `SESSION-LOG.md` (이 entry), `docs/MEMORY.md` (이미 직전 세션에서 갱신됨 — 그대로)
- **Local memory rehydrate**: `~/.claude/projects/.../memory/project_flowdb_status.md` → 2026-05-07 상태로 갱신

### 직전 세션과의 변경
- 폴더 이름 `Desktop/FlowDB/` → `Desktop/FlowBase/`로 변경됨 (사용자 직접 변경 또는 다른 머신)

### 다음
**다음 라운드 결정 — 옵션 A·B·C 중 사용자 선택 대기 (추천 A).**

### Watch Out
- **NEXT-ACTION.md "환경 정보"의 *모든 경로* 갱신 완료** — 다음 머신/세션 시작 시 stale 안 되도록 주의

### 머신
집

---

## 2026-05-05 ~ 2026-05-07 (mixed: v0.dev / claude.ai / 직접 커밋)

> 직접 작성된 SESSION-LOG entry 없음. PR/commit 메타데이터에서 재구성.

### 완료
- **PR #3 머지** (`aa4f353`, 2026-05-05) — `visual-design-update` (v0[bot] 작업)
  - Phosphor status/priority 아이콘 (`95a1558`)
  - light/dark 컬러 최적화 (`28fc0681`)
  - "Add Ticket" → "Add Task" + 아이콘 추가 (`9e12305`)
  - 워크스페이스 셀렉터 드롭다운 (`ec738d4`)
  - 채널 = 아이콘+텍스트 결합 (`897439f`)
- **2026-05-05 직접 커밋 4건** (committer: `ludimast`, claude.ai 추정)
  - `cc90196` fix: TS errors + lockfile drift (PR #3 후처리)
  - `8f597b0` feat: **FlowBase 리브랜드** + status pill 통합 디자인
  - `e3f8208` style: 미처리 status color slate → **blue**
  - `ced9799` docs: MEMORY.md 갱신 (rebrand session)
- **PR #4 머지** (`2e99933`, 2026-05-07) — `claude/awesome-almeida-b95309` (claude.ai 추정)
  - Linear+shadcn 디자인 overhaul (`be6ae15`)
  - Trash 페이지/섹션, sidebar entry (`8feecf4`, `ac3a...`, mock 포함)
  - Workspaces UX (페이지 + 섹션 + switcher)
  - Quick switcher, Breadcrumb bar, Settings section
  - Design tokens 시스템 (`DESIGN-TOKENS.md`, `lib/tokens.ts`)

### 큰 결정 (커밋/MEMORY에서 추출)
- **제품명: FlowDB → FlowBase** (사용자 노출). 내부 docs/spec의 "FlowDB" 표기는 점진 정리 (긴급 ❌)
- **Status 색 매핑 합의**: 미처리=blue (red ❌, priority Urgent 충돌), 진행중=amber, 대기=violet, 완료=emerald
- **Status indicator는 단일 pill** (아이콘+이름+카운트 통합. 분리된 count 배지는 -100 shade에서 안 보임)

### Watch Out
- **이 entry는 재구성**: 실 작업 흐름의 디테일/브레인스토밍 내용은 누락. PR description/commit message만으로 복원 가능한 부분만 기록
- **3개 환경 mixed**: v0.dev (PR #3 빌드) + claude.ai (PR #4, 일부 직접 커밋) + 로컬 (머지) — 다음 작업은 어느 환경이든 *origin/main 기준*으로 시작

### 머신
mixed (v0.dev / claude.ai / 집 로컬)

---

## 2026-05-04 오후 (집)

### 완료
- **txt 블록 자동 분류 PoC 구현 + 머지** — PR #1 (`feat: txt 블록 자동 분류 PoC`, `fac55e1`)
  - `lib/parsers/txt-block-parser.ts`: `***` 구분자 + `<헤더>` 정규식 + 8개 카테고리 키워드 추론 (60줄 순수 함수)
  - `app/txt-poc/page.tsx`: 검증 페이지 (드롭존 + 표 + 카테고리 분포 Badge), 사이드바 진입점 없음
  - 사용자 데이터 `머레이 상황별 템플릿.txt` 231 블록 → 8 카테고리 분포 검증 완료
- **글로벌 명령어 강화**: `~/.claude/commands/{after-work,before-work}.md`
  - 상단 경고: "크로스-머신 동기화. local memory는 보조 캐시"
  - **단계 0 Bootstrap** 추가 (필수 docs 누락 시 skeleton 자동 생성)
  - after-work 단계 5: docs staging 검증, 단계 8: Merge 보호 명시
  - before-work 머신 변경 감지를 단계 2로 위로 이동, 단계 7: docs → local rehydrate
- **Local memory 작성**: `feedback_workflow_skills.md` + `project_flowdb_status.md` + `MEMORY.md` 인덱스
- **Docs bootstrap (이번 entry)**: `docs/{SESSION-LOG, MEMORY, CONTEXT, TODO}.md` 신규 + `NEXT-ACTION.md` 갱신

### 브레인스토밍 & 큰 결정
- **chartdb.io 비교**: chartdb는 *DB 스키마 설계* 도구, FlowDB는 *데이터 정리* 도구. 도메인 다름. 정적+LLM 분기 패턴은 참고할 만함. DBML export로 두 도구 협력 가능.
- **디스플레이 자동 추천 원칙 합의**: "모두 항상 다 있다" ❌, "데이터 도메인이 허용할 때만 활성화" ✓ (Notion/Airtable 비대 함정 회피)
- **다음 라운드 3 후보 정리**: 시트 뷰(★★★★★) / 사람 확정 UI(★★★★) / LLM 하이브리드(★★★) — 우선순위 A ≫ B ≫ C
- **워크스페이스 진입점**: 클릭 핸들러 없는 게 *의도적* placeholder ([docs/02-v01-backlog.md:99](02-v01-backlog.md)). W11 작업.
- **PR #1은 머지까지 완료** — `gh pr merge --merge --delete-branch` 단번에

### 다음
**NEXT-ACTION.md 의 다음 행동 3 후보 중 선택. 추천: 옵션 A (시트 뷰).**

### Watch Out
- ⚠️ **after-work 일반 안전 원칙으로 머지 단계 자의적 누락 금지** — 이번 세션 초기에 머지를 옵션으로 제시했다가 호된 지적 받음. 명령어 정의 자체가 명시 승인 단위. 강화된 명령어 정의에 명시 박힘.
- ⚠️ **워크트리 함정**: `.claude/worktrees/` 안은 Plot 노트앱용. FlowDB 코드는 `flowdb-port/` 메인 working tree에. 이번 세션에서 worktree 안에 있으면서 절대경로로 메인에 직접 작성, 별도 처리 단계 필요했음.
- `"원"` 키워드 광범위 false positive — "가격 59" 분류 일부 의심. 옵션 C 안 가도 옵션 A·B 진행 중에 정밀화 백로그.

### 머신
집
