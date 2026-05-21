# IMPORT-SPEC — 파일 / 텍스트 → 데이터 보드 변환 흐름

> 사용자가 가진 모든 종류의 데이터(CSV, Excel paste, Google Sheets paste, Markdown table, PDF text)를 받아서
> AI 추천 + 사람 확정 모델로 보드에 추가하는 흐름.

---

## 0. 디시전 트리

```
사용자가 "Import" 클릭
   │
   ├─ 파일 첨부 (.csv .tsv .json .md) ─→ FileReader → text → parse
   ├─ 텍스트 paste                      ─→ text → detectFormat → parse
   └─ Google Sheets URL                ─→ ⚠ 백엔드 필요 (Phase 3+). 일단 paste 안내.
                                            ↓
                                         로컬에서는: "Google Sheets URL은 시트 내용을 복사해서 붙여넣어 주세요"
```

**Phase 1에선 paste only**. Google Sheets URL → API 호출은 사용자의 OAuth가 필요해서 v2로 미룹니다.

---

## 1. 파싱 단계 (lib/parsers.ts)

프로토타입 `import-modal.jsx`에 있는 함수 그대로 옮기세요:

```ts
parseDelimited(text, delim)   // CSV(',') 또는 TSV('\t'), quote 처리 포함
parseMarkdownTable(text)      // | a | b | c | 형식
detectFormat(text)            // "csv" | "tsv" | "md" | null
parseAny(text)                // 자동 분기
inferType(samples)            // "date" | "email" | "num" | "select" | "text"
normalizeHeader(s, idx)       // 헤더를 snake_case로
```

**테스트 픽스처들**:
- CSV: `prototype/import-modal.jsx`의 `SAMPLE_CSV` 상수
- TSV: 같은 데이터를 탭으로
- MD:
  ```
  | id | name | quote |
  |---|---|---|
  | INT-101 | Lee | 가격이 비싸요 |
  ```
- 깨진 입력: 1행짜리, 빈 셀, 콤마 포함 quote값 (`"foo,bar"`)

---

## 2. 3-step 위저드

### Step 1 — Paste
```
┌──────────────────────────────────────────┐
│ Paste your data       [Use sample 버튼]   │
│ ┌──────────────────────────────────────┐ │
│ │ (textarea, mono, 240px high)         │ │
│ │ name, company, date, quote           │ │
│ │ Lee Junho, Petal, 2026-05-18, …      │ │
│ └──────────────────────────────────────┘ │
│ ✓ Detected CSV: 5 rows, 6 columns        │
└──────────────────────────────────────────┘
```

**감지 즉시** 포맷·행수·컬럼수 표시. 빈 textarea면 Continue 비활성화.

### Step 2 — Review
```
┌──────────────────────────────────────────┐
│ Review columns       [☑ First row is header] │
│ ┌──────────────────────────────────────┐ │
│ │ # name      ▾ │ # company  ▾ │ ...   │ │
│ │   [text]      │   [text]     │       │ │ ← 타입 dropdown
│ ├──────────────────────────────────────┤ │
│ │ Lee Junho     │ Petal        │ ...   │ │
│ │ Mira Tan      │ Forge        │ ...   │ │
│ │ ...           │              │       │ │ ← 8행 미리보기
│ └──────────────────────────────────────┘ │
│ 5 rows · 6 columns                       │
└──────────────────────────────────────────┘
```

**컬럼별로:**
- 라벨 inline 편집 (`<input>` autoFocus)
- 타입 `<select>` (text / num / date / email / select / status)
- 헤더에 타입 아이콘 (FieldTypeIcon 재사용)

**"First row is header" 체크 토글** → 헤더 행 재계산.

### Step 3 — AI columns
```
┌──────────────────────────────────────────┐
│ AI column suggestions                    │
│ ┌──────────────────────────────────────┐ │
│ │ ✨ AI summary                         │ │
│ │ Customer feedback board tracking     │ │
│ │ pricing concerns and feature reqs.   │ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ ☑ Theme         [Recommended]        │ │
│ │   Classify each row into a high-     │ │
│ │   level theme. Inferred from quotes. │ │
│ └──────────────────────────────────────┘ │
│ ┌──────────────────────────────────────┐ │
│ │ ☑ Sentiment     [Recommended]        │ │
│ │   Score each row Positive/Mixed/Neg. │ │
│ └──────────────────────────────────────┘ │
│ ✓ Nothing is auto-applied. AI columns    │
│   are added as pending — confirm later.  │
└──────────────────────────────────────────┘
```

Step 2 → Step 3 진입 시 **`/api/ai/analyze-import` 호출** (AI-CONTRACTS.md §2).
응답 받기까지 "Analyze with AI" 버튼은 spinner.

---

## 3. 커밋 단계 (mapper)

Step 3에서 "Import N rows" 클릭 → 파싱된 raw 데이터를 보드 row shape로 변환:

```ts
function mapImportedRow(rawCells: string[], cols: ColumnDef[], opts: { aiTheme: boolean; aiSentiment: boolean }) {
  const obj: TableRow = {
    id: generateId(),                          // INT-XXX 또는 nanoid
    name: "", company: "", date: today(),
    theme: "Other", sentiment: "Mixed",
    status: "todo", priority: "Med", quote: "",
    themeConfirmed: !opts.aiTheme,
    sentimentConfirmed: !opts.aiSentiment,
  };

  cols.forEach((c, i) => {
    const v = rawCells[i];
    if (v == null || v === "") return;
    const target = c.name.toLowerCase();

    if (/^id$/.test(target))                       obj.id = v;
    else if (/name/.test(target))                  obj.name = v;
    else if (/company|account/.test(target))       obj.company = v;
    else if (/date|created|opened/.test(target))   obj.date = v;
    else if (/status/.test(target))                obj.status = mapStatus(v);
    else if (/priority|urgency/.test(target))      obj.priority = mapPriority(v);
    else if (/quote|note|comment|content|message/.test(target)) obj.quote = v;
    else if (/theme|topic|category|tag/.test(target))           obj.theme = v;
    else if (/sentiment|feeling|tone/.test(target))             obj.sentiment = v;
    else if (!obj.quote)                          obj.quote = v;   // fallback
  });

  return obj;
}

function mapStatus(v: string): TicketStatus {
  const m = v.toLowerCase();
  if (/done|완료|complete/.test(m))    return "완료";
  if (/progress|진행/.test(m))         return "진행중";
  if (/wait|대기|hold/.test(m))        return "대기";
  return "미처리";
}

function mapPriority(v: string): TicketPriority {
  const m = v.toLowerCase();
  if (/urgent|급/.test(m))    return "Urgent";
  if (/high|상/.test(m))      return "High";
  if (/low|하/.test(m))       return "Low";
  return "Med";
}
```

**주의**: 프로토타입은 status 키가 `"todo" | "progress" | "waiting" | "done"`이지만,
기존 코드베이스는 `lib/mock-data.ts`의 `TicketStatus = "미처리" | "진행중" | "대기" | "완료"` 한국어. **기존 enum을 따르세요.**

---

## 4. AI 컬럼 후처리 (선택, Phase 2)

Import 직후 AI 컬럼이 켜져 있으면:
1. 모든 새 row의 `themeConfirmed` / `sentimentConfirmed`는 `false`
2. AI Activity 패널에 "Inferred theme for N rows" 카드 자동 생성
3. 사용자가 "Apply all" 누르면 `/api/ai/infer-batch` 호출

또는 더 적극적으로: Import 직후 **자동으로** infer-batch 백그라운드 호출. 그러면 사용자가 보드에 도착했을 때 이미 추천이 채워져 있음 (단 pending 상태).

추천: **자동 호출 모드 OFF가 기본**. AI 호출은 사용자가 의식적으로 트리거하는 게 신뢰 모델에 맞음.

---

## 5. 에러 / 엣지 케이스

| 상황 | 처리 |
|---|---|
| paste 비어있음 | Continue 비활성화 |
| 1행짜리 데이터 | "First row is header" OFF로 fallback, 컬럼 자동 이름 |
| 컬럼 수 0 | "데이터를 인식하지 못했습니다. CSV 형식인지 확인해주세요." |
| 1000행 이상 | 경고 toast: "Large import — may take a moment" |
| 헤더에 중복 | normalize 시 `col_2` 자동 suffix |
| Anthropic 호출 실패 | Step 3에서 AI 추천 카드 모두 비활성화 + 에러 메시지. 그래도 import는 진행 가능 |
| 파일 첨부 (.csv 등) | `<input type="file">` + `FileReader` → text 추출 → 위 흐름 그대로 |

---

## 6. 미래 확장 — 진짜 Google Sheets URL

Phase 3+ 작업:

```
사용자가 https://docs.google.com/spreadsheets/d/{ID}/edit URL paste
  ↓
서버에서 Sheets API 호출 (사용자 OAuth 필요)
  ↓
모든 시트 목록 표시 → 사용자가 시트 선택
  ↓
Step 1 skip, 바로 Step 2 (이미 parsed)
```

`docs/01-baas-decision.md`의 Supabase / bkend.ai 결정 후 OAuth flow 구현.

---

## 7. 컴포넌트 분리

`COMPONENT-MAP.md` §2의 `components/import/` 하위 파일들:

- `import-dialog.tsx` — shadcn `Dialog` 안에 3-step state machine
- `import-step-paste.tsx` — textarea + 감지 안내
- `import-step-review.tsx` — 테이블 미리보기 + 컬럼 편집
- `import-step-ai.tsx` — AI 추천 카드
- `lib/parsers.ts` — 순수 함수 (테스트 쉬움)
