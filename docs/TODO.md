# TODO

Phase 별 우선순위 (P0 / P1 / P2 / P3).

---

## P0 (즉시 — breadth 마무리)

- [ ] **Wiki 모드** — 현재 `ComingSoonMode` 스텁. 프로토타입 `design-ref/prototype/wiki-view.jsx` 참조
- [ ] **Search 팔레트 (⌘K)** — 스텁. 프로토타입 `search-palette.jsx` 참조

> **앱 breadth 진행** (2026-05-23): Tables✅ · Workspace(Schema·Automations)✅ · Library(B1·B2 읽기 전용)✅ · Inbox✅ · Detail bar✅ · Wiki⬜ · Search⬜.
> 사용자 명시 우선순위: "목업 퀄리티와 기능들을 완벽하게." Breadth 완성이 깊이(B3/B4)보다 먼저.

---

## P1 (breadth 뒤)

- [ ] **시드 deep 영어화** — `flowbase-library-seed.ts` Korean 자산명(모델명·처리방식·사업부) + 옵션 라벨 · `flowbase-workspace-seed.ts` 룰 잔여 · Customer Interviews 시드 한국어 quote/name
- [ ] **반응형 fix** — ~800px 4-5 패널 cramped (사용자 우선순위 후순위)
- [ ] **B3 — Library 인라인 편집** — rename · 옵션 색상/추가 · field config
- [ ] **AI 실호출 검증** — `.env.local`에 `ANTHROPIC_API_KEY` → infer-batch/ask/analyze-import 검증
- [ ] **`main` 머지** — 13 커밋 origin/branch 대기 → fast-forward
- [ ] **B4 (가장 마지막, 사용자 명시)** — 컬럼↔Library 자산 링크 · "Use in table" · 템플릿으로 보드 생성

---

## P1 (Phase 1 본격)

- [ ] **Import flow Step 1·1.5·2·3 정식 구현** ([specs/flowdb-import-flow-spec.md](specs/flowdb-import-flow-spec.md))
  - PoC 파서 (`lib/parsers/txt-block-parser.ts`) 재사용
  - `app/txt-poc/` 페이지 제거
  - `.csv .xlsx .xls .tsv` + `.txt` 분기
- [ ] **BaaS 결정** — Supabase vs bkend.ai ([01-baas-decision.md](01-baas-decision.md))
- [ ] **카테고리 인라인 편집** (사람 확정 UI) — spec §0 원칙 적용 (옵션 B)
- [ ] **데이터 섹션 시트 뷰** — 셀 인라인 편집 + 키보드 네비게이션 (옵션 A)
- [ ] **디스플레이 자동 추천 원칙 spec에 박기** — 옵션 A와 묶어 처리

---

## P2 (Phase 1 후반)

- [ ] **LLM 하이브리드 카테고리 분류** — "기타" 보강 (옵션 C, 옵션 B 선결)
- [ ] **인코딩 자동 감지** (UTF-8 / EUC-KR / CP949)
- [ ] **AI 추천 카드 — 새 컬럼 후보** (chartdb의 "AI ER Diagram Generator" 패턴 참고)
- [ ] **DBML export** — chartdb.io 연동 (선택)
- [ ] **차트 (요약 대시보드)** 별도 영역

---

## P3 (Phase 2+)

- [ ] **워크스페이스 W11 — 진짜 분리** (mock UX는 PR #4로 추가됨, 백엔드 분리/개인 워크스페이스 자동 생성 미구현, [02-v01-backlog.md:99](02-v01-backlog.md))
- [ ] **멤버 초대 + 권한 모델** (Owner/Admin/Viewer)
- [ ] **Trash 백엔드** (mock UX는 PR #4로 추가됨, 30일 rollback 백스톱 미구현)
- [ ] **타임라인/캘린더 디스플레이** (일정 컬럼 있는 테이블)
- [ ] **갤러리 디스플레이** (첨부 컬럼 도입 후)
- [ ] **Realtime collab on import preview** ([spec §367](specs/flowdb-import-flow-spec.md))

---

## 완료

- [x] **English UI + Trash/Settings + Tasks 보드** (2026-05-23 — `605b9f3`): UI chrome 17+ 파일 영어화 · `STATUS_LABELS` 맵 · 사이드바 푸터(Trash·Settings·2.1/10 GB) · Tasks 시드(store v4→v5 migrate)
- [x] **Detail bar (4번째 패널)** (2026-05-23 — `f3feae2`): `PanelState.detailBar` · DetailBar 컴포넌트 · ⌘I 단축키 · TablesMode 통합
- [x] **Inbox 모드** (2026-05-23 — `620dadb`): 워크스페이스 상태 파생 6 kind + 필터 chips + 액션 네비
- [x] **Workspace > Automations** (2026-05-23 — `41b7257`): 룰 카드(When/Then) + AI 제안 + Schema/Automations 탭
- [x] **Phase B Library B2** (2026-05-23 — `5bf1ef5`): 5 카테고리 자산 디테일 + `selectAsset` 원자 액션
- [x] **Phase B Library B1** (2026-05-23 — `4148c96`): 5 카테고리 사이드바 트리 + 카탈로그 (읽기 전용)
- [x] **앱 셸 6모드 라우터 (Phase A)** (2026-05-23 — `daad859`): 액티비티 바 6모드 레일 · `activityMode` 라우터 · Schema를 Tables 뷰 탭→Workspace 모드 이동. Library 서브시스템 설계 문서
- [x] **옛 V1 미사용 코드 정리** (2026-05-23 — `4fa804a`): V2 도달 불가 V1 파일 20개 삭제 (−7,025줄)
- [x] **infer-batch sourceField 일반화 (Phase 3 Q1)** (2026-05-23 — `afa39f1`)
- [x] **before/after-work 명령어** (2026-05-22 — `2cbf01a`·`d2ad4ea`): 글로벌 대신 프로젝트 커맨드로 git 추적
- [x] **FlowBase V2 Phase 4·5·6** (2026-05-21 — `df7eeb4`, `main` 머지): Kanban·Dashboard·뷰 스위처 · 앱 셸(Activity bar·Sidebar·패널 토글·단축키) · 멀티보드(보드 CRUD)·Schema 뷰. 설계 문서 phase{4,5,6}
- [x] **FlowBase V2 Phase 1B·2·3** (2026-05-21 — `eb31064`, `main` 머지): 시트 뷰(`components/sheet/*`) · AI 패널+Claude(`app/api/ai/*`·`components/ai/*`) · Import 모달(`components/import/*`). 설계 문서 phase{2,3}. vitest 도입. `app/txt-poc` 제거
- [x] **FlowBase V2 Phase 1A — 기반** (2026-05-21): 제네릭 데이터 모델·zustand 스토어·시드·undo·parsers·키보드. design-ref V2 핸드오프 도입, 7단계 계획·Phase 1 design 작성
- [x] **PR #4** (2026-05-07): Linear+shadcn overhaul, Trash, Workspaces UX, Quick switcher, Breadcrumb, Settings, design tokens
- [x] **FlowBase 리브랜드** (2026-05-05): FlowDB → FlowBase, GitHub repo rename (peterkwon248/FlowBase), Status pill 통합 + 미처리=blue
- [x] **PR #3** (2026-05-05): visual-design-update — Phosphor 아이콘, 채널 아이콘+텍스트, 워크스페이스 셀렉터, light/dark 컬러 최적화
- [x] **PR #1** (2026-05-04): txt 블록 자동 분류 PoC + 머지
- [x] 글로벌 명령어 강화 (after-work / before-work)
- [x] Docs bootstrap (`docs/{SESSION-LOG,MEMORY,CONTEXT,TODO}.md`)
- [x] Claude Design 앱 → FlowDB 3 섹션 이식
- [x] shadcn/ui 디자인 시스템
- [x] v0.1 코드 감사 + 백로그 분류 (🟢 24 / 🟡 13 / 🔴 1)
- [x] GitHub repo 분리 + 첫 푸시 (peterkwon248/flowdb → FlowBase)
- [x] 4개 기획 문서 작성 (docs/00~02 + spec)
