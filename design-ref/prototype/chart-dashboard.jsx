/* @jsx React.createElement */
// FlowBase — chart primitives + Dashboard view.
// Pure SVG. No deps. Colors from FlowBase tokens. Hover tooltips.

const { useState: useSc, useMemo: useMc, useRef: useRc } = React;

// ─────────────────────────────────────────────────────────────
// Common primitives
// ─────────────────────────────────────────────────────────────

const ChartCard = ({ title, subtitle, accent = "var(--chart-1)", action, children, span = 1 }) => (
  <div style={{
    gridColumn: `span ${span}`,
    background: "var(--card)",
    border: "1px solid var(--border-subtle)",
    borderRadius: 10,
    padding: 16,
    display: "flex", flexDirection: "column", gap: 12,
    minHeight: 240,
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 6, height: 6, borderRadius: 2, background: accent }} />
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--foreground)" }}>{title}</span>
        {subtitle && <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>{subtitle}</span>}
      </div>
      <div style={{ flex: 1 }} />
      {action}
    </div>
    {children}
  </div>
);

const KpiTile = ({ label, value, delta, deltaTone = "default", hint }) => {
  const toneMap = {
    up:      "var(--status-done-fg)",
    down:    "var(--status-todo-fg)",
    warn:    "var(--status-progress-fg)",
    default: "var(--muted-foreground)",
  };
  return (
    <div style={{
      background: "var(--card)",
      border: "1px solid var(--border-subtle)",
      borderRadius: 10,
      padding: "14px 16px",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted-foreground)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <span style={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}>{value}</span>
        {delta != null && (
          <span style={{
            fontSize: 12, fontWeight: 600, color: toneMap[deltaTone] || toneMap.default,
            fontVariantNumeric: "tabular-nums",
          }}>{delta}</span>
        )}
      </div>
      {hint && <span style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>{hint}</span>}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// BarChart — vertical bars with axis
// ─────────────────────────────────────────────────────────────

const BarChart = ({ data, accent = "var(--chart-1)", yTicks = 5, formatY = (v) => v, height = 220 }) => {
  const [hover, setHover] = useSc(null);
  const max = Math.max(...data.map(d => d.value), 1);
  // pad max to nice number
  const tickStep = Math.ceil(max / yTicks / 10) * 10 || 1;
  const yMax = tickStep * yTicks;
  const padL = 38, padR = 8, padT = 8, padB = 26;
  const w = 600, h = height;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const barGap = 6;
  const barW = (innerW - barGap * (data.length - 1)) / data.length;

  return (
    <div style={{ position: "relative", width: "100%" }}>
      <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} style={{ overflow: "visible" }} preserveAspectRatio="none">
        {/* y gridlines */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const y = padT + innerH - (innerH * i / yTicks);
          return (
            <g key={i}>
              <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="var(--border-subtle)" strokeWidth={1} />
              <text x={padL - 6} y={y + 3} fontSize={10} fontFamily="var(--font-mono)" fill="var(--muted-foreground)" textAnchor="end">{formatY(tickStep * i)}</text>
            </g>
          );
        })}
        {/* bars */}
        {data.map((d, i) => {
          const x = padL + i * (barW + barGap);
          const barH = (d.value / yMax) * innerH;
          const y = padT + innerH - barH;
          const isHover = hover === i;
          return (
            <g key={i}>
              <rect
                x={x} y={y} width={barW} height={barH}
                fill={d.color || accent}
                opacity={isHover ? 1 : 0.92}
                rx={3}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                style={{ transition: "opacity 120ms ease, fill 120ms ease", cursor: "pointer" }}
              />
              {/* x label */}
              <text x={x + barW / 2} y={padT + innerH + 14} fontSize={10} fontFamily="var(--font-mono)" fill="var(--muted-foreground)" textAnchor="middle">{d.label}</text>
              {/* value tag on hover */}
              {isHover && (
                <g>
                  <rect x={x + barW / 2 - 18} y={y - 22} width={36} height={18} rx={4} fill="var(--popover)" stroke="var(--border)" />
                  <text x={x + barW / 2} y={y - 9} fontSize={11} fontFamily="var(--font-mono)" fontWeight={600} fill="var(--foreground)" textAnchor="middle">{formatY(d.value)}</text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// HBar — horizontal bars, ranked list with progress
// ─────────────────────────────────────────────────────────────

const HBar = ({ data, accent = "var(--chart-1)", showValue = true }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
      {data.map((d) => {
        const pct = (d.value / max) * 100;
        return (
          <div key={d.label}>
            <div style={{ display: "flex", alignItems: "baseline", marginBottom: 4 }}>
              <span style={{ fontSize: 12.5, color: "var(--foreground)", flex: 1 }}>{d.label}</span>
              {showValue && <span className="fb-tnum" style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>{d.value}</span>}
            </div>
            <div style={{ height: 8, background: "var(--muted)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                width: pct + "%", height: "100%",
                background: d.color || accent,
                borderRadius: 4,
              }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Donut — segmented circle with labels
// ─────────────────────────────────────────────────────────────

const Donut = ({ data, size = 180, thickness = 26, centerLabel, centerValue }) => {
  const [hover, setHover] = useSc(null);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const total = data.reduce((acc, d) => acc + d.value, 0) || 1;
  let acc = 0;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <g transform={`rotate(-90 ${size/2} ${size/2})`}>
            {data.map((d, i) => {
              const frac = d.value / total;
              const len = c * frac;
              const offset = c * (acc / total);
              acc += d.value;
              const isHover = hover === i;
              return (
                <circle
                  key={i}
                  cx={size/2} cy={size/2} r={r}
                  fill="none"
                  stroke={d.color}
                  strokeWidth={isHover ? thickness + 4 : thickness}
                  strokeDasharray={`${len} ${c - len}`}
                  strokeDashoffset={-offset}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  style={{ cursor: "pointer", transition: "stroke-width 120ms ease" }}
                />
              );
            })}
          </g>
        </svg>
        {/* center label */}
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em", fontVariantNumeric: "tabular-nums" }}>
            {hover !== null ? data[hover].value : (centerValue ?? total)}
          </span>
          <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
            {hover !== null ? data[hover].label : centerLabel}
          </span>
        </div>
      </div>
      {/* legend */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 7 }}>
        {data.map((d, i) => {
          const pct = ((d.value / total) * 100).toFixed(0);
          return (
            <div key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "3px 4px", borderRadius: 4,
                background: hover === i ? "var(--hover-bg)" : "transparent",
                cursor: "default", transition: "background 120ms ease",
              }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: d.color }} />
              <span style={{ fontSize: 12.5, flex: 1 }}>{d.label}</span>
              <span className="fb-tnum" style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>{d.value}</span>
              <span className="fb-tnum" style={{ fontSize: 11.5, color: "var(--muted-foreground)", minWidth: 28, textAlign: "right" }}>{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Stacked bar — horizontal stacked
// ─────────────────────────────────────────────────────────────

const StackedBar = ({ data, total, height = 22, showLegend = true, legend }) => {
  const sum = (total ?? data.reduce((acc, d) => acc + d.value, 0)) || 1;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{
        height, borderRadius: 6, overflow: "hidden",
        display: "flex", background: "var(--muted)",
      }}>
        {data.map((d, i) => {
          const pct = (d.value / sum) * 100;
          if (pct === 0) return null;
          return (
            <div key={i} style={{
              width: pct + "%", height: "100%",
              background: d.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 600, color: "white",
              minWidth: 0, overflow: "hidden", whiteSpace: "nowrap",
            }} title={`${d.label}: ${d.value}`}>
              {pct > 8 ? d.value : ""}
            </div>
          );
        })}
      </div>
      {showLegend && (
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
          {(legend ?? data).map((d, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--muted-foreground)" }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
              <span>{d.label}</span>
              <span className="fb-tnum" style={{ color: "var(--foreground)", fontWeight: 500 }}>{d.value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// LineArea — single line with area fill
// ─────────────────────────────────────────────────────────────

const LineArea = ({ data, accent = "var(--chart-1)", height = 180, yTicks = 4, formatY = (v) => v }) => {
  const [hover, setHover] = useSc(null);
  const max = Math.max(...data.map(d => d.value), 1);
  const tickStep = Math.ceil(max / yTicks);
  const yMax = tickStep * yTicks;
  const padL = 36, padR = 8, padT = 10, padB = 24;
  const w = 600, h = height;
  const innerW = w - padL - padR;
  const innerH = h - padT - padB;
  const step = data.length > 1 ? innerW / (data.length - 1) : 0;
  const pts = data.map((d, i) => ({
    x: padL + i * step,
    y: padT + innerH - (d.value / yMax) * innerH,
    d,
    i,
  }));
  const linePath = pts.map((p, i) => (i === 0 ? "M" : "L") + p.x + "," + p.y).join(" ");
  const areaPath = linePath + ` L${pts[pts.length - 1].x},${padT + innerH} L${pts[0].x},${padT + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" height={h} preserveAspectRatio="none">
      <defs>
        <linearGradient id="la-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.30" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </linearGradient>
      </defs>
      {Array.from({ length: yTicks + 1 }).map((_, i) => {
        const y = padT + innerH - (innerH * i / yTicks);
        return (
          <g key={i}>
            <line x1={padL} y1={y} x2={padL + innerW} y2={y} stroke="var(--border-subtle)" strokeWidth={1} strokeDasharray={i === 0 ? "" : "2 4"} />
            <text x={padL - 6} y={y + 3} fontSize={10} fontFamily="var(--font-mono)" fill="var(--muted-foreground)" textAnchor="end">{formatY(tickStep * i)}</text>
          </g>
        );
      })}
      <path d={areaPath} fill="url(#la-grad)" />
      <path d={linePath} fill="none" stroke={accent} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p) => (
        <g key={p.i}>
          <circle
            cx={p.x} cy={p.y} r={hover === p.i ? 5 : 3}
            fill="var(--background)" stroke={accent} strokeWidth={2}
            onMouseEnter={() => setHover(p.i)}
            onMouseLeave={() => setHover(null)}
            style={{ cursor: "pointer", transition: "r 120ms ease" }}
          />
          <text x={p.x} y={padT + innerH + 14} fontSize={10} fontFamily="var(--font-mono)" fill="var(--muted-foreground)" textAnchor="middle">{p.d.label}</text>
          {hover === p.i && (
            <g>
              <rect x={p.x - 22} y={p.y - 26} width={44} height={20} rx={4} fill="var(--popover)" stroke="var(--border)" />
              <text x={p.x} y={p.y - 12} fontSize={11} fontFamily="var(--font-mono)" fontWeight={600} fill="var(--foreground)" textAnchor="middle">{formatY(p.d.value)}</text>
            </g>
          )}
        </g>
      ))}
    </svg>
  );
};

// ─────────────────────────────────────────────────────────────
// Heatmap-style cell grid (status x theme matrix)
// ─────────────────────────────────────────────────────────────

const Matrix = ({ rowLabels, colLabels, data, accent = "var(--chart-1)" }) => {
  const max = Math.max(...data.flat(), 1);
  return (
    <div style={{ overflow: "auto" }}>
      <table style={{ borderCollapse: "separate", borderSpacing: 0, fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ padding: "6px 8px", textAlign: "left", color: "var(--muted-foreground)", fontWeight: 500, fontSize: 11 }} />
            {colLabels.map((c) => (
              <th key={c} style={{ padding: "6px 8px", textAlign: "center", color: "var(--muted-foreground)", fontWeight: 500, fontSize: 10.5 }}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rowLabels.map((r, ri) => (
            <tr key={r}>
              <td style={{ padding: "5px 8px", textAlign: "right", color: "var(--muted-foreground)", whiteSpace: "nowrap", fontSize: 11.5 }}>{r}</td>
              {colLabels.map((_, ci) => {
                const v = data[ri][ci] || 0;
                const intensity = v / max;
                return (
                  <td key={ci} style={{ padding: 3 }}>
                    <div title={`${r} · ${colLabels[ci]}: ${v}`} style={{
                      width: 38, height: 30, borderRadius: 4,
                      background: intensity > 0
                        ? `color-mix(in oklch, ${accent} ${Math.max(10, intensity * 90)}%, transparent)`
                        : "var(--muted)",
                      color: intensity > 0.45 ? "white" : "var(--foreground)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11.5, fontWeight: intensity > 0 ? 600 : 400,
                      fontVariantNumeric: "tabular-nums",
                    }}>
                      {v > 0 ? v : ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Dashboard composition
// ─────────────────────────────────────────────────────────────

// Trend backfill (synthesized from demo rows + plausible history) so the line/bar charts
// look real even with sparse demo data. Numbers are deterministic.
const WEEK_TREND = [
  { label: "W14", value:  8 },
  { label: "W15", value: 12 },
  { label: "W16", value: 16 },
  { label: "W17", value: 13 },
  { label: "W18", value: 21 },
  { label: "W19", value: 19 },
  { label: "W20", value: 27 },
  { label: "W21", value: 26 },
];

const DashboardView = ({ rows, theme }) => {
  const total = rows.length;
  const sentimentCounts = useMc(() => ({
    Positive: rows.filter(r => r.sentiment === "Positive").length,
    Mixed:    rows.filter(r => r.sentiment === "Mixed").length,
    Negative: rows.filter(r => r.sentiment === "Negative").length,
  }), [rows]);
  const statusCounts = useMc(() => ({
    todo:     rows.filter(r => r.status === "todo").length,
    progress: rows.filter(r => r.status === "progress").length,
    waiting:  rows.filter(r => r.status === "waiting").length,
    done:     rows.filter(r => r.status === "done").length,
  }), [rows]);
  const priorityCounts = useMc(() => ({
    Urgent: rows.filter(r => r.priority === "Urgent").length,
    High:   rows.filter(r => r.priority === "High").length,
    Med:    rows.filter(r => r.priority === "Med").length,
    Low:    rows.filter(r => r.priority === "Low").length,
  }), [rows]);
  const themeCounts = useMc(() => {
    const m = {};
    rows.forEach(r => { m[r.theme] = (m[r.theme] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  // status × theme matrix
  const topThemes = themeCounts.slice(0, 5).map(([k]) => k);
  const statusKeys = ["todo", "progress", "waiting", "done"];
  const matrix = statusKeys.map(s =>
    topThemes.map(t => rows.filter(r => r.status === s && r.theme === t).length)
  );

  const pctPositive = total > 0 ? Math.round((sentimentCounts.Positive / total) * 100) : 0;
  const urgentCount = priorityCounts.Urgent;

  return (
    <div className="fb-scroll" style={{
      flex: 1, overflow: "auto", padding: 20,
      background: "var(--background)",
      display: "flex", flexDirection: "column", gap: 16,
    }}>
      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <KpiTile label="Total interviews" value={total} delta="+24 vs last month" deltaTone="up" hint="across all themes" />
        <KpiTile label="Positive sentiment" value={`${pctPositive}%`} delta={total > 0 ? `${sentimentCounts.Positive} of ${total}` : "—"} deltaTone="up" />
        <KpiTile label="Urgent issues" value={urgentCount} delta={urgentCount > 0 ? "needs triage" : "all clear"} deltaTone={urgentCount > 0 ? "down" : "up"} />
        <KpiTile label="This week" value="27" delta="+8 wow" deltaTone="up" hint="W21 · 2026" />
      </div>

      {/* Row 1: trend + sentiment */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <ChartCard title="Interviews per week" subtitle="Last 8 weeks · weekly buckets" accent="var(--chart-1)"
          action={
            <div style={{ display: "inline-flex", gap: 2, padding: 2, background: "var(--muted)", borderRadius: 5, fontSize: 11, color: "var(--muted-foreground)" }}>
              <span style={{ padding: "2px 7px", borderRadius: 3, background: "var(--surface-elevated)", color: "var(--foreground)", fontWeight: 600 }}>Bar</span>
              <span style={{ padding: "2px 7px" }}>Line</span>
            </div>
          }>
          <BarChart data={WEEK_TREND} accent="var(--chart-1)" yTicks={4} />
        </ChartCard>

        <ChartCard title="Sentiment breakdown" subtitle={`${total} rows · AI-inferred`} accent="var(--chart-2)">
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <Donut
              centerLabel="responses"
              centerValue={total}
              data={[
                { label: "Positive", value: sentimentCounts.Positive, color: "var(--status-done-fg)" },
                { label: "Mixed",    value: sentimentCounts.Mixed,    color: "var(--status-progress-fg)" },
                { label: "Negative", value: sentimentCounts.Negative, color: "var(--status-todo-fg)" },
              ]}
            />
          </div>
        </ChartCard>
      </div>

      {/* Row 2: themes + status×theme heatmap */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <ChartCard title="Top themes" subtitle={`${themeCounts.length} categories`} accent="var(--chart-3)">
          <HBar data={themeCounts.slice(0, 6).map(([k, v], i) => ({
            label: k, value: v,
            color: [
              "var(--chart-1)",
              "var(--chart-2)",
              "var(--chart-3)",
              "var(--chart-4)",
              "var(--chart-5)",
              "var(--muted-foreground)",
            ][i],
          }))} />
        </ChartCard>
        <ChartCard title="Status × Theme" subtitle="How each theme moves through triage" accent="var(--chart-4)">
          <Matrix
            rowLabels={statusKeys.map(s => STATUS[s].label)}
            colLabels={topThemes.map(t => t.length > 14 ? t.slice(0, 13) + "…" : t)}
            data={matrix}
            accent="var(--chart-1)"
          />
        </ChartCard>
      </div>

      {/* Row 3: status stacked + priority */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <ChartCard title="Status pipeline" subtitle="Where every interview currently sits" accent="var(--chart-1)">
          <StackedBar
            data={[
              { label: "미처리", value: statusCounts.todo,     color: "var(--status-todo-fg)" },
              { label: "진행중", value: statusCounts.progress, color: "var(--status-progress-fg)" },
              { label: "대기",   value: statusCounts.waiting,  color: "var(--status-waiting-fg)" },
              { label: "완료",   value: statusCounts.done,     color: "var(--status-done-fg)" },
            ]}
            height={32}
          />
        </ChartCard>

        <ChartCard title="Priority mix" subtitle="Triage now" accent="var(--chart-5)">
          <HBar
            showValue
            data={[
              { label: "Urgent", value: priorityCounts.Urgent, color: "var(--priority-urgent)" },
              { label: "High",   value: priorityCounts.High,   color: "var(--priority-high)" },
              { label: "Med",    value: priorityCounts.Med,    color: "var(--priority-med)" },
              { label: "Low",    value: priorityCounts.Low,    color: "var(--priority-low)" },
            ]}
          />
        </ChartCard>
      </div>

      {/* Row 4: trend line — net new pos sentiment */}
      <ChartCard title="Positive sentiment trend" subtitle="Weekly count of positive interviews · last 8 weeks" accent="var(--chart-2)">
        <LineArea
          accent="var(--chart-2)"
          data={[
            { label: "W14", value:  2 },
            { label: "W15", value:  4 },
            { label: "W16", value:  6 },
            { label: "W17", value:  5 },
            { label: "W18", value:  9 },
            { label: "W19", value:  8 },
            { label: "W20", value: 12 },
            { label: "W21", value: 14 },
          ]}
        />
      </ChartCard>

      <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
        <button style={{
          padding: "5px 11px", borderRadius: 6,
          border: "1px solid var(--border)", background: "var(--card)",
          color: "var(--muted-foreground)", fontSize: 12, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 5,
        }}>
          <IconSparkles size={12} style={{ color: "var(--primary)" }} />
          Ask AI to build a custom chart
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// TasksDashboard — workflow-centric (status pipeline + assignee load + due)
// ─────────────────────────────────────────────────────────────

const TasksDashboard = ({ rows }) => {
  const today = new Date().toISOString().slice(0, 10);
  const total = rows.length || 0;
  const doneCount  = rows.filter(r => r.status === "done").length;
  const overdue    = rows.filter(r => r.due && r.due < today && r.status !== "done").length;
  const urgent     = rows.filter(r => r.priority === "Urgent" && r.status !== "done").length;
  const donePct    = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const statusCounts = useMc(() => ({
    todo:     rows.filter(r => r.status === "todo").length,
    progress: rows.filter(r => r.status === "progress").length,
    waiting:  rows.filter(r => r.status === "waiting").length,
    done:     rows.filter(r => r.status === "done").length,
  }), [rows]);
  const priorityCounts = useMc(() => ({
    Urgent: rows.filter(r => r.priority === "Urgent").length,
    High:   rows.filter(r => r.priority === "High").length,
    Med:    rows.filter(r => r.priority === "Med").length,
    Low:    rows.filter(r => r.priority === "Low").length,
  }), [rows]);

  const assigneeCounts = useMc(() => {
    const m = {};
    rows.forEach(r => { const a = r.assignee || "unassigned"; m[a] = (m[a] || 0) + 1; });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [rows]);

  // Group due dates into buckets: overdue, today, next 7, later
  const dueBuckets = useMc(() => {
    const inWeek = new Date(Date.now() + 7 * 86400_000).toISOString().slice(0, 10);
    let a=0,b=0,c=0,d=0,n=0;
    rows.forEach(r => {
      if (r.status === "done") return;
      if (!r.due) { n++; return; }
      if (r.due < today) a++;
      else if (r.due === today) b++;
      else if (r.due <= inWeek) c++;
      else d++;
    });
    return [
      { label: "Overdue",   value: a, color: "var(--status-todo-fg)" },
      { label: "Today",     value: b, color: "var(--status-progress-fg)" },
      { label: "Next 7d",   value: c, color: "var(--chart-1)" },
      { label: "Later",     value: d, color: "var(--muted-foreground)" },
    ];
  }, [rows]);

  return (
    <div className="fb-scroll" style={{
      flex: 1, overflow: "auto", padding: 20,
      background: "var(--background)",
      display: "flex", flexDirection: "column", gap: 16,
    }}>
      {/* KPI row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <KpiTile label="Total tasks" value={total} hint={`${total - doneCount} open · ${doneCount} done`} />
        <KpiTile label="Completion" value={`${donePct}%`} delta={`${doneCount}/${total}`} deltaTone="up" />
        <KpiTile label="Overdue" value={overdue} delta={overdue > 0 ? "needs attention" : "none"} deltaTone={overdue > 0 ? "down" : "up"} />
        <KpiTile label="Urgent open" value={urgent} delta={urgent > 0 ? "triage now" : "clear"} deltaTone={urgent > 0 ? "warn" : "up"} />
      </div>

      {/* Row 1 — status + priority */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <ChartCard title="Status pipeline" subtitle="Every task by lane" accent="var(--chart-1)">
          <StackedBar
            data={[
              { label: "미처리", value: statusCounts.todo,     color: "var(--status-todo-fg)" },
              { label: "진행중", value: statusCounts.progress, color: "var(--status-progress-fg)" },
              { label: "대기",   value: statusCounts.waiting,  color: "var(--status-waiting-fg)" },
              { label: "완료",   value: statusCounts.done,     color: "var(--status-done-fg)" },
            ]}
            height={32}
          />
        </ChartCard>
        <ChartCard title="Priority mix" subtitle="Urgency distribution" accent="var(--chart-5)">
          <HBar
            data={[
              { label: "Urgent", value: priorityCounts.Urgent, color: "var(--priority-urgent)" },
              { label: "High",   value: priorityCounts.High,   color: "var(--priority-high)" },
              { label: "Med",    value: priorityCounts.Med,    color: "var(--priority-med)" },
              { label: "Low",    value: priorityCounts.Low,    color: "var(--priority-low)" },
            ]}
          />
        </ChartCard>
      </div>

      {/* Row 2 — assignee + due */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <ChartCard title="Assignee load" subtitle="Open tasks per teammate" accent="var(--chart-2)">
          <HBar
            data={assigneeCounts.map(([name, n], i) => ({
              label: name,
              value: n,
              color: ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"][i % 5],
            }))}
          />
        </ChartCard>
        <ChartCard title="Due date distribution" subtitle="Open tasks by deadline" accent="var(--chart-3)">
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {dueBuckets.map((b, i) => {
              const max = Math.max(...dueBuckets.map(x => x.value), 1);
              const pct = (b.value / max) * 100;
              return (
                <div key={i}>
                  <div style={{ display: "flex", alignItems: "baseline", marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, flex: 1 }}>{b.label}</span>
                    <span className="fb-tnum" style={{ fontSize: 11.5, color: "var(--muted-foreground)" }}>{b.value}</span>
                  </div>
                  <div style={{ height: 10, background: "var(--muted)", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ width: pct + "%", height: "100%", background: b.color, borderRadius: 5 }} />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// ThemesDashboard — dictionary insights
// ─────────────────────────────────────────────────────────────

const ThemesDashboard = ({ rows }) => {
  const total = rows.length;
  const aiCount = rows.filter(r => r.is_ai === true || r.is_ai === "true").length;
  const totalInterviews = rows.reduce((acc, r) => acc + (r.interviews || 0), 0);
  const top = rows.slice().sort((a, b) => (b.interviews || 0) - (a.interviews || 0))[0];

  const sentimentMap = useMc(() => {
    const m = { Positive: 0, Mixed: 0, Negative: 0 };
    rows.forEach(r => { const k = r.dominant_sentiment; if (m[k] != null) m[k] += r.interviews || 0; });
    return m;
  }, [rows]);

  return (
    <div className="fb-scroll" style={{
      flex: 1, overflow: "auto", padding: 20,
      background: "var(--background)",
      display: "flex", flexDirection: "column", gap: 16,
    }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <KpiTile label="Total themes" value={total} hint="across all interviews" />
        <KpiTile label="AI-managed" value={aiCount} delta={`${total - aiCount} manual`} />
        <KpiTile label="Interviews tagged" value={totalInterviews} hint="sum across themes" />
        <KpiTile label="Top theme" value={top?.interviews ?? 0} hint={top?.label || "—"} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        <ChartCard title="Interviews per theme" subtitle="How frequently each theme appears" accent="var(--chart-4)">
          <HBar
            data={rows.slice().sort((a, b) => (b.interviews || 0) - (a.interviews || 0)).map((r, i) => ({
              label: r.label,
              value: r.interviews || 0,
              color: ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"][i % 6],
            }))}
          />
        </ChartCard>
        <ChartCard title="Sentiment weighting" subtitle="By dominant tone (sum of interviews)" accent="var(--chart-2)">
          <div style={{ flex: 1, display: "flex", alignItems: "center" }}>
            <Donut
              centerLabel="interviews"
              centerValue={totalInterviews}
              data={[
                { label: "Positive", value: sentimentMap.Positive, color: "var(--status-done-fg)" },
                { label: "Mixed",    value: sentimentMap.Mixed,    color: "var(--status-progress-fg)" },
                { label: "Negative", value: sentimentMap.Negative, color: "var(--status-todo-fg)" },
              ]}
            />
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────
// Generic dashboard — aggregates any categorical/numeric column
// Works for any table that has at least one categorical or numeric column.
// ─────────────────────────────────────────────────────────────

const GenericDashboard = ({ rows, columns, tableLabel }) => {
  const categorical = columns.filter(c => ["status", "select", "priority"].includes(c.type));
  const numerics = columns.filter(c => c.type === "num");
  const dates = columns.filter(c => c.type === "date");

  if (categorical.length === 0 && numerics.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 40 }}>
        <div style={{
          maxWidth: 400, textAlign: "center", padding: 28,
          background: "var(--card)", border: "1px solid var(--border-subtle)", borderRadius: 10,
        }}>
          <IconChart size={32} style={{ color: "var(--muted-foreground)", margin: "0 auto 12px", display: "block" }} />
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>아직 집계할 컬럼이 없습니다</div>
          <div style={{ fontSize: 12.5, color: "var(--muted-foreground)", lineHeight: 1.5 }}>
            Dashboard는 카테고리(Select / Status / Priority) 또는 숫자 컬럼이 1개 이상 필요합니다. Display 메뉴에서 컬럼을 추가하세요.
          </div>
        </div>
      </div>
    );
  }

  const colorFor = (key, colName) => {
    if (colName === "status") {
      const m = { todo: "var(--status-todo-fg)", progress: "var(--status-progress-fg)", waiting: "var(--status-waiting-fg)", done: "var(--status-done-fg)" };
      return m[key] || "var(--chart-1)";
    }
    if (colName === "priority") {
      const m = { Urgent: "var(--chart-1)", High: "var(--chart-2)", Med: "var(--chart-4)", Low: "var(--muted-foreground)" };
      return m[key] || "var(--muted-foreground)";
    }
    if (colName === "sentiment") {
      const m = { Positive: "var(--status-done-fg)", Mixed: "var(--status-waiting-fg)", Negative: "var(--status-todo-fg)" };
      return m[key] || "var(--muted-foreground)";
    }
    // Hash to chart palette for any other categorical
    const palette = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
    let hash = 0;
    for (const ch of String(key)) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
    return palette[Math.abs(hash) % palette.length];
  };

  return (
    <div className="fb-scroll" style={{ flex: 1, overflowY: "auto", padding: 20, background: "var(--background)" }}>
      {/* KPI tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 22 }}>
        <KpiTile label="Total rows" value={rows.length} />
        {categorical.slice(0, 3).map(col => {
          const distinct = new Set(rows.map(r => r[col.name]).filter(v => v !== undefined && v !== null && v !== "")).size;
          return (
            <KpiTile key={col.name} label={`${col.label || col.name} · distinct`} value={distinct} />
          );
        })}
      </div>

      {/* Aggregations per categorical column */}
      {categorical.map(col => {
        const counts = {};
        rows.forEach(r => {
          const v = r[col.name];
          if (v === undefined || v === null || v === "") return;
          counts[v] = (counts[v] || 0) + 1;
        });
        const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const empty = rows.filter(r => {
          const v = r[col.name];
          return v === undefined || v === null || v === "";
        }).length;
        const max = Math.max(1, ...entries.map(([, n]) => n));
        return (
          <div key={col.name} style={{
            marginBottom: 20, padding: 16,
            background: "var(--card)", border: "1px solid var(--border-subtle)", borderRadius: 10,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 14 }}>
              <span style={{ fontSize: 13.5, fontWeight: 600 }}>By {col.label || col.name}</span>
              <span style={{ fontSize: 11, color: "var(--muted-foreground)" }} className="fb-tnum">
                {entries.length} {entries.length === 1 ? "value" : "values"}
              </span>
              {empty > 0 && (
                <span style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                  · {empty} empty
                </span>
              )}
            </div>
            {entries.length === 0 ? (
              <div style={{ color: "var(--muted-foreground)", fontSize: 12.5, padding: "16px 0", textAlign: "center" }}>
                이 컬럼에 데이터가 없습니다. 셀에 값을 입력해보세요.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {entries.map(([k, n]) => {
                  const pct = rows.length > 0 ? Math.round((n / rows.length) * 100) : 0;
                  const w = (n / max) * 100;
                  const c = colorFor(k, col.name);
                  return (
                    <div key={k} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: c, flexShrink: 0 }} />
                        <span style={{ flex: 1, color: "var(--foreground)" }}>{String(k)}</span>
                        <span className="fb-tnum" style={{ color: "var(--muted-foreground)", fontSize: 11 }}>{pct}%</span>
                        <span className="fb-tnum" style={{ color: "var(--foreground)", fontWeight: 600, minWidth: 28, textAlign: "right" }}>{n}</span>
                      </div>
                      <div style={{
                        height: 5, borderRadius: 999, overflow: "hidden",
                        background: "color-mix(in oklch, var(--border-subtle) 70%, transparent)",
                      }}>
                        <div style={{ width: w + "%", height: "100%", background: c, borderRadius: 999, transition: "width 240ms ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Numeric summaries */}
      {numerics.length > 0 && (
        <div style={{
          marginBottom: 20, padding: 16,
          background: "var(--card)", border: "1px solid var(--border-subtle)", borderRadius: 10,
        }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, marginBottom: 14 }}>Numeric summary</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
            {numerics.map(col => {
              const vals = rows.map(r => Number(r[col.name])).filter(v => !isNaN(v));
              const sum = vals.reduce((a, b) => a + b, 0);
              const avg = vals.length > 0 ? sum / vals.length : 0;
              const max = vals.length > 0 ? Math.max(...vals) : 0;
              const min = vals.length > 0 ? Math.min(...vals) : 0;
              return (
                <div key={col.name} style={{ padding: 10, background: "var(--muted)", borderRadius: 7 }}>
                  <div style={{ fontSize: 11.5, color: "var(--muted-foreground)", marginBottom: 4 }}>{col.label || col.name}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }} className="fb-tnum">{sum.toLocaleString()}</div>
                  <div style={{ fontSize: 11, color: "var(--muted-foreground)" }}>
                    avg <b style={{ color: "var(--foreground)" }} className="fb-tnum">{avg.toFixed(1)}</b>
                    {" · min "}<b style={{ color: "var(--foreground)" }} className="fb-tnum">{min}</b>
                    {" · max "}<b style={{ color: "var(--foreground)" }} className="fb-tnum">{max}</b>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

Object.assign(window, {
  ChartCard, KpiTile, BarChart, HBar, Donut, StackedBar, LineArea, Matrix,
  DashboardView, TasksDashboard, ThemesDashboard, WEEK_TREND,
  GenericDashboard,
});
