/* @jsx React.createElement */
// FlowBase — Universal search (⌘K command palette).
//   Searches across: rows, columns, tables, Library assets, Wiki pages.

const { useState: useSrS, useEffect: useSrE, useRef: useSrR, useMemo: useSrM } = React;

const SearchPalette = ({
  open, onClose,
  tablesById, library, wikiPages,
  onNavigateRow, onNavigateTable, onNavigateLibraryAsset, onNavigateWikiPage,
}) => {
  const [query, setQuery] = useSrS("");
  const [selectedIdx, setSelectedIdx] = useSrS(0);
  const inputRef = useSrR(null);

  useSrE(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // Index all searchable items once per open (cheap because data is small)
  const allItems = useSrM(() => {
    if (!open) return [];
    const items = [];
    // Tables
    Object.values(tablesById || {}).forEach(t => {
      items.push({
        kind: "table",
        id: "table-" + t.id,
        title: t.label,
        subtitle: `${(t.rows || []).length} rows · ${(t.columns || []).length} columns`,
        keywords: [t.label, t.id],
        action: () => onNavigateTable(t.id),
      });
      // Rows
      (t.rows || []).forEach(r => {
        const searchable = (t.columns || []).map(c => String(r[c.name] ?? "")).join(" ");
        // First non-id non-empty text-ish field is title
        const titleCol = (t.columns || []).find(c => c.name !== "id" && r[c.name] && typeof r[c.name] === "string");
        const title = titleCol ? String(r[titleCol.name]) : r.id;
        items.push({
          kind: "row",
          id: "row-" + t.id + "-" + r.id,
          title: title.slice(0, 80),
          subtitle: t.label + " · " + r.id,
          keywords: [r.id, searchable],
          action: () => onNavigateRow(t.id, r.id),
        });
      });
    });
    // Library assets
    if (library) {
      const libCats = [
        { key: "optionLists", label: "Option List" },
        { key: "fields",      label: "Field" },
        { key: "templates",   label: "Template" },
        { key: "functions",   label: "Function" },
        { key: "dashboards",  label: "Dashboard" },
      ];
      libCats.forEach(({ key, label }) => {
        (library[key] || []).forEach(a => {
          items.push({
            kind: "library",
            id: "lib-" + key + "-" + a.id,
            title: a.name,
            subtitle: `Library · ${label}` + (a.desc ? " · " + a.desc.slice(0, 50) : ""),
            keywords: [a.name, a.desc, a.label].filter(Boolean),
            action: () => onNavigateLibraryAsset(key, a.id),
          });
        });
      });
    }
    // Wiki pages
    (wikiPages || []).forEach(p => {
      items.push({
        kind: "wiki",
        id: "wiki-" + p.id,
        title: p.title,
        subtitle: "Wiki · " + (p.category || "") + " · " + p.owner,
        keywords: [p.title, p.body, p.category].filter(Boolean),
        action: () => onNavigateWikiPage(p.id),
      });
    });
    return items;
  }, [open, tablesById, library, wikiPages]);

  // Filter by query
  const results = useSrM(() => {
    if (!query.trim()) return allItems.slice(0, 30);
    const q = query.trim().toLowerCase();
    const scored = [];
    allItems.forEach(item => {
      const titleLower = String(item.title || "").toLowerCase();
      const subLower = String(item.subtitle || "").toLowerCase();
      const kwLower = (item.keywords || []).join(" ").toLowerCase();
      let score = 0;
      if (titleLower.startsWith(q)) score += 100;
      else if (titleLower.includes(q)) score += 50;
      else if (subLower.includes(q)) score += 20;
      else if (kwLower.includes(q)) score += 10;
      if (score > 0) scored.push({ ...item, _score: score });
    });
    scored.sort((a, b) => b._score - a._score);
    return scored.slice(0, 30);
  }, [allItems, query]);

  useSrE(() => { setSelectedIdx(0); }, [query]);

  useSrE(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); return; }
      if (e.key === "Enter") {
        e.preventDefault();
        const r = results[selectedIdx];
        if (r) { r.action(); onClose(); }
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, results, selectedIdx, onClose]);

  if (!open) return null;

  const groups = (() => {
    const g = { table: [], row: [], library: [], wiki: [] };
    results.forEach(r => g[r.kind].push(r));
    return [
      { key: "table",   label: "Tables",   items: g.table },
      { key: "library", label: "Library",  items: g.library },
      { key: "wiki",    label: "Wiki",     items: g.wiki },
      { key: "row",     label: "Rows",     items: g.row },
    ].filter(grp => grp.items.length > 0);
  })();
  let runningIdx = 0;

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 2000,
      background: "color-mix(in oklch, var(--background) 50%, transparent)",
      backdropFilter: "blur(6px)",
      display: "flex", justifyContent: "center", alignItems: "flex-start",
      paddingTop: "12vh",
    }}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "min(640px, 92vw)", maxHeight: "70vh",
        background: "var(--popover)", border: "1px solid var(--border)",
        borderRadius: 12, boxShadow: "var(--shadow-popover), 0 20px 40px rgba(0,0,0,0.2)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Search input */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "13px 16px",
          borderBottom: "1px solid var(--border-subtle)",
        }}>
          <IconSearch size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
          <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tables, rows, Library, Wiki…"
            style={{
              flex: 1, border: "none", background: "transparent", outline: "none",
              fontSize: 14, color: "var(--foreground)", fontFamily: "var(--font-sans)",
            }} />
          <span className="fb-kbd" style={{ padding: "1px 5px", fontSize: 10 }}>esc</span>
        </div>

        {/* Results */}
        <div className="fb-scroll" style={{ flex: 1, overflowY: "auto", padding: 6 }}>
          {results.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "var(--muted-foreground)", fontSize: 12.5 }}>
              {query ? `No results for "${query}"` : "Start typing to search…"}
            </div>
          ) : (
            groups.map(g => (
              <div key={g.key} style={{ marginBottom: 8 }}>
                <div style={{
                  padding: "8px 10px 4px",
                  fontSize: 10, fontWeight: 600, letterSpacing: "0.08em",
                  textTransform: "uppercase", color: "var(--muted-foreground)",
                }}>{g.label} · {g.items.length}</div>
                {g.items.map(item => {
                  const isSelected = runningIdx === selectedIdx;
                  const myIdx = runningIdx++;
                  return (
                    <button key={item.id}
                      onClick={() => { item.action(); onClose(); }}
                      onMouseEnter={() => setSelectedIdx(myIdx)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10,
                        width: "100%", padding: "8px 10px", border: "none",
                        background: isSelected ? "var(--active-bg-strong)" : "transparent",
                        borderRadius: 6, cursor: "pointer", textAlign: "left",
                        color: "var(--foreground)",
                      }}>
                      <span style={{
                        width: 22, height: 22, borderRadius: 4,
                        background: kindBg(item.kind), color: kindColor(item.kind),
                        display: "inline-flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, fontSize: 11,
                      }}>{kindIcon(item.kind)}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {highlightMatch(item.title, query)}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {item.subtitle}
                        </div>
                      </div>
                      {isSelected && (
                        <span style={{ fontSize: 10, color: "var(--muted-foreground)" }}>↵</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "8px 14px", borderTop: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", gap: 12, fontSize: 10.5, color: "var(--muted-foreground)",
        }}>
          <span><span className="fb-kbd" style={{ padding: "1px 4px", fontSize: 10 }}>↑↓</span> navigate</span>
          <span><span className="fb-kbd" style={{ padding: "1px 4px", fontSize: 10 }}>↵</span> open</span>
          <span><span className="fb-kbd" style={{ padding: "1px 4px", fontSize: 10 }}>esc</span> close</span>
          <div style={{ flex: 1 }} />
          <span>{results.length} result{results.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
};

function kindIcon(k) {
  return k === "table" ? "▦" : k === "row" ? "·" : k === "library" ? "📚" : k === "wiki" ? "📄" : "•";
}
function kindBg(k) {
  return k === "table" ? "color-mix(in oklch, var(--chart-1) 14%, transparent)"
       : k === "row" ? "var(--muted)"
       : k === "library" ? "color-mix(in oklch, var(--primary) 14%, transparent)"
       : k === "wiki" ? "color-mix(in oklch, var(--chart-3) 14%, transparent)"
       : "var(--muted)";
}
function kindColor(k) {
  return k === "table" ? "var(--chart-1)"
       : k === "row" ? "var(--muted-foreground)"
       : k === "library" ? "var(--primary)"
       : k === "wiki" ? "var(--chart-3)"
       : "var(--muted-foreground)";
}
function highlightMatch(text, q) {
  const s = String(text || "");
  if (!q.trim()) return s;
  const idx = s.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return s;
  return (
    <>
      {s.slice(0, idx)}
      <b style={{ background: "color-mix(in oklch, var(--primary) 22%, transparent)", color: "var(--foreground)", borderRadius: 2, padding: "0 1px" }}>{s.slice(idx, idx + q.length)}</b>
      {s.slice(idx + q.length)}
    </>
  );
}

Object.assign(window, { SearchPalette, SearchPage });

// ─────────────────────────────────────────────────────────────
// SearchPage — full-page search (Linear-style), opened by activity-bar
// ─────────────────────────────────────────────────────────────

const SearchPage = ({
  tablesById, library, wikiPages,
  theme, setTheme, panels, onTogglePanel, onShowAllPanels, onHideAllPanels,
  onNavigateRow, onNavigateTable, onNavigateLibraryAsset, onNavigateWikiPage,
  navSlot,
}) => {
  const [query, setQuery] = useSrS("");
  const [tab, setTab] = useSrS("all"); // "all" | "tables" | "rows" | "library" | "wiki"

  const allItems = useSrM(() => {
    const items = [];
    Object.values(tablesById || {}).forEach(t => {
      items.push({
        kind: "table", id: "table-" + t.id, title: t.label,
        subtitle: `${(t.rows || []).length} rows · ${(t.columns || []).length} columns`,
        keywords: [t.label, t.id],
        action: () => onNavigateTable(t.id),
      });
      (t.rows || []).forEach(r => {
        const searchable = (t.columns || []).map(c => String(r[c.name] ?? "")).join(" ");
        const titleCol = (t.columns || []).find(c => c.name !== "id" && r[c.name] && typeof r[c.name] === "string");
        const title = titleCol ? String(r[titleCol.name]) : r.id;
        items.push({
          kind: "row", id: "row-" + t.id + "-" + r.id,
          title: title.slice(0, 80), subtitle: t.label + " · " + r.id,
          keywords: [r.id, searchable],
          action: () => onNavigateRow(t.id, r.id),
        });
      });
    });
    if (library) {
      [["optionLists","Option List"],["fields","Field"],["templates","Template"],["functions","Function"],["dashboards","Dashboard"]].forEach(([k, lbl]) => {
        (library[k] || []).forEach(a => items.push({
          kind: "library", id: "lib-" + k + "-" + a.id,
          title: a.name, subtitle: `Library · ${lbl}` + (a.desc ? " · " + a.desc.slice(0, 50) : ""),
          keywords: [a.name, a.desc, a.label].filter(Boolean),
          action: () => onNavigateLibraryAsset(k, a.id),
        }));
      });
    }
    (wikiPages || []).forEach(p => items.push({
      kind: "wiki", id: "wiki-" + p.id, title: p.title,
      subtitle: "Wiki · " + (p.category || "") + " · " + p.owner,
      keywords: [p.title, p.body, p.category].filter(Boolean),
      action: () => onNavigateWikiPage(p.id),
    }));
    return items;
  }, [tablesById, library, wikiPages]);

  const results = useSrM(() => {
    let list = allItems;
    if (tab !== "all") {
      const kindMap = { tables: "table", rows: "row", library: "library", wiki: "wiki" };
      list = list.filter(i => i.kind === kindMap[tab]);
    }
    if (!query.trim()) return list.slice(0, 200);
    const q = query.trim().toLowerCase();
    const scored = [];
    list.forEach(item => {
      const titleLower = String(item.title || "").toLowerCase();
      const subLower = String(item.subtitle || "").toLowerCase();
      const kwLower = (item.keywords || []).join(" ").toLowerCase();
      let score = 0;
      if (titleLower.startsWith(q)) score += 100;
      else if (titleLower.includes(q)) score += 50;
      else if (subLower.includes(q)) score += 20;
      else if (kwLower.includes(q)) score += 10;
      if (score > 0) scored.push({ ...item, _score: score });
    });
    scored.sort((a, b) => b._score - a._score);
    return scored.slice(0, 200);
  }, [allItems, query, tab]);

  const counts = useSrM(() => ({
    all: allItems.length,
    tables: allItems.filter(i => i.kind === "table").length,
    rows: allItems.filter(i => i.kind === "row").length,
    library: allItems.filter(i => i.kind === "library").length,
    wiki: allItems.filter(i => i.kind === "wiki").length,
  }), [allItems]);

  const breadcrumb = (
    <>
      <span style={{ color: "var(--muted-foreground)" }}>peter's workspace</span>
      <span style={{ color: "var(--muted-foreground)", opacity: 0.5, margin: "0 6px" }}>/</span>
      <span style={{ fontWeight: 600 }}>Search</span>
    </>
  );

  return (
    <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, background: "var(--background)" }}>
      <InteractiveHeader theme={theme} setTheme={setTheme} search={""} onSearch={() => {}}
        breadcrumb={breadcrumb}
        leadingSlot={panels && onTogglePanel ? <PanelsMenu panels={panels} onToggle={onTogglePanel} onShowAll={onShowAllPanels} onHideAll={onHideAllPanels} /> : null}
        navSlot={navSlot} />

      {/* Big search input */}
      <div style={{
        padding: "20px 28px 12px",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 14px", borderRadius: 8,
          background: "var(--card)", border: "1px solid var(--border)",
        }}>
          <IconSearch size={16} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
          <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across the entire workspace…"
            style={{
              flex: 1, border: "none", background: "transparent", outline: "none",
              fontSize: 15, color: "var(--foreground)", fontFamily: "var(--font-sans)",
            }} />
          {query && (
            <button onClick={() => setQuery("")} style={{
              background: "transparent", border: "none", color: "var(--muted-foreground)",
              cursor: "pointer", padding: 2, borderRadius: 3, display: "flex",
            }}><IconX size={13} /></button>
          )}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginTop: 14 }}>
          {[
            { id: "all",     label: "All" },
            { id: "tables",  label: "Tables" },
            { id: "rows",    label: "Rows" },
            { id: "library", label: "Library" },
            { id: "wiki",    label: "Wiki" },
          ].map(t => {
            const on = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "5px 12px", borderRadius: 999,
                background: on ? "var(--active-bg-strong)" : "transparent",
                border: "1px solid " + (on ? "transparent" : "var(--border-subtle)"),
                color: on ? "var(--foreground)" : "var(--muted-foreground)",
                fontSize: 12.5, fontWeight: on ? 600 : 500, cursor: "pointer",
              }}>
                <span>{t.label}</span>
                <span className="fb-tnum" style={{ fontSize: 10.5, opacity: 0.7 }}>{counts[t.id]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="fb-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px 28px 40px" }}>
        {results.length === 0 ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--muted-foreground)", fontSize: 13 }}>
            <IconSearch size={28} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div>{query ? `No results for "${query}"` : "Start typing to search across tables, rows, Library, and Wiki."}</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxWidth: 800 }}>
            {results.map(item => (
              <button key={item.id} onClick={item.action} style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px", border: "none",
                background: "transparent", borderRadius: 6,
                color: "var(--foreground)", textAlign: "left", cursor: "pointer",
                transition: "background 80ms ease",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <span style={{
                  width: 26, height: 26, borderRadius: 5,
                  background: kindBg(item.kind), color: kindColor(item.kind),
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontSize: 12,
                }}>{kindIcon(item.kind)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {highlightMatch(item.title, query)}
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.subtitle}
                  </div>
                </div>
                <span style={{ fontSize: 10, color: "var(--muted-foreground)", flexShrink: 0 }}>→</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};
