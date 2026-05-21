# CONTEXT

현재 features, 디자인 결정. [MEMORY.md](MEMORY.md) 기준으로 동기화.

---

## Current Features (Completed — 최근 우선)

1. **FlowBase V2 재구축 — Phase 1~6 완료** (2026-05-21, `main` 머지·푸시됨) — 제네릭 데이터 모델·zustand 스토어 위에: 시트 뷰(`components/sheet/*`) · AI 패널+Claude(`app/api/ai/*`·`components/ai/*`) · Import 모달(`components/import/*`) · Kanban/Dashboard 뷰(`components/sections/*`·`components/charts/*`) · 앱 셸(`components/board/*` — Activity bar·Sidebar·패널 토글·키보드 단축키) · 멀티보드(보드 CRUD) · Schema 뷰. `app/page.tsx`가 V2 보드 셸. 남음: **Phase 7(BaaS)**.
2. **Linear+shadcn 디자인 overhaul** (PR #4, 2026-05-07) — 전체 UI 톤 통합. Trash·Workspaces·Quick switcher·Breadcrumb·Settings·design tokens(`lib/tokens.ts`).
3. **Status pill 통합 + 미처리=blue** (2026-05-05) — 아이콘+이름+카운트 단일 pill.
4. **FlowBase 리브랜드** (2026-05-05) — FlowDB → FlowBase, GitHub repo rename.
5. **txt 블록 자동 분류 PoC** (PR #1, 2026-05-04 — **Phase 3에서 제거**) — `***` 구분 키워드 분류 PoC. `/txt-poc` 페이지 + `lib/parsers/txt-block-parser.ts`는 V2 Import로 대체되어 삭제됨.

> 옛 3섹션 UI(설계/데이터/운영)는 V2 보드 UI로 전면 대체됨. 옛 `components/sections/*`·`app-sidebar`·`app/{trash,workspaces}` 등 V2 미사용 코드는 별건 정리 대기.

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

- `ANTHROPIC_API_KEY` 미설정 — AI 라우트(`infer-batch`/`ask`/`analyze-import`) 실호출 미검증. 키 없으면 graceful 500 + toast.
- **BaaS 미결정** — Phase 7 블로커 (Supabase vs bkend.ai, `docs/01-baas-decision.md`).
- **옛 V2-미사용 코드 잔존** — `components/app-sidebar.tsx`·`components/sections/{data,design,operations,settings,trash,workspaces}-section.tsx`·`app/{trash,workspaces}`·`lib/mock-*.ts`. 별건 정리 필요 — `lib/tokens.ts`가 `mock-data` 타입(`Tone`/`ChartColor`)에 의존이라 신중.
- **Phase 3 Q1**: `infer-batch`가 `row.quote` 하드코딩 — 임포트 보드에 quote류 컬럼 없으면 AI 추론 입력 빈약 (소스 컬럼 일반화 후속).
- 프로젝트 eslint flat config 부재 — `npm run lint` 동작 안 함 (기존 이슈, 빌드 무관).
- 내부 docs/spec의 "FlowDB" 표기 다수 잔존 (사용자 노출은 FlowBase, 내부는 점진 정리).
