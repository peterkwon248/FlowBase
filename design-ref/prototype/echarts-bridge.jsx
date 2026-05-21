/* @jsx React.createElement */
// FlowBase — ECharts integration for dashboard charts.
//   Replaces hand-rolled SVG with ECharts. Same chart spec API.

const { useState: useEcS, useEffect: useEcE, useRef: useEcR, useMemo: useEcM } = React;

// Detect theme so we can match colors
function useFbTheme() {
  const [theme, setTheme] = useEcS(document.body.getAttribute("data-theme") || "dark");
  useEcE(() => {
    const obs = new MutationObserver(() => {
      setTheme(document.body.getAttribute("data-theme") || "dark");
    });
    obs.observe(document.body, { attributes: true, attributeFilter: ["data-theme", "class"] });
    return () => obs.disconnect();
  }, []);
  return theme;
}

// Read CSS variable value
function readVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function fbPalette() {
  // Resolve oklch CSS vars to RGB equivalents via a temp DOM measurement
  const tmp = document.createElement("div");
  tmp.style.display = "none";
  document.body.appendChild(tmp);
  const colors = [];
  for (let i = 1; i <= 5; i++) {
    tmp.style.color = `var(--chart-${i})`;
    colors.push(getComputedStyle(tmp).color);
  }
  document.body.removeChild(tmp);
  return colors;
}

function fbTokens() {
  const tmp = document.createElement("div");
  tmp.style.display = "none";
  document.body.appendChild(tmp);
  const resolve = (cssVar) => {
    tmp.style.color = `var(${cssVar})`;
    return getComputedStyle(tmp).color;
  };
  const fg = resolve("--foreground");
  const muted = resolve("--muted-foreground");
  const border = resolve("--border-subtle");
  const card = resolve("--card");
  document.body.removeChild(tmp);
  return { fg, muted, border, card };
}

// ─────────────────────────────────────────────────────────────
// EChart React wrapper
// ─────────────────────────────────────────────────────────────

const ECharts = ({ option, height = 240, onEvents }) => {
  const containerRef = useEcR(null);
  const instanceRef = useEcR(null);
  const theme = useFbTheme();

  useEcE(() => {
    if (!containerRef.current || !window.echarts) return;
    const inst = window.echarts.init(containerRef.current, null, { renderer: "canvas" });
    instanceRef.current = inst;
    const ro = new ResizeObserver(() => inst.resize());
    ro.observe(containerRef.current);
    return () => {
      ro.disconnect();
      inst.dispose();
      instanceRef.current = null;
    };
  }, []);

  useEcE(() => {
    const inst = instanceRef.current;
    if (!inst) return;
    inst.setOption(option, true);
    // Always resize when option changes (in case dimensions shifted)
    inst.resize();
  }, [option, theme]);

  // Attach event listeners
  useEcE(() => {
    const inst = instanceRef.current;
    if (!inst || !onEvents) return;
    Object.entries(onEvents).forEach(([eventName, handler]) => inst.on(eventName, handler));
    return () => {
      if (instanceRef.current && onEvents) Object.keys(onEvents).forEach(eventName => instanceRef.current.off(eventName));
    };
  }, [onEvents]);

  return <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: 100 }} />;
};

// ─────────────────────────────────────────────────────────────
// Chart-spec → ECharts option mappers
// ─────────────────────────────────────────────────────────────

function ecBaseOption(theme) {
  const tokens = fbTokens();
  return {
    backgroundColor: "transparent",
    textStyle: { fontFamily: "var(--font-sans)", color: tokens.fg },
    tooltip: {
      trigger: "item",
      backgroundColor: tokens.card,
      borderColor: tokens.border,
      textStyle: { color: tokens.fg, fontFamily: "var(--font-sans)", fontSize: 12 },
      extraCssText: "box-shadow: 0 4px 16px rgba(0,0,0,0.12); border-radius: 6px;",
    },
    legend: {
      bottom: 0,
      textStyle: { color: tokens.muted, fontSize: 11 },
      icon: "circle",
      itemWidth: 8,
      itemHeight: 8,
    },
    color: fbPalette(),
    grid: { left: 8, right: 8, top: 8, bottom: 28, containLabel: true },
  };
}

// Formatter helper — applies number format from chart spec
function fbFormat(n, chart) {
  const fmt = chart.numberFormat || "raw";
  const d = chart.decimals ?? 0;
  if (typeof n !== "number" || isNaN(n)) return String(n);
  if (fmt === "percent") return (n).toFixed(d) + "%";
  if (fmt === "compact") {
    if (Math.abs(n) >= 1e9) return (n / 1e9).toFixed(d || 1) + "B";
    if (Math.abs(n) >= 1e6) return (n / 1e6).toFixed(d || 1) + "M";
    if (Math.abs(n) >= 1e3) return (n / 1e3).toFixed(d || 1) + "k";
    return n.toFixed(d);
  }
  if (fmt === "currency") return "₩" + n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  return n.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
}

function sortEntries(entries, order) {
  if (order === "count-asc")  return [...entries].sort((a, b) => a[1] - b[1]);
  if (order === "name-asc")   return [...entries].sort((a, b) => String(a[0]).localeCompare(String(b[0])));
  if (order === "name-desc")  return [...entries].sort((a, b) => String(b[0]).localeCompare(String(a[0])));
  return [...entries].sort((a, b) => b[1] - a[1]); // count-desc default
}

function ecBarOption(chart, rows) {
  const counts = {};
  rows.forEach(r => {
    const v = r[chart.dim];
    if (v === undefined || v === null || v === "") return;
    counts[v] = (counts[v] || 0) + 1;
  });
  const entries = sortEntries(Object.entries(counts), chart.sortOrder);
  const tokens = fbTokens();
  return {
    ...ecBaseOption(),
    tooltip: { ...ecBaseOption().tooltip, trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: (v) => fbFormat(v, chart) },
    legend: { show: false },
    xAxis: {
      type: "category",
      data: entries.map(([k]) => String(k)),
      axisLabel: { color: tokens.muted, fontSize: 11, rotate: entries.length > 6 ? 20 : 0 },
      axisLine: { lineStyle: { color: tokens.border } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: tokens.muted, fontSize: 11, formatter: (v) => fbFormat(v, chart) },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: tokens.border, type: "dashed" } },
    },
    series: [{
      type: "bar",
      data: entries.map(([, n]) => n),
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      barMaxWidth: 36,
      label: chart.showLabels !== false ? { show: true, position: "top", color: tokens.fg, fontSize: 10, formatter: (p) => fbFormat(p.value, chart) } : { show: false },
      emphasis: {
        focus: "self",
        itemStyle: { shadowBlur: 8, shadowColor: "color-mix(in oklch, var(--primary) 30%, transparent)" },
      },
    }],
  };
}

function ecDonutOption(chart, rows) {
  const counts = {};
  rows.forEach(r => {
    const v = r[chart.dim];
    if (v === undefined || v === null || v === "") return;
    counts[v] = (counts[v] || 0) + 1;
  });
  const entries = sortEntries(Object.entries(counts), chart.sortOrder);
  const total = entries.reduce((a, [, n]) => a + n, 0);
  const tokens = fbTokens();
  return {
    ...ecBaseOption(),
    legend: {
      orient: "vertical",
      right: 4,
      top: "middle",
      textStyle: { color: tokens.muted, fontSize: 11 },
      icon: "circle",
      itemWidth: 7,
      itemHeight: 7,
      itemGap: 6,
      formatter: (name) => {
        const e = entries.find(([k]) => String(k) === name);
        if (!e) return name;
        const pct = total > 0 ? Math.round((e[1] / total) * 100) : 0;
        return `${name}  ${pct}%`;
      },
    },
    tooltip: {
      ...ecBaseOption().tooltip,
      formatter: (p) => {
        const pct = total > 0 ? ((p.value / total) * 100).toFixed(1) : 0;
        return `<b>${p.name}</b><br/>${p.value} · ${pct}%`;
      },
    },
    grid: undefined,
    series: [{
      type: "pie",
      radius: ["52%", "76%"],
      center: ["38%", "50%"],
      avoidLabelOverlap: false,
      itemStyle: { borderColor: tokens.card, borderWidth: 2 },
      label: { show: false },
      emphasis: { scale: true, scaleSize: 4, label: { show: false } },
      data: entries.map(([k, n]) => ({ name: String(k), value: n })),
    }],
    graphic: [{
      type: "text",
      left: "calc(38% - 18px)",
      top: "calc(50% - 14px)",
      style: { text: String(total), fontSize: 22, fontWeight: 700, fill: tokens.fg, fontFamily: "var(--font-sans)" },
    }, {
      type: "text",
      left: "calc(38% - 14px)",
      top: "calc(50% + 10px)",
      style: { text: "total", fontSize: 10, fill: tokens.muted, fontFamily: "var(--font-sans)" },
    }],
  };
}

function ecLineOption(chart, rows) {
  const granularity = chart.granularity || "week";
  const buckets = {};
  rows.forEach(r => {
    const v = r[chart.dateCol];
    if (!v) return;
    const d = new Date(v);
    if (isNaN(d.getTime())) return;
    let key;
    if (granularity === "day") key = d.toISOString().slice(0, 10);
    else if (granularity === "week") {
      const day = (d.getDay() + 6) % 7;
      const monday = new Date(d.getTime() - day * 86400000);
      key = monday.toISOString().slice(0, 10);
    } else if (granularity === "month") key = d.toISOString().slice(0, 7);
    else key = d.toISOString().slice(0, 10);
    buckets[key] = (buckets[key] || 0) + 1;
  });
  const entries = Object.entries(buckets).sort(([a], [b]) => a.localeCompare(b));
  const tokens = fbTokens();
  return {
    ...ecBaseOption(),
    tooltip: { ...ecBaseOption().tooltip, trigger: "axis", valueFormatter: (v) => fbFormat(v, chart) },
    legend: { show: false },
    xAxis: {
      type: "category",
      data: entries.map(([k]) => granularity === "month" ? k : k.slice(5)),
      axisLabel: { color: tokens.muted, fontSize: 10, fontFamily: "var(--font-mono)" },
      axisLine: { lineStyle: { color: tokens.border } },
      axisTick: { show: false },
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      axisLabel: { color: tokens.muted, fontSize: 11, formatter: (v) => fbFormat(v, chart) },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: tokens.border, type: "dashed" } },
    },
    series: [{
      type: "line",
      data: entries.map(([, n]) => n),
      smooth: true,
      symbol: "circle",
      symbolSize: 6,
      lineStyle: { width: 2.5 },
      areaStyle: { opacity: 0.18 },
      label: chart.showLabels === true ? { show: true, position: "top", color: tokens.fg, fontSize: 10, formatter: (p) => fbFormat(p.value, chart) } : { show: false },
    }],
  };
}

function ecHeatmapOption(chart, rows) {
  // chart: { type:"heatmap", dimX, dimY }
  const counts = {};
  const xSet = new Set();
  const ySet = new Set();
  rows.forEach(r => {
    const x = r[chart.dimX], y = r[chart.dimY];
    if (x === undefined || x === null || x === "") return;
    if (y === undefined || y === null || y === "") return;
    xSet.add(String(x));
    ySet.add(String(y));
    const key = String(x) + "|" + String(y);
    counts[key] = (counts[key] || 0) + 1;
  });
  const xCats = [...xSet];
  const yCats = [...ySet];
  const data = [];
  let max = 0;
  xCats.forEach((x, xi) => {
    yCats.forEach((y, yi) => {
      const n = counts[x + "|" + y] || 0;
      data.push([xi, yi, n]);
      if (n > max) max = n;
    });
  });
  const tokens = fbTokens();
  return {
    ...ecBaseOption(),
    tooltip: {
      ...ecBaseOption().tooltip,
      formatter: (p) => `<b>${xCats[p.data[0]]}</b> × <b>${yCats[p.data[1]]}</b><br/>${p.data[2]} rows`,
    },
    legend: { show: false },
    grid: { left: 90, right: 24, top: 18, bottom: 40, containLabel: true },
    xAxis: {
      type: "category",
      data: xCats,
      axisLabel: { color: tokens.muted, fontSize: 11, rotate: xCats.length > 5 ? 20 : 0 },
      axisLine: { lineStyle: { color: tokens.border } },
      splitArea: { show: false },
    },
    yAxis: {
      type: "category",
      data: yCats,
      axisLabel: { color: tokens.muted, fontSize: 11 },
      axisLine: { lineStyle: { color: tokens.border } },
      splitArea: { show: false },
    },
    visualMap: {
      min: 0, max: Math.max(1, max),
      orient: "horizontal",
      left: "center", bottom: 6,
      itemWidth: 12, itemHeight: 10,
      textStyle: { color: tokens.muted, fontSize: 10 },
      inRange: { color: ["color-mix(in oklch, var(--primary) 8%, var(--card))", readVar("--primary") || "#5b6fd6"] },
      calculable: true,
      show: true,
      seriesIndex: 0,
      formatter: (v) => fbFormat(v, chart),
    },
    series: [{
      type: "heatmap",
      data,
      label: chart.showLabels !== false ? { show: true, color: tokens.fg, fontSize: 11, fontWeight: 500, formatter: (p) => fbFormat(p.data[2], chart) } : { show: false },
      itemStyle: { borderColor: tokens.card, borderWidth: 1, borderRadius: 3 },
      emphasis: { itemStyle: { shadowBlur: 6, shadowColor: "color-mix(in oklch, var(--primary) 30%, transparent)" } },
    }],
  };
}

function ecStackedBarOption(chart, rows) {
  // chart: { type:"stacked-bar", dim, stackBy }
  // Group by dim, stack by stackBy
  const counts = {};
  const stackSet = new Set();
  rows.forEach(r => {
    const d = r[chart.dim], s = r[chart.stackBy];
    if (d === undefined || d === null || d === "") return;
    if (s === undefined || s === null || s === "") return;
    stackSet.add(String(s));
    counts[d] = counts[d] || {};
    counts[d][s] = (counts[d][s] || 0) + 1;
  });
  // Sort dim keys per sortOrder using total per dim
  const dimTotals = Object.entries(counts).map(([k, m]) => [k, Object.values(m).reduce((a, b) => a + b, 0)]);
  const sortedDims = sortEntries(dimTotals, chart.sortOrder).map(([k]) => k);
  const stacks = [...stackSet];
  const tokens = fbTokens();
  return {
    ...ecBaseOption(),
    tooltip: { ...ecBaseOption().tooltip, trigger: "axis", axisPointer: { type: "shadow" }, valueFormatter: (v) => fbFormat(v, chart) },
    legend: { bottom: 0, textStyle: { color: tokens.muted, fontSize: 11 }, icon: "circle", itemWidth: 8 },
    xAxis: {
      type: "category",
      data: sortedDims,
      axisLabel: { color: tokens.muted, fontSize: 11 },
      axisLine: { lineStyle: { color: tokens.border } },
      axisTick: { show: false },
    },
    yAxis: {
      type: "value",
      axisLabel: { color: tokens.muted, fontSize: 11, formatter: (v) => fbFormat(v, chart) },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: tokens.border, type: "dashed" } },
    },
    series: stacks.map(s => ({
      name: s, type: "bar", stack: "total",
      data: sortedDims.map(c => counts[c][s] || 0),
      itemStyle: { borderRadius: [2, 2, 0, 0] },
      barMaxWidth: 36,
      label: chart.showLabels === true ? { show: true, position: "inside", color: "#fff", fontSize: 10, formatter: (p) => p.value ? fbFormat(p.value, chart) : "" } : { show: false },
    })),
  };
}

function ecAreaOption(chart, rows) {
  // chart: { type:"area", dateCol, granularity, splitBy }
  const granularity = chart.granularity || "week";
  const series = {}; // splitValue → { date: count }
  rows.forEach(r => {
    const v = r[chart.dateCol];
    if (!v) return;
    const d = new Date(v);
    if (isNaN(d.getTime())) return;
    let key;
    if (granularity === "day") key = d.toISOString().slice(0, 10);
    else if (granularity === "month") key = d.toISOString().slice(0, 7);
    else {
      const day = (d.getDay() + 6) % 7;
      key = new Date(d.getTime() - day * 86400000).toISOString().slice(0, 10);
    }
    const splitVal = chart.splitBy ? (r[chart.splitBy] || "—") : "Total";
    if (!series[splitVal]) series[splitVal] = {};
    series[splitVal][key] = (series[splitVal][key] || 0) + 1;
  });
  const allDates = new Set();
  Object.values(series).forEach(s => Object.keys(s).forEach(k => allDates.add(k)));
  const xCats = [...allDates].sort();
  const tokens = fbTokens();
  return {
    ...ecBaseOption(),
    tooltip: { ...ecBaseOption().tooltip, trigger: "axis" },
    legend: { bottom: 0, textStyle: { color: tokens.muted, fontSize: 11 }, icon: "circle", itemWidth: 8 },
    xAxis: {
      type: "category",
      data: xCats.map(k => granularity === "month" ? k : k.slice(5)),
      axisLabel: { color: tokens.muted, fontSize: 10, fontFamily: "var(--font-mono)" },
      axisLine: { lineStyle: { color: tokens.border } },
      axisTick: { show: false },
      boundaryGap: false,
    },
    yAxis: {
      type: "value",
      axisLabel: { color: tokens.muted, fontSize: 11, formatter: (v) => fbFormat(v, chart) },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: tokens.border, type: "dashed" } },
    },
    series: Object.keys(series).map(name => ({
      name, type: "line",
      data: xCats.map(d => series[name][d] || 0),
      smooth: true,
      symbol: "none",
      stack: chart.splitBy ? "total" : undefined,
      areaStyle: { opacity: 0.5 },
      lineStyle: { width: 1.5 },
      label: chart.showLabels === true ? { show: true, color: tokens.fg, fontSize: 10, formatter: (p) => p.value ? fbFormat(p.value, chart) : "" } : { show: false },
    })),
    tooltip: { ...ecBaseOption().tooltip, trigger: "axis", valueFormatter: (v) => fbFormat(v, chart) },
  };
}

// ─────────────────────────────────────────────────────────────
// Dispatcher
// ─────────────────────────────────────────────────────────────

function chartToECOption(chart, rows) {
  if (chart.type === "bar")          return ecBarOption(chart, rows);
  if (chart.type === "donut")        return ecDonutOption(chart, rows);
  if (chart.type === "line")         return ecLineOption(chart, rows);
  if (chart.type === "heatmap")      return ecHeatmapOption(chart, rows);
  if (chart.type === "stacked-bar")  return ecStackedBarOption(chart, rows);
  if (chart.type === "area")         return ecAreaOption(chart, rows);
  return null;
}

Object.assign(window, {
  ECharts,
  chartToECOption,
  useFbTheme,
  fbFormat,
  sortEntries,
});
