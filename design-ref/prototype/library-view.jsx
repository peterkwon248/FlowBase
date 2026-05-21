/* @jsx React.createElement */
// FlowBase Library — interactive activity bar + sidebar tree + main catalog/detail view.

const { useState: useLbS, useMemo: useLbM, useRef: useLbR, useEffect: useLbE } = React;

// ─────────────────────────────────────────────────────────────
// Category icon + color mapping (Notion/Linear-style monochrome SVGs)
// ─────────────────────────────────────────────────────────────

const CATEGORY_ICONS = {
  optionLists: IconList,
  fields:      IconType,
  templates:   IconBox,        // distinct from Schema icon
  functions:   IconFunction,   // renamed from rules
  dashboards:  IconChart,
};
const CATEGORY_COLORS = {
  optionLists: "var(--chart-1)",
  fields:      "var(--chart-3)",
  templates:   "var(--chart-4)",
  functions:   "var(--chart-2)",
  dashboards:  "var(--chart-5)",
};

// ─────────────────────────────────────────────────────────────
// Library icon (book glyph)
// ─────────────────────────────────────────────────────────────

const IconLibrary = (p) => (
  <Icon {...p}>
    <path d="M3 4a1 1 0 0 1 1-1h5a2 2 0 0 1 2 2v15a2 2 0 0 0-2-2H3z" />
    <path d="M21 4a1 1 0 0 0-1-1h-5a2 2 0 0 0-2 2v15a2 2 0 0 1 2-2h6z" />
  </Icon>
);

// ─────────────────────────────────────────────────────────────
// Interactive activity bar — mode switch
// ─────────────────────────────────────────────────────────────

const InteractiveActivityBar = ({ mode, onChange }) => {
  const items = [
    { id: "inbox",     Glyph: IconInbox,   title: "Inbox",                 nav: true  },
    { id: "tables",    Glyph: IconDb,      title: "Tables",                nav: true  },
    { id: "workspace", Glyph: IconLayers,  title: "Workspace",             nav: true  },
    { id: "library",   Glyph: IconLibrary, title: "Library",               nav: true  },
    { id: "wiki",      Glyph: IconWiki,    title: "Wiki",                  nav: true  },
    { id: "search",    Glyph: IconSearch,  title: "Search (⌘K for palette)", nav: true  },
  ];
  return (
    <div style={{
      width: 44, flexShrink: 0,
      background: "var(--background)",
      borderRight: "1px solid var(--border-subtle)",
      display: "flex", flexDirection: "column", alignItems: "center",
      padding: "10px 0", gap: 4,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7,
        background: "linear-gradient(140deg, var(--primary), color-mix(in oklch, var(--primary) 65%, white))",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "white", fontWeight: 700, fontSize: 13, letterSpacing: "-0.02em",
        marginBottom: 6,
      }}>F</div>
      {items.map(({ id, Glyph, title, nav }) => {
        const active = id === mode;
        return (
          <button key={id} title={title}
            onClick={() => nav && onChange(id)}
            style={{
              width: 32, height: 32, border: "none",
              background: active ? "var(--active-bg-strong)" : "transparent",
              borderRadius: 6, position: "relative",
              color: active ? "var(--foreground)" : "var(--sidebar-muted)",
              opacity: nav ? 1 : 0.4,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: nav ? "pointer" : "default",
              transition: "background 120ms ease, color 120ms ease",
            }}
            onMouseEnter={(e) => { if (!active && nav) e.currentTarget.style.background = "var(--hover-bg)"; }}
            onMouseLeave={(e) => { if (!active && nav) e.currentTarget.style.background = "transparent"; }}>
            <Glyph size={18} />
            {active && <span style={{ position: "absolute", left: -10, top: 7, bottom: 7, width: 2, background: "var(--primary)", borderRadius: 1 }} />}
          </button>
        );
      })}
      <div style={{ flex: 1 }} />
      <button title="Settings · Coming soon" style={{
        width: 32, height: 32, border: "none", background: "transparent",
        borderRadius: 6, color: "var(--sidebar-muted)", opacity: 0.4,
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "default",
      }}>
        <IconSettings size={18} />
      </button>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Library sidebar — tree of 4 categories
// ─────────────────────────────────────────────────────────────

const LibrarySidebar = ({ selectedCategory, selectedAssetId, onSelectCategory, onSelectAsset }) => {
  const [expanded, setExpanded] = useLbS({ optionLists: true, fields: true, templates: true, functions: true, dashboards: true });
  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const allOpen = Object.values(expanded).every(Boolean);
  const toggleAll = () => {
    const next = !allOpen;
    setExpanded({ optionLists: next, fields: next, templates: next, functions: next, dashboards: next });
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
          background: "color-mix(in oklch, var(--primary) 22%, transparent)",
          color: "var(--primary)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          <IconLibrary size={13} />
        </span>
        <span style={{ fontWeight: 600 }}>Library</span>
        <div style={{ flex: 1 }} />
        <button onClick={toggleAll} title={allOpen ? "Collapse all" : "Expand all"} style={{
          background: "transparent", border: "none", color: "var(--sidebar-muted)",
          padding: 2, borderRadius: 4, cursor: "pointer", display: "flex",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {allOpen ? (
              <>
                <polyline points="17 11 12 6 7 11" />
                <polyline points="17 18 12 13 7 18" />
              </>
            ) : (
              <>
                <polyline points="7 13 12 18 17 13" />
                <polyline points="7 6 12 11 17 6" />
              </>
            )}
          </svg>
        </button>
        <button title="New asset" style={{
          background: "transparent", border: "none", color: "var(--sidebar-muted)",
          padding: 2, borderRadius: 4, cursor: "pointer", display: "flex",
        }}>
          <IconPlus size={14} />
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: "10px 10px 4px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 8px", borderRadius: 5,
          background: "var(--muted)", border: "1px solid var(--border-subtle)",
        }}>
          <IconSearch size={12} style={{ color: "var(--sidebar-muted)" }} />
          <input placeholder="Search library…" style={{
            flex: 1, border: "none", background: "transparent", outline: "none",
            fontSize: 12, color: "var(--foreground)", padding: 0, fontFamily: "var(--font-sans)",
          }} />
        </div>
      </div>

      {/* Tree */}
      <div className="fb-scroll" style={{ flex: 1, overflowY: "auto", padding: "6px 6px 12px" }}>
        {LIBRARY_CATEGORIES.map((cat) => {
          const items = LIBRARY[cat.id] || [];
          const isOpen = expanded[cat.id];
          const catActive = !selectedAssetId && selectedCategory === cat.id;
          return (
            <div key={cat.id} style={{ marginBottom: 2 }}>
              <button onClick={() => { toggle(cat.id); onSelectCategory(cat.id); }} style={{
                display: "flex", alignItems: "center", gap: 6,
                width: "100%", padding: "5px 8px", borderRadius: 5,
                border: "none",
                background: catActive ? "var(--active-bg-strong)" : "transparent",
                color: "var(--foreground)", cursor: "pointer", textAlign: "left",
                fontSize: 12.5, fontWeight: 600,
              }}
              onMouseEnter={(e) => { if (!catActive) e.currentTarget.style.background = "var(--hover-bg)"; }}
              onMouseLeave={(e) => { if (!catActive) e.currentTarget.style.background = "transparent"; }}>
                <span style={{
                  display: "inline-flex", width: 12, height: 12,
                  alignItems: "center", justifyContent: "center",
                  color: "var(--sidebar-muted)",
                  transform: isOpen ? "rotate(0deg)" : "rotate(-90deg)",
                  transition: "transform 120ms ease",
                }}>
                  <IconChevronDown size={10} />
                </span>
                {(() => { const G = CATEGORY_ICONS[cat.id]; return G ? <G size={12} style={{ color: CATEGORY_COLORS[cat.id], flexShrink: 0 }} /> : null; })()}
                <span style={{ flex: 1 }}>{cat.label}</span>
                <span className="fb-tnum" style={{ fontSize: 11, color: "var(--sidebar-muted)", fontWeight: 400 }}>
                  {items.length}
                </span>
              </button>
              {isOpen && items.map((item) => {
                const active = item.id === selectedAssetId;
                return (
                  <button key={item.id} onClick={() => onSelectAsset(cat.id, item.id)} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    width: "100%", padding: "4px 8px 4px 26px", borderRadius: 5,
                    border: "none",
                    background: active ? "var(--active-bg-strong)" : "transparent",
                    color: active ? "var(--foreground)" : "var(--muted-foreground)",
                    cursor: "pointer", textAlign: "left",
                    fontSize: 12.5, fontWeight: active ? 500 : 400,
                    position: "relative",
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--hover-bg)"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}>
                    {active && <span style={{ position: "absolute", left: 4, top: 5, bottom: 5, width: 2, background: "var(--primary)", borderRadius: 1 }} />}
                    <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.name}
                    </span>
                    {item.usedIn && item.usedIn.length > 0 && (
                      <span style={{
                        fontSize: 10, padding: "0 4px", borderRadius: 3,
                        background: "color-mix(in oklch, var(--primary) 18%, transparent)",
                        color: "var(--primary)", fontWeight: 600,
                      }}>{item.usedIn.length}</span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div style={{
        padding: "10px 14px",
        borderTop: "1px solid var(--sidebar-border)",
        fontSize: 11, color: "var(--sidebar-muted)", lineHeight: 1.5,
      }}>
        정의는 한 번,<br />사용은 어디서나.
      </div>
    </aside>
  );
};

// ─────────────────────────────────────────────────────────────
// Library main view — catalog (when category) or detail (when asset)
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Library Display Menu — popover with view switcher (matches Tables Display pattern)
// ─────────────────────────────────────────────────────────────

const LibraryDisplayMenu = ({ libView, onChangeLibView, disabled }) => {
  const [open, setOpen] = useLbS(false);
  const wrap = useLbR(null);
  useLbE(() => {
    if (!open) return;
    function h(e) { if (wrap.current && !wrap.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open]);

  const views = [
    { id: "cards", label: "Cards", Glyph: IconSchema },
    { id: "sheet", label: "Sheet", Glyph: IconSheet },
  ];

  return (
    <div ref={wrap} style={{ position: "relative" }}>
      <ToolbarIconButton active={open} onClick={() => !disabled && setOpen(o => !o)}
        title={disabled ? "Display options · open the catalog" : "Display"}>
        <span style={{ opacity: disabled ? 0.4 : 1, display: "inline-flex" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="4" y1="6" x2="20" y2="6" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="18" x2="20" y2="18" />
            <circle cx="9" cy="6" r="2" fill="currentColor" stroke="none" />
            <circle cx="15" cy="12" r="2" fill="currentColor" stroke="none" />
            <circle cx="8" cy="18" r="2" fill="currentColor" stroke="none" />
          </svg>
        </span>
      </ToolbarIconButton>
      {open && !disabled && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          width: 240, padding: 12,
          background: "var(--popover)", border: "1px solid var(--border)",
          borderRadius: 9, boxShadow: "var(--shadow-popover)",
          zIndex: 200, fontSize: 13,
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr",
            gap: 4, padding: 3,
            background: "var(--muted)", borderRadius: 7,
            border: "1px solid var(--border-subtle)",
          }}>
            {views.map(v => {
              const on = libView === v.id;
              return (
                <button key={v.id} onClick={() => onChangeLibView(v.id)} style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 5,
                  padding: "6px 6px", borderRadius: 5, border: "none",
                  background: on ? "var(--surface-elevated)" : "transparent",
                  color: on ? "var(--foreground)" : "var(--muted-foreground)",
                  fontSize: 12, fontWeight: on ? 600 : 500, cursor: "pointer",
                  boxShadow: on ? "var(--shadow-sm)" : "none",
                }}>
                  <v.Glyph size={11} />{v.label}
                </button>
              );
            })}
          </div>
          <div style={{
            marginTop: 10, padding: "6px 2px 0",
            fontSize: 11, color: "var(--muted-foreground)", lineHeight: 1.5,
          }}>
            Flow / Diagram views는 다음 버전에 추가 예정.
          </div>
        </div>
      )}
    </div>
  );
};

const LibraryView = ({
  selectedCategory, selectedAssetId, onSelectAsset, onSelectCategory,
  theme, setTheme, panels, onTogglePanel, onShowAllPanels, onHideAllPanels,
  libView, onChangeLibView,
  onToggleDetailBar,
  library, onOptionRename, onOptionDelete, onOptionColorChange, onOptionAdd,
  onAssetRename, onAssetDescChange,
  onFieldConfigChange,
  onTemplateRemoveField, onTemplateAddField,
  onRuleLabelChange,
  onUseInTable,
  onCreateAsset,
  navSlot,
}) => {
  const lib = library || window.LIBRARY;
  const category = LIBRARY_CATEGORIES.find(c => c.id === selectedCategory) || LIBRARY_CATEGORIES[0];
  const items = lib[category.id] || [];
  const asset = selectedAssetId ? items.find(i => i.id === selectedAssetId) : null;
  const [librarySearch, setLibrarySearch] = useLbS("");

  // Custom breadcrumb for InteractiveHeader
  const breadcrumb = (
    <>
      <span style={{ color: "var(--muted-foreground)" }}>peter's workspace</span>
      <span style={{ color: "var(--muted-foreground)", opacity: 0.5, margin: "0 6px" }}>/</span>
      <button onClick={() => onSelectCategory(category.id)} style={{
        background: "transparent", border: "none", padding: 0, cursor: "pointer",
        color: "var(--muted-foreground)", font: "inherit",
      }}>Library</button>
      <span style={{ color: "var(--muted-foreground)", opacity: 0.5, margin: "0 6px" }}>/</span>
      <button onClick={() => onSelectAsset(category.id, null)} style={{
        background: "transparent", border: "none", padding: 0, cursor: "pointer",
        font: "inherit", color: asset ? "var(--muted-foreground)" : "var(--foreground)",
        fontWeight: asset ? 400 : 600,
      }}>{category.label}</button>
      {asset && (
        <>
          <span style={{ color: "var(--muted-foreground)", opacity: 0.5, margin: "0 6px" }}>/</span>
          <span style={{ fontWeight: 600 }}>{asset.name}</span>
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
      search={librarySearch} onSearch={setLibrarySearch}
      breadcrumb={breadcrumb}
      leadingSlot={panels && onTogglePanel ? (
        <PanelsMenu panels={panels} onToggle={onTogglePanel} onShowAll={onShowAllPanels} onHideAll={onHideAllPanels} />
      ) : null}
      navSlot={navSlot}
    />

      {/* Library toolbar — Filter / Display / Detail bar (consistent with Tables mode) */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "10px 20px 6px",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <span style={{ fontSize: 12, color: "var(--muted-foreground)" }} className="fb-tnum">
          {asset ? asset.name : `${items.length} ${category.label.toLowerCase()}`}
        </span>
        <div style={{ flex: 1 }} />

        {/* Filter — stub (no filters yet for library) */}
        <ToolbarIconButton title="Filter · Coming soon" onClick={() => {}}>
          <span style={{ opacity: 0.4, display: "inline-flex" }}><IconFilter size={14} /></span>
        </ToolbarIconButton>

        {/* Display — Cards/Sheet view switcher (popover, matches Tables pattern) */}
        <LibraryDisplayMenu libView={libView} onChangeLibView={onChangeLibView} disabled={!!asset} />

        {/* Detail bar toggle */}
        {onToggleDetailBar && (
          <DetailBarToggle open={panels?.detailBar} onToggle={onToggleDetailBar} />
        )}
      </div>

      {asset ? (
        <AssetDetail category={category} asset={asset}
          library={lib}
          onOptionRename={onOptionRename}
          onOptionDelete={onOptionDelete}
          onOptionColorChange={onOptionColorChange}
          onOptionAdd={onOptionAdd}
          onAssetRename={onAssetRename}
          onAssetDescChange={onAssetDescChange}
          onFieldConfigChange={onFieldConfigChange}
          onTemplateRemoveField={onTemplateRemoveField}
          onTemplateAddField={onTemplateAddField}
          onRuleLabelChange={onRuleLabelChange}
          onUseInTable={onUseInTable}
        />
      ) : libView === "sheet" ? (
        <CategorySheet category={category} items={items} onSelectAsset={onSelectAsset} onCreateAsset={onCreateAsset} />
      ) : (
        <CategoryCatalog category={category} items={items} onSelectAsset={onSelectAsset} onCreateAsset={onCreateAsset} />
      )}
    </main>
  );
};

// ─────────────────────────────────────────────────────────────
// Category catalog — grid of assets in selected category
// ─────────────────────────────────────────────────────────────

const CategoryCatalog = ({ category, items, onSelectAsset, onCreateAsset }) => {
  const Glyph = CATEGORY_ICONS[category.id];
  const tint  = CATEGORY_COLORS[category.id];
  return (
  <div className="fb-scroll" style={{ flex: 1, overflowY: "auto", padding: 20 }}>
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <span style={{
          width: 32, height: 32, borderRadius: 8,
          background: `color-mix(in oklch, ${tint} 14%, transparent)`,
          color: tint,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>{Glyph && <Glyph size={16} />}</span>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>
          {category.label}
        </h1>
        <span style={{
          fontSize: 11.5, padding: "2px 7px", borderRadius: 4,
          background: "var(--muted)", color: "var(--muted-foreground)",
          fontFamily: "var(--font-mono)", marginTop: 4,
        }}>{items.length}</span>
      </div>
      <p style={{ margin: "0 0 0 42px", fontSize: 13, color: "var(--muted-foreground)" }}>
        {category.desc}
      </p>
    </div>

    <div style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
      gap: 12,
    }}>
      {items.map(item => (
        <button key={item.id} onClick={() => onSelectAsset(category.id, item.id)} style={{
          textAlign: "left", padding: 14,
          background: "var(--card)", border: "1px solid var(--border-subtle)",
          borderRadius: 9, cursor: "pointer",
          display: "flex", flexDirection: "column", gap: 6,
          transition: "background 120ms ease, border-color 120ms ease, transform 120ms ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "var(--border)";
          e.currentTarget.style.background = "var(--surface-elevated)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "var(--border-subtle)";
          e.currentTarget.style.background = "var(--card)";
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: tint, flexShrink: 0,
              boxShadow: `0 0 0 3px color-mix(in oklch, ${tint} 18%, transparent)`,
            }} />
            <span style={{ fontWeight: 600, fontSize: 14, flex: 1 }}>{item.name}</span>
            {item.usedIn && item.usedIn.length > 0 ? (
              <span style={{
                fontSize: 10.5, padding: "1px 6px", borderRadius: 3,
                background: "color-mix(in oklch, var(--primary) 18%, transparent)",
                color: "var(--primary)", fontWeight: 600,
              }}>{item.usedIn.length} in use</span>
            ) : (
              <span style={{ fontSize: 10.5, color: "var(--muted-foreground)" }}>unused</span>
            )}
          </div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)", minHeight: 18 }}>
            {item.desc || item.label || (category.id === "optionLists" ? `${item.options?.length || 0} options` : "")}
          </div>
          {/* Mini preview */}
          {category.id === "optionLists" && (
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
              {item.options.slice(0, 5).map(o => (
                <span key={o.id} style={{
                  fontSize: 11, padding: "1px 7px", borderRadius: 999,
                  background: `color-mix(in oklch, ${o.color} 24%, transparent)`,
                  color: o.color, fontWeight: 500,
                }}>{o.label}</span>
              ))}
              {item.options.length > 5 && (
                <span style={{ fontSize: 11, color: "var(--muted-foreground)", padding: "1px 4px" }}>+{item.options.length - 5}</span>
              )}
            </div>
          )}
          {category.id === "fields" && (
            <div style={{ display: "flex", gap: 5, alignItems: "center", marginTop: 4 }}>
              <span style={{
                fontSize: 10.5, padding: "1px 6px", borderRadius: 3,
                background: "var(--muted)", color: "var(--muted-foreground)",
                fontFamily: "var(--font-mono)",
              }}>{item.type}</span>
              {item.config?.required && (
                <span style={{ fontSize: 10.5, color: "var(--destructive)", fontWeight: 600 }}>required</span>
              )}
            </div>
          )}
          {category.id === "templates" && (
            <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 4 }}>
              <span style={{
                fontSize: 10.5, padding: "1px 6px", borderRadius: 3,
                background: "var(--muted)", color: "var(--muted-foreground)",
              }}>
                {(item.fields?.length || 0) + (item.extraFields?.length || 0)} fields
              </span>
              <span style={{ fontSize: 10.5, color: "var(--muted-foreground)" }}>·</span>
              <span style={{ fontSize: 10.5, color: "var(--muted-foreground)" }}>
                {item.recommendedViews?.join(" / ")}
              </span>
            </div>
          )}
          {category.id === "functions" && (
            <div style={{
              marginTop: 4, padding: "5px 7px",
              borderRadius: 5, background: "var(--muted)",
              fontFamily: "var(--font-mono)", fontSize: 10.5,
              color: "var(--muted-foreground)", lineHeight: 1.4,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {item.example}
            </div>
          )}
        </button>
      ))}

      {/* + Add new card */}
      <button onClick={() => onCreateAsset?.(category.id)} style={{
        textAlign: "center", padding: 14, minHeight: 100,
        background: "transparent", border: "1px dashed var(--border)",
        borderRadius: 9, cursor: "pointer",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4,
        color: "var(--muted-foreground)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--primary)";
        e.currentTarget.style.color = "var(--primary)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.color = "var(--muted-foreground)";
      }}>
        <IconPlus size={18} />
        <span style={{ fontSize: 12, fontWeight: 500 }}>New {category.label.slice(0, -1)}</span>
      </button>
    </div>
  </div>
  );
};

  // Asset cards minimal preview — Functions use code-style example
  // (replaces former category === "rules" check)
  // No-op edit: this comment ensures regression-safe rename only.

// ─────────────────────────────────────────────────────────────
// Asset detail
// ─────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────
// Editable inline title/text (Library-scoped to avoid name clash)
// ─────────────────────────────────────────────────────────────

const LibTitle = ({ value, onChange, style }) => {
  const [editing, setEditing] = useLbS(false);
  const [draft, setDraft] = useLbS(value);
  useLbE(() => { setDraft(value); }, [value]);
  const commit = () => {
    if (draft.trim() && draft !== value) onChange?.(draft.trim());
    setEditing(false);
  };
  if (editing) {
    return <input autoFocus value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
      style={{ ...style, padding: "0 4px", margin: "0 -4px",
        border: "1px solid var(--primary)", borderRadius: 4,
        background: "var(--background)", color: "var(--foreground)",
        outline: "none", fontFamily: "var(--font-sans)", maxWidth: "100%",
      }} />;
  }
  return <h1 onClick={() => setEditing(true)} style={{ ...style, margin: 0, cursor: "text", padding: "0 4px", marginLeft: -4, borderRadius: 4 }}
    onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
    {value}
  </h1>;
};

const LibText = ({ value, onChange, placeholder, style }) => {
  const [editing, setEditing] = useLbS(false);
  const [draft, setDraft] = useLbS(value);
  useLbE(() => { setDraft(value); }, [value]);
  const commit = () => {
    if (draft !== value) onChange?.(draft);
    setEditing(false);
  };
  if (editing) {
    return <input autoFocus value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(value); setEditing(false); } }}
      placeholder={placeholder}
      style={{ ...style, padding: "2px 6px", margin: "-2px -6px",
        border: "1px solid var(--primary)", borderRadius: 4,
        background: "var(--background)", color: "var(--foreground)",
        outline: "none", fontFamily: "var(--font-sans)", width: "100%", maxWidth: "100%", boxSizing: "border-box",
      }} />;
  }
  return <p onClick={() => setEditing(true)} style={{
    ...style, margin: 0, cursor: "text", padding: "2px 6px", marginLeft: -6, marginTop: 2, borderRadius: 4,
    minHeight: "1.4em",
  }}
  onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
    {value || <span style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>{placeholder}</span>}
  </p>;
};

const EditableTitle = LibTitle;
const EditableText = LibText;

const AssetDetail = ({ category, asset, library,
  onOptionRename, onOptionDelete, onOptionColorChange, onOptionAdd,
  onAssetRename, onAssetDescChange,
  onFieldConfigChange,
  onTemplateRemoveField, onTemplateAddField,
  onRuleLabelChange,
  onUseInTable,
}) => {
  const Glyph = CATEGORY_ICONS[category.id];
  const tint  = CATEGORY_COLORS[category.id];
  return (
  <div className="fb-scroll" style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
    {/* Header */}
    <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 18 }}>
      <span style={{
        width: 40, height: 40, borderRadius: 9,
        background: `color-mix(in oklch, ${tint} 14%, transparent)`,
        color: tint,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>{Glyph && <Glyph size={18} />}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <EditableTitle value={asset.name}
            onChange={(v) => onAssetRename?.(category.id, asset.id, v)}
            style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em" }} />
          <span style={{
            fontSize: 11, padding: "2px 7px", borderRadius: 4,
            background: "var(--muted)", color: "var(--muted-foreground)",
            fontFamily: "var(--font-mono)",
          }}>{category.label.slice(0, -1)}</span>
        </div>
        <EditableText value={asset.desc || asset.label || ""}
          placeholder="Add a description…"
          onChange={(v) => onAssetDescChange?.(category.id, asset.id, v)}
          style={{ marginTop: 4, fontSize: 13.5, color: "var(--muted-foreground)" }} />
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button style={detailBtn("primary")} onClick={() => onUseInTable?.(category.id, asset)}>
          Use in table →
        </button>
      </div>
    </div>

    {/* Used in */}
    <DetailSection title="Used in" count={asset.usedIn?.length || 0}>
      {asset.usedIn && asset.usedIn.length > 0 ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {asset.usedIn.map((usage, i) => (
            <span key={i} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "4px 10px", borderRadius: 999,
              background: "color-mix(in oklch, var(--primary) 14%, transparent)",
              color: "var(--primary)", fontSize: 12, fontWeight: 500,
              fontFamily: "var(--font-mono)",
            }}>🔗 {usage}</span>
          ))}
        </div>
      ) : (
        <p style={{ margin: 0, fontSize: 12.5, color: "var(--muted-foreground)" }}>
          아직 사용되는 곳이 없습니다. 테이블 컬럼 생성 시 이 자산을 선택할 수 있습니다.
        </p>
      )}
    </DetailSection>

    {/* Category-specific body */}
    {category.id === "optionLists" && <OptionListDetail asset={asset}
      onOptionRename={onOptionRename}
      onOptionDelete={onOptionDelete}
      onOptionColorChange={onOptionColorChange}
      onOptionAdd={onOptionAdd}
    />}
    {category.id === "fields"      && <FieldDetail      asset={asset} library={library}
      onConfigChange={(patch) => onFieldConfigChange?.(asset.id, patch)} />}
    {category.id === "templates"   && <TemplateDetail   asset={asset} library={library}
      onRemoveField={(fid) => onTemplateRemoveField?.(asset.id, fid)}
      onAddField={(fid) => onTemplateAddField?.(asset.id, fid)} />}
    {category.id === "functions"  && <RuleDetail       asset={asset}
      onLabelChange={(v) => onRuleLabelChange?.(asset.id, v)} />}
    {category.id === "dashboards"  && <DashboardDetail  asset={asset} library={library} />}
  </div>
  );
};

const DetailSection = ({ title, count, children }) => (
  <div style={{ marginBottom: 22 }}>
    <div style={{
      display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
      fontSize: 11, fontWeight: 600, letterSpacing: "0.08em",
      textTransform: "uppercase", color: "var(--muted-foreground)",
    }}>
      <span>{title}</span>
      {typeof count === "number" && (
        <span className="fb-tnum" style={{
          padding: "0 6px", borderRadius: 3, background: "var(--muted)",
          fontSize: 10.5, color: "var(--muted-foreground)",
          letterSpacing: 0,
        }}>{count}</span>
      )}
    </div>
    {children}
  </div>
);

const detailBtn = (kind) => {
  const base = {
    padding: "5px 12px", borderRadius: 6,
    fontSize: 12, fontWeight: 500, cursor: "pointer",
    border: "1px solid",
  };
  if (kind === "primary") return {
    ...base,
    background: "var(--primary)", color: "var(--primary-foreground)",
    borderColor: "var(--primary)",
  };
  return {
    ...base,
    background: "var(--card)", color: "var(--foreground)",
    borderColor: "var(--border)",
  };
};

// ─────────────────────────────────────────────────────────────
// Per-category body
// ─────────────────────────────────────────────────────────────

const OptionListDetail = ({ asset, onOptionRename, onOptionDelete, onOptionColorChange, onOptionAdd }) => {
  const [newOptionText, setNewOptionText] = useLbS("");
  return (
  <DetailSection title="Options" count={asset.options.length}>
    <div style={{
      border: "1px solid var(--border-subtle)", borderRadius: 8,
      overflow: "hidden", background: "var(--card)",
    }}>
      {asset.options.map((o, i) => (
        <OptionRow key={o.id} asset={asset} option={o}
          isLast={i === asset.options.length - 1}
          onRename={(newLabel) => onOptionRename?.(asset.id, o.id, newLabel)}
          onDelete={() => onOptionDelete?.(asset.id, o.id)}
          onColorChange={(color) => onOptionColorChange?.(asset.id, o.id, color)}
        />
      ))}
      <form onSubmit={(e) => {
        e.preventDefault();
        if (!newOptionText.trim()) return;
        onOptionAdd?.(asset.id, newOptionText);
        setNewOptionText("");
      }} style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "10px 14px",
        background: "transparent",
        borderTop: "1px solid var(--border-subtle)",
      }}>
        <IconPlus size={12} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
        <input value={newOptionText} onChange={e => setNewOptionText(e.target.value)}
          placeholder="새 옵션 추가…"
          style={{
            flex: 1, border: "none", background: "transparent", outline: "none",
            fontSize: 13, color: "var(--foreground)", padding: 0, fontFamily: "var(--font-sans)",
          }} />
        {newOptionText.trim() && (
          <button type="submit" style={{
            padding: "3px 10px", borderRadius: 5, border: "1px solid var(--primary)",
            background: "var(--primary)", color: "var(--primary-foreground)",
            fontSize: 11.5, fontWeight: 500, cursor: "pointer",
          }}>Add</button>
        )}
      </form>
    </div>
  </DetailSection>
  );
};

// Editable option row — inline rename, color swatch, delete
const OPTION_COLORS = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)",
  "oklch(0.78 0.10 25)",  "oklch(0.80 0.09 50)",  "oklch(0.83 0.10 80)",
  "oklch(0.82 0.09 150)", "oklch(0.80 0.08 220)", "oklch(0.80 0.06 250)",
  "oklch(0.78 0.06 290)", "oklch(0.55 0.05 280)", "oklch(0.65 0.18 25)",
];

const OptionRow = ({ asset, option, isLast, onRename, onDelete, onColorChange }) => {
  const [editing, setEditing] = useLbS(false);
  const [draft, setDraft] = useLbS(option.label);
  const [colorOpen, setColorOpen] = useLbS(false);
  const colorWrap = useLbR(null);

  useLbE(() => {
    if (!colorOpen) return;
    function h(e) { if (colorWrap.current && !colorWrap.current.contains(e.target)) setColorOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [colorOpen]);

  useLbE(() => { setDraft(option.label); }, [option.label]);

  const commit = () => {
    if (draft.trim() && draft !== option.label) onRename(draft.trim());
    setEditing(false);
  };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 10,
      padding: "10px 14px",
      borderBottom: isLast ? "none" : "1px solid var(--border-subtle)",
    }}>
      {/* Color swatch (clickable to change) */}
      <div ref={colorWrap} style={{ position: "relative", flexShrink: 0 }}>
        <button onClick={() => setColorOpen(o => !o)} title="Change color" style={{
          width: 14, height: 14, padding: 0, borderRadius: "50%",
          border: "none", cursor: "pointer",
          background: option.color,
          boxShadow: `0 0 0 3px color-mix(in oklch, ${option.color} 22%, transparent)`,
        }} />
        {colorOpen && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: -4,
            padding: 6, width: 168,
            background: "var(--popover)", border: "1px solid var(--border)",
            borderRadius: 8, boxShadow: "var(--shadow-popover)", zIndex: 50,
            display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4,
          }}>
            {OPTION_COLORS.map((c, i) => (
              <button key={i} onClick={() => { onColorChange(c); setColorOpen(false); }} style={{
                width: 18, height: 18, borderRadius: "50%",
                background: c, border: c === option.color ? "2px solid var(--foreground)" : "1px solid var(--border-subtle)",
                cursor: "pointer", padding: 0,
              }} />
            ))}
          </div>
        )}
      </div>

      {/* Label — inline edit on click */}
      {editing ? (
        <input autoFocus value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setDraft(option.label); setEditing(false); } }}
          style={{
            flex: 1, padding: "2px 6px", borderRadius: 4,
            border: "1px solid var(--primary)",
            background: "var(--background)", color: "var(--foreground)",
            fontSize: 13, fontWeight: 500, outline: "none", fontFamily: "var(--font-sans)",
          }} />
      ) : (
        <span onClick={() => setEditing(true)} style={{
          flex: 1, fontSize: 13, fontWeight: 500, cursor: "text",
          padding: "2px 6px", marginLeft: -6, borderRadius: 4,
          transition: "background 120ms ease",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          {option.label}
        </span>
      )}

      <span style={{
        fontSize: 11, padding: "1px 6px", borderRadius: 3,
        background: "var(--muted)", color: "var(--muted-foreground)",
        fontFamily: "var(--font-mono)",
      }}>{option.id}</span>

      <button onClick={() => {
        if (window.confirm(`"${option.label}" 옵션을 삭제할까요? 사용 중인 행은 로컬 값으로 유지됩니다.`)) {
          onDelete();
        }
      }} title="Delete option" style={{
        width: 22, height: 22, padding: 0, borderRadius: 4, border: "none",
        background: "transparent", color: "var(--muted-foreground)",
        display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-bg)"; e.currentTarget.style.color = "var(--destructive)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted-foreground)"; }}>
        <IconTrash size={11} />
      </button>
    </div>
  );
};

const FieldDetail = ({ asset, library, onConfigChange }) => {
  const c = asset.config || {};
  const olRef = c.optionListId ? (library?.optionLists || LIBRARY.optionLists).find(o => o.id === c.optionListId) : null;
  return (
    <>
      <DetailSection title="Definition">
        <div style={{
          padding: 14, background: "var(--card)",
          border: "1px solid var(--border-subtle)", borderRadius: 8,
          display: "grid", gridTemplateColumns: "max-content 1fr", rowGap: 10, columnGap: 16, fontSize: 13, alignItems: "center",
        }}>
          <DefRow label="Type" value={<code style={{ fontFamily: "var(--font-mono)", background: "var(--muted)", padding: "1px 6px", borderRadius: 3 }}>{asset.type}</code>} />
          {olRef && <DefRow label="Options" value={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
              <IconLink size={10} style={{ color: "var(--primary)" }} />
              <span style={{ fontFamily: "var(--font-mono)" }}>@{olRef.name}</span>
              <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>({olRef.options.length} options)</span>
            </span>
          } />}
          {c.options && <DefRow label="Options" value={
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {c.options.map(o => (
                <span key={o.id} style={{
                  fontSize: 11, padding: "1px 7px", borderRadius: 999,
                  background: `var(--status-${o.color}-bg)`, color: `var(--status-${o.color}-fg)`,
                  fontWeight: 500,
                }}>{o.label}</span>
              ))}
            </div>
          } />}
          <DefRow label="Required" value={
            <button onClick={() => onConfigChange?.({ required: !c.required })} style={{
              padding: "3px 10px", borderRadius: 999, border: "1px solid " + (c.required ? "var(--destructive)" : "var(--border)"),
              background: c.required ? "color-mix(in oklch, var(--destructive) 14%, transparent)" : "transparent",
              color: c.required ? "var(--destructive)" : "var(--muted-foreground)",
              fontSize: 11.5, fontWeight: 600, cursor: "pointer",
            }}>{c.required ? "Required ✓" : "Optional"}</button>
          } />
          <DefRow label="Default" value={
            <LibText value={c.default || ""}
              placeholder="(none)"
              onChange={(v) => onConfigChange?.({ default: v || null })}
              style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }} />
          } />
          <DefRow label="Format" value={
            <LibText value={c.format || ""}
              placeholder="(none)"
              onChange={(v) => onConfigChange?.({ format: v || null })}
              style={{ fontFamily: "var(--font-mono)", fontSize: 12.5 }} />
          } />
          <DefRow label="Validation" value={
            <LibText value={c.validation || ""}
              placeholder="(none)"
              onChange={(v) => onConfigChange?.({ validation: v || null })}
              style={{ fontSize: 12.5 }} />
          } />
        </div>
      </DetailSection>
    </>
  );
};

const DefRow = ({ label, value }) => (
  <>
    <span style={{ color: "var(--muted-foreground)", fontSize: 12, fontWeight: 500 }}>{label}</span>
    <span>{value}</span>
  </>
);

const TemplateDetail = ({ asset, library, onRemoveField, onAddField }) => {
  // Multi-table domain template — render each table as its own section
  if (asset.multiTable && Array.isArray(asset.tables) && asset.tables.length > 0) {
    return (
      <>
        <DetailSection title="Multi-table domain" count={asset.tables.length}>
          <div style={{
            padding: "10px 12px",
            background: "color-mix(in oklch, var(--primary) 6%, var(--card))",
            border: "1px solid color-mix(in oklch, var(--primary) 18%, transparent)",
            borderRadius: 7, fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5,
          }}>
            이 템플릿은 <b style={{ color: "var(--foreground)" }}>{asset.tables.length}개 테이블</b>을 한 번에 생성합니다. Schema {">"} <b>+ New table</b>에서 이 템플릿을 선택하세요.
          </div>
        </DetailSection>

        {asset.tables.map((t, idx) => (
          <DetailSection key={idx} title={t.label} count={t.columns?.length || 0}>
            <div style={{
              border: "1px solid var(--border-subtle)", borderRadius: 8,
              overflow: "hidden", background: "var(--card)",
            }}>
              {(t.columns || []).map((c, i) => (
                <div key={c.name} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 14px",
                  borderBottom: i < (t.columns.length - 1) ? "1px solid var(--border-subtle)" : "none",
                }}>
                  <span className="fb-tnum" style={{
                    fontSize: 11, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)",
                    width: 18, textAlign: "right",
                  }}>{i + 1}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{c.label || c.name}</span>
                  <span style={{
                    fontSize: 10.5, padding: "1px 6px", borderRadius: 3,
                    background: "var(--muted)", color: "var(--muted-foreground)",
                    fontFamily: "var(--font-mono)",
                  }}>{c.type}</span>
                </div>
              ))}
            </div>
          </DetailSection>
        ))}

        {asset.recommendedViews && asset.recommendedViews.length > 0 && (
          <DetailSection title="Recommended views">
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {asset.recommendedViews.map(v => (
                <span key={v} style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  padding: "3px 9px", borderRadius: 999,
                  background: "var(--active-bg-strong)",
                  color: "var(--foreground)", fontSize: 12, fontWeight: 500,
                }}>{v}</span>
              ))}
            </div>
          </DetailSection>
        )}
      </>
    );
  }

  // Single-table template (existing behavior)
  const lib = library || window.LIBRARY;
  const resolvedFields = (asset.fields || [])
    .map(fid => lib.fields.find(f => f.id === fid))
    .filter(Boolean);
  const [addOpen, setAddOpen] = useLbS(false);
  const wrap = useLbR(null);
  useLbE(() => {
    if (!addOpen) return;
    function h(e) { if (wrap.current && !wrap.current.contains(e.target)) setAddOpen(false); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [addOpen]);

  const availableFields = lib.fields.filter(f => !(asset.fields || []).includes(f.id));

  return (
    <>
      <DetailSection title="Fields" count={resolvedFields.length + (asset.extraFields?.length || 0)}>
        <div style={{
          border: "1px solid var(--border-subtle)", borderRadius: 8,
          overflow: "hidden", background: "var(--card)",
        }}>
          {resolvedFields.map((f, i) => (
            <FieldRow key={f.id} idx={i + 1} f={f} linked
              onRemove={onRemoveField ? () => onRemoveField(f.id) : null} />
          ))}
          {(asset.extraFields || []).map((f, i) => (
            <FieldRow key={"extra-" + i} idx={resolvedFields.length + i + 1} f={f} linked={false} />
          ))}
          {/* Add field button */}
          <div ref={wrap} style={{ position: "relative", borderTop: "1px solid var(--border-subtle)" }}>
            <button onClick={() => setAddOpen(o => !o)} disabled={!onAddField || availableFields.length === 0} style={{
              display: "flex", alignItems: "center", gap: 6,
              width: "100%", padding: "9px 14px",
              background: "transparent", border: "none",
              color: "var(--muted-foreground)", fontSize: 12.5, cursor: onAddField && availableFields.length > 0 ? "pointer" : "default",
              opacity: onAddField && availableFields.length > 0 ? 1 : 0.5,
            }}
            onMouseEnter={(e) => { if (onAddField && availableFields.length > 0) e.currentTarget.style.background = "var(--hover-bg)"; }}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              <IconPlus size={11} />
              <span>Add field from Library</span>
              {availableFields.length === 0 && <span style={{ marginLeft: "auto", fontSize: 10.5 }}>(all fields used)</span>}
            </button>
            {addOpen && availableFields.length > 0 && (
              <div style={{
                position: "absolute", top: "100%", left: 8, right: 8,
                background: "var(--popover)", border: "1px solid var(--border)",
                borderRadius: 7, boxShadow: "var(--shadow-popover)",
                zIndex: 50, padding: 4, maxHeight: 240, overflowY: "auto",
              }} className="fb-scroll">
                {availableFields.map(f => (
                  <button key={f.id} onClick={() => { onAddField(f.id); setAddOpen(false); }} style={{
                    display: "flex", alignItems: "center", gap: 8,
                    width: "100%", padding: "6px 8px", border: "none",
                    background: "transparent", borderRadius: 4, cursor: "pointer",
                    color: "var(--foreground)", textAlign: "left", fontSize: 12.5,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
                  onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                    <IconLink size={10} style={{ color: "var(--primary)" }} />
                    <span style={{ flex: 1 }}>{f.name}</span>
                    <span style={{ fontSize: 10.5, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)" }}>{f.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DetailSection>

      <DetailSection title="Recommended views">
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(asset.recommendedViews || []).map(v => (
            <span key={v} style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "3px 9px", borderRadius: 999,
              background: "var(--active-bg-strong)",
              color: "var(--foreground)", fontSize: 12, fontWeight: 500,
            }}>{v}</span>
          ))}
          {asset.defaultGroupBy && (
            <span style={{ fontSize: 11.5, color: "var(--muted-foreground)", alignSelf: "center" }}>
              · default group by <code style={{ fontFamily: "var(--font-mono)" }}>{asset.defaultGroupBy}</code>
            </span>
          )}
        </div>
      </DetailSection>
    </>
  );
};

const FieldRow = ({ idx, f, linked, onRemove }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 14px",
    borderBottom: "1px solid var(--border-subtle)",
  }}>
    <span className="fb-tnum" style={{
      fontSize: 11, color: "var(--muted-foreground)", fontFamily: "var(--font-mono)",
      width: 18, textAlign: "right",
    }}>{idx}</span>
    {linked && <IconLink size={10} style={{ color: "var(--primary)", flexShrink: 0 }} />}
    <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>{f.name}</span>
    <span style={{
      fontSize: 10.5, padding: "1px 6px", borderRadius: 3,
      background: "var(--muted)", color: "var(--muted-foreground)",
      fontFamily: "var(--font-mono)",
    }}>{f.type}</span>
    {f.config?.required && (
      <span style={{ fontSize: 10, color: "var(--destructive)", fontWeight: 600 }}>required</span>
    )}
    {onRemove && (
      <button onClick={onRemove} title="Remove from template" style={{
        width: 22, height: 22, padding: 0, borderRadius: 4, border: "none",
        background: "transparent", color: "var(--muted-foreground)",
        display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-bg)"; e.currentTarget.style.color = "var(--destructive)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted-foreground)"; }}>
        <IconX size={11} />
      </button>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Dashboard detail — shows signature, slots, chart specs
// ─────────────────────────────────────────────────────────────

const DashboardDetail = ({ asset, library }) => {
  const required = asset.signature?.required || [];
  const preferred = asset.signature?.preferred || [];
  const slots = Object.entries(asset.slots || {});
  const charts = asset.charts || [];

  return (
    <>
      <DetailSection title="Signature">
        <div style={{
          padding: 14, background: "var(--card)",
          border: "1px solid var(--border-subtle)", borderRadius: 8,
        }}>
          <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 6, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Required ({required.length})
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
            {required.length === 0 ? (
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>None — any table can use this</span>
            ) : required.map((spec, i) => (
              <SignatureChip key={i} spec={spec} required />
            ))}
          </div>
          {preferred.length > 0 && (
            <>
              <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginBottom: 6, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Preferred ({preferred.length})
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {preferred.map((spec, i) => <SignatureChip key={i} spec={spec} />)}
              </div>
            </>
          )}
        </div>
      </DetailSection>

      {slots.length > 0 && (
        <DetailSection title="Slots" count={slots.length}>
          <div style={{
            border: "1px solid var(--border-subtle)", borderRadius: 8,
            background: "var(--card)", overflow: "hidden",
          }}>
            {slots.map(([slotName, spec], i) => (
              <div key={slotName} style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "9px 14px",
                borderBottom: i < slots.length - 1 ? "1px solid var(--border-subtle)" : "none",
              }}>
                <code style={{ fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--primary)" }}>${slotName}</code>
                <span style={{ flex: 1 }} />
                <span style={{
                  fontSize: 10.5, padding: "1px 6px", borderRadius: 3,
                  background: "var(--muted)", color: "var(--muted-foreground)",
                  fontFamily: "var(--font-mono)",
                }}>{spec.type}</span>
                {spec.keywords && spec.keywords.length > 0 && (
                  <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                    {spec.keywords.slice(0, 3).join(", ")}
                  </span>
                )}
              </div>
            ))}
          </div>
        </DetailSection>
      )}

      <DetailSection title="Charts" count={charts.length}>
        <div style={{
          border: "1px solid var(--border-subtle)", borderRadius: 8,
          background: "var(--card)", overflow: "hidden",
        }}>
          {charts.map((c, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 14px",
              borderBottom: i < charts.length - 1 ? "1px solid var(--border-subtle)" : "none",
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: 4,
                background: "color-mix(in oklch, var(--primary) 14%, transparent)",
                color: "var(--primary)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 600, flexShrink: 0,
              }}>{i + 1}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{c.title}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 3, fontSize: 11, color: "var(--muted-foreground)" }}>
                  <ChartSpecChip label="type">{c.type}</ChartSpecChip>
                  {c.width && <ChartSpecChip label="w">{c.width}</ChartSpecChip>}
                  {c.dim && <ChartSpecChip label="dim">{c.dim}</ChartSpecChip>}
                  {c.dimX && <ChartSpecChip label="X">{c.dimX}</ChartSpecChip>}
                  {c.dimY && <ChartSpecChip label="Y">{c.dimY}</ChartSpecChip>}
                  {c.stackBy && <ChartSpecChip label="stack">{c.stackBy}</ChartSpecChip>}
                  {c.splitBy && <ChartSpecChip label="split">{c.splitBy}</ChartSpecChip>}
                  {c.dateCol && <ChartSpecChip label="date">{c.dateCol}</ChartSpecChip>}
                  {c.granularity && <ChartSpecChip label="">{c.granularity}</ChartSpecChip>}
                  {c.metric && <ChartSpecChip label="metric">{c.metric}</ChartSpecChip>}
                  {c.metricCol && <ChartSpecChip label="col">{c.metricCol}</ChartSpecChip>}
                  {c.metricValue && <ChartSpecChip label="value">{c.metricValue}</ChartSpecChip>}
                  {c.numCol && <ChartSpecChip label="num">{c.numCol}</ChartSpecChip>}
                  {c.denCol && <ChartSpecChip label="den">{c.denCol}</ChartSpecChip>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </DetailSection>
    </>
  );
};

const SignatureChip = ({ spec, required }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "3px 9px", borderRadius: 999,
    background: required ? "color-mix(in oklch, var(--primary) 12%, transparent)" : "var(--muted)",
    color: required ? "var(--primary)" : "var(--muted-foreground)",
    fontSize: 11.5, fontWeight: 500,
  }}>
    {spec.type && (
      <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>{spec.type}</span>
    )}
    {spec.keywords && spec.keywords.length > 0 && (
      <span style={{ opacity: 0.8 }}>· {spec.keywords.slice(0, 2).join(" / ")}</span>
    )}
  </span>
);

const ChartSpecChip = ({ label, children }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 3,
    padding: "1px 6px", borderRadius: 3,
    background: "var(--muted)",
    fontFamily: "var(--font-mono)",
    color: "var(--muted-foreground)",
  }}>
    {label && <span style={{ opacity: 0.65 }}>{label}:</span>}
    <span style={{ color: "var(--foreground)" }}>{children}</span>
  </span>
);

const RuleDetail = ({ asset, onLabelChange }) => (
  <>
    <DetailSection title="Label">
      <LibText value={asset.label || ""}
        placeholder="Human-readable label"
        onChange={(v) => onLabelChange?.(v)}
        style={{ fontSize: 14, fontWeight: 500 }} />
    </DetailSection>

    <DetailSection title="Parameters">
      <div style={{
        border: "1px solid var(--border-subtle)", borderRadius: 8,
        overflow: "hidden", background: "var(--card)",
      }}>
        {asset.params.map((p, i) => (
          <div key={p.name} style={{
            display: "grid", gridTemplateColumns: "150px 110px 1fr", gap: 12,
            padding: "10px 14px", alignItems: "center",
            borderBottom: i < asset.params.length - 1 ? "1px solid var(--border-subtle)" : "none",
          }}>
            <code style={{ fontFamily: "var(--font-mono)", fontSize: 12.5, color: "var(--foreground)" }}>{p.name}</code>
            <span style={{
              fontSize: 11, padding: "1px 6px", borderRadius: 3,
              background: "var(--muted)", color: "var(--muted-foreground)",
              fontFamily: "var(--font-mono)", justifySelf: "start",
            }}>{p.type}</span>
            <span style={{ fontSize: 12.5, color: "var(--muted-foreground)" }}>{p.desc}</span>
          </div>
        ))}
      </div>
    </DetailSection>

    <DetailSection title="Example">
      <div style={{
        padding: 14, background: "var(--card)",
        border: "1px solid var(--border-subtle)", borderRadius: 8,
        fontFamily: "var(--font-mono)", fontSize: 12.5,
        color: "var(--foreground)", lineHeight: 1.6,
        whiteSpace: "pre-wrap", wordBreak: "break-word",
      }}>{asset.example}</div>
    </DetailSection>
  </>
);

// ─────────────────────────────────────────────────────────────
// Category catalog as SHEET — rows × type-appropriate columns
// ─────────────────────────────────────────────────────────────

const CategorySheet = ({ category, items, onSelectAsset, onCreateAsset }) => {
  const tint = CATEGORY_COLORS[category.id];

  // Per-category column spec
  const cols = {
    optionLists: [
      { key: "name",      label: "Name",     width: 180 },
      { key: "options",   label: "Options",  width: 80,  render: (a) => <span className="fb-tnum">{a.options?.length || 0}</span> },
      { key: "preview",   label: "Preview",  width: 280, render: (a) => (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {a.options.slice(0, 4).map(o => (
            <span key={o.id} style={{
              fontSize: 10.5, padding: "1px 6px", borderRadius: 999,
              background: `color-mix(in oklch, ${o.color} 22%, transparent)`,
              color: o.color, fontWeight: 500,
            }}>{o.label}</span>
          ))}
          {a.options.length > 4 && <span style={{ fontSize: 10.5, color: "var(--muted-foreground)" }}>+{a.options.length - 4}</span>}
        </div>
      )},
      { key: "usedIn",    label: "Used in",  width: 220, render: (a) => <UsedInChips usage={a.usedIn} /> },
      { key: "desc",      label: "Description", width: 240, render: (a) => <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>{a.desc}</span> },
    ],
    fields: [
      { key: "name",      label: "Name",     width: 160 },
      { key: "type",      label: "Type",     width: 90,  render: (a) => <TypeBadge type={a.type} /> },
      { key: "required",  label: "Required", width: 80,  render: (a) => a.config?.required ? <span style={{ fontSize: 11, color: "var(--destructive)", fontWeight: 600 }}>YES</span> : <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>—</span> },
      { key: "default",   label: "Default",  width: 100, render: (a) => a.config?.default ? <code style={{ fontFamily: "var(--font-mono)", fontSize: 11.5, background: "var(--muted)", padding: "1px 5px", borderRadius: 3 }}>{a.config.default}</code> : <span style={{ color: "var(--muted-foreground)" }}>—</span> },
      { key: "usedIn",    label: "Used in",  width: 200, render: (a) => <UsedInChips usage={a.usedIn} /> },
      { key: "desc",      label: "Description", width: 220, render: (a) => <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>{a.desc}</span> },
    ],
    templates: [
      { key: "name",      label: "Name",     width: 180 },
      { key: "fields",    label: "Fields",   width: 80,  render: (a) => <span className="fb-tnum">{(a.fields?.length || 0) + (a.extraFields?.length || 0)}</span> },
      { key: "views",     label: "Views",    width: 180, render: (a) => (
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {(a.recommendedViews || []).map(v => (
            <span key={v} style={{ fontSize: 10.5, padding: "1px 6px", borderRadius: 3, background: "var(--muted)", color: "var(--muted-foreground)" }}>{v}</span>
          ))}
        </div>
      )},
      { key: "usedIn",    label: "Used in",  width: 180, render: (a) => <UsedInChips usage={a.usedIn} /> },
      { key: "desc",      label: "Description", width: 240, render: (a) => <span style={{ color: "var(--muted-foreground)", fontSize: 12 }}>{a.desc}</span> },
    ],
    functions: [
      { key: "name",      label: "Name",     width: 200, render: (a) => <code style={{ fontFamily: "var(--font-mono)", fontSize: 12, fontWeight: 600 }}>{a.name}</code> },
      { key: "label",     label: "Label",    width: 150, render: (a) => <span>{a.label}</span> },
      { key: "params",    label: "Params",   width: 120, render: (a) => <span className="fb-tnum" style={{ color: "var(--muted-foreground)" }}>{a.params.length} params</span> },
      { key: "usedIn",    label: "Used in",  width: 200, render: (a) => <UsedInChips usage={a.usedIn} /> },
      { key: "example",   label: "Example",  width: 320, render: (a) => (
        <code style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted-foreground)",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block",
        }}>{a.example}</code>
      )},
    ],
  }[category.id] || [];

  const totalWidth = cols.reduce((acc, c) => acc + c.width, 0) + 30;

  return (
    <div className="fb-scroll" style={{ flex: 1, overflow: "auto", background: "var(--background)" }}>
      <table style={{
        borderCollapse: "separate", borderSpacing: 0,
        width: "max(100%, " + totalWidth + "px)",
        tableLayout: "fixed",
      }}>
        <colgroup>
          {cols.map(c => <col key={c.key} style={{ width: c.width }} />)}
        </colgroup>
        <thead>
          <tr>
            {cols.map(c => (
              <th key={c.key} style={{
                position: "sticky", top: 0, zIndex: 1,
                padding: "9px 14px", textAlign: "left",
                background: "var(--surface)", borderBottom: "1px solid var(--border)",
                fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)",
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map(item => (
            <tr key={item.id} onClick={() => onSelectAsset(category.id, item.id)} style={{
              cursor: "pointer",
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
              {cols.map((c, ci) => (
                <td key={c.key} style={{
                  padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)",
                  fontSize: 13, verticalAlign: "middle",
                }}>
                  {ci === 0 ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        width: 6, height: 6, borderRadius: "50%",
                        background: tint, flexShrink: 0,
                      }} />
                      {c.render ? c.render(item) : <span style={{ fontWeight: 500 }}>{item[c.key] || "—"}</span>}
                    </span>
                  ) : (
                    c.render ? c.render(item) : (item[c.key] || <span style={{ color: "var(--muted-foreground)" }}>—</span>)
                  )}
                </td>
              ))}
            </tr>
          ))}
          {/* + Add new row */}
          <tr>
            <td colSpan={cols.length} onClick={() => onCreateAsset?.(category.id)} style={{
              padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)",
              fontSize: 12.5, color: "var(--muted-foreground)", cursor: "pointer",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover-bg)"; e.currentTarget.style.color = "var(--primary)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted-foreground)"; }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <IconPlus size={11} />
                <span>New {category.label.slice(0, -1)}</span>
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const UsedInChips = ({ usage }) => {
  if (!usage || usage.length === 0) return <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>unused</span>;
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
      {usage.slice(0, 3).map((u, i) => (
        <span key={i} style={{
          fontSize: 10.5, padding: "1px 6px", borderRadius: 3,
          background: "color-mix(in oklch, var(--primary) 14%, transparent)",
          color: "var(--primary)", fontFamily: "var(--font-mono)", fontWeight: 500,
        }}>{u}</span>
      ))}
      {usage.length > 3 && <span style={{ fontSize: 10.5, color: "var(--muted-foreground)" }}>+{usage.length - 3}</span>}
    </div>
  );
};

const TypeBadge = ({ type }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    fontSize: 11, padding: "1px 7px", borderRadius: 3,
    background: "var(--muted)", color: "var(--muted-foreground)",
    fontFamily: "var(--font-mono)", fontWeight: 500,
  }}>{type}</span>
);

// ─────────────────────────────────────────────────────────────
// Library Insights — right detail bar for Library mode
// ─────────────────────────────────────────────────────────────

const LibraryInsights = ({ onClose, library }) => {
  const lib = library || window.LIBRARY || {};
  const all = LIBRARY_CATEGORIES.map(c => {
    let items = lib[c.id];
    if (!items && c.id === "functions" && lib.rules) items = lib.rules;
    return { ...c, items: items || [] };
  });
  const totalAssets = all.reduce((acc, c) => acc + c.items.length, 0);
  const inUse = all.flatMap(c => c.items).filter(i => (i.usedIn?.length || 0) > 0).length;
  const unused = totalAssets - inUse;
  const linkedColumns = all.flatMap(c => c.items).reduce((acc, i) => acc + (i.usedIn?.length || 0), 0);

  // Top-used
  const topUsed = all.flatMap(c => c.items)
    .filter(i => (i.usedIn?.length || 0) > 0)
    .sort((a, b) => (b.usedIn?.length || 0) - (a.usedIn?.length || 0))
    .slice(0, 4);

  return (
    <aside style={{
      width: 280, flexShrink: 0,
      borderLeft: "1px solid var(--border-subtle)",
      background: "var(--surface)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      <div style={{
        height: 40, flexShrink: 0,
        display: "flex", alignItems: "center", gap: 8,
        padding: "0 12px",
        borderBottom: "1px solid var(--border-subtle)",
      }}>
        <span style={{ fontSize: 12, fontWeight: 600 }}>Library insights</span>
        <div style={{ flex: 1 }} />
        <button onClick={onClose} style={{
          width: 22, height: 22, borderRadius: 4, border: "none",
          background: "transparent", color: "var(--muted-foreground)",
          display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}
        onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
        onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          <IconX size={12} />
        </button>
      </div>

      <div className="fb-scroll" style={{ flex: 1, overflowY: "auto", padding: 14 }}>
        {/* Total */}
        <div style={{ marginBottom: 18 }}>
          <SectionLabel>Total assets</SectionLabel>
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.03em" }} className="fb-tnum">{totalAssets}</div>
          <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
            {all.map(c => {
              const G = CATEGORY_ICONS[c.id];
              const ct = CATEGORY_COLORS[c.id];
              return (
                <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                  <G size={11} style={{ color: ct, flexShrink: 0 }} />
                  <span style={{ flex: 1, color: "var(--foreground)" }}>{c.label}</span>
                  <span className="fb-tnum" style={{ color: "var(--muted-foreground)", fontWeight: 500 }}>{c.items.length}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Usage */}
        <div style={{ marginBottom: 18 }}>
          <SectionLabel>Usage</SectionLabel>
          <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
            <Stat label="In use"    value={inUse}    tone="var(--status-done-fg)" />
            <Stat label="Unused"    value={unused}   tone="var(--muted-foreground)" />
          </div>
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted-foreground)" }}>
            Total linked columns:{" "}
            <b style={{ color: "var(--foreground)", fontWeight: 600 }} className="fb-tnum">{linkedColumns}</b>
          </div>
        </div>

        {/* Top used */}
        {topUsed.length > 0 && (
          <div>
            <SectionLabel>Top used</SectionLabel>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {topUsed.map(it => {
                const cat = LIBRARY_CATEGORIES.find(c => (lib[c.id] || []).includes(it));
                const G = cat ? CATEGORY_ICONS[cat.id] : null;
                const ct = cat ? CATEGORY_COLORS[cat.id] : "var(--muted-foreground)";
                return (
                  <div key={it.id} style={{
                    display: "flex", alignItems: "center", gap: 7,
                    padding: "6px 8px", borderRadius: 5,
                    background: "var(--card)",
                    border: "1px solid var(--border-subtle)",
                  }}>
                    {G && <G size={11} style={{ color: ct }} />}
                    <span style={{ fontSize: 12, fontWeight: 500, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</span>
                    <span style={{
                      fontSize: 10.5, padding: "1px 6px", borderRadius: 3,
                      background: "color-mix(in oklch, var(--primary) 18%, transparent)",
                      color: "var(--primary)", fontWeight: 600,
                    }} className="fb-tnum">{it.usedIn.length}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em",
    textTransform: "uppercase", color: "var(--muted-foreground)",
    marginBottom: 6,
  }}>{children}</div>
);

const Stat = ({ label, value, tone }) => (
  <div style={{
    flex: 1, padding: "8px 10px", borderRadius: 6,
    background: "var(--card)", border: "1px solid var(--border-subtle)",
  }}>
    <div style={{ fontSize: 10.5, color: "var(--muted-foreground)", fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 2 }}>{label}</div>
    <div style={{ fontSize: 18, fontWeight: 700, color: tone || "var(--foreground)" }} className="fb-tnum">{value}</div>
  </div>
);

// ─────────────────────────────────────────────────────────────
// Library AI Panel — right-side AI panel for Library mode
//   (Stub content: suggestions / health / activity)
// ─────────────────────────────────────────────────────────────

const LibraryAIPanel = () => {
  const suggestions = [
    {
      id: "s1",
      kind: "promote",
      title: "Promote dropdown to Library",
      detail: "Tasks의 '처리상태' dropdown이 Returns 테이블에도 동일하게 쓰이는 것 같아요. @처리상태로 승격할까요?",
    },
    {
      id: "s2",
      kind: "extend",
      title: "Extend Option List",
      detail: "최근 4건의 Tasks 행에 '교환완료'가 자유 입력으로 들어옴. @처리방식에 추가할까요?",
    },
  ];
  const activity = [
    { title: "Added @사업부",            detail: "5 options seeded · 2026-04-20", time: "5 days ago" },
    { title: "Edited @처리방식",         detail: "Renamed '환불' → '불량환불'",    time: "2 days ago" },
    { title: "Linked @모델명 to Tasks", detail: "Tasks.모델명",                  time: "today"      },
  ];

  return (
    <aside style={{
      width: 320, flexShrink: 0,
      borderLeft: "1px solid var(--border-subtle)",
      background: "var(--surface)",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div style={{
        height: 48, flexShrink: 0, padding: "0 14px",
        borderBottom: "1px solid var(--border-subtle)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{
          width: 22, height: 22, borderRadius: 5,
          background: "color-mix(in oklch, var(--primary) 22%, transparent)",
          color: "var(--primary)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          <IconSparkles size={12} />
        </span>
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Library AI</span>
          <span style={{ fontSize: 10.5, color: "var(--muted-foreground)" }}>{suggestions.length} suggestions</span>
        </div>
      </div>

      <div className="fb-scroll" style={{ flex: 1, overflowY: "auto", padding: 14 }}>
        {/* Suggestions */}
        <div style={{
          fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 8,
        }}>Suggestions</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {suggestions.map(s => (
            <div key={s.id} style={{
              padding: "10px 12px", borderRadius: 7,
              background: "var(--card)", border: "1px solid var(--border-subtle)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <IconSparkles size={11} style={{ color: "var(--primary)" }} />
                <span style={{ fontSize: 12.5, fontWeight: 600 }}>{s.title}</span>
              </div>
              <div style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5, marginBottom: 8 }}>
                {s.detail}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button style={{
                  padding: "3px 9px", borderRadius: 5,
                  background: "var(--primary)", border: "1px solid var(--primary)",
                  color: "var(--primary-foreground)", fontSize: 11.5, fontWeight: 500, cursor: "pointer",
                }}>Apply</button>
                <button style={{
                  padding: "3px 9px", borderRadius: 5,
                  background: "transparent", border: "1px solid var(--border)",
                  color: "var(--muted-foreground)", fontSize: 11.5, fontWeight: 500, cursor: "pointer",
                }}>Dismiss</button>
              </div>
            </div>
          ))}
        </div>

        {/* Activity timeline */}
        <div style={{
          fontSize: 10.5, fontWeight: 600, letterSpacing: "0.08em",
          textTransform: "uppercase", color: "var(--muted-foreground)", marginBottom: 8,
        }}>Activity</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {activity.map((a, i) => (
            <div key={i} style={{
              padding: "6px 4px",
              fontSize: 12, color: "var(--foreground)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--muted-foreground)", flexShrink: 0 }} />
                <span style={{ fontWeight: 500, flex: 1 }}>{a.title}</span>
                <span style={{ fontSize: 10.5, color: "var(--muted-foreground)" }}>{a.time}</span>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginLeft: 10, marginTop: 1 }}>{a.detail}</div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

// ─────────────────────────────────────────────────────────────
// Workspace mode — sidebar with Schema / Automations entries
// ─────────────────────────────────────────────────────────────

const WORKSPACE_ITEMS = [
  { id: "schema",      label: "Schema",      Glyph: IconSchema,
    desc: "Tables · Fields · Relations" },
  { id: "automations", Glyph: IconBolt,      label: "Automations",
    desc: "Cross-table triggers · WHEN-THEN flows" },
];

const WorkspaceSidebar = ({ active, onSelect }) => (
  <aside style={{
    width: 240, flexShrink: 0,
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
        background: "color-mix(in oklch, var(--chart-4) 22%, transparent)",
        color: "var(--chart-4)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
      }}>
        <IconLayers size={13} />
      </span>
      <span style={{ fontWeight: 600 }}>Workspace</span>
    </div>
    <div style={{ padding: "8px 8px", flex: 1 }}>
      {WORKSPACE_ITEMS.map(it => {
        const on = it.id === active;
        return (
          <button key={it.id} onClick={() => onSelect(it.id)} style={{
            display: "flex", alignItems: "center", gap: 9,
            width: "100%", padding: "8px 10px", borderRadius: 6,
            border: "none",
            background: on ? "var(--active-bg-strong)" : "transparent",
            color: "var(--foreground)", cursor: "pointer", textAlign: "left",
            position: "relative",
          }}
          onMouseEnter={(e) => { if (!on) e.currentTarget.style.background = "var(--hover-bg)"; }}
          onMouseLeave={(e) => { if (!on) e.currentTarget.style.background = "transparent"; }}>
            {on && <span style={{ position: "absolute", left: 4, top: 8, bottom: 8, width: 2, background: "var(--primary)", borderRadius: 1 }} />}
            <it.Glyph size={13} style={{ color: on ? "var(--primary)" : "var(--sidebar-muted)", flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: on ? 600 : 500 }}>{it.label}</div>
              <div style={{ fontSize: 11, color: "var(--sidebar-muted)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.desc}</div>
            </div>
          </button>
        );
      })}
    </div>
    <div style={{
      padding: "10px 14px",
      borderTop: "1px solid var(--sidebar-border)",
      fontSize: 11, color: "var(--sidebar-muted)", lineHeight: 1.5,
    }}>
      구조와 행동을<br />디자인하는 곳.
    </div>
  </aside>
);

const WorkspaceView = ({
  active, onSelect,
  theme, setTheme, panels, onTogglePanel, onShowAllPanels, onHideAllPanels,
  children, navSlot,
}) => {
  const [wsSearch, setWsSearch] = useLbS("");
  const current = WORKSPACE_ITEMS.find(i => i.id === active) || WORKSPACE_ITEMS[0];
  const breadcrumb = (
    <>
      <span style={{ color: "var(--muted-foreground)" }}>peter's workspace</span>
      <span style={{ color: "var(--muted-foreground)", opacity: 0.5, margin: "0 6px" }}>/</span>
      <span style={{ color: "var(--muted-foreground)" }}>Workspace</span>
      <span style={{ color: "var(--muted-foreground)", opacity: 0.5, margin: "0 6px" }}>/</span>
      <span style={{ fontWeight: 600 }}>{current.label}</span>
    </>
  );
  return (
    <main style={{
      flex: 1, display: "flex", flexDirection: "column",
      minWidth: 0, background: "var(--background)",
    }}>
      <InteractiveHeader
        theme={theme} setTheme={setTheme}
        search={wsSearch} onSearch={setWsSearch}
        breadcrumb={breadcrumb}
        leadingSlot={panels && onTogglePanel ? (
          <PanelsMenu panels={panels} onToggle={onTogglePanel} onShowAll={onShowAllPanels} onHideAll={onHideAllPanels} />
        ) : null}
        navSlot={navSlot}
      />
      {children}
    </main>
  );
};

// Expose
Object.assign(window, {
  InteractiveActivityBar,
  LibrarySidebar,
  LibraryView,
  IconLibrary,
  LibraryInsights,
  LibraryAIPanel,
  WorkspaceSidebar,
  WorkspaceView,
  WORKSPACE_ITEMS,
});
