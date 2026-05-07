# CONTEXT

현재 features, 디자인 결정. [MEMORY.md](MEMORY.md) 기준으로 동기화.

---

## Current Features (Completed — 최근 우선)

1. **Linear+shadcn 디자인 overhaul** (PR #4, `2e99933`, 2026-05-07) — 전체 UI 톤 통합.
2. **Trash 시스템** (PR #4) — `app/trash/page.tsx`, `components/sections/trash-section.tsx`, `lib/mock-trash.ts`. 사이드바 entry 추가 (`8feecf4`).
3. **Workspaces UX** (PR #4) — `app/workspaces/page.tsx`, `components/sections/workspaces-section.tsx`, `workspace-switcher.tsx`, `lib/mock-workspaces.ts`. (Phase 2 W11의 일부 진행 — 진짜 분리/멤버 권한은 아직 mock)
4. **Quick switcher + Breadcrumb bar + Settings section** (PR #4) — `components/quick-switcher.tsx`, `components/breadcrumb-bar.tsx`, `components/sections/settings-section.tsx`.
5. **Design tokens 시스템** (PR #4) — `DESIGN-TOKENS.md` + `lib/tokens.ts`.
6. **Status pill 통합 + 미처리=blue** (`8f597b0` + `e3f8208`, 2026-05-05) — 아이콘+이름+카운트 단일 pill. Status 색 매핑 컨벤션 ([MEMORY.md "Key Design Decisions" #8](MEMORY.md#key-design-decisions)).
7. **FlowBase 리브랜드** (`8f597b0`, 2026-05-05) — 사용자 노출 명칭 FlowDB → FlowBase. GitHub 레포도 rename.
8. **visual-design-update** (PR #3, `aa4f353`, 2026-05-05) — Phosphor status/priority 아이콘, 채널 아이콘+텍스트, light/dark 컬러 최적화.
9. **txt 블록 자동 분류 PoC** (PR #1, 2026-05-04) — `***` 구분 + `<헤더>` 추출 + 키워드 카테고리. 검증 페이지 `/txt-poc`.
10. **3 섹션 UI** (설계 / 데이터 / 운영) — Claude Design 이식. shadcn/ui 기반.
11. **운영 섹션 디스플레이**: kanban + list 토글 (`components/sections/operations-section.tsx`).
12. **데이터 섹션 표**: 정렬·검색 가능, 편집 ❌ (read-only).
13. **설계 섹션 ER 캔버스**: SVG, 드래그·정렬·SQL 모달.

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

- `lib/parsers/txt-block-parser.ts` 의 `"원"` 키워드 광범위 → 가격 카테고리 false positive 가능 ("주식회사", "원료", "본원" 등에서 매칭 가능성).
- `app/txt-poc/page.tsx` 사이드바 진입점 없음 (의도적, 일반 사용자에 노출 ❌).
- **워크스페이스/Trash는 PR #4로 UX는 추가됐지만 mock 데이터** (`lib/mock-workspaces.ts`, `lib/mock-trash.ts`). 진짜 분리/권한 모델/30일 rollback은 미구현.
- AI 추천 카테고리 자동 적용 (spec §0 위반, 옵션 B에서 사람 확정 UI 필요).
- 인코딩 자동 감지 미구현 (UTF-8 가정. EUC-KR/CP949면 깨짐).
- 데이터 섹션 표 여전히 read-only — 옵션 A (시트 뷰)에서 편집 가능하게.
- 내부 docs/spec의 "FlowDB" 표기 다수 잔존 (사용자 노출은 FlowBase로 정리됨, 내부는 점진 정리).
