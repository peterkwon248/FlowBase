# CONTEXT

현재 features, 디자인 결정. [MEMORY.md](MEMORY.md) 기준으로 동기화.

---

## Current Features (Completed — 최근 5개만)

1. **txt 블록 자동 분류 PoC** (PR #1, 2026-05-04) — `***` 구분 + `<헤더>` 추출 + 키워드 카테고리. 검증 페이지 `/txt-poc`.
2. **3 섹션 UI** (설계 / 데이터 / 운영) — Claude Design 이식. shadcn/ui 기반.
3. **운영 섹션 디스플레이**: kanban + list 토글 (`components/sections/operations-section.tsx:46`).
4. **데이터 섹션 표**: 정렬·검색 가능, 편집 ❌ (read-only).
5. **설계 섹션 ER 캔버스**: SVG, 드래그·정렬·SQL 모달.

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
- 워크스페이스 클릭 핸들러 없음 (W11에서 처리).
- AI 추천 카테고리 자동 적용 (spec §0 위반, 옵션 B에서 사람 확정 UI 필요).
- 인코딩 자동 감지 미구현 (UTF-8 가정. EUC-KR/CP949면 깨짐).
