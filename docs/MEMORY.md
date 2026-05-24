# MEMORY (Source of Truth)

> 프로젝트 진행 방향, PR history, 핵심 결정사항을 한 곳에. 충돌 시 이 파일이 master.

---

## Phase Status

- **Phase 0 (Plan)**: ✅ 완료
- **Phase 1 (Beta)**: 🟢 거의 완성 — FlowBase V2. 6 액티비티 모드 + 깊이 일괄 + 폴리시 18건(자동화+firedKeys persist · 다중 필터 + range/num/date + cascade hover · Gallery/Timeline(Gantt) · Dashboard + Heatmap + reorder/edit · Schema ER · Trash 3종 · Promote/Attach + Library 점프 · AppShell cleanup · Ask AI ⌘J · Settings 4탭 + Theme accent + Data Export/Import + Members lastSeen + permanentDeleteBoard cleanup · Display 옵션 4 view). **남은 폴리시**: AI_CLASSIFY 자동 실행(사용자 명시 룰) · Members enforcement 전체 확장 · Theme oklch 튜닝 · Data Import 메타 · firedKeys dueDate cleanup · 우선순위 낮음 다수.
- **Phase 2 (Team)**: ⬜ — 멤버 초대, 권한 모델, 워크스페이스 분리 (W11)
- **Phase 3+**: ⬜ — Realtime collab, scaling, BaaS 결정 (Supabase vs bkend.ai)

---

## Current Direction (다음 우선순위)

**2026-05-24 진행상태**: 6 액티비티 모드 + 일관성/깊이 + P1·P2 폴리시 18건 완료. #5(Wiki Trash · cleanup · Ask AI ⌘J · Settings 4탭 · Heatmap) + #6(Timeline Gantt · Filter 2-step+range · Display 4 view · Chart reorder · Library 점프) + **#7**(Filter cascade hover 복원 · legacy 제거 · cleanup · firedKeys persist · Theme accent · Data Import · Members 깊이 minimum). Filter UX Linear cascade 정착. Theme 4 accent. Members infra (Viewer enforcement는 demo).

**다음**: Members enforcement 확장(모든 mutation viewer 가드) · Theme accent oklch 시각 튜닝 · Data Import 메타 포함 · firedKeys dueDate cleanup · 우선순위 낮음 후속. **AI_CLASSIFY 자동 실행은 사용자 명시 요청 시에만** (메모리 룰). B4(Library "Use in table")는 사용자 명시 후순위.

상세는 [../NEXT-ACTION.md](../NEXT-ACTION.md) 참조.

---

## PR History

| # | 제목 | 머지 | 핵심 |
|---|---|---|---|
| #1 | feat: txt 블록 자동 분류 PoC | `fac55e1` (2026-05-04) | `lib/parsers/txt-block-parser.ts` + `app/txt-poc/page.tsx`. 머레이 응대 템플릿 231 블록 검증 |
| #3 | visual-design-update | `aa4f353` (2026-05-05) | UI 폴리시 — 채널 아이콘+텍스트, Phosphor status/priority 아이콘, 워크스페이스 셀렉터, 라이트/다크 컬러 최적화 |
| (TBD) | session: FlowBase rebrand + pill polish | 진행 중 (2026-05-05) | TS fixes(`cc90196`) + FlowDB→FlowBase 리브랜드 + Workflow 아이콘 + 운영 status pill 통합 디자인(`8f597b0`) + 미처리 blue(`e3f8208`) |
| — | FlowBase V2 재구축 Phase 1A (기반) | `feat/flowbase-v2` → main squash (2026-05-21) | V2 제네릭 데이터 모델·zustand 스토어·시드·undo·parsers·키보드. `design-ref/` V2 핸드오프 도입, 7단계 계획·Phase 1 design 작성 |
| `eb31064` | FlowBase V2 Phase 1B·2·3 (시트·AI·Import) | `feat/sheet-view-v2` → `main` 머지 (2026-05-21) | 시트 뷰 · AI 패널+Claude(`claude-sonnet-4-6`) · Import 3-step 위저드. 설계 문서 phase{2,3}. tsc·build·vitest(13) green. `app/txt-poc` 제거 |
| `df7eeb4` | FlowBase V2 Phase 4·5·6 (Kanban·Dashboard·앱 셸·멀티보드·Schema) | `feat/kanban-dashboard` → `main` 머지 (2026-05-21) | 뷰 스위처 · Kanban · Dashboard(recharts) · 앱 셸(패널 토글·단축키) · 보드 CRUD · Schema 뷰. 설계 문서 phase{4,5,6}. tsc·build green |
| `2cbf01a`~`2cdbb0f` | 세션: 명령어 · Phase 3 Q1 · 죽은코드 정리 · 앱 셸 6모드(Phase A) · Library 설계 | `claude/wizardly-murdock-451e3d` (origin) — main 머지 대기 (2026-05-23) | before/after-work 프로젝트 커맨드화 · infer-batch sourceField · V1 코드 20파일 삭제(−7,025줄) · 셸 6모드 라우터+Schema→Workspace · Library 설계(B1~B4). **앱 범위 재정의** |
| `4148c96`~`605b9f3` | 후속: Phase B Library(B1·B2) · Workspace Automations · Inbox · Detail bar · English UI · Tasks 보드 | `main` 머지 (2026-05-23) | 6 커밋. Library B1(브라우즈)·B2(디테일) · Workspace Automations(룰+AI 제안+탭) · Inbox(파생 항목·필터) · Detail bar(4번째 패널·⌘I) · UI 영어화(STATUS_LABELS 맵) · Trash/Settings 푸터 · Tasks 시드 보드 |
| `01a7ae7`~`3771bc8` | Wiki 모드 + Search 팔레트 → breadth P0 100% | `main` 머지 (2026-05-23) | Wiki 6 시드 페이지 + 미니 마크다운 렌더러 + Verified pill + store v5→v6 · ⌘K Search 팔레트 + 풀페이지 Search 모드(All/Tables/Rows/Library/Wiki) |
| `96ff20d`~`d911c06` | 셸 chrome 보정 + 컬럼 CRUD + Trash/Settings 실작동 + 시드 영어화 | `main` 머지 (2026-05-24) | status-bar(영구, hide-all UX) · NavCluster(시계·‹·›) · 컬럼 추가/편집 ("+" 활성, 헤더 ... 메뉴) · Trash/Settings 다이얼로그 실 동작 · 시드 deep 영어화 |
| `12a65d3`~`44d5003` | 깊이 일괄: Automations 엔진 · Filter · 우클릭 · Gallery/Timeline · Bulk edit · Wiki CRUD | `main` 머지 (2026-05-24) | 6 커밋. row 변경 시 active 룰 자동 발화 + 15 단위 테스트 · 다중 필드 Filter(submenu) · 행 우클릭(Open/Duplicate/Copy/Delete) · Gallery+Timeline 뷰 · Bulk edit + ⌘D · Wiki 새 페이지 + 사이드바 검색 |
| `2bdee40`~`57fadb6` | Schema 인터랙션 + Dashboard 영어/Line + Change type | `main` 머지 (2026-05-24) | Schema pan/zoom + 카드 드래그 + "New table" 모달 · Dashboard Line trend(date 컬럼 있을 때) + 모든 라벨 영어화 · 컬럼 Change type submenu |
| `fb79379`~`8909ec2` | 일관성 회복: Workspace/Inbox 사이드바 + Trash 행 단위 + Promote/Attach + Automation log | `main` 머지 (2026-05-24) | 사용자 지적("왜 사이드바가 아니라 탭?") → Workspace/Inbox 사이드바 추가 · 5 모드 너비 통일(240px) · Automation 실행 → aiHistory log · Wiki 페이지 우클릭(Rename/Move/Delete) · Trash 행 단위 + 30일 만료(2탭 다이얼로그) · Promote to Library / Attach function 컬럼 헤더 |
| `bb5a0cc`~`5db2376` | Dashboard builder + 시간 트리거 + Attached function | `main` 머지 (2026-05-24) | Dashboard builder full(ChartConfig persist · Stacked bar · "+Add chart" 모달 · X 삭제 · Reset to auto · 5종 차트 type) · Automations 시간 트리거(daily HH:MM · dueDate+status, setInterval 1분 tick + firedKeys dedupe) + 14 신규 unit test · Attached function 실 실행(MATCH_FROM_DROPDOWN 동작, AI_CLASSIFY hint) |
| `d98f41c` | 깊이 일괄 #5 — Wiki Trash · AppShell cleanup · Ask AI ⌘J · Settings 4탭 · Heatmap | `main` 머지 (2026-05-24) | P1·P2 폴리시 5건 단일 commit. **Wiki 삭제 → trashedWikiPages**(store v9→v10 + 3rd Trash 탭 + WikiList 카테고리 그룹) · **AppShell mount cleanupExpiredTrash**(hasHydrated 체크 + onFinishHydration 콜백) · **Ask AI ⌘J**(types.askAiFocusToken + store.requestAskAi + AiComposer ref 구독 + ⌘J 단축키 + board-header Sparkles 버튼) · **Settings 4탭**(shadcn Tabs · types.MemberRole/WorkspaceMember · store v10→v11 시드 멤버 4명 + addMember/updateMemberRole/removeMember/exportData · settings-dialog 전면 재작성 · Owner 보호 이중 단 · next-themes Light/Dark/System 카드 · Blob JSON export `flowbase-export-YYYYMMDD.json`) · **Heatmap 차트**(types.ChartType += "heatmap" + heatmap-chart.tsx 2D grid + intensity opacity 단일 hue + add-chart-dialog 6번째 카드 + dashboard-view render branch). 1008+/95− lines |
| `a818f82` | 깊이 일괄 #6 — Timeline Gantt · Filter (2-step + range) · Display 옵션 · Chart reorder · Library 점프 | `main` 머지 (2026-05-24) | P2 폴리시 6건 + 사용자 보고 fix 2건. **Timeline Gantt 재작성**(월별 카드 폐기 → design-ref view-timeline 답습 · sticky day-column + start~due bar + OVERDUE 배지 · 필드 휴리스틱) · **Filter Popover 2-step inline**(DropdownMenu Sub 폐기 · 컬럼 hue dot · cursor-pointer · z-[60]) · **Filter range/num/date**(types.FilterCondition union · setColumnCondition/toggleColumnInValue · selectVisibleRows kind 분기 · num min-max input · date from-to) · **viewSettings 인프라**(store v11→v12 · types.ViewSettings 5종 · setViewOption/resetViewOption · display-menu.tsx 신규 view-aware popover · Sheet hiddenColumns · Kanban groupBy(status 외 select) · Gallery cover/cardFields/columns 2-4 · Timeline dateField + scale day/week) · **Chart reorder + edit**(store.moveChart · CustomChartCard 호버 toolbar ↑↓ ⋯ X · Rename Dialog · Width 4종 segmented) · **Library promoted field 점프**(asset-detail Used in chip → button · parseUsedIn · switchBoard+setActivityMode+setFocused). sheet/kanban useMemo deps columnFilters 누락 fix. 1884+/397− lines |
| `568526d` | 폴리시 일괄 #7 — Filter cascade 복원 · firedKeys persist · Theme accent · Data Import · Members 깊이 | `main` 머지 (2026-05-24) | NEXT-ACTION 우선순위 중간 1~6 + Filter UX 재검토. **Filter cascade hover 복원**(직전 #6 2-step inline 폐기 · DropdownMenu Sub + kind별 widget · Linear 정확) · **legacy 액션 제거**(setColumnFilter/toggleColumnFilter) · **permanentDeleteBoard cleanup**(viewSettings/schemaPositions/viewByBoardId dangling) · **firedKeys persist**(automation-runtime localStorage + 30일 daily cleanup) · **Theme accent**(types.ThemeAccent purple/blue/emerald/amber · globals.css data-theme-accent selector × light/dark · app/page.tsx mount sync · Settings AccentSection) · **Data Import**(store.importBoards · settings ImportSection · JSON 보드만 머지) · **Members 깊이 minimum**(WorkspaceMember.lastSeenAt + roleCanEdit + settings.currentUserId v12→v13 + Settings You 배지·lastSeen · addRow demo viewer 가드). 499+/274− lines |
| `951e82e` | 폴리시 일괄 #8 — Members enforcement 전체 · firedKeys dueDate cleanup · Data Import 메타 확장 | `main` 머지 (2026-05-24) | NEXT-ACTION 우선순위 중간 1~4. **Members enforcement 확장**(store.ensureCanEdit helper + sonner toast id-dedupe + 14 mutation 가드: addRow/addRowToBoard/duplicateRow/updateRow/deleteRows/addColumn/deleteColumn/renameColumn/updateColumn/addChart/removeChart/updateChart/moveChart/createBoard/deleteBoard/addWikiPage/updateWikiPage/deleteWikiPage) · **firedKeys dueDate cleanup**(permanentDeleteBoard에서 3-part key 정리) · **Data Import 메타 확장**(importBoards→importWorkspace · types.ExportedSnapshot · boards 새 id · library/wiki/automations id skip · Settings ImportSection 4 카운트 confirm). UI disable·남은 mutation 가드는 후속. 193+/35− lines |
| `1cb045e` | 폴리시 일괄 #9 — Filter text contains · Gallery cardFields reorder · Timeline month scale | `main` 머지 (2026-05-24) | NEXT-ACTION 우선순위 낮음 6~7 minimum. **Filter contains operator**(types.FilterCondition += contains · isFilterable에 text/email 추가 · selectVisibleRows kind 분기 · ContainsWidget · chip 라벨) · **Gallery cardFields ↑/↓ reorder**(DisplayPopover 재구성 — 선택 컬럼 우선 + 미선택 다음 + 첫/마지막 disabled · dnd lib ❌) · **Timeline month scale**(COL_WIDTH_MONTH=8 · types += 'month' · DisplayPopover segmented). 부가: timeline-view 상수명 정정 (이전 replace_all 부작용 cleanup). 139+/24− lines |
| `a7e91c5` | fix(ui): status pill 줄바꿈 — whitespace-nowrap 3 곳 일괄 | `main` 머지 (2026-05-24) | 사용자 보고 fix. Sheet "In progress" 2줄 wrap. editable-cell · gallery-view · filter-chips 3 곳에 whitespace-nowrap 일관 적용. **LOCK 추가**: status/pill 류는 모두 한 줄 유지. 3+/3− lines |

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

9. **taste-skill 도입 — 옵션 2 (minimalist-skill 단일)** (2026-05-07 결정) — `docs/design-skills/minimalist-skill/SKILL.md` (git tracked source of truth). 우선순위: ① docs/MEMORY.md 결정 → ② lib/tokens.ts → ③ minimalist-skill SKILL.md. **세리프 헤딩 도입 ❌, framer-motion 자동 설치 ❌, Status 색 매핑 보존**. 가드 매트릭스 [CLAUDE.md](../CLAUDE.md) 참조. 트라이얼: `feat/sheet-view` 브랜치에서 옵션 A 시트 뷰 작업 시 적용 → 1주 평가. 검토 plan: [docs/01-plan/features/taste-skill-adoption.plan.md](01-plan/features/taste-skill-adoption.plan.md).

10. **Geist 폰트 적용 fix** (2026-05-07) — `app/layout.tsx`에서 `Geist({ variable: "--font-geist-sans" })` + `<html className={geistSans.variable}>` 적용. `app/globals.css` `@theme inline`의 `--font-sans: var(--font-geist-sans)`로 매핑. 이전에는 import만 되고 적용 안 됨 (`<body className="font-sans">`만, Geist variable 미연결).

11. **FlowBase V2 재구축 — 프로토타입 제네릭 모델** (2026-05-21) — `design-ref/`의 V2 핸드오프 + 프로토타입이 디자인 정본. 기존 3섹션 UI를 V2 데이터 보드로 클린 재구축 (7단계, [01-plan/features/flowbase-v2.plan.md](01-plan/features/flowbase-v2.plan.md)). 데이터 모델은 **제네릭 컬럼 구동** (`Board`/`TableRow`/`ColumnDef`, 10 cell type) — 핸드오프 STATE-SHAPES의 단순화 고정 `TableRow`는 폐기 ([types/flowbase.ts](../types/flowbase.ts)). `dismissAiCell`=값 유지. `feat/sheet-view`의 M1~M5(옛 모델 시트 트라이얼)는 패턴 이식만, 머지 ❌. **레퍼런스(프로토타입)는 구현 전 끝까지 정독할 것.**

12. **Phase 1B·2·3 구현 결정** (2026-05-21) — (1) 시트 포커스 셀 표시는 `ring`으로 (tailwind-merge가 `outline` 스타일 클래스를 `outline-2`와 충돌로 제거 → 외곽선 안 보임). (2) **AI 모델 = `claude-sonnet-4-6`** — `claude-api` 스킬 기본값은 `claude-opus-4-7`이나, 핸드오프 AI-CONTRACTS + Phase 2 설계 D2가 Sonnet 지정 + theme/sentiment 대량 분류라 채택. `app/api/ai/_anthropic.ts`의 `AI_MODEL` 단일 상수. (3) AI 패널 **"Apply all" = Claude `infer-batch` 호출 + `confirmed:true` 적용**, ⌘Z가 검토 백스톱 — 버튼 클릭이 곧 사람의 확정이라 "자동 적용 ❌" 위반 아님. (4) **Import = 새 제네릭 보드 생성** — 프로토타입/IMPORT-SPEC §3의 고정필드 휴리스틱 매퍼 폐기 (#11 일관). (5) vitest 최소 도입 (`npm test`). 키 미설정 시 AI 라우트는 graceful 500.

13. **Phase 4·5·6 구현 결정** (2026-05-21) — (1) Kanban 카드 이동 = **이동 버튼** (DnD 라이브러리 ❌ — 의존성·모션 최소). (2) **Dashboard = 제네릭 집계** (아무 보드의 categorical/num 컬럼) — interview 전용 하드코딩 폐기. 차트 = div 막대 + recharts hero 2개 혼합. (3) 앱 셸 패널 3종(activityBar/sidebar/aiPanel) — 스토어 `panels`·토글·persist는 Phase 1A 완비, Phase 5는 UI만. (4) **Schema = 4번째 뷰 탭** — Phase 1의 "schema는 뷰 아님" 노트를 MVP 단순화 위해 번복, `ViewMode += "schema"`, active board 무관 워크스페이스 렌더. (5) **`selectVisibleRows`는 zustand 셀렉터로 직접 구독 ❌** — 매 호출 새 배열 반환 → getSnapshot 무한 루프. 의존 슬라이스(board/search/filter/sort) 구독 + `useMemo` 패턴 필수 (sheet-view 패턴).

14. **앱 범위 재정의 — 6 액티비티 모드** (2026-05-23) — V2 "Phase 1~6 완료" 기재는 과대평가였음. 프로토타입(`design-ref/prototype/`)이 그리는 앱은 액티비티 바 **6모드**(Inbox·Tables·Workspace·Library·Wiki·Search)인데 V2는 **Tables 모드**(시트·칸반·대시보드)만 구현 — 앱의 약 1/6. 셸을 `activityMode` 기반 6모드 라우터로 재구축(Phase A, `daad859`). 나머지 서브시스템을 차례로 구축 — **Library 먼저** ([flowbase-v2-library.design.md](02-design/features/flowbase-v2-library.design.md), B1~B4). **Schema는 Workspace 서브시스템** — `prototype-app.jsx`가 `schema`를 stale 뷰로 마이그레이션(`activeWorkspaceItem: "schema"|"automations"`). Phase 6 D3("Schema=4번째 뷰 탭")를 번복, `ViewMode`에서 `schema` 제거. **BaaS(옛 Phase 7)는 후순위.** before/after-work 명령어는 `~/.claude/`(머신 로컬·미동기화)가 아니라 `<repo>/.claude/commands/`에 프로젝트 커맨드로 둠(`.gitignore` 예외).

15. **앱 breadth 우선 — Workspace/Inbox/Detail bar/Tasks 보드 + English UI** (2026-05-23 후속) — Phase A 셸 완성 뒤 B3(Library 편집)/B4(테이블 연동) **깊이** 대신 워크스페이스 **breadth** 완성 우선: **Library B1·B2** (읽기 전용 카탈로그·디테일) · **Workspace > Automations** (룰+AI 제안+Schema/Automations 탭) · **Inbox** (워크스페이스 상태 파생 항목·필터) · **Detail bar** (4번째 패널·⌘I·선택 행 디테일). 사용자 명시 우선순위: "목업 퀄리티와 기능들을 완벽하게 구현해내는 게 최우선." **Status는 LOCK 한국어 키 보존(`미처리/진행중/대기/완료`) + `STATUS_LABELS` 맵으로 디스플레이만 영어** ("Todo/In progress/Waiting/Done") — Key Design #8 색 매핑 호환. **Library의 cross-category 자산 클릭은 `selectAsset(category, id)` 원자 액션** — `setLibAsset`만으론 libCategory 동기 안 돼 `assetExists` false → 디테일 미렌더 버그 해결. **Tasks 보드** (`flowbase-tasks-seed.ts`)를 두 번째 시드(CS Operations 도메인) 추가 — `store v4→v5 migrate`로 기존 persisted state에 자동 주입. **테스트 셀렉터 속성** `data-asset-id` · `data-panel-id` · `data-workspace-item` 추가 (preview_click 안정화). **남은 breadth: Wiki 모드 · Search 팔레트(⌘K)** — B3/B4는 그 뒤.

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
