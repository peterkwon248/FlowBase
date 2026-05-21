# 시트 뷰 (편집용 표) — Plan

> 작성: 2026-05-07
> 출처: NEXT-ACTION.md "다음 행동" 옵션 A
> Phase: PDCA Plan
> 다음: [sheet-view.design.md](../../02-design/features/sheet-view.design.md) (작성 중)

---

## 1. 한 줄 요약

데이터 섹션의 표를 *읽기용*에서 *편집용*으로 확장. `viewMode = "table" | "sheet"` 토글로 표/시트 전환. 셀 인라인 편집 + 키보드 네비게이션 + 복붙 지원.

## 2. 배경 / 왜 지금?

- **사용자 약속과 직결**: 솔로 창업자/PM 페르소나의 *5분 안에 정리* — 시트 없으면 거짓말 (200→300 응대 멘트 키울 때 표 편집 불가하면 outlook→Excel→Notion 회귀)
- **현재 데이터 섹션 표는 read-only**: 정렬·검색 가능, 편집 ❌ (`components/sections/data-section.tsx:229–350` `Cell` 컴포넌트 클릭 핸들러 없음)
- **합의된 디스플레이 자동 추천 원칙** ([docs/MEMORY.md #5](../../MEMORY.md#key-design-decisions)) — "모든 테이블 = 표(읽기) + **시트(편집)**". 즉 *시트는 조건 없이 모든 테이블에 활성화*

## 3. 목표 (Definition of Done)

| 항목 | 측정 기준 |
|---|---|
| **셀 인라인 편집** | 셀 클릭 → input/select 활성화 → Enter/blur로 commit. uuid/pk는 read-only |
| **키보드 네비** | Tab/Shift+Tab/Enter/Esc/Arrow로 셀 이동, Enter로 편집 시작/commit + 아래 행 이동 |
| **복붙** | Ctrl+C로 선택 범위 TSV 직렬화, Ctrl+V로 클립보드 TSV 파싱 후 채우기 |
| **viewMode 토글** | Toolbar에 "표 / 시트" 토글 (모든 테이블에 활성. 향후 칸반/타임라인 추가 가능 구조) |
| **상태 보존** | 정렬/검색 결과는 viewMode 전환 시 그대로 유지 |
| **Status 색 매핑 보존** | 미처리=blue 등 LOCK 상수 ([CLAUDE.md](../../../CLAUDE.md)) 그대로 |
| **minimalist-skill 트라이얼** | SheetCell 신규 컴포넌트에 minimalist-skill 가드 매트릭스 적용. 1주 평가 후 본격 도입 결정 |

## 4. 비목표 (Out of Scope)

- ❌ **칸반/타임라인/갤러리/차트** 추가 (별 기능, 별 PR. 단 *확장 가능 구조* 만들기는 OK)
- ❌ **FK 셀 편집기** (팝오버 선택기는 별 PR. 시트 뷰에서는 read-only로 처리)
- ❌ **다중 셀 동시 편집 / 매크로** (현재 단일 셀만)
- ❌ **백엔드 sync** (mock 데이터 useState 승격까지만. BaaS 결정 대기)
- ❌ **virtualization** (현재 mock max 13행, 실 데이터 연결 시 별 PR)
- ❌ **Undo/Redo** (현재 30일 rollback은 import flow의 백스톱이지 시트 셀 단위 ❌)

## 5. 영향 범위

| 파일 | 변경 종류 |
|---|---|
| `components/sections/data-section.tsx` | 수정 (viewMode state, Toolbar 토글, tbody 분기, TABLE_DATA → useState) |
| `components/sections/sheet/SheetCell.tsx` | **신규** |
| `components/sections/sheet/useSheetKeyboardNav.ts` | **신규** |
| `components/sections/sheet/useSheetClipboard.ts` | **신규** (옵션 — 우선 키보드 네비만 머지하고 복붙은 후속 PR도 OK) |
| `lib/view-utils.ts` | **신규** — `getAvailableViews(fields)` (디스플레이 자동 추천 확장 대비) |
| `lib/mock-data.ts` | 변경 ❌ (TABLE_DATA는 export 그대로 유지, data-section에서 useState로 복사) |
| `docs/MEMORY.md` | Decision #5 디스플레이 자동 추천 원칙 *spec*에 박기 (Note 추가) |

## 6. 위험 / 가정 / 결정 대기

| 위험 | 완화 |
|---|---|
| 시트 편집 → mock 데이터 lost on refresh | 본 PR 범위는 *세션 내 편집*만. localStorage persist는 후속 PR. 명시 *Watch Out* 박음 |
| 키보드 네비가 브라우저 기본(테이블 Tab) 동작과 충돌 | wrapper div에 `tabIndex={0}` + `preventDefault` 명시 |
| 복붙이 OS별 줄바꿈 차이로 깨짐 | `\r\n` / `\n` 둘 다 split. TSV는 columns 간 `\t` |
| minimalist-skill 가드가 SheetCell 편집 input에 *왜곡 시각효과* 야기 | DESIGN_VARIANCE 1-2 lock, 입력기 `border` 토큰 사용 (inline hex ❌) |
| `viewMode` 추가가 기존 정렬·검색 흐름 깨뜨림 | rows useMemo는 데이터 변환 레이어. 렌더 레이어만 분기 (정렬·검색은 그대로) |

**결정 대기**:
- (없음 — 모두 design 단계에서 명세 결정)

## 7. 마일스톤 / Increment

```
M1. viewMode 토글 + 시트 read-only (편집 ❌, 표 vs 시트 시각 차이만)
    └ 1 commit. 영향 작음. 토글 UX 검증

M2. SheetCell 인라인 편집 (string/number/email/phone/text)
    └ 2-3 commits. select/status는 M3에서

M3. SheetCell select/status 편집 + Field.enum 옵션
    └ 1-2 commits

M4. useSheetKeyboardNav (Tab/Enter/Arrow/Esc)
    └ 2 commits. 별 hook 분리

M5. useSheetClipboard (Ctrl+C/V) [옵션, 후속 PR도 OK]
    └ 1-2 commits

PR → main 머지 (M5는 후속 PR 가능)
```

## 8. 다음 행동

→ [sheet-view.design.md](../../02-design/features/sheet-view.design.md) 작성. 컴포넌트 props/state/이벤트 명세, 셀 타입 매트릭스, 키보드 매트릭스, minimalist-skill 가드 적용.
