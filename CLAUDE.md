# FlowBase — Claude Code Project Guide

> 작업 시 이 파일 + `docs/MEMORY.md` (source of truth) 먼저 읽기.

---

## 프로젝트 정보

- **이름**: FlowBase (사용자 노출 명칭. 내부 docs/spec의 "FlowDB" 잔존 허용 — 점진 정리)
- **GitHub**: https://github.com/peterkwon248/FlowBase (private)
- **로컬**: `C:\Users\kwonkyunghun\Desktop\FlowBase\flowdb-port`
- **목표**: AI가 초안을 만들고 *사람이 확정*하는 가벼운 데이터 보드. 5분 안에 정리.

## Stack

| 카테고리 | 선택 |
|---|---|
| 프레임워크 | Next.js 16 (App Router, RSC) · TypeScript · React 19 |
| 스타일 | Tailwind CSS v4 (`@theme inline`) · `tw-animate-css` |
| UI | shadcn/ui (Radix 기반) · `next-themes` (light/dark) |
| 아이콘 | **`@phosphor-icons/react`** (status/priority) + `lucide-react` (일반) |
| 폰트 | **Geist Sans / Geist Mono** (`next/font/google` self-hosted) |
| 디자인 토큰 | `lib/tokens.ts` + `DESIGN-TOKENS.md` |
| 상태 | 클라이언트 메모리 mock (BaaS 미정 — Supabase vs bkend.ai) |
| 분석 | `@vercel/analytics` |

---

## 🎨 디자인 우선순위 (LOCK 룰)

작업 시 *상위 우선순위가 절대 우선*. 충돌 시 상위 따름.

| 우선순위 | 출처 | 내용 |
|---|---|---|
| **1** | `docs/MEMORY.md` "Key Design Decisions" | 의미론 합의 (Status 색, status pill 등). **override ❌** |
| **2** | `lib/tokens.ts` + `DESIGN-TOKENS.md` | 디자인 토큰 (color/spacing/radius). **inline hex 금지, 토큰 우선** |
| **3** | `docs/design-skills/minimalist-skill/SKILL.md` | 톤/타이포/레이아웃 (Notion/Linear 에디토리얼). 1·2와 충돌 시 1·2 따름 |

### Lock된 상수 (절대 override 금지)

```yaml
status_colors:
  미처리: blue        # red ❌ (priority Urgent와 의미 충돌)
  진행중: amber
  대기:   violet
  완료:   emerald

status_pill_pattern: "아이콘 + 이름 + 카운트"  # 단일 pill. 분리 ❌

icon_libraries:
  status_priority: "@phosphor-icons/react"     # 변경 ❌
  general: "lucide-react"

fonts:
  sans: "Geist (next/font/google)"             # 세리프 헤딩 ❌ (앱 톤 깨짐)
  mono: "Geist Mono"

branding:
  user_facing: "FlowBase"                      # 사용자 노출 모든 곳
  internal_docs_legacy: "FlowDB"               # 점진 정리 (긴급 ❌)

git_remote: "peterkwon248/FlowBase"
```

### Confirmed Decisions

- **AI 추천 + 사람 확정** 모델 (자동 적용 ❌, [spec §0:9](docs/specs/flowdb-import-flow-spec.md))
- **모든 결정 되돌릴 수 있음** (30일 rollback)
- **3 진입점 분리** (빈 새 테이블 / 파일→새 / 파일→기존)
- **디스플레이 자동 추천** (데이터 도메인 허용 시만 활성화 — Notion/Airtable 비대 함정 회피)

---

## 🎨 minimalist-skill 활성 룰 (도입 결정: 2026-05-07, 옵션 2)

**reference**: `docs/design-skills/minimalist-skill/SKILL.md`

### 적용 범위
- ✅ **신규 컴포넌트** (옵션 A 시트 뷰 등)
- △ **기존 컴포넌트 audit/redesign** (PR 단위, 신중히)
- ❌ **랜더링 핫패스 / mock 데이터 / 테스트 코드**

### FlowBase 가드 (minimalist-skill 강제 사항 vs 본 프로젝트 현실)

| minimalist-skill 권장 | FlowBase 가드 | 이유 |
|---|---|---|
| 색상 팔레트 (`#FFFFFF`, `#F7F6F3`, 파스텔 `#FDEBEC` 등) | **Status 색 매핑 보존** (위 LOCK). 그 외 일반 카드/배경은 minimalist 톤 OK | 의미론 합의 보존 |
| 헤딩 세리프 (Lyon Text/Newsreader/Playfair) | **❌ 금지**. Geist Sans 단일 유지 | 앱(데이터 보드)은 산스 톤이 적합. 에디토리얼 ❌ |
| 매크로 화이트스페이스 `py-24~32` | **앱 dense 모드 우선** (시트/표/칸반은 정보 밀도 5-8) | 데이터 보드는 정보량 많음 |
| 본문 `#111111` (검은색 ❌) | △ shadcn 표준 컴포넌트(`bg-black` 4곳)는 그대로 OK. 신규는 `#111` 또는 토큰 사용 | shadcn 호환 |
| 이모지 ❌ | ✅ 따름 | minimalist 합의 |
| Inter/Roboto/Open Sans ❌ | ✅ 이미 미사용 | OK |
| 큰 요소 `rounded-full` ❌ | △ 배지/태그만 OK. 큰 카드/패널 검토 | 신규 컴포넌트만 |
| `shadow-(md/lg/xl)` ❌ | △ shadcn 표준 컴포넌트는 OK. 신규는 약한 그림자만 | shadcn 호환 |
| `h-screen` ❌, `min-h-[100dvh]` | ✅ 따름 (있으면 교체) | 모바일 viewport 대응 |
| `framer-motion` 자동 설치 | **❌ 강제 설치 금지**. MOTION_INTENSITY 1-3 (정적 ~ 미세 hover/fade)만 허용 | 데이터 보드는 모션 과하면 산만 |
| Phosphor / Radix UI Icons | ✅ 이미 적용 | OK |
| 1px 보더 `#EAEAEA` | △ 토큰(`--border`) 우선 | 다크 모드 대응 |

### 다이얼 권장 (옵션 3 사용 시 — 현재는 옵션 2라 미적용)
- DESIGN_VARIANCE: 1-3 (Linear 톤 lock, 비대칭 ❌)
- MOTION_INTENSITY: 1-3 (정적 ~ 미세 hover만)
- VISUAL_DENSITY: 5-8 (앱 모드)

### 트라이얼 결정
- **`feat/sheet-view`** 브랜치에서 옵션 A 시트 뷰 작업 시 minimalist-skill 적용 → 1주 평가 후 본격 도입 또는 후퇴

---

## PDCA 워크플로우

bkit PDCA 사이클 사용:
- `docs/01-plan/features/{feature}.plan.md` — Plan
- `docs/02-design/features/{feature}.design.md` — Design
- `docs/03-analysis/{feature}.analysis.md` — Check
- `docs/04-report/{feature}.report.md` — Report
- `docs/archive/YYYY-MM/{feature}/` — Archive

---

## 작업 시 참고 순서 (필수)

1. `CLAUDE.md` (이 파일) — 가드 룰 + LOCK 상수
2. `docs/MEMORY.md` — Source of Truth (PR history, 합의 결정)
3. `NEXT-ACTION.md` (root) — 다음 즉시 액션
4. `docs/SESSION-LOG.md` — 직전 세션 흐름
5. `docs/CONTEXT.md` — Current features
6. `docs/TODO.md` — 우선순위 (P0/P1/P2/P3)

---

## 빠뜨리지 말 것

- **Status 색 의미는 절대 override ❌** (LOCK 상수)
- **`<body>` className에 Geist variable이 적용되어 있음** (`app/layout.tsx:39` — fix 완료 2026-05-07)
- **`docs/design-skills/minimalist-skill/SKILL.md`는 git tracked**. 다른 머신에서도 자동 sync — 별도 install 불필요
- **`feat/sheet-view` 브랜치 존재** — 옵션 A 트라이얼용. main에서 분기 (2026-05-07)
- **워크트리 함정**: `.claude/worktrees/` 안은 Plot 노트앱용. FlowBase 무관
