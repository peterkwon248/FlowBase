# FlowBase V2 — Phase 2 (AI Activity 패널 + 진짜 Claude) Design

> 작성: 2026-05-21 · Phase: PDCA Design
> Plan: [flowbase-v2.plan.md §8 Phase 2](../../01-plan/features/flowbase-v2.plan.md)
> 정본: `design-ref/handoff/{AI-CONTRACTS,COMPONENT-MAP,STATE-SHAPES}.md` + `prototype/{prototype,sheet}.jsx`
> 선행: Phase 1B 완료 (`components/sheet/*` + 보드 페이지, `feat/sheet-view-v2`)
> 🚦 **이 문서는 구현 전 검토 게이트 대상** — §14 결정/미결 질문 확인 후 코드 착수.

## 0. 배경

Phase 1B까지 시트 뷰는 동작하나 AI는 전부 mock이다. 시드 보드의 `theme`/`sentiment`는 `confirmed:false`로 pre-draft 되어 pending 마커만 표시될 뿐, 실제 Claude 호출은 없다. Phase 2는 **진짜 Claude 연동**(서버 라우트 경유)과 **AI Activity 패널**(우측)을 추가해 "AI가 초안 → 사람이 확정" 모델을 앱 차원에서 완성한다.

## 1. 범위

**In**
- ✅ 서버 라우트 — `app/api/ai/{_anthropic,infer-batch,ask}` (Anthropic SDK, 키는 서버 전용)
- ✅ 클라이언트 어댑터 — `lib/flowbase-ai.ts` (fetch 래퍼 + throttle + chunk)
- ✅ 스토어 확장 — `acceptAllAi` · `dismissAllAi` · `pushAi` (배치 적용 + aiHistory)
- ✅ `components/ai/*` — ai-activity-panel · pending-card · timeline-item · ai-composer
- ✅ 앱 셸 — `app/page.tsx`에 AI 패널 슬롯(우측) 추가
- ✅ 환경변수 — `.env.local` / `.env.example`에 `ANTHROPIC_API_KEY`

**Out (후속 Phase)**
- ❌ `/api/ai/analyze-import` + Import 모달 (Phase 3)
- ❌ 패널 토글/edge collapse/햄버거 (Phase 5 — Phase 2는 고정 슬롯, D6)
- ❌ Streaming/SSE (AI-CONTRACTS §4 — 응답 1~3초라 non-streaming으로 충분)
- ❌ "make a chart of X" 같은 도구형 ask (AI-CONTRACTS §3 v2)

## 2. 아키텍처 — 데이터 흐름

```
[AI Activity 패널]                      [서버: Next.js route]        [Anthropic]
 PendingCard "Apply all"  ──callAI──▶  /api/ai/infer-batch  ──SDK──▶ messages.create
                          ◀─JSON────   { results, modelUsed, durationMs }
 AiComposer "Send"        ──callAI──▶  /api/ai/ask          ──SDK──▶ messages.create
                          ◀─JSON────   { text }
        │
        └─▶ store.acceptAllAi(col, results)  →  rows 갱신(1 undo 스냅샷) + pushAi
```

- **API key는 서버에만** — `process.env.ANTHROPIC_API_KEY`. 클라이언트 번들 노출 ❌ (AI-CONTRACTS §0).
- 클라이언트는 `/api/ai/*`만 호출. Anthropic SDK는 서버 라우트에서만 import.

## 3. 환경변수 + 의존성

```bash
# .env.local (gitignore — .env*.local 이미 제외됨)
ANTHROPIC_API_KEY=sk-ant-…
```
- `.env.example` 신규 — `ANTHROPIC_API_KEY=` 빈 값 템플릿. `README.md`에 1줄 안내.
- 의존성 추가: `@anthropic-ai/sdk` (plan §7). 설치는 Phase 2 착수 시 1회.
- 미설정 시: 라우트가 500 + 명확한 메시지 반환 → 클라이언트 toast (D7).

## 4. 서버 라우트 — `app/api/ai/`

런타임은 Node (Anthropic SDK). 각 라우트 `export const runtime = "nodejs"`.

### 4.1 `_anthropic.ts` — 공통 서버 어댑터
- `getClient()` — `new Anthropic({ apiKey })`. 키 부재 시 throw → 라우트가 500 처리.
- `ask(opts)` — `messages.create` 래퍼. **AI-CONTRACTS §0.1 대비 개선**: 정적 지시문은 `system` 블록으로 분리하고 `cache_control: { type: "ephemeral" }` 부여 → 반복 배치에서 prompt cache 적중. 동적 데이터(행 목록)만 `user` 메시지.
- `parseJsonArray` / `parseJsonObject` — 응답에서 JSON 추출 (AI-CONTRACTS §0.1 그대로).
- **model id**: `_anthropic.ts` 단일 상수. 구현 시 `claude-api` 스킬로 최신 안정 Sonnet 확정 (D2 — 본 문서에 모델 문자열 박지 않음).

### 4.2 `infer-batch/route.ts` — Theme/Sentiment 일괄 분류
- `POST` — Req `{ column: "theme"|"sentiment", rows: {id,quote}[], themeOptions? }`.
- 가드: `rows` 빈 배열 → `{results:[]}`. `rows.length > 100` → 400 (클라이언트가 chunk, §10).
- 프롬프트: AI-CONTRACTS §1 (theme/sentiment 분기). 정적부 → `system`(캐시), 행 목록 → `user`.
- 응답 파싱 → `{ id, value }[]`. THEME_OPTIONS 밖 값은 `"Other"` fallback, sentiment는 `"Mixed"` fallback.
- Res `{ results: {id,value}[], modelUsed, durationMs }`.
- 실패 모드 (AI-CONTRACTS §1): JSON 아님 → throw(500); 일부 row 누락 → id 매칭, 누락분 그대로; 429 → 그대로 전달, 클라이언트가 재시도 버튼.

### 4.3 `ask/route.ts` — AI Composer 자유 질의
- `POST` — Req `{ prompt, context: { boardLabel, rowCount } }`.
- 프롬프트: AI-CONTRACTS §3 템플릿. 1~2문장, 한국어 입력엔 한국어.
- Res `{ text }`.
- 행을 수정하지 않음 (읽기 전용 Q&A).

## 5. 클라이언트 어댑터 — `lib/flowbase-ai.ts`

- `callAI<TReq,TRes>(endpoint, body)` — AI-CONTRACTS §0 fetch 래퍼. `!res.ok` → Error throw.
- **throttle** — 같은 endpoint 5초 (AI-CONTRACTS §5). `localStorage["flowbase-ai-last-<endpoint>"]` 타임스탬프 비교, 위반 시 throw `ThrottleError` → 호출부가 toast.
- **chunk** — `inferBatch(column, rows)` 헬퍼: rows > 100이면 100개씩 순차 호출 + 결과 머지. 진행 중 progress toast 갱신 (§10). 시드 10행은 미발동이나 계약상 구현.
- 타입(`InferBatchReq/Res`, `AskReq/Res`)은 이 파일에 공유 정의 — 서버 라우트도 동일 타입 import.

## 6. 스토어 확장 — `lib/flowbase-store.ts`

Phase 1A 스토어에 **액션만 추가**. 상태 shape 불변 → `STORE_VERSION` 4 유지, 마이그레이션 불필요 (D5). `aiHistory`는 이미 `Board`에 존재.

| 액션 | 동작 |
|---|---|
| `acceptAllAi(col, results)` | 변경 전 **1회 undo 스냅샷**. `results`의 각 `{id,value}`를 해당 row에 `row[col]=value` + `{col}Confirmed=true`. AI 배치 적용 = 1 undo 단위 → ⌘Z 한 번에 복원. 이후 `pushAi` 호출. |
| `dismissAllAi(col)` | 해당 컬럼의 pending 행 전부 `{col}Confirmed=true` (**값 유지** — Phase 1 Q1과 동일). undo 스냅샷 1회. `pushAi(status:"dismissed")`. |
| `pushAi(entry)` | `aiHistory`에 `{id, time}` 채워 append. active board 대상. persist 대상(`boards`에 포함). |

- `acceptAllAi`/`dismissAllAi`는 active board 기준. `commitAiCell`/`dismissAiCell`(Phase 1A, per-cell)은 그대로 — 단 **per-cell은 aiHistory 미기록** (timeline flood 방지, D4). 배치·ask만 timeline에 남김.
- `aiHistory` 정렬: append 순. 패널은 `slice().reverse()`로 최신 위 (프로토타입 `InteractiveActivityPanel`).

## 7. 컴포넌트 — `components/ai/`

프로토타입 `InteractiveActivityPanel` (prototype.jsx) 기준. shadcn 프리미티브 조립 (COMPONENT-MAP §1).

| 파일 | 역할 | props (요약) |
|---|---|---|
| `ai-activity-panel.tsx` | 우측 패널 컨테이너 — 헤더(pending 카운트) + Pending 섹션 + Timeline + Composer | 스토어 직접 구독 (`selectActiveBoard`, rows) |
| `pending-card.tsx` | "Inferred {N} rows" 카드 — Apply all / Dismiss | `column · count · onApply · onDismiss · busy` |
| `timeline-item.tsx` | aiHistory 1줄 (점 + 제목 + detail + 시각) | `entry: AIHistoryEntry` |
| `ai-composer.tsx` | 하단 입력창 — Enter/Send → `/api/ai/ask` | `boardLabel · rowCount` |

- **Pending 섹션**: `rows.filter(r => !r.themeConfirmed).length` / `sentimentConfirmed` 계산 → 0보다 크면 `PendingCard` 표시. theme·sentiment 각각.
- **헤더 배지**: `{pendingTotal} pending` — primary 톤.
- **AI 컬럼 없는 보드**: "No AI columns yet" 안내 (프로토타입 hasAi 분기) — Phase 2 시드는 AI 컬럼 있으므로 분기만 두고 미노출.
- **Composer**: 채팅 thread는 `ai-activity-panel` **로컬 state**(persist ❌, D3). 응답은 thread에 누적 + timeline에 `kind:"ask"` 1줄 요약.
- 가드: `framer-motion` ❌, dense(정보 밀도), 약한 그림자/토큰만, Phosphor/lucide. `sonner` toast.

## 8. 앱 셸 — AI 패널 슬롯

`app/page.tsx` 레이아웃 변경 (plan §9 — "Phase 2: AI 패널 슬롯 추가"):

```
flex min-h-[100dvh] flex-col
 ├─ header (h-12)                       ← 기존
 └─ flex flex-1 min-h-0
     ├─ flex-1 flex-col  (보드 영역)      ← 타이틀 블록 + <SheetView/>
     └─ <AiActivityPanel/>  (w-[340px], shrink-0, border-l)   ← 신규
```

- 패널은 Phase 2에서 **고정 표시**(토글 ❌ — Phase 5, D6). 폭 340px (프로토타입).
- 보드 영역과 패널 모두 `min-h-0`로 내부 스크롤 독립.

## 9. AI 흐름 (상태 전이)

```
AI 컬럼 셀:  (drafted, confirmed:false = pending)
   │
   ├─ 패널 "Apply all"   → infer-batch(Claude) → acceptAllAi → confirmed:true ──┐
   ├─ 패널 "Dismiss"     → dismissAllAi        → confirmed:true (값 유지) ───────┤
   ├─ 셀 popover Accept  → commitAiCell        → confirmed:true ────────────────┤
   └─ 셀 popover Dismiss → dismissAiCell       → confirmed:true (값 유지) ───────┘
                                                                                │
                                                            (confirmed) ◀───────┘
                                                                  │
                                                            ⌘Z → 직전 스냅샷 복원
```

- **D1 핵심**: "Apply all"은 **Claude를 호출**(infer-batch)해 분류하고 그 결과를 `confirmed:true`로 적용한다. 버튼 클릭 = 사람의 확정 행위 → "AI 자동 적용 ❌" 위반 아님. 배치 결과 검토는 **⌘Z 백스톱**(되돌리기)으로 보장 (MEMORY 결정 #2 "모든 결정 되돌릴 수 있음"). 셀 단위 신중 검토는 popover Accept/Dismiss.

## 10. 가드

- **AI 자동 호출 ❌** — 모든 Claude 호출은 명시 클릭/Enter 트리거. 진입·렌더 시 호출 ❌.
- **throttle 5초** — 동일 endpoint, `lib/flowbase-ai.ts` localStorage 기반. 위반 시 toast "잠시 후 다시 시도".
- **chunk 100 rows** — infer-batch 초과분 100개씩 순차 + `sonner` progress toast ("분류 중 {done}/{total}").
- **⌘Z** — `acceptAllAi`/`dismissAllAi` 각 1 undo 스냅샷 (Phase 1A `undo-stack`, 30 step).
- **로딩 toast** — infer-batch 진행 중 toast, 완료 시 결과 요약으로 교체.

## 11. 에러 처리

| 상황 | 처리 |
|---|---|
| 네트워크/500 | `callAI` throw → `sonner` 에러 toast "AI 분류 실패 — 다시 시도". 행 변경 ❌. |
| JSON 파싱 실패 | 서버 500 → 위와 동일. |
| 429 rate limit | toast + 재시도 버튼만. 자동 재시도 ❌ (AI-CONTRACTS §1). |
| `ANTHROPIC_API_KEY` 미설정 | 라우트 500 + 메시지 → toast "AI 키 미설정 (.env.local)". |
| throttle 위반 | toast (호출 미발생). |

## 12. LOCK·가드 준수

- AI 추천 + 사람 확정 — 자동 적용 ❌ (§9 D1). pending 마커 = Phase 1B `ai-pending-mark` 그대로.
- Status 색 — 본 Phase는 status 미수정. `statusColorClass`/`statusBgClass`만.
- Phosphor(status/priority) · lucide(일반) · Geist. minimalist dense, framer-motion ❌, 토큰만.
- 브랜딩 — 사용자 노출 "FlowBase" (ask 프롬프트 "You are FlowBase…").

## 13. 마일스톤

- **2A — 서버 + 어댑터 + 스토어**: `@anthropic-ai/sdk` 설치 · `.env.example` · `app/api/ai/*` · `lib/flowbase-ai.ts` · 스토어 액션 3종. `tsc` green, 라우트 수동 호출 검증.
- **2B — 패널 + 셸**: `components/ai/*` · `app/page.tsx` 패널 슬롯. 실 Claude로 "Apply all" → 분류 → ⌘Z. 에러/로딩 toast.

## 14. 결정 기록 / 미결 질문

| # | 결정 |
|---|---|
| D1 | "Apply all" = infer-batch(Claude 호출) + 결과를 `confirmed:true`로 적용. 클릭이 곧 확정, ⌘Z가 검토 백스톱. |
| D2 | model id는 `_anthropic.ts` 단일 상수 — 구현 시 `claude-api` 스킬로 최신 안정 Sonnet 확정. 문서에 모델 문자열 미고정. |
| D3 | Composer 채팅 thread = `ai-activity-panel` 로컬 state, persist ❌. |
| D4 | per-cell `commitAiCell`/`dismissAiCell`은 aiHistory 미기록. 배치(`acceptAllAi`/`dismissAllAi`)·ask만 timeline에 기록. |
| D5 | 스토어는 액션만 추가 — shape 불변, `STORE_VERSION` 4 유지. |
| D6 | Phase 2 AI 패널은 고정 표시. 토글/collapse는 Phase 5. |
| D7 | `ANTHROPIC_API_KEY` 미설정 시 라우트 500 + 명확 메시지 → toast. 패널 UI는 정상 렌더. |
| D8 | 정적 지시문은 `system` 블록 + `cache_control`로 분리 (AI-CONTRACTS §0.1 참조 코드 대비 개선). |
| **Q1** | 시드 `theme`/`sentiment` 드래프트(`confirmed:false`)를 **유지**할지. 권장: 유지 — 진입 시 pending 카드가 보여 패널이 즉시 의미를 가짐. "Apply all"이 Claude로 재분류·확정. |
| **Q2** | vitest 도입 여부 — 라우트/파서 테스트 가치 큼 (plan §12). 권장: Phase 2에서 `infer-batch` mock 테스트만 최소 도입 (AI-CONTRACTS §7 픽스처) 또는 Phase 3로 이연. **사용자 결정 필요.** |
| **Q3** | `ask` 응답을 timeline에도 남길지(D4는 남기는 쪽). 1줄 요약이라 과하지 않다고 판단 — 이의 시 조정. |

## 15. 다음 행동

1. 🚦 **검토 게이트** — 본 문서 + §14(특히 Q1·Q2) 사용자 검토.
2. Phase 2A 코드 — 의존성 → `.env` → `_anthropic.ts` → 라우트 → 어댑터 → 스토어 액션.
3. Phase 2B 코드 — `components/ai/*` → 패널 슬롯 → 실 Claude 검증.
