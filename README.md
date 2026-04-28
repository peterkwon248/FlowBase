# FlowDB

> **AI가 초안을 만들고 사람이 확정하는 가벼운 데이터 보드.**
>
> 솔로 창업자/PM이 5분 안에 자신의 운영 데이터를 정리해 매일 들여다볼 수 있게.

## 현재 상태

**Phase 0 — Plan 단계 완료.** Phase 1 (Beta) 시작 직전.

- ✅ Claude Design 앱 기능 이식 (설계·데이터·운영 3 섹션)
- ✅ shadcn/ui 기반 디자인 시스템
- ✅ 메모리상 mock 데이터로 인터랙션 검증
- ⬜ BaaS 결정 (Supabase vs bkend.ai)
- ⬜ 인증·DB·CRUD·import flow

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

Next.js 16 · TypeScript · Tailwind v4 · shadcn/ui · lucide-react · next-themes
