# FlowDB v1.0 — 상용 MVP 계획서

> **상태**: Draft (2026-04-28)
> **작성자**: 단독 메이커
> **PDCA 단계**: Plan

---

## 1. 비전 한 줄

> **AI가 초안을 만들고 사람이 확정하는 가벼운 데이터 보드.**

Notion DB·Airtable이 무겁고, Supabase는 개발자만 쓸 수 있는 그 중간을 채운다. 솔로 창업자/PM이 5분 안에 자신의 운영 데이터를 정리해 매일 들여다볼 수 있게.

---

## 2. 타겟 사용자 (Q1 답)

| | Primary | Secondary |
|---|---|---|
| 직군 | 솔로 창업자 / 1인 PM | 초기 스타트업의 기획·운영 담당 |
| 환경 | 노션·구글시트 + 메모장 혼용 중 | Airtable 시도했으나 무거워서 이탈 |
| 페인 | "데이터가 흩어져있고 매일 갱신해야 함" | "팀 합류했는데 노션 DB는 너무 자유로워서 망가짐" |
| 가치 | "내가 안 짜도 AI가 초안 만들어줌" | "처음부터 구조 잡혀있어 협업 쉬움" |

→ **수평 SaaS** (도메인 안 가림). 단 첫 진입은 *고객지원 / 리드 / 할 일* 같은 운영 데이터로 유도.

---

## 3. 차별점 (Q2 답)

```
Notion DB     ─ 자유롭다 ─→ "구조 잡기 어려움"           (FlowDB: AI가 초안)
Airtable      ─ 강력하다 ─→ "복잡, 비쌈, 학습곡선 큼"    (FlowDB: 가벼움 + 한국어)
Supabase      ─ 진짜 DB ─→ "개발자만 쓸 수 있음"        (FlowDB: 코드 0줄)
구글시트      ─ 무료다 ─→ "관계·자동화·뷰가 없음"       (FlowDB: 그게 다 됨)
```

**3종 약속**:
1. **AI 초안** — 파일 떨구거나 빈 테이블에서도 AI가 컬럼·타입·관계 추천. 사람은 *확정*만.
2. **3종 보기** — 같은 데이터를 설계(스키마)·테이블·운영(칸반·리스트)으로 즉시 전환.
3. **혼자가 시작 → 팀이 자연스럽게** — 워크스페이스/멤버 모델이 처음부터 박혀있음.

---

## 4. 3단계 로드맵

### Phase 1 — Beta (12주, ~2026-07)

**목표**: 본인이 자기 데이터 넣고 매일 쓸 수 있을 정도.

**필수**:
- 인증 (이메일/구글)
- DB 스키마 v1 — `workspaces`, `users`, `memberships`, `tables_meta`, `fields_meta`, `records`, `relations`, `import_jobs`
- **CSV/Excel import flow** ([flowdb-import-flow-spec.md](./specs/flowdb-import-flow-spec.md) — Phase 1 핵심 기능)
- 빈 테이블에서 시작 (필드 추가/수정/삭제 UI)
- 레코드 CRUD
- 관계 그리기 (Connect 툴 활성화)
- 운영 탭의 칸반/리스트가 *진짜* 데이터로 동작 (현재는 mock)
- 추천 카드 — 적어도 **2종**: import 시 컬럼 타입/PK/FK 추천 + 운영 탭의 미배정 티켓 라우팅 추천
- Vercel 배포 + 도메인

**제외 (Phase 2 이후)**:
- 결제·구독
- 워크스페이스 멤버 초대
- 실시간 동기화
- 고급 자동화 규칙

### Phase 2 — Public Launch (8주, ~2026-09)

- 결제 (Stripe + 토스페이)
- 워크스페이스 멤버 초대 + 권한 (Owner/Admin/Viewer)
- 랜딩 페이지 + 가격 페이지
- 약관 + 개인정보처리방침
- 온보딩 플로우 (3분 가이드)
- Sentry + PostHog 기본 모니터링
- 무료 14일 체험

### Phase 3 — Growth (지속)

- v0.2 PDF/이미지 OCR import (Step 2 화면 재사용)
- 고급 자동화 (조건 → 액션 규칙)
- API 키 발급 + Webhook
- 실시간 동기화 (Supabase Realtime / WebSocket)
- 모바일 친화 (Phase 1은 데스크톱 전용)

---

## 5. 가격 모델 (Q3 답)

| 플랜 | 월 | 한도 |
|---|---|---|
| **Free** | $0 | 1 워크스페이스, 3 테이블, 500 레코드, 1 멤버 |
| **Pro Solo** | $12 | 1 워크스페이스, 무제한 테이블, 10k 레코드, 1 멤버, AI 추천 무제한 |
| **Team** | $29/멤버 | 무제한 워크스페이스, 100k 레코드, 5+ 멤버, 권한, API |
| **Enterprise** | 별도 | SSO, on-premise 옵션, SLA |

**전환 가설**: Free에서 *3 테이블*에 닿는 순간이 paywall 자연 발생점. 5분 안에 import 1회 + 추천 1회 적용 = "이거 내 도구다" 인지.

---

## 6. 기술 스택 (잠정)

| 영역 | 선택 | 결정 문서 |
|---|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript + Tailwind v4 + shadcn | (현재 기반 유지) |
| Backend / DB | Supabase **또는** bkend.ai (Phase 0에서 결정) | [01-baas-decision.md](./01-baas-decision.md) |
| 인증 | Supabase Auth / bkend.ai Auth | ↑ |
| 호스팅 | Vercel (frontend) + BaaS 호스팅 | — |
| 결제 | Stripe (글로벌) + 토스페이 (국내) | — |
| 모니터링 | Sentry (에러) + PostHog (사용 분석) | — |
| 도메인 | flowdb.io 또는 flowdb.app (확인 필요) | — |
| AI 추천 | Claude API (sonnet 4.6 — 컬럼 타입 추론, FK 후보 등) | — |

---

## 7. 1인 일정 가시화 (Q4 답)

```
2026 Q2  ████████████ Phase 1 시작
2026 Q3  ████████████ Phase 1 베타 → Phase 2
2026 Q4  ████████ Phase 2 런칭
2027 Q1+ ────── Phase 3 성장
```

**리스크**:
- 1인 풀타임 가정 시 일정. 파트타임이면 1.5~2배 늘어남.
- AI API 비용이 커지면 free tier 축소 필요.
- 한국어 첫 시장 → 글로벌 확장 시 i18n 부담 (현재 한국어 only).

**마일스톤**:
- W4: BaaS 결정 + DB 스키마 마이그레이션 첫 커밋
- W6: import flow Step 1~2 동작
- W8: 인증 + 빈 테이블 시작 가능
- W10: 관계 그리기 + 운영 탭 실데이터
- W12: 베타 시작 — 본인이 매일 쓰기

---

## 8. 다음 단계

1. ✅ 이 문서 검토
2. ⬜ [01-baas-decision.md](./01-baas-decision.md) 결정 (24h 안)
3. ⬜ [specs/flowdb-import-flow-spec.md](./specs/flowdb-import-flow-spec.md) 상세화
4. ⬜ [02-v01-backlog.md](./02-v01-backlog.md) 우선순위 락
5. ⬜ Phase 1 W1 시작
