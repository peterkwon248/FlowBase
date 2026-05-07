# taste-skill 도입 검토 (Plan)

> 작성: 2026-05-07
> 상태: 결정 대기 (사용자 confirm 필요)
> 출력: 도입 옵션 1~4 중 선택 → 그에 맞는 design 문서 작성

---

## 1. 배경

- 사용자가 [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) (⭐ 15.8k) 도입 가능성 제기
- "Anti-Slop Frontend Framework for AI Agents" — AI가 양산하는 평범한 UI를 막아주는 SKILL.md 기반 프레임워크
- FlowBase는 PR #4 직후 *Linear+shadcn+design-tokens* 톤이 이미 정착됨. 도입 시 *공존* 또는 *재정의* 결정 필요

---

## 2. taste-skill 정체

### 2.1 13개 스킬 매트릭스

| 카테고리 | 스킬 | 역할 | FlowBase 적합도 |
|---|---|---|---|
| **구현 (코드 출력)** | `taste-skill` (design-taste-frontend) | 기본 올라운더, 다이얼 3개 | ★★★ |
| | **`minimalist-skill`** | **Notion/Linear 에디토리얼 톤** | **★★★★★ (최고)** |
| | `soft-skill` (high-end-visual-design) | 폴리시드, 부드러운 대비 | ★★★ |
| | `brutalist-skill` | 강한 대비, 실험적 (베타) | ✗ (FlowBase 톤과 충돌) |
| | `redesign-skill` | 기존 프로젝트 감사 후 개선 | ★★★★ |
| | `gpt-tasteskill` | GPT/Codex 전용 | ✗ (Claude Code 사용) |
| | `output-skill` (full-output-enforcement) | 미완성 출력 강제 완성 | ★★ (보조) |
| | `image-to-code-skill` | 이미지 → 코드 파이프라인 | ★★★ (목업 필요 시) |
| | `stitch-skill` (Google Stitch 호환) | Stitch 출력 호환 | ✗ (사용 안 함) |
| **이미지 생성** | `imagegen-frontend-web` | 웹 reference 이미지 | ★★ |
| | `imagegen-frontend-mobile` | 모바일 reference | ✗ (FlowBase는 웹) |
| | `brandkit` | 브랜드 가이드 이미지 | ★ |

### 2.2 다이얼 (`taste-skill`만 적용, 1-10 스케일)

| 다이얼 | Lv 1-3 | Lv 5 | Lv 8-10 |
|---|---|---|---|
| `DESIGN_VARIANCE` | 중앙정렬, 12열 그리드 (예측 가능) | -2rem 겹침, 좌우 정렬 변화 | 마소니 레이아웃, 비대칭 |
| `MOTION_INTENSITY` | 정적, hover/active만 | CSS 0.3s 전환, 캐스케이드 | Framer Motion 고급, 스크롤 트리거 |
| `VISUAL_DENSITY` | 미술관 모드 (광활한 공백) | 일상 앱 모드 | 조종석 모드 (1px 선, 모노스페이스) |

### 2.3 라이선스/설치

- **MIT License** (자유 사용 ✅)
- 설치: `npx skills add https://github.com/Leonxlnx/taste-skill` 또는 SKILL.md 직접 복사
- Claude Code SKILL.md 표준 호환

---

## 3. FlowBase 현재 상태 vs taste-skill 강제 사항

### 3.1 ✅ 이미 정렬된 항목 (도입 비용 낮음)

| taste-skill 강제 | FlowBase 현재 | 상태 |
|---|---|---|
| Phosphor Icons 추천 | `@phosphor-icons/react ^2.1.10` 사용 중 | ✅ |
| Geist Sans/Mono 추천 | `next/font/google`로 `Geist`, `Geist_Mono` import | ✅ (단, 변수만 선언, 실제 적용 ❌ — `<body className="font-sans">`. 별도 fix 필요) |
| Tailwind v4 | Tailwind v4 사용 | ✅ |
| RSC 안전성 | Next 16 App Router | ✅ |
| 이모지 금지 | (코드 검토 필요. 사이드바 일부 추정) | ⚠️ |
| Inter 폰트 금지 | Inter 미사용 | ✅ |

### 3.2 ⚠️ 충돌 가능 항목 (도입 시 수정 필요)

| taste-skill 강제 | FlowBase 현재 | 영향 |
|---|---|---|
| `#000` 검은색 금지, `#111111` 사용 | `bg-black`/`text-black` 4곳 (shadcn alert/dialog/drawer/sheet) | 🟡 표준 컴포넌트라 무시 가능 또는 토큰 교체 |
| `rounded-full` 큰 요소 금지 | 71 occurrences across 33 files | 🟡 검토 필요 (배지/태그는 OK, 큰 카드/패널은 위반) |
| `shadow-(md|lg|xl)` 금지, `0 2px 8px rgba(0,0,0,0.04)` 권장 | (count 미확인, 점검 필요) | 🟡 중간 |
| `h-screen` 금지, `min-h-[100dvh]` | (count 미확인) | 🟢 단순 교체 |
| 색상 팔레트 (warm monochrome + spot pastels: `#FDEBEC`/`#E1F3FE` 등) | Status 색 매핑 (blue/amber/violet/emerald) | 🔴 **충돌 — Status 색은 의미론적 합의(미처리=blue, urgent=red)** |
| 헤딩 폰트 Lyon Text/Newsreader/Playfair (세리프) | Geist Sans 단일 | 🔴 **타이포 톤 변경 — 에디토리얼 느낌 vs 현재 산스 모던** |
| 매크로 화이트스페이스 `py-24~py-32` | 표/시트/칸반 앱이라 밀집 | 🔴 **VISUAL_DENSITY 5-8 (앱 모드)이 적합. minimalist-skill 그대로 적용 불가** |
| `framer-motion` 자동 설치 (taste-skill 사용 시) | 미설치 | 🟢 MOTION_INTENSITY 낮으면 불필요 |

### 3.3 합의 깨질 위험 (PR #4 + 직전 세션 결정)

- **Status 색 매핑** ([MEMORY.md #8](../../MEMORY.md#key-design-decisions)): 미처리=blue, 진행중=amber, 대기=violet, 완료=emerald
  - taste-skill의 파스텔 팔레트와 색조는 비슷하지만 *의미론* 합의는 별도 lock 필요
- **Status pill 통합** (`8f597b0`): 아이콘+이름+카운트 단일 pill — taste-skill 룰과 무관, 보존
- **Linear+shadcn 디자인 시스템** (`be6ae15`, PR #4): 톤 자체는 minimalist-skill과 align
- **design-tokens 시스템** (`DESIGN-TOKENS.md`, `lib/tokens.ts`): taste-skill의 inline hex 권장과 충돌 가능 — 토큰 우선 명시 필요

---

## 4. 도입 옵션

### 옵션 1. 도입 안 함 (보수)
- **장점**: 합의된 디자인 시스템 lock. 추가 학습/충돌 0
- **단점**: AI 작업(v0/claude.ai)에서 디테일 양산 시 톤 흔들림 가능성. taste-skill의 polish 효과 포기
- **위험**: 거의 없음

### 옵션 2. `minimalist-skill` 단일 도입 (추천)
- **장점**: FlowBase 톤과 정렬도 최고 (Notion/Linear 명시). Linear+shadcn 강화. 학습 부담 적음
- **단점**: 색상 팔레트 / 헤딩 세리프 / 화이트스페이스 등은 *부분 적용* 필요 (FlowBase는 dense app)
- **위험**: 중간. *명시 가드 룰* 필요 (Status 색 보존, design-tokens 우선, app density 보존)

### 옵션 3. `taste-skill` (다이얼) + `minimalist-skill` 조합
- **장점**: 신규 컴포넌트 만들 때 다이얼로 fine-tuning. minimalist-skill로 톤 lock
- **단점**: 두 SKILL.md 간 우선순위 룰 필요. AI가 어느 쪽 따를지 혼란 가능
- **위험**: 중상. 명확한 *우선순위 정책* 문서 필요

### 옵션 4. 부분 도입 (`redesign-skill` + `image-to-code-skill`만)
- **장점**: 강제 룰 없이 *도구로만* 사용 (기존 컴포넌트 audit, 이미지→코드)
- **단점**: minimalist-skill의 폴리시 효과 포기
- **위험**: 낮음

---

## 5. 옵션별 적용 범위 매트릭스

| 적용 범위 | 옵션 1 | 옵션 2 | 옵션 3 | 옵션 4 |
|---|:---:|:---:|:---:|:---:|
| 신규 컴포넌트 (옵션 A 시트 뷰 등) | ❌ | ✅ | ✅ | △ |
| 기존 컴포넌트 audit | ❌ | △ | ✅ | ✅ |
| 디자인 토큰 갱신 | ❌ | △ | △ | ❌ |
| Status 색 매핑 보존 | ✅ | ✅ (가드 필수) | ✅ (가드 필수) | ✅ |
| 학습/도입 비용 | 0 | 낮음 | 중 | 낮음 |
| 충돌 위험 | 0 | 중 | 중상 | 낮음 |

---

## 6. 도입 시 가드 룰 (옵션 2/3 선택 시 필수)

```yaml
# CLAUDE.md (project) 또는 별도 docs/design-guards.md 에 명시

priority_order:
  1: docs/MEMORY.md "Key Design Decisions"  # Status 색, 합의된 결정
  2: lib/tokens.ts + DESIGN-TOKENS.md       # 디자인 토큰
  3: minimalist-skill SKILL.md              # 톤/타이포
  4: taste-skill 다이얼 (옵션 3만)          # 신규 컴포넌트 미세조정

locked_constants:
  - status_colors: 미처리=blue / 진행중=amber / 대기=violet / 완료=emerald (NO override)
  - status_pill_pattern: 아이콘+이름+카운트 단일 pill (분리 금지)
  - branding: "FlowBase" (사용자 노출), 내부 docs/spec "FlowDB" 잔존 허용

dial_recommendations: # 옵션 3
  DESIGN_VARIANCE: 1-3   # Linear 톤 lock, 비대칭 ❌
  MOTION_INTENSITY: 1-3  # 표/시트 앱, 화려한 모션 ❌
  VISUAL_DENSITY: 5-8    # 앱이라 정보 밀도 높음. minimalist-skill 매크로 화이트스페이스 위반 OK

forbidden_changes:
  - Status 색 의미 변경 (도입과 무관하게 ❌)
  - Phosphor → 다른 아이콘 (이미 설치, 그대로)
  - Geist → 세리프 (앱 톤 깨짐, 다음 세션 재논의)
```

---

## 7. 추천

**옵션 2 (minimalist-skill 단일) + 가드 룰 명시 + feat/sheet-view에서 트라이얼.**

이유:
- FlowBase 톤(Linear+shadcn)과 가장 align되는 단일 스킬
- 옵션 3 (다이얼 추가)은 *옵션 A 시트 뷰* 작업의 미세조정에서 *필요할 때만* 추가 도입 — 일단 미니멀하게 시작
- 옵션 4는 redesign-skill만 쓰면 *부분 audit*에는 좋지만 신규 컴포넌트(sheet view)에 적용할 폴리시가 부족

---

## 8. 다음 행동

### 옵션 2 채택 시
1. `npx skills add https://github.com/Leonxlnx/taste-skill --skill minimalist-skill` 시도 (또는 SKILL.md 직접 복사)
2. `~/.claude/skills/minimalist-skill/SKILL.md` 또는 프로젝트 `.claude/skills/minimalist-skill/SKILL.md`에 배치
3. 가드 룰 작성: `flowdb-port/docs/design-guards.md` (또는 CLAUDE.md project)
4. `taste-skill-adoption.design.md` 작성 (도입 후 어떻게 사용할지 — taste-skill 활성화 패턴, 가드 흐름)
5. **트라이얼**: 옵션 A 시트 뷰 (`feat/sheet-view`) 작업에서 minimalist-skill 적용 시도. 평가 후 본격 도입 결정

### 옵션 1 채택 시
- plan 폐기 또는 archive. 옵션 A는 직접 PDCA design 진행

### 빠뜨리지 말 것
- Status 색 매핑은 *어떤 옵션이든* 보존. 절대 override ❌
- Geist 폰트가 layout.tsx에서 변수 선언만 되고 실제 적용 안 됨 — 별도 fix (taste-skill 도입과 무관하게 처리)

---

## 9. 결정 대기

사용자 confirm 받은 옵션 → `taste-skill-adoption.design.md` 또는 옵션 1이면 `sheet-view.plan.md`로 이동.
