import React, { useEffect, useMemo, useState } from "react";

export default function Sidebar({ groups, onAdd }) {
  const BASE = import.meta.env.BASE_URL;

  const resolveSrc = (src) => {
    if (!src) return src;
    // Leave absolute URLs alone
    if (/^https?:\/\//i.test(src)) return src;
    // Strip leading slash so BASE_URL can prefix correctly on GitHub Pages
    const clean = String(src).replace(/^\/+/, "");
    return `${BASE}${clean}`;
  };

  const safeGroups = Array.isArray(groups) ? groups : [];
  const firstId = safeGroups[0]?.id ?? "";

  const [activeGroupId, setActiveGroupId] = useState(firstId);
  const [q, setQ] = useState("");

  // If groups load async or change, ensure activeGroupId stays valid.
  useEffect(() => {
    if (!safeGroups.length) return;
    const exists = safeGroups.some((g) => g.id === activeGroupId);
    if (!exists) setActiveGroupId(safeGroups[0].id);
  }, [safeGroups, activeGroupId]);

  const activeGroup = useMemo(() => {
    return safeGroups.find((g) => g.id === activeGroupId) || safeGroups[0] || null;
  }, [safeGroups, activeGroupId]);

  const filteredItems = useMemo(() => {
    const items = activeGroup?.items ?? [];
    const query = q.trim().toLowerCase();
    if (!query) return items;

    return items.filter((it) => {
      const hay = `${it.label ?? ""} ${(it.tags || []).join(" ")}`.toLowerCase();
      return hay.includes(query);
    });
  }, [activeGroup, q]);

  return (
    <aside className="sidebar">
      <div className="sidebarHeader">
        <div className="brand">90s Collage Maker</div>

        <select
          className="select"
          value={activeGroupId}
          onChange={(e) => {
            setActiveGroupId(e.target.value);
            setQ(""); // prevent old search from carrying over
          }}
        >
          {safeGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>

        <input
          className="search"
          placeholder="Search stickers…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        <div className="hint">Click to add • Drag to canvas</div>
      </div>

      {/* key forces a full remount when switching categories */}
      <div className="thumbGrid" key={activeGroupId}>
        {filteredItems.map((it) => (
          <div
            key={`${activeGroupId}:${it.id}:${it.src}`} // unique across categories
            className="thumb"
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", resolveSrc(it.src));
            }}
            onDoubleClick={() => onAdd(resolveSrc(it.src))}
            onClick={() => onAdd(resolveSrc(it.src))}
            title={it.label}
          >
            <img src={resolveSrc(it.src)} alt={it.label ?? it.id} loading="lazy" />
            <div className="thumbLabel">{it.label ?? it.id}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}
