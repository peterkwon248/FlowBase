# NEXT-ACTION

> 다음 세션 시작 시 이 파일부터 읽으세요.
> 마지막 갱신: 2026-04-28

---

## 한 줄 요약

**Phase 0 (Plan) 완료. 다음 갈림길: BaaS PoC 또는 Import Step 2 목업 — 둘 중 하나 시작.**

---

## 현재 상태

### ✅ 완료
- Claude Design 앱 기능을 FlowDB 3 섹션(설계·데이터·운영)에 이식
- shadcn/ui 기반 UI 동작 (드래그·정렬·SQL 모달·테이블 추가·Drawer·추천 Rail 등)
- v0.1 코드 감사 완료 (백로그 분류: 🟢 24 / 🟡 13 / 🔴 1)
- 4개 기획 문서 작성 ([docs/](./docs/))
- GitHub 레포 분리 + 첫 푸시 (peterkwon248/flowdb, private)
- `.claude/launch.json` — Claude 미리보기 자동 인식 설정 포함

### ⬜ 결정 대기
- **BaaS 선택**: Supabase vs bkend.ai ([01-baas-decision.md](./docs/01-baas-decision.md))
- **다음 작업 선택**: PoC 먼저 vs 목업 먼저

### ⬜ 미해결 cleanup
- 이미 커밋된 자잘한 v0 sandbox 잔재 (placeholder 이미지 등) — 베타 전 정리

---

## 다음 행동 — 두 갈래 (택 1)

### 옵션 A. BaaS PoC 먼저 (24h)
**왜**: Phase 1 W1 시작 전 BaaS 결정이 락. 빠를수록 좋음.

**행동**:
1. `git checkout -b feat/baas-poc`
2. bkend-expert 에이전트 spawn → [01-baas-decision.md §4의 3가지 확인](./docs/01-baas-decision.md) 수행
   - DB 스키마 마이그레이션 도구
   - RLS (워크스페이스 단위 권한)
   - 무료 한도 + 가격 곡선
3. 결과로 [01-baas-decision.md §6](./docs/01-baas-decision.md) "결정" 섹션 채움
4. PR → main 머지

### 옵션 B. Import Step 2 목업 먼저 (24h)
**왜**: Phase 1의 가장 무거운 단일 작업. 시각화하면 spec 보완점이 빨리 드러남.

**행동**:
1. `git checkout -b feat/import-mockup`
2. `app/import/page.tsx` 신규 라우트 — Step 1·1.5·2·3 화면 정적 HTML/Tailwind
3. 실제 파일 파싱은 `papaparse` + 클라이언트만 (DB 연결 ❌)
4. AI 추천 카드는 mock 데이터로 시뮬레이션
5. PR → main 머지
6. 본인이 자기 CSV 떨어뜨려보며 spec 누락점 찾기

→ 산출물 본 뒤 [flowdb-import-flow-spec.md](./docs/specs/flowdb-import-flow-spec.md) 보강 → Phase 1 W3 본격 구현

---

## 환경 정보

| | |
|---|---|
| 코드 위치 | `C:\Users\kwonkyunghun\Desktop\FlowDB\flowdb-port` |
| GitHub 레포 | https://github.com/peterkwon248/flowdb (private) |
| 미리보기 URL | http://localhost:3000 (`npm run dev`) |
| Reference (gitignore 외부) | `C:\Users\kwonkyunghun\Desktop\FlowDB\claude_design_ref` |
| 다른 프로젝트 워크트리 (혼동 금지) | `C:\Users\kwonkyunghun\Desktop\FlowDB\.claude\worktrees\` — Plot 노트앱용, 무관 |

---

## 작업 흐름 (다음부터)

```bash
# 새 작업 시작
cd C:\Users\kwonkyunghun\Desktop\FlowDB\flowdb-port
git checkout main && git pull
git checkout -b feat/<작업명>

# 작업 후
git add . && git commit -m "feat: ..."
git push -u origin feat/<작업명>
gh pr create --base main

# 머지 후
git checkout main && git pull
git branch -d feat/<작업명>
```

---

## 빠뜨리지 말 것

- **AI 추천은 항상 카드 형태 + 사람 확정** — 본 제품의 핵심 신뢰 모델 (자동 적용 ❌)
- **모든 결정 되돌릴 수 있음** — 30일 rollback이 import flow의 백스톱
- **3 진입점 분리** — 빈 새 테이블 / 파일→새 / 파일→기존
- **상용화 타임라인**: 1인 풀타임 시 12주 → 베타, +8주 → 런칭
