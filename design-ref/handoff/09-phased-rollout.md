# 09-phased-rollout — PDCA 친화 단계별 작업 묶음

> 기존 `peterkwon248/FlowBase`의 PDCA 워크플로우를 따라 각 phase 끝나면 PR → main 머지.
> 각 phase는 1-3 일짜리 묶음, 끝나면 사용 가능한 상태.

---

## Phase 1 — 시트 뷰 + 셀 편집 (기존 `feat/sheet-view` 브랜치)

**목표**: 데이터 섹션을 *읽기용 표*에서 *편집 가능한 시트*로.

### 작업
1. `lib/parsers.ts` 만들기 (IMPORT-SPEC §1)
2. `lib/flowbase-store.ts` — zustand store + persist (STATE-SHAPES §2)
3. `lib/undo-stack.ts` (STATE-SHAPES §3)
4. `lib/keyboard-shortcuts.ts` — ⌘Z / ⌘⇧Z / Delete / Backspace
5. `components/sheet/`
   - `editable-cell.tsx` (status/priority/sentiment/theme/text/date 분기, COMPONENT-MAP §3 예시 1)
   - `ai-pending-mark.tsx`
   - `header-cell.tsx`
   - `sheet-view.tsx`
6. `components/sections/data-section.tsx`에 `viewMode = "table" | "sheet"` 토글 추가
7. **AI 컬럼은 아직 mock**. AI Activity 패널은 phase 2에서.

### Done 기준
- ✅ status 셀 클릭 → Popover로 변경 → state + localStorage 반영
- ✅ priority/sentiment/theme 동일
- ✅ ⌘Z 작동
- ✅ Delete 키로 선택 행 삭제 + undo로 복원
- ✅ 새로고침 후 변경사항 유지

### LOCK 체크
- Phosphor status/priority 아이콘 그대로
- 색상 매핑 (`STATUS_TONE`) 그대로
- Geist 폰트 유지

### PDCA 산출물
- `docs/01-plan/features/sheet-view.plan.md`
- `docs/02-design/features/sheet-view.design.md` (이미 NEXT-ACTION.md에 언급됨)
- `docs/03-analysis/sheet-view.analysis.md` (PR 후)
- `docs/04-report/sheet-view.report.md`

---

## Phase 2 — AI Activity 패널 + 진짜 Claude 호출

**목표**: AI 추천 + 사람 확정 흐름이 진짜 Claude로 작동.

### 작업
1. **`.env.local`**에 `ANTHROPIC_API_KEY` 추가, `.env.example` 업데이트
2. `app/api/ai/_anthropic.ts` (AI-CONTRACTS §0.1)
3. `app/api/ai/infer-batch/route.ts` (AI-CONTRACTS §1)
4. `app/api/ai/ask/route.ts` (AI-CONTRACTS §3)
5. `lib/flowbase-ai.ts` 클라이언트 어댑터 (AI-CONTRACTS §0)
6. `components/ai/`
   - `ai-activity-panel.tsx`
   - `pending-card.tsx`
   - `timeline-item.tsx`
   - `ai-composer.tsx`
7. `components/sheet/editable-cell.tsx`에 sentiment/theme 셀의 AI Accept/Dismiss 마이크로 카드 통합

### Done 기준
- ✅ "Apply all" 누르면 진짜 Claude가 분류
- ✅ 응답 1-3초간 로딩 toast
- ✅ 응답을 row state에 적용, themeConfirmed=true
- ✅ ⌘Z로 AI Apply 자체를 되돌리기
- ✅ 셀별 Accept도 작동
- ✅ 에러 시 (rate limit, 네트워크) 명확한 toast

### 가드
- AI 자동 호출 ❌ — 항상 사용자 액션이 트리거
- Rate limit per-user: localStorage에 마지막 호출 시각, 5초 throttle
- 100 rows 초과 batch는 chunk로 나눠서 progress toast

---

## Phase 3 — Import 모달

**목표**: 사용자가 CSV/MD/Sheets paste → 보드에 추가.

### 작업
1. `components/import/`
   - `import-dialog.tsx` (shadcn Dialog + 3-step state machine)
   - `import-step-paste.tsx`
   - `import-step-review.tsx`
   - `import-step-ai.tsx`
2. `app/api/ai/analyze-import/route.ts` (AI-CONTRACTS §2)
3. 사이드바 "Import data" 버튼 + 메인 툴바 "Import" 버튼 → 모달 열기
4. 파일 드롭 옵션 (`<input type="file">`, .csv/.tsv 받기)
5. mapper 함수 (IMPORT-SPEC §3) — status/priority/한국어/영문 매핑 모두 처리

### Done 기준
- ✅ paste → 자동 포맷 감지 → 미리보기
- ✅ 컬럼 이름/타입 편집 가능
- ✅ AI 분석 호출 후 추천 카드 표시
- ✅ Import N rows 누르면 state에 row 추가 + toast
- ✅ AI 컬럼 옵션 켜면 새 row가 pending 상태로

### 엣지 케이스 (IMPORT-SPEC §5 전부 다루기)
- 빈 paste, 1행짜리, 1000+행, 헤더 중복, AI 호출 실패

---

## Phase 4 — Kanban + Dashboard 뷰

**목표**: 같은 데이터를 다른 뷰로.

### 작업
1. `components/board/view-switcher.tsx`
2. `components/sections/kanban-view.tsx`
   - 4 status 컬럼 (LOCK 색)
   - 카드 + 이동 버튼 (→완료 / →대기 등)
   - 추후: drag & drop (v2)
3. `components/charts/` — recharts 기반
   - `bar-chart.tsx`, `donut-chart.tsx`, `hbar-chart.tsx`, `stacked-bar.tsx`, `line-area.tsx`, `matrix-heatmap.tsx`
   - `kpi-tile.tsx`, `chart-card.tsx`
4. `components/sections/dashboard-view.tsx` — 6개 차트 카드 + 4 KPI

### Done 기준
- ✅ 뷰 스위처로 즉시 전환
- ✅ Kanban에서 카드 status 이동하면 sheet에도 반영
- ✅ Dashboard가 active filter / search 결과를 따라감

### LOCK
- Status 색 그대로
- Chart 색은 `--chart-1..5` 토큰 그대로
- Sentiment는 status 톤 매핑 재사용 (Positive→success, Mixed→warning, Negative→destructive 등)

---

## Phase 5 — 패널 토글 + 키보드 단축키 + 헤더 메뉴

**목표**: 모든 UI 컨트롤이 키보드로 가능.

### 작업
1. `components/board/panels-menu.tsx` — 햄버거 드롭다운
2. `components/board/edge-collapse.tsx` + `expand-tab.tsx`
3. `lib/keyboard-shortcuts.ts` 확장
   - ⌘⇧A: Activity bar
   - ⌘⇧F: Sidebar
   - ⌘B: AI panel
   - ⌘Z / ⌘⇧Z
   - Delete: 선택 행 삭제
   - ⌘K: Quick switcher (이미 존재)
   - ⌘N: New row
4. localStorage persist panels state

### Done 기준
- ✅ 햄버거 메뉴에서 3 패널 toggle
- ✅ Show all / Hide all
- ✅ 각 단축키 작동
- ✅ 패널 가장자리 chevron + 닫힌 상태 reopen tab

---

## Phase 6 — 멀티 보드 + Schema 뷰

**목표**: 한 워크스페이스에 여러 보드.

### 작업
1. Store schema를 `boards: Record<string, Board>` 로 nest (STATE-SHAPES §1)
2. 사이드바의 BOARDS 목록 진짜 작동 (각 보드별 row/column/history 독립)
3. New board 버튼 → 빈 보드 생성 + 사용자 정의 컬럼
4. Board rename / delete
5. `components/sections/schema-view.tsx` — 기존 `design-section.tsx`의 ER 다이어그램 재활용

### Done 기준
- ✅ 사이드바에서 보드 클릭 → 컨텐츠 전환
- ✅ 각 보드의 row/column/history 독립
- ✅ Schema 뷰에서 보드의 컬럼들 시각화

---

## Phase 7 — BaaS 마이그레이션 + 다중 사용자

**목표**: localStorage → Supabase (또는 bkend.ai).

### 사전 결정
- `docs/01-baas-decision.md` 마무리
- Supabase 선택 시 `npx supabase init` + migration 작성

### 작업
1. `supabase/migrations/0001_init.sql` (STATE-SHAPES §4)
2. RLS policies
3. Auth UI (Magic link)
4. Store에 sync layer 추가 — Optimistic write + Realtime subscription
5. localStorage → Supabase 일회성 마이그레이션
6. API routes를 직접 Supabase 호출하도록 + Anthropic key는 그대로 서버 보관

### Done 기준
- ✅ 다른 디바이스에서 로그인하면 같은 데이터 보임
- ✅ Realtime: 한쪽에서 row 추가하면 다른 쪽 자동 업데이트
- ✅ Offline에서도 작동, 온라인 복귀 시 sync

---

## Phase 8 — 확장

- 진짜 Google Sheets URL Import (OAuth)
- PDF text extract (서버 측 `pdf-parse`)
- 컬럼 추가/삭제/타입 변경 UI
- CSV / JSON export
- 공유 링크 (view-only / edit)
- Quality Wednesdays (CLAUDE.md 정신) — keyboard nav, accessibility, screen reader

---

## 작업 시 주의 (CLAUDE.md 재확인)

- **모든 LOCK 상수 절대 변경 ❌**
- 색상은 `lib/tokens.ts` 헬퍼 (`toneBadgeClassDual`, `statusColorClass`) 사용, inline hex ❌
- 모든 AI는 *추천 + 확정* 패턴, 자동 적용 ❌
- 30-day rollback 보장 (Phase 7 BaaS 도입 시 soft delete)
- minimalist-skill 가이드: 시트 뷰는 "정보 밀도 5-8", 매크로 화이트스페이스 ❌

---

## 추정 소요 시간 (1인 풀타임)

| Phase | 작업량 |
|---|---|
| 1. Sheet view | 3-4일 |
| 2. AI Activity 패널 + Claude | 2-3일 |
| 3. Import 모달 | 2일 |
| 4. Kanban + Dashboard | 3-4일 |
| 5. Panels + 단축키 | 1-2일 |
| 6. 멀티 보드 + Schema | 2-3일 |
| 7. BaaS 마이그레이션 | 5-7일 |
| **합계** | **약 4주 (Phase 1-6) + 1주 (Phase 7) = 5주** |

NEXT-ACTION.md의 "12주 베타" 일정과 일치합니다.
