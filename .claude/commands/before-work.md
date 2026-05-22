---
description: 세션 시작 동기화 — origin 동기화 · 머신 변경 감지 · 필수 docs 정독 · 메모리 rehydrate
---

# /before-work — 세션 시작 동기화

> ⚠️ FlowBase는 여러 머신에서 이어집니다. **origin/main 이 source of truth**,
> local memory(`~/.claude/.../memory/`)는 보조 캐시일 뿐입니다. 충돌 시 git·docs를 신뢰하세요.

아래 단계를 0번부터 순서대로 수행합니다.

## 0. Bootstrap — 필수 docs 확인
다음 파일이 없으면 skeleton을 생성하고 사용자에게 알립니다:
`CLAUDE.md` · `docs/MEMORY.md` · `NEXT-ACTION.md` · `docs/SESSION-LOG.md` · `docs/CONTEXT.md` · `docs/TODO.md`

## 1. origin 동기화
- `git fetch` 후 현재 브랜치와 `main` 상태를 비교합니다.
- `main`에 새 커밋이 있으면 fast-forward로 pull 합니다.
- diverge·충돌이 있으면 임의로 `reset`/force 하지 말고 사용자에게 보고합니다.

## 2. 머신 변경 감지
- 현재 작업 경로·git user를 직전 `SESSION-LOG` entry의 "머신"과 대조합니다.
- 다르면 `NEXT-ACTION.md` "환경 정보"의 경로가 stale일 수 있음을 경고합니다.

## 3. 필수 docs 정독 (참고 순서)
1. `CLAUDE.md` — 가드 룰 + LOCK 상수
2. `docs/MEMORY.md` — Source of Truth (PR history · 합의 결정)
3. `NEXT-ACTION.md` — 다음 즉시 액션
4. `docs/SESSION-LOG.md` — 직전 세션 흐름
5. `docs/CONTEXT.md` — Current features
6. `docs/TODO.md` — 우선순위 (P0~P3)

## 4. LOCK 상수 인지
`CLAUDE.md`의 override 금지 항목 확인: Status 색 매핑 · Phosphor/Geist · FlowBase 명칭 · 디자인 우선순위 1·2·3.

## 5. 환경 준비
필요 시 `npm install` 등 의존성·환경을 준비합니다 (머신이 바뀌었거나 lockfile이 갱신된 경우).

## 6. 현황 브리핑
`NEXT-ACTION.md`의 "다음 행동"을 토대로 현재 상태와 다음 액션을 사용자에게 요약 보고하고,
무엇을 진행할지 확인받습니다.

## 7. Local memory rehydrate
`~/.claude/projects/.../memory/`의 프로젝트 메모리를 docs 최신 상태와 대조합니다.
stale하면 갱신, 누락되면 작성합니다.
