# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-05-21 (kkh94 머신)

---

## 한 줄 요약

**FlowBase V2 — Phase 1~6 (전 기능) 완료 → `main` 머지·푸시 완료. 남은 Phase 7(BaaS)은 BaaS 결정이 블로커.**

---

## 현재 상태

### ✅ 완료 (전부 `main`에 머지·푸시됨)
- **Phase 1~3** — 시트 뷰 · AI 패널+Claude · Import 모달
- **Phase 4** — Kanban + Dashboard + 뷰 스위처
- **Phase 5** — 앱 셸 (Activity bar · Sidebar · 패널 토글 · 키보드 단축키)
- **Phase 6** — 멀티보드 (보드 rename/delete) + Schema 뷰
- 설계 문서: `docs/02-design/features/flowbase-v2-phase{1~6}.design.md`
- 검증: tsc · build · vitest(13) green. 브라우저 동작 확인 완료.

### ⬜ 다음 — Phase 7 (BaaS) — ⚠️ 결정 블로커
- **선결**: `docs/01-baas-decision.md` — **Supabase vs bkend.ai 결정 필요**.
- 결정 후: supabase migrations + RLS · Auth UI(Magic link) · sync layer(optimistic + realtime) · localStorage→BaaS 일회성 마이그레이션.
- Phase 1~6은 localStorage 기반이라 Phase 7과 무관하게 완전히 동작.

---

## Phase 7가 막혀 있으면 — 대신 할 만한 것

1. **`ANTHROPIC_API_KEY` 설정 + AI 실호출 검증** — `.env.local`에 키. infer-batch / ask / analyze-import 실제 Claude 호출이 아직 미검증 (지금까지 graceful 에러 경로까지만).
2. **옛 V2-미사용 코드 정리** (별건) — `components/app-sidebar.tsx` · `components/sections/{data,design,operations,settings,trash,workspaces}-section.tsx` · `app/{trash,workspaces}` 라우트 · `lib/mock-*.ts` 삭제.
   - ⚠️ `lib/tokens.ts`가 `lib/mock-data.ts`의 타입(`Tone`/`ChartColor`)을 import — 타입을 `tokens.ts`로 옮기거나 인라인한 뒤 삭제할 것. 의존 그래프 확인 필수.
3. **Phase 3 Q1 후속** — `infer-batch`의 `row.quote` 하드코딩을 `sourceField` 인자로 일반화 (임포트 보드 AI 추론 입력).

---

## Phase 진행 상황 (V2 — 7단계)

- [x] **Phase 1A·1B** — 기반 · 시트 뷰
- [x] **Phase 2** — AI 패널 + Claude
- [x] **Phase 3** — Import 모달
- [x] **Phase 4** — Kanban + Dashboard
- [x] **Phase 5** — 앱 셸 + 키보드 단축키
- [x] **Phase 6** — 멀티보드 + Schema 뷰
- [ ] **Phase 7** — BaaS (블로커: BaaS 결정)

---

## 보류 중인 항목

- **BaaS 결정** (Supabase vs bkend.ai) — Phase 7 블로커. `docs/01-baas-decision.md`.
- **`ANTHROPIC_API_KEY`** — AI 실호출 검증용. `.env.local`.
- **옛 V2-미사용 코드 정리** — 별건 (위 참조).
- **Phase 3 Q1** — infer-batch 소스 컬럼 일반화.
- `feat/sheet-view-v2`·`feat/kanban-dashboard` 브랜치 — main 머지 후 origin 잔존 (삭제 선택).

---

## 환경 정보

| | |
|---|---|
| GitHub | https://github.com/peterkwon248/FlowBase (private) |
| 기준 브랜치 | **`main`** (Phase 1~6 머지 완료) |
| 미리보기 | http://localhost:3000 (`npm run dev`) |
| 패키지 매니저 | **npm** · 테스트 `npm test` (vitest) |

---

## 머신

kkh94 (`C:\Users\kkh94\OneDrive\Desktop\FlowBase`). 다른 머신에서 이어갈 때: `git fetch && git checkout main && git pull && npm install`.
