/* @jsx React.createElement */
// FlowBase Import Modal — paste CSV / markdown table / sheets data,
// AI infers column types + suggests AI columns, preview, then commit.

const { useState: useI, useRef: useIR, useEffect: useIE } = React;

// ─────────────────────────────────────────────────────────────
// Parsers
// ─────────────────────────────────────────────────────────────

function parseDelimited(text, delim) {
  // Minimal CSV/TSV parse with quote handling
  const lines = text.replace(/\r\n?/g, "\n").split("\n").filter(l => l.length > 0);
  return lines.map((line) => {
    const cells = [];
    let cur = "", inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (inQuote) {
        if (c === '"' && line[i+1] === '"') { cur += '"'; i++; }
        else if (c === '"') inQuote = false;
        else cur += c;
      } else {
        if (c === '"') inQuote = true;
        else if (c === delim) { cells.push(cur); cur = ""; }
        else cur += c;
      }
    }
    cells.push(cur);
    return cells.map(s => s.trim());
  });
}

function parseMarkdownTable(text) {
  const lines = text.split("\n").filter(l => l.trim().startsWith("|"));
  if (lines.length < 2) return null;
  const cells = (line) => line.replace(/^\||\|$/g, "").split("|").map(s => s.trim());
  // skip separator row (---)
  const rows = lines.filter(l => !/^\|?[\s|:\-]+\|?$/.test(l)).map(cells);
  return rows;
}

function detectFormat(text) {
  const t = text.trim();
  if (!t) return null;
  if (/^\|.+\|/m.test(t) && /[-:]+/.test(t)) return "md";
  // Count tabs vs commas in first line
  const firstLine = t.split("\n")[0];
  const tabs = (firstLine.match(/\t/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  if (tabs > 0 && tabs >= commas) return "tsv";
  if (commas > 0) return "csv";
  return null;
}

function parseAny(text) {
  const fmt = detectFormat(text);
  if (fmt === "md") return { format: "md", rows: parseMarkdownTable(text) || [] };
  if (fmt === "tsv") return { format: "tsv", rows: parseDelimited(text, "\t") };
  if (fmt === "csv") return { format: "csv", rows: parseDelimited(text, ",") };
  return { format: null, rows: [] };
}

// ─────────────────────────────────────────────────────────────
// Type inference (static, fast)
// ─────────────────────────────────────────────────────────────

function inferType(samples) {
  const vals = samples.filter(s => s != null && s !== "");
  if (vals.length === 0) return "text";
  if (vals.every(v => /^\d{4}-\d{2}-\d{2}/.test(v))) return "date";
  if (vals.every(v => /^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(v))) return "email";
  if (vals.every(v => /^-?\d+(\.\d+)?$/.test(v))) return "num";
  if (new Set(vals).size <= Math.max(5, vals.length / 4)) return "select";
  return "text";
}

function normalizeHeader(s, idx) {
  if (!s || !s.trim()) return "col_" + (idx + 1);
  return s.trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40) || "col_" + (idx + 1);
}

// ─────────────────────────────────────────────────────────────
// Sample data the user can drop in
// ─────────────────────────────────────────────────────────────

const SAMPLE_CSV = `id,name,company,date,status,quote
INT-101,Lee Junho,Petal,2026-05-18,todo,"가격이 좀 부담스러운데 무료 플랜이 있나요"
INT-102,Mira Tan,Forge,2026-05-17,progress,"새 컬럼 만드는 게 한 번에 안 보여요"
INT-103,Park Jisoo,Halo,2026-05-16,done,"AI 추천이 너무 좋아요. 시간 절약됨"
INT-104,Eli Park,Solo PM,2026-05-15,waiting,"공유 링크 권한 단순했으면"
INT-105,Yuna Kim,Drift,2026-05-15,todo,"엑셀에서 붙여넣기가 잘 안 됨"`;

// ─────────────────────────────────────────────────────────────
// Main Modal
// ─────────────────────────────────────────────────────────────

const ImportModal = ({ open, onClose, onCommit, existingColumns }) => {
  const [step, setStep] = useI(1); // 1: paste, 2: review, 3: AI columns
  const [raw, setRaw] = useI("");
  const [parsed, setParsed] = useI(null);
  const [headerRow, setHeaderRow] = useI(true);
  const [columnTypes, setColumnTypes] = useI([]);
  const [aiColumns, setAiColumns] = useI({ theme: false, sentiment: false });
  const [analyzing, setAnalyzing] = useI(false);
  const [aiSummary, setAiSummary] = useI(null);

  useIE(() => {
    if (!open) { setStep(1); setRaw(""); setParsed(null); setAiSummary(null); setAiColumns({ theme: false, sentiment: false }); }
  }, [open]);

  if (!open) return null;

  const reparse = (text) => {
    const p = parseAny(text);
    setParsed(p);
    if (p.rows.length > 0) {
      const headers = headerRow ? p.rows[0] : p.rows[0].map((_, i) => "col_" + (i + 1));
      const dataRows = headerRow ? p.rows.slice(1) : p.rows;
      const cols = headers.map((h, i) => ({
        name: normalizeHeader(h, i),
        label: h || "Column " + (i + 1),
        type: inferType(dataRows.slice(0, 50).map(r => r[i])),
      }));
      setColumnTypes(cols);
    }
  };

  const handlePaste = (text) => { setRaw(text); reparse(text); };

  const toggleHeaderRow = () => {
    setHeaderRow(h => {
      const next = !h;
      // recompute columns
      if (parsed && parsed.rows.length > 0) {
        const headers = next ? parsed.rows[0] : parsed.rows[0].map((_, i) => "col_" + (i + 1));
        const dataRows = next ? parsed.rows.slice(1) : parsed.rows;
        const cols = headers.map((hh, i) => ({
          name: normalizeHeader(hh, i),
          label: hh || "Column " + (i + 1),
          type: inferType(dataRows.slice(0, 50).map(r => r[i])),
        }));
        setColumnTypes(cols);
      }
      return next;
    });
  };

  const analyzeWithAI = async () => {
    if (!parsed || parsed.rows.length === 0) return;
    setAnalyzing(true);
    const dataRows = headerRow ? parsed.rows.slice(1) : parsed.rows;
    const sample = dataRows.slice(0, 15).map(r => r.join(" | ")).join("\n");
    const headers = columnTypes.map(c => c.label).join(" | ");
    const prompt = `You are analyzing a spreadsheet for a customer feedback board. Headers: ${headers}\n\nSample rows:\n${sample}\n\nReturn a JSON object with shape: { "summary": "1-sentence description of what this data is", "suggestText": true/false (whether a 'theme' AI column would be valuable), "suggestSentiment": true/false (whether a sentiment column would be valuable), "rowCount": ${dataRows.length} }. Reply ONLY with the JSON object, nothing else.`;
    try {
      const text = await window.claude.complete({ messages: [{ role: "user", content: prompt }] });
      const json = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || "{}");
      setAiSummary(json);
      setAiColumns({ theme: !!json.suggestText, sentiment: !!json.suggestSentiment });
    } catch (e) {
      setAiSummary({ summary: "Imported " + dataRows.length + " rows.", suggestText: false, suggestSentiment: false });
    }
    setAnalyzing(false);
    setStep(3);
  };

  const commit = () => {
    const dataRows = headerRow ? parsed.rows.slice(1) : parsed.rows;
    const newRows = dataRows.map((r, idx) => {
      const obj = {
        id: "INT-" + String(200 + idx).padStart(3, "0"),
        name: "", company: "", date: new Date().toISOString().slice(0, 10),
        theme: "Other", sentiment: "Mixed",
        status: "todo", priority: "Med", quote: "",
        themeConfirmed: !aiColumns.theme,
        sentimentConfirmed: !aiColumns.sentiment,
      };
      columnTypes.forEach((c, i) => {
        const v = r[i];
        if (v == null || v === "") return;
        // Try to map by header name
        const target = c.name.toLowerCase();
        if (/^id$/.test(target) || target === "id") obj.id = v;
        else if (/name/.test(target)) obj.name = v;
        else if (/company|account/.test(target)) obj.company = v;
        else if (/date|created|opened/.test(target)) obj.date = v;
        else if (/status/.test(target)) {
          const m = v.toLowerCase();
          if (/done|완료|complete/.test(m)) obj.status = "done";
          else if (/progress|진행/.test(m)) obj.status = "progress";
          else if (/wait|대기|hold/.test(m)) obj.status = "waiting";
          else obj.status = "todo";
        }
        else if (/priority|urgency/.test(target)) {
          const m = v.toLowerCase();
          if (/urgent|급/.test(m)) obj.priority = "Urgent";
          else if (/high|상/.test(m)) obj.priority = "High";
          else if (/low|하/.test(m)) obj.priority = "Low";
          else obj.priority = "Med";
        }
        else if (/quote|note|comment|content|message/.test(target)) obj.quote = v;
        else if (/theme|topic|category|tag/.test(target)) obj.theme = v;
        else if (/sentiment|feeling|tone/.test(target)) obj.sentiment = v;
        else if (!obj.quote) obj.quote = v; // fallback: longest free text
      });
      return obj;
    });
    onCommit(newRows, { ranAi: aiColumns.theme || aiColumns.sentiment, count: newRows.length });
    onClose();
  };

  const dataRows = parsed ? (headerRow ? parsed.rows.slice(1) : parsed.rows) : [];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{
        width: "100%", maxWidth: 920, maxHeight: "calc(100vh - 48px)",
        background: "var(--background)", borderRadius: 12,
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-popover)",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          height: 52, padding: "0 18px",
          display: "flex", alignItems: "center", gap: 12,
          borderBottom: "1px solid var(--border-subtle)",
        }}>
          <span style={{
            width: 28, height: 28, borderRadius: 7,
            background: "color-mix(in oklch, var(--chart-2) 18%, var(--background))",
            color: "var(--chart-2)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            <IconUpload size={15} />
          </span>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Import data</span>
            <span style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>Paste from Google Sheets, Excel, Notion, or any CSV / Markdown table</span>
          </div>
          <div style={{ flex: 1 }} />
          <StepCrumbs step={step} />
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 6, border: "1px solid var(--border)",
            background: "var(--card)", color: "var(--muted-foreground)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>
            <IconX size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="fb-scroll" style={{ flex: 1, minHeight: 0, overflow: "auto", padding: 18 }}>
          {step === 1 && (
            <Step1Paste
              raw={raw}
              onChange={handlePaste}
              parsed={parsed}
              onSample={() => handlePaste(SAMPLE_CSV)}
            />
          )}
          {step === 2 && parsed && (
            <Step2Review
              parsed={parsed}
              columnTypes={columnTypes}
              setColumnTypes={setColumnTypes}
              headerRow={headerRow}
              toggleHeaderRow={toggleHeaderRow}
              dataRows={dataRows}
            />
          )}
          {step === 3 && (
            <Step3AI
              aiSummary={aiSummary}
              aiColumns={aiColumns}
              setAiColumns={setAiColumns}
              columnTypes={columnTypes}
              rowCount={dataRows.length}
            />
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: "12px 18px", borderTop: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          {step === 1 && (
            <>
              {parsed && parsed.rows.length > 0 && (
                <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                  Detected <b style={{ color: "var(--foreground)", fontWeight: 500 }}>{parsed.format?.toUpperCase()}</b>
                  {" · "}{dataRows.length} rows · {columnTypes.length} columns
                </span>
              )}
              <div style={{ flex: 1 }} />
              <button onClick={onClose} style={btnGhost}>Cancel</button>
              <button onClick={() => setStep(2)} disabled={!parsed || parsed.rows.length === 0}
                style={btnPrimary(!parsed || parsed.rows.length === 0)}>
                Continue<IconChevronRight size={12} />
              </button>
            </>
          )}
          {step === 2 && (
            <>
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                {dataRows.length} rows · {columnTypes.length} columns · ready for AI columns
              </span>
              <div style={{ flex: 1 }} />
              <button onClick={() => setStep(1)} style={btnGhost}>
                <IconChevronLeft size={12} />Back
              </button>
              <button onClick={analyzeWithAI} disabled={analyzing} style={btnPrimary(analyzing)}>
                {analyzing ? <>
                  <Spinner /><span>Analyzing…</span>
                </> : <>
                  <IconSparkles size={12} /><span>Analyze with AI</span>
                </>}
              </button>
            </>
          )}
          {step === 3 && (
            <>
              <span style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                {dataRows.length} rows ready · {(aiColumns.theme ? 1 : 0) + (aiColumns.sentiment ? 1 : 0)} AI column(s) selected
              </span>
              <div style={{ flex: 1 }} />
              <button onClick={() => setStep(2)} style={btnGhost}>
                <IconChevronLeft size={12} />Back
              </button>
              <button onClick={commit} style={btnPrimary(false)}>
                <IconCheck size={12} />Import {dataRows.length} rows
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const StepCrumbs = ({ step }) => (
  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--muted-foreground)" }}>
    {["Paste", "Review", "AI"].map((label, i) => (
      <React.Fragment key={label}>
        <span style={{
          padding: "2px 7px", borderRadius: 4,
          background: step === i + 1 ? "color-mix(in oklch, var(--primary) 14%, transparent)" : "var(--muted)",
          color: step === i + 1 ? "var(--primary)" : "var(--muted-foreground)",
          fontWeight: step === i + 1 ? 600 : 500,
        }}>{i + 1}. {label}</span>
        {i < 2 && <span style={{ opacity: 0.5 }}>›</span>}
      </React.Fragment>
    ))}
  </div>
);

const Spinner = () => (
  <span style={{
    width: 11, height: 11, borderRadius: "50%",
    border: "1.5px solid var(--primary-foreground)",
    borderTopColor: "transparent",
    animation: "fb-spin 0.6s linear infinite",
    display: "inline-block",
  }} />
);

const btnGhost = {
  padding: "6px 12px", borderRadius: 6, border: "1px solid var(--border)",
  background: "var(--card)", color: "var(--muted-foreground)",
  fontSize: 12.5, cursor: "pointer",
  display: "inline-flex", alignItems: "center", gap: 4,
};
const btnPrimary = (disabled) => ({
  padding: "6px 13px", borderRadius: 6,
  border: "1px solid " + (disabled ? "var(--border)" : "var(--primary)"),
  background: disabled ? "var(--muted)" : "var(--primary)",
  color: disabled ? "var(--muted-foreground)" : "var(--primary-foreground)",
  fontSize: 12.5, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer",
  display: "inline-flex", alignItems: "center", gap: 5,
  opacity: disabled ? 0.7 : 1,
});

// ─────────────────────────────────────────────────────────────
// Step 1: paste textarea
// ─────────────────────────────────────────────────────────────

const Step1Paste = ({ raw, onChange, parsed, onSample }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <span style={{ fontSize: 13, fontWeight: 500 }}>Paste your data</span>
      <span style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>CSV, TSV, or markdown table — we detect the format</span>
      <div style={{ flex: 1 }} />
      <button onClick={onSample} style={{
        padding: "4px 9px", borderRadius: 5, border: "1px solid var(--border)",
        background: "var(--card)", color: "var(--muted-foreground)", fontSize: 11.5, cursor: "pointer",
        display: "inline-flex", alignItems: "center", gap: 4,
      }}>
        <IconSparkles size={11} style={{ color: "var(--primary)" }} />Use sample
      </button>
    </div>
    <textarea
      autoFocus
      value={raw}
      onChange={(e) => onChange(e.target.value)}
      placeholder={`Paste rows here — copy from Google Sheets, Excel, Notion, anywhere…\n\nname, company, date, quote\nLee Junho, Petal, 2026-05-18, 가격이 부담스러워요…\n…`}
      style={{
        width: "100%", height: 240,
        padding: 12, borderRadius: 8,
        background: "var(--card)", border: "1px solid var(--border)",
        color: "var(--foreground)", fontFamily: "var(--font-mono)",
        fontSize: 12.5, lineHeight: 1.6, outline: "none", resize: "vertical",
      }}
      className="fb-scroll"
    />
    {parsed && parsed.rows.length > 0 && (
      <div style={{
        padding: "10px 12px", borderRadius: 7,
        background: "color-mix(in oklch, var(--primary) 6%, var(--card))",
        border: "1px solid color-mix(in oklch, var(--primary) 30%, var(--border))",
        display: "flex", alignItems: "center", gap: 10, fontSize: 12.5,
      }}>
        <IconCheck size={13} style={{ color: "var(--primary)" }} />
        <span style={{ fontWeight: 500 }}>Detected {parsed.format?.toUpperCase()}: {parsed.rows.length} rows, {parsed.rows[0]?.length || 0} columns</span>
        <div style={{ flex: 1 }} />
      </div>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────
// Step 2: review parsed table
// ─────────────────────────────────────────────────────────────

const TYPE_OPTIONS = ["text", "num", "date", "email", "select", "status"];

const Step2Review = ({ parsed, columnTypes, setColumnTypes, headerRow, toggleHeaderRow, dataRows }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Review columns</span>
        <span style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>Types are auto-detected. Click to change.</span>
        <div style={{ flex: 1 }} />
        <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, cursor: "pointer" }}>
          <input type="checkbox" checked={headerRow} onChange={toggleHeaderRow} />
          First row is header
        </label>
      </div>
      <div className="fb-scroll" style={{
        border: "1px solid var(--border)", borderRadius: 8,
        overflow: "auto", background: "var(--card)",
      }}>
        <table style={{ borderCollapse: "separate", borderSpacing: 0, fontSize: 12.5, width: "100%" }}>
          <thead>
            <tr>
              {columnTypes.map((c, i) => (
                <th key={i} style={{
                  padding: "10px 12px",
                  textAlign: "left",
                  borderBottom: "1px solid var(--border)",
                  borderRight: i < columnTypes.length - 1 ? "1px solid var(--border-subtle)" : "none",
                  background: "var(--surface)",
                  position: "sticky", top: 0,
                  minWidth: 130,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <FieldTypeGlyph type={c.type} />
                    <input
                      value={c.label}
                      onChange={(e) => {
                        const cs = [...columnTypes];
                        cs[i] = { ...c, label: e.target.value, name: normalizeHeader(e.target.value, i) };
                        setColumnTypes(cs);
                      }}
                      style={{
                        flex: 1, border: "none", background: "transparent", outline: "none",
                        color: "var(--foreground)", fontSize: 12.5, fontWeight: 600,
                      }}
                    />
                  </div>
                  <select
                    value={c.type}
                    onChange={(e) => {
                      const cs = [...columnTypes];
                      cs[i] = { ...c, type: e.target.value };
                      setColumnTypes(cs);
                    }}
                    style={{
                      marginTop: 4, padding: "2px 4px", borderRadius: 3,
                      background: "var(--muted)", border: "1px solid var(--border-subtle)",
                      color: "var(--muted-foreground)", fontSize: 11, fontFamily: "var(--font-mono)",
                      outline: "none", cursor: "pointer",
                    }}
                  >
                    {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.slice(0, 8).map((r, i) => (
              <tr key={i}>
                {columnTypes.map((c, j) => (
                  <td key={j} style={{
                    padding: "7px 12px",
                    fontSize: 12.5,
                    borderBottom: i < Math.min(7, dataRows.length - 1) ? "1px solid var(--border-subtle)" : "none",
                    borderRight: j < columnTypes.length - 1 ? "1px solid var(--border-subtle)" : "none",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    maxWidth: 240,
                    fontFamily: c.type === "num" || c.type === "date" ? "var(--font-mono)" : "var(--font-sans)",
                    color: c.type === "num" || c.type === "date" ? "var(--muted-foreground)" : "var(--foreground)",
                  }}>
                    {r[j] || <span style={{ color: "var(--muted-foreground)", opacity: 0.6 }}>—</span>}
                  </td>
                ))}
              </tr>
            ))}
            {dataRows.length > 8 && (
              <tr>
                <td colSpan={columnTypes.length} style={{
                  padding: "8px 12px", fontSize: 11.5,
                  color: "var(--muted-foreground)", textAlign: "center",
                  background: "var(--surface)",
                }}>
                  + {dataRows.length - 8} more rows
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Step 3: AI column suggestions
// ─────────────────────────────────────────────────────────────

const Step3AI = ({ aiSummary, aiColumns, setAiColumns, columnTypes, rowCount }) => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>AI column suggestions</span>
        <span style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>Confirm to add — drafted now, you can review row-by-row later.</span>
      </div>
      {aiSummary?.summary && (
        <div style={{
          padding: 12, borderRadius: 8,
          background: "color-mix(in oklch, var(--primary) 5%, var(--card))",
          border: "1px solid var(--border-subtle)",
          display: "flex", alignItems: "flex-start", gap: 8,
        }}>
          <IconSparkles size={14} style={{ color: "var(--primary)", marginTop: 2 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--muted-foreground)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 4 }}>AI summary</div>
            <div style={{ fontSize: 13, lineHeight: 1.55 }}>{aiSummary.summary}</div>
          </div>
        </div>
      )}
      <AIColumnCard
        title="Theme"
        detail="Classify each row into a high-level theme (Pricing, Onboarding, Features, etc.). Inferred from the free-text columns."
        recommended={aiSummary?.suggestText}
        on={aiColumns.theme}
        onToggle={() => setAiColumns(s => ({ ...s, theme: !s.theme }))}
      />
      <AIColumnCard
        title="Sentiment"
        detail="Score each row as Positive / Mixed / Negative. Useful when your data has feedback or quotes."
        recommended={aiSummary?.suggestSentiment}
        on={aiColumns.sentiment}
        onToggle={() => setAiColumns(s => ({ ...s, sentiment: !s.sentiment }))}
      />
      <div style={{
        padding: 12, borderRadius: 8,
        background: "var(--muted)",
        fontSize: 11.5, color: "var(--muted-foreground)", display: "flex", alignItems: "center", gap: 6,
      }}>
        <IconCheck size={12} />
        Nothing is auto-applied. AI columns are added as <i>pending</i> — confirm each cell from the sheet.
      </div>
    </div>
  );
};

const AIColumnCard = ({ title, detail, recommended, on, onToggle }) => (
  <button onClick={onToggle} style={{
    padding: 14, borderRadius: 8,
    background: "var(--card)",
    border: "1px solid " + (on ? "var(--primary)" : "var(--border)"),
    textAlign: "left", cursor: "pointer",
    display: "flex", gap: 12, alignItems: "flex-start",
  }}>
    <span style={{
      width: 18, height: 18, borderRadius: 4,
      background: on ? "var(--primary)" : "var(--card)",
      border: "1.5px solid " + (on ? "var(--primary)" : "var(--border)"),
      color: "var(--primary-foreground)",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0, marginTop: 1,
    }}>
      {on && <IconCheck size={12} />}
    </span>
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600 }}>{title}</span>
        {recommended && (
          <span style={{
            fontSize: 10, padding: "1px 6px", borderRadius: 3, fontWeight: 600,
            background: "color-mix(in oklch, var(--primary) 14%, transparent)",
            color: "var(--primary)",
          }}>Recommended</span>
        )}
      </div>
      <div style={{ fontSize: 12, color: "var(--muted-foreground)", lineHeight: 1.5 }}>{detail}</div>
    </div>
  </button>
);

Object.assign(window, {
  ImportModal, parseAny, detectFormat, SAMPLE_CSV,
});

// keyframes for spinner — inject once
if (typeof document !== "undefined" && !document.getElementById("fb-import-keyframes")) {
  const s = document.createElement("style");
  s.id = "fb-import-keyframes";
  s.textContent = "@keyframes fb-spin { to { transform: rotate(360deg); } }";
  document.head.appendChild(s);
}
