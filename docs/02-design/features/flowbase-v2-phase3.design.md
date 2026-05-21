# FlowBase V2 — Phase 3 (Import 모달) Design

> 작성: 2026-05-21 · Phase: PDCA Design
> Plan: [flowbase-v2.plan.md §8 Phase 3](../../01-plan/features/flowbase-v2.plan.md)
> 정본: `design-ref/handoff/{IMPORT-SPEC,AI-CONTRACTS,COMPONENT-MAP}.md` + `prototype/import-modal.jsx`
> 선행: Phase 1B(시트)·Phase 2(AI 패널) 완료 (`feat/sheet-view-v2`)
> 🚦 **구현 전 검토 게이트 대상** — §13 결정/Q 확인 후 코드 착수.

## 0. 배경

붙여넣은 텍스트(CSV/TSV/Markdown 표)나 파일을 3-step 위저드로 받아 **새 보드**를 만든다. "AI가 초안 → 사람이 확정" 모델을 import 단계로 확장 — Step 3에서 theme/sentiment AI 컬럼을 추천하되 자동 적용 ❌.

## 1. 범위

**In**
- ✅ 3-step Import 위저드 — Paste → Review → AI columns
- ✅ 서버 라우트 `app/api/ai/analyze-import` (데이터 요약 + AI 컬럼 추천)
- ✅ `components/import/*` — import-dialog · step-paste · step-review · step-ai
- ✅ 커밋 매퍼 — 파싱 데이터 → **제네릭 보드**(`Board` + `ColumnDef[]` + generic rows)
- ✅ 파일 드롭 (.csv/.tsv) — `<input type="file">` + `FileReader` (Q3)
- ✅ 보드 페이지 헤더에 "Import" 버튼
- ✅ `app/txt-poc` + `lib/parsers/txt-block-parser.ts` 제거 (plan §8)

**Out (후속)**
- ❌ 파일→**기존 보드** append (컬럼 매핑 UI 필요 — 별도 Phase, D1)
- ❌ 진짜 Google Sheets URL/OAuth import (IMPORT-SPEC §6 — Phase 8)
- ❌ 멀티 보드 사이드바/전환 UI (Phase 6 — Q2)
- ❌ PDF/JSON/Excel 바이너리 파싱

## 2. 데이터 모델 결정 — 제네릭 보드 (D1)

프로토타입 `import-modal.jsx` `commit()`은 행을 **고정 인터뷰 필드**(`name/company/date/theme/sentiment/status/priority/quote`)로 휴리스틱 매핑한다. 이는 Phase 1에서 폐기된 고정 `TableRow` 모델 기준 — IMPORT-SPEC §3 `mapImportedRow`도 동일.

**V2는 제네릭 컬럼 구동** (Phase 1 design D4). 따라서 Phase 3 import는:
- Step 2 "Review columns"가 정의한 `ColumnDef[]`를 그대로 **새 보드의 columns**로 사용.
- 행은 generic — `{ id, [col.name]: cellValue }`. 고정 필드 휴리스틱 매핑 ❌.
- `status`/`priority` **type 컬럼에 한해** KO/EN 정규화(IMPORT-SPEC §3 `mapStatus`/`mapPriority`)를 적용 (D3).

## 3. 파서 — `lib/parsers.ts` (이미 완료)

Phase 1A에서 작성 완료 — `parseDelimited` · `parseMarkdownTable` · `detectFormat` · `parseAny` · `inferType` · `normalizeHeader`. Phase 3는 **그대로 사용, 신규 파서 ❌**.

- ⚠️ **중복 헤더**: `normalizeHeader`는 단일 헤더만 정규화 — dedup ❌. 컬럼 빌드 단계에서 중복 시 `_2` suffix 부여 (IMPORT-SPEC §5).
- `inferType`은 status를 추론하지 않음 — Review 단계에서 수동 지정.

## 4. 3-step 위저드 흐름

상태는 `import-dialog.tsx` 로컬 — `step · raw · parsed · headerRow · columns · aiColumns · aiSummary`. 닫으면 초기화.

### Step 1 — Paste
- `<textarea>` (mono) + "Use sample"(`SAMPLE_CSV`). `.csv/.tsv` 파일 드롭 → `FileReader` → textarea.
- 입력 시 `parseAny` → 포맷·행수·컬럼수 즉시 표시. 빈 입력 → Continue 비활성.

### Step 2 — Review
- "First row is header" 체크 토글 → 헤더/데이터 행 재계산.
- 컬럼별: 라벨 inline 편집(`<input>`), type `<select>`(text/num/date/email/select/status), 타입 아이콘.
- 8행 미리보기 테이블.

### Step 3 — AI columns
- Step 2→3 진입 시 `/api/ai/analyze-import` 호출 (버튼 spinner).
- AI summary + Theme/Sentiment 추천 카드(체크 토글). `suggestTheme`/`suggestSentiment` → Recommended 배지.
- 안내: "자동 적용 ❌ — AI 컬럼은 pending으로 추가, 보드에서 확정."
- analyze-import 실패 시: 카드는 수동 토글 가능, summary 자리에 에러 안내 (IMPORT-SPEC §5).

## 5. 서버 — `app/api/ai/analyze-import`

- `_anthropic.ts`에 **`parseJsonObject`** 추가 (Phase 2는 array만 작성).
- `POST` — Req `{ headers: string[], sampleRows: string[][] }`. 프롬프트 = AI-CONTRACTS §2.
- Res `{ summary, suggestTheme, suggestSentiment, rowKind }`. 파싱 실패/키 부재 → `aiErrorResponse`(Phase 2 재사용).
- `runtime = "nodejs"`.
- `lib/flowbase-ai.ts`에 `analyzeImport(headers, sampleRows)` 추가 — `callAI` + throttle("analyze-import").

## 6. 커밋 — 매퍼 + 스토어

"Import N rows" 클릭 시:
1. 데이터 행 → generic `TableRow[]` — `id`는 `idPrefix`+카운터(`ROW-001`…), 각 `col.name`에 셀 값. status/priority type 컬럼은 정규화.
2. 컬럼 = Step 2 `ColumnDef[]` + (id 컬럼) + (AI 켜짐 시 theme/sentiment `ColumnDef{ai:true}`).
3. AI 컬럼 켜짐 → 해당 행 `themeConfirmed`/`sentimentConfirmed` = `false` (pending).
4. **스토어**: `createBoard`를 `(label, columns?, rows?)`로 확장 — import는 보드 1개를 행과 함께 생성 (per-row undo ❌, D4). 생성 후 `switchBoard`.
5. import 직후 Claude 자동 호출 ❌ (D2) — AI 패널 pending 카드로 사용자가 트리거.

## 7. 컴포넌트 — `components/import/`

shadcn `Dialog` 조립 (COMPONENT-MAP §1).

| 파일 | 역할 |
|---|---|
| `import-dialog.tsx` | `Dialog` + 3-step 상태머신 + 푸터(Back/Continue/Analyze/Import) |
| `import-step-paste.tsx` | textarea + 파일 드롭 + 포맷 감지 안내 |
| `import-step-review.tsx` | 컬럼 라벨/타입 편집 + 8행 미리보기 |
| `import-step-ai.tsx` | AI summary + Theme/Sentiment 추천 카드 |

가드: `framer-motion` ❌, 토큰만, Phosphor/lucide, dense. 로딩 spinner는 `animate-spin`(CSS, 허용).

## 8. 진입점

`app/page.tsx` 헤더에 "Import" 버튼 추가 → `import-dialog` open. CLAUDE.md "3 진입점" 중 **파일→새 보드**가 Phase 3 범위 (빈 새 테이블·파일→기존은 후속).

## 9. 에러 / 엣지 (IMPORT-SPEC §5)

| 상황 | 처리 |
|---|---|
| paste 비어있음 | Continue 비활성 |
| 컬럼 0 / 인식 실패 | "데이터를 인식하지 못했습니다 — CSV/TSV/Markdown 형식 확인" |
| 1행짜리 | header OFF로 fallback, `col_N` 자동 이름 |
| 1000행 초과 | 경고 toast "대용량 import — 잠시 걸릴 수 있음" |
| 중복 헤더 | `_2` suffix |
| analyze-import 실패 | Step 3 진입은 가능, AI 카드 수동 토글, 에러 안내 |
| 콤마 포함 quote값 | `parseDelimited`가 quote 이스케이프 처리 (검증 완료) |

## 10. txt-poc 제거

`app/txt-poc/` 라우트 + `lib/parsers/txt-block-parser.ts`(PR #1 PoC) 삭제. `app/txt-poc`를 참조하는 곳 없음 확인 후 제거. `MEMORY.md` PR #1 기록은 history라 보존.

## 11. LOCK·가드

- 데이터 모델 = 제네릭 (D1). status enum 한국어, 색은 `statusColorClass`/`statusBgClass`.
- AI 추천 + 사람 확정 — import 후 AI 컬럼은 pending, 자동 호출 ❌ (D2).
- Phosphor/lucide · Geist · minimalist dense · framer-motion ❌.

## 12. 마일스톤

- **3A — 파서 검증 + 서버**: `lib/parsers.ts` vitest(픽스처: `SAMPLE_CSV`/TSV/MD/깨진 입력) · `analyze-import` 라우트 + `parseJsonObject` · `flowbase-ai` `analyzeImport`.
- **3B — 위저드 + 커밋**: `components/import/*` · `createBoard` 확장 · 헤더 Import 버튼 · txt-poc 제거. paste→감지→미리보기→AI→Import 검증.

## 13. 결정 기록 / 미결 질문

| # | 결정 |
|---|---|
| D1 | Import = **새 제네릭 보드 생성**. 프로토타입/IMPORT-SPEC §3의 고정필드 휴리스틱 매퍼 폐기 (Phase 1 D4 일관). 파일→기존 보드(컬럼 매핑)는 후속 Phase. |
| D2 | import 직후 Claude 자동 호출 ❌. AI 컬럼은 pending으로만 추가 (IMPORT-SPEC §4 권장 = 자동 OFF). |
| D3 | status/priority KO/EN 정규화는 해당 `type` 컬럼에만 적용 (generic이므로 필드명 휴리스틱 ❌). |
| D4 | `createBoard(label, columns?, rows?)`로 확장 — import는 행과 함께 보드 1개 생성, per-row undo 스냅샷 ❌. import 되돌리기 = 보드 삭제. |
| D5 | 파서는 `lib/parsers.ts`(Phase 1A) 그대로 — 신규 파서 ❌. 중복 헤더 dedup만 컬럼 빌드 단계 추가. |
| **Q1** | infer-batch 라우트가 `row.quote`를 하드코딩 — 임포트 보드에 `quote` 컬럼이 없으면 AI 추론 입력이 없음. 권장: **Phase 3 MVP는 AI 컬럼(Step 3)을 보드에 추가만 하고, 실제 infer 입력 일반화(소스 텍스트 컬럼 지정 + infer-batch `sourceField` 인자)는 후속.** analyze-import가 `quote`류 컬럼을 못 찾으면 Theme/Sentiment 추천을 false로. **사용자 확인 필요.** |
| **Q2** | Phase 3 후 새 보드로 `switchBoard`하면 Phase 6(멀티 보드 UI) 전까지 시드 보드로 돌아갈 수단이 없음. (a) 그대로 두고 Phase 6 대기 / (b) 헤더에 최소 보드 드롭다운 추가. 권장: **(a)** — Phase 3 범위 유지. |
| **Q3** | 파일 드롭(.csv/.tsv)을 Phase 3에 포함할지. 권장: **포함** — `<input type="file">` + `FileReader`로 작음 (IMPORT-SPEC §5). |

## 14. 다음 행동

1. 🚦 **검토 게이트** — 본 문서 + §13(특히 Q1·Q2) 사용자 검토.
2. Phase 3A — parsers 테스트 → `analyze-import` 라우트 → 어댑터.
3. Phase 3B — `components/import/*` → `createBoard` 확장 → Import 버튼 → txt-poc 제거.
