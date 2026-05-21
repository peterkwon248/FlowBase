/* @jsx React.createElement */
// FlowBase — Add Column popover with Library + Basic type picker.

const { useState: useAcS, useRef: useAcR, useEffect: useAcE, useMemo: useAcM } = React;

// ─────────────────────────────────────────────────────────────
// Basic column type catalog
// ─────────────────────────────────────────────────────────────

const BASIC_TYPES = [
  { id: "text",   label: "Text",     desc: "Plain text",          Glyph: IconType,   width: 160 },
  { id: "num",    label: "Number",   desc: "Numeric value",       Glyph: IconHash,   width: 100 },
  { id: "date",   label: "Date",     desc: "Calendar date",       Glyph: IconCalendar, width: 110 },
  { id: "select", label: "Select",   desc: "Single-choice tag",   Glyph: IconList,   width: 140 },
  { id: "status", label: "Status",   desc: "Workflow state",      Glyph: IconCircleHalf, width: 120 },
  { id: "email",  label: "Email",    desc: "Email address",       Glyph: IconAt,     width: 180 },
];

// ─────────────────────────────────────────────────────────────
// "+" button at end of sheet header  →  popover
// ─────────────────────────────────────────────────────────────

const AddColumnButton = ({ onAddColumn, existingColumns }) => {
  const [open, setOpen] = useAcS(false);
  const [query, setQuery] = useAcS("");
  const [pending, setPending] = useAcS(null);  // { spec, optionListId } — 2nd step for Smart fill
  const wrap = useAcR(null);

  useAcE(() => {
    if (!open) return;
    function h(e) { if (wrap.current && !wrap.current.contains(e.target)) { setOpen(false); setQuery(""); setPending(null); } }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const existingNames = new Set(existingColumns.map(c => c.name));

  const commit = (spec) => {
    onAddColumn(spec);
    setOpen(false);
    setQuery("");
    setPending(null);
  };

  // Source candidates for Smart fill: any text-type column in the table
  const sourceCandidates = existingColumns.filter(c => ["text", "email"].includes(c.type));

  // Pick handler — if it's a Library Option List or a select-type Library Field, offer Smart fill
  const handlePickWithMaybeSmartFill = (spec, optionListId) => {
    if (optionListId && sourceCandidates.length > 0) {
      setPending({ spec, optionListId });
      return;
    }
    commit(spec);
  };

  // Filter library + basic by query
  const q = query.trim().toLowerCase();
  const match = (s) => !q || (s && s.toLowerCase().includes(q));

  const libFields = (window.LIBRARY?.fields || []).filter(f => match(f.name) || match(f.desc));
  const libOptionLists = (window.LIBRARY?.optionLists || []).filter(o => match(o.name) || match(o.desc));
  const basics = BASIC_TYPES.filter(b => match(b.label) || match(b.desc));

  return (
    <div ref={wrap} style={{ position: "relative", display: "flex", justifyContent: "center" }}>
      <button onClick={() => setOpen(o => !o)} title="Add column" style={{
        width: 40, height: 32, padding: 0, borderRadius: 5,
        border: open ? "1px solid var(--border)" : "1px dashed var(--border-subtle)",
        background: open ? "var(--active-bg-strong)" : "transparent",
        color: open ? "var(--foreground)" : "var(--muted-foreground)",
        cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        transition: "background 120ms ease, color 120ms ease, border-color 120ms ease",
      }}
      onMouseEnter={(e) => { if (!open) { e.currentTarget.style.background = "var(--hover-bg)"; e.currentTarget.style.color = "var(--foreground)"; } }}
      onMouseLeave={(e) => { if (!open) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted-foreground)"; } }}>
        <IconPlus size={13} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0,
          width: 320, padding: 4,
          background: "var(--popover)", border: "1px solid var(--border)",
          borderRadius: 9, boxShadow: "var(--shadow-popover)",
          zIndex: 200, fontSize: 13,
          maxHeight: "min(540px, calc(100vh - 120px))", display: "flex", flexDirection: "column",
        }}>
          {/* Search */}
          <div style={{ padding: "4px 4px 6px" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "5px 8px", borderRadius: 5,
              background: "var(--muted)", border: "1px solid var(--border-subtle)",
            }}>
              <IconSearch size={12} style={{ color: "var(--muted-foreground)" }} />
              <input autoFocus value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Search Library or pick type…"
                style={{
                  flex: 1, border: "none", background: "transparent", outline: "none",
                  fontSize: 12, color: "var(--foreground)", padding: 0, fontFamily: "var(--font-sans)",
                }} />
            </div>
          </div>

          <div className="fb-scroll" style={{ flex: 1, overflowY: "auto", padding: "0 4px 4px" }}>
            {pending ? (
              <SmartFillStep
                pending={pending}
                sourceCandidates={sourceCandidates}
                onBack={() => setPending(null)}
                onConfirm={(sourceName, mode, aiPrompt) => {
                  const spec = { ...pending.spec };
                  if (sourceName) {
                    if (mode === "ai") {
                      spec.rule = {
                        ruleId: "rule-ai-classify",
                        params: {
                          source: sourceName,
                          categories: pending.optionListId,
                          prompt: aiPrompt || "이 텍스트에 가장 적합한 카테고리를 분류하세요.",
                        },
                      };
                    } else {
                      spec.rule = {
                        ruleId: "rule-match",
                        params: { source: sourceName, match_against: pending.optionListId, mode: "partial" },
                      };
                    }
                  }
                  commit(spec);
                }}
              />
            ) : (
              <>
            {/* From Library */}
            {(libFields.length > 0 || libOptionLists.length > 0) && (
              <>
                <SectionTitle Glyph={IconLibrary} label="From Library" tint="var(--primary)" />
                {libFields.map(f => {
                  const olId = f.config?.optionListId;
                  return (
                    <AddRow key={f.id}
                      name={f.name}
                      typeLabel={f.type}
                      desc={f.desc}
                      linked
                      used={existingNames.has(f.name)}
                      onClick={() => handlePickWithMaybeSmartFill({
                        kind: "library-field",
                        libraryFieldId: f.id,
                        name: uniqName(f.name, existingNames),
                        label: f.name,
                        type: f.type,
                        width: 150,
                        library: { kind: "field", id: f.id, assetName: f.name },
                        config: f.config,
                      }, olId)} />
                  );
                })}
                {libOptionLists.map(o => (
                  <AddRow key={o.id}
                    name={o.name}
                    typeLabel="select · option list"
                    desc={`${o.options.length} options`}
                    linked
                    used={existingNames.has(o.name)}
                    onClick={() => handlePickWithMaybeSmartFill({
                      kind: "library-optionlist",
                      libraryOptionListId: o.id,
                      name: uniqName(o.name, existingNames),
                      label: o.name,
                      type: "select",
                      width: 140,
                      library: { kind: "optionList", id: o.id, assetName: o.name },
                    }, o.id)} />
                ))}
              </>
            )}

            {/* Basic types */}
            {basics.length > 0 && (
              <>
                <SectionTitle label="Basic types" />
                {basics.map(b => (
                  <AddRow key={b.id}
                    Glyph={b.Glyph}
                    name={b.label}
                    desc={b.desc}
                    onClick={() => commit({
                      kind: "basic",
                      name: uniqName(b.label.toLowerCase().replace(/\s+/g, "_"), existingNames),
                      label: b.label,
                      type: b.id,
                      width: b.width,
                    })} />
                ))}
              </>
            )}

            {/* No match */}
            {libFields.length === 0 && libOptionLists.length === 0 && basics.length === 0 && (
              <div style={{ padding: "16px 12px", textAlign: "center", color: "var(--muted-foreground)", fontSize: 12.5 }}>
                No matches for "<b>{query}</b>"
              </div>
            )}
              </>
            )}
          </div>

          {/* Footer hint */}
          <div style={{
            padding: "8px 10px", borderTop: "1px solid var(--border-subtle)",
            fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.4,
          }}>
            Library 항목은 정의에 연결되어 다른 곳에서도 동기화됩니다.
          </div>
        </div>
      )}
    </div>
  );
};

// Helpers ─────────────────────────────────────────────────────

const SectionTitle = ({ Glyph, label, tint }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 5,
    padding: "10px 8px 4px",
    fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em",
    textTransform: "uppercase", color: "var(--muted-foreground)",
  }}>
    {Glyph && <Glyph size={10} style={{ color: tint || "currentColor" }} />}
    <span>{label}</span>
  </div>
);

const AddRow = ({ Glyph, name, typeLabel, desc, linked, used, onClick }) => (
  <button onClick={used ? undefined : onClick} disabled={used} style={{
    display: "flex", alignItems: "center", gap: 8,
    width: "100%", padding: "7px 8px", border: "none",
    background: "transparent", borderRadius: 5,
    cursor: used ? "default" : "pointer", textAlign: "left",
    color: used ? "var(--muted-foreground)" : "var(--foreground)",
    opacity: used ? 0.55 : 1,
  }}
  onMouseEnter={(e) => { if (!used) e.currentTarget.style.background = "var(--hover-bg)"; }}
  onMouseLeave={(e) => { if (!used) e.currentTarget.style.background = "transparent"; }}>
    {linked ? (
      <span style={{
        width: 20, height: 20, borderRadius: 4,
        background: "color-mix(in oklch, var(--primary) 18%, transparent)",
        color: "var(--primary)",
        display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        <IconLink size={11} />
      </span>
    ) : (
      <span style={{
        width: 20, height: 20, borderRadius: 4,
        background: "var(--muted)",
        color: "var(--muted-foreground)",
        display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>
        {Glyph && <Glyph size={12} />}
      </span>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.3, display: "flex", alignItems: "center", gap: 5 }}>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</span>
        {typeLabel && (
          <span style={{
            fontSize: 10, padding: "0 5px", borderRadius: 3,
            background: "var(--muted)", color: "var(--muted-foreground)",
            fontFamily: "var(--font-mono)", flexShrink: 0,
          }}>{typeLabel}</span>
        )}
      </div>
      {desc && (
        <div style={{
          fontSize: 11.5, color: "var(--muted-foreground)", lineHeight: 1.3,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{desc}</div>
      )}
    </div>
    {used && (
      <span style={{
        fontSize: 10, padding: "1px 6px", borderRadius: 3,
        background: "var(--muted)", color: "var(--muted-foreground)",
        flexShrink: 0,
      }}>In table</span>
    )}
  </button>
);

function uniqName(base, existing) {
  let name = base;
  let i = 2;
  while (existing.has(name)) {
    name = `${base}_${i++}`;
  }
  return name;
}

// ─────────────────────────────────────────────────────────────
// Step 2 — Smart fill setup (when picking a Library Option List)
// ─────────────────────────────────────────────────────────────

const SmartFillStep = ({ pending, sourceCandidates, onBack, onConfirm }) => {
  const [source, setSource] = useAcS(sourceCandidates[0]?.name || "");
  const [mode, setMode] = useAcS("partial");  // "partial" | "ai"
  const [aiPrompt, setAiPrompt] = useAcS("이 텍스트에 가장 적합한 카테고리를 분류하세요.");
  const ol = LIBRARY.optionLists.find(o => o.id === pending.optionListId);
  return (
    <div style={{ padding: "4px 4px 0" }}>
      <button onClick={onBack} style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "5px 6px", marginBottom: 6, border: "none",
        background: "transparent", color: "var(--muted-foreground)",
        cursor: "pointer", fontSize: 11, fontWeight: 500,
        letterSpacing: "0.04em", textTransform: "uppercase",
      }}>
        <IconChevronLeft size={11} />
        <span>Back</span>
      </button>

      <div style={{
        padding: "10px 12px", marginBottom: 10,
        borderRadius: 7, background: "color-mix(in oklch, var(--primary) 8%, transparent)",
        border: "1px solid color-mix(in oklch, var(--primary) 18%, transparent)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span style={{
            display: "inline-flex", width: 16, height: 16, borderRadius: 3,
            background: "var(--primary)", color: "var(--primary-foreground)",
            alignItems: "center", justifyContent: "center",
          }}>
            <IconLink size={9} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>{pending.spec.label}</span>
          <span style={{
            fontSize: 10, padding: "1px 5px", borderRadius: 3,
            background: "var(--muted)", color: "var(--muted-foreground)",
            fontFamily: "var(--font-mono)",
          }}>{ol?.options.length || 0} options</span>
        </div>
        <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", lineHeight: 1.4 }}>
          이 컬럼이 가질 값을 텍스트에서 자동으로 채울까요?
        </div>
      </div>

      {/* Mode selector */}
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)", padding: "0 4px 6px" }}>
        Fill mode
      </div>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr",
        padding: 2, gap: 1, marginBottom: 10,
        background: "var(--muted)", borderRadius: 6,
        border: "1px solid var(--border-subtle)",
      }}>
        {[
          { id: "partial", label: "Text match",  desc: "텍스트에 옵션 라벨이 포함되면" },
          { id: "ai",      label: "AI Classify", desc: "Claude가 의미를 분석" },
        ].map(m => {
          const on = mode === m.id;
          return (
            <button key={m.id} onClick={() => setMode(m.id)} style={{
              padding: "6px 8px", borderRadius: 5, border: "none",
              background: on ? "var(--surface-elevated)" : "transparent",
              color: on ? "var(--foreground)" : "var(--muted-foreground)",
              cursor: "pointer", boxShadow: on ? "var(--shadow-sm)" : "none",
              textAlign: "left",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {m.id === "ai" && <IconSparkles size={10} style={{ color: on ? "var(--primary)" : "var(--muted-foreground)" }} />}
                <span style={{ fontSize: 12, fontWeight: on ? 600 : 500 }}>{m.label}</span>
              </div>
              <div style={{ fontSize: 10.5, color: "var(--muted-foreground)", marginTop: 1, lineHeight: 1.3 }}>{m.desc}</div>
            </button>
          );
        })}
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)", padding: "0 4px 6px" }}>
        Auto-fill from
      </div>

      <div style={{
        border: "1px solid var(--border-subtle)", borderRadius: 7,
        background: "var(--card)", marginBottom: 10,
        maxHeight: 140, overflowY: "auto",
      }} className="fb-scroll">
        {sourceCandidates.map(c => {
          const on = source === c.name;
          return (
            <button key={c.name} onClick={() => setSource(c.name)} style={{
              display: "flex", alignItems: "center", gap: 8,
              width: "100%", padding: "7px 10px", border: "none",
              background: on ? "var(--active-bg-strong)" : "transparent",
              cursor: "pointer", textAlign: "left",
              color: "var(--foreground)", fontSize: 12.5,
              borderBottom: "1px solid var(--border-subtle)",
            }}
            onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "var(--hover-bg)"; }}
            onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}>
              <span style={{
                width: 12, height: 12, borderRadius: "50%",
                border: "1px solid " + (on ? "var(--primary)" : "var(--border)"),
                background: on ? "var(--primary)" : "transparent",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                {on && <span style={{ width: 4, height: 4, borderRadius: "50%", background: "var(--primary-foreground)" }} />}
              </span>
              <span style={{ flex: 1 }}>{c.label || c.name}</span>
              <span style={{
                fontSize: 10, padding: "1px 5px", borderRadius: 3,
                background: "var(--muted)", color: "var(--muted-foreground)",
                fontFamily: "var(--font-mono)",
              }}>{c.type}</span>
            </button>
          );
        })}
      </div>

      {mode === "ai" && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)", padding: "0 4px 6px" }}>
            AI prompt
          </div>
          <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
            rows={2}
            style={{
              width: "100%", padding: "7px 10px", borderRadius: 6,
              border: "1px solid var(--border-subtle)",
              background: "var(--card)", color: "var(--foreground)",
              fontSize: 12, lineHeight: 1.4, marginBottom: 10,
              fontFamily: "var(--font-sans)", resize: "vertical", outline: "none",
              boxSizing: "border-box",
            }} />
        </>
      )}

      <div style={{
        padding: "8px 10px", marginBottom: 10,
        borderRadius: 6, background: "var(--muted)",
        fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.5,
      }}>
        {mode === "partial" ? (
          <>예시: <span style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>"[디자인스토리] 머레이 <b style={{ color: "var(--primary)" }}>M-Pen-III</b>"</span>
          <br />→ 자동으로 <b style={{ color: "var(--primary)" }}>M-PEN-III</b> 셋팅</>
        ) : (
          <>예시: 모호한 텍스트 "<span style={{ fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>고객이 가입 흐름에 답답함을 느낀다</span>"
          <br />→ Claude가 분석 <IconSparkles size={9} style={{ color: "var(--primary)" }} /> → <b style={{ color: "var(--primary)" }}>Onboarding friction</b></>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, padding: "4px 0 8px" }}>
        <button onClick={() => onConfirm(null, null, null)} style={{
          flex: 1, padding: "6px 10px", borderRadius: 6,
          background: "transparent", border: "1px solid var(--border)",
          color: "var(--foreground)", fontSize: 12, fontWeight: 500, cursor: "pointer",
        }}>Skip · 빈 컬럼</button>
        <button onClick={() => onConfirm(source, mode, aiPrompt)} disabled={!source} style={{
          flex: 1.4, padding: "6px 10px", borderRadius: 6,
          background: "var(--primary)", border: "1px solid var(--primary)",
          color: "var(--primary-foreground)", fontSize: 12, fontWeight: 600, cursor: source ? "pointer" : "default",
          opacity: source ? 1 : 0.5,
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
        }}>
          <IconSparkles size={11} />
          {mode === "ai" ? "Add with AI fill" : "Add with smart fill"}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Column header menu — "..." button with Promote / Unlink / Delete
// ─────────────────────────────────────────────────────────────

const ColumnHeaderMenu = ({ col, columns, onPromote, onUnlink, onDelete, onAttachFunction, onDetachFunction }) => {
  const [open, setOpen] = useAcS(false);
  const [attachOpen, setAttachOpen] = useAcS(false);
  const wrap = useAcR(null);

  useAcE(() => {
    if (!open) return;
    function h(e) { if (wrap.current && !wrap.current.contains(e.target)) { setOpen(false); setAttachOpen(false); } }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  return (
    <div ref={wrap} data-col-menu style={{ position: "relative", display: "inline-flex" }}>
      <button onClick={(e) => { e.stopPropagation(); setOpen(o => !o); setAttachOpen(false); }} title="Column actions" style={{
        width: 18, height: 18, padding: 0, borderRadius: 3, border: "none",
        background: open ? "var(--active-bg-strong)" : "transparent",
        color: "var(--muted-foreground)", cursor: "pointer",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        marginLeft: 2,
      }}
      onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = "var(--hover-bg)"; }}
      onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = "transparent"; }}>
        <IconMore size={11} />
      </button>
      {open && !attachOpen && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0,
          width: 230, padding: 4,
          background: "var(--popover)", border: "1px solid var(--border)",
          borderRadius: 7, boxShadow: "var(--shadow-popover)",
          zIndex: 200, fontSize: 13,
        }}>
          {!col.rule && onAttachFunction && (
            <MenuRow
              icon={<IconSparkles size={11} style={{ color: "var(--primary)" }} />}
              label="Attach function"
              desc="자동 채움 로직 추가"
              onClick={() => { setAttachOpen(true); }}
            />
          )}
          {col.rule && onDetachFunction && (
            <MenuRow
              icon={<IconSparkles size={11} />}
              label="Remove function"
              desc={`Currently: ${col.rule.ruleId}`}
              onClick={() => { onDetachFunction(col.name); setOpen(false); }}
            />
          )}
          {!col.library && onPromote && (
            <MenuRow
              icon={<IconLibrary size={11} style={{ color: "var(--primary)" }} />}
              label="Promote to Library"
              desc="이 컬럼을 다른 테이블에서도 쓸 수 있게"
              onClick={() => { onPromote(col.name); setOpen(false); }}
            />
          )}
          {col.library && onUnlink && (
            <MenuRow
              icon={<IconLink size={11} />}
              label="Unlink from Library"
              desc={`Currently linked to @${col.library.assetName}`}
              onClick={() => { onUnlink(col.name); setOpen(false); }}
            />
          )}
          {onDelete && (
            <>
              <div style={{ height: 1, background: "var(--border-subtle)", margin: "4px 0" }} />
              <MenuRow
                icon={<IconTrash size={11} />}
                label="Delete column"
                destructive
                onClick={() => {
                  if (window.confirm(`"${col.label}" 컬럼을 삭제할까요? 데이터도 함께 삭제됩니다.`)) {
                    onDelete(col.name);
                    setOpen(false);
                  }
                }}
              />
            </>
          )}
        </div>
      )}
      {attachOpen && (
        <AttachFunctionPanel
          col={col}
          columns={columns}
          onClose={() => { setAttachOpen(false); setOpen(false); }}
          onAttach={(rule) => {
            onAttachFunction(col.name, rule);
            setAttachOpen(false);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Attach Function panel — pick function + configure params
// ─────────────────────────────────────────────────────────────

const AttachFunctionPanel = ({ col, columns, onClose, onAttach }) => {
  const fns = window.LIBRARY?.functions || window.LIBRARY?.rules || [];
  const [ruleId, setRuleId] = useAcS(fns[0]?.id || "");
  const [sourceCol, setSourceCol] = useAcS("");
  const [matchOl, setMatchOl] = useAcS("");
  const [pattern, setPattern] = useAcS("");
  const [prompt, setPrompt] = useAcS("이 텍스트에 가장 적합한 카테고리를 분류하세요.");

  const fn = fns.find(f => f.id === ruleId) || fns[0];
  const sourceCandidates = columns.filter(c => c.name !== col.name && c.name !== "id");
  const ols = window.LIBRARY?.optionLists || [];

  // Auto-pick first source
  useAcE(() => {
    if (!sourceCol && sourceCandidates.length > 0) setSourceCol(sourceCandidates[0].name);
  }, [sourceCandidates.length]);
  useAcE(() => {
    if (fn?.id === "rule-match" && !matchOl) {
      // Prefer one matching col label
      const match = ols.find(o => o.name === col.library?.assetName) || ols[0];
      if (match) setMatchOl(match.id);
    }
    if (fn?.id === "rule-ai-classify" && !matchOl) {
      const match = ols.find(o => o.name === col.library?.assetName) || ols[0];
      if (match) setMatchOl(match.id);
    }
  }, [fn?.id]);

  const canAttach = () => {
    if (!sourceCol) return false;
    if (fn?.id === "rule-match" || fn?.id === "rule-ai-classify") return !!matchOl;
    if (fn?.id === "rule-extract") return !!pattern.trim();
    return false;
  };

  const submit = () => {
    if (!canAttach()) return;
    let rule;
    if (fn.id === "rule-match") {
      rule = { ruleId: "rule-match", params: { source: sourceCol, match_against: matchOl, mode: "partial" } };
    } else if (fn.id === "rule-ai-classify") {
      rule = { ruleId: "rule-ai-classify", params: { source: sourceCol, categories: matchOl, prompt } };
    } else if (fn.id === "rule-extract") {
      rule = { ruleId: "rule-extract", params: { source: sourceCol, pattern } };
    }
    onAttach(rule);
  };

  return (
    <div style={{
      position: "absolute", top: "calc(100% + 4px)", right: 0,
      width: 320, padding: 12,
      background: "var(--popover)", border: "1px solid var(--border)",
      borderRadius: 8, boxShadow: "var(--shadow-popover)",
      zIndex: 200, fontSize: 13,
    }}>
      <button onClick={onClose} style={{
        display: "flex", alignItems: "center", gap: 5,
        padding: "4px 6px", marginBottom: 8, border: "none",
        background: "transparent", color: "var(--muted-foreground)",
        cursor: "pointer", fontSize: 11, fontWeight: 500,
        letterSpacing: "0.04em", textTransform: "uppercase",
      }}>
        <IconChevronLeft size={11} />
        <span>Attach function to {col.label}</span>
      </button>

      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 6 }}>Function</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
        {fns.map(f => {
          const on = f.id === ruleId;
          return (
            <button key={f.id} onClick={() => setRuleId(f.id)} style={{
              display: "flex", alignItems: "flex-start", gap: 8,
              padding: "7px 9px", borderRadius: 5,
              background: on ? "color-mix(in oklch, var(--primary) 10%, var(--card))" : "var(--card)",
              border: "1px solid " + (on ? "var(--primary)" : "var(--border-subtle)"),
              cursor: "pointer", textAlign: "left", color: "var(--foreground)",
            }}>
              <IconSparkles size={11} style={{ color: on ? "var(--primary)" : "var(--muted-foreground)", marginTop: 2, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, fontFamily: "var(--font-mono)" }}>{f.name}</div>
                <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 1, lineHeight: 1.3 }}>{f.desc}</div>
              </div>
              {on && <IconCheck size={11} style={{ color: "var(--primary)", flexShrink: 0, marginTop: 3 }} />}
            </button>
          );
        })}
      </div>

      {/* Source column */}
      {sourceCandidates.length === 0 ? (
        <div style={{ padding: 10, fontSize: 12, color: "var(--muted-foreground)", background: "var(--muted)", borderRadius: 6, marginBottom: 10 }}>
          소스가 될 다른 컬럼이 필요합니다.
        </div>
      ) : (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 6 }}>Source column</div>
          <select value={sourceCol} onChange={e => setSourceCol(e.target.value)} style={selectStyle()}>
            {sourceCandidates.map(c => <option key={c.name} value={c.name}>{c.label} ({c.type})</option>)}
          </select>
        </>
      )}

      {/* Option List for match/classify */}
      {(fn?.id === "rule-match" || fn?.id === "rule-ai-classify") && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 6, marginTop: 10 }}>
            {fn?.id === "rule-match" ? "Match against" : "Categories"}
          </div>
          <select value={matchOl} onChange={e => setMatchOl(e.target.value)} style={selectStyle()}>
            <option value="">— Pick an Option List —</option>
            {ols.map(o => <option key={o.id} value={o.id}>@{o.name} ({o.options.length} options)</option>)}
          </select>
        </>
      )}

      {/* AI prompt */}
      {fn?.id === "rule-ai-classify" && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 6, marginTop: 10 }}>Prompt</div>
          <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={2}
            style={{ ...selectStyle(), resize: "vertical", fontFamily: "var(--font-sans)" }} />
        </>
      )}

      {/* Regex pattern */}
      {fn?.id === "rule-extract" && (
        <>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 6, marginTop: 10 }}>Regex pattern</div>
          <input value={pattern} onChange={e => setPattern(e.target.value)} placeholder="e.g. \\[(.*?)\\]"
            style={{ ...selectStyle(), fontFamily: "var(--font-mono)" }} />
        </>
      )}

      <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
        <button onClick={onClose} style={{
          flex: 1, padding: "6px 10px", borderRadius: 6,
          background: "transparent", border: "1px solid var(--border)",
          color: "var(--foreground)", fontSize: 12, fontWeight: 500, cursor: "pointer",
        }}>Cancel</button>
        <button onClick={submit} disabled={!canAttach()} style={{
          flex: 1.3, padding: "6px 10px", borderRadius: 6,
          background: "var(--primary)", border: "1px solid var(--primary)",
          color: "var(--primary-foreground)", fontSize: 12, fontWeight: 600,
          cursor: canAttach() ? "pointer" : "default", opacity: canAttach() ? 1 : 0.5,
          display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
        }}>
          <IconSparkles size={11} />
          Attach
        </button>
      </div>
    </div>
  );
};

const selectStyle = () => ({
  width: "100%", padding: "6px 9px", borderRadius: 5,
  border: "1px solid var(--border)",
  background: "var(--card)", color: "var(--foreground)",
  fontSize: 12.5, outline: "none", boxSizing: "border-box",
});

const MenuRow = ({ icon, label, desc, onClick, destructive }) => (
  <button onClick={onClick} style={{
    display: "flex", alignItems: "flex-start", gap: 8,
    width: "100%", padding: "7px 9px", border: "none",
    background: "transparent", borderRadius: 5, cursor: "pointer",
    color: destructive ? "var(--destructive)" : "var(--foreground)",
    textAlign: "left",
  }}
  onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
    <span style={{
      width: 18, height: 18, borderRadius: 3,
      background: destructive ? "color-mix(in oklch, var(--destructive) 14%, transparent)" : "var(--muted)",
      display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      color: destructive ? "var(--destructive)" : "var(--muted-foreground)",
      marginTop: 1,
    }}>
      {icon}
    </span>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12.5, fontWeight: 500, lineHeight: 1.3 }}>{label}</div>
      {desc && (
        <div style={{ fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.4, marginTop: 1 }}>{desc}</div>
      )}
    </div>
  </button>
);

// ─────────────────────────────────────────────────────────────
// Save as Template — captures the whole table's columns as a Library Template
// ─────────────────────────────────────────────────────────────

const SaveAsTemplateButton = ({ defaultName, onSave }) => {
  const [open, setOpen] = useAcS(false);
  const [name, setName] = useAcS(defaultName || "");
  const [desc, setDesc] = useAcS("");
  const wrap = useAcR(null);

  useAcE(() => {
    if (!open) return;
    function h(e) { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  useAcE(() => { setName(defaultName || ""); }, [defaultName]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave(name.trim(), desc);
    setOpen(false);
    setDesc("");
  };

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} title="Save table as Library template" style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "4px 10px", borderRadius: 5,
        background: open ? "var(--active-bg-strong)" : "var(--card)",
        border: "1px solid var(--border)",
        color: "var(--foreground)", fontSize: 12, fontWeight: 500, cursor: "pointer",
      }}>
        <IconBox size={12} />Save as template
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          width: 320, padding: 14,
          background: "var(--popover)", border: "1px solid var(--border)",
          borderRadius: 9, boxShadow: "var(--shadow-popover)",
          zIndex: 200, fontSize: 13,
        }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 7, marginBottom: 12,
            padding: "8px 10px",
            background: "color-mix(in oklch, var(--primary) 8%, transparent)",
            border: "1px solid color-mix(in oklch, var(--primary) 18%, transparent)",
            borderRadius: 6,
          }}>
            <IconLibrary size={14} style={{ color: "var(--primary)", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.4 }}>
              현재 테이블의 모든 컬럼을 <b style={{ color: "var(--foreground)" }}>Library Template</b>으로 저장. Library 연결되지 않은 컬럼은 자동으로 Field가 됩니다.
            </span>
          </div>

          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 4 }}>Name</div>
          <input autoFocus value={name} onChange={e => setName(e.target.value)}
            placeholder="Template name"
            style={{
              width: "100%", padding: "6px 10px", borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--card)", color: "var(--foreground)",
              fontSize: 13, marginBottom: 10, outline: "none",
              fontFamily: "var(--font-sans)", boxSizing: "border-box",
            }} />

          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 4 }}>Description (optional)</div>
          <textarea value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="What is this template for?"
            rows={2}
            style={{
              width: "100%", padding: "6px 10px", borderRadius: 6,
              border: "1px solid var(--border)",
              background: "var(--card)", color: "var(--foreground)",
              fontSize: 12.5, marginBottom: 12, outline: "none", resize: "vertical",
              fontFamily: "var(--font-sans)", boxSizing: "border-box",
            }} />

          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => setOpen(false)} style={{
              flex: 1, padding: "6px 10px", borderRadius: 6,
              background: "transparent", border: "1px solid var(--border)",
              color: "var(--foreground)", fontSize: 12, fontWeight: 500, cursor: "pointer",
            }}>Cancel</button>
            <button onClick={handleSave} disabled={!name.trim()} style={{
              flex: 1.4, padding: "6px 10px", borderRadius: 6,
              background: "var(--primary)", border: "1px solid var(--primary)",
              color: "var(--primary-foreground)", fontSize: 12, fontWeight: 600,
              cursor: name.trim() ? "pointer" : "default", opacity: name.trim() ? 1 : 0.5,
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}>
              <IconBox size={11} />Save to Library
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Bulk Edit menu — pick column + value → apply to all selected rows
// ─────────────────────────────────────────────────────────────

const BulkEditMenu = ({ columns, selectedCount, onApply }) => {
  const [open, setOpen] = useAcS(false);
  const [pickedCol, setPickedCol] = useAcS(null);
  const [value, setValue] = useAcS("");
  const wrap = useAcR(null);

  useAcE(() => {
    if (!open) return;
    function h(e) { if (wrap.current && !wrap.current.contains(e.target)) { setOpen(false); setPickedCol(null); setValue(""); } }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  // Editable columns (exclude id, button, system)
  const editable = columns.filter(c => c.name !== "id" && c.type !== "button" && c.type !== "avatar" && c.type !== "reaction");

  // Options for select-type columns from Library option list
  const valueOptions = useAcM(() => {
    if (!pickedCol) return null;
    if (pickedCol.library?.kind === "optionList") {
      const ol = window.LIBRARY?.optionLists.find(o => o.id === pickedCol.library.id);
      return ol?.options.map(o => o.label) || null;
    }
    if (pickedCol.config?.optionListId) {
      const ol = window.LIBRARY?.optionLists.find(o => o.id === pickedCol.config.optionListId);
      return ol?.options.map(o => o.label) || null;
    }
    if (pickedCol.options) return pickedCol.options.map(o => typeof o === "string" ? o : o.label);
    if (pickedCol.name === "status") return ["todo", "progress", "waiting", "done"];
    if (pickedCol.name === "priority") return ["Urgent", "High", "Med", "Low"];
    if (pickedCol.name === "sentiment") return ["Positive", "Mixed", "Negative"];
    return null;
  }, [pickedCol]);

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        display: "inline-flex", alignItems: "center", gap: 5,
        padding: "4px 10px", borderRadius: 5,
        background: open ? "var(--active-bg-strong)" : "var(--card)",
        border: "1px solid var(--border)",
        color: "var(--foreground)", fontSize: 12, fontWeight: 500, cursor: "pointer",
      }}>
        <IconBolt size={11} />Bulk edit
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          width: 280, padding: 10,
          background: "var(--popover)", border: "1px solid var(--border)",
          borderRadius: 8, boxShadow: "var(--shadow-popover)",
          zIndex: 200, fontSize: 13,
        }}>
          <div style={{ padding: "6px 4px", fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>
            Set value for {selectedCount} rows
          </div>

          {!pickedCol ? (
            <div className="fb-scroll" style={{ maxHeight: 240, overflowY: "auto" }}>
              {editable.map(c => (
                <button key={c.name} onClick={() => setPickedCol(c)} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  width: "100%", padding: "6px 8px", borderRadius: 5, border: "none",
                  background: "transparent", color: "var(--foreground)", textAlign: "left", cursor: "pointer", fontSize: 12.5,
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                  <span style={{ flex: 1 }}>{c.label || c.name}</span>
                  <span style={{ fontSize: 10.5, padding: "1px 5px", borderRadius: 3, background: "var(--muted)", color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{c.type}</span>
                </button>
              ))}
            </div>
          ) : (
            <>
              <button onClick={() => { setPickedCol(null); setValue(""); }} style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "4px 6px", marginBottom: 6, border: "none",
                background: "transparent", color: "var(--muted-foreground)",
                cursor: "pointer", fontSize: 11, fontWeight: 500,
              }}>
                <IconChevronLeft size={11} />
                <span>{pickedCol.label || pickedCol.name}</span>
              </button>
              {valueOptions ? (
                <div className="fb-scroll" style={{ maxHeight: 240, overflowY: "auto", marginBottom: 6 }}>
                  {valueOptions.map(o => (
                    <button key={o} onClick={() => { onApply(pickedCol.name, o); setOpen(false); setPickedCol(null); setValue(""); }} style={{
                      display: "flex", alignItems: "center", gap: 6,
                      width: "100%", padding: "5px 8px", borderRadius: 4, border: "none",
                      background: "transparent", color: "var(--foreground)", textAlign: "left", cursor: "pointer", fontSize: 12.5,
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
                    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                      <span>{o}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <>
                  <input value={value} onChange={e => setValue(e.target.value)}
                    placeholder={`New ${pickedCol.label || pickedCol.name}`}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && value.trim()) {
                        onApply(pickedCol.name, value);
                        setOpen(false); setPickedCol(null); setValue("");
                      }
                    }}
                    style={{
                      width: "100%", padding: "6px 9px", borderRadius: 5,
                      border: "1px solid var(--border)",
                      background: "var(--card)", color: "var(--foreground)",
                      fontSize: 12.5, outline: "none", marginBottom: 6, boxSizing: "border-box",
                      fontFamily: "var(--font-sans)",
                    }} />
                  <button onClick={() => {
                    if (!value.trim()) return;
                    onApply(pickedCol.name, value);
                    setOpen(false); setPickedCol(null); setValue("");
                  }} disabled={!value.trim()} style={{
                    width: "100%", padding: "6px 10px", borderRadius: 5,
                    background: "var(--primary)", border: "1px solid var(--primary)",
                    color: "var(--primary-foreground)", fontSize: 12, fontWeight: 600,
                    cursor: value.trim() ? "pointer" : "default", opacity: value.trim() ? 1 : 0.5,
                  }}>Apply to {selectedCount} rows</button>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { AddColumnButton, BASIC_TYPES, ColumnHeaderMenu, SaveAsTemplateButton, BulkEditMenu });
