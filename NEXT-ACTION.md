# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-05-25 (kkh94 머신, 14 phase 통합 — multi-select 5 commits + 13 phase 단일 commit `2c04c39`)

---

## 한 줄 요약

**Multi-select column type · Filter +Add condition · Dashboard 완성 (D1-5/F1-2/G1/G5/G7-A/G7-B) · Phase A code-only domain fit (A1-5) · AI 확장 (B1-4/G6-1-2) · G3 NEXT-ACTION 잔여 · G4 안정성 · P 폴리시 모두 완료. 다음: 상용화 마일스톤(M1 BaaS·M2 인증·M4 반응형) 또는 G7-C(Formula/Saved views) · G7-D(모바일).**

---

## ✅ 머지 완료

- `origin/main = 2c04c39` 예정 (이번 세션 push 후 머지 — multi-select 5 commits + 통합 13 phase 1 commit).
- 다른 머신: `git fetch && git checkout main && git pull && npm install`.

---

## 🎯 다음 작업

### 우선순위 높음 (사용자 명시)
1. **AI_CLASSIFY 자동 실행** — ⚠ **사용자 명시 룰**: 사용자가 직접 요청할 때만 시작. 메모리 `feedback-ai-classify-user-triggered-only.md` 참조. Claude 자율 진행 ❌.

### 상용화 마일스톤 (M1~M7, 9-14주 추정)
- **M1 BaaS** (Supabase vs bkend.ai 결정 + DB schema + sync + auth) — 2-4주
- **M2 인증** (회원가입/로그인/소셜·이메일·세션 + 워크스페이스 분리) — 1-2주
- **M3 결제** (Stripe/Paddle + 요금제) — 1주
- **M4 반응형** (~800px cramped fix + 모바일 핵심 view) — 1-2주
- **M5 마케팅 사이트** (랜딩 + pricing + onboarding) — 1주
- **M6 운영** (Sentry + 분석 + email + support) — 1주
- **M7 협업** (comment·mention·snooze, Phase 2 W11 후) — 2-3주

### G7 추가 polish (선택, 도메인 fit 후속)
- **G7-C Power user** — Formula 컬럼 · Saved views · Sankey chart
- **G7-D 모바일** — 반응형 fix (M4 마일스톤 통합 가능)

### 우선순위 중간 (소소)
- 알림 시스템 강화 (toast position 통일)
- HTML chart (Pivot) PNG export (html-to-canvas 의존성)
- Bullet chart "as KPI" preset (G7-A1 후속)
- Empty state 일관성 (Kanban/Gallery/Timeline)
- ESLint flat config 복구 · CI 추가 · pre-commit hook

### 우선순위 낮음 (NEXT-ACTION 직전 LOCK)
- **xlsx alt lib 검토** — Phase 3+ 클라우드 sync 전 필수. 옵션: SheetJS CDN 0.20+ · exceljs · read-excel-file. 현재 단기 자기 디바이스 위험 낮음.
- **postcss vuln 추적** — next 16.2.6 transitive (3 moderate). next patch 기다림.
- **Schema pinch-zoom 트랙패드** + 멀티 테이블 → N개 보드 (G3-2 완료)
- **Chart toolbar 터치 UX** (이미 적용)
- **firedKeys cleanup runtime ref sync** (G4-4 완료)

### B4 (가장 마지막, 사용자 명시)
- 컬럼 ↔ Library 자산 링크 → "Use in table" (Library asset에서 시작)

---

## ✅ 이번 세션 완료 (14 phase, multi-select 5 commits + 13 phase 1 commit `2c04c39`)

### Multi-select column type (C1-C5, 5 commits)
- C1 types/store/multi-select utils · learnFromPatch 배열 unpack · compareRows first-value · selectVisibleRows ANY-match · updateColumn migration
- C2 sheet: MultiSelectCell + MultiCellPopover (toggle · "+Add new")
- C3 views: kanban Notion 패턴 · gallery chip · timeline first · dashboard aggregate unpack
- C4 filter: in/not_in ANY-match · bulk "Add tag"
- C5 import: Im-3 multiSelect header 추론 + cell split + tests

### Filter +Add condition UI (1 phase)
- filter-menu ExtraCondBlock helper · conds.slice(1).map array loop
- "+Add another condition" 일반 진입점

### D Dashboard 완성 (D1-D5)
- D1 AggFn (count/sum/avg/min/max/median) · lib/chart-aggregate · KPI/Bar/Donut/Line 적용
- D2 Scatter chart · D3 Histogram · D4 Time scale · D5 Auto-recommend (lib/dashboard-recommend)

### F Dashboard 후속 (F1-F2)
- F1 Multi-series line + legend · F2 calendar bucket (month/quarter/year 정확)

### A Phase A code-only domain fit (A1-A5)
- A1 lib/domain-infer (7 도메인 키워드 점수)
- A2 도메인별 차트 priority + KPI title 변형
- A3 lib/value-format (currency/time/percent/number · word boundary + plural)
- A4 lib/insights (period_change · top_categories · outliers) + InsightCard
- A5 lib/outlier (z-score 2σ) + insights 통합

### G1 Dashboard 강화 (G1-1~G1-4)
- G1-1 Pivot table · G1-2 Drill-down (Bar/Donut/Pivot → sheet filter)
- G1-3 KPI Goal/Target progress bar · G1-4 Sheet outlier alert

### G2 Phase B AI (B1-B4) — 사용자 명시 click LOCK
- B1 Auto-name · B2 Summarize · B3 Suggest type · B4 Cleanup (CleanupDialog)

### G3 NEXT-ACTION 잔여 (G3-1~G3-3)
- G3-1 Snapshots compare A vs B
- G3-2 Library multiTable → N보드 일괄
- G3-3 MATCH_FROM_DROPDOWN sourceField 명시

### G4 데이터 안정성 (G4-1~G4-4)
- G4-1 Sheet cell-level outlier dot
- G4-2 lib/auto-backup (30분 interval · "Auto · " prefix · 5개 cap)
- G4-3 parsers BOM strip
- G4-4 firedKeys CustomEvent sync

### G5 Chart polish (G5-1~G5-3)
- G5-1 Histogram bin click drill-down · G5-2 Line bucket click drill-down
- G5-3 CSV chart data export

### G6 AI 확장 (G6-1~G6-2)
- G6-1 row-context-menu "Suggest empty value"
- G6-2 board-sidebar "Generate with AI" + GenerateBoardDialog (prompt → columns + seed)

### P 소소 폴리시 (P1-P3)
- P1 빈 보드 onboarding tips
- P2 KeyboardShortcutsDialog (⌘/ 16 단축키 4 그룹)
- P3 Kanban priority pill nowrap

### G7-A Domain fit (G7-A1~G7-A3)
- G7-A1 Bullet chart (value + goal + reference)
- G7-A2 Funnel chart (stage drop-off)
- G7-A3 Conditional formatting (4 룰 4 tone · sheet td 적용)

### G7-B 결과 공유 (G7-B1~G7-B2)
- G7-B1 lib/chart-export (SVG → PNG · 의존성 0)
- G7-B2 @media print CSS + Dashboard "Print" 버튼

---

## 코드/디자인 컨벤션 추가 (이번 세션 LOCK)

### Chart 시스템 LOCK
- **ChartType 11종**: kpi/bar/donut/line/stacked-bar/heatmap/scatter/histogram/pivot/bullet/funnel
- **AggFn 6종**: count(default) · sum · avg · min · max · median
- **TimeScale 5종**: day/week/month/quarter/year (week default · month/quarter/year는 calendar boundary)
- **lib/chart-aggregate**: aggregateBy(rows, groupCol|null, aggFn, valueCol) — multiSelect Notion 패턴 (배열 unpack, 합계가 rows.length 초과 가능)
- **lib/chart-export**: SVG → PNG (CSS var inline + Image + canvas + toBlob)
- **lib/conditional-format**: 4 룰 (lt/gt/eq/contains) · 4 tone (red/amber/emerald/blue) · sheet td bg 적용
- **chart drill-down**: Bar/Donut → onBarClick/onSliceClick · Pivot → onCellClick · Histogram → onBinClick · 모두 sheet filter + view="sheet" 전환

### Domain fit LOCK
- **lib/domain-infer**: 7 도메인 키워드 점수 — cs/hr/marketing/sales/finance/stock/general. 최소 2 매치
- **lib/value-format**: currency($/₩/¥/€/£) · time(h/m) · percent(0~1/1+) · number(M/K) abbreviation. word boundary + plural
- **lib/insights**: period_change · top_categories · outliers. 최대 4 cap
- **lib/outlier**: z-score 2σ · 최소 5 샘플 · stdDev=0 skip
- **dashboard-recommend.priorityCol**: 도메인 키워드 순서로 검색 (keywords 첫 단어가 candidate 첫 매치보다 우선)

### AI LOCK
- **사용자 명시 click 룰**: 모든 AI 호출은 사용자 button click 후만 (메모리 LOCK)
- **사람 확정**: 결과는 모두 "Apply" 또는 "Create" 명시 후만 store mutation
- **graceful fallback**: ANTHROPIC_API_KEY 미설정 시 toast.error
- **routes 6 신규**: suggest-board-label · summarize-board · suggest-column-type · suggest-cleanup · suggest-cell-value · generate-board-template
- **claude-sonnet-4-6 단일**: `lib/_anthropic.ts` AI_MODEL 상수

### 안정성 LOCK
- **lib/auto-backup**: 30분 interval · "Auto · " prefix · 5개 cap (사용자 명시 snapshot과 분리)
- **parsers**: UTF-8 BOM strip (Excel/Notion export)
- **firedKeys CustomEvent**: permanentDeleteBoard 후 즉시 ref reload

### Print CSS LOCK
- `@media print` — sidebar/activity/header/aiPanel/detailBar/toolbar/Toaster/Dialog 숨김
- `print-color-adjust: exact` (chart 색 보존)
- `[data-chart-card]` break-inside avoid + margin-bottom 8mm
- root container `height: auto · overflow: visible` override

### 키보드 LOCK
- ⌘/ 또는 ⌘? — KeyboardShortcutsDialog 토글 (CustomEvent flowbase-toggle-shortcuts-help)

---

## 앱 완성도 (상용화 기준)

| 단계 | 진척도 |
|---|---|
| Demo / Showcase | ~95% |
| MVP (혼자 쓰기) | ~85% |
| Beta (외부 사용자 일부) | ~50% |
| 상용화 (Public) | ~30-35% |
| Scale (다수 동시) | ~10% |

**가중 평균: ~34%** (상용화 기준).

핵심 부족 = 백엔드/인증/협업/결제/마케팅/모바일.
데이터 보드 자체는 거의 완성 — "1인 SaaS"로는 즉시 사용 가능.

---

## 환경 정보

| | |
|---|---|
| GitHub | https://github.com/peterkwon248/FlowBase (private) |
| 기준 브랜치 | `main` |
| 미리보기 | http://localhost:3000 (`npm run dev`) |
| 패키지 매니저 | npm · 테스트 `npm test` 또는 `npx vitest run` |
| 명령어 | `/before-work` · `/after-work` — `.claude/commands/` (git 추적) |
| Next.js | 16.2.6 (16.2.4 → 16.2.6 보안 업데이트 — 14 high-sev 패치) |
| ANTHROPIC_API_KEY | 미설정 — `.env.local`에 키 추가 후 AI 진입점(B1/B2/B3/B4/G6-1/G6-2) 실 호출 |

---

## 머신

kkh94 (`C:\Users\kkh94\OneDrive\Desktop\FlowBase`). 다음 머신: `git fetch && git checkout main && git pull && npm install`.

**dev cache 주의**: Next.js 업데이트 후 `.next` 삭제 + dev server 재시작 필요 (stale chunk 방지).
