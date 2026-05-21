/* @jsx React.createElement */
// FlowBase — Coda-style rich field types: Avatar, Reaction, Button, enhanced Linked card.

const COLOR_HASH = ["#5e6ad2", "#26b5ce", "#f2994a", "#e5484d", "#45d483", "#7c3aed", "#0ea5e9", "#f59e0b"];
function hashColor(s) {
  const h = (s || "").split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return COLOR_HASH[h % COLOR_HASH.length];
}

const AvatarCell = ({ name, size = 22, subtitle }) => {
  const initial = (name || "?").charAt(0).toUpperCase();
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
      <span style={{
        width: size, height: size, borderRadius: "50%",
        background: hashColor(name), color: "white",
        fontSize: Math.floor(size * 0.48), fontWeight: 700,
        display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>{initial}</span>
      <span style={{ display: "inline-flex", flexDirection: "column", lineHeight: 1.25 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{name}</span>
        {subtitle && <span style={{ fontSize: 10.5, color: "var(--muted-foreground)" }}>{subtitle}</span>}
      </span>
    </span>
  );
};

const ReactionCell = ({ value, onChange }) => {
  const v = value || { positive: 0, mixed: 0, negative: 0 };
  const items = [
    { emoji: "😊", key: "positive", color: "var(--status-done-fg)",     bg: "var(--status-done-bg)" },
    { emoji: "😐", key: "mixed",    color: "var(--status-progress-fg)", bg: "var(--status-progress-bg)" },
    { emoji: "😞", key: "negative", color: "var(--status-todo-fg)",     bg: "var(--status-todo-bg)" },
  ];
  return (
    <span style={{ display: "inline-flex", gap: 3 }}>
      {items.map(r => {
        const n = v[r.key] || 0;
        const on = n > 0;
        return (
          <button key={r.key} onClick={(e) => {
            e.stopPropagation();
            onChange?.({ ...v, [r.key]: n + 1 });
          }} style={{
            display: "inline-flex", alignItems: "center", gap: 3,
            padding: "1px 7px", borderRadius: 11,
            background: on ? r.bg : "var(--muted)",
            color: on ? r.color : "var(--muted-foreground)",
            border: "none", fontSize: 11.5, cursor: "pointer",
          }}>
            <span style={{ fontSize: 11 }}>{r.emoji}</span>
            <span className="fb-tnum" style={{ fontWeight: 600 }}>{n}</span>
          </button>
        );
      })}
    </span>
  );
};

const ButtonCell = ({ label, icon, onClick, tone = "ai", disabled }) => {
  const toneMap = {
    default: { bg: "var(--card)",    fg: "var(--foreground)",         border: "var(--border)" },
    primary: { bg: "var(--primary)", fg: "var(--primary-foreground)", border: "var(--primary)" },
    ai:      { bg: "color-mix(in oklch, var(--primary) 10%, var(--card))", fg: "var(--primary)", border: "color-mix(in oklch, var(--primary) 35%, var(--border))" },
  }[tone];
  return (
    <button disabled={disabled} onClick={(e) => { e.stopPropagation(); onClick?.(); }} style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "3px 10px", borderRadius: 5,
      background: toneMap.bg, border: "1px solid " + toneMap.border,
      color: toneMap.fg, fontSize: 11.5, fontWeight: 500,
      cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.5 : 1,
    }}>
      {icon}
      <span>{label}</span>
    </button>
  );
};

const LinkedCardCell = ({ value, target }) => {
  if (!value) return <span style={{ color: "var(--muted-foreground)" }}>—</span>;
  let label = value, detail = null, accent = "var(--chart-3)";
  if (target === "companies" && window.resolveCompany) {
    const c = window.resolveCompany(value);
    if (c) { label = c.name; detail = c.tier; accent = "var(--chart-3)"; }
  } else if (target === "people" && window.resolvePerson) {
    const p = window.resolvePerson(value);
    if (p) { label = p.name; detail = p.role; accent = "var(--chart-2)"; }
  } else if (target === "interviews" && window.resolveInterview) {
    const i = window.resolveInterview(value);
    if (i) { label = i.id; detail = i.name; accent = "var(--chart-1)"; }
  }
  const initial = (label || "?").charAt(0).toUpperCase();
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "2px 7px 2px 3px", borderRadius: 5,
      background: "var(--muted)", fontSize: 12.5, fontWeight: 500,
    }}>
      <span style={{
        width: 16, height: 16, borderRadius: 3,
        background: accent, color: "white",
        fontSize: 9, fontWeight: 700,
        display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
      }}>{initial}</span>
      <span>{label}</span>
      {detail && <span style={{ color: "var(--muted-foreground)", fontSize: 11, fontWeight: 400 }}>· {detail}</span>}
    </span>
  );
};

Object.assign(window, { AvatarCell, ReactionCell, ButtonCell, LinkedCardCell, hashColor });
