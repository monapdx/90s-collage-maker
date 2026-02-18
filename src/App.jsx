import React, { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import Toolbar from "./components/Toolbar";
import CanvasStage from "./components/CanvasStage";
import { PRESETS } from "./lib/canvasPresets";
import {
  addImageToCanvas,
  bringForward,
  sendBackwards,
  bringToFront,
  sendToBack,
  duplicateActive,
  deleteActive
} from "./lib/fabricUtils";
import { createHistory } from "./lib/history";

export default function App() {
  const BASE = import.meta.env.BASE_URL;

  const [groups, setGroups] = useState([]);
  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [customSize, setCustomSize] = useState({ w: 1080, h: 1080 });

  const canvasRef = useRef(null);
  const historyRef = useRef(null);

  // Resolve logical canvas size
  const size = useMemo(() => {
    if (presetId === "custom") return customSize;
    const preset = PRESETS.find((p) => p.id === presetId) || PRESETS[0];
    return { w: preset.w, h: preset.h };
  }, [presetId, customSize]);

  // Load sticker manifest (GitHub Pages safe)
  useEffect(() => {
    fetch(`${BASE}manifest.json`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setGroups(data);
        } else {
          setGroups([]);
        }
      })
      .catch((err) => {
        console.error("Manifest load error:", err);
        setGroups([]);
      });
  }, [BASE]);

  // Fabric canvas ready
  const handleCanvasReady = (canvas) => {
    canvasRef.current = canvas;

    // Setup undo/redo history
    historyRef.current = createHistory(canvas);
    historyRef.current.init();
  };

  // Add image from sidebar
  const addSticker = async (src) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    await addImageToCanvas(canvas, src);
  };

  // Export full-resolution PNG (ignores display zoom)
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const zoom = canvas.__displayZoom || canvas.getZoom() || 1;

    const dataUrl = canvas.toDataURL({
      format: "png",
      multiplier: 1 / zoom
    });

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `90s-collage-${size.w}x${size.h}.png`;
    link.click();
  };

  return (
    <div className="app">
      <Sidebar groups={groups} onAdd={addSticker} />

      <main className="main">
        <Toolbar
          presetId={presetId}
          setPresetId={setPresetId}
          customSize={customSize}
          setCustomSize={setCustomSize}
          size={size}
          onExport={exportPNG}
          onUndo={() => historyRef.current?.undo()}
          onRedo={() => historyRef.current?.redo()}
          onBringForward={() => bringForward(canvasRef.current)}
          onSendBackwards={() => sendBackwards(canvasRef.current)}
          onBringToFront={() => bringToFront(canvasRef.current)}
          onSendToBack={() => sendToBack(canvasRef.current)}
          onDuplicate={() => duplicateActive(canvasRef.current)}
          onDelete={() => deleteActive(canvasRef.current)}
        />

        <CanvasStage size={size} onReady={handleCanvasReady} />
      </main>
    </div>
  );
}
