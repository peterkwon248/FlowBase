# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-05-23 (kkh94 머신, 후속 작업)

---

## 한 줄 요약

**앱 breadth 큰 폭 진행 — Phase A 셸 + Phase B Library(B1·B2) + Workspace Automations + Inbox + Detail bar + English UI + Tasks 보드 모두 완료. 브랜치 13 커밋 ahead of `main` (머지 대기). 다음 breadth: Wiki · Search 팔레트.**

---

## ⚠️ 머지 상태 (중요)

- 작업 브랜치: `claude/wizardly-murdock-451e3d` — origin 푸시 완료, **`main`은 여전히 `4d71c8a` (머지 대기)**.
- 다른 머신에서 이어가려면:
  - **머지 됐으면**: `git fetch && git checkout main && git pull && npm install`
  - **머지 아직이면**: `git fetch && git checkout claude/wizardly-murdock-451e3d && git pull && npm install`

---

## 현재 상태 — 13 커밋 누적

### ✅ 완료 (시간 역순, 모두 origin/branch)
1. **English UI + Trash/Settings + Tasks 보드** (`605b9f3`) — UI chrome 17+ 파일 영어, `STATUS_LABELS` 맵, 사이드바 푸터(Trash·Settings·2.1/10 GB), Tasks 2번째 시드 보드 + store v4→v5 migrate.
2. **Detail bar (4번째 패널)** (`f3feae2`) — `panels.detailBar` + ⌘I + `detail-bar.tsx`. TablesMode 통합.
3. **Inbox 모드** (`620dadb`) — `inbox-view.tsx` 파생 항목(AI pending · 자동화 제안 · 빈 테이블 · 미사용 자산 · 활동 로그) + 필터 chips + 액션 네비.
4. **Workspace > Automations** (`41b7257`) — `automations-view.tsx` 룰 카드(When/Then) + AI 제안 + Schema/Automations 탭.
5. **Phase B Library B2** (`5bf1ef5`) — `asset-detail.tsx` 5 카테고리 디테일 + `selectAsset(category, id)` 원자 액션.
6. **Phase B Library B1** (`4148c96`) — 데이터 모델 + 시드(`flowbase-library-seed.ts`) + 스토어 + LibrarySidebar 트리 + CategoryCatalog (읽기 전용 브라우즈).
7. **docs sync after-work** (`5d6ce21`) — 1차 진행 문서 동기화.
8. **Phase B Library 설계** (`2cdbb0f`) — `docs/02-design/features/flowbase-v2-library.design.md`.
9. **Phase A — 앱 셸 6모드 라우터** (`daad859`) — 액티비티 바 6모드, Schema→Workspace 이동.
10. **옛 V1 코드 정리** (`4fa804a`) — 20 파일 삭제 (−7,025줄).
11. **Phase 3 Q1** (`afa39f1`) — infer-batch sourceField 일반화.
12. **before/after-work 명령어 refine** (`d2ad4ea`) — 핵심 동작·존재 이유.
13. **before/after-work 명령어 추가** (`2cbf01a`) — 프로젝트 커맨드 + `.gitignore` 예외.

### ⬜ 다음 (breadth 우선 — 사용자 명시 "목업 퀄리티 완벽하게")
- **Wiki 모드** — 현재 `ComingSoonMode` 스텁. 프로토타입 `design-ref/prototype/wiki-view.jsx` 참조 (페이지 트리 + 본문).
- **Search 팔레트 (⌘K)** — 현재 스텁. 프로토타입 `design-ref/prototype/search-palette.jsx` 참조 (보드·행·자산 통합 검색).

### ⏸ Breadth 뒤 (사용자 명시 후순위)
- **시드 deep 영어화** — `flowbase-library-seed.ts` 한국어 자산명(모델명·처리방식·사업부 + 옵션 라벨 단순변심 등) · `flowbase-workspace-seed.ts` 룰 잔여 · Customer Interviews 시드 한국어 quote/name.
- **B3** — Library 인라인 편집 (rename · 옵션 색상/추가 · field config).
- **반응형 fix** — ~800px에서 4-5 패널 cramped.
- **AI 실호출 검증** — `.env.local`에 `ANTHROPIC_API_KEY`.
- **main 머지** — 13 커밋 대기.
- **B4 (가장 마지막)** — 컬럼↔Library 자산 링크 · "Use in table" · 템플릿으로 보드 생성.

---

## 코드/디자인 컨벤션 (이번 세션 정착)

- **Status 키는 LOCK 한국어 보존 + `STATUS_LABELS` 맵으로 디스플레이만 영어** — `types/flowbase.ts`의 `STATUS_LABELS: Record<TicketStatus, string>` 사용 (filter-chips, kanban-view, editable-cell).
- **`selectAsset(category, id)` 원자 액션** — Library 사이드바에서 cross-category 자산 클릭은 `setLibAsset`만으론 libCategory 미동기 → 디테일 미렌더 버그. 둘 다 한 set으로.
- **테스트 셀렉터** — UI 클릭 테스트용 `data-asset-id`, `data-panel-id`, `data-workspace-item` 속성을 추가했음. 새 인터랙티브 요소에 동일 패턴 활용.
- **시드 보드 추가 시 store version bump + migrate** — 기존 persisted state에 자동 주입(`flowbase-store.ts` v5 migrate 참조).

---

## 환경 정보

| | |
|---|---|
| GitHub | https://github.com/peterkwon248/FlowBase (private) |
| 기준 브랜치 | `claude/wizardly-murdock-451e3d` (origin push) — **main 머지 대기** |
| 미리보기 | http://localhost:3000 (`npm run dev`) |
| 패키지 매니저 | npm · 테스트 `npm test` 또는 `npx vitest run` |
| 명령어 | `/before-work` · `/after-work` — `.claude/commands/` (git 추적) |

---

## 머신

kkh94 (`C:\Users\kkh94\OneDrive\Desktop\FlowBase`). 다음 머신: before-work 시 머지 상태 먼저 확인 — `git fetch && git branch -a` 후 main 머지 됐는지 보고 분기 결정.
