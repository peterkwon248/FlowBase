/* @jsx React.createElement */
// FlowBase Wiki — long-form knowledge pages with Owner + Verified metadata.

const { useState: useWkS, useMemo: useWkM, useEffect: useWkE, useRef: useWkR } = React;

// ─────────────────────────────────────────────────────────────
// Seed pages — includes Library concept explainer (per user request)
// ─────────────────────────────────────────────────────────────

const SEED_PAGES = [
  {
    id: "wiki-library-intro",
    title: "Library 가이드",
    category: "Concepts",
    owner: "peter",
    verified: true,
    verifiedAt: "2026-05-15",
    expiresAt: "2026-08-15",
    updatedAt: "2026-05-17",
    body: `# Library는 무엇인가

Library는 워크스페이스의 **재사용 가능한 정의 저장소**입니다. 셀의 옵션, 컬럼 정의, 테이블 템플릿, 자동 채움 로직을 한 곳에 모아두고, 어디서든 가져다 씁니다.

스프레드시트와 결정적 차이: 같은 dropdown을 5개 테이블에서 쓸 때, Library에서는 **한 번만 정의**합니다. 옵션 하나 추가하면 5군데 모두 즉시 업데이트.

## 4가지 자산

### 📜 Option Lists
공유 가능한 옵션 집합입니다. 예: \`@모델명\` (M-PEN-III, POGOPIN, DWHM-1 …), \`@처리방식\`, \`@사업부\`.

같은 옵션 리스트를 여러 컬럼이 공유합니다. \`주문모델\` 컬럼과 \`반품모델\` 컬럼이 같은 \`@모델명\` 리스트를 참조하면, 한 옵션을 추가했을 때 두 컬럼 모두에 즉시 반영됩니다.

### 🏷 Fields
컬럼 정의 한 패키지입니다. 이름 + 타입 + 옵션 + 기본값 + 검증 규칙을 묶었습니다.

예: \`@접수일\` = { date, required, default: today, validation: 미래 날짜 불가 }

새 테이블에 컬럼 추가할 때 \`@접수일\`을 가져오면 위 모든 설정이 자동으로 적용됩니다.

### 📦 Templates
여러 Field의 묶음 + 권장 view 설정입니다. CS팀의 \`@CS 케이스\` 템플릿은 6개 필드 + Board view 권장 + 처리상태 기준 그룹핑까지 포함합니다.

새 테이블을 만들 때 템플릿을 선택하면 5초 안에 완성된 구조를 갖춥니다.

### ƒ Functions
재사용 가능한 스마트 함수입니다. (이전 이름: Rules)

- \`MATCH_FROM_DROPDOWN\` — 텍스트에서 옵션 자동 추출
- \`AI_CLASSIFY\` — Claude가 의미 분석해서 분류
- \`EXTRACT_REGEX\` — 정규식 추출

스프레드시트 함수와 다른 점: **데이터베이스를 안다**. \`MATCH_FROM_DROPDOWN(상품명, @모델명)\`은 Library의 모델명 옵션을 직접 참조합니다.

## Tables와의 관계

| 작업 | Tables에서 | Library에서 |
|---|---|---|
| 컬럼 추가 | "+" 버튼 → Library Field 선택 | Field 정의 자체를 만들거나 수정 |
| 옵션 추가 | 셀에서 직접 입력 | @옵션리스트 자산에 추가 → 모든 사용처 반영 |
| 새 테이블 | Schema에서 Template 선택 | Template 자체를 정의/관리 |

## Promote — 양방향

Library에 미리 만들지 않아도 됩니다. Tables에서 자유롭게 dropdown을 만들고, "이 dropdown 다른 테이블에서도 쓸 듯" 하면 컬럼 헤더 "..." → **Promote to Library**로 자산화.`,
  },
  {
    id: "wiki-cs-runbook",
    title: "CS 케이스 처리 절차",
    category: "Runbooks",
    owner: "peter",
    verified: true,
    verifiedAt: "2026-05-10",
    expiresAt: "2026-06-10",
    updatedAt: "2026-05-10",
    body: `# CS 케이스 처리 절차

## 신규 케이스 등록
1. 고객 문의 채널 (메일/카톡/네이버톡톡) 확인
2. Tasks 테이블 → "+ 새 행" → 자동 채움된 모델명 검토
3. 처리방식 자동 분류 결과 확인 (✨ 표시되어 있음)
4. 필요 시 수동 보정

## 처리방식 결정 기준
- **단순변심**: 7일 이내, 미사용
- **변심교환 (오주문)**: 고객이 모델 잘못 주문
- **불량교환 / 불량환불**: 제품 결함
- **A/S**: 보증 기간 내 수리 가능 건
- **오배송 교환 / 환불**: 우리 측 배송 실수
- **택배사 사고 교환 / 환불**: 운송 중 파손

## 처리상태 워크플로우
\`수거접수\` → \`검수중\` → \`대기\` → \`완료\`

각 전환 시 Board view에서 드래그 또는 셀 직접 수정.`,
  },
  {
    id: "wiki-keyboard-shortcuts",
    title: "키보드 단축키",
    category: "Reference",
    owner: "peter",
    verified: true,
    verifiedAt: "2026-05-12",
    expiresAt: "2026-11-12",
    updatedAt: "2026-05-12",
    body: `# 키보드 단축키

## 패널 토글
- \`⌘B\` — AI 패널
- \`⌘⇧A\` — Activity bar
- \`⌘⇧F\` — Sidebar

## 편집
- \`⌘Z\` — 실행 취소
- \`⌘⇧Z\` — 다시 실행
- \`Delete\` / \`Backspace\` — 선택된 행 삭제

## 검색
- \`⌘K\` — 빠른 검색`,
  },
  {
    id: "wiki-onboarding",
    title: "신입 온보딩",
    category: "Onboarding",
    owner: "minji",
    verified: false,
    verifiedAt: null,
    expiresAt: null,
    updatedAt: "2026-05-05",
    body: `# 신입 온보딩 (작성중)

## Day 1
- 워크스페이스 투어
- Library 핵심 자산 4개 소개
- 첫 케이스 처리 따라하기

## Day 2-3
- Schema에서 테이블 관계 이해
- Automations 흐름 학습

(이 문서는 작성 중입니다. Verified 안 됨)`,
  },
  {
    id: "wiki-glossary",
    title: "용어집",
    category: "Reference",
    owner: "peter",
    verified: true,
    verifiedAt: "2026-04-30",
    expiresAt: "2026-10-30",
    updatedAt: "2026-04-30",
    body: `# 용어집

**Library** — 워크스페이스의 재사용 가능한 정의 저장소.
**Option List** — dropdown/태그의 옵션 집합.
**Field** — 컬럼 정의 패키지 (타입+옵션+검증 등).
**Template** — 여러 필드의 묶음 + 권장 view.
**Function** — 셀에 값을 자동으로 채우는 재사용 가능한 로직.
**Schema** — 워크스페이스의 테이블 구조와 관계.
**Automation** — 행/이벤트 트리거 워크플로우 (Tables 간).
**Promote** — 테이블에서 만든 정의를 Library로 승격.
**Cascade** — Library 자산 수정이 모든 사용처에 자동 반영.
**Smart fill** — 새 컬럼에 자동 채움 로직 (Function) 연결.`,
  },
  {
    id: "wiki-team",
    title: "팀 디렉토리",
    category: "Team",
    owner: "peter",
    verified: true,
    verifiedAt: "2026-05-01",
    expiresAt: "2026-08-01",
    updatedAt: "2026-05-01",
    body: `# 팀 디렉토리

## CS 팀
- **민지호** — Head of CS · 케이스 우선순위 결정
- **한승호** — CS Specialist · 단순변심/교환 담당
- **박서연** — CS Specialist · 불량/A/S 담당

## Product
- **peter** — PM · 워크스페이스 운영
- **Daniel Park** — Eng Lead · Smart fill / Functions

## 보고 라인
민지호 → peter (매주 월요일 1:1)`,
  },
];

const WIKI_CATEGORIES = ["All", "Concepts", "Runbooks", "Reference", "Onboarding", "Team"];

// ─────────────────────────────────────────────────────────────
// Wiki sidebar — category list + page tree
// ─────────────────────────────────────────────────────────────

const WikiSidebar = ({ pages, selectedId, selectedCategory, onSelectPage, onSelectCategory, onNewPage }) => {
  const grouped = useWkM(() => {
    const out = {};
    pages.forEach(p => {
      const cat = p.category || "Uncategorized";
      if (!out[cat]) out[cat] = [];
      out[cat].push(p);
    });
    return out;
  }, [pages]);
  const cats = Object.keys(grouped);
  const [collapsed, setCollapsed] = useWkS({});
  const allCollapsed = cats.length > 0 && cats.every(c => collapsed[c]);
  const toggleAll = () => {
    const next = !allCollapsed;
    const o = {};
    cats.forEach(c => { o[c] = next; });
    setCollapsed(o);
  };

  return (
    <aside style={{
      width: 260, flexShrink: 0,
      background: "var(--sidebar-bg)",
      borderRight: "1px solid var(--sidebar-border)",
      display: "flex", flexDirection: "column",
      fontSize: 13.5,
    }}>
      <div style={{
        padding: "10px 12px 8px",
        borderBottom: "1px solid var(--sidebar-border)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{
          width: 22, height: 22, borderRadius: 5,
          background: "color-mix(in oklch, var(--chart-3) 22%, transparent)",
          color: "var(--chart-3)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          <IconWiki size={13} />
        </span>
        <span style={{ fontWeight: 600 }}>Wiki</span>
        <div style={{ flex: 1 }} />
        <button onClick={toggleAll} title={allCollapsed ? "Expand all" : "Collapse all"} style={{
          background: "transparent", border: "none", color: "var(--sidebar-muted)",
          padding: 2, borderRadius: 4, cursor: "pointer", display: "flex",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {!allCollapsed ? (
              <><polyline points="17 11 12 6 7 11" /><polyline points="17 18 12 13 7 18" /></>
            ) : (
              <><polyline points="7 13 12 18 17 13" /><polyline points="7 6 12 11 17 6" /></>
            )}
          </svg>
        </button>
        <button onClick={onNewPage} title="New page" style={{
          background: "transparent", border: "none", color: "var(--sidebar-muted)",
          padding: 2, borderRadius: 4, cursor: "pointer", display: "flex",
        }}>
          <IconPlus size={14} />
        </button>
      </div>

      <div className="fb-scroll" style={{ flex: 1, overflowY: "auto", padding: "8px 6px 12px" }}>
        {Object.keys(grouped).sort().map(cat => {
          const isCollapsed = !!collapsed[cat];
          return (
          <div key={cat} style={{ marginBottom: 4 }}>
            <button onClick={() => setCollapsed(c => ({ ...c, [cat]: !c[cat] }))} style={{
              display: "flex", alignItems: "center", gap: 4,
              width: "100%", padding: "6px 8px 4px",
              fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em",
              textTransform: "uppercase", color: "var(--sidebar-muted)",
              background: "transparent", border: "none", cursor: "pointer", textAlign: "left",
            }}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isCollapsed ? "rotate(-90deg)" : "none", transition: "transform 120ms ease" }}>
                <polyline points="6 9 12 15 18 9" />
              </svg>
              <span>{cat}</span>
            </button>
            {!isCollapsed && grouped[cat].map(p => {
              const active = p.id === selectedId;
              return (
                <button key={p.id} onClick={() => onSelectPage(p.id)} style={{
                  display: "flex", alignItems: "center", gap: 6,
                  width: "100%", padding: "5px 10px", borderRadius: 5,
                  border: "none",
                  background: active ? "var(--active-bg-strong)" : "transparent",
                  color: active ? "var(--foreground)" : "var(--sidebar-text, var(--foreground))",
                  cursor: "pointer", textAlign: "left",
                  fontSize: 12.5, fontWeight: active ? 500 : 400,
                  position: "relative",
                }}
                onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--hover-bg)"; }}
                onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                  {active && <span style={{ position: "absolute", left: 2, top: 5, bottom: 5, width: 2, background: "var(--primary)", borderRadius: 1 }} />}
                  <IconFile size={11} style={{ color: p.verified ? "var(--status-done-fg)" : "var(--sidebar-muted)", flexShrink: 0 }} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.title}</span>
                  {!p.verified && (
                    <span title="Unverified" style={{
                      fontSize: 9, padding: "0 4px", borderRadius: 2,
                      background: "color-mix(in oklch, var(--destructive) 14%, transparent)",
                      color: "var(--destructive)", fontWeight: 600,
                    }}>DRAFT</span>
                  )}
                </button>
              );
            })}
          </div>
          );
        })}
      </div>

      <div style={{
        padding: "10px 14px",
        borderTop: "1px solid var(--sidebar-border)",
        fontSize: 11, color: "var(--sidebar-muted)", lineHeight: 1.5,
      }}>
        검증된 지식,<br />소유자가 보장.
      </div>
    </aside>
  );
};

// ─────────────────────────────────────────────────────────────
// Wiki main view — page header (owner / verified) + markdown body
// ─────────────────────────────────────────────────────────────

const WikiView = ({
  pages, selectedId, onSelectPage, onUpdatePage,
  theme, setTheme, panels, onTogglePanel, onShowAllPanels, onHideAllPanels,
  navSlot,
}) => {
  const [wikiSearch, setWikiSearch] = useWkS("");
  const page = pages.find(p => p.id === selectedId) || pages[0];

  const breadcrumb = (
    <>
      <span style={{ color: "var(--muted-foreground)" }}>peter's workspace</span>
      <span style={{ color: "var(--muted-foreground)", opacity: 0.5, margin: "0 6px" }}>/</span>
      <span style={{ color: "var(--muted-foreground)" }}>Wiki</span>
      {page && (
        <>
          <span style={{ color: "var(--muted-foreground)", opacity: 0.5, margin: "0 6px" }}>/</span>
          <span style={{ color: "var(--muted-foreground)" }}>{page.category}</span>
          <span style={{ color: "var(--muted-foreground)", opacity: 0.5, margin: "0 6px" }}>/</span>
          <span style={{ fontWeight: 600 }}>{page.title}</span>
        </>
      )}
    </>
  );

  return (
    <main style={{
      flex: 1, display: "flex", flexDirection: "column",
      minWidth: 0, background: "var(--background)",
    }}>
      <InteractiveHeader
        theme={theme} setTheme={setTheme}
        search={wikiSearch} onSearch={setWikiSearch}
        breadcrumb={breadcrumb}
        leadingSlot={panels && onTogglePanel ? (
          <PanelsMenu panels={panels} onToggle={onTogglePanel} onShowAll={onShowAllPanels} onHideAll={onHideAllPanels} />
        ) : null}
        navSlot={navSlot}
      />
      {page ? (
        <WikiPage page={page} onUpdate={(patch) => onUpdatePage(page.id, patch)} />
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted-foreground)", fontSize: 13 }}>
          좌측에서 페이지를 선택하거나 새로 만드세요.
        </div>
      )}
    </main>
  );
};

// ─────────────────────────────────────────────────────────────
// Page detail
// ─────────────────────────────────────────────────────────────

const WikiPage = ({ page, onUpdate }) => {
  const today = new Date().toISOString().slice(0, 10);
  const isExpired = page.expiresAt && page.expiresAt < today;
  const daysLeft = page.expiresAt
    ? Math.ceil((new Date(page.expiresAt).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="fb-scroll" style={{ flex: 1, overflowY: "auto", padding: "24px 40px 80px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>

        {/* Verified banner */}
        {page.verified && isExpired && (
          <div style={{
            padding: "9px 14px", borderRadius: 7, marginBottom: 16,
            background: "color-mix(in oklch, var(--destructive) 14%, transparent)",
            border: "1px solid color-mix(in oklch, var(--destructive) 30%, transparent)",
            color: "var(--destructive)", fontSize: 12.5, fontWeight: 500,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span>⚠️</span>
            <span>검증 만료됨 ({page.expiresAt} 이전). Owner의 재검증이 필요합니다.</span>
            <div style={{ flex: 1 }} />
            <button onClick={() => onUpdate({
              verifiedAt: today,
              expiresAt: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
            })} style={{
              padding: "3px 10px", borderRadius: 5, border: "none",
              background: "var(--destructive)", color: "var(--background)",
              fontSize: 11.5, fontWeight: 600, cursor: "pointer",
            }}>Re-verify</button>
          </div>
        )}

        {/* Title */}
        <h1 style={{
          fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em",
          margin: "0 0 8px",
        }}>{page.title}</h1>

        {/* Metadata row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
          fontSize: 12, color: "var(--muted-foreground)",
          paddingBottom: 14, marginBottom: 20,
          borderBottom: "1px solid var(--border-subtle)",
        }}>
          <span>{page.category}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{
              width: 18, height: 18, borderRadius: "50%",
              background: "linear-gradient(135deg, var(--chart-2), var(--chart-4))",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              color: "white", fontSize: 9, fontWeight: 700,
            }}>{(page.owner || "?")[0].toUpperCase()}</span>
            <span>Owner: <b style={{ color: "var(--foreground)", fontWeight: 600 }}>{page.owner}</b></span>
          </span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>Last updated: {page.updatedAt}</span>
          <div style={{ flex: 1 }} />
          {page.verified && !isExpired ? (
            <span title={`Verified by ${page.owner} on ${page.verifiedAt}. Expires ${page.expiresAt} (${daysLeft}d left).`}
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                padding: "2px 9px", borderRadius: 999,
                background: "var(--status-done-bg)",
                color: "var(--status-done-fg)",
                fontSize: 11.5, fontWeight: 600,
              }}>
              <IconCheck size={10} />
              Verified · {daysLeft}d left
            </span>
          ) : !page.verified ? (
            <button onClick={() => onUpdate({
              verified: true,
              verifiedAt: today,
              expiresAt: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
            })} style={{
              padding: "2px 10px", borderRadius: 999,
              background: "transparent", border: "1px dashed var(--border)",
              color: "var(--muted-foreground)", fontSize: 11.5, fontWeight: 500, cursor: "pointer",
            }}>Mark as verified</button>
          ) : null}
        </div>

        {/* Body */}
        <MarkdownBody source={page.body || ""} />

      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Minimal markdown renderer — headings, lists, code, tables, bold/italic
// ─────────────────────────────────────────────────────────────

const MarkdownBody = ({ source }) => {
  const blocks = useWkM(() => parseMarkdown(source), [source]);
  return (
    <div style={{
      fontSize: 14, lineHeight: 1.7, color: "var(--foreground)",
    }}>
      {blocks.map((b, i) => renderBlock(b, i))}
    </div>
  );
};

function parseMarkdown(src) {
  const lines = src.split("\n");
  const blocks = [];
  let cur = null;
  const flush = () => { if (cur) { blocks.push(cur); cur = null; } };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const hMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (hMatch) {
      flush();
      blocks.push({ kind: "heading", level: hMatch[1].length, text: hMatch[2] });
      continue;
    }
    const liMatch = line.match(/^[-*]\s+(.+)$/);
    if (liMatch) {
      if (!cur || cur.kind !== "ul") { flush(); cur = { kind: "ul", items: [] }; }
      cur.items.push(liMatch[1]);
      continue;
    }
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (!cur || cur.kind !== "ol") { flush(); cur = { kind: "ol", items: [] }; }
      cur.items.push(olMatch[1]);
      continue;
    }
    if (line.startsWith("|") && line.includes("|", 1)) {
      if (!cur || cur.kind !== "table") { flush(); cur = { kind: "table", rows: [] }; }
      const cells = line.split("|").slice(1, -1).map(s => s.trim());
      if (cells.every(c => /^[-:]+$/.test(c))) continue; // separator
      cur.rows.push(cells);
      continue;
    }
    if (line.trim() === "") { flush(); continue; }
    // paragraph
    if (!cur || cur.kind !== "p") { flush(); cur = { kind: "p", text: line }; }
    else cur.text += " " + line;
  }
  flush();
  return blocks;
}

function renderInline(text) {
  // Inline code, bold, italic
  const out = [];
  let rest = text;
  let key = 0;
  while (rest.length > 0) {
    const codeM = rest.match(/`([^`]+)`/);
    const boldM = rest.match(/\*\*([^*]+)\*\*/);
    const cands = [codeM, boldM].filter(Boolean);
    if (cands.length === 0) { out.push(rest); break; }
    const next = cands.reduce((a, b) => (a.index < b.index ? a : b));
    if (next.index > 0) out.push(rest.slice(0, next.index));
    if (next === codeM) {
      out.push(<code key={"c" + key++} style={{
        fontFamily: "var(--font-mono)", fontSize: "0.88em",
        background: "var(--muted)", padding: "1px 6px", borderRadius: 3,
      }}>{next[1]}</code>);
    } else {
      out.push(<b key={"b" + key++} style={{ fontWeight: 600 }}>{next[1]}</b>);
    }
    rest = rest.slice(next.index + next[0].length);
  }
  return out;
}

function renderBlock(b, key) {
  if (b.kind === "heading") {
    const sizes = { 1: 24, 2: 19, 3: 15.5 };
    const margins = { 1: "30px 0 12px", 2: "26px 0 10px", 3: "20px 0 8px" };
    const Tag = b.level === 1 ? "h2" : b.level === 2 ? "h3" : "h4";
    return <Tag key={key} style={{
      fontSize: sizes[b.level], fontWeight: 700, letterSpacing: "-0.01em",
      margin: margins[b.level], color: "var(--foreground)",
    }}>{renderInline(b.text)}</Tag>;
  }
  if (b.kind === "p") {
    return <p key={key} style={{ margin: "0 0 12px" }}>{renderInline(b.text)}</p>;
  }
  if (b.kind === "ul") {
    return <ul key={key} style={{ margin: "0 0 12px", paddingLeft: 22 }}>
      {b.items.map((it, i) => <li key={i} style={{ margin: "4px 0" }}>{renderInline(it)}</li>)}
    </ul>;
  }
  if (b.kind === "ol") {
    return <ol key={key} style={{ margin: "0 0 12px", paddingLeft: 22 }}>
      {b.items.map((it, i) => <li key={i} style={{ margin: "4px 0" }}>{renderInline(it)}</li>)}
    </ol>;
  }
  if (b.kind === "table") {
    const [head, ...rest] = b.rows;
    return (
      <div key={key} style={{
        margin: "0 0 16px", borderRadius: 7,
        border: "1px solid var(--border-subtle)", overflow: "hidden",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          {head && (
            <thead><tr>{head.map((c, i) => (
              <th key={i} style={{ padding: "8px 12px", textAlign: "left",
                background: "var(--muted)", color: "var(--muted-foreground)",
                fontSize: 11, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase",
                borderBottom: "1px solid var(--border-subtle)",
              }}>{renderInline(c)}</th>
            ))}</tr></thead>
          )}
          <tbody>
            {rest.map((row, ri) => (
              <tr key={ri}>{row.map((c, ci) => (
                <td key={ci} style={{
                  padding: "8px 12px", verticalAlign: "top",
                  borderBottom: ri < rest.length - 1 ? "1px solid var(--border-subtle)" : "none",
                }}>{renderInline(c)}</td>
              ))}</tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  return null;
}

Object.assign(window, {
  SEED_PAGES, WIKI_CATEGORIES,
  WikiSidebar, WikiView, WikiPage,
});
