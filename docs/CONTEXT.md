# CONTEXT

현재 features, 디자인 결정. [MEMORY.md](MEMORY.md) 기준으로 동기화.

---

## Current Features (Completed — 최근 우선)

1. **FlowBase V2 재구축 — Phase 1~3** (2026-05-21, ⚠️ `feat/sheet-view-v2` **미커밋**) — 1A 기반(제네릭 데이터 모델·zustand 스토어·undo·parsers·키보드) + **1B 시트 뷰**(`components/sheet/*` — 인라인 편집·Excel식 키보드 네비·복붙) + **2 AI 패널+Claude**(`app/api/ai/*` 라우트·`lib/flowbase-ai.ts`·`components/ai/*`) + **3 Import 모달**(`components/import/*` 3-step 위저드·`analyze-import`). `app/page.tsx`가 V2 보드 페이지. 다음: Phase 4 Kanban+Dashboard.
2. **Linear+shadcn 디자인 overhaul** (PR #4, 2026-05-07) — 전체 UI 톤 통합. Trash·Workspaces·Quick switcher·Breadcrumb·Settings·design tokens(`lib/tokens.ts`).
3. **Status pill 통합 + 미처리=blue** (2026-05-05) — 아이콘+이름+카운트 단일 pill.
4. **FlowBase 리브랜드** (2026-05-05) — FlowDB → FlowBase, GitHub repo rename.
5. **txt 블록 자동 분류 PoC** (PR #1, 2026-05-04 — **Phase 3에서 제거**) — `***` 구분 키워드 분류 PoC. `/txt-poc` 페이지 + `lib/parsers/txt-block-parser.ts`는 V2 Import로 대체되어 삭제됨.

> 옛 3섹션 UI(설계/데이터/운영) 중 데이터 뷰는 V2 시트 뷰로 대체됨. ER 캔버스·운영 칸반 등 나머지는 V2 Phase 4·6에서 단계적 대체.

---

## Design Decisions

상세는 [MEMORY.md "Key Design Decisions"](MEMORY.md#key-design-decisions) 참조 (중복 방지).

핵심 5개:
- AI 추천 + 사람 확정
- 모든 결정 되돌릴 수 있음 (30일 rollback)
- 혼자 시작 → 팀 확장 (워크스페이스 모델)
- 3 진입점 분리
- 디스플레이 자동 추천 (도메인 의존 활성화)

---

## Pending TODO (다음에 시작할 것)

P0는 [TODO.md](TODO.md) 참조.

---

## 알려진 한계

- **이 세션(Phase 1B·2·3) 작업물 전부 미커밋** — `feat/sheet-view-v2` 브랜치, origin 미push. 다른 머신 이어가기 전 커밋·푸시 필수 ([NEXT-ACTION.md](../NEXT-ACTION.md)).
- `ANTHROPIC_API_KEY` 미설정 — AI 라우트(`infer-batch`/`ask`/`analyze-import`) 실호출 미검증. 키 없으면 graceful 500 + toast.
- **Phase 3 Q1**: `infer-batch`가 `row.quote` 하드코딩 — 임포트 보드에 quote류 컬럼 없으면 AI 추론 입력 빈약 (소스 컬럼 일반화는 후속).
- **Phase 3 Q2**: import로 새 보드 전환 시 Phase 6(멀티보드 사이드바) 전까지 시드 보드 복귀 UI 없음.
- 옛 `components/sections/*`(design/operations/data-section 등)·`lib/mock-*.ts` 잔존 — V2가 대체하는 Phase(4·6)에서 단계적 삭제.
- 워크스페이스/Trash UX는 mock (PR #4) — 진짜 분리/권한 모델/30일 rollback 미구현.
- 프로젝트 eslint flat config 부재 — `npm run lint` 동작 안 함 (기존 이슈, 빌드 무관).
- 내부 docs/spec의 "FlowDB" 표기 다수 잔존 (사용자 노출은 FlowBase, 내부는 점진 정리).
