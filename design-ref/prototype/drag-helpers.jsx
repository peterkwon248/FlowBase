/* @jsx React.createElement */
// FlowBase — Drag handle + drop indicator primitives.
//   Native HTML5 drag/drop. Vertical (chart cards) and horizontal (columns).

const { useState: useDhS, useRef: useDhR, useEffect: useDhE } = React;

// ─────────────────────────────────────────────────────────────
// DragHandle — 6-dot grip icon
// ─────────────────────────────────────────────────────────────

const DragHandle = ({ size = 12, color }) => (
  <svg width={size} height={size + 2} viewBox="0 0 12 14" fill="currentColor" style={{ color: color || "var(--muted-foreground)" }}>
    <circle cx="3" cy="2.5" r="1.2" />
    <circle cx="3" cy="7" r="1.2" />
    <circle cx="3" cy="11.5" r="1.2" />
    <circle cx="9" cy="2.5" r="1.2" />
    <circle cx="9" cy="7" r="1.2" />
    <circle cx="9" cy="11.5" r="1.2" />
  </svg>
);

// ─────────────────────────────────────────────────────────────
// useDragReorder — shared logic for both vertical & horizontal lists
//
//   items: array of { id }-shaped objects
//   orientation: "vertical" | "horizontal"
//   onMove(id, newIndex): commit reorder
//
//   Returns: { dragState, getItemProps(id, index) }
//
//   getItemProps returns event handlers + a render-key for the drop indicator.
// ─────────────────────────────────────────────────────────────

function useDragReorder(items, onMove, orientation = "vertical") {
  const [dragId, setDragId] = useDhS(null);
  const [dropTarget, setDropTarget] = useDhS(null);  // { id, side: "before" | "after" }

  const onDragStart = (id) => (e) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", id);
    setDragId(id);
  };
  const onDragEnd = () => {
    setDragId(null);
    setDropTarget(null);
  };
  const onDragOver = (id) => (e) => {
    if (!dragId || dragId === id) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = e.currentTarget.getBoundingClientRect();
    let side;
    if (orientation === "vertical") {
      side = (e.clientY - rect.top) < rect.height / 2 ? "before" : "after";
    } else {
      side = (e.clientX - rect.left) < rect.width / 2 ? "before" : "after";
    }
    if (!dropTarget || dropTarget.id !== id || dropTarget.side !== side) {
      setDropTarget({ id, side });
    }
  };
  const onDragLeave = (e) => {
    // Only clear if leaving the entire item (not entering a child)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      // soft no-op — actual clear happens on onDrop or dragEnd
    }
  };
  const onDrop = (id) => (e) => {
    e.preventDefault();
    if (!dragId || dragId === id) {
      setDragId(null);
      setDropTarget(null);
      return;
    }
    const fromIdx = items.findIndex(it => it.id === dragId);
    const toIdx = items.findIndex(it => it.id === id);
    if (fromIdx === -1 || toIdx === -1) {
      setDragId(null);
      setDropTarget(null);
      return;
    }
    let newIdx = toIdx;
    const side = dropTarget?.side || "after";
    if (side === "after") newIdx = toIdx + 1;
    // If moving forward, subtract 1 because removing source shifts indices
    if (fromIdx < newIdx) newIdx -= 1;
    if (newIdx !== fromIdx) {
      onMove(dragId, newIdx);
    }
    setDragId(null);
    setDropTarget(null);
  };

  const getItemProps = (id) => ({
    "data-drag-id": id,
    "data-dragging": dragId === id ? "true" : undefined,
    onDragOver: onDragOver(id),
    onDragLeave,
    onDrop: onDrop(id),
  });

  const getHandleProps = (id) => ({
    draggable: true,
    onDragStart: onDragStart(id),
    onDragEnd,
    style: { cursor: "grab" },
  });

  const isDropTarget = (id, side) => dropTarget?.id === id && dropTarget?.side === side;
  const isDragging = (id) => dragId === id;

  return { dragId, dropTarget, getItemProps, getHandleProps, isDropTarget, isDragging };
}

// ─────────────────────────────────────────────────────────────
// DropIndicator — render between items
// ─────────────────────────────────────────────────────────────

const DropIndicatorH = ({ active }) => (
  <div style={{
    height: 2, margin: "0 0",
    background: active ? "var(--primary)" : "transparent",
    borderRadius: 1,
    transition: "background 100ms ease",
    pointerEvents: "none",
  }} />
);

const DropIndicatorV = ({ active, height = 24 }) => (
  <div style={{
    position: "absolute", top: 4, bottom: 4,
    width: 2,
    background: active ? "var(--primary)" : "transparent",
    borderRadius: 1, pointerEvents: "none",
    transition: "background 100ms ease",
  }} />
);

Object.assign(window, {
  DragHandle, useDragReorder, DropIndicatorH, DropIndicatorV,
});
