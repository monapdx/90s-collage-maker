# scaffold-90s-collage-maker.ps1
# Creates a complete 90s-collage-maker project (Vite + React + Fabric) + manifest generator.
# Assumes you already restored your assets into public/assets/<category>/... (script creates folders either way).

$ProjectName = "90s-collage-maker"

New-Item -ItemType Directory -Force -Path $ProjectName | Out-Null
Set-Location $ProjectName

# ----------------------------
# Helpers
# ----------------------------
function Write-File($path, $content) {
  $dir = Split-Path $path -Parent
  if ($dir -and !(Test-Path $dir)) { New-Item -ItemType Directory -Force -Path $dir | Out-Null }
  Set-Content -Path $path -Value $content -Encoding UTF8
}

# ----------------------------
# Create folders
# ----------------------------
$dirs = @(
  "public",
  "public/assets",
  "scripts",
  "src",
  "src/components",
  "src/lib"
)
$dirs | ForEach-Object { New-Item -ItemType Directory -Force -Path $_ | Out-Null }

# Category folders
$cats = @("beauty","boy-bands","boys-toys","cartoons","disney","electronics","fashion","girls-toys","movies","music","patterns","tv-shows")
$cats | ForEach-Object { New-Item -ItemType Directory -Force -Path ("public/assets/" + $_) | Out-Null }

# ----------------------------
# Root files
# ----------------------------
Write-File "package.json" @'
{
  "name": "90s-collage-maker",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "gen:manifest": "node scripts/generate-manifest.mjs"
  },
  "dependencies": {
    "fabric": "^6.5.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0"
  }
}
'@

Write-File "vite.config.js" @'
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()]
});
'@

Write-File "index.html" @'
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>90s Collage Maker</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
'@

Write-File ".gitignore" @'
node_modules
dist
.DS_Store
.env
'@

# ----------------------------
# Public
# ----------------------------
Write-File "public/manifest.json" @'
[]
'@

# ----------------------------
# Manifest generator
# ----------------------------
Write-File "scripts/generate-manifest.mjs" @'
import fs from "node:fs";
import path from "node:path";

const PROJECT_ROOT = process.cwd();
const ASSETS_DIR = path.join(PROJECT_ROOT, "public", "assets");
const OUT_FILE = path.join(PROJECT_ROOT, "public", "manifest.json");

const ALLOWED_EXTS = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"]);

function prettifySlug(slug) {
  const upperKeep = new Set(["tv", "vhs", "dvd", "cd", "pc", "ps", "ps1", "ps2", "n64"]);
  const spaced = slug.replace(/[-_]+/g, " ").trim();
  const words = spaced.split(/\s+/).map((w) => {
    const lower = w.toLowerCase();
    if (upperKeep.has(lower)) return lower.toUpperCase();
    return w.charAt(0).toUpperCase() + w.slice(1);
  });
  return words.join(" ");
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-+/g, "-");
}

function tokensFromFilename(filenameNoExt) {
  return slugify(filenameNoExt)
    .split("-")
    .filter(Boolean)
    .filter((t) => t.length > 1);
}

function readDirSafe(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

function main() {
  if (!fs.existsSync(ASSETS_DIR)) {
    console.error(`❌ Assets folder not found: ${ASSETS_DIR}`);
    process.exit(1);
  }

  const categoryDirs = readDirSafe(ASSETS_DIR)
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  const manifest = [];

  for (const category of categoryDirs) {
    const categoryPath = path.join(ASSETS_DIR, category);

    const files = readDirSafe(categoryPath)
      .filter((d) => d.isFile())
      .map((d) => d.name)
      .filter((name) => ALLOWED_EXTS.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

    const items = files.map((filename) => {
      const ext = path.extname(filename);
      const base = filename.slice(0, -ext.length);

      const id = `${slugify(category)}-${slugify(base)}`;
      const label = prettifySlug(base);
      const tags = Array.from(new Set([slugify(category), ...tokensFromFilename(base)]));

      return { id, label, src: `/assets/${category}/${filename}`, tags };
    });

    manifest.push({ id: slugify(category), label: prettifySlug(category), items });
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2) + "\n", "utf8");
  console.log(`✅ Wrote ${OUT_FILE}`);
  console.log(`📁 Categories: ${manifest.length}`);
  console.log(`🖼️  Total items: ${manifest.reduce((sum, g) => sum + g.items.length, 0)}`);
}

main();
'@

# ----------------------------
# React app
# ----------------------------
Write-File "src/main.jsx" @'
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
'@

Write-File "src/App.jsx" @'
import React, { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./components/Sidebar.jsx";
import Toolbar from "./components/Toolbar.jsx";
import CanvasStage from "./components/CanvasStage.jsx";
import { PRESETS } from "./lib/canvasPresets.js";
import {
  addImageToCanvas,
  bringForward,
  sendBackwards,
  bringToFront,
  sendToBack,
  duplicateActive,
  deleteActive
} from "./lib/fabricUtils.js";
import { createHistory } from "./lib/history.js";

export default function App() {
  const [groups, setGroups] = useState([]);
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [customSize, setCustomSize] = useState({ w: 1080, h: 1080 });

  const canvasRef = useRef(null);
  const historyRef = useRef(null);
  const cleanupHistoryRef = useRef(null);

  const size = useMemo(() => {
    if (presetId === "custom") return customSize;
    const p = PRESETS.find((x) => x.id === presetId) ?? PRESETS[0];
    return { w: p.w, h: p.h };
  }, [presetId, customSize]);

  useEffect(() => {
    fetch("/manifest.json")
      .then((r) => r.json())
      .then((data) => setGroups(Array.isArray(data) ? data : []))
      .catch(() => setGroups([]));
  }, []);

  const onCanvasReady = (c) => {
    canvasRef.current = c;

    historyRef.current = createHistory(c);
    cleanupHistoryRef.current = historyRef.current.init();

    const upper = c.upperCanvasEl;

    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = async (e) => {
      e.preventDefault();
      const src = e.dataTransfer.getData("text/plain");
      if (!src) return;

      const rect = upper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      await addImageToCanvas(c, src, { left: x, top: y });
    };

    upper.addEventListener("dragover", handleDragOver);
    upper.addEventListener("drop", handleDrop);

    return () => {
      upper.removeEventListener("dragover", handleDragOver);
      upper.removeEventListener("drop", handleDrop);
    };
  };

  const addSticker = async (src) => {
    const c = canvasRef.current;
    if (!c) return;
    await addImageToCanvas(c, src);
  };

  const exportPNG = () => {
    const c = canvasRef.current;
    if (!c) return;

    const dataUrl = c.toDataURL({ format: "png", multiplier: 1 });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `90s-collage-${size.w}x${size.h}.png`;
    a.click();
  };

  const undo = () => historyRef.current?.undo?.();
  const redo = () => historyRef.current?.redo?.();

  useEffect(() => {
    return () => cleanupHistoryRef.current?.();
  }, [size.w, size.h]);

  return (
    <div className="app">
      <Sidebar groups={groups} onAdd={addSticker} />

      <main className="main">
        <Toolbar
          presetId={presetId}
          setPresetId={setPresetId}
          onCustomSize={(w, h) => setCustomSize({ w, h })}
          onUndo={undo}
          onRedo={redo}
          onBringForward={() => bringForward(canvasRef.current)}
          onSendBackwards={() => sendBackwards(canvasRef.current)}
          onBringToFront={() => bringToFront(canvasRef.current)}
          onSendToBack={() => sendToBack(canvasRef.current)}
          onDuplicate={() => duplicateActive(canvasRef.current)}
          onDelete={() => deleteActive(canvasRef.current)}
          onExport={exportPNG}
        />

        <div className="stageOuter">
          <div className="stageFrame">
            <CanvasStage
              key={`${size.w}x${size.h}`}
              width={size.w}
              height={size.h}
              onCanvasReady={onCanvasReady}
            />
          </div>

          <div className="stageMeta">
            Canvas: <strong>{size.w}×{size.h}</strong>
            <span className="stageTip">
              Tip: Use the corner handles to resize and the rotate handle to rotate.
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
'@

# Components
Write-File "src/components/Sidebar.jsx" @'
import React, { useEffect, useMemo, useState } from "react";

export default function Sidebar({ groups = [], onAdd }) {
  const [activeGroupId, setActiveGroupId] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!groups.length) return;
    const exists = groups.some((g) => g.id === activeGroupId);
    if (!exists) setActiveGroupId(groups[0].id);
  }, [groups, activeGroupId]);

  const activeGroup = useMemo(() => {
    return groups.find((g) => g.id === activeGroupId) || null;
  }, [groups, activeGroupId]);

  const filteredItems = useMemo(() => {
    const items = activeGroup?.items ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const haystack = `${item.label ?? ""} ${(item.tags || []).join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [activeGroup, query]);

  return (
    <aside className="sidebar">
      <div className="sidebarHeader">
        <div className="brand">90s Collage Maker</div>

        <select
          className="select"
          value={activeGroupId}
          onChange={(e) => {
            setActiveGroupId(e.target.value);
            setQuery("");
          }}
          disabled={!groups.length}
        >
          {groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.label}
            </option>
          ))}
        </select>

        <input
          className="search"
          placeholder="Search stickers…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="hint">Click to add • Drag to canvas</div>
      </div>

      <div className="thumbGrid" key={activeGroupId} data-category={activeGroupId}>
        {filteredItems.map((item) => (
          <div
            key={`${activeGroupId}:${item.id}`}
            className="thumb"
            draggable
            title={item.label ?? item.id}
            onClick={() => onAdd(item.src)}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "copy";
              e.dataTransfer.setData("text/plain", item.src);
            }}
          >
            <div className="thumbPreview" style={{ backgroundImage: `url(${item.src})` }} />
            <div className="thumbLabel">{item.label ?? item.id}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}
'@

Write-File "src/components/Toolbar.jsx" @'
import React, { useState } from "react";
import { PRESETS } from "../lib/canvasPresets.js";

export default function Toolbar({
  presetId,
  setPresetId,
  onCustomSize,
  onUndo,
  onRedo,
  onBringForward,
  onSendBackwards,
  onBringToFront,
  onSendToBack,
  onDuplicate,
  onDelete,
  onExport
}) {
  const [customW, setCustomW] = useState(1080);
  const [customH, setCustomH] = useState(1080);

  return (
    <div className="toolbar">
      <div className="toolbarLeft">
        <button className="btn" onClick={onUndo}>Undo</button>
        <button className="btn" onClick={onRedo}>Redo</button>

        <div className="sep" />

        <button className="btn" onClick={onBringForward}>Forward</button>
        <button className="btn" onClick={onSendBackwards}>Backward</button>
        <button className="btn" onClick={onBringToFront}>To Front</button>
        <button className="btn" onClick={onSendToBack}>To Back</button>

        <div className="sep" />

        <button className="btn" onClick={onDuplicate}>Duplicate</button>
        <button className="btn danger" onClick={onDelete}>Delete</button>
      </div>

      <div className="toolbarRight">
        <select className="select" value={presetId} onChange={(e) => setPresetId(e.target.value)}>
          {PRESETS.map((p) => (
            <option key={p.id} value={p.id}>{p.label}</option>
          ))}
          <option value="custom">Custom…</option>
        </select>

        {presetId === "custom" && (
          <div className="customSize">
            <input
              className="num"
              type="number"
              value={customW}
              onChange={(e) => setCustomW(parseInt(e.target.value || "0", 10))}
            />
            <span className="x">×</span>
            <input
              className="num"
              type="number"
              value={customH}
              onChange={(e) => setCustomH(parseInt(e.target.value || "0", 10))}
            />
            <button className="btn" onClick={() => onCustomSize(customW, customH)}>Set</button>
          </div>
        )}

        <button className="btn primary" onClick={onExport}>Export PNG</button>
      </div>
    </div>
  );
}
'@

Write-File "src/components/CanvasStage.jsx" @'
import React, { useEffect, useRef } from "react";
import { Canvas as FabricCanvas, Rect } from "fabric";

export default function CanvasStage({ width, height, onCanvasReady }) {
  const elRef = useRef(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;

    const c = new FabricCanvas(el, {
      width,
      height,
      backgroundColor: "#ffffff",
      preserveObjectStacking: true,
      selection: true
    });

    const border = new Rect({
      left: 0,
      top: 0,
      width,
      height,
      fill: "transparent",
      stroke: "rgba(0,0,0,0.08)",
      strokeWidth: 2,
      selectable: false,
      evented: false
    });
    c.add(border);
    c.sendObjectToBack(border);

    const teardown = onCanvasReady?.(c);

    return () => {
      if (typeof teardown === "function") teardown();
      c.dispose();
    };
  }, [width, height, onCanvasReady]);

  return (
    <div className="canvasWrap">
      <canvas ref={elRef} />
    </div>
  );
}
'@

# Lib
Write-File "src/lib/canvasPresets.js" @'
export const PRESETS = [
  { id: "ig-square", label: "Instagram Square (1080×1080)", w: 1080, h: 1080 },
  { id: "ig-story", label: "Instagram Story (1080×1920)", w: 1080, h: 1920 },
  { id: "hd", label: "HD (1920×1080)", w: 1920, h: 1080 },
  { id: "a4", label: "A4 @ 300dpi (2480×3508)", w: 2480, h: 3508 }
];
'@

Write-File "src/lib/fabricUtils.js" @'
import { FabricImage } from "fabric";

export async function addImageToCanvas(canvas, src, opts = {}) {
  const img = await FabricImage.fromURL(src, { crossOrigin: "anonymous" });

  const maxW = opts.maxW ?? canvas.width * 0.35;
  const maxH = opts.maxH ?? canvas.height * 0.35;

  const scale = Math.min(maxW / img.width, maxH / img.height, 1);
  img.scale(scale);

  img.set({
    left: opts.left ?? canvas.width * 0.5,
    top: opts.top ?? canvas.height * 0.5,
    originX: "center",
    originY: "center",
    selectable: true,
    hasControls: true
  });

  canvas.add(img);
  canvas.setActiveObject(img);
  canvas.requestRenderAll();
  return img;
}

export function bringForward(canvas) {
  const obj = canvas?.getActiveObject?.();
  if (!obj) return;
  canvas.bringObjectForward(obj);
  canvas.requestRenderAll();
}

export function sendBackwards(canvas) {
  const obj = canvas?.getActiveObject?.();
  if (!obj) return;
  canvas.sendObjectBackwards(obj);
  canvas.requestRenderAll();
}

export function bringToFront(canvas) {
  const obj = canvas?.getActiveObject?.();
  if (!obj) return;
  canvas.bringObjectToFront(obj);
  canvas.requestRenderAll();
}

export function sendToBack(canvas) {
  const obj = canvas?.getActiveObject?.();
  if (!obj) return;
  canvas.sendObjectToBack(obj);
  canvas.requestRenderAll();
}

export function duplicateActive(canvas) {
  const obj = canvas?.getActiveObject?.();
  if (!obj) return;

  obj.clone((cloned) => {
    cloned.set({
      left: (obj.left ?? 0) + 30,
      top: (obj.top ?? 0) + 30
    });
    canvas.add(cloned);
    canvas.setActiveObject(cloned);
    canvas.requestRenderAll();
  });
}

export function deleteActive(canvas) {
  const obj = canvas?.getActiveObject?.();
  if (!obj) return;
  canvas.remove(obj);
  canvas.discardActiveObject();
  canvas.requestRenderAll();
}
'@

Write-File "src/lib/history.js" @'
export function createHistory(canvas, { limit = 40 } = {}) {
  let stack = [];
  let index = -1;
  let isApplying = false;

  const save = () => {
    if (isApplying) return;
    const json = canvas.toDatalessJSON();

    stack = stack.slice(0, index + 1);
    stack.push(json);
    if (stack.length > limit) stack.shift();
    index = stack.length - 1;
  };

  const apply = (json) =>
    new Promise((resolve) => {
      isApplying = true;
      canvas.loadFromJSON(json, () => {
        canvas.requestRenderAll();
        isApplying = false;
        resolve();
      });
    });

  const undo = async () => {
    if (index <= 0) return;
    index -= 1;
    await apply(stack[index]);
  };

  const redo = async () => {
    if (index >= stack.length - 1) return;
    index += 1;
    await apply(stack[index]);
  };

  const init = () => {
    save();
    const handler = () => save();

    canvas.on("object:added", handler);
    canvas.on("object:modified", handler);
    canvas.on("object:removed", handler);

    return () => {
      canvas.off("object:added", handler);
      canvas.off("object:modified", handler);
      canvas.off("object:removed", handler);
    };
  };

  return { init, undo, redo };
}
'@

# CSS
Write-File "src/styles.css" @'
:root {
  --bg: #0b0c10;
  --panel: #12141b;
  --panel2: #0f1117;
  --text: #e7eaf0;
  --muted: rgba(231,234,240,0.65);
  --line: rgba(255,255,255,0.08);
  --accent: #7cf7d4;
  --danger: #ff5a7a;
}

* { box-sizing: border-box; }
html, body { height: 100%; }

body {
  margin: 0;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
  background: radial-gradient(1200px 600px at 20% 10%, rgba(124,247,212,0.12), transparent 55%),
              radial-gradient(900px 500px at 90% 30%, rgba(255,90,122,0.10), transparent 60%),
              var(--bg);
  color: var(--text);
}

.app {
  display: grid;
  grid-template-columns: 340px 1fr;
  height: 100vh;
}

.sidebar {
  border-right: 1px solid var(--line);
  background: linear-gradient(180deg, var(--panel), var(--panel2));
  display: flex;
  flex-direction: column;
  min-width: 0;
  height: 100%;
  min-height: 0;
}

.sidebarHeader {
  padding: 14px;
  border-bottom: 1px solid var(--line);
}

.brand {
  font-weight: 800;
  letter-spacing: 0.3px;
  margin-bottom: 10px;
}

.select, .search, .num {
  width: 100%;
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.03);
  color: var(--text);
  padding: 10px 10px;
  border-radius: 10px;
  outline: none;
}

.search { margin-top: 10px; }

.hint {
  margin-top: 10px;
  color: var(--muted);
  font-size: 12px;
}

.thumbGrid {
  padding: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.thumb {
  border: 1px solid var(--line);
  background: rgba(0,0,0,0.18);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  user-select: none;
}

.thumbPreview{
  height: 120px;
  width: 100%;
  background-color: rgba(255,255,255,0.02);
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
}

.thumbGrid[data-category="cartoons"] .thumbPreview,
.thumbGrid[data-category="music"] .thumbPreview{
  background-size: cover;
}

.thumbLabel {
  padding: 8px 10px;
  font-size: 12px;
  color: var(--muted);
  border-top: 1px solid var(--line);
}

.main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 12px;
  border-bottom: 1px solid var(--line);
  background: rgba(0,0,0,0.20);
  backdrop-filter: blur(10px);
}

.toolbarLeft, .toolbarRight {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.sep {
  width: 1px;
  height: 28px;
  background: var(--line);
  margin: 0 4px;
}

.btn {
  border: 1px solid var(--line);
  background: rgba(255,255,255,0.04);
  color: var(--text);
  padding: 9px 10px;
  border-radius: 10px;
  cursor: pointer;
}

.btn:hover { border-color: rgba(255,255,255,0.18); }
.btn.primary { border-color: rgba(124,247,212,0.35); }
.btn.danger { border-color: rgba(255,90,122,0.35); color: #ffd3dc; }

.customSize {
  display: flex;
  align-items: center;
  gap: 6px;
}

.num { width: 92px; padding: 9px 10px; }
.x { color: var(--muted); padding: 0 2px; }

.stageOuter {
  flex: 1;
  display: grid;
  place-items: center;
  padding: 22px;
  overflow: auto;
}

.stageFrame {
  padding: 18px;
  border-radius: 18px;
  border: 1px solid var(--line);
  background: rgba(0,0,0,0.25);
  box-shadow: 0 30px 80px rgba(0,0,0,0.45);
}

.canvasWrap canvas {
  border-radius: 10px;
}

.stageMeta {
  margin-top: 12px;
  color: var(--muted);
  font-size: 13px;
}

.stageTip {
  margin-left: 10px;
  color: rgba(231,234,240,0.45);
}
'@

Write-Host "✅ Project scaffolded in .\$ProjectName"
Write-Host ""
Write-Host "Next steps:"
Write-Host "  cd $ProjectName"
Write-Host "  npm install"
Write-Host "  npm run gen:manifest"
Write-Host "  npm run dev"
