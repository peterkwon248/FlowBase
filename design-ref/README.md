# design-ref — FlowBase V2 디자인 핸드오프

> **이 프로젝트의 구현 디자인은 무조건 V2 디자인을 따른다.** (사용자 지정 — 반드시, 무조건)
> 여기 든 V2 핸드오프 + 프로토타입이 디자인의 정본(canon)이다.

`FlowBase-V2` 핸드오프 패키지를 이 repo로 들여온 것. 2026-05-21.
`flowdb-port`의 *현재* UI(3섹션: 설계·데이터·운영)는 구버전 — V2로 전환한다.

## 구성

- `handoff/` — 설계 문서 6개 (README · COMPONENT-MAP · AI-CONTRACTS · IMPORT-SPEC · STATE-SHAPES · 09-phased-rollout)
- `prototype/` — 동작 레퍼런스. 브라우저 Babel 프로토타입. `FlowBase.html`을 브라우저로 열면 실제 동작 확인 가능.

## 작업 규칙

1. **구현 디자인 = V2.** `prototype/FlowBase.html` + `handoff/`를 fidelity 기준으로 삼는다. 재해석·임의 변경 금지.
2. **프로토타입 `.jsx`를 그대로 이식하지 말 것.** 브라우저 Babel + 비-shadcn 코드다. V2 디자인을 flowdb-port의 프로덕션 스택(Next.js 16 · React 19 · shadcn/ui · Tailwind v4)으로 **재구현**한다.
3. **LOCK 룰**(status 색 · Phosphor/lucide · Geist · AI 추천+확정)은 flowdb-port `CLAUDE.md`와 `handoff/`가 일치 — 그대로 준수.
