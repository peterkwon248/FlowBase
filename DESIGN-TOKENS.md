# FlowDB Design Tokens

Linear + shadcn 철학 기반 디자인 토큰 문서. 다크모드 우선 설계, WCAG AA 대비 준수.

## 색상 토큰

### Primary (Linear Purple Accent)

| 토큰 | Light | Dark | 용도 |
|------|-------|------|------|
| `--primary` | `oklch(0.50 0.16 270)` | `oklch(0.65 0.18 270)` | 주 액센트, 버튼, 링크 |
| `--primary-foreground` | `oklch(0.98 0 0)` | `oklch(0.13 0.01 250)` | primary 위의 텍스트 |

### Background & Surface

| 토큰 | Light | Dark | 용도 |
|------|-------|------|------|
| `--background` | `oklch(0.985 0.002 250)` | `oklch(0.13 0.01 250)` | 앱 배경 |
| `--foreground` | `oklch(0.14 0.01 250)` | `oklch(0.93 0.01 250)` | 기본 텍스트 |
| `--surface` | `oklch(0.975 0.002 250)` | `oklch(0.15 0.01 250)` | 카드/패널 배경 |
| `--surface-elevated` | `oklch(1 0 0)` | `oklch(0.18 0.01 250)` | 띄워진 요소 배경 |

### Semantic Colors

| 토큰 | Light BG | Light FG | Dark BG | Dark FG | 용도 |
|------|----------|----------|---------|---------|------|
| `--success-*` | `oklch(0.96 0.03 155)` | `oklch(0.40 0.12 155)` | `oklch(0.22 0.06 155)` | `oklch(0.75 0.14 155)` | 완료, 성공 |
| `--warning-*` | `oklch(0.96 0.04 75)` | `oklch(0.50 0.12 75)` | `oklch(0.25 0.06 75)` | `oklch(0.80 0.12 75)` | 주의, 대기 |
| `--info-*` | `oklch(0.96 0.03 230)` | `oklch(0.45 0.12 230)` | `oklch(0.22 0.05 230)` | `oklch(0.75 0.12 230)` | 정보 |
| `--danger-*` | `oklch(0.96 0.04 25)` | `oklch(0.50 0.16 25)` | `oklch(0.22 0.06 25)` | `oklch(0.75 0.16 25)` | 에러, 삭제 |
| `--destructive` | `oklch(0.55 0.20 25)` | - | `oklch(0.60 0.20 25)` | - | 파괴적 액션 |

### Border & Input

| 토큰 | Light | Dark | 용도 |
|------|-------|------|------|
| `--border` | `oklch(0.91 0.002 250)` | `oklch(0.26 0.01 250)` | 기본 보더 |
| `--border-subtle` | `oklch(0.94 0.002 250)` | `oklch(0.22 0.01 250)` | 미묘한 보더 |
| `--input` | `oklch(0.91 0.002 250)` | `oklch(0.26 0.01 250)` | 입력 필드 보더 |
| `--ring` | `oklch(0.50 0.16 270)` | `oklch(0.65 0.18 270)` | 포커스 링 |

### Muted & Accent

| 토큰 | Light | Dark | 용도 |
|------|-------|------|------|
| `--muted` | `oklch(0.955 0.002 250)` | `oklch(0.22 0.01 250)` | 비활성 배경 |
| `--muted-foreground` | `oklch(0.50 0.01 250)` | `oklch(0.60 0.01 250)` | 보조 텍스트 |
| `--accent` | `oklch(0.94 0.02 270)` | `oklch(0.24 0.03 270)` | 강조 배경 |
| `--accent-foreground` | `oklch(0.14 0.01 250)` | `oklch(0.93 0.01 250)` | 강조 위 텍스트 |

### Chart Colors

| 토큰 | Light | Dark | 용도 |
|------|-------|------|------|
| `--chart-1` | `oklch(0.50 0.16 270)` | `oklch(0.65 0.18 270)` | 보라 (Primary) |
| `--chart-2` | `oklch(0.55 0.16 155)` | `oklch(0.65 0.18 155)` | 초록 (Success) |
| `--chart-3` | `oklch(0.65 0.14 75)` | `oklch(0.75 0.14 75)` | 노랑/오렌지 |
| `--chart-4` | `oklch(0.55 0.16 300)` | `oklch(0.65 0.18 300)` | 분홍 |
| `--chart-5` | `oklch(0.60 0.18 20)` | `oklch(0.70 0.18 20)` | 빨강 |

## 타이포그래피

- **폰트**: Geist (sans), Geist Mono (mono)
- **기본 크기**: 14px
- **굵기**: medium (500), semibold (600) — light/regular 사용 금지
- **행간**: leading-snug (1.375)

## 간격 & 레이아웃

### 라운드

| 용도 | 값 |
|------|-----|
| 기본 (버튼, 입력) | `rounded-md` (6px) |
| 작은 요소 | `rounded-sm` (4px) |
| 큰 요소 | `rounded-lg` (8px) |
| 12px 이상 금지 | - |

### 보더

```css
/* Linear 스타일: 1px, opacity 60% */
border border-border/60
```

### 호버

```css
/* 미세한 배경 변화 */
hover:bg-foreground/[0.02] dark:hover:bg-foreground/[0.04]
```

## 아이콘

- **라이브러리**: lucide-react
- **strokeWidth**: 1.5 (통일)
- **크기**: 16px (w-4 h-4), 14px (w-3.5 h-3.5)

```tsx
<Search className="w-4 h-4" strokeWidth={1.5} />
```

## 토큰 사용법

### JavaScript/TypeScript

```tsx
import { 
  toneBadgeClassDual, 
  toneDotClassDual, 
  priorityDotClass,
  statusColorClass 
} from "@/lib/tokens"

// 배지 스타일 (light+dark 자동)
<Badge className={toneBadgeClassDual("success")}>완료</Badge>

// 상태 점 (칸반 컬럼용)
<span className={toneDotClassDual(STATUS_TONE[status])} />

// 우선순위 점 (Linear 스타일 - 카드 좌측)
<span className={priorityDotClass("High")} />

// 상태별 텍스트 색상
<span className={statusColorClass("진행중")}>진행중</span>
```

### CSS 변수 직접 사용

```css
.my-element {
  background: var(--surface);
  border: 1px solid color-mix(in oklch, var(--border) 60%, transparent);
  color: var(--foreground);
}
```

## 다크모드 검증 체크리스트

- [ ] 모든 텍스트가 배경과 4.5:1 이상 대비
- [ ] 배지/라벨이 다크에서 흐릿하지 않음
- [ ] 보더가 너무 강하거나 너무 약하지 않음 (60% opacity)
- [ ] 호버 상태가 미묘하게 구분됨
- [ ] 차트 색상이 충분히 밝음

## 파일 구조

```
app/globals.css      # CSS 변수 정의 (:root, .dark)
lib/tokens.ts        # JS 헬퍼 함수 (toneBadgeClassDual 등)
lib/mock-data.ts     # 기존 톤 매핑 (STATUS_TONE, PRIORITY_TONE)
```
