# SESSION-LOG

세션 history (append-only). 가장 최근 entry가 위.

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
