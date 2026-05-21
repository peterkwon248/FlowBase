# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-05-21 (집)

---

## 한 줄 요약

**FlowBase V2 재구축 착수 — Phase 1A(기반) 완료. 다음: Phase 1B(시트 뷰) 구현.**

---

## 현재 상태

### ✅ 완료 (2026-05-21 세션)
- **design-ref/ V2 핸드오프 분석** — 핸드오프 6문서 + 프로토타입(40여 jsx) 정독
- **V2 7단계 재구축 계획** — [docs/01-plan/features/flowbase-v2.plan.md](docs/01-plan/features/flowbase-v2.plan.md)
- **Phase 1 design** — [docs/02-design/features/flowbase-v2-phase1.design.md](docs/02-design/features/flowbase-v2-phase1.design.md)
- **Phase 1A 기반 구현 완료** — `feat/flowbase-v2` 브랜치 → after-work로 main 머지:
  - `types/flowbase.ts` — V2 제네릭 데이터 모델 (`Board`/`TableRow`/`ColumnDef`, 10 ColumnType)
  - `lib/flowbase-store.ts` — zustand 스토어 + localStorage persist (`flowbase-state-v4`)
  - `lib/flowbase-seed.ts` — Customer Interviews 시드 보드 (11컬럼·10행)
  - `lib/undo-stack.ts` · `lib/parsers.ts` · `lib/keyboard-shortcuts.ts`
  - `components/sheet/ai-pending-mark.tsx` (Phase 1B 첫 컴포넌트)

### ⬜ 다음
- **Phase 1B (시트 뷰)** — 아래 "다음 행동"

---

## 다음 행동 — Phase 1B (시트 뷰)

main에서 새 브랜치 분기 (`feat/flowbase-v2`는 머지 후 삭제됨). [design 문서 §6~9](docs/02-design/features/flowbase-v2-phase1.design.md) 참조.

1. **셀 편집기** — `components/sheet/cell-popover.tsx` + `editable-cell.tsx`
   - 7종 타입 분기: text · avatar · date · select · status · reaction · button
   - **첫 스텝**: `design-ref/prototype/prototype.jsx`의 `CellEditor` + `cell-types.jsx`를 셀별로 재확인하며 작성
2. **시트 구조** — `header-cell.tsx` · `new-row-stub.tsx` · `sheet-view.tsx`
3. **M1~M5 hook 이식** — `useSheetKeyboardNav` · `useSheetClipboard` (`components/sections/sheet/` → `components/sheet/`, `Field`→`ColumnDef` 어댑트)
4. **보드 페이지** — `app/page.tsx`를 최소 V2 보드 페이지로 교체

---

## 잊지 말 것 (이번 세션 핵심 결정)

1. **V2 = 프로토타입 제네릭 컬럼 구동 모델.** 핸드오프 STATE-SHAPES는 *단순화판* — 실제 V2는 `tablesById`·generic row·10 cell type. 데이터 모델 정본 = [types/flowbase.ts](types/flowbase.ts).
2. **레퍼런스(프로토타입)는 구현 전 끝까지 정독.** 일부만 읽고 진행하다 Phase 1A를 재작업함 (커밋 `360de73` → `bc8f263`).
3. **`dismissAiCell` = 값 유지** + confirmed=true (프로토타입 `onDismissAi`). 기본값 리셋 ❌.
4. **clean rebuild** — 기존 3섹션 UI(설계·데이터·운영)는 V2 보드 UI로 대체. `feat/sheet-view`의 M1~M5는 *패턴 이식*만, 기능으로 살리지 않음.
5. **theme은 next-themes 소유** — V2 스토어 제외.
6. **범위** — 프로토타입엔 Library/Wiki/Inbox/Search/Automations 등 핸드오프 7단계 밖 서브시스템이 큼. 7단계를 MVP로, 전체 범위는 MVP 후 재논의.

---

## 현재 Phase 진행 상황 (V2)

- [x] **Phase 1A — 기반** (데이터 모델·스토어·undo·parsers·키보드)
- [ ] **Phase 1B — 시트 뷰** ← 다음
- [ ] Phase 2 — AI 패널 + Claude
- [ ] Phase 3 — Import 모달
- [ ] Phase 4 — Kanban + Dashboard
- [ ] Phase 5 — 앱 셸 + 단축키
- [ ] Phase 6 — 멀티 보드 + Schema
- [ ] Phase 7 — BaaS

---

## 보류 중인 항목

- **BaaS 결정** (Supabase vs bkend.ai) — Phase 7 블로커. `docs/01-baas-decision.md`. Phase 1~6은 localStorage라 무관.
- **`ANTHROPIC_API_KEY`** — Phase 2 착수 전 `.env.local` 필요.
- **`pnpm-lock.yaml` 정리** — 실제 PM은 npm. `pnpm-lock.yaml`은 stale — 삭제 권장 (별건).
- **옛 섹션 파일 정리** — `design-section`/`operations-section`/`trash`/`workspaces` + 라우트는 V2가 해당 뷰를 대체하는 Phase(4·6)에서 단계적 삭제.
- **`after-work`로 main 머지된 상태** — 미완성 Phase 1 + M1~M5 + design-ref가 main에 있음. Phase 1B는 그 위에서 이어감.

---

## 환경 정보

| | |
|---|---|
| 코드 위치 | `C:\Users\kwonkyunghun\Desktop\flowdb-port` |
| GitHub | https://github.com/peterkwon248/FlowBase (private) |
| 미리보기 | http://localhost:3000 (`npm run dev`) |
| 패키지 매니저 | **npm** (`pnpm-lock.yaml`은 stale) |

---

## 머신

집
