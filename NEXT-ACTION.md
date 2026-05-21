# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-05-21 (kkh94 머신)

---

## 🚨 최우선 — 미커밋 작업물 (다른 머신 이어가기 전 필수)

Phase 1B·2·3 구현 + 설계 문서 3개가 **`feat/sheet-view-v2` 브랜치에 미커밋 + origin 미push** 상태다.
**커밋 + 푸시 안 하면 이 작업 전체가 유실된다.**

**블로커**: git `user.name`/`user.email` 미설정 → 커밋 불가.

해결 절차 (직전 머신 = kkh built에서):
```
git config user.name "peterkwon248"
git config user.email "vmfhxhtmwkd7@gmail.com"   # repo 기존 커밋의 식별자
git add -A          # next-env.d.ts·package-lock.json 포함 여부는 확인 후
git commit -m "feat: FlowBase V2 Phase 1B·2·3 (시트 뷰 · AI 패널 · Import)"
git push -u origin feat/sheet-view-v2
```

**다른 머신에서 보고 있다면**: `git fetch` 후 origin에 `feat/sheet-view-v2`가 있는지 먼저 확인.
없으면 직전 머신(kkh94)에서 푸시가 안 된 것 — 그 머신으로 돌아가 위 절차 수행해야 함.

---

## 한 줄 요약

**FlowBase V2 — Phase 1~3 구현 완료(미커밋). 커밋·푸시 후 Phase 4(Kanban + Dashboard).**

---

## 현재 상태

### ✅ 완료 (2026-05-21 세션 — 전부 미커밋)
- **Phase 1B 시트 뷰** — `components/sheet/*` + 키보드/클립보드 hook + V2 보드 페이지
- **Phase 2 AI 패널 + Claude** — `app/api/ai/*` 라우트 · `lib/flowbase-ai.ts` · 스토어 AI 액션 · `components/ai/*` · 우측 패널
- **Phase 3 Import 모달** — `app/api/ai/analyze-import` · `components/import/*` 3-step 위저드 · `app/txt-poc` 제거
- 설계 문서: `docs/02-design/features/flowbase-v2-phase{1,2,3}.design.md`
- 검증: tsc · build · vitest 13/13 green. (AI 실호출은 키 미설정이라 미검증)

### ⬜ 다음
1. 🚨 **커밋 + 푸시** (위 절차)
2. `.env.local`에 `ANTHROPIC_API_KEY` → AI 실호출(infer-batch/ask/analyze-import) 검증
3. **Phase 4 — Kanban + Dashboard**

---

## 다음 행동 — Phase 4 (Kanban + Dashboard)

PDCA대로 `docs/02-design/features/flowbase-v2-phase4.design.md` 설계 먼저. [plan §8 Phase 4](docs/01-plan/features/flowbase-v2.plan.md) 참조.

- `components/board/view-switcher.tsx` — Sheet | Kanban | Dashboard 뷰 전환 (스토어 `viewByBoardId`·`setView`는 Phase 1A 완비)
- `components/sections/kanban-view.tsx` — 4 status 컬럼(미처리/진행중/대기/완료, LOCK 색), 카드 status 이동 ↔ 시트 반영
- `components/charts/*` (recharts — `components/ui/chart.tsx` 활용) + `components/sections/dashboard-view.tsx` — KPI 타일 + 차트
- **Done**: 뷰 즉시 전환 · Kanban status 변경이 store 반영 · Dashboard가 filter/search 추종

---

## Phase 진행 상황 (V2 — 7단계)

- [x] **Phase 1A 기반** · **1B 시트 뷰**
- [x] **Phase 2 AI 패널 + Claude**
- [x] **Phase 3 Import 모달**
- [ ] **Phase 4 — Kanban + Dashboard** ← 다음
- [ ] Phase 5 — 앱 셸 완성 (Activity bar·Sidebar·패널 토글·단축키)
- [ ] Phase 6 — 멀티 보드 + Schema 뷰
- [ ] Phase 7 — BaaS

---

## 보류 중인 항목

- **`ANTHROPIC_API_KEY`** — Phase 2 AI 실호출 검증 블로커. `.env.local` 필요 (사용자가 마지막에 설정 예정).
- **BaaS 결정** (Supabase vs bkend.ai) — Phase 7 블로커. `docs/01-baas-decision.md`.
- **Phase 3 Q1** — `infer-batch`가 `row.quote` 하드코딩. 임포트 보드에 quote류 컬럼 없으면 AI 추론 입력 빈약 → 소스 컬럼 일반화는 후속 Phase.
- **Phase 3 Q2** — import로 새 보드 전환 시 Phase 6(멀티보드 UI) 전까지 시드 보드 복귀 수단 없음.
- **옛 `components/sections/*`** (design/operations/data-section 등) — V2가 해당 뷰를 대체하는 Phase(4·6)에서 단계적 삭제.

---

## 환경 정보

| | |
|---|---|
| GitHub | https://github.com/peterkwon248/FlowBase (private) |
| 작업 브랜치 | **`feat/sheet-view-v2`** (⚠️ origin 미push) |
| 미리보기 | http://localhost:3000 (`npm run dev`) |
| 패키지 매니저 | **npm** |
| 테스트 | `npm test` (vitest) |

---

## 머신

kkh94 (`C:\Users\kkh94\OneDrive\Desktop\FlowBase`). 다음은 다른 머신 — before-work 시 origin 동기화 + 브랜치 확인 필수.
