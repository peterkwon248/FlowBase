---
description: 세션 시작 — 핵심은 origin에서 git pull. 여러 컴퓨터에서 작업하므로 최신화가 1순위.
---

# /before-work — 세션 시작 동기화

> **이 명령어가 존재하는 이유**: FlowBase는 여러 컴퓨터에서 번갈아 작업합니다.
> 직전 작업이 다른 컴퓨터에서 origin으로 push돼 있을 수 있으므로, 세션을 시작할 때
> **먼저 origin에서 최신 코드를 받지 않으면 낡은 코드 위에서 작업하게 됩니다.**
> → `before-work`의 본체는 `git pull`. 나머지 단계는 그것을 뒷받침하는 보조입니다.

## 1. ⭐ origin 동기화 — `git pull` (핵심)
- `git fetch`로 origin 최신 상태를 확인합니다.
- 현재 브랜치 / `main`이 origin보다 뒤처졌으면 `git pull` (fast-forward).
- **origin이 항상 source of truth** — 로컬이 origin보다 앞서 보이면 먼저 의심합니다.
- diverge·충돌이 있으면 임의로 `reset`/force 하지 말고 사용자에게 보고합니다.

## 2. 의존성 갱신
`git pull`로 `package.json` / `package-lock.json`이 바뀌었으면 `npm install`을 실행합니다.

## 3. 머신·환경 확인
- 현재 작업 경로·git user를 직전 `SESSION-LOG` entry의 "머신"과 대조합니다.
- 다르면 `NEXT-ACTION.md` "환경 정보"의 경로가 stale일 수 있음을 인지합니다.

## 4. 컨텍스트 파악 (docs 정독)
아래 순서로 읽어 현재 상황을 파악합니다. 누락된 필수 파일이 있으면 skeleton을 만들고 알립니다:
1. `CLAUDE.md` — 가드 룰 + LOCK 상수
2. `docs/MEMORY.md` — Source of Truth (PR history · 합의 결정)
3. `NEXT-ACTION.md` — 다음 즉시 액션
4. `docs/SESSION-LOG.md` — 직전 세션 흐름
5. `docs/CONTEXT.md` · `docs/TODO.md` — Current features · 우선순위 (P0~P3)

## 5. 현황 브리핑
`NEXT-ACTION.md`의 "다음 행동"을 토대로 현재 상태와 다음 액션을 사용자에게 요약하고,
무엇을 진행할지 확인받습니다.

## 6. Local memory rehydrate
`~/.claude/projects/.../memory/`의 프로젝트 메모리를 docs 최신 상태와 대조합니다.
메모리는 보조 캐시이므로 git·docs와 충돌하면 git·docs를 신뢰합니다.
