# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-05-25 (kkh94 머신, 대규모 폴리시 24개 + hotfix · 단일 commit `c1b2be7`)

---

## 한 줄 요약

**Snapshots + Im-1/2/3 + 실용성 핵심(한계가드·virtual·worker) + UI viewer disable 13 surface + Next.js 16.2.6 보안 + Phase A 영어화 + Filter Match+Exclude + Steps clickable + Theme amber WCAG fix + mapStatus lib화 + Schema/BulkEdit polish 모두 완료. 다음: Multi-select column type(큰 작업) · xlsx alt lib(Phase 3+ 클라우드 sync 전) · postcss vuln 추적.**

---

## ✅ 머지 완료

- `origin/main = c1b2be7` (이번 세션 push 후 머지 — 단일 commit, 44 파일 +3856/-198).
- 다른 머신: `git fetch && git checkout main && git pull && npm install`.

---

## 🎯 다음 작업

### 우선순위 높음
1. **AI_CLASSIFY 자동 실행** — ⚠ **사용자 명시 룰**: 사용자가 직접 요청할 때만 시작. 메모리 `feedback-ai-classify-user-triggered-only.md` 참조. Claude 자율 진행 ❌.

### 우선순위 중간 — 대규모 (별 phase)
2. **Multi-select column type** (`multiSelect`) — Notion/Airtable의 가장 흔한 cell type. 도입 시 영향:
   - types: ColumnType += "multiSelect", row[col] = string[]
   - sheet view: chip 여러 개 render + cell editor multi-pick
   - kanban: 한 row가 여러 그룹에 속함 (또는 첫 값만)
   - gallery/filter: multi-select group/filter
   - Im-3 후속: "tag1, tag2, tag3" → string[] 자동 split
   - 별 phase 권장 (최소 3-5 commit 분리)

3. **xlsx alt lib 검토** — Phase 3+ 클라우드 sync (타 사용자 공유 파일 처리) 전 필수.
   - 옵션: SheetJS CDN 0.20+ (tarball URL · API 동일) · exceljs (600KB, 풍부) · read/write-excel-file (50KB, API 다름)
   - 위험 시나리오: 신뢰 안 되는 xlsx import 시 Prototype Pollution + ReDoS
   - 현재 단기 use case: 자기 디바이스 자기 파일 → 위험 낮음 (그대로 유지)
   - **LOCK**: 클라우드 sync 도입 전 alt lib 필수 (`Key Design 후속`)

### 우선순위 낮음
4. **Snapshots 후속**:
   - Cell-level diff (row 안 어떤 셀 변경)
   - Snapshot A vs B compare (현재는 vs current만)
   - 압축 / events index+replay (option B, localStorage 폭증 대비)
   - Partial restore (특정 보드만)
5. **Filter "+Add condition" UI** 확장:
   - 현재 두 번째 cond까지 (Match + Exclude). 3+ cond는 chip+X로만 제거 가능
   - 3+ cond UI 편집 + OR 그룹 (cross-column OR)
6. **Sheet view virtual scrolling 후속**:
   - groupBy 모드도 virtual (group header를 flat list에 끼우기)
   - 100미만 threshold 동적 조정 (작은 board overhead 회피)
7. **Im-3 multi-select cell 자동 split** (Multi-select column type 도입 후)
8. **postcss XSS vulnerability 추적** — next 16.2.6 transitive (3 moderate). next patch 기다리거나 무시.
9. **Gallery/Timeline 커스터마이즈 후속** — Gantt 주 단위 group · zoom · cardFields reorder
10. **Schema 멀티 테이블 → N개 보드** + pinch-zoom 트랙패드
11. **MATCH_FROM_DROPDOWN sourceField 명시 선택**
12. **Chart toolbar 터치 UX** — group-hover 한계
13. **firedKeys cleanup runtime ref sync** — permanentDeleteBoard 후 즉시 ref reset

### B4 (가장 마지막, 사용자 명시)
- 컬럼 ↔ Library 자산 링크 → "Use in table" (Library asset에서 시작)

---

## ✅ 이번 세션 완료 (24 작업 + 1 hotfix — 단일 commit `c1b2be7`)

> SESSION-LOG 같은 날 entry 상세.

### Snapshots 모델 (GitHub 식 명시 save point — Key Design #18)
- store v15→v16 · 4 action (save/restore/delete/rename) · Compare diff (boards/wiki/automations/library)
- SnapshotsView · SnapshotCompareDialog · Restore preview summary

### Im 시리즈 (상용화)
- **Im-1** (CSV/MD 양방향) — stringifyDelimited/stringifyMarkdownTable/boardToTable
- **Im-2** (xlsx) — xlsx lib + dynamic import + worker 분리
- **Im-3** (Notion/Airtable) — detect/normalize headers + status mapping + inferColumnTypeByHeader

### 실용성 핵심 3대
- **Import 한계 가드** — file(10/50MB) · row(5K/50K) · cell(500K) · storage(5/10MB) · quota guard
- **Sheet Virtual Scrolling** — @tanstack/react-virtual · 100+ 행 활성 · 1000행 DOM 17~30개
- **Web Worker Parsing** — parse-worker + xlsx-worker (lazy import) · UI freeze 제거

### Filter Match+Exclude UI (multi-cond AND 활용)
- second cond widget (not_in/not_contains) + "+Add exclude" 진입점

### Phase A 영어화 (~44개 한글 UI → 영어)
- Import wizard · sheet aria-label · ai panel toast · theme-toggle 등

### UI viewer disable 확장 (13 surface)
- AI panel · Wiki · Automations · Trash · Settings Members · Schema · BulkEdit (이전 5 surface + 신규 8)

### mutation enforcement 잔여 + hotfix
- renameBoard · clearCustomCharts (총 44개 가드)
- selectIsViewer settings undefined 가드 hotfix

### 보안 + polish
- Next.js 16.2.4 → 16.2.6 (14 high-sev 패치)
- Theme accent amber WCAG AA fix (dark text override)
- mapStatus lib 이동 + 단위 테스트
- Import Steps clickable navigation (Paste/Review/AI columns)
- Sheet useDeferredValue (typing 500ms→7ms)
- root container `h-[100dvh] overflow-hidden` (virtual scroll 위해 viewport 고정)
- tables-mode `min-h-0` 추가 (flex-col chain LOCK 확장)

---

## 코드/디자인 컨벤션 추가 (이번 세션 LOCK)

- **root container = `h-[100dvh] overflow-hidden`** (app/page.tsx) — content가 root 늘림 방지. virtual scroll 작동 위해 필수. 다른 view (Kanban/Gallery/Timeline)도 영향 받음.
- **flex-col chain `min-h-0` 모든 단계 명시** — 이미 LOCK 있음. 신규 chain 추가 시 강제. (tables-mode 보드 영역 fix)
- **Web Worker = main bundle 분리 + lazy spawn** — Next.js Turbopack `new Worker(new URL(...), { type: "module" })` 패턴. setState로 scroll element 잡기 (ref만으론 measure 안 됨).
- **Snapshot LOCK** (Key Design #18 확장):
  - deep state copy (option A) · cap ❌ · cleanup ❌
  - Restore = 자동 새 snapshot 생성 (사용자 되돌리기 보장)
  - events는 복원 ❌ (timeline append-only)
  - ephemeral(selectedRowIds/focusedCell/columnFilters/filter/search) reset · undoStack clear
- **Import 한계 LOCK**:
  - File: 10MB soft (confirm) / 50MB hard (block)
  - Rows: 5,000 soft / 50,000 hard
  - Cells (rows×cols): 500,000 hard
  - localStorage: 5MB safe / 10MB browser cap
  - quota error → 새 보드 rollback + 명시 toast
- **xlsx 후속 LOCK**: Phase 3+ 클라우드 sync 도입 전 alt lib (SheetJS CDN 0.20+ 또는 exceljs) 필수 검토. 신뢰 안 되는 xlsx 입력 시 Prototype Pollution + ReDoS 위험.
- **mapStatus 매핑 규칙** (lib/import-normalizers.ts):
  - 완료: done · complete · finish · closed · cancel
  - 진행중: progress · 진행 · doing · active · wip
  - 대기: wait · 대기 · hold · block · review · paus
  - 미처리 (fallback): todo · backlog · new · open · not started · 등
- **UI viewer disable 패턴**: `disabled={isViewer}` + `title={isViewer ? "Viewers can't ..." : undefined}` + `cn("...", "disabled:cursor-not-allowed disabled:opacity-50")`. 13 surface.

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

---

## 머신

kkh94 (`C:\Users\kkh94\OneDrive\Desktop\FlowBase`). 다음 머신: `git fetch && git checkout main && git pull && npm install`.

**dev cache 주의**: Next.js 업데이트 후 `.next` 삭제 + dev server 재시작 필요 (stale chunk 방지).
