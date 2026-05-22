# FlowBase V2 — Library 서브시스템 설계 (Phase B)

> 액티비티 바 6모드 중 **Library**. 현재 "준비 중" 스텁(`coming-soon-mode.tsx`).
> 출처: `design-ref/prototype/library-view.jsx` (1,915줄) · `library-data.jsx`.
> 선행: Phase A (6모드 셸 라우터) — 완료 (`daad859`).

---

## 0. 목표

**"정의는 한 번, 사용은 어디서나."** 옵션·필드·템플릿·함수·대시보드를 워크스페이스 레벨 자산으로 정의하고 모든 보드에서 재사용한다. Library는 Tables(데이터)와 분리된, 보드의 *구조*를 공급하는 레이어다.

---

## 1. 데이터 모델 — `types/flowbase.ts` 확장

5 카테고리. 프로토타입 `LIBRARY` 레지스트리를 TS로 포팅.

```ts
export type LibraryCategoryId =
  | "optionLists" | "fields" | "templates" | "functions" | "dashboards"

// 1) Option Lists — 공유 옵션 집합
export interface OptionItem { id: string; label: string; color: string }
export interface OptionList {
  id: string; name: string; desc?: string
  usedIn: string[]            // "Board.Column" 표기
  options: OptionItem[]
}

// 2) Fields — 리치 컬럼 정의
export interface FieldConfig {
  required?: boolean; default?: string; format?: string
  validation?: string; multiline?: boolean
  optionListId?: string       // select — Option List 참조
  options?: OptionItem[]      // status — 인라인 옵션
}
export interface LibraryField {
  id: string; name: string; type: ColumnType; desc?: string
  usedIn: string[]; config: FieldConfig
}

// 3) Templates — Field 묶음 + 권장 뷰
export interface LibraryTemplate {
  id: string; name: string; desc?: string; icon?: string; usedIn: string[]
  fields?: string[]                                         // LibraryField id
  extraFields?: { name: string; type: ColumnType; config?: FieldConfig }[]
  recommendedViews?: ViewMode[]; defaultGroupBy?: string
  multiTable?: boolean                                      // 멀티 테이블 도메인
  tables?: { key: string; label: string; colorVar?: string; columns: ColumnDef[] }[]
}

// 4) Functions — 재사용 스마트 함수 (정의만 — 실행 엔진은 B4)
export interface LibraryFunctionParam {
  name: string
  type: "column" | "optionList" | "enum" | "text" | "regex"
  desc: string; options?: string[]
}
export interface LibraryFunction {
  id: string; name: string; label: string; icon?: string; desc?: string
  usedIn: string[]; params: LibraryFunctionParam[]; example?: string
}

// 5) Dashboards — 차트 레이아웃 (signature·charts 상세 타입은 B4에서)
export interface LibraryDashboard {
  id: string; name: string; desc?: string; icon?: string; usedIn: string[]
  signature: { required: unknown[]; preferred: unknown[] }  // B4에서 정밀화
  slots: Record<string, unknown>
  charts: { type: string; title: string; width: string }[] // 표시용 최소 shape
}

export interface Library {
  optionLists: OptionList[]
  fields: LibraryField[]
  templates: LibraryTemplate[]
  functions: LibraryFunction[]
  dashboards: LibraryDashboard[]
}
```

`LIBRARY_CATEGORIES` 메타(`{ id, label, desc }`)는 `lib/flowbase-library-seed.ts`에 상수로.

---

## 2. 스토어 — `lib/flowbase-store.ts`

- **새 상태** `library: Library` (persist) — 시드는 `lib/flowbase-library-seed.ts`.
- **Library UI 상태** (persist): `libCategory: LibraryCategoryId` · `libAssetId: string | null` · `libView: "cards" | "sheet"`.
- **액션**: `setLibCategory` · `setLibAsset` · `setLibView` (B1). 편집 액션(`renameAsset`·`addOption`…)은 B3.
- `partialize`에 `library` · `libCategory` · `libAssetId` · `libView` 추가.
- 새 필드 추가뿐 → STORE_VERSION 유지 (additive, 기본값으로 merge — Phase A `activityMode`와 동일).

---

## 3. 컴포넌트 — `components/library/`

```
library-mode.tsx       — Library 모드 셸 [사이드바 | 메인]
library-sidebar.tsx    — 5 카테고리 트리 + 자산 목록 + 검색
category-catalog.tsx   — 선택 카테고리의 자산 카드 그리드
asset-detail.tsx       — 자산 디테일, 카테고리별 분기  (B2)
```

`app/page.tsx`의 `activityMode === "library"` → `<LibraryMode />` (`ComingSoonMode` 교체).

---

## 4. 서브 단계

| 단계 | 범위 |
|---|---|
| **B1** | 데이터 모델 + 시드 + Library 모드(사이드바+카탈로그). **읽기 전용 브라우즈** |
| **B2** | 자산 디테일 뷰 — 카테고리별 (옵션 목록·field config·template 필드·function params·dashboard 차트 메타) |
| **B3** | 인라인 편집 — rename·desc·옵션 추가/삭제/색상·config. undo 연동 |
| **B4** | 테이블 연동 — 컬럼↔자산 링크 · "Use in table" · 템플릿으로 보드 생성 · 컬럼→Library 승격 |

---

## 5. B1 상세 (다음 작업)

1. `types/flowbase.ts` — §1 타입 추가.
2. `lib/flowbase-library-seed.ts` — `LIBRARY_CATEGORIES` + `createSeedLibrary()` (프로토타입 `library-data.jsx` 포팅, CS팀 한국어 도메인 유지).
3. `lib/flowbase-store.ts` — `library` 상태 + `libCategory/libAssetId/libView` + B1 액션 + partialize.
4. `components/library/library-sidebar.tsx` — 5 카테고리 트리. 카테고리 클릭 → `setLibCategory`. 자산 행 표시.
5. `components/library/category-catalog.tsx` — 선택 카테고리 자산 카드 그리드. 카테고리별 미니 프리뷰(옵션 칩·field type·template 필드 수 등).
6. `components/library/library-mode.tsx` — `[library-sidebar | category-catalog]` 조립.
7. `app/page.tsx` — library 모드 → `<LibraryMode />`.
8. 검증 — tsc · build · vitest · 브라우저.

B1 완료 시: 액티비티 바 Library 클릭 → 5 카테고리 트리 + 자산 카탈로그를 둘러볼 수 있다. 편집/연동은 아직 ❌.

---

## 6. 결정

- **D1** — Library state는 store의 별도 slice. `boards`와 동급 워크스페이스 데이터.
- **D2** — B1은 읽기 전용. 카드 클릭 디테일은 B2, 편집은 B3.
- **D3** — 시드는 프로토타입 `library-data.jsx`를 포팅 (CS팀 한국어 도메인 — 모델명·처리방식·사업부 등 유지).
- **D4** — Dashboard의 signature 매칭 → 차트 생성 시스템은 B4+. B1~B3은 dashboard를 "차트 N개" 메타로만 표시 (`charts`/`signature`는 loose 타입).
- **D5** — Function 실행 엔진(MATCH/EXTRACT/AI_CLASSIFY)은 B4. B1~B3은 정의 표시만.
- **D6** — 멀티테이블 템플릿은 B1~B3 표시만, 보드 생성은 B4.
- **D7** — 아이콘: 카테고리/자산은 `lucide-react` (status/priority만 Phosphor — CLAUDE.md LOCK). 프로토타입의 이모지(📦🎯…)는 lucide 아이콘으로 교체.

---

## 7. 검증

각 서브단계 종료 시 `tsc` · `build` · `vitest` green + preview 브라우저 확인.
