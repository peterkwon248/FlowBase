# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-05-23 (kkh94 머신, Wiki 모드 마무리)

---

## 한 줄 요약

**앱 breadth 거의 마무리 — Phase A 셸 + Library(B1·B2) + Workspace(Schema·Automations) + Inbox + Detail bar + English UI + Tasks 보드 + Wiki 모드 모두 완료. `main` 머지·푸시 완료. 남은 breadth: Search 팔레트(⌘K)만.**

---

## ✅ 머지 완료

- `origin/main` = 이번 세션 작업 전체 포함 (fast-forward).
- 다른 머신에서 이어가기: `git fetch && git checkout main && git pull && npm install`.
- **정책 (2026-05-23 lock)**: `/after-work`는 step 8 (main 머지)을 무조건 포함 — 명시 확인 게이트 제거.

---

## 현재 상태 — 누적 14 커밋

### ✅ 완료 (시간 역순)
1. **Wiki 모드** (`01a7ae7`) — `WikiPage` 타입 + 6 페이지 시드(영어) + 마크다운 본문 렌더러(외부 lib ❌) + 사이드바 카테고리 트리 + Verified pill/Mark as verified · v5→v6 migrate.
2. **English UI + Trash/Settings + Tasks 보드** (`605b9f3`) — 17+ 파일 영어화 · `STATUS_LABELS` 맵 · 푸터 · Tasks 시드 + v4→v5 migrate.
3. **Detail bar (4번째 패널)** (`f3feae2`) — `panels.detailBar` + ⌘I.
4. **Inbox 모드** (`620dadb`) — 워크스페이스 파생 항목 + 필터.
5. **Workspace > Automations** (`41b7257`) — 룰 카드 + AI 제안 + Schema/Automations 탭.
6. **Phase B Library B2** (`5bf1ef5`) — 5 카테고리 디테일 + `selectAsset` 원자 액션.
7. **Phase B Library B1** (`4148c96`) — 데이터 모델 + 시드 + 트리 + 카탈로그 (읽기 전용).
8. **docs sync after-work** (`5d6ce21`).
9. **Phase B Library 설계** (`2cbf01a` 안 `2cbf01a`→`2cbf01a`; 정확히 `2cbf01a`는 명령어 추가 커밋, 설계는 `2cbf01a` 시점 후 `2cbf01a` 별도 커밋 — 라이브러리 design.md).
10. **Phase A 셸 6모드 라우터** (`daad859`).
11. **옛 V1 코드 정리** (`4fa804a`, −7,025줄).
12. **Phase 3 Q1 infer-batch sourceField 일반화** (`afa39f1`).
13. **before/after-work 명령어 refine** (`d2ad4ea`).
14. **before/after-work 명령어 추가** (`2cbf01a`).
15. **after-work step 8 무조건** (`bb84e56`).

### ⬜ 다음 (마지막 breadth)
- **Search 팔레트 (⌘K)** — 현재 `ComingSoonMode` 스텁. 프로토타입 `design-ref/prototype/search-palette.jsx` 참조 (보드·행·자산·페이지 통합 검색). Wiki 페이지도 검색 인덱스 후보.

### ⏸ Breadth 뒤
- **시드 deep 영어화** — `flowbase-library-seed.ts` 한국어 자산명(모델명·처리방식·사업부 + 옵션 라벨) · `flowbase-workspace-seed.ts` 룰 잔여 · Customer Interviews 시드 한국어 quote/name.
- **B3** — Library 인라인 편집 (rename · 옵션 색상/추가 · field config).
- **반응형 fix** — ~800px에서 4-5 패널 cramped.
- **AI 실호출 검증** — `.env.local`에 `ANTHROPIC_API_KEY`.
- **Wiki 편집 UI** — 현재 시드 마크다운만. 입력 sanitize도 같이.
- **B4 (가장 마지막)** — 컬럼↔Library 자산 링크 · "Use in table" · 템플릿으로 보드 생성.

---

## 코드/디자인 컨벤션 (정착)

- **Status 키는 LOCK 한국어 보존 + `STATUS_LABELS` 맵으로 디스플레이만 영어** — `types/flowbase.ts` `STATUS_LABELS: Record<TicketStatus, string>` 사용.
- **`selectAsset(category, id)` 원자 액션** — Library 사이드바 cross-category 클릭 패턴.
- **테스트 셀렉터 속성** — `data-asset-id`, `data-panel-id`, `data-workspace-item`, `data-page-id`, `data-page-body`. 새 인터랙티브 요소에 동일 패턴.
- **시드 보드/페이지 추가 시 store version bump + migrate** — v4→v5(Tasks), v5→v6(Wiki) 패턴.
- **외부 lib 도입 신중** — Wiki 마크다운은 의존성 0인 미니 렌더러로 처리. 시드 범위면 직접 작성 우선.

---

## 환경 정보

| | |
|---|---|
| GitHub | https://github.com/peterkwon248/FlowBase (private) |
| 기준 브랜치 | `main` (머지·푸시 완료) — 작업 브랜치 `claude/wizardly-murdock-451e3d`도 origin 잔존 |
| 미리보기 | http://localhost:3000 (`npm run dev`) |
| 패키지 매니저 | npm · 테스트 `npm test` 또는 `npx vitest run` |
| 명령어 | `/before-work` · `/after-work` — `.claude/commands/` (git 추적) |

---

## 머신

kkh94 (`C:\Users\kkh94\OneDrive\Desktop\FlowBase`). 다음 머신: `git fetch && git checkout main && git pull && npm install`.
