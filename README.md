# FlowBase

[![CI](https://github.com/peterkwon248/FlowBase/actions/workflows/ci.yml/badge.svg)](https://github.com/peterkwon248/FlowBase/actions/workflows/ci.yml)

> **AI가 초안을 만들고 사람이 확정하는 가벼운 데이터 보드.**
>
> 솔로 창업자/PM이 5분 안에 자신의 운영 데이터를 정리해 매일 들여다볼 수 있게.

## 현재 상태

**Phase 1 (Beta) — 데이터 보드 자체는 거의 완성.** 상용화 기준 ~37%.

- ✅ 제네릭 데이터 보드 (Sheet·Kanban·Gallery·Timeline·Dashboard·Schema)
- ✅ 6 액티비티 모드 (Inbox·Tables·Workspace·Library·Wiki·Search)
- ✅ AI 추천 + 사람 확정 패널 · Import 위저드 · Saved Views · Formula 컬럼
- ✅ ESLint 9 + GitHub Actions CI + husky pre-commit · vitest
- ⬜ BaaS 결정 (Supabase vs bkend.ai) · 인증 · 협업 · 결제 · 모바일 반응형

자세한 계획은 [docs/00-product-plan.md](./docs/00-product-plan.md) 참조.

## 개발

```bash
npm install
npm run dev
# → http://localhost:3000
```

## 문서

- [00-product-plan.md](./docs/00-product-plan.md) — 비전·로드맵·가격
- [01-baas-decision.md](./docs/01-baas-decision.md) — BaaS 선택
- [02-v01-backlog.md](./docs/02-v01-backlog.md) — v0.1 ❌ 분류
- [specs/flowdb-import-flow-spec.md](./docs/specs/flowdb-import-flow-spec.md) — Import flow 상세 spec

## 스택

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind v4 · shadcn/ui · zustand · @phosphor-icons/react + lucide-react · Geist · next-themes
