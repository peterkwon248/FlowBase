# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-05-23 (kkh94 머신, Search 모드 마무리 — breadth P0 100%)

---

## 한 줄 요약

**🎯 앱 breadth P0 100% 도달 — Tables · Workspace(Schema·Automations) · Library(B1·B2) · Inbox · Detail bar · English UI · Tasks 보드 · Wiki · Search(⌘K + 풀페이지) 모두 완료. `main` 머지·푸시 완료. 다음 단계: 깊이/품질 작업 (시드 영어화 · B3 · 반응형 · AI 실호출).**

---

## ✅ 머지 완료

- `origin/main` = 이번 세션 작업 전체 포함 (fast-forward).
- 다른 머신에서 이어가기: `git fetch && git checkout main && git pull && npm install`.
- **정책**: `/after-work`는 step 8 (main 머지)을 무조건 포함 — 명시 확인 게이트 제거.

---

## 현재 상태 — Breadth P0 완료

### ✅ 완료 (시간 역순, 최근 8 커밋)
1. **Search 모드 + ⌘K 팔레트** (`3771bc8`) — `lib/search-index.ts` 인덱스/필터 + `components/search/*` 모달(640px·blur·키 네비)과 풀페이지(탭 카운트 chips). Row 검색 시 detailBar 자동 활성. `ComingSoonMode` 삭제.
2. **Wiki 모드** (`01a7ae7`) — 6 시드 페이지(영어) + 미니 마크다운 + Verified pill/Mark as verified + v5→v6 migrate.
3. **English UI + Trash/Settings + Tasks 보드** (`605b9f3`).
4. **Detail bar** (`f3feae2`).
5. **Inbox 모드** (`620dadb`).
6. **Workspace > Automations** (`41b7257`).
7. **Phase B Library B2** (`5bf1ef5`).
8. **Phase B Library B1** (`4148c96`).

(앞 entries는 SESSION-LOG.md 참조.)

### ⬜ 다음 — 깊이/품질 (P1)
- **시드 deep 영어화** — `flowbase-library-seed.ts`(모델명·처리방식·사업부 + 옵션 라벨) · `flowbase-workspace-seed.ts` 룰 잔여 · Customer Interviews 시드 한국어 quote/name.
- **B3 — Library 인라인 편집** — rename · 옵션 색상/추가 · field config.
- **반응형 fix** — ~800px 4-5 패널 cramped.
- **AI 실호출 검증** — `.env.local`에 `ANTHROPIC_API_KEY`.
- **Wiki 페이지 편집 UI** — 현재 시드 마크다운만. 사용자 입력 sanitize 같이.

### ⏸ Breadth 뒤 (사용자 명시)
- **B4 (가장 마지막)** — 컬럼↔Library 자산 링크 · "Use in table" · 템플릿으로 보드 생성.

---

## 코드/디자인 컨벤션 (정착)

- **Status 키 LOCK 한국어 + `STATUS_LABELS` 맵으로 디스플레이만 영어** — `types/flowbase.ts`.
- **`selectAsset(category, id)` 원자 액션** — Library cross-category 클릭 패턴.
- **테스트 셀렉터 속성** — `data-asset-id`, `data-panel-id`, `data-workspace-item`, `data-page-id`, `data-search-tab`, `data-search-item-id`. 새 인터랙티브 요소 동일 패턴.
- **시드 추가 시 store version bump + migrate** — v4→v5(Tasks), v5→v6(Wiki). Search는 시드 없이 derive만.
- **두 진입점 + 공통 로직** — Search는 ⌘K 팔레트와 풀페이지 모드가 같은 `buildSearchIndex` + `filterSearch` 공유. 이 패턴은 Inbox/Wiki에도 적용 가능.
- **외부 lib 도입 신중** — Wiki 마크다운, Search 팔레트 모두 의존성 0. 시드/내부 데이터 범위면 직접 작성 우선.

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
