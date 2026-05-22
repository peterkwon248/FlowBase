# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-05-23 (kkh94 머신)

---

## 한 줄 요약

**앱 범위 재정의 — V2 "Phase 1~6"은 6모드 중 Tables 서브시스템 하나뿐이었음. 셸을 6모드 라우터로 재구축(Phase A 완료). 다음은 Library 서브시스템 구현 — B1부터.**

---

## ⚠️ 이번 세션의 큰 전환 (꼭 읽기)

직전까지 docs는 "Phase 1~6 완료, 남은 건 Phase 7 BaaS"였으나 — 실제로는 프로토타입(`design-ref/prototype/`)이 그리는 앱의 **약 1/6**만 만들어진 상태였음. 프로토타입의 액티비티 바는 **6모드**(Inbox·Tables·Workspace·Library·Wiki·Search)인데 V2는 Tables 모드(시트·칸반·대시보드)만 구현.

→ 범위 재정의: 나머지 서브시스템(Library·Wiki·Inbox·Workspace·Search)을 차례로 구축. **BaaS(옛 Phase 7)는 서브시스템 구축 뒤로 후순위.**

---

## 현재 상태

### ✅ 완료 (이번 세션 — `main` 머지·푸시)
- **before/after-work 명령어** — `<repo>/.claude/commands/`에 프로젝트 커맨드로. `.gitignore` 예외로 git 추적 → 모든 머신 sync.
- **Phase 3 Q1** (`afa39f1`) — `infer-batch` 소스 컬럼을 `sourceField` 인자로 일반화.
- **옛 V1 코드 정리** (`4fa804a`) — 도달 불가능한 V1 파일 20개 삭제 (−7,025줄).
- **Phase A — 앱 셸 6모드 라우터** (`daad859`) — 액티비티 바 6모드 레일 · `activityMode` 라우터 · **Schema를 Tables 뷰 탭 → Workspace 모드로 이동** · Library/Wiki/Inbox/Search는 "준비 중" 스텁.
- **Phase B 설계** — `docs/02-design/features/flowbase-v2-library.design.md`.

### ⬜ 다음 — Phase B: Library 서브시스템 — **B1 구현**

설계 문서 `flowbase-v2-library.design.md` §5 참조. **B1 = 데이터 모델 + 시드 + Library 모드(사이드바+카탈로그, 읽기 전용 브라우즈).** 7단계:

1. `types/flowbase.ts` — Library 타입 5종 (OptionList·LibraryField·LibraryTemplate·LibraryFunction·LibraryDashboard)
2. `lib/flowbase-library-seed.ts` — `LIBRARY_CATEGORIES` + `createSeedLibrary()` (프로토타입 `library-data.jsx` 포팅)
3. `lib/flowbase-store.ts` — `library` 상태 + `libCategory/libAssetId/libView` + B1 액션 + partialize
4. `components/library/library-sidebar.tsx` — 5 카테고리 트리
5. `components/library/category-catalog.tsx` — 자산 카드 그리드
6. `components/library/library-mode.tsx` — 셸 조립
7. `app/page.tsx` — library 모드 → `<LibraryMode />` (스텁 교체)

이후 **B2**(자산 디테일 뷰) → **B3**(인라인 편집) → **B4**(테이블 연동).

---

## 보류 중인 항목

- **반응형 레이아웃 깨짐** — ~800px 폭에서 4패널이 안 들어맞아 보드·시트가 무너짐(AI 패널이 보드 영역 덮음). 반응형 처리 부재. 별도 작업 필요. (사용자 우선순위: 기능 > 반응형.)
- **`ANTHROPIC_API_KEY`** 미설정 — AI 실호출(infer-batch/ask/analyze-import) 여전히 미검증.
- **BaaS 결정** (Supabase vs bkend.ai, `docs/01-baas-decision.md`) — 옛 Phase 7. 서브시스템 구축 뒤로 후순위.
- 콘솔 script-tag 경고 6개 — preview 환경/기존 것, 코드 무관.
- `pnpm-lock.yaml` 중복 lockfile 경고 — 빌드 무관, 기존 이슈.

---

## 환경 정보

| | |
|---|---|
| GitHub | https://github.com/peterkwon248/FlowBase (private) |
| 기준 브랜치 | **`main`** (이번 세션 작업 머지 완료) |
| 미리보기 | http://localhost:3000 (`npm run dev`) |
| 패키지 매니저 | **npm** · 테스트 `npm test` 또는 `npx vitest run` |
| 명령어 | `/before-work` · `/after-work` — `.claude/commands/` (git 추적) |

---

## 머신

kkh94 (`C:\Users\kkh94\OneDrive\Desktop\FlowBase`). 다른 머신에서 이어갈 때: `git fetch && git checkout main && git pull && npm install`.
