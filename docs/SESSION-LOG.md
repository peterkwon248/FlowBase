# SESSION-LOG

세션 history (append-only). 가장 최근 entry가 위.

---

## 2026-05-04 오후 (집)

### 완료
- **txt 블록 자동 분류 PoC 구현 + 머지** — PR #1 (`feat: txt 블록 자동 분류 PoC`, `fac55e1`)
  - `lib/parsers/txt-block-parser.ts`: `***` 구분자 + `<헤더>` 정규식 + 8개 카테고리 키워드 추론 (60줄 순수 함수)
  - `app/txt-poc/page.tsx`: 검증 페이지 (드롭존 + 표 + 카테고리 분포 Badge), 사이드바 진입점 없음
  - 사용자 데이터 `머레이 상황별 템플릿.txt` 231 블록 → 8 카테고리 분포 검증 완료
- **글로벌 명령어 강화**: `~/.claude/commands/{after-work,before-work}.md`
  - 상단 경고: "크로스-머신 동기화. local memory는 보조 캐시"
  - **단계 0 Bootstrap** 추가 (필수 docs 누락 시 skeleton 자동 생성)
  - after-work 단계 5: docs staging 검증, 단계 8: Merge 보호 명시
  - before-work 머신 변경 감지를 단계 2로 위로 이동, 단계 7: docs → local rehydrate
- **Local memory 작성**: `feedback_workflow_skills.md` + `project_flowdb_status.md` + `MEMORY.md` 인덱스
- **Docs bootstrap (이번 entry)**: `docs/{SESSION-LOG, MEMORY, CONTEXT, TODO}.md` 신규 + `NEXT-ACTION.md` 갱신

### 브레인스토밍 & 큰 결정
- **chartdb.io 비교**: chartdb는 *DB 스키마 설계* 도구, FlowDB는 *데이터 정리* 도구. 도메인 다름. 정적+LLM 분기 패턴은 참고할 만함. DBML export로 두 도구 협력 가능.
- **디스플레이 자동 추천 원칙 합의**: "모두 항상 다 있다" ❌, "데이터 도메인이 허용할 때만 활성화" ✓ (Notion/Airtable 비대 함정 회피)
- **다음 라운드 3 후보 정리**: 시트 뷰(★★★★★) / 사람 확정 UI(★★★★) / LLM 하이브리드(★★★) — 우선순위 A ≫ B ≫ C
- **워크스페이스 진입점**: 클릭 핸들러 없는 게 *의도적* placeholder ([docs/02-v01-backlog.md:99](02-v01-backlog.md)). W11 작업.
- **PR #1은 머지까지 완료** — `gh pr merge --merge --delete-branch` 단번에

### 다음
**NEXT-ACTION.md 의 다음 행동 3 후보 중 선택. 추천: 옵션 A (시트 뷰).**

### Watch Out
- ⚠️ **after-work 일반 안전 원칙으로 머지 단계 자의적 누락 금지** — 이번 세션 초기에 머지를 옵션으로 제시했다가 호된 지적 받음. 명령어 정의 자체가 명시 승인 단위. 강화된 명령어 정의에 명시 박힘.
- ⚠️ **워크트리 함정**: `.claude/worktrees/` 안은 Plot 노트앱용. FlowDB 코드는 `flowdb-port/` 메인 working tree에. 이번 세션에서 worktree 안에 있으면서 절대경로로 메인에 직접 작성, 별도 처리 단계 필요했음.
- `"원"` 키워드 광범위 false positive — "가격 59" 분류 일부 의심. 옵션 C 안 가도 옵션 A·B 진행 중에 정밀화 백로그.

### 머신
집
