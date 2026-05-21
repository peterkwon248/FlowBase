/* @jsx React.createElement */
// FlowBase — workspace-of-tables real app: persistence, real Claude AI, import, undo.

const { useState: useSt, useEffect: useEf, useMemo: useMm, useCallback: useCb, useRef: useRf } = React;

const STORAGE_KEY = "flowbase-state-v4";   // bumped: schema changed (tablesById)
const HISTORY_LIMIT = 30;

function pad(n) { return String(n).padStart(2, "0"); }
function nowStamp() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}
function saveState(s) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

const DEFAULT_STATE = () => ({
  tablesById: initialTablesById(),
  activeTableId: "interviews",
  theme: "dark",
  view: "sheet",
  filter: [],
  search: "",
  sort: { key: "date", dir: "desc" },
  panels: { activityBar: true, sidebar: true, aiPanel: true, detailBar: false },
  aiHistory: [
    { title: "Imported from Google Sheets",   detail: "Customer Interviews · 10 rows · 8 columns", time: "08:14" },
    { title: "Detected types for 8 columns",  detail: "3 text · 1 date · 2 select · 1 status · 1 priority", time: "08:14" },
    { title: "Inferred 14 Theme cells",       detail: "Pending review",  time: "08:16" },
    { title: "Inferred 12 Sentiment cells",   detail: "Pending review",  time: "08:16" },
  ],
});

function ProtoApp() {
  const persisted = useMm(() => loadState(), []);
  const initial = persisted || DEFAULT_STATE();
  // backward-safety: if persisted lacks tablesById, fall through to defaults — and merge in any newly-added tables
  // Columns: if user has added/customized columns, use stored; otherwise fall back to defaults
  const startingTables = (() => {
    const defaults = initialTablesById();
    const stored = initial.tablesById || {};
    const out = {};
    Object.keys(defaults).forEach((id) => {
      if (stored[id]) {
        out[id] = {
          ...defaults[id],
          ...stored[id],
          columns: stored[id].columns || defaults[id].columns,
        };
      } else {
        out[id] = defaults[id];
      }
    });
    return out;
  })();
  // Migrate stale "schema" view (now a workspace-level item) to "sheet"
  const initialView = initial.view === "schema" ? "sheet" : (initial.view || "sheet");

  const [tablesById, setTablesByIdState] = useSt(startingTables);
  const [activeTableId, setActiveTableId] = useSt(initial.activeTableId || "interviews");
  const [theme, setTheme] = useSt(initial.theme);
  const [view, setView] = useSt(initialView);
  const [search, setSearch] = useSt(initial.search);
  const [filter, setFilter] = useSt(new Set(initial.filter));
  const [priorityFilter, setPriorityFilter] = useSt(new Set(initial.priorityFilter || []));
  const [themeFilter,    setThemeFilter]    = useSt(new Set(initial.themeFilter || []));
  const [sentimentFilter, setSentimentFilter] = useSt(new Set(initial.sentimentFilter || []));
  const [selectedIds, setSelectedIds] = useSt([]);
  const [sort, setSort] = useSt(initial.sort);
  const [groupBy, setGroupBy] = useSt(initial.groupBy || "none");
  const [hiddenColsByTable, setHiddenColsByTable] = useSt(initial.hiddenColsByTable || {});
  const [enabledViewsByTable, setEnabledViewsByTable] = useSt(initial.enabledViewsByTable || {});
  const [focusedCell, setFocusedCell] = useSt(null);
  const [aiHistory, setAiHistory] = useSt(initial.aiHistory);
  const [panels, setPanels] = useSt(() => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 720;
    return {
      activityBar: isMobile ? false : (initial.panels?.activityBar ?? true),
      sidebar:     isMobile ? false : (initial.panels?.sidebar ?? true),
      aiPanel:     isMobile ? false : (initial.panels?.aiPanel ?? true),
      detailBar:   isMobile ? false : (initial.panels?.detailBar ?? false),
    };
  });
  const [importOpen, setImportOpen] = useSt(false);
  const [searchOpen, setSearchOpen] = useSt(false);
  const [newTableOpen, setNewTableOpen] = useSt(false);
  const [toast, setToast] = useSt(null);
  const [activeWorkspaceItem, setActiveWorkspaceItem] = useSt(null);   // "schema" | "automations" | null
  const nav = window.useNavHistory ? window.useNavHistory() : { push: () => {}, goBack: () => null, goForward: () => null, canBack: false, canForward: false, stack: [] };
  const navSuppress = useRf(false);

  // Push history when meaningful objects change
  useEf(() => {
    if (navSuppress.current) { navSuppress.current = false; return; }
    let entry = null;
    if (activityMode === "tables" && activeTableId) {
      const t = tablesById[activeTableId];
      entry = { key: "table:" + activeTableId, mode: "tables", tableId: activeTableId, label: t?.label || "Table", sub: "Tables", icon: "▦" };
    } else if (activityMode === "library" && libAssetId) {
      const cat = (library?.[libCategory] || []).find(a => a.id === libAssetId);
      entry = { key: "lib:" + libCategory + ":" + libAssetId, mode: "library", libCategory, libAssetId, label: cat?.name || "Asset", sub: "Library / " + libCategory, icon: "📚" };
    } else if (activityMode === "library") {
      entry = { key: "lib:" + libCategory, mode: "library", libCategory, libAssetId: null, label: libCategory, sub: "Library", icon: "📚" };
    } else if (activityMode === "wiki" && wikiPageId) {
      const p = wikiPages.find(x => x.id === wikiPageId);
      entry = { key: "wiki:" + wikiPageId, mode: "wiki", wikiPageId, label: p?.title || "Page", sub: "Wiki", icon: "📄" };
    } else if (activityMode === "workspace") {
      entry = { key: "ws:" + (activeWorkspaceItem || "schema"), mode: "workspace", activeWorkspaceItem, label: activeWorkspaceItem || "schema", sub: "Workspace", icon: "▤" };
    } else if (activityMode === "inbox") {
      entry = { key: "inbox", mode: "inbox", label: "Inbox", sub: "", icon: "✉" };
    } else if (activityMode === "search") {
      entry = { key: "search", mode: "search", label: "Search", sub: "", icon: "⌕" };
    }
    if (entry) nav.push(entry);
  }, [activityMode, activeTableId, libCategory, libAssetId, wikiPageId, activeWorkspaceItem]);

  const applyHistoryEntry = (e) => {
    if (!e) return;
    navSuppress.current = true;
    setActivityMode(e.mode);
    if (e.mode === "tables" && e.tableId) switchTable(e.tableId);
    if (e.mode === "library") { setLibCategory(e.libCategory); setLibAssetId(e.libAssetId); }
    if (e.mode === "wiki") setWikiPageId(e.wikiPageId);
    if (e.mode === "workspace") setActiveWorkspaceItem(e.activeWorkspaceItem);
  };

  const navSlotEl = (
    <NavCluster
      canBack={nav.canBack}
      canForward={nav.canForward}
      onBack={() => { const e = nav.goBack(); applyHistoryEntry(e); }}
      onForward={() => { const e = nav.goForward(); applyHistoryEntry(e); }}
      history={nav.stack}
      onJump={(e) => applyHistoryEntry(e)}
    />
  );

  const [activityMode, setActivityMode] = useSt(initial.activityMode || "tables"); // "tables" | "library"
  const [libCategory, setLibCategory] = useSt(initial.libCategory || "optionLists");
  const [libAssetId, setLibAssetId] = useSt(initial.libAssetId || null);
  const [libView, setLibView] = useSt(initial.libView || "cards"); // "cards" | "sheet"
  const [wikiPages, setWikiPagesState] = useSt(initial.wikiPages || SEED_PAGES);
  const [wikiPageId, setWikiPageId] = useSt(initial.wikiPageId || SEED_PAGES[0].id);
  const [inboxFilter, setInboxFilter] = useSt("all");

  // Refs for snapshot logic
  const tablesByIdRef = useRf(null);
  const wikiPagesRef = useRf(wikiPages);
  const libraryRef = useRf(library);
  useEf(() => { tablesByIdRef.current = tablesById; }, [tablesById]);
  useEf(() => { wikiPagesRef.current = wikiPages; }, [wikiPages]);
  useEf(() => { libraryRef.current = library; }, [library]);

  // Undo-aware library setter
  const setLibrary = useCb((next) => {
    setLibraryState(prev => {
      const resolved = typeof next === "function" ? next(prev) : next;
      if (skipNextUndoPush.current) {
        skipNextUndoPush.current = false;
      } else {
        undoStack.current.push({ tablesById: tablesByIdRef.current, library: prev, wikiPages: wikiPagesRef.current });
        if (undoStack.current.length > HISTORY_LIMIT) undoStack.current.shift();
        redoStack.current = [];
      }
      return resolved;
    });
  }, []);

  // Undo-aware setter for wiki pages
  const setWikiPages = useCb((next) => {
    setWikiPagesState(prev => {
      const resolved = typeof next === "function" ? next(prev) : next;
      if (skipNextUndoPush.current) {
        skipNextUndoPush.current = false;
      } else {
        undoStack.current.push({ tablesById: tablesByIdRef.current, library: libraryRef.current, wikiPages: prev });
        if (undoStack.current.length > HISTORY_LIMIT) undoStack.current.shift();
        redoStack.current = [];
      }
      return resolved;
    });
  }, []);

  // Library state — editable, persisted. Initialized from window.LIBRARY constants.
  const [library, setLibraryState] = useSt(() => {
    const base = JSON.parse(JSON.stringify(window.LIBRARY));
    if (initial.library) {
      // Migrate older state shape: "rules" → "functions"
      const merged = { ...base, ...initial.library };
      if (!merged.functions || merged.functions.length === 0) {
        if (merged.rules && merged.rules.length > 0) merged.functions = merged.rules;
        else merged.functions = base.functions;
      }
      // Ensure dashboards exist (new in this version)
      if (!merged.dashboards) merged.dashboards = base.dashboards;
      // ── Auto-migrate: merge new seed assets (by id) into stored library ──
      ["optionLists", "fields", "templates", "functions", "dashboards"].forEach(cat => {
        if (!merged[cat]) { merged[cat] = base[cat] || []; return; }
        const have = new Set(merged[cat].map(a => a.id));
        (base[cat] || []).forEach(a => { if (!have.has(a.id)) merged[cat].push(a); });
      });
      delete merged.rules;
      return merged;
    }
    return base;
  });

  // Mirror library state back to window.LIBRARY so existing direct readers (CellEditor, rule-engine) see updates
  useEf(() => {
    Object.assign(window.LIBRARY, library);
  }, [library]);
  const [rowHeight, setRowHeight] = useSt(initial.rowHeight || "medium");
  const [cellStyle, setCellStyle] = useSt(initial.cellStyle || "default");
  const [wordWrap, setWordWrap] = useSt(initial.wordWrap ?? false);
  const [newRowPosition, setNewRowPosition] = useSt(initial.newRowPosition || "top"); // "top" | "bottom"

  const undoStack = useRf([]);
  const redoStack = useRf([]);
  const skipNextUndoPush = useRf(false);

  const activeTable = tablesById[activeTableId] || tablesById.interviews;
  const rows = activeTable.rows;
  const columns = activeTable.columns;

  // Undo-aware setter for tables (snapshot whole tablesById on change)
  const setTablesById = useCb((next) => {
    setTablesByIdState(prev => {
      const resolved = typeof next === "function" ? next(prev) : next;
      if (skipNextUndoPush.current) {
        skipNextUndoPush.current = false;
      } else {
        undoStack.current.push(prev);
        if (undoStack.current.length > HISTORY_LIMIT) undoStack.current.shift();
        redoStack.current = [];
      }
      return resolved;
    });
  }, []);

  // Convenience: update only the active table's rows
  const setActiveRows = useCb((mapper) => {
    setTablesById(prev => {
      const t = prev[activeTableId];
      if (!t) return prev;
      const nextRows = typeof mapper === "function" ? mapper(t.rows) : mapper;
      return { ...prev, [activeTableId]: { ...t, rows: nextRows } };
    });
  }, [activeTableId, setTablesById]);

  // Sync theme
  useEf(() => {
    document.body.className = theme === "dark" ? "dark" : "";
    document.body.setAttribute("data-theme", theme);
  }, [theme]);

  // Persist
  useEf(() => {
    const t = setTimeout(() => {
      saveState({
        tablesById, activeTableId, theme, view,
        filter: [...filter],
        priorityFilter: [...priorityFilter],
        themeFilter: [...themeFilter],
        sentimentFilter: [...sentimentFilter],
        groupBy,
        hiddenColsByTable, enabledViewsByTable,
        search, sort, panels, aiHistory,
        rowHeight, cellStyle, newRowPosition, wordWrap,
        activityMode, libCategory, libAssetId, libView,
        library,
        wikiPages, wikiPageId,
      });
    }, 200);
    return () => clearTimeout(t);
  }, [tablesById, activeTableId, theme, view, filter, priorityFilter, themeFilter, sentimentFilter, groupBy, hiddenColsByTable, enabledViewsByTable, search, sort, panels, aiHistory, rowHeight, cellStyle, newRowPosition, wordWrap, activityMode, libCategory, libAssetId, libView, library, wikiPages, wikiPageId]);

  useEf(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  // Panels
  const togglePanel = (k) => setPanels(p => ({ ...p, [k]: !p[k] }));
  const showAllPanels = () => setPanels({ activityBar: true, sidebar: true, aiPanel: true, detailBar: true });
  const hideAllPanels = () => setPanels({ activityBar: false, sidebar: false, aiPanel: false, detailBar: false });

  // Switch active table — reset cell focus, selection, search, filters, groupBy
  const switchTable = (id) => {
    setActiveTableId(id);
    setActiveWorkspaceItem(null);
    setSelectedIds([]);
    setFocusedCell(null);
    setSearch("");
    setFilter(new Set());
    setPriorityFilter(new Set());
    setThemeFilter(new Set());
    setSentimentFilter(new Set());
    setGroupBy("none");
  };

  const openWorkspaceItem = (id) => {
    setActiveWorkspaceItem(id);
    setSelectedIds([]);
    setFocusedCell(null);
  };

  // Derived visible rows
  const visibleRows = useMm(() => {
    let r = rows;
    if (filter.size > 0 && columns.find(c => c.name === "status")) r = r.filter(x => filter.has(x.status));
    if (priorityFilter.size > 0 && columns.find(c => c.name === "priority")) r = r.filter(x => priorityFilter.has(x.priority));
    if (themeFilter.size > 0 && columns.find(c => c.name === "theme")) r = r.filter(x => themeFilter.has(x.theme));
    if (sentimentFilter.size > 0 && columns.find(c => c.name === "sentiment")) r = r.filter(x => sentimentFilter.has(x.sentiment));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      r = r.filter(x => columns.some(c => String(x[c.name] ?? "").toLowerCase().includes(q)));
    }
    const PRIORITY_RANK = { Urgent: 0, High: 1, Med: 2, Low: 3 };
    const STATUS_RANK = { todo: 0, progress: 1, waiting: 2, done: 3 };
    const sortableKey = columns.find(c => c.name === sort.key) ? sort.key : columns[0]?.name || "id";
    r = [...r].sort((a, b) => {
      let av = a[sortableKey], bv = b[sortableKey];
      if (sortableKey === "priority") { av = PRIORITY_RANK[av]; bv = PRIORITY_RANK[bv]; }
      if (sortableKey === "status")   { av = STATUS_RANK[av];   bv = STATUS_RANK[bv]; }
      if (typeof av === "number" && typeof bv === "number") return sort.dir === "asc" ? av - bv : bv - av;
      av = String(av || ""); bv = String(bv || "");
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return r;
  }, [rows, columns, filter, priorityFilter, themeFilter, sentimentFilter, search, sort]);

  // ── handlers
  const pushHistory = (entry) => setAiHistory(h => [...h, entry]);

  const onUpdateRow = (id, patch) => {
    const beforeRows = (tablesById[activeTableId]?.rows) || [];
    const beforeRow = beforeRows.find(r => r.id === id);
    const changedFields = Object.keys(patch);

    setActiveRows(rs => rs.map(r => {
      if (r.id !== id) return r;
      const nextRow = { ...r, ...patch };

      // Clear _auto flags for any column the user manually edited
      Object.keys(patch).forEach(k => {
        if (nextRow["_auto_" + k]) nextRow["_auto_" + k] = false;
      });

      // Run any column-attached Rules (sync only — async dispatched separately below)
      const patched = new Set(Object.keys(patch));
      const tableColumns = (tablesById[activeTableId]?.columns) || columns;
      tableColumns.forEach(col => {
        const rule = col.rule;
        if (!rule) return;
        // Skip if user manually edited this column in the same patch (manual override)
        if (patched.has(col.name)) return;
        // Skip if source column wasn't part of the patch
        const sourceCol = rule.params?.source;
        if (!sourceCol || !patched.has(sourceCol)) return;
        if (isAsyncRule(rule)) return; // handled async after setState
        const derived = executeRule(rule, nextRow);
        if (derived !== null && derived !== undefined) {
          nextRow[col.name] = derived;
          nextRow["_auto_" + col.name] = true;
        }
      });

      return nextRow;
    }));

    // Async rules (AI_CLASSIFY) — dispatch after sync update so user sees pending state
    const patchedSet = new Set(Object.keys(patch));
    const tableColumns = (tablesById[activeTableId]?.columns) || columns;
    tableColumns.forEach(col => {
      const rule = col.rule;
      if (!rule || !isAsyncRule(rule)) return;
      if (patchedSet.has(col.name)) return;
      const sourceCol = rule.params?.source;
      if (!sourceCol || !patchedSet.has(sourceCol)) return;
      const startRow = rows.find(r => r.id === id);
      if (!startRow) return;
      const futureRow = { ...startRow, ...patch };
      // Mark cell as pending (shows loading spinner)
      setActiveRows(rs => rs.map(r => r.id === id ? { ...r, ["_pending_" + col.name]: true, ["_auto_" + col.name]: false } : r));
      executeRule(rule, futureRow).then(derived => {
        if (derived === null || derived === undefined) {
          setActiveRows(rs => rs.map(r => r.id === id ? { ...r, ["_pending_" + col.name]: false } : r));
          return;
        }
        setActiveRows(rs => rs.map(r => r.id === id ? { ...r, [col.name]: derived, ["_auto_" + col.name]: true, ["_pending_" + col.name]: false } : r));
      });
    });

    // Run Automations — after sync updates settle
    if (beforeRow && window.runAutomations && window.EXECUTABLE_AUTOMATIONS) {
      // Use setTimeout to ensure state has flushed
      setTimeout(() => {
        const latestRow = (tablesById[activeTableId]?.rows || []).find(r => r.id === id) || { ...beforeRow, ...patch };
        window.runAutomations({
          rules: window.EXECUTABLE_AUTOMATIONS,
          trigger: "row.changed",
          tableId: activeTableId,
          row: latestRow,
          changedFields,
          env: {
            tablesById,
            setTablesById,
            pushHistory,
            setToast,
          },
        });
      }, 50);
    }
  };

  const onCommitAi = (id, col, value) => {
    setActiveRows(rs => rs.map(r => {
      if (r.id !== id) return r;
      if (col === "theme")     return { ...r, theme: value ?? r.theme, themeConfirmed: true };
      if (col === "sentiment") return { ...r, sentiment: value ?? r.sentiment, sentimentConfirmed: true };
      return r;
    }));
    pushHistory({ title: `Confirmed ${col} for ${id}`, detail: `→ ${value}`, time: nowStamp() });
  };

  const onDismissAi = (id, col) => {
    setActiveRows(rs => rs.map(r => {
      if (r.id !== id) return r;
      if (col === "theme")     return { ...r, themeConfirmed: true };
      if (col === "sentiment") return { ...r, sentimentConfirmed: true };
      return r;
    }));
    pushHistory({ title: `Dismissed AI ${col}`, detail: `Row ${id}`, time: nowStamp() });
  };

  const onAcceptAll = async (col) => {
    const pending = rows.filter(r => col === "theme" ? !r.themeConfirmed : !r.sentimentConfirmed);
    if (pending.length === 0) return;
    setToast({ kind: "loading", message: `AI is reading ${pending.length} quotes…` });
    pushHistory({ title: `AI started: ${col} inference`, detail: `${pending.length} rows · sending to Claude`, time: nowStamp() });

    const prompt = col === "theme"
      ? `Classify each customer-interview quote into ONE of: Pricing pushback, Onboarding friction, Feature: AI columns, Sheet performance, Sharing & roles, Other.
Reply ONLY with a JSON array, no prose, shape: [{"id":"INT-018","theme":"Pricing pushback"}, …]

${pending.map(r => `[${r.id}] ${r.quote}`).join("\n")}`
      : `Score the sentiment of each customer-interview quote as Positive, Mixed, or Negative.
Reply ONLY with a JSON array, no prose, shape: [{"id":"INT-018","sentiment":"Negative"}, …]

${pending.map(r => `[${r.id}] ${r.quote}`).join("\n")}`;

    try {
      const text = await window.claude.complete({ messages: [{ role: "user", content: prompt }] });
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("Could not parse AI response");
      const json = JSON.parse(match[0]);
      setActiveRows(rs => rs.map(r => {
        const m = json.find(j => j.id === r.id);
        if (!m) return r;
        if (col === "theme")     return { ...r, theme: m.theme || r.theme, themeConfirmed: true };
        if (col === "sentiment") return { ...r, sentiment: m.sentiment || r.sentiment, sentimentConfirmed: true };
        return r;
      }));
      pushHistory({ title: `AI applied: ${col}`, detail: `Confirmed ${json.length} rows with Claude`, time: nowStamp() });
      setToast({ kind: "success", message: `Applied AI ${col} to ${json.length} rows · ⌘Z to undo` });
    } catch (e) {
      pushHistory({ title: `AI error: ${col}`, detail: e.message || "Could not reach Claude", time: nowStamp() });
      setToast({ kind: "error", message: `AI failed — ${e.message || "try again"}` });
    }
  };

  const onDismissAll = (col) => {
    setActiveRows(rs => rs.map(r => {
      if (col === "theme")     return { ...r, themeConfirmed: true };
      if (col === "sentiment") return { ...r, sentimentConfirmed: true };
      return r;
    }));
    pushHistory({ title: `Dismissed all ${col} suggestions`, detail: `Kept original values`, time: nowStamp() });
  };

  const onSort = (key) => {
    setSort(s => s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });
  };

  const onButtonAction = async (col, row) => {
    if (col.buttonAction === "reclassify") {
      setToast({ kind: "loading", message: `AI reclassifying row ${row.id}…` });
      pushHistory({ title: `Re-classify requested`, detail: `Row ${row.id}`, time: nowStamp() });
      try {
        const text = await window.claude.complete({ messages: [{ role: "user", content:
          `Given this customer-interview quote, suggest a Theme (one of: Pricing pushback, Onboarding friction, Feature: AI columns, Sheet performance, Sharing & roles, Other) and a Sentiment (Positive, Mixed, Negative). Reply ONLY with JSON: {"theme":"…","sentiment":"…"}\n\nQuote: ${row.quote}` }] });
        const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
        onUpdateRow(row.id, { theme: json.theme || row.theme, sentiment: json.sentiment || row.sentiment, themeConfirmed: false, sentimentConfirmed: false });
        pushHistory({ title: `AI re-classified ${row.id}`, detail: `Theme=${json.theme}, Sentiment=${json.sentiment}`, time: nowStamp() });
        setToast({ kind: "success", message: `Re-classified ${row.id} — review pending` });
      } catch (e) {
        setToast({ kind: "error", message: `AI failed — ${e.message || "try again"}` });
      }
    }
  };

  const [chatMessages, setChatMessages] = useSt([]);
  const [chatBusy, setChatBusy] = useSt(false);

  const onSendChat = async (text) => {
    const userMsg = { role: "user", content: text };
    setChatMessages(m => [...m, userMsg]);
    setChatBusy(true);
    try {
      const ctx = `You are FlowBase, an assistant inside a data-board app. The user is looking at the "${tableLabel}" table (${activeTableId}) with ${rows.length} rows and columns: ${columns.map(c => c.name).join(", ")}. Respond concisely in 1-3 sentences. Korean if user wrote Korean, English otherwise.`;
      const resp = await window.claude.complete({
        messages: [
          ...chatMessages.map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: text },
        ],
        system: ctx,
      });
      setChatMessages(m => [...m, { role: "assistant", content: resp }]);
      pushHistory({ title: "AI chat", detail: text.slice(0, 60), time: nowStamp() });
    } catch (e) {
      setChatMessages(m => [...m, { role: "assistant", content: `Error: ${e.message || "Could not reach Claude"}` }]);
    } finally {
      setChatBusy(false);
    }
  };

  const onAskAi = async (prompt) => {
    pushHistory({ title: `You asked AI`, detail: `[${activeTableId}] ${prompt}`, time: nowStamp() });
    try {
      const text = await window.claude.complete({
        messages: [{ role: "user", content:
          `You are FlowBase, an assistant inside a data-board app. The user is looking at the "${tableLabel}" table (${activeTableId}) with ${rows.length} rows. Respond in 1-2 short sentences. Korean if user wrote Korean, English otherwise. User said: ${prompt}` }],
      });
      pushHistory({ title: "AI responded", detail: text, time: nowStamp() });
    } catch (e) {
      pushHistory({ title: "AI unavailable", detail: e.message || "Try again", time: nowStamp() });
    }
  };

  const onAddRow = () => {
    const prefix = ({
      interviews: "INT-", people: "P-", companies: "C-", themes: "TH-",
    }[activeTableId] || "");
    const nextId = prefix + String(rows.length + 100).padStart(3, "0");
    let newRow;
    if (activeTableId === "interviews") {
      newRow = {
        id: nextId, name: "", company: "", date: new Date().toISOString().slice(0, 10),
        theme: "Other", sentiment: "Mixed", status: "todo", priority: "Med", quote: "",
        themeConfirmed: true, sentimentConfirmed: true,
      };
    } else {
      newRow = { id: nextId };
      columns.forEach(c => { if (c.name !== "id") newRow[c.name] = ""; });
    }
    setActiveRows(rs => newRowPosition === "top" ? [newRow, ...rs] : [...rs, newRow]);
    setFocusedCell({ row: nextId, col: columns[1]?.name || "id" });
  };

  // ─── Dashboard chart handlers ───
  const materializeIfNeeded = (table) => {
    if (table.dashboardCharts !== undefined) return table.dashboardCharts;
    const fn = (typeof defaultChartsFor !== "undefined") ? defaultChartsFor : window.defaultChartsFor;
    if (!fn) return [];
    return fn(table.columns || []).map(c => ({ ...c, _auto: false }));
  };
  const onAddChart = (spec) => {
    setTablesById(prev => {
      const t = prev[activeTableId];
      if (!t) return prev;
      const existing = materializeIfNeeded(t);
      const newChart = { ...spec, id: "chart-" + Date.now().toString(36) };
      return { ...prev, [activeTableId]: { ...t, dashboardCharts: [...existing, newChart] } };
    });
    setToast({ kind: "success", message: `Added chart "${spec.title}"` });
  };
  const onEditChart = (chartId, patch) => {
    setTablesById(prev => {
      const t = prev[activeTableId];
      if (!t) return prev;
      const existing = materializeIfNeeded(t);
      const charts = existing.map(c => c.id === chartId ? { ...c, ...patch, _auto: false } : c);
      return { ...prev, [activeTableId]: { ...t, dashboardCharts: charts } };
    });
  };
  const onDeleteChart = (chartId) => {
    setTablesById(prev => {
      const t = prev[activeTableId];
      if (!t) return prev;
      const existing = materializeIfNeeded(t);
      return { ...prev, [activeTableId]: { ...t, dashboardCharts: existing.filter(c => c.id !== chartId) } };
    });
    setToast({ kind: "info", message: "Chart deleted" });
  };
  const onMoveChart = (chartId, delta) => {
    setTablesById(prev => {
      const t = prev[activeTableId];
      if (!t) return prev;
      const existing = materializeIfNeeded(t);
      const charts = [...existing];
      const i = charts.findIndex(c => c.id === chartId);
      const j = i + delta;
      if (i < 0 || j < 0 || j >= charts.length) return prev;
      [charts[i], charts[j]] = [charts[j], charts[i]];
      return { ...prev, [activeTableId]: { ...t, dashboardCharts: charts } };
    });
  };

  const onReorderChart = (chartId, newIdx) => {
    setTablesById(prev => {
      const t = prev[activeTableId];
      if (!t) return prev;
      const existing = materializeIfNeeded(t);
      const idx = existing.findIndex(c => c.id === chartId);
      if (idx === -1 || newIdx < 0 || newIdx > existing.length - 1) return prev;
      const charts = [...existing];
      const [moved] = charts.splice(idx, 1);
      charts.splice(newIdx, 0, moved);
      return { ...prev, [activeTableId]: { ...t, dashboardCharts: charts } };
    });
  };

  const onReorderColumn = (colName, newIdx) => {
    setTablesById(prev => {
      const t = prev[activeTableId];
      if (!t) return prev;
      const cols = t.columns;
      const idx = cols.findIndex(c => c.name === colName);
      // Block reordering of ID column (always first)
      if (idx === -1 || idx === 0 || newIdx < 1) return prev;
      const target = Math.min(newIdx, cols.length - 1);
      const newCols = [...cols];
      const [moved] = newCols.splice(idx, 1);
      newCols.splice(target, 0, moved);
      return { ...prev, [activeTableId]: { ...t, columns: newCols } };
    });
  };

  // Apply a Library Dashboard template to current table — materialize its charts
  const onApplyDashboardTemplate = (dashboardId) => {
    const dash = (library?.dashboards || []).find(d => d.id === dashboardId);
    if (!dash) return;
    const t = tablesById[activeTableId];
    if (!t) return;
    const match = window.matchSignature(dash, t.columns);
    const charts = window.applyDashboardTemplate(dash, match.slots);
    setTablesById(prev => ({
      ...prev,
      [activeTableId]: { ...prev[activeTableId], dashboardCharts: charts },
    }));
    setToast({ kind: "success", message: `Applied "${dash.name}" · ${charts.length} charts` });
  };

  // Reset dashboard back to auto (clear stored charts)
  const onResetDashboard = () => {
    setTablesById(prev => {
      const t = prev[activeTableId];
      if (!t) return prev;
      const next = { ...t };
      delete next.dashboardCharts;
      return { ...prev, [activeTableId]: next };
    });
    setToast({ kind: "info", message: "Dashboard reset to auto-detect" });
  };

  // Save current dashboard layout as a Library Dashboard template
  const onSaveDashboardAsTemplate = (name, desc) => {
    const t = tablesById[activeTableId];
    if (!t?.dashboardCharts) return;

    // Build slots: each unique column referenced in any chart becomes a slot
    const slots = {};
    const slotByCol = {};
    let slotIdx = 1;
    const refCol = (colName) => {
      if (!colName) return null;
      if (slotByCol[colName]) return slotByCol[colName];
      const col = t.columns.find(c => c.name === colName);
      if (!col) return null;
      const slotName = (col.label || col.name).toLowerCase().replace(/[^a-z0-9]+/g, "_") || ("col_" + slotIdx++);
      slots[slotName] = { type: col.type, keywords: [col.name.toLowerCase(), (col.label || "").toLowerCase()].filter(Boolean) };
      slotByCol[colName] = "$" + slotName;
      return "$" + slotName;
    };

    // Rewrite charts with $slot references
    const templateCharts = t.dashboardCharts.map(c => {
      const out = { ...c };
      ["dim", "dimX", "dimY", "stackBy", "splitBy", "dateCol", "metricCol", "numCol", "denCol", "statusCol"].forEach(k => {
        if (out[k]) out[k] = refCol(out[k]) || out[k];
      });
      // Drop the runtime id — template generates new ones at apply time
      delete out.id;
      delete out._auto;
      return out;
    });

    // Build a sensible signature from used columns
    const required = [];
    Object.values(slots).slice(0, 2).forEach(s => required.push({ type: s.type, keywords: s.keywords }));
    const preferred = Object.values(slots).slice(2).map(s => ({ type: s.type, keywords: s.keywords }));

    const newDash = {
      id: "dash-" + Date.now().toString(36),
      name,
      desc: desc || `From ${t.label}`,
      icon: "📊",
      usedIn: [t.label],
      signature: { required, preferred },
      slots,
      charts: templateCharts,
    };

    setLibrary(prev => ({ ...prev, dashboards: [...(prev.dashboards || []), newDash] }));
    setToast({ kind: "success", message: `Saved "${name}" to Library · ${templateCharts.length} charts captured` });
  };

  // AI-built dashboard — Claude generates chart specs based on column structure
  const onAiBuildDashboard = async () => {
    const t = tablesById[activeTableId];
    if (!t) return;

    setToast({ kind: "loading", message: "AI is designing your dashboard..." });

    const colSummary = t.columns.map(c => `- ${c.name} (${c.label || c.name}): type=${c.type}`).join("\n");
    const sampleRow = t.rows[0] ? JSON.stringify(t.rows[0], null, 2).slice(0, 400) : "(no rows yet)";

    const prompt = `You are designing a dashboard for a data table named "${t.label}" in a workspace app.

Columns:
${colSummary}

Sample row:
${sampleRow}

Generate a JSON array of 5-8 chart specs for a useful dashboard. Reply ONLY with the JSON array, no prose, no markdown fences.

Schema per chart:
{ "type": "kpi"|"bar"|"donut"|"line"|"area"|"heatmap"|"stacked-bar", "title": "...", "width": "quarter"|"third"|"half"|"two-thirds"|"full" }

Plus type-specific:
- kpi: { metric: "count"|"sum"|"avg"|"pct"|"ratio", metricCol?: "column_name", metricValue?: "value", numCol?, denCol?, suffix?: "x" }
- bar / donut: { dim: "column_name" }
- line / area: { dateCol: "column_name", granularity: "day"|"week"|"month", splitBy?: "column_name" }
- heatmap / stacked-bar: { dimX: "...", dimY: "..." } or { dim, stackBy }

Place 4 KPIs (width: quarter) first, then larger charts. Use real column names from the table above. Korean labels OK.`;

    try {
      const text = await window.claude.complete(prompt);
      const match = text.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("AI response had no JSON array");
      const charts = JSON.parse(match[0]).map((c, i) => ({ ...c, id: "ai-" + Date.now().toString(36) + "-" + i }));
      setTablesById(prev => ({
        ...prev,
        [activeTableId]: { ...prev[activeTableId], dashboardCharts: charts },
      }));
      setToast({ kind: "success", message: `AI built ${charts.length} charts · review and edit as needed` });
    } catch (e) {
      setToast({ kind: "error", message: `AI failed — ${e.message || "try again"}` });
    }
  };

  // ─── Wiki handlers ───

  const onCaptureAsTemplate = (templateName, templateDesc) => {
    const t = tablesById[activeTableId];
    if (!t) return;
    const cols = t.columns.filter(c => c.name !== "id" && c.type !== "button");

    const fieldIds = [];
    const newFields = [];
    let reused = 0;
    cols.forEach(c => {
      if (c.library?.kind === "field") {
        fieldIds.push(c.library.id);
        reused++;
      } else {
        // Create a new Library Field for this column
        const baseId = "fld-" + (c.name || "col").toLowerCase().replace(/[^a-z0-9]+/g, "-");
        let newId = baseId;
        const existing = new Set([...library.fields.map(f => f.id), ...newFields.map(f => f.id)]);
        let i = 2;
        while (existing.has(newId)) { newId = baseId + "-" + i++; }

        const newField = {
          id: newId,
          name: c.label || c.name,
          type: c.type || "text",
          desc: `From template: ${templateName}`,
          usedIn: [`${tableLabel}.${c.label || c.name}`],
          config: {
            ...(c.config || {}),
            ...(c.library?.kind === "optionList" ? { optionListId: c.library.id } : {}),
          },
        };
        newFields.push(newField);
        fieldIds.push(newId);
      }
    });

    const newTpl = {
      id: "tpl-" + Date.now().toString(36),
      name: templateName.trim(),
      desc: templateDesc?.trim() || `Captured from ${tableLabel} on ${new Date().toISOString().slice(0, 10)}`,
      usedIn: [tableLabel],
      fields: fieldIds,
      extraFields: [],
      recommendedViews: [...enabledViews].filter(v => v !== "sheet").slice(0, 2).concat(["sheet"]),
      defaultGroupBy: groupBy !== "none" ? groupBy : null,
    };

    setLibrary(prev => ({
      ...prev,
      fields: [...prev.fields, ...newFields],
      templates: [...prev.templates, newTpl],
    }));

    setToast({ kind: "success", message: `Captured "${templateName}" · ${newFields.length} new fields, ${reused} reused` });
  };

  const onAttachFunction = (colName, rule) => {
    setTablesById(prev => {
      const t = prev[activeTableId];
      if (!t) return prev;
      const newCols = t.columns.map(c => c.name === colName ? { ...c, rule } : c);
      return { ...prev, [activeTableId]: { ...t, columns: newCols } };
    });
    setToast({ kind: "success", message: `Attached function to "${colName}" · 소스 변경 시 자동 채움` });
  };

  const onDetachFunction = (colName) => {
    setTablesById(prev => {
      const t = prev[activeTableId];
      if (!t) return prev;
      const newCols = t.columns.map(c => {
        if (c.name !== colName) return c;
        const { rule, ...rest } = c;
        return rest;
      });
      return { ...prev, [activeTableId]: { ...t, columns: newCols } };
    });
    setToast({ kind: "info", message: `Removed function from "${colName}"` });
  };

  const onPromoteColumnToLibrary = (colName) => {
    const t = tablesById[activeTableId];
    if (!t) return;
    const col = t.columns.find(c => c.name === colName);
    if (!col || col.library) return;

    // Gather distinct values from this column (skip empty)
    const valueSet = new Map(); // value → count
    t.rows.forEach(r => {
      const v = r[col.name];
      if (v === undefined || v === null || v === "") return;
      valueSet.set(v, (valueSet.get(v) || 0) + 1);
    });

    // Build option list: use existing col.options if defined; else distinct values from rows (cap 20)
    let optionLabels;
    if (col.options && col.options.length > 0) {
      optionLabels = col.options.map(o => typeof o === "string" ? o : (o.label || o.id));
    } else if (valueSet.size > 0 && valueSet.size <= 20) {
      optionLabels = [...valueSet.entries()].sort((a, b) => b[1] - a[1]).map(([v]) => v);
    } else if (valueSet.size > 20) {
      setToast({ kind: "error", message: `Too many distinct values (${valueSet.size}). Promote not supported for free-text yet.` });
      return;
    } else {
      // empty column: still create an empty Option List with the label
      optionLabels = [];
    }

    const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
    const newOl = {
      id: "ol-" + Date.now().toString(36),
      name: col.label || col.name,
      desc: `Promoted from ${tableLabel}.${col.label || col.name}`,
      usedIn: [`${tableLabel}.${col.label || col.name}`],
      options: optionLabels.map((label, i) => ({
        id: String(label).replace(/\s+/g, "_"),
        label: String(label),
        color: palette[i % palette.length],
      })),
    };

    // Add to library state
    setLibrary(prev => ({ ...prev, optionLists: [...prev.optionLists, newOl] }));

    // Update column: link to new Option List + ensure select type
    setTablesById(prev => {
      const tt = prev[activeTableId];
      if (!tt) return prev;
      const newCols = tt.columns.map(c => c.name === colName ? {
        ...c,
        type: "select",
        library: { kind: "optionList", id: newOl.id, assetName: newOl.name },
      } : c);
      return { ...prev, [activeTableId]: { ...tt, columns: newCols } };
    });

    setToast({ kind: "success", message: `Promoted "${col.label}" to Library · ${newOl.options.length} options created` });
  };

  const onUnlinkColumn = (colName) => {
    setTablesById(prev => {
      const t = prev[activeTableId];
      if (!t) return prev;
      const newCols = t.columns.map(c => {
        if (c.name !== colName) return c;
        const { library, ...rest } = c;
        return rest;
      });
      return { ...prev, [activeTableId]: { ...t, columns: newCols } };
    });
    setToast({ kind: "info", message: `Unlinked column from Library · column is now local` });
  };

  const onDeleteColumn = (colName) => {
    if (colName === "id") return;
    setTablesById(prev => {
      const t = prev[activeTableId];
      if (!t) return prev;
      const newCols = t.columns.filter(c => c.name !== colName);
      return { ...prev, [activeTableId]: { ...t, columns: newCols } };
    });
    setToast({ kind: "info", message: `Deleted column "${colName}"` });
  };

  const onAddColumn = (spec) => {
    // spec = { kind, name, label, type, width, library?, config?, ... }
    setTablesById(prev => {
      const t = prev[activeTableId];
      if (!t) return prev;
      const exists = t.columns.some(c => c.name === spec.name);
      if (exists) return prev;
      const newCol = {
        name:  spec.name,
        label: spec.label || spec.name,
        type:  spec.type || "text",
        width: spec.width || 140,
        ...(spec.library ? { library: spec.library } : {}),
        ...(spec.config  ? { config:  spec.config }  : {}),
      };
      return { ...prev, [activeTableId]: { ...t, columns: [...t.columns, newCol] } };
    });
    setToast({ kind: "success", message: `Added column "${spec.label || spec.name}"${spec.library ? " · linked to Library" : ""}` });
  };

  const onBulkEdit = (col, value) => {
    if (!col || selectedIds.length === 0) return;
    const ids = new Set(selectedIds);
    setActiveRows(rs => rs.map(r => ids.has(r.id) ? { ...r, [col]: value } : r));
    pushHistory({ title: `Bulk edit ${col}`, detail: `Set ${col} = ${value} for ${selectedIds.length} rows`, time: nowStamp() });
    setToast({ kind: "success", message: `Set ${col} = ${value} for ${selectedIds.length} rows · ⌘Z to undo` });
  };

  const onDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    const ids = new Set(selectedIds);
    setActiveRows(rs => rs.filter(r => !ids.has(r.id)));
    pushHistory({ title: `Deleted ${selectedIds.length} rows from ${activeTableId}`, detail: [...ids].join(", "), time: nowStamp() });
    setToast({ kind: "success", message: `Deleted ${selectedIds.length} rows · ⌘Z to undo` });
    setSelectedIds([]);
  };

  // Undo / Redo (whole-tablesById snapshots)
  const undo = useCb(() => {
    if (undoStack.current.length === 0) return;
    const snap = undoStack.current.pop();
    skipNextUndoPush.current = true;
    redoStack.current.push({ tablesById: tablesByIdRef.current, library: libraryRef.current, wikiPages: wikiPagesRef.current });
    if (snap.tablesById) setTablesByIdState(snap.tablesById);
    if (snap.library)    setLibraryState(snap.library);
    if (snap.wikiPages)  setWikiPagesState(snap.wikiPages);
    setToast({ kind: "info", message: "Undone" });
  }, []);
  const redo = useCb(() => {
    if (redoStack.current.length === 0) return;
    const snap = redoStack.current.pop();
    skipNextUndoPush.current = true;
    undoStack.current.push({ tablesById: tablesByIdRef.current, library: libraryRef.current, wikiPages: wikiPagesRef.current });
    if (snap.tablesById) setTablesByIdState(snap.tablesById);
    if (snap.library)    setLibraryState(snap.library);
    if (snap.wikiPages)  setWikiPagesState(snap.wikiPages);
    setToast({ kind: "info", message: "Redone" });
  }, []);

  // Keyboard
  const selectedIdsRef = useRf(selectedIds);
  useEf(() => { selectedIdsRef.current = selectedIds; }, [selectedIds]);

  useEf(() => {
    function onKey(e) {
      const inField = e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA");
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "A" || e.key === "a")) { e.preventDefault(); togglePanel("activityBar"); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "F" || e.key === "f")) { e.preventDefault(); togglePanel("sidebar"); return; }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === "b" || e.key === "B")) { e.preventDefault(); togglePanel("aiPanel"); return; }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === "i" || e.key === "I")) { e.preventDefault(); togglePanel("detailBar"); return; }
      if ((e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K")) {
        e.preventDefault(); setSearchOpen(true); return;
      }
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && (e.key === "z" || e.key === "Z")) { e.preventDefault(); undo(); return; }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === "Z" || e.key === "z")) { e.preventDefault(); redo(); return; }
      if (!inField && (e.metaKey || e.ctrlKey) && (e.key === "a" || e.key === "A")) {
        e.preventDefault();
        // Select all visible rows
        const visIds = [];
        try {
          document.querySelectorAll("[data-row-id]").forEach(el => visIds.push(el.dataset.rowId));
        } catch {}
        // Fall back: select all rows in active table
        if (visIds.length === 0 && tablesById[activeTableId]) {
          tablesById[activeTableId].rows.forEach(r => visIds.push(r.id));
        }
        setSelectedIds(visIds);
        return;
      }
      if (!inField && e.key === "Escape" && selectedIdsRef.current.length > 0) {
        e.preventDefault(); setSelectedIds([]); return;
      }
      if (!inField && (e.key === "Delete" || e.key === "Backspace") && selectedIdsRef.current.length > 0) {
        e.preventDefault(); onDeleteSelected();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Import commit — always goes into active table
  const onImportCommit = (newRows, info) => {
    setActiveRows(rs => [...newRows, ...rs]);
    pushHistory({
      title: `Imported ${info.count} rows into ${activeTableId}`,
      detail: info.ranAi ? "Marked Theme/Sentiment for AI review" : "Direct import",
      time: nowStamp(),
    });
    setToast({ kind: "success", message: `Imported ${info.count} rows` });
  };

  // Row counts for sidebar — include user-created tables
  const tableCounts = useMm(() => {
    const m = {};
    Object.keys(tablesById).forEach(id => { m[id] = tablesById[id].rows.length; });
    return m;
  }, [tablesById]);

  // Combined table list — TABLES (curated seed) + any tables created at runtime
  const allTables = useMm(() => {
    const seedIds = new Set(TABLES.map(t => t.id));
    const extras = Object.values(tablesById)
      .filter(t => !seedIds.has(t.id))
      .map(t => ({
        id: t.id,
        label: t.label,
        colorVar: t.colorVar || "var(--chart-3)",
        count: t.rows.length,
        kanban: t.kanban, dashboard: t.dashboard, hasAi: t.hasAi, grid: t.grid, timeline: t.timeline,
        isCustom: true,
      }));
    return [...TABLES, ...extras];
  }, [tablesById]);

  const tableLabel = TABLES.find(t => t.id === activeTableId)?.label
    || tablesById[activeTableId]?.label
    || "Table";
  const tableColor = TABLES.find(t => t.id === activeTableId)?.colorVar
    || tablesById[activeTableId]?.colorVar
    || "var(--chart-1)";
  const hasStatusColumn = !!columns.find(c => c.name === "status");

  // ── View support inferred from current table's columns (auto, not hardcoded)
  const viewSupport = useMm(() => inferViewSupport(columns), [columns]);

  // ── Enabled views for this table (user-configurable, persisted)
  //    Default = views whose data requirements are met
  const enabledViews = useMm(() => {
    const stored = enabledViewsByTable[activeTableId];
    if (stored) return new Set(stored);
    const defaults = new Set(["sheet"]);
    Object.entries(viewSupport).forEach(([id, info]) => {
      if (info.supported) defaults.add(id);
    });
    return defaults;
  }, [enabledViewsByTable, activeTableId, viewSupport]);

  const onToggleEnabledView = (id) => {
    if (id === "sheet") return;
    setEnabledViewsByTable(prev => {
      const current = new Set(prev[activeTableId] || [...enabledViews]);
      if (current.has(id)) {
        current.delete(id);
        if (view === id) setView("sheet");
      } else {
        current.add(id);
      }
      return { ...prev, [activeTableId]: [...current] };
    });
  };

  // ── Hidden columns for this table (user-configurable, persisted)
  const hiddenCols = useMm(() => new Set(hiddenColsByTable[activeTableId] || []), [hiddenColsByTable, activeTableId]);
  const onToggleCol = (name) => {
    setHiddenColsByTable(prev => {
      const current = new Set(prev[activeTableId] || []);
      if (current.has(name)) current.delete(name); else current.add(name);
      return { ...prev, [activeTableId]: [...current] };
    });
  };
  const onResetCols = () => {
    setHiddenColsByTable(prev => ({ ...prev, [activeTableId]: [] }));
  };
  const visibleColumns = useMm(() => columns.filter(c => !hiddenCols.has(c.name)), [columns, hiddenCols]);

  // If the active view becomes disabled or unsupported (e.g. via toggle or column removal), fall back
  useEf(() => {
    if (view === "sheet") return;
    const stillEnabled  = enabledViews.has(view);
    const stillSupported = viewSupport[view]?.supported !== false;
    if (!stillEnabled || !stillSupported) setView("sheet");
  }, [enabledViews, viewSupport, view]);

  // Sort setter that DisplayMenu uses (key + mode)
  const onSortFromMenu = useCb((key, mode) => {
    if (mode === "toggleDir") {
      setSort(s => ({ key, dir: s.dir === "asc" ? "desc" : "asc" }));
    } else {
      setSort(s => ({ key, dir: s.dir || "asc" }));
    }
  }, []);

  // Toggle right detail bar
  const toggleDetailBar = () => setPanels(p => ({ ...p, detailBar: !p.detailBar }));

  // Create a new table via Schema, optionally from a Library Template
  const onCreateTableFromTemplate = (templateId, newTableName) => {
    const tpl = library.templates.find(t => t.id === templateId);
    if (!tpl) return;

    // ── Multi-table domain template: create all tables in one go ──
    if (tpl.multiTable && Array.isArray(tpl.tables) && tpl.tables.length > 0) {
      const baseTs = Date.now().toString(36);
      const created = [];
      const newEntries = {};
      tpl.tables.forEach((t, i) => {
        const tableId = "tbl-" + baseTs + "-" + i;
        const cols = [
          { name: "id", label: "ID", type: "text", width: 86, mono: true },
          ...(t.columns || []).filter(c => c.name !== "id"),
        ];
        newEntries[tableId] = {
          id: tableId,
          label: t.label || ("Table " + (i + 1)),
          colorVar: t.colorVar || "var(--chart-3)",
          count: 0,
          kanban: cols.some(c => c.type === "status" || c.type === "select"),
          dashboard: true,
          hasAi: false,
          grid: true,
          timeline: cols.some(c => c.type === "date"),
          columns: cols,
          rows: [],
        };
        created.push(tableId);
      });
      setTablesById(prev => ({ ...prev, ...newEntries }));
      setActivityMode("tables");
      setActiveTableId(created[0]);
      setActiveWorkspaceItem(null);
      setToast({ kind: "success", message: `Created ${created.length} tables from "${tpl.name}" domain` });
      return;
    }

    // ── Single-table template (existing behavior) ──
    const resolvedFields = (tpl.fields || []).map(fid => library.fields.find(f => f.id === fid)).filter(Boolean);
    const extraFields = tpl.extraFields || [];

    const cols = [
      { name: "id", label: "ID", type: "text", width: 86, mono: true },
      ...resolvedFields.map(f => ({
        name: f.name,
        label: f.name,
        type: f.type || "text",
        width: f.type === "date" ? 110 : f.type === "select" ? 140 : 160,
        library: { kind: "field", id: f.id, assetName: f.name },
        config: f.config,
      })),
      ...extraFields.map(f => ({
        name: f.name,
        label: f.name,
        type: f.type || "text",
        width: 140,
        ...(f.config?.optionListId ? { library: { kind: "optionList", id: f.config.optionListId, assetName: f.name }, config: f.config } : {}),
      })),
    ];

    const tableId = "tbl-" + Date.now().toString(36);
    const newTable = {
      id: tableId,
      label: newTableName,
      colorVar: "var(--chart-3)",
      count: 0,
      kanban: cols.some(c => c.type === "status" || c.type === "select"),
      dashboard: true,
      hasAi: false,
      grid: true,
      timeline: cols.some(c => c.type === "date"),
      columns: cols,
      rows: [],
    };

    setTablesById(prev => ({ ...prev, [tableId]: newTable }));
    setActivityMode("tables");
    setActiveTableId(tableId);
    setActiveWorkspaceItem(null);
    setToast({ kind: "success", message: `Created "${newTableName}" from template "${tpl.name}" · ${cols.length - 1} columns` });
  };

  const onCreateBlankTable = (newTableName) => {
    const tableId = "tbl-" + Date.now().toString(36);
    const newTable = {
      id: tableId,
      label: newTableName,
      colorVar: "var(--chart-3)",
      count: 0,
      kanban: false, dashboard: true, hasAi: false, grid: true, timeline: false,
      columns: [{ name: "id", label: "ID", type: "text", width: 86, mono: true }],
      rows: [],
    };
    setTablesById(prev => ({ ...prev, [tableId]: newTable }));
    setActivityMode("tables");
    setActiveTableId(tableId);
    setActiveWorkspaceItem(null);
    setToast({ kind: "success", message: `Created "${newTableName}" (blank table)` });
  };

  // ─── Use Library asset in active (or first available) table ───
  // Create a new blank asset in any Library category and jump to its detail page
  const onCreateAsset = (categoryId) => {
    const ts = Date.now().toString(36);
    let newAsset = null;
    if (categoryId === "optionLists") {
      newAsset = {
        id: "ol-" + ts,
        name: "New Option List",
        desc: "",
        usedIn: [],
        options: [],
      };
    } else if (categoryId === "fields") {
      newAsset = {
        id: "fld-" + ts,
        name: "New Field",
        type: "text",
        desc: "",
        usedIn: [],
        config: {},
      };
    } else if (categoryId === "templates") {
      newAsset = {
        id: "tpl-" + ts,
        name: "New Template",
        desc: "",
        icon: "📦",
        usedIn: [],
        fields: [],
        extraFields: [],
        recommendedViews: ["sheet"],
      };
    } else if (categoryId === "functions") {
      newAsset = {
        id: "fn-" + ts,
        name: "NEW_FUNCTION",
        label: "New function",
        icon: "ƒ",
        desc: "",
        usedIn: [],
        params: [],
        example: "",
      };
    } else if (categoryId === "dashboards") {
      newAsset = {
        id: "dash-" + ts,
        name: "New Dashboard",
        desc: "",
        icon: "📊",
        usedIn: [],
        signature: { required: [], preferred: [] },
        slots: {},
        charts: [],
      };
    }
    if (!newAsset) return;
    setLibrary(prev => ({
      ...prev,
      [categoryId]: [...(prev[categoryId] || []), newAsset],
    }));
    // Open detail page for the new asset
    setActivityMode("library");
    setLibCategory(categoryId);
    setLibAssetId(newAsset.id);
    setToast({ kind: "success", message: `Created new ${categoryId.slice(0, -1)} — edit it now` });
  };

  // ─── Use Library asset in the active table ───
  const onUseInTable = (categoryId, asset) => {
    // For Templates: open the New Table modal flow
    if (categoryId === "templates") {
      const tableName = asset.name + " " + Math.floor(Math.random() * 1000);
      onCreateTableFromTemplate(asset.id, tableName);
      setToast({ kind: "success", message: `Created table from template "${asset.name}"` });
      return;
    }

    // For Option Lists, Fields, Functions: add a column to the active table
    // Fall back to first table if user is currently in Library mode
    const targetTableId = activeTableId && tablesById[activeTableId]
      ? activeTableId
      : Object.keys(tablesById)[0];
    if (!targetTableId) return;

    const t = tablesById[targetTableId];
    const existingNames = new Set(t.columns.map(c => c.name));

    let newCol = null;
    if (categoryId === "optionLists") {
      const baseName = asset.name;
      let name = baseName, i = 2;
      while (existingNames.has(name)) name = baseName + "_" + i++;
      newCol = {
        name, label: asset.name, type: "select", width: 140,
        library: { kind: "optionList", id: asset.id, assetName: asset.name },
      };
    } else if (categoryId === "fields") {
      const baseName = asset.name;
      let name = baseName, i = 2;
      while (existingNames.has(name)) name = baseName + "_" + i++;
      newCol = {
        name, label: asset.name, type: asset.type || "text", width: 150,
        library: { kind: "field", id: asset.id, assetName: asset.name },
        config: asset.config,
      };
    } else if (categoryId === "functions") {
      setToast({ kind: "info", message: "Function은 컬럼 추가 시 Smart fill 단계에서 적용하세요." });
      setActivityMode("tables");
      return;
    }

    if (newCol) {
      setTablesById(prev => ({
        ...prev,
        [targetTableId]: { ...prev[targetTableId], columns: [...prev[targetTableId].columns, newCol] },
      }));
      // Switch to that table so user sees the result
      setActiveTableId(targetTableId);
      setActivityMode("tables");
      setActiveWorkspaceItem(null);
      setToast({ kind: "success", message: `Added "${asset.name}" to ${t.label}` });
    }
  };

  // Listen for activity-bar search click
  useEf(() => {
    const h = () => setSearchOpen(true);
    window.addEventListener("flowbase-open-search", h);
    return () => window.removeEventListener("flowbase-open-search", h);
  }, []);

  const onJumpToLibraryAsset = (libRef) => {
    if (!libRef) return;
    const categoryMap = {
      optionList: "optionLists",
      field:      "fields",
      template:   "templates",
      function:   "functions",
    };
    const category = categoryMap[libRef.kind];
    if (!category) return;
    setActivityMode("library");
    setLibCategory(category);
    setLibAssetId(libRef.id);
  };

  const onUpdateWikiPage = (id, patch) => {
    setWikiPages(prev => prev.map(p => p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString().slice(0, 10) } : p));
    setToast({ kind: "success", message: "Wiki page updated" });
  };
  const onNewWikiPage = () => {
    const id = "wiki-" + Date.now().toString(36);
    const today = new Date().toISOString().slice(0, 10);
    const newPage = {
      id, title: "Untitled", category: "Reference",
      owner: "peter", verified: false, verifiedAt: null, expiresAt: null,
      updatedAt: today, body: "# Untitled\n\nStart writing...",
    };
    setWikiPages(prev => [newPage, ...prev]);
    setWikiPageId(id);
  };

  // ─── Library editing actions + cascade to tables ───
  // Given an option list id + a list of {oldLabel, newLabel?, deleted?}, propagate to all tables.
  const cascadeOptionChanges = (olId, changes) => {
    let affected = 0;
    setTablesById(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(tid => {
        const t = next[tid];
        const cols = t.columns.filter(c => c.library?.kind === "optionList" && c.library.id === olId);
        if (cols.length === 0) return;
        let touched = false;
        const newRows = t.rows.map(r => {
          let row = r;
          cols.forEach(c => {
            const val = row[c.name];
            const change = changes.find(ch => ch.oldLabel === val);
            if (change) {
              if (change.deleted) {
                row = { ...row };
                row["_localOverride_" + c.name] = true;
              } else if (change.newLabel && change.newLabel !== change.oldLabel) {
                row = { ...row, [c.name]: change.newLabel };
                affected++;
                touched = true;
              }
            }
          });
          return row;
        });
        if (touched) next[tid] = { ...t, rows: newRows };
      });
      return next;
    });
    return affected;
  };

  const onLibraryOptionRename = (olId, optionId, newLabel) => {
    const ol = library.optionLists.find(o => o.id === olId);
    const opt = ol?.options.find(o => o.id === optionId);
    setLibrary(prev => ({ ...prev, optionLists: prev.optionLists.map(ol2 => {
      if (ol2.id !== olId) return ol2;
      return { ...ol2, options: ol2.options.map(o => o.id === optionId ? { ...o, label: newLabel } : o) };
    }) }));
    if (opt && opt.label !== newLabel) {
      const affected = cascadeOptionChanges(olId, [{ oldLabel: opt.label, newLabel }]);
      setToast({ kind: "success", message: `Renamed · ${affected} rows updated across tables` });
    }
  };

  const onLibraryOptionDelete = (olId, optionId) => {
    const ol = library.optionLists.find(o => o.id === olId);
    const opt = ol?.options.find(o => o.id === optionId);
    setLibrary(prev => ({ ...prev, optionLists: prev.optionLists.map(ol2 => ol2.id !== olId ? ol2 : { ...ol2, options: ol2.options.filter(o => o.id !== optionId) }) }));
    if (opt) {
      cascadeOptionChanges(olId, [{ oldLabel: opt.label, deleted: true }]);
      setToast({ kind: "info", message: `Deleted "${opt.label}" · existing rows now use local values` });
    }
  };

  const onLibraryOptionColorChange = (olId, optionId, newColor) => {
    setLibrary(prev => ({ ...prev, optionLists: prev.optionLists.map(ol => ol.id !== olId ? ol : { ...ol, options: ol.options.map(o => o.id === optionId ? { ...o, color: newColor } : o) }) }));
  };

  const onLibraryOptionAdd = (olId, label) => {
    if (!label.trim()) return;
    const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
    setLibrary(prev => ({ ...prev, optionLists: prev.optionLists.map(ol => {
      if (ol.id !== olId) return ol;
      const newOpt = {
        id: label.trim().replace(/\s+/g, "_"),
        label: label.trim(),
        color: palette[ol.options.length % palette.length],
      };
      return { ...ol, options: [...ol.options, newOpt] };
    }) }));
    setToast({ kind: "success", message: `Added "${label.trim()}" to Library` });
  };

  // Generic asset rename / desc edit (works for any category)
  const onAssetRename = (categoryId, assetId, newName) => {
    setLibrary(prev => ({ ...prev, [categoryId]: prev[categoryId].map(a => a.id === assetId ? { ...a, name: newName } : a) }));
  };
  const onAssetDescChange = (categoryId, assetId, newDesc) => {
    setLibrary(prev => ({ ...prev, [categoryId]: prev[categoryId].map(a => a.id === assetId ? { ...a, desc: newDesc } : a) }));
  };

  // Field-specific: toggle required, edit default/format
  const onFieldConfigChange = (fieldId, configPatch) => {
    setLibrary(prev => ({ ...prev, fields: prev.fields.map(f => f.id === fieldId ? { ...f, config: { ...(f.config || {}), ...configPatch } } : f) }));
  };

  // Template-specific: remove/add field
  const onTemplateRemoveField = (templateId, fieldId) => {
    setLibrary(prev => ({ ...prev, templates: prev.templates.map(t => t.id === templateId ? { ...t, fields: (t.fields || []).filter(f => f !== fieldId) } : t) }));
  };
  const onTemplateAddField = (templateId, fieldId) => {
    setLibrary(prev => ({ ...prev, templates: prev.templates.map(t => {
      if (t.id !== templateId) return t;
      const fields = t.fields || [];
      if (fields.includes(fieldId)) return t;
      return { ...t, fields: [...fields, fieldId] };
    }) }));
  };

  // Rule-specific: edit label
  const onRuleLabelChange = (ruleId, newLabel) => {
    setLibrary(prev => ({ ...prev, rules: prev.rules.map(r => r.id === ruleId ? { ...r, label: newLabel } : r) }));
  };

  return (
    <div data-theme={theme} style={{
      width: "100vw", height: "100vh",
      background: "var(--background)", color: "var(--foreground)",
      display: "flex", overflow: "hidden", fontFamily: "var(--font-sans)",
    }}>
      {panels.activityBar && (
        <InteractiveActivityBar mode={activityMode} onChange={setActivityMode} />
      )}
      {activityMode === "library" ? (
        <>
          {panels.sidebar && (
            <LibrarySidebar
              selectedCategory={libCategory}
              selectedAssetId={libAssetId}
              onSelectCategory={(c) => { setLibCategory(c); setLibAssetId(null); }}
              onSelectAsset={(c, a) => { setLibCategory(c); setLibAssetId(a); }}
            />
          )}
          <LibraryView
            selectedCategory={libCategory}
            selectedAssetId={libAssetId}
            onSelectCategory={(c) => { setLibCategory(c); setLibAssetId(null); }}
            onSelectAsset={(c, a) => { setLibCategory(c); setLibAssetId(a); }}
            theme={theme} setTheme={setTheme}
            panels={panels}
            onTogglePanel={togglePanel}
            onShowAllPanels={showAllPanels}
            onHideAllPanels={hideAllPanels}
            navSlot={navSlotEl}
            libView={libView} onChangeLibView={setLibView}
            onToggleDetailBar={toggleDetailBar}
            library={library}
            onOptionRename={onLibraryOptionRename}
            onOptionDelete={onLibraryOptionDelete}
            onOptionColorChange={onLibraryOptionColorChange}
            onOptionAdd={onLibraryOptionAdd}
            onAssetRename={onAssetRename}
            onAssetDescChange={onAssetDescChange}
            onFieldConfigChange={onFieldConfigChange}
            onTemplateRemoveField={onTemplateRemoveField}
            onTemplateAddField={onTemplateAddField}
            onRuleLabelChange={onRuleLabelChange}
            onUseInTable={onUseInTable}
            onCreateAsset={onCreateAsset}
          />
          {panels.detailBar && <LibraryInsights onClose={toggleDetailBar} />}
          {panels.aiPanel && <LibraryAIPanel />}
        </>
      ) : activityMode === "workspace" ? (
        <>
          {panels.sidebar && (
            <WorkspaceSidebar
              active={activeWorkspaceItem || "schema"}
              onSelect={setActiveWorkspaceItem}
            />
          )}
          <WorkspaceView
            active={activeWorkspaceItem || "schema"}
            onSelect={setActiveWorkspaceItem}
            theme={theme} setTheme={setTheme}
            panels={panels}
            onTogglePanel={togglePanel}
            onShowAllPanels={showAllPanels}
            onHideAllPanels={hideAllPanels}
            navSlot={navSlotEl}
          >
            {(activeWorkspaceItem || "schema") === "schema"
              ? <RichSchemaView
                  library={library}
                  tablesById={tablesById}
                  onCreateTableFromTemplate={onCreateTableFromTemplate}
                  onCreateBlankTable={onCreateBlankTable}
                />
              : <AutomationsView />}
          </WorkspaceView>
        </>
      ) : activityMode === "wiki" ? (
        <>
          {panels.sidebar && (
            <WikiSidebar
              pages={wikiPages}
              selectedId={wikiPageId}
              onSelectPage={setWikiPageId}
              onNewPage={onNewWikiPage}
            />
          )}
          <WikiView
            pages={wikiPages}
            selectedId={wikiPageId}
            onSelectPage={setWikiPageId}
            onUpdatePage={onUpdateWikiPage}
            theme={theme} setTheme={setTheme}
            panels={panels}
            onTogglePanel={togglePanel}
            onShowAllPanels={showAllPanels}
            onHideAllPanels={hideAllPanels}
            navSlot={navSlotEl}
          />
        </>
      ) : activityMode === "inbox" ? (
        <>
          {panels.sidebar && (
            <InboxSidebar
              filter={inboxFilter}
              onFilter={setInboxFilter}
              counts={(() => {
                const items = buildInboxItems({ tablesById, library, wikiPages, aiHistory });
                const c = { all: items.length, ai: 0, alert: 0, warn: 0, info: 0, tip: 0, log: 0 };
                items.forEach(i => { if (c[i.kind] !== undefined) c[i.kind]++; });
                return c;
              })()}
            />
          )}
          <InboxView
            items={buildInboxItems({ tablesById, library, wikiPages, aiHistory })}
            filter={inboxFilter}
            onFilter={setInboxFilter}
            onNavigate={(target) => {
              if (target.mode === "tables") { setActivityMode("tables"); if (target.tableId) switchTable(target.tableId); }
              else if (target.mode === "library") { setActivityMode("library"); setLibCategory(target.category); setLibAssetId(target.assetId); }
              else if (target.mode === "wiki") { setActivityMode("wiki"); setWikiPageId(target.pageId); }
            }}
            theme={theme} setTheme={setTheme}
            panels={panels}
            onTogglePanel={togglePanel}
            onShowAllPanels={showAllPanels}
            onHideAllPanels={hideAllPanels}
            navSlot={navSlotEl}
          />
        </>
      ) : activityMode === "search" ? (
        <SearchPage
          tablesById={tablesById}
          library={library}
          wikiPages={wikiPages}
          theme={theme} setTheme={setTheme}
          panels={panels}
          onTogglePanel={togglePanel}
          onShowAllPanels={showAllPanels}
          onHideAllPanels={hideAllPanels}
          navSlot={navSlotEl}
          onNavigateTable={(id) => { setActivityMode("tables"); switchTable(id); }}
          onNavigateRow={(tid, rid) => {
            setActivityMode("tables");
            if (tid !== activeTableId) switchTable(tid);
            const col = (tablesById[tid]?.columns || [])[1]?.name || "id";
            setFocusedCell({ row: rid, col });
          }}
          onNavigateLibraryAsset={(category, assetId) => {
            setActivityMode("library");
            setLibCategory(category);
            setLibAssetId(assetId);
          }}
          onNavigateWikiPage={(pageId) => {
            setActivityMode("wiki");
            setWikiPageId(pageId);
          }}
        />
      ) : (
        <>
      {panels.sidebar && (
        <InteractiveSidebar
          activeTableId={activeTableId}
          activeWorkspaceItem={activeWorkspaceItem}
          onSelectTable={switchTable}
          onSelectWorkspaceItem={openWorkspaceItem}
          tables={allTables}
          tableCounts={tableCounts}
          workspaceLabel={WORKSPACE.label}
          onImport={() => setImportOpen(true)}
          onNewTable={() => setNewTableOpen(true)}
        />
      )}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, position: "relative" }}>
        <InteractiveHeader
          theme={theme} setTheme={setTheme}
          search={search} onSearch={setSearch}
          workspaceLabel={WORKSPACE.label}
          tableLabel={activeWorkspaceItem ? (activeWorkspaceItem === "schema" ? "Schema" : "Automations") : tableLabel}
          leadingSlot={
            <PanelsMenu panels={panels} onToggle={togglePanel} onShowAll={showAllPanels} onHideAll={hideAllPanels} />
          }
          navSlot={
            <NavCluster
              canBack={nav.canBack}
              canForward={nav.canForward}
              onBack={() => { const e = nav.goBack(); applyHistoryEntry(e); }}
              onForward={() => { const e = nav.goForward(); applyHistoryEntry(e); }}
              history={nav.stack}
              onJump={(e) => applyHistoryEntry(e)}
            />
          }
        />

        {activeWorkspaceItem === "schema" ? (
          <RichSchemaView />
        ) : activeWorkspaceItem === "automations" ? (
          <AutomationsView />
        ) : (
          <>
            <div style={{ padding: "16px 20px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{
              width: 28, height: 28, borderRadius: 7,
              background: `color-mix(in oklch, ${tableColor} 18%, var(--background))`,
              color: tableColor,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
            }}>
              <IconDb size={16} />
            </span>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.02em" }}>{tableLabel}</h1>
            <span style={{
              fontSize: 11, padding: "1px 6px", borderRadius: 3,
              background: "var(--muted)", color: "var(--muted-foreground)",
              fontFamily: "var(--font-mono)", marginTop: 4,
            }}>{activeTableId}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 12, color: "var(--muted-foreground)" }} className="fb-tnum">
              {visibleRows.length === rows.length ? `${rows.length} rows` : `${visibleRows.length} / ${rows.length}`}
            </span>
            {groupBy && groupBy !== "none" && (
              <ActiveFilterChip label={`Grouped by ${groupBy}`} onClear={() => setGroupBy("none")} />
            )}
            {[...filter].map(s => (
              <ActiveFilterChip key={"st-" + s} label={"Status: " + (STATUS[s]?.label || s)}
                onClear={() => { const n = new Set(filter); n.delete(s); setFilter(n); }} />
            ))}
            {[...priorityFilter].map(s => (
              <ActiveFilterChip key={"pr-" + s} label={"Priority: " + s}
                onClear={() => { const n = new Set(priorityFilter); n.delete(s); setPriorityFilter(n); }} />
            ))}
            {[...themeFilter].map(s => (
              <ActiveFilterChip key={"th-" + s} label={"Theme: " + s}
                onClear={() => { const n = new Set(themeFilter); n.delete(s); setThemeFilter(n); }} />
            ))}
            {[...sentimentFilter].map(s => (
              <ActiveFilterChip key={"se-" + s} label={"Sentiment: " + s}
                onClear={() => { const n = new Set(sentimentFilter); n.delete(s); setSentimentFilter(n); }} />
            ))}
            <div style={{ flex: 1 }} />
            {/* Select all / Clear selection — universal across views */}
            {selectedIds.length > 0 ? (
              <>
                <button onClick={() => setSelectedIds([])} title="Clear selection (Esc)" style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", borderRadius: 5,
                  background: "color-mix(in oklch, var(--primary) 10%, transparent)",
                  border: "1px solid color-mix(in oklch, var(--primary) 30%, transparent)",
                  color: "var(--primary)", fontSize: 12, fontWeight: 600, cursor: "pointer",
                }}>
                  <IconX size={11} />{selectedIds.length} selected
                </button>
                <BulkEditMenu
                  columns={columns}
                  selectedCount={selectedIds.length}
                  onApply={onBulkEdit}
                />
                <button onClick={onDeleteSelected} style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", borderRadius: 5,
                  background: "transparent", border: "1px solid var(--destructive)",
                  color: "var(--destructive)", fontSize: 12, fontWeight: 500, cursor: "pointer",
                }}>
                  <IconTrash size={12} />Delete
                </button>
              </>
            ) : selectedIds.length === 0 && visibleRows.length > 0 ? (
              <button onClick={() => setSelectedIds(visibleRows.map(r => r.id))} title="Select all (⌘A)" style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 10px", borderRadius: 5,
                background: "transparent", border: "1px solid var(--border-subtle)",
                color: "var(--muted-foreground)", fontSize: 12, fontWeight: 500, cursor: "pointer",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                <IconCheck size={11} />Select all
              </button>
            ) : null}
            <button onClick={() => setImportOpen(true)} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 5,
              background: "var(--card)", border: "1px solid var(--border)",
              color: "var(--foreground)", fontSize: 12, fontWeight: 500, cursor: "pointer",
            }}>
              <IconUpload size={12} />Import
            </button>
            <SaveAsTemplateButton
              defaultName={tableLabel}
              onSave={onCaptureAsTemplate}
            />
            <button onClick={onAddRow} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "4px 10px", borderRadius: 5,
              background: "var(--primary)", border: "1px solid var(--primary)",
              color: "var(--primary-foreground)", fontSize: 12, fontWeight: 500, cursor: "pointer",
            }}>
              <IconPlus size={12} />New row
            </button>
            <div style={{ width: 1, height: 18, background: "var(--border-subtle)", margin: "0 2px" }} />
            <FilterMenu
              rows={rows}
              columns={columns}
              statusFilter={filter}      onChangeStatus={setFilter}
              priorityFilter={priorityFilter} onChangePriority={setPriorityFilter}
              themeFilter={themeFilter}  onChangeTheme={setThemeFilter}
              sentimentFilter={sentimentFilter} onChangeSentiment={setSentimentFilter}
            />
            <DisplayMenu
              view={view} onChangeView={setView}
              enabledViews={enabledViews} onToggleView={onToggleEnabledView}
              viewSupport={viewSupport}
              groupBy={groupBy} onChangeGroupBy={setGroupBy}
              sort={sort} onSort={onSortFromMenu}
              rowHeight={rowHeight} onChangeRowHeight={setRowHeight}
              cellStyle={cellStyle} onChangeCellStyle={setCellStyle}
              newRowPosition={newRowPosition} onChangeNewRowPosition={setNewRowPosition}
              wordWrap={wordWrap} onChangeWordWrap={setWordWrap}
              columns={columns}
              hiddenCols={hiddenCols}
              onToggleCol={onToggleCol}
              onResetCols={onResetCols}
              onAddColumn={onAddColumn}
            />
            <DetailBarToggle open={panels.detailBar} onToggle={toggleDetailBar} />
          </div>
        </div>

        {view === "sheet" ? (
          <InteractiveSheet
            rows={visibleRows} columns={visibleColumns}
            density={rowHeight === "short" ? "compact" : rowHeight === "tall" ? "comfortable" : "default"}
            cellStyle={cellStyle}
            wordWrap={wordWrap}
            selectedIds={selectedIds} onSelect={setSelectedIds}
            onUpdateRow={onUpdateRow} onCommitAi={onCommitAi} onDismissAi={onDismissAi}
            onButtonAction={onButtonAction}
            sort={sort} onSort={onSort}
            focusedCell={focusedCell} onFocusCell={setFocusedCell}
            tablesById={tablesById}
            onAddColumn={onAddColumn}
            onAddRow={onAddRow}
            onPromoteColumnToLibrary={onPromoteColumnToLibrary}
            onUnlinkColumn={onUnlinkColumn}
            onDeleteColumn={onDeleteColumn}
            onJumpToLibraryAsset={onJumpToLibraryAsset}
            onAttachFunction={onAttachFunction}
            onDetachFunction={onDetachFunction}
            onReorderColumn={onReorderColumn}
          />
        ) : view === "kanban" ? (
          viewSupport.kanban.supported
            ? <KanbanView rows={visibleRows} onUpdateRow={onUpdateRow} cardConfig={KANBAN_CARD_CONFIG[activeTableId]} selectedIds={selectedIds} onSelect={setSelectedIds} />
            : <StubView title="Kanban needs a Status / Select column" icon={<IconKanban size={26} />}>
                The <b>{tableLabel}</b> table doesn’t have a Status, Select, or Priority column.
                Add one via Schema, or switch to Sheet / Dashboard.
              </StubView>
        ) : view === "chart" ? (
          (() => {
            const t = tablesById[activeTableId];
            const customCharts = t?.dashboardCharts;
            const customized = customCharts !== undefined;
            if (customized) {
              return <CustomDashboard
                rows={visibleRows} columns={columns} tableLabel={tableLabel}
                charts={customCharts}
                customized={true}
                onAddChart={onAddChart}
                onEditChart={onEditChart}
                onDeleteChart={onDeleteChart}
                onMoveChart={onMoveChart}
                onReorderChart={onReorderChart}
                onAddColumn={onAddColumn}
                onApplyDashboardTemplate={onApplyDashboardTemplate}
                onResetDashboard={onResetDashboard}
                onSaveDashboardAsTemplate={onSaveDashboardAsTemplate}
                onAiBuildDashboard={onAiBuildDashboard}
                library={library}
              />;
            }
            // Try to find a matching Library Dashboard template
            const bestMatch = window.findBestDashboardMatch
              ? window.findBestDashboardMatch(columns, library?.dashboards)
              : null;
            const autoCharts = bestMatch
              ? window.applyDashboardTemplate(bestMatch.dashboard, bestMatch.slots)
              : (window.defaultChartsFor ? window.defaultChartsFor(columns) : []);
            return <CustomDashboard
              rows={visibleRows} columns={columns} tableLabel={tableLabel}
              charts={autoCharts}
              customized={false}
              matchInfo={bestMatch}
              onAddChart={onAddChart}
              onEditChart={onEditChart}
              onDeleteChart={onDeleteChart}
              onMoveChart={onMoveChart}
              onReorderChart={onReorderChart}
              onAddColumn={onAddColumn}
              onApplyDashboardTemplate={onApplyDashboardTemplate}
              onResetDashboard={onResetDashboard}
              onSaveDashboardAsTemplate={onSaveDashboardAsTemplate}
              onAiBuildDashboard={onAiBuildDashboard}
              library={library}
            />;
          })()
        ) : view === "grid" ? (
          <GridView rows={visibleRows} cardConfig={GRID_CARD_CONFIG[activeTableId]} selectedIds={selectedIds} onSelect={setSelectedIds} />
        ) : view === "timeline" ? (
          viewSupport.timeline.supported
            ? <TimelineView
                rows={visibleRows}
                selectedIds={selectedIds}
                onSelect={setSelectedIds}
                dateField={viewSupport.timeline.dateField}
                titleField={activeTableId === "interviews" ? "name" : (activeTableId === "tasks" ? "title" : "name")}
                subtitleField={activeTableId === "interviews" ? "company" : (activeTableId === "tasks" ? "assignee" : null)}
              />
            : <StubView title="Timeline needs a Date column" icon={<IconCalendar size={26} />}>
                Add a Date-type column (e.g. <code style={{ fontFamily: "var(--font-mono)" }}>due</code> or <code style={{ fontFamily: "var(--font-mono)" }}>date</code>) to plot rows on a timeline.
              </StubView>
        ) : null}

        <div style={{
          height: 32, flexShrink: 0,
          borderTop: "1px solid var(--border-subtle)",
          background: "var(--surface)",
          display: "flex", alignItems: "center", padding: "0 14px", gap: 10, fontSize: 11.5, color: "var(--muted-foreground)",
        }}>
          <span><span className="fb-tnum">{selectedIds.length}</span> selected</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span className="fb-tnum">{visibleRows.length} rows</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span>Sort: <b style={{ fontWeight: 500, color: "var(--foreground)" }}>{sort.key} {sort.dir === "asc" ? "↑" : "↓"}</b></span>
          <span style={{ opacity: 0.5 }}>·</span>
          <span style={{ fontFamily: "var(--font-mono)" }}>⌘Z undo · ⌘B AI · ⌘⇧F nav</span>
          <div style={{ flex: 1 }} />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--status-done-fg)" }} />Local · saved
          </span>
        </div>
        </>
        )}
      </main>
      {panels.detailBar && (
        <DetailBar
          rows={visibleRows}
          allRows={rows}
          columns={columns}
          tableLabel={tableLabel}
          activeTableId={activeTableId}
          selectedIds={selectedIds}
          focusedCell={focusedCell}
          onClearSelection={() => setSelectedIds([])}
          activity={aiHistory && [...aiHistory].reverse()}
          quickFilters={[
            { id: "qf-empty", label: "Empty theme rows", color: "var(--muted-foreground)", count: rows.filter(r => !r.theme).length, apply: () => {} },
            { id: "qf-urgent", label: "Urgent priority", color: "var(--chart-1)", count: rows.filter(r => r.priority === "Urgent").length, apply: () => setPriorityFilter(new Set(["Urgent"])) },
            { id: "qf-todo", label: "Status: todo", color: "var(--status-todo-fg)", count: rows.filter(r => r.status === "todo").length, apply: () => setFilter(new Set(["todo"])) },
          ].filter(f => f.count > 0)}
          onApplyQuickFilter={(f) => { f.apply && f.apply(); setToast({ kind: "success", message: `Applied: ${f.label}` }); }}
          onOpenRow={(id) => {
            // Switch to Sheet view + focus the row + clear selection so Row mode targets just this one
            setView("sheet");
            setFocusedCell({ row: id, col: columns[1]?.name || "id" });
            setSelectedIds([id]);
          }}
          tablesById={tablesById}
          onClose={toggleDetailBar}
          onDrilldownFilter={(colName, value) => {
            if (colName === "status") {
              setFilter(prev => { const n = new Set(prev); n.add(value); return n; });
            } else if (colName === "priority") {
              setPriorityFilter(prev => { const n = new Set(prev); n.add(value); return n; });
            } else if (colName === "theme") {
              setThemeFilter(prev => { const n = new Set(prev); n.add(value); return n; });
            } else if (colName === "sentiment") {
              setSentimentFilter(prev => { const n = new Set(prev); n.add(value); return n; });
            } else {
              setToast({ kind: "info", message: `Drilldown for ${colName} not yet wired to a filter` });
              return;
            }
            setToast({ kind: "success", message: `Filtered ${colName} = ${value}` });
          }}
        />
      )}
      {panels.aiPanel && (
        <InteractiveActivityPanel
          rows={rows}
          activeTableId={activeTableId}
          activeTableLabel={tableLabel}
          hasAi={!!TABLES.find(t => t.id === activeTableId)?.hasAi}
          onAcceptAll={onAcceptAll}
          onDismissAll={onDismissAll}
          onAskAi={onAskAi}
          chatMessages={chatMessages}
          onSendChat={onSendChat}
          chatBusy={chatBusy}
          aiHistory={aiHistory}
        />
      )}
        </>
      )}

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onCommit={onImportCommit}
        existingColumns={columns}
      />

      {newTableOpen && (
        <NewTableModal
          library={library}
          onClose={() => setNewTableOpen(false)}
          onCreateFromTemplate={(templateId, tableName) => {
            onCreateTableFromTemplate(templateId, tableName);
            setNewTableOpen(false);
          }}
          onCreateBlank={(tableName) => {
            onCreateBlankTable(tableName);
            setNewTableOpen(false);
          }}
        />
      )}

      <SearchPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        tablesById={tablesById}
        library={library}
        wikiPages={wikiPages}
        onNavigateTable={(id) => { setActivityMode("tables"); switchTable(id); }}
        onNavigateRow={(tid, rid) => {
          setActivityMode("tables");
          if (tid !== activeTableId) switchTable(tid);
          const col = (tablesById[tid]?.columns || [])[1]?.name || "id";
          setFocusedCell({ row: rid, col });
        }}
        onNavigateLibraryAsset={(category, assetId) => {
          setActivityMode("library");
          setLibCategory(category);
          setLibAssetId(assetId);
        }}
        onNavigateWikiPage={(pageId) => {
          setActivityMode("wiki");
          setWikiPageId(pageId);
        }}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

const ActiveFilterChip = ({ label, onClear }) => (
  <span style={{
    display: "inline-flex", alignItems: "center", gap: 4,
    padding: "2px 4px 2px 8px", borderRadius: 4,
    background: "var(--muted)",
    border: "1px solid var(--border-subtle)",
    fontSize: 11.5, color: "var(--foreground)",
    maxWidth: 220, whiteSpace: "nowrap", overflow: "hidden",
  }}>
    <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{label}</span>
    <button onClick={onClear} style={{
      width: 14, height: 14, padding: 0, borderRadius: 3, border: "none",
      background: "transparent", color: "var(--muted-foreground)",
      display: "inline-flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0,
    }}
    onMouseEnter={(e) => e.currentTarget.style.background = "var(--hover-bg)"}
    onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
      <IconX size={10} />
    </button>
  </span>
);

const Toast = ({ toast, onClose }) => {
  if (!toast) return null;
  const toneMap = {
    success: { bg: "var(--status-done-bg)",     fg: "var(--status-done-fg)",     icon: <IconCheck size={14} /> },
    error:   { bg: "var(--status-todo-bg)",     fg: "var(--status-todo-fg)",     icon: <IconX size={14} /> },
    info:    { bg: "var(--muted)",              fg: "var(--foreground)",         icon: <IconUndo size={14} /> },
    loading: { bg: "var(--muted)",              fg: "var(--foreground)",         icon: <IconSparkles size={14} style={{ color: "var(--primary)" }} /> },
  };
  const t = toneMap[toast.kind] || toneMap.info;
  return (
    <div style={{
      position: "fixed", bottom: 20, left: "50%",
      transform: "translateX(-50%)",
      zIndex: 1100,
      padding: "8px 14px", borderRadius: 8,
      background: t.bg, color: t.fg,
      border: "1px solid color-mix(in oklch, " + t.fg + " 20%, transparent)",
      boxShadow: "var(--shadow-popover)",
      display: "inline-flex", alignItems: "center", gap: 9,
      fontSize: 12.5, fontWeight: 500,
      animation: "fb-toast-in 200ms ease",
    }}>
      {t.icon}
      <span>{toast.message}</span>
      <button onClick={onClose} style={{ background: "transparent", border: "none", color: t.fg, cursor: "pointer", opacity: 0.6, padding: 0, display: "flex", marginLeft: 4 }}>
        <IconX size={11} />
      </button>
    </div>
  );
};

if (!document.getElementById("fb-toast-keyframes")) {
  const s = document.createElement("style");
  s.id = "fb-toast-keyframes";
  s.textContent = "@keyframes fb-toast-in { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } } @keyframes fb-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }";
  document.head.appendChild(s);
}

ReactDOM.createRoot(document.getElementById("root")).render(<ProtoApp />);
