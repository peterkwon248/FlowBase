---
description: 세션 종료 마무리 — 검증 · 커밋 · 푸시 · docs 갱신 · main 머지(명시 승인) · 메모리 갱신
---

# /after-work — 세션 종료 마무리

> **이 명령어가 존재하는 이유**: FlowBase는 여러 컴퓨터에서 번갈아 작업합니다.
> 이번 세션 작업을 origin에 push·머지해 두지 않으면 다음 컴퓨터에서 이어받을 수 없습니다.
> → `after-work`의 본체는 **커밋 → push → main 머지** — 작업 결과를 origin에 안전하게 올리는 것입니다.

> ⚠️ **단계 8(Merge)은 무조건 포함됩니다.** 사용자 명시 확인 없이 main 머지·push가 수행됩니다 (2026-05-23 정책 변경). 누락·옵션화 ❌.

아래 단계를 0번부터 순서대로 수행합니다.

## 0. 작업 결과 정리
이번 세션의 완료 항목 · 큰 결정 · 미해결 항목을 정리합니다.

## 1. 검증
`npx tsc --noEmit` (또는 `npm run build`) · `npm test` (vitest)가 green인지 확인합니다.
실패 시 보고 후 수정합니다.

## 2. staging 검토
변경 파일을 확인하고 의도한 것만 stage 합니다.
- incidental 변경 주의: `next-env.d.ts`(빌드 생성물) · `package-lock.json`(npm install)
- 비밀 파일(`.env*.local`)은 절대 커밋하지 않습니다.

## 3. 커밋
작업 브랜치에 커밋합니다. 메시지는 repo 컨벤션(`feat:` · `fix:` · `docs:` …)을 따릅니다.

## 4. push
`origin`의 작업 브랜치로 push 합니다.

## 5. docs 갱신
- `docs/SESSION-LOG.md` — 이번 세션 entry 추가 (완료 · 큰 결정 · 검증 · 다음 · Watch Out · 머신)
- `NEXT-ACTION.md` — 다음 액션 · 날짜 · 머신 갱신
- `docs/CONTEXT.md` · `docs/TODO.md` · `docs/MEMORY.md` — 정합성 갱신
- **docs 변경이 staging에 포함됐는지 검증합니다.**

## 6. docs 커밋·push
docs 갱신을 커밋(`docs:` …)하고 push 합니다.

## 7. Local memory 갱신
`~/.claude/projects/.../memory/`의 프로젝트 상태 메모리를 이번 세션 결과로 갱신합니다.

## 8. main 머지 — 무조건 포함
브랜치를 `main`에 머지·push 합니다. **사용자 명시 확인 없이 진행** — after-work에 항상 포함되는 필수 단계 (2026-05-23 정책 변경).

머지 방식:
- 워크트리에선 직접 main checkout 불가 → `git push origin HEAD:main` (fast-forward).
- 충돌·non-FF면 사용자에게 보고하고 멈춤.
