# FlowBase V2 재구축 — Plan

> 작성: 2026-05-21
> 출처: `design-ref/handoff/` (V2 디자인 핸드오프 6개 문서)
> Phase: PDCA Plan
> 전략 확정: **V2 클린 재구축** (2026-05-21, 사용자 결정)
> 작업 브랜치: `feat/flowbase-v2` (`feat/sheet-view` 기반)
> 다음: [flowbase-v2-phase1.design.md](../../02-design/features/flowbase-v2-phase1.design.md)

---

## 1. 한 줄 요약

FlowBase를 현재 3섹션 UI(설계·데이터·운영)에서 **V2 데이터 보드 아키텍처**로 클린 재구축. 새 데이터 모델(`Board`/`TableRow`/`ColumnDef`), zustand 스토어, AI 추천+사람 확정 흐름, Sheet/Kanban/Dashboard/Schema 뷰. 핸드오프 정의 기준 7단계, 약 5주.

## 2. 배경 / 왜 V2 클린 재구축인가

- `design-ref/`에 FlowBase-V2 핸드오프 패키지 도입 (2026-05-21).
- 핸드오프 [README](../../../design-ref/README.md): *"현재 UI(3섹션: 설계·데이터·운영)는 구버전 — V2로 전환한다."*
- V2는 **"AI가 초안, 사람이 확정"** 모델([MEMORY.md Key Design Decision #1](../../MEMORY.md))을 앱 전체로 확장한다. 고객 인터뷰 `quote`를 AI가 `theme`/`sentiment`로 분류 → 사람이 확정.
- 현재 앱은 지원 티켓 도메인(`Ticket`/`Customer`/`Agent`/`Note`)의 *읽기용 표 viewer*. V2는 고객 인터뷰 도메인의 *편집 가능한 데이터 보드* — 다른 제품 표면이다.

## 3. 전략 결정 (2026-05-21)

`feat/sheet-view`에 옛 모델(`Field`/`TableNode`/`Ticket`) 기반 시트 편집 M1~M5(9커밋)가 완성돼 있으나, V2 핸드오프는 새 모델(`TableRow`/`Board`/`ColumnDef`)로의 재구축을 요구한다.

**결정: V2 클린 재구축.**
- M1~M5는 main에 머지하지 않음 — 시트 트라이얼의 *평가 목적*은 이미 달성(인터랙션 패턴 검증).
- M1~M5의 인터랙션 코드(키보드 네비·클립보드·인라인 편집)는 V2 `components/sheet/`로 **이식**(§10).
- 기존 3섹션 UI는 V2 보드 셸로 대체.
- 작업 브랜치 `feat/flowbase-v2` (`feat/sheet-view` 기반 — `design-ref/` + 이식 소스 보유).

## 4. 목표 (Definition of Done) — V2 전체

| # | 항목 | 측정 기준 |
|---|---|---|
| G1 | 보드 생성 | CSV/TSV/MD 텍스트 붙여넣기 → 3-step 위저드 → 보드 row 추가 |
| G2 | AI 추천+확정 | AI가 `theme`/`sentiment` 추천(pending) → 사람이 Accept/Dismiss. 자동 적용 ❌ |
| G3 | 시트 편집 | 셀 클릭 인라인 편집, Excel식 키보드 네비, 복붙 |
| G4 | 다중 뷰 | Sheet/Kanban/Dashboard/Schema 즉시 전환, 같은 데이터 |
| G5 | 신뢰 백스톱 | 모든 row 변경 ⌘Z (30 step), localStorage 유지 |
| G6 | 다기기 (Phase 7) | 로그인 시 BaaS 동기화, 실시간 반영 |

각 Phase별 세부 DoD는 §8.

## 5. 비목표 (Out of Scope)

- ❌ 프로토타입의 **핸드오프 미정의 표면** — automations, wiki-view, library-view, dashboard-builder, schema-er, inbox-view, workspace-templates, search-palette 등. `design-ref/prototype/`에 40개 jsx가 있으나 **V2의 확정 범위 = 핸드오프 7단계**. 나머지는 Phase 8+ 후보.
- ❌ 진짜 Google Sheets OAuth import (Phase 8 — IMPORT-SPEC §6)
- ❌ PDF text 추출, 컬럼 추가/삭제/타입변경 UI, CSV/JSON export, 공유 링크 (Phase 8)
- ❌ 실시간 협업 CRDT (Phase 7 last-write-wins 이후 검토)

## 6. 아키텍처 델타 (현재 → V2)

| 영역 | 현재 | V2 |
|---|---|---|
| 데이터 모델 | `Field`/`TableNode`/`Ticket`/`Customer` (지원 티켓) | `TableRow`/`Board`/`ColumnDef` (고객 인터뷰: `quote`/`theme`/`sentiment`) |
| 상태 | 컴포넌트 `useState` mock | `lib/flowbase-store.ts` — zustand + localStorage persist (`flowbase-state-v3`) |
| 앱 셸 | 3섹션 토글 (`app/page.tsx`) | Activity bar + Sidebar + AI 패널 + 뷰 스위처(Sheet/Kanban/Dashboard/Schema) |
| AI | 없음 (정적 키워드 PoC `txt-block-parser`) | `/api/ai/*` 서버 라우트 → Anthropic SDK. 추천+사람 확정 |
| 시트 편집 | M1~M5 (옛 모델, `components/sections/sheet/`) | `components/sheet/` 재구축 (새 모델) |
| Import | `app/txt-poc` PoC | 3-step 위저드 모달 (CSV/TSV/MD) |
| Undo | 없음 | `lib/undo-stack.ts` — 30-step rows 스냅샷 |

기존 `lib/mock-data.ts`의 `TICKETS`/`CUSTOMERS` 등 mock은 V2 시드(고객 인터뷰 보드)로 대체. `SCHEMA`/`RELATIONS`(ER)는 Phase 6 Schema 뷰로 살림. 옛 `data-section`/`operations-section`/`design-section`은 V2 셸로 흡수·삭제.

## 7. 추가 의존성

```
zustand              # 스토어 (Phase 1)
@anthropic-ai/sdk    # AI 라우트 (Phase 2)
nanoid               # ID 생성 (또는 crypto.randomUUID 내장)
```

보유: `recharts` 2.15.0 + `components/ui/chart.tsx`, `sonner`, shadcn 풀세트, `@phosphor-icons/react` + `lucide-react`. 테스트 러너(vitest)는 미설치 — parsers/AI 라우트 검증용으로 Phase 2~3에서 추가 검토.

## 8. 7단계 로드맵

> 핸드오프 [09-phased-rollout.md](../../../design-ref/handoff/09-phased-rollout.md) 기준. 각 Phase는 자체 PDCA 문서(plan/design/analysis/report) + PR → main 머지.

### Phase 1 — 기반 + 시트 뷰 (3~4일, 1~2 PR)
- **1A 기반**: `types/flowbase.ts`, `lib/flowbase-store.ts`(zustand+persist), `lib/undo-stack.ts`, `lib/flowbase-seed.ts`, `lib/parsers.ts`, `lib/keyboard-shortcuts.ts`(⌘Z/⌘⇧Z/Delete)
- **1B 시트**: `components/sheet/*` (ai-pending-mark, cell-popover, editable-cell, header-cell, new-row-stub, sheet-view) + 최소 보드 페이지
- AI 컬럼은 mock (실 Claude는 Phase 2)
- **Done**: status/priority/sentiment/theme 셀 편집 → store+localStorage 반영 · ⌘Z · Delete+undo · 새로고침 유지

### Phase 2 — AI Activity 패널 + 진짜 Claude (2~3일, 1 PR)
- `.env.local`/`.env.example`에 `ANTHROPIC_API_KEY`
- `app/api/ai/_anthropic.ts`, `infer-batch/route.ts`, `ask/route.ts`
- `lib/flowbase-ai.ts` (클라이언트 어댑터)
- `components/ai/*` (ai-activity-panel, pending-card, timeline-item, ai-composer)
- **Done**: "Apply all" → 실 Claude 분류 · 로딩 toast · ⌘Z로 AI Apply 되돌리기 · 셀별 Accept · 에러 toast
- **가드**: AI 자동 호출 ❌, 5초 throttle, 100 rows 초과 chunk + progress toast

### Phase 3 — Import 모달 (2일, 1 PR)
- `components/import/*` (import-dialog 3-step + step-paste/review/ai)
- `app/api/ai/analyze-import/route.ts`
- mapper (IMPORT-SPEC §3 — status/priority KO/EN 매핑)
- 파일 드롭 (.csv/.tsv)
- **Done**: paste → 포맷 감지 → 미리보기 → 컬럼 편집 → AI 추천 → Import N rows
- `app/txt-poc` 제거

### Phase 4 — Kanban + Dashboard (3~4일, 1~2 PR)
- `components/board/view-switcher.tsx`
- `components/sections/kanban-view.tsx` (4 status 컬럼, LOCK 색)
- `components/charts/*` (recharts) + `components/sections/dashboard-view.tsx` (KPI 4 + 차트 6)
- **Done**: 뷰 즉시 전환 · Kanban status 이동 ↔ sheet 반영 · Dashboard가 filter/search 추종

### Phase 5 — 앱 셸 완성 + 키보드 단축키 (1~2일, 1 PR)
- `components/board/*` (board-header, panels-menu, edge-collapse, expand-tab, filter-chips)
- Activity bar / Sidebar 분리 (`app-sidebar.tsx`에서)
- `lib/keyboard-shortcuts.ts` 확장 (⌘⇧A/⌘⇧F/⌘B/⌘N)
- panels 상태 localStorage persist
- **Done**: 햄버거 패널 토글 · Show/Hide all · 단축키 · edge chevron + reopen tab

### Phase 6 — 멀티 보드 + Schema 뷰 (2~3일, 1 PR)
- 스토어는 Phase 1부터 `boards: Record<string, Board>` 멀티 보드 구조 → Phase 6은 **UI만 추가**
- 사이드바 BOARDS 목록 진짜 작동, New/rename/delete board
- `components/sections/schema-view.tsx` (기존 `design-section.tsx` ER 다이어그램 재활용)
- **Done**: 사이드바 보드 전환 · 보드별 독립 row/column/history · Schema 시각화

### Phase 7 — BaaS 마이그레이션 (5~7일, 1 PR)
- **선결**: `docs/01-baas-decision.md` 마무리 (Supabase vs bkend.ai)
- supabase migrations + RLS, Auth UI (Magic link), sync layer (optimistic + realtime), localStorage→BaaS 일회성 마이그레이션
- **Done**: 다기기 동일 데이터 · realtime 반영 · offline 동작

**총 약 5주** (Phase 1~6 = 4주 + Phase 7 = 1주) — `NEXT-ACTION.md`의 12주 베타 일정과 일치.

## 9. 앱 셸 점진 구축

핸드오프는 패널을 Phase 5에 두지만, Phase 1(시트)·2(AI 패널)·4(뷰 스위처)는 모두 렌더할 자리가 필요하다. 셸은 점진 구축한다:

```
Phase 1: 최소 보드 페이지 (시트 + 기본 헤더)
Phase 2: AI 패널 슬롯 추가 (우측)
Phase 4: 뷰 스위처 추가
Phase 5: 셸 완성 (패널 토글, edge collapse, 햄버거 메뉴)
```

## 10. M1~M5에서 이식할 자산

`feat/sheet-view`의 `components/sections/sheet/`에서 V2 `components/sheet/`로 이식 — 옛 `Field`/`AnyRow` → 새 `ColumnDef`/`TableRow`로 어댑트:

| 이식 소스 (M1~M5) | V2 대상 | 비고 |
|---|---|---|
| `useSheetKeyboardNav.ts` | `components/sheet/` hook | Excel식 키보드 네비 — IME 처리 포함, 거의 그대로 |
| `useSheetClipboard.ts` | `components/sheet/` hook | TSV 복붙 |
| `SheetCell.tsx` 로직 | `editable-cell.tsx` | 타입 분기 패턴 재작성 (Popover+Command) |
| `ChipSelect.tsx` | cell 편집기 | 새 옵션 추가 pill 드롭다운 |

## 11. LOCK·가드 준수

- **Status 색**: `lib/tokens.ts`의 `statusColorClass`/`statusBgClass`만 사용 (미처리=blue).
  ⚠️ **STATUS_TONE 버그**: STATE-SHAPES가 `STATUS_TONE` 재사용을 언급하나 `mock-data.ts`의 `STATUS_TONE["미처리"]="destructive"`(red)는 [CLAUDE.md](../../../CLAUDE.md) LOCK 위반인 stale 맵 — **V2에서 status에 사용 금지**. (현재 렌더는 `statusColorClass`를 써서 화면은 정상)
- Phosphor(status/priority) + lucide(일반), Geist Sans/Mono 유지
- **AI 추천+사람 확정**: 자동 적용 ❌, pending 마커(보라 점+점선 underline), 모든 변경 ⌘Z
- minimalist-skill: 시트/칸반 dense(정보 밀도 5~8), 매크로 화이트스페이스 ❌, framer-motion 자동 설치 ❌, 약한 그림자만

## 12. 리스크 / 미결정 사항

| 항목 | 상태 / 완화 |
|---|---|
| BaaS 선택 (Supabase vs bkend.ai) | `docs/01-baas-decision.md` 미결 — **Phase 7 블로커**. Phase 1~6은 localStorage라 무관 |
| `ANTHROPIC_API_KEY` | Phase 2 착수 전 `.env.local` 필요 |
| 도메인 전환 | 옛 mock(티켓)은 폐기, V2 시드(인터뷰)로 교체 — 데이터 마이그레이션 아님(전부 mock) |
| 테스트 인프라 | vitest 미설치. parsers/AI 라우트는 테스트 가치 큼 — Phase 2~3에서 도입 검토 |
| 기반 모델 오류 전파 | Phase 1A `types`/`store`가 7 Phase에 상속 → **Phase 1 design 문서 + 검토 게이트로 코드 전 확정** |

## 13. 다음 행동

1. **Phase 1 design 문서** — [flowbase-v2-phase1.design.md](../../02-design/features/flowbase-v2-phase1.design.md) 작성. `types/flowbase.ts` 전체, store shape+액션, 시드 데이터, `components/sheet/*` props를 코드 전에 확정.
2. **🚦 검토 게이트** — design 문서 사용자 검토 → 기반 확정.
3. **Phase 1A 코드** — 의존성 설치 → `types` → `store` → `seed`.
