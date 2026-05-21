# AI-CONTRACTS — Claude API 호출 명세

> 프로토타입은 `window.claude.complete`를 직접 호출했지만, 프로덕션에서는 **Next.js API route**를 거쳐 서버 측에서 Anthropic SDK로 호출하세요.
> API key를 클라이언트 번들에 노출하면 안 됩니다.

---

## 0. 공통 클라이언트 어댑터

```ts
// lib/flowbase-ai.ts
export async function callAI<TReq, TRes>(endpoint: string, body: TReq): Promise<TRes> {
  const res = await fetch(`/api/ai/${endpoint}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI ${endpoint} failed: ${res.status} ${text.slice(0, 200)}`);
  }
  return res.json();
}
```

## 0.1 공통 서버 어댑터

```ts
// app/api/ai/_anthropic.ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function ask(prompt: string, opts?: { maxTokens?: number; model?: string }) {
  const r = await client.messages.create({
    model: opts?.model ?? "claude-3-5-sonnet-latest",   // 최신 안정 모델로 교체 가능
    max_tokens: opts?.maxTokens ?? 1024,
    messages: [{ role: "user", content: prompt }],
  });
  return r.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map(b => b.text)
    .join("");
}

export function parseJsonArray(text: string): unknown[] {
  const m = text.match(/\[[\s\S]*\]/);
  if (!m) throw new Error("No JSON array in response: " + text.slice(0, 200));
  return JSON.parse(m[0]);
}

export function parseJsonObject(text: string): Record<string, unknown> {
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("No JSON object in response: " + text.slice(0, 200));
  return JSON.parse(m[0]);
}
```

---

## 1. `/api/ai/infer-batch` — Theme / Sentiment 일괄 분류

**용도**: AI Activity 패널의 "Apply all" 버튼.

### Request
```ts
type InferBatchReq = {
  column: "theme" | "sentiment";
  rows: { id: string; quote: string }[];
  themeOptions?: string[];     // theme일 때만. 기본값 아래 참조.
};
```

### Response
```ts
type InferBatchRes = {
  results: { id: string; value: string }[];
  modelUsed: string;
  durationMs: number;
};
```

### 기본 옵션
```ts
const THEME_OPTIONS = [
  "Pricing pushback",
  "Onboarding friction",
  "Feature: AI columns",
  "Sheet performance",
  "Sharing & roles",
  "Other",
];
const SENTIMENT_OPTIONS = ["Positive", "Mixed", "Negative"] as const;
```

### Prompt — theme
```text
Classify each customer-interview quote into ONE of: {{THEME_OPTIONS_JOINED}}.
Reply ONLY with a JSON array, no prose, shape: [{"id":"INT-018","theme":"Pricing pushback"}, …]

[INT-018] 월 39불은 솔직히 비싸요. 팀 단위면 모를까…
[INT-017] 처음 5분이 제일 헷갈렸어요. import 어디서 시작하는지…
…
```

### Prompt — sentiment
```text
Score the sentiment of each customer-interview quote as Positive, Mixed, or Negative.
Reply ONLY with a JSON array, no prose, shape: [{"id":"INT-018","sentiment":"Negative"}, …]

[INT-018] 월 39불은 솔직히 비싸요…
…
```

### 서버 구현 (참고)
```ts
// app/api/ai/infer-batch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ask, parseJsonArray } from "../_anthropic";

const THEME_OPTIONS = ["Pricing pushback", "Onboarding friction", "Feature: AI columns",
                       "Sheet performance", "Sharing & roles", "Other"];

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  const { column, rows, themeOptions = THEME_OPTIONS } = await req.json();

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ results: [], modelUsed: "", durationMs: 0 });
  }
  if (rows.length > 100) {
    return NextResponse.json({ error: "Max 100 rows per call" }, { status: 400 });
  }

  const list = rows.map((r: any) => `[${r.id}] ${r.quote}`).join("\n");
  const prompt = column === "theme"
    ? `Classify each customer-interview quote into ONE of: ${themeOptions.join(", ")}.
Reply ONLY with a JSON array, no prose, shape: [{"id":"…","theme":"…"}, …]

${list}`
    : `Score the sentiment of each customer-interview quote as Positive, Mixed, or Negative.
Reply ONLY with a JSON array, no prose, shape: [{"id":"…","sentiment":"…"}, …]

${list}`;

  const text = await ask(prompt, { maxTokens: 2048 });
  const arr = parseJsonArray(text) as { id: string; theme?: string; sentiment?: string }[];
  const results = arr.map(r => ({
    id: r.id,
    value: column === "theme" ? (r.theme ?? "Other") : (r.sentiment ?? "Mixed"),
  }));

  return NextResponse.json({
    results,
    modelUsed: "claude-3-5-sonnet-latest",
    durationMs: Date.now() - t0,
  });
}
```

### Failure modes
- **응답이 JSON 배열 아님** → 에러 throw → 클라이언트는 toast로 "AI failed — try again" 표시. 원본 row 변경 ❌.
- **응답에 일부 row 누락** → `id` 매칭으로 처리, 누락된 row는 그대로 둠 (다시 시도 가능).
- **THEME_OPTIONS에 없는 값** → 그대로 받되 `inferType`이 "Other"로 fallback.
- **Rate limit (429)** → 클라이언트에서 재시도 버튼만 표시. 자동 재시도 ❌.

---

## 2. `/api/ai/analyze-import` — Import 데이터 분석

**용도**: Import 모달 Step 3에서 데이터 요약 + AI 컬럼 추천.

### Request
```ts
type AnalyzeImportReq = {
  headers: string[];              // 컬럼 라벨
  sampleRows: string[][];         // 첫 10-15행 정도
};
```

### Response
```ts
type AnalyzeImportRes = {
  summary: string;                // 1문장 요약
  suggestTheme: boolean;
  suggestSentiment: boolean;
  rowKind: string;                // e.g. "customer feedback", "tasks", "contacts"
};
```

### Prompt
```text
You are analyzing a spreadsheet for a customer feedback / knowledge board.
Headers: {{HEADERS_JOINED}}

Sample rows:
{{SAMPLE_ROWS_JOINED}}

Return a JSON object:
{
  "summary": "<1 sentence — what this data is>",
  "suggestTheme":     <true if a 'theme' AI column would add value>,
  "suggestSentiment": <true if a 'sentiment' AI column would add value>,
  "rowKind": "<short noun phrase: 'customer interviews' | 'tasks' | 'launch checklist' | ...>"
}
Reply ONLY with the JSON object, nothing else.
```

### Why both flags?
- `suggestTheme`: 자유 텍스트 컬럼이 있고 분류할 만한 다양성이 있을 때 (피드백, 인터뷰, 코멘트).
- `suggestSentiment`: 정성 표현이 들어있을 때 (Negative/Mixed/Positive로 나눌 만한). 단순 task 데이터엔 ❌.

---

## 3. `/api/ai/ask` — AI Composer (자유 질의)

**용도**: AI Activity 패널 하단 입력창.

### Request
```ts
type AskReq = {
  prompt: string;
  context: {
    boardLabel: string;
    rowCount: number;
    // 필요 시 활성 row 일부 샘플도 첨부
  };
};
```

### Response
```ts
type AskRes = { text: string };
```

### Prompt 템플릿
```text
You are FlowBase, an assistant inside a data-board app.
The user is on the "{{BOARD_LABEL}}" board with {{ROW_COUNT}} rows.
Respond in 1-2 short sentences. Korean if user wrote Korean, English otherwise.

User said: {{USER_PROMPT}}
```

**향후 확장**: 사용자가 "make a chart of X"라고 하면 server에서 차트 spec JSON 생성 → 클라이언트가 그걸로 dashboard에 새 카드 추가. 이건 v2.

---

## 4. Streaming (선택)

위 3개 endpoint 전부 non-streaming으로 시작해도 충분합니다. 응답이 1-3초.
나중에 batch가 커지면 SSE / Anthropic streaming으로 마이그레이션.

---

## 5. Cost / Rate Limit 가드

- **Per-user**: localStorage에 마지막 호출 시각 기록, 같은 endpoint 5초 throttle.
- **Per-batch**: infer-batch는 한 번에 최대 **100 rows**. 그 이상이면 chunk로 나눠서 순차 호출 + progress toast.
- **Token cost**: infer-batch는 row당 약 150 input + 30 output 토큰. 100 rows = ~18,000 토큰 / 호출. Sonnet 기준 $0.06 정도.

---

## 6. 환경변수

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-…
```

`.env.example`에도 추가하고 README에 명시.

---

## 7. 테스트 픽스처

`prototype/prototype.jsx`의 `INTERVIEWS` 배열이 그대로 테스트 픽스처가 됩니다.
서버 테스트할 때 mock Anthropic client 만들어서 미리 정해진 JSON 응답 반환하도록.

```ts
// __tests__/api/infer-batch.test.ts
vi.mock("../_anthropic", () => ({
  ask: vi.fn().mockResolvedValue('[{"id":"INT-018","theme":"Pricing pushback"}]'),
  parseJsonArray: (s: string) => JSON.parse(s),
}));
```
