# FlowBase 데이터 보드 — 프로덕션화 핸드오프

> 이 폴더는 **설계 레퍼런스**입니다.
> 안에 들어 있는 HTML/JSX 파일은 그대로 배포하는 코드가 아니라 *어떻게 동작해야 하는지* 보여주는 프로토타입이에요.
> 작업 대상은 **기존 Next.js 16 + shadcn/ui 코드베이스** (`peterkwon248/FlowBase`).

---

## TL;DR — Claude Code가 해야 할 일

**모든 버튼을 새로 컴포넌트로 만들 필요 없습니다.** 다음 순서로:

1. **이 핸드오프 5개 문서를 먼저 다 읽어주세요.** (README + COMPONENT-MAP + AI-CONTRACTS + IMPORT-SPEC + STATE-SHAPES)
2. `prototype/FlowBase.html`을 브라우저로 열어 **실제 동작 확인** (셀 편집, AI Apply, Import, Undo, Kanban, Dashboard).
3. `COMPONENT-MAP.md`에서 **이미 존재하는 shadcn 컴포넌트와 새로 만들 컴포넌트** 구분.
4. `docs/01-plan/features/flowbase-app.plan.md`로 **PDCA Plan** 작성 (기존 워크플로우).
5. Phase별 PR — `09-phased-rollout` 참고.

---

## Fidelity

**High-fidelity 프로토타입.** 색상·간격·인터랙션·키보드 단축키·AI 호출 모양까지 픽셀 단위로 결정되어 있습니다.
다만 **시각 토큰은 FlowBase의 기존 `app/globals.css`를 따르세요** (이 프로토타입 `tokens.css`는 거기서 추출한 사본). LOCK 규칙(`CLAUDE.md`)을 어기지 마세요.

- Status 색 (미처리=blue · 진행중=amber · 대기=violet · 완료=emerald) **변경 ❌**
- Phosphor (status/priority) + lucide-react (그 외) **변경 ❌**
- Geist Sans / Mono **변경 ❌**

---

## 작업 대상 코드베이스 매핑

| 프로토타입 영역 | 기존 Next.js 위치 | 비고 |
|---|---|---|
| Activity bar (44px 왼쪽 rail) | `components/app-sidebar.tsx` 위쪽 일부 | 분리해서 별도 컴포넌트로 |
| Sidebar (보드 리스트) | `components/app-sidebar.tsx` | Boards 목록 + import 트리거 |
| Header + 검색 + 햄버거 메뉴 | 신규 `components/board-header.tsx` | shadcn Command + DropdownMenu 조합 |
| 햄버거 패널 메뉴 | 신규 `components/panels-menu.tsx` | shadcn DropdownMenu |
| View switcher (Sheet/Kanban/Dashboard/Schema) | 신규 `components/view-switcher.tsx` | shadcn Tabs *또는* ToggleGroup |
| 필터 chips | `components/sections/operations-section.tsx`의 status pill 재활용 | LOCK 색 유지 |
| Sheet 뷰 (편집 가능) | 신규 `components/sections/sheet-view.tsx` | `feat/sheet-view` 브랜치에 작업 — 이미 분기됨 |
| 셀별 편집 (status/priority/sentiment/theme) | 신규 `components/sheet/editable-cell.tsx` | shadcn Popover + Command |
| AI Activity 패널 | 신규 `components/ai-activity-panel.tsx` | shadcn ScrollArea + Card |
| AI pending 마커 | 신규 `components/sheet/ai-pending-mark.tsx` | dotted-underline + 보라 점 |
| Kanban 뷰 | 신규 `components/sections/kanban-view.tsx` | shadcn Card |
| Dashboard 뷰 (KPI + 차트들) | 신규 `components/sections/dashboard-view.tsx` | `recharts` 또는 SVG 그대로 |
| Schema 뷰 | 기존 `design-section.tsx`에서 일부 재활용 | DBML 출력 기능과 통합 |
| Import 모달 | 신규 `components/import/import-dialog.tsx` | shadcn Dialog + 3-step Wizard |
| Toast | 기존 `sonner` (PR #4에 추가됨) | 그대로 사용 |
| Panel toggle (3 패널 + Hide all) | 신규 `components/panels-state.ts` (zustand 또는 useState) | localStorage persist |

---

## 들어 있는 파일들

```
design_handoff_flowbase_app/
├── README.md                   ← 이 파일
├── COMPONENT-MAP.md            ← 프로토타입 컴포넌트 ↔ shadcn 매핑 + 새로 만들 것 리스트
├── AI-CONTRACTS.md             ← Claude API 프롬프트 + 응답 파싱 + 에러 처리
├── IMPORT-SPEC.md              ← CSV/MD/Sheets paste → 파싱 → 미리보기 → 커밋 흐름
├── STATE-SHAPES.md             ← 모든 데이터 shape + localStorage → BaaS 마이그레이션
├── 09-phased-rollout.md        ← PDCA 친화 단계별 작업 묶음
└── prototype/                  ← HTML 프로토타입 원본 (참고용)
    ├── FlowBase.html
    ├── tokens.css
    ├── components.jsx
    ├── sheet.jsx
    ├── prototype.jsx
    ├── prototype-shell.jsx
    ├── chart-dashboard.jsx
    ├── import-modal.jsx
    └── prototype-app.jsx
```

---

## 핵심 디자인 결정 (옮길 때 보존해야 할 것)

1. **AI 추천 + 사람 확정** — AI가 채운 셀은 항상 *pending* 상태로 들어오고 보라 점/점선 underline 마커. 자동 적용 ❌. spec §0의 합의.
2. **3 패널 toggle** — Activity bar / Sidebar / AI panel 각각 키보드 단축키 (⌘⇧A / ⌘⇧F / ⌘B) + Show all / Hide all.
3. **Undo가 신뢰의 백스톱** — 모든 row 변경에 stack push. ⌘Z / ⌘⇧Z. 30 step.
4. **Local-first 우선** — 일단 localStorage로 동작. BaaS는 phase 3에서 결정 (`docs/01-baas-decision.md`).
5. **로딩 상태가 솔직해야** — AI 호출은 보통 1-3초. Toast로 "AI is reading N quotes…" 표시. 추측하지 말고 알려주기.

---

## 작업 시 참고 순서 (CLAUDE.md 따름)

1. 이 README → 5개 핸드오프 문서 → `prototype/FlowBase.html` 실행
2. `docs/MEMORY.md` (LOCK 결정들)
3. `lib/tokens.ts` + `DESIGN-TOKENS.md`
4. PDCA로 feature plan 작성

기존 워크트리 함정 (`Plot/`) 조심 — FlowBase와 무관.

---

## 질문이 생기면

- 디자인 의도 의문 → `prototype/FlowBase.html` 직접 만져보면 답 나옴 (전부 클릭 가능)
- LOCK 충돌 → `CLAUDE.md`의 LOCK 상수가 항상 우선
- AI 응답 형식 → `AI-CONTRACTS.md`에 정확한 JSON shape 박혀 있음
- Import 흐름 분기 → `IMPORT-SPEC.md` 디시전 트리 참고
