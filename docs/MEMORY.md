# MEMORY (Source of Truth)

> 프로젝트 진행 방향, PR history, 핵심 결정사항을 한 곳에. 충돌 시 이 파일이 master.

---

## Phase Status

- **Phase 0 (Plan)**: ✅ 완료
- **Phase 1 (Beta)**: 🟡 진입 직전 — txt 블록 PoC로 import flow 일부 검증 (PR #1)
- **Phase 2 (Team)**: ⬜ — 멤버 초대, 권한 모델, 워크스페이스 분리 (W11)
- **Phase 3+**: ⬜ — Realtime collab, scaling

---

## Current Direction (다음 우선순위)

**최근 작업 (2026-05-05)**: PR #3(visual-design-update) 머지 후 빌드 fix + **FlowBase 리브랜드** + 운영 status pill UI 개선 (3 commits, PR 진행 중).

다음 라운드 3 후보 중 결정 대기 (추천 우선순위 A ≫ B ≫ C):

1. **🥇 시트 뷰 (편집용 표)** — `components/sections/data-section.tsx`에 `viewMode` 토글 추가. 디스플레이 자동 추천 원칙도 같이 박기.
2. **🥈 카테고리 인라인 편집 UI** — `app/txt-poc/page.tsx` 셀 클릭 → 드롭다운. spec §0 *AI 추천 + 사람 확정* 적용.
3. **🥉 LLM 하이브리드 카테고리 분류** — "기타" 블록만 LLM 보강. chartdb.io의 정적+LLM 분기 패턴.

상세는 [../NEXT-ACTION.md](../NEXT-ACTION.md) "다음 행동" 섹션 참조.

---

## PR History

| # | 제목 | 머지 | 핵심 |
|---|---|---|---|
| #1 | feat: txt 블록 자동 분류 PoC | `fac55e1` (2026-05-04) | `lib/parsers/txt-block-parser.ts` + `app/txt-poc/page.tsx`. 머레이 응대 템플릿 231 블록 검증 |
| #3 | visual-design-update | `aa4f353` (2026-05-05) | UI 폴리시 — 채널 아이콘+텍스트, Phosphor status/priority 아이콘, 워크스페이스 셀렉터, 라이트/다크 컬러 최적화 |
| (TBD) | session: FlowBase rebrand + pill polish | 진행 중 (2026-05-05) | TS fixes(`cc90196`) + FlowDB→FlowBase 리브랜드 + Workflow 아이콘 + 운영 status pill 통합 디자인(`8f597b0`) + 미처리 blue(`e3f8208`) |

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
