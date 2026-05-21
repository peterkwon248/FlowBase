# MEMORY (Source of Truth)

> 프로젝트 진행 방향, PR history, 핵심 결정사항을 한 곳에. 충돌 시 이 파일이 master.

---

## Phase Status

- **Phase 0 (Plan)**: ✅ 완료
- **Phase 1 (Beta)**: 🟡 진행 중 — FlowBase V2 재구축 (7단계 중 1A·1B·2·3 구현 완료 + `main` 머지. 다음: Phase 4)
- **Phase 2 (Team)**: ⬜ — 멤버 초대, 권한 모델, 워크스페이스 분리 (W11)
- **Phase 3+**: ⬜ — Realtime collab, scaling

---

## Current Direction (다음 우선순위)

**2026-05-21 결정**: **FlowBase V2 재구축 착수.** `design-ref/`의 V2 핸드오프 + 프로토타입을 정본으로, 기존 3섹션 UI(설계·데이터·운영)를 V2 데이터 보드로 클린 재구축. 7단계 계획 ([01-plan/features/flowbase-v2.plan.md](01-plan/features/flowbase-v2.plan.md)).

**진행**: Phase 1A~3 구현 완료 (1B 시트 뷰 · 2 AI 패널+Claude · 3 Import 모달) → `feat/sheet-view-v2` → **`main` 머지·푸시 완료**. **다음 = Phase 4(Kanban + Dashboard).**

상세는 [../NEXT-ACTION.md](../NEXT-ACTION.md) 참조.

---

## PR History

| # | 제목 | 머지 | 핵심 |
|---|---|---|---|
| #1 | feat: txt 블록 자동 분류 PoC | `fac55e1` (2026-05-04) | `lib/parsers/txt-block-parser.ts` + `app/txt-poc/page.tsx`. 머레이 응대 템플릿 231 블록 검증 |
| #3 | visual-design-update | `aa4f353` (2026-05-05) | UI 폴리시 — 채널 아이콘+텍스트, Phosphor status/priority 아이콘, 워크스페이스 셀렉터, 라이트/다크 컬러 최적화 |
| (TBD) | session: FlowBase rebrand + pill polish | 진행 중 (2026-05-05) | TS fixes(`cc90196`) + FlowDB→FlowBase 리브랜드 + Workflow 아이콘 + 운영 status pill 통합 디자인(`8f597b0`) + 미처리 blue(`e3f8208`) |
| — | FlowBase V2 재구축 Phase 1A (기반) | `feat/flowbase-v2` → main squash (2026-05-21) | V2 제네릭 데이터 모델·zustand 스토어·시드·undo·parsers·키보드. `design-ref/` V2 핸드오프 도입, 7단계 계획·Phase 1 design 작성 |
| `eb31064` | FlowBase V2 Phase 1B·2·3 (시트·AI·Import) | `feat/sheet-view-v2` → `main` 머지 (2026-05-21) | 시트 뷰 · AI 패널+Claude(`claude-sonnet-4-6`) · Import 3-step 위저드. 설계 문서 phase{2,3}. tsc·build·vitest(13) green. `app/txt-poc` 제거 |

---

## Key Design Decisions

1. **AI 추천 + 사람 확정** — 본 제품의 핵심 신뢰 모델. 자동 적용 ❌. 모든 분류·추천은 카드 형태로 분리되어 사용자가 확정 클릭. ([spec §0:9](specs/flowdb-import-flow-spec.md))
2. **모든 결정 되돌릴 수 있음** — 30일 rollback이 import flow의 백스톱.
3. **혼자 시작 → 팀 확장** — 워크스페이스/멤버 모델이 처음부터 박혀 있음 ([00-product-plan.md:42](00-product-plan.md)).
4. **3 진입점 분리** — 빈 새 테이블 / 파일→새 / 파일→기존 ([spec §1](specs/flowdb-import-flow-spec.md)).
5. **디스플레이 자동 추천 원칙** (2026-05-04 합의) — "모두 항상 다 있다" ❌, "데이터 도메인이 허용할 때만 활성화" ✓:

   | 컬럼 조건 | 활성화 디스플레이 |
   |---|---|
   | 모든 테이블 | 표(읽기) + 시트(편집) |
   | 카테고리/상태 컬럼 있음 | + 칸반 |
   | 일정/날짜 컬럼 있음 | + 타임라인/캘린더 (묶음) |
   | 첨부/이미지 컬럼 있음 | + 갤러리 |
   | 숫자 컬럼 ≥ 2 | + 차트(별도 대시보드) |

6. **chartdb.io는 보완 도구** — 적대적 비교 아님. FlowDB의 출력(스키마)을 chartdb로 시각화 가능.

7. **사용자 노출 명칭 = "FlowBase"** (2026-05-05) — 제품명 FlowDB → FlowBase로 리브랜드. 사이드바/page title/CSV→데이터 업로드. 내부 docs/spec의 "FlowDB" 표기는 점진적으로 정리 (긴급 ❌). 깃 리모트도 `peterkwon248/flowdb` → `peterkwon248/FlowBase`로 교체.

8. **Status 색 매핑** (2026-05-05 합의) — 미처리 = **blue** (NOT red). 빨강은 priority `Urgent`와 의미 충돌. 컨벤션:

   | 상태 | Light bg | 의미 |
   |---|---|---|
   | 미처리 | blue-200 | 신규/주목 필요 (cool tone) |
   | 진행중 | amber-200 | 작업 중 |
   | 대기 | violet-200 | blocked/waiting |
   | 완료 | emerald-200 | done |

   Status indicator는 *아이콘 + 이름 + 카운트*를 **하나의 pill**로 통합 ([components/sections/operations-section.tsx](../components/sections/operations-section.tsx)). 분리된 count 배지는 -100 shade에서 안 보임.

9. **taste-skill 도입 — 옵션 2 (minimalist-skill 단일)** (2026-05-07 결정) — `docs/design-skills/minimalist-skill/SKILL.md` (git tracked source of truth). 우선순위: ① docs/MEMORY.md 결정 → ② lib/tokens.ts → ③ minimalist-skill SKILL.md. **세리프 헤딩 도입 ❌, framer-motion 자동 설치 ❌, Status 색 매핑 보존**. 가드 매트릭스 [CLAUDE.md](../CLAUDE.md) 참조. 트라이얼: `feat/sheet-view` 브랜치에서 옵션 A 시트 뷰 작업 시 적용 → 1주 평가. 검토 plan: [docs/01-plan/features/taste-skill-adoption.plan.md](01-plan/features/taste-skill-adoption.plan.md).

10. **Geist 폰트 적용 fix** (2026-05-07) — `app/layout.tsx`에서 `Geist({ variable: "--font-geist-sans" })` + `<html className={geistSans.variable}>` 적용. `app/globals.css` `@theme inline`의 `--font-sans: var(--font-geist-sans)`로 매핑. 이전에는 import만 되고 적용 안 됨 (`<body className="font-sans">`만, Geist variable 미연결).

11. **FlowBase V2 재구축 — 프로토타입 제네릭 모델** (2026-05-21) — `design-ref/`의 V2 핸드오프 + 프로토타입이 디자인 정본. 기존 3섹션 UI를 V2 데이터 보드로 클린 재구축 (7단계, [01-plan/features/flowbase-v2.plan.md](01-plan/features/flowbase-v2.plan.md)). 데이터 모델은 **제네릭 컬럼 구동** (`Board`/`TableRow`/`ColumnDef`, 10 cell type) — 핸드오프 STATE-SHAPES의 단순화 고정 `TableRow`는 폐기 ([types/flowbase.ts](../types/flowbase.ts)). `dismissAiCell`=값 유지. `feat/sheet-view`의 M1~M5(옛 모델 시트 트라이얼)는 패턴 이식만, 머지 ❌. **레퍼런스(프로토타입)는 구현 전 끝까지 정독할 것.**

12. **Phase 1B·2·3 구현 결정** (2026-05-21) — (1) 시트 포커스 셀 표시는 `ring`으로 (tailwind-merge가 `outline` 스타일 클래스를 `outline-2`와 충돌로 제거 → 외곽선 안 보임). (2) **AI 모델 = `claude-sonnet-4-6`** — `claude-api` 스킬 기본값은 `claude-opus-4-7`이나, 핸드오프 AI-CONTRACTS + Phase 2 설계 D2가 Sonnet 지정 + theme/sentiment 대량 분류라 채택. `app/api/ai/_anthropic.ts`의 `AI_MODEL` 단일 상수. (3) AI 패널 **"Apply all" = Claude `infer-batch` 호출 + `confirmed:true` 적용**, ⌘Z가 검토 백스톱 — 버튼 클릭이 곧 사람의 확정이라 "자동 적용 ❌" 위반 아님. (4) **Import = 새 제네릭 보드 생성** — 프로토타입/IMPORT-SPEC §3의 고정필드 휴리스틱 매퍼 폐기 (#11 일관). (5) vitest 최소 도입 (`npm test`). 키 미설정 시 AI 라우트는 graceful 500.

---

## Architecture Notes

- **Stack**: Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui · lucide-react · next-themes (React 19)
- **State**: 클라이언트 메모리 mock (BaaS 미정 — Supabase vs bkend.ai 결정 대기, [01-baas-decision.md](01-baas-decision.md))
- **Routing**: App Router. 진입은 `app/page.tsx` (3 섹션 토글). 검증용 별도 라우트 `app/txt-poc/page.tsx` (사이드바 노출 ❌).
- **파서 패턴**: 정적 키워드 매칭 (PoC 단계). LLM 도입은 옵션 C 선택 시.

---

## 워크스페이스 메모

- 사이드바 워크스페이스 항목은 **`onClick` 없음** (의도적 placeholder).
- 활성화는 **Phase 1 W11**: 진짜 분리, 개인 워크스페이스 자동 생성 ([02-v01-backlog.md:99](02-v01-backlog.md)).
