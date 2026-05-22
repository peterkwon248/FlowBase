# CONTEXT

현재 features, 디자인 결정. [MEMORY.md](MEMORY.md) 기준으로 동기화.

---

## Current Features (Completed — 최근 우선)

1. **앱 셸 6모드 라우터 (Phase A)** (2026-05-23, `main` 머지) — `app/page.tsx`가 `activityMode` 기반 6모드 라우터. 액티비티 바 6모드 레일(Inbox·Tables·Workspace·Library·Wiki·Search). Tables 모드=기존 V2 보드(시트·칸반·대시보드·Import·AI·멀티보드 — 옛 "Phase 1~6"), Workspace 모드=Schema, 나머지는 "준비 중" 스텁. **앱 범위 재정의**: V2 "Phase 1~6"은 6모드 중 Tables 하나뿐이었음 — Library부터 서브시스템 차례 구축. 다음=Library B1 (설계 `docs/02-design/features/flowbase-v2-library.design.md`).
2. **Linear+shadcn 디자인 overhaul** (PR #4, 2026-05-07) — 전체 UI 톤 통합. Trash·Workspaces·Quick switcher·Breadcrumb·Settings·design tokens(`lib/tokens.ts`).
3. **Status pill 통합 + 미처리=blue** (2026-05-05) — 아이콘+이름+카운트 단일 pill.
4. **FlowBase 리브랜드** (2026-05-05) — FlowDB → FlowBase, GitHub repo rename.
5. **txt 블록 자동 분류 PoC** (PR #1, 2026-05-04 — **Phase 3에서 제거**) — `***` 구분 키워드 분류 PoC. `/txt-poc` 페이지 + `lib/parsers/txt-block-parser.ts`는 V2 Import로 대체되어 삭제됨.

> 옛 3섹션 UI는 V2 보드 UI로 전면 대체. 옛 V1 미사용 코드 20파일은 2026-05-23 정리 완료(`4fa804a`).

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

- **반응형 레이아웃 깨짐** — ~800px 폭에서 4패널이 무너짐(AI 패널이 보드 영역 덮음, 시트가 컬럼 못 폄). 반응형 처리 부재 — 별도 작업 대기.
- `ANTHROPIC_API_KEY` 미설정 — AI 라우트(`infer-batch`/`ask`/`analyze-import`) 실호출 미검증. 키 없으면 graceful 500 + toast.
- **BaaS 미결정** (Supabase vs bkend.ai, `docs/01-baas-decision.md`) — 옛 Phase 7. 서브시스템 구축 뒤로 후순위.
- 프로젝트 eslint flat config 부재 — `npm run lint` 동작 안 함 (기존 이슈, 빌드 무관).
- 내부 docs/spec의 "FlowDB" 표기 다수 잔존 (사용자 노출은 FlowBase, 내부는 점진 정리).
