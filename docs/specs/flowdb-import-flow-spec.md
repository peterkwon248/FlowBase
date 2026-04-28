# FlowDB Import Flow — Implementation Spec

> **상태**: Draft v0.1 (2026-04-28)
> **위상**: Phase 1 핵심 기능. 본 도구의 *AI 초안 + 사람 확정* 약속이 실현되는 첫 사용자 접점.

---

## 0. 절대 원칙

1. **AI 추천은 항상 카드 형태로 분리.** 자동 적용 ❌. 본 제품의 핵심 신뢰 모델.
2. **모든 결정은 되돌릴 수 있어야** — 컬럼 타입 잘못 바꿔도 한 번에 원복.
3. **미리보기는 항상 *현재 설정 기준*으로 즉시 갱신** — 변경이 시각적으로 보이지 않으면 그건 실패.
4. **확정 버튼 누를 때까지 DB는 안 건드림** — 모든 작업이 클라이언트 메모리/임시 객체.
5. **3 단계 어디서든 뒤로 가기 가능.**

---

## 1. 진입점 — 3가지 흐름

```
                ┌─ (a) 빈 새 테이블 ─→ 설계 캔버스로 직접 (기존 동작)
   사용자 클릭 ─┤
   "데이터 추가" └─ (b) 파일 → 새 테이블 ─┐
                                         ├─→ Step 1: 드롭 → Step 1.5: 대상 선택 → Step 2 → Step 3
                  (c) 파일 → 기존 테이블 ─┘
```

### (a) 빈 새 테이블
- "테이블 추가" 다이얼로그 (현재 코드의 `handleAddTable` 그대로 활용)
- **추가 권장**: 시작 템플릿 갤러리 (5종) — 빈 시작이 막막한 사용자 위해
  - 고객 관리 / 할 일 트래커 / 리드 파이프라인 / 재고 / 자유 (빈 테이블)

### (b) 파일 → 새 테이블
- Step 1 → Step 1.5에서 "새 테이블 만들기" 선택 → Step 2 (스키마 추론 모드) → Step 3

### (c) 파일 → 기존 테이블에 추가
- Step 1 → Step 1.5에서 "기존 테이블에 추가" 선택 → Step 2 (컬럼 매핑 모드) → Step 3

---

## 2. Step 1 — 파일 드롭

### 화면 구성
```
┌──────────────────────────────────────────────┐
│                                              │
│        📁  파일을 여기로 끌어 놓으세요      │
│                                              │
│             또는 [ 파일 선택 ]               │
│                                              │
│   지원: .csv .xlsx .xls .tsv (최대 50MB)     │
│                                              │
└──────────────────────────────────────────────┘

[← 뒤로]                              [건너뛰고 빈 테이블 시작 →]
```

### 동작
- 파일 선택 즉시 → 클라이언트 측 파싱 시작 (Web Worker)
- 파싱 진행률 표시 (작은 진행 바)
- 완료되면 자동으로 Step 1.5로

### 라이브러리
- CSV: `papaparse` (검증된 표준)
- Excel: `xlsx` 또는 `exceljs`
- 인코딩 자동 감지: `chardet` 또는 자체 (UTF-8/EUC-KR/CP949 우선)

### Edge cases
- **빈 파일** → "파일이 비어있습니다" 알림, Step 1 잔류
- **인코딩 깨짐** → 자동 감지 후 사용자 확인 다이얼로그 ("EUC-KR로 보입니다, 맞나요? UTF-8로 강제 변환?")
- **>50MB** → 거부 + 안내 ("Phase 2의 청크 업로드를 기다려주세요")
- **>50 컬럼 또는 >100k 행** → 경고만, 진행 가능
- **Excel 다중 시트** → Step 1.5에서 시트 선택 추가

---

## 3. Step 1.5 — 대상 선택

```
┌────────────────────────────────────────────────────────────┐
│  파일을 어디에 import 할까요?                              │
│                                                            │
│  ◉  새 테이블 만들기                                       │
│      이름:  [고객명단_2026                              ]  │ (자동: 파일명 기반)
│      AI가 컬럼 7개와 타입을 추론합니다.                   │
│                                                            │
│  ○  기존 테이블에 추가                                     │
│      대상: [ customers (고객) ▾ ]                          │
│      → Step 2에서 업로드 컬럼을 기존 컬럼에 매핑합니다.   │
│                                                            │
│  [Excel 시트 선택: Sheet1 ▾]  ← .xlsx일 때만 표시         │
│                                                            │
│  [← 뒤로]                                  [다음 →]       │
└────────────────────────────────────────────────────────────┘
```

### 동작
- 라디오 선택에 따라 Step 2 모드 분기:
  - "새 테이블" → **추론 모드** (Step 2 좌측 = 컬럼 인식 카드)
  - "기존 테이블에 추가" → **매핑 모드** (Step 2 좌측 = 매핑 표)

---

## 4. Step 2 — 미리보기 + 편집 (★ 핵심 화면)

### 4.1 추론 모드 (b: 새 테이블)

```
┌─────────────────────────────────────────────────────────────────────┐
│  고객명단_2026.xlsx · Sheet1 · 1,284 rows · 7 columns               │
│  헤더 행: ◉ 1행  ○ 2행  ○ 3행                                     │
├──────────────────────────────────────┬──────────────────────────────┤
│  컬럼 인식 (좌측 패널)                │  미리보기 그리드 (우측)      │
│                                      │                              │
│  ✓ 고객명 (text)         [PK ▢]     │  ┌──────┬────────┬─────────┐ │
│    → name              [편집][제외] │  │ 고객명│ 이메일  │ 전화    │ │
│                                      │  ├──────┼────────┼─────────┤ │
│  ✓ 이메일 (email)                   │  │김민지 │minji@..│010-1234.│ │
│    → email             [편집][제외] │  │이정훈 │jh@.... │010 1234.│ │ ← 셀 클릭 인라인 편집
│                                      │  │박서연 │sy@.... │01012345.│ │
│  ⚠ 전화 (mixed)                     │  │... (17 rows)                │
│    → phone? text?      [편집][제외] │  └──────┴────────┴─────────┘ │
│                                      │                              │
│  ✗ "비고" (66% 빈)                  │                              │
│    [컬럼 제외 ✓]                    │                              │
│                                      │                              │
├──────────────────────────────────────┴──────────────────────────────┤
│  🤖 AI 추천 (3)                                                     │
│  ▸ "tier" 컬럼 = enum 후보 (Free/Pro/Enterprise 3종)  [적용][무시]  │
│  ▸ "id" 컬럼 = unique → PK 지정 추천                  [적용][무시]  │
│  ▸ "customer_id" = customers 테이블 참조 추정         [적용][무시]  │
├─────────────────────────────────────────────────────────────────────┤
│  📊 검증 요약                                                       │
│  ✓ 1,284 행 import 예정                                             │
│  ⚠ 결측 셀: 47 (3.7%) → null 처리                                   │
│  ⚠ 중복 PK 후보: 3개  [확인]                                        │
│  ✓ 형식 정규화: 전화 1,103개 → 010-XXXX-XXXX                        │
├─────────────────────────────────────────────────────────────────────┤
│  [← 뒤로]                              [확정 import (1,284행) →]   │
└─────────────────────────────────────────────────────────────────────┘
```

### 4.2 매핑 모드 (c: 기존 테이블에 추가)

좌측 패널이 **매핑 표**로 바뀜:

```
업로드 컬럼      → 대상 컬럼 (customers)
────────────────────────────────────────
고객명           → [ name ▾          ]
이메일           → [ email ▾         ]
전화             → [ phone ▾         ]
비고             → [ (제외) ▾        ]
tier             → [ tier ▾          ]
created          → [ created_at ▾    ]
                   [ + 새 컬럼 추가  ]  ← 매핑 안 되는 건 옵션으로 신규 컬럼 추가
```

추천 카드는 **매핑 추정**이 됨 ("이 컬럼은 `email` 같은데 매핑할까요?").

---

## 5. Step 2 컴포넌트 분해 (구현용)

```
<ImportPreviewScreen>
├── <ImportHeader>             // 파일명, 행/열 수, 헤더 행 선택
├── <SplitPanel>
│   ├── <ColumnInsightPanel>   // 좌: 추론 모드 카드 OR 매핑 모드 표
│   │   └── <ColumnCard>       // - name, type, exclude, edit
│   └── <PreviewGrid>          // 우: 첫 20행 readonly + 인라인 편집
├── <SuggestionRail>           // AI 추천 카드 스트림
└── <ValidationSummary>        // 하단 요약 (중복, 결측, 정규화 등)
└── <FooterActions>            // [뒤로] / [확정 import]
```

각각의 props/state는 다음 데이터 모델 참조.

---

## 6. 데이터 모델 (클라이언트 메모리 + Phase 2 영구화)

### `ImportJob`
```ts
interface ImportJob {
  id: string                    // uuid
  fileName: string
  fileSize: number
  format: "csv" | "xlsx" | "xls" | "tsv"
  sheetName?: string            // xlsx only
  encoding: "utf-8" | "euc-kr" | "cp949"
  targetMode: "new" | "append"
  newTableName?: string         // for "new"
  newTableColor?: ChartColor    // for "new"
  targetTableId?: string        // for "append"
  rawRowCount: number
  headerRowIndex: number        // 0-based
  status: "previewing" | "validating" | "confirmed" | "failed"
  createdAt: string
  confirmedAt?: string
}
```

### `ImportColumn`
```ts
interface ImportColumn {
  id: string
  jobId: string
  sourceIndex: number           // 0-based
  sourceName: string            // raw header name
  targetName: string            // slugified, user-editable
  inferredType: FieldType
  userOverriddenType?: FieldType
  excluded: boolean
  isPk: boolean
  refTableId?: string           // FK suggestion accepted
  enumValues?: string[]         // when type === "select" or "status"
  nullStrategy: "null" | "default" | "fail"
  defaultValue?: string
  formatNormalize?:
    | "none"
    | "phone-kr"
    | "email-lowercase"
    | "iso-date"
    | "trim-whitespace"
  mapping?: {                   // append mode only
    targetFieldName: string | null  // null = 신규 필드 추가
  }
}
```

### `ImportSuggestion`
```ts
interface ImportSuggestion {
  id: string
  jobId: string
  kind:
    | "type-infer"        // text → email
    | "pk-candidate"      // unique + non-null
    | "fk-candidate"      // values match other table's PK
    | "enum-candidate"    // low cardinality categorical
    | "normalize"         // phone format unification
    | "exclude"           // mostly empty column
    | "duplicate-row"     // identical rows detected
    | "header-row"        // header looks like row 2 not 1
  affectedColumnIds: string[]
  body: string                  // human-readable description
  payload: Record<string, unknown>  // suggestion-specific
  status: "pending" | "accepted" | "dismissed"
  createdAt: string
}
```

### `ImportValidation`
```ts
interface ImportValidation {
  jobId: string
  totalRows: number
  emptyRows: number
  duplicateRows: number
  duplicatePkCandidates: string[]    // affected PK values
  missingCells: number
  normalizedCells: { columnId: string; count: number }[]
  blockingErrors: string[]           // 비어있어야 import 가능
  warnings: string[]
}
```

---

## 7. AI 추천 카탈로그 (Step 2 추천 카드 종류)

| `kind` | 발생 조건 | 카드 본문 예시 | 적용 시 |
|---|---|---|---|
| `type-infer` | sample-based 패턴 매칭 | "이 컬럼은 이메일 같습니다 (95% 일치)" | `inferredType` 변경 |
| `pk-candidate` | 모든 값 unique + null 0 | "id 컬럼이 모두 unique입니다. PK로 지정?" | `isPk = true` |
| `fk-candidate` | 값이 기존 테이블 PK와 매칭 | "customer_id 값이 customers 테이블에 모두 존재" | `refTableId` 설정 |
| `enum-candidate` | 카디널리티 ≤ 10 + 반복 | "tier 컬럼은 3종 값만 → enum?" | type → "select", enumValues 채움 |
| `normalize` | 형식 패턴 분산 | "전화번호 92%가 010-X 패턴 → 통일?" | `formatNormalize` 설정 |
| `exclude` | 빈 비율 >50% | "비고 컬럼 66%가 비어있음. 제외?" | `excluded = true` |
| `duplicate-row` | 동일 행 발견 | "동일 행 12개 → 첫 발견만 유지?" | 중복 제거 정책 적용 |
| `header-row` | 1행이 헤더가 아닌 듯 | "1행이 부서명 같습니다. 2행을 헤더로?" | `headerRowIndex = 1` |

→ 모든 추천은 **추론 단계에서 미리 다 만들어 놓고, UI는 dismiss/accept만** 처리. 즉 추천 생성과 표시 로직 분리.

---

## 8. 인터랙션 케이스 (Step 2)

| 사용자 액션 | 즉시 갱신할 것 |
|---|---|
| 헤더 행 위치 변경 (1→2행) | 좌측 카드 전부 + 우측 미리보기 + 검증 요약 + 추천 재실행 |
| 컬럼 이름 편집 | 해당 카드만 |
| 컬럼 타입 변경 | 해당 카드 + 우측 미리보기 셀 표시 (예: phone → 형식 적용) + 검증 요약 |
| 컬럼 제외 토글 | 카드 + 우측 미리보기 (해당 컬럼 회색) + 검증 요약 (행 수는 동일, 컬럼만 줄어듬) |
| PK 지정 | 카드 + 다른 컬럼의 PK 해제 (한 테이블 1 PK만, 단일 PK 가정) + 검증 요약 |
| 셀 인라인 편집 | 우측 미리보기 (해당 셀) + 검증 요약 (정규화 카운트 변경 가능) |
| 추천 카드 [적용] | 영향 받는 카드 갱신 + 추천 카드 사라짐 (status: accepted) |
| 추천 카드 [무시] | 추천만 사라짐 (status: dismissed) |
| Excel 시트 변경 | Step 1.5로 회귀? 또는 Step 2 내에서 시트 선택자 → 전체 재로드 |

→ 즉시 갱신 = **클라이언트 상태 변경에 따른 React re-render**. DB 호출 0회.

---

## 9. Step 3 — 확정 (실제 DB 쓰기)

### 사용자 동작
"확정 import (1,284행)" 버튼 클릭 → **돌이킬 수 없음 알림**:
```
┌────────────────────────────────────────┐
│  진짜 import할까요?                    │
│                                        │
│  • 새 테이블: 고객명단_2026 (7 컬럼)   │
│  • 행 추가: 1,284                      │
│  • 정규화 적용: 1,103 셀               │
│  • 제외된 컬럼: 1                      │
│                                        │
│  이 작업은 *되돌릴 수 있습니다*        │
│  (테이블의 [실행 기록]에서 30일 보관)  │
│                                        │
│  [취소]                  [확정 import] │
└────────────────────────────────────────┘
```

### 백엔드 처리
1. `import_jobs` 테이블에 ImportJob row 저장 (감사 로그용)
2. **새 테이블 모드**: `tables_meta` + `fields_meta` 생성 → 데이터 INSERT (배치 단위 1k씩)
3. **기존 테이블 모드**: 컬럼 매핑 적용해 INSERT
4. 적용된 추천을 `accepted_suggestions` 테이블에 저장 (학습 데이터 + 사용자 신뢰)
5. 완료 후 → 데이터 탭의 해당 테이블로 redirect + Toast "1,284행 import 완료"

### 30일 되돌리기
- ImportJob의 status → "rolled_back" 으로 마킹 가능
- 새 테이블 모드면 테이블 통째 삭제
- 기존 테이블 모드면 추가된 행만 삭제 (job_id로 추적)

---

## 10. UX 원칙 재확인

1. **현실은 더럽다** — 헤더 다중 행, 빈 셀, 형식 혼재 모두 처리
2. **AI는 *카드*, 사람은 *확정*** — 토글 없이 자동 적용 ❌
3. **즉시 반영** — 상태 변경 = 시각 변경
4. **30일 후회 가능** — 첫 사용자가 무서워하지 않게
5. **빈 시작도 1등 시민** — 파일 없는 새 테이블도 동일한 진입 흐름

---

## 11. v0.2 확장 — Step 2 재사용

다음 input이 추가될 때 모두 Step 2 화면으로 수렴:

- PDF 표 → OCR → ImportJob (서버 측 처리, 결과를 동일 모델로)
- 이미지 (사진 찍은 영수증·표) → OCR → ImportJob
- 외부 API (Google Sheets sync, Notion DB sync) → 매핑 모드 진입

→ **Step 2의 컴포넌트 인터페이스를 input source 추상화**해 두면 같은 화면이 모든 케이스를 처리.

---

## 12. 미해결 질문

- [ ] 헤더 행이 4행 이상인 경우? (Phase 1은 3행까지만)
- [ ] 50MB 초과 파일의 chunked upload 전략 (Phase 2)
- [ ] 다중 시트 한 번에 import? (Phase 2)
- [ ] Realtime collaboration on import preview (한 워크스페이스 두 명이 같이 보는 케이스 — Phase 3?)
- [ ] AI 추천의 신뢰도 표시 방식 (% confidence를 카드에 노출할지)

---

## 13. 다음 단계

1. ⬜ 본 spec 사용자 검토
2. ⬜ Step 2 화면을 Figma 또는 v0로 mock 만들기 (HTML/Tailwind 빠른 프로토타입 가능)
3. ⬜ Phase 1 W3 시작 시 본 spec 기반 구현 착수
4. ⬜ 8/9월 베타 시 실 사용자로 검증
