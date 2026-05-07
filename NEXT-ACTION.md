# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-05-07 (집)

---

## 한 줄 요약

**taste-skill 도입 검토 완료 (옵션 2: minimalist-skill 단일) + Geist 폰트 fix + 프로젝트 가드 룰 박음. 다음: 옵션 A 시트 뷰 트라이얼 (`feat/sheet-view` 브랜치, minimalist-skill 적용).**

---

## 현재 상태

### ✅ 완료 (2026-05-05 이후 추가)
- **PR #3 머지** — `visual-design-update` (`aa4f353`, 2026-05-05)
  - 채널 아이콘+텍스트 결합, Phosphor status/priority 아이콘
  - 워크스페이스 셀렉터, 라이트/다크 컬러 최적화
- **빌드 fix** — TS 에러 + lockfile drift (`cc90196`, 2026-05-05)
- **FlowBase 리브랜드** (`8f597b0`, 2026-05-05) — 사용자 노출 명칭 FlowDB → **FlowBase**. 사이드바/page title/CSV→데이터 업로드. GitHub 레포도 `peterkwon248/flowdb` → `peterkwon248/FlowBase` rename 완료
- **운영 status pill 통합** (`8f597b0` + `e3f8208`, 2026-05-05) — 미처리=blue (red ❌, priority Urgent와 충돌 회피). 아이콘+이름+카운트 단일 pill
- **PR #4 머지** — `claude/awesome-almeida-b95309` (`2e99933`, 2026-05-07)
  - Linear+shadcn 디자인 overhaul (`be6ae15`)
  - **Trash** 페이지/섹션 (`app/trash/page.tsx`, `components/sections/trash-section.tsx`)
  - **Workspaces** UX (`app/workspaces/page.tsx`, `components/sections/workspaces-section.tsx`, `workspace-switcher.tsx`)
  - **Quick switcher**, **Breadcrumb bar**, **Settings section**
  - **Design tokens** (`DESIGN-TOKENS.md`, `lib/tokens.ts`)
  - mock 데이터 (`lib/mock-trash.ts`, `lib/mock-workspaces.ts`)

### ✅ 완료 (2026-04-28 ~ 2026-05-04)
- **PR #1 머지** — `feat: txt 블록 자동 분류 PoC` (`fac55e1`, 2026-05-04)
  - `lib/parsers/txt-block-parser.ts` (60줄, `***` 구분 + `<헤더>` + 키워드 카테고리 추론)
  - `app/txt-poc/page.tsx` (검증 페이지, 사이드바 진입점 없음, `/txt-poc` 직접 접근)
- 검증 데이터: `머레이 상황별 템플릿.txt` 231 블록 → 8 카테고리
  - 가격 59 / 기타 53 / 사용법 38 / 연락처 23 / 제품 스펙 20 / CS/응대 18 / 계정/인증 14 / 품질/검수 6
- 사용자 평가: *"지금도 나쁘지 않다"* (정적 키워드 분류 만족)
- 글로벌 명령어 강화: `~/.claude/commands/{after-work,before-work}.md` 크로스-머신 동기화 의도 명확화

### ✅ 완료 (이전)
- Claude Design 앱 기능을 FlowDB 3 섹션(설계·데이터·운영)에 이식
- shadcn/ui 기반 UI 동작
- v0.1 코드 감사 (백로그 분류: 🟢 24 / 🟡 13 / 🔴 1)
- GitHub 레포 분리 + 첫 푸시 (peterkwon248/flowdb, private)

### ⬜ 결정 대기
- **다음 라운드 후보 3개** (아래 "다음 행동")
- **BaaS 선택**: Supabase vs bkend.ai (이전 갈림길, 여전히 유효)

---

## 다음 행동 (2026-05-07 결정 후)

### 🎯 옵션 A 시트 뷰 트라이얼 (minimalist-skill 적용) — 1차

**`feat/sheet-view` 브랜치 이미 생성됨 (origin 미push).**

1. `git checkout feat/sheet-view` (이미 main에서 분기 완료)
2. PDCA design 작성: `docs/02-design/features/sheet-view.design.md`
   - viewMode = "table" | "sheet" 토글
   - 셀 인라인 편집 (input/select/checkbox 분기)
   - 키보드 네비게이션 (Tab/Enter/Arrow/Esc)
   - 복붙 지원 (clipboard 다중 셀)
   - **minimalist-skill 적용 룰** (CLAUDE.md 가드 매트릭스 따름)
   - **디스플레이 자동 추천 원칙** spec 박기 ([MEMORY.md #5](docs/MEMORY.md#key-design-decisions))
3. 구현: `components/sections/data-section.tsx` 위주
4. 1주 평가 후 minimalist-skill 본격 도입 또는 후퇴 결정
5. PR → main 머지

### 후순위 옵션 (옵션 A 머지 후 재검토)

**옵션 B. 카테고리 인라인 편집 UI** — `app/txt-poc/page.tsx` 셀 클릭 → 드롭다운. spec §0 *AI 추천 + 사람 확정* 적용.
**옵션 C. LLM 하이브리드 분류** — "기타" 블록만 LLM 보강 (옵션 B 선결).

---

## 폐기된 행동 (참고용)

### ~~🥇 옵션 A. 시트 뷰 (편집용 표) — 가장 실효 큼~~

> 2026-05-07: 옵션 A 단독 진입 직전 사용자가 taste-skill 도입을 제기. 검토 후 옵션 2(minimalist-skill 단일) 채택. 옵션 A는 minimalist-skill 적용 트라이얼 형태로 진행.


**왜**: 솔로 창업자/PM 페르소나의 *5분 안에 정리* 약속과 직결. 현재 데이터 섹션 표는 *읽기용* (정렬·검색만, 편집 ❌). 응대 멘트 200→300으로 키울 때 시트 없으면 거짓말.

**행동**:
1. `git checkout -b feat/sheet-view`
2. `components/sections/data-section.tsx` 에 `viewMode = "table" | "sheet"` 토글 추가
3. 시트 뷰: 셀 인라인 편집, 키보드 네비게이션, 복붙 지원
4. **디스플레이 자동 추천 원칙**도 같이 박기 — 데이터 도메인이 허용할 때만 활성화 (MEMORY.md "Key Design Decisions" 참조)
5. PR → main 머지

### 🥈 옵션 B. 카테고리 인라인 편집 UI (사람 확정 UI)
**왜**: [import-flow-spec §0 원칙 1](docs/specs/flowdb-import-flow-spec.md) — *AI 추천은 항상 카드 형태로 분리. 자동 적용 ❌* — 가 PoC에 안 박힘. 카테고리가 자동 적용 상태 = spec 위반.

**행동**:
1. `git checkout -b feat/category-confirm-ui`
2. `app/txt-poc/page.tsx` 의 카테고리 셀 클릭 → 드롭다운으로 수정 가능
3. 빨간 점 표시: AI 추천이 사람 확정 안 된 상태
4. 모두 확정 / 일괄 수락 단축키
5. PR → main 머지

### 🥉 옵션 C. LLM 하이브리드 카테고리 분류
**왜**: "가격 59"의 false positive(`"원"` 광범위 키워드)와 "기타 53" 정밀화. chartdb.io의 정적+LLM 분기 패턴 참고.

**행동**:
1. `git checkout -b feat/llm-hybrid-classify`
2. 정적 분류 결과 후 "기타" 블록만 LLM 호출 (Anthropic API)
3. 결과를 추천 카드로 표시 (자동 적용 ❌, 옵션 B와 같은 흐름이 전제)
4. PR → main 머지

→ **추천 우선순위: A ≫ B ≫ C**. A가 가장 실효 크고 도메인 의존도 낮음. C는 B(사람 확정 UI) 선결.

---

## 잊지 말 것 (이번 세션의 핵심 결정)

1. **AI 추천 + 사람 확정 모델** — 본 제품의 핵심 신뢰 구조. 자동 적용 ❌. 모든 분류·추천은 카드 형태 → 사용자 확정 클릭. ([spec §0:9](docs/specs/flowdb-import-flow-spec.md))
2. **디스플레이 자동 추천 원칙** (2026-05-04 합의) — "모두 항상 다 있다" ❌. 데이터 도메인이 허용할 때만 활성화. 컬럼 조건별 매핑은 [docs/MEMORY.md](docs/MEMORY.md) 참조. Notion/Airtable 비대 함정 회피.
3. **txt 블록 파서는 재사용 자산** — `lib/parsers/txt-block-parser.ts`. Phase 1 정식 import flow에서 그대로 사용. `app/txt-poc/page.tsx`는 정식 통합 시 제거.
4. **워크스페이스 진입점은 W11 작업** — 사이드바 워크스페이스 행은 `onClick` 없는 placeholder. 의도적. ([docs/02-v01-backlog.md:99](docs/02-v01-backlog.md))
5. **chartdb.io는 도메인이 다른 도구** — DB 스키마 *설계*용. FlowDB는 데이터 *정리*용. 정적+LLM 분기 패턴은 참고할 만함. DBML export로 두 도구 협력 가능.

---

## 환경 정보

| | |
|---|---|
| 코드 위치 | `C:\Users\kwonkyunghun\Desktop\FlowBase\flowdb-port` |
| GitHub 레포 | https://github.com/peterkwon248/FlowBase (private) |
| 미리보기 URL | http://localhost:3000 (`npm run dev`) |
| `/txt-poc` 라우트 | http://localhost:3000/txt-poc (PoC 검증 페이지) |
| `/workspaces` 라우트 | http://localhost:3000/workspaces (PR #4) |
| `/trash` 라우트 | http://localhost:3000/trash (PR #4) |
| Reference (gitignore 외부) | `C:\Users\kwonkyunghun\Desktop\FlowBase\claude_design_ref` |
| 다른 프로젝트 워크트리 (혼동 금지) | `C:\Users\kwonkyunghun\Desktop\FlowBase\.claude\worktrees\` — Plot 노트앱용, FlowBase 무관 |

---

## 작업 흐름

```bash
cd C:\Users\kwonkyunghun\Desktop\FlowBase\flowdb-port
git checkout main && git pull
git checkout -b feat/<작업명>

# 작업 후
git add . && git commit -m "feat: ..."
git push -u origin feat/<작업명>
gh pr create --base main

# 머지 후
git checkout main && git pull
git branch -d feat/<작업명>
```

---

## 빠뜨리지 말 것

- **AI 추천은 항상 카드 형태 + 사람 확정** — 본 제품의 핵심 신뢰 모델 (자동 적용 ❌)
- **모든 결정 되돌릴 수 있음** — 30일 rollback이 import flow의 백스톱
- **3 진입점 분리** — 빈 새 테이블 / 파일→새 / 파일→기존
- **상용화 타임라인**: 1인 풀타임 시 12주 → 베타, +8주 → 런칭
