# SESSION-LOG

세션 history (append-only). 가장 최근 entry가 위.

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
