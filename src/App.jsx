import React, { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "./components/Sidebar";
import Toolbar from "./components/Toolbar";
import CanvasStage from "./components/CanvasStage";
import { PRESETS } from "./lib/canvasPresets";
import { addImageToCanvas, bringForward, sendBackwards, bringToFront, sendToBack, duplicateActive, deleteActive } from "./lib/fabricUtils";
import { createHistory } from "./lib/history";

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

  // Load manifest
  useEffect(() => {
    fetch("/manifest.json")
      .then((r) => r.json())
      .then((data) => setGroups(Array.isArray(data) ? data : []))
      .catch(() => setGroups([]));
  }, []);

  const onCanvasReady = (c) => {
    canvasRef.current = c;

    // Attach history
    historyRef.current = createHistory(c);
    cleanupHistoryRef.current = historyRef.current.init();

    // Allow drop-to-add
    const upper = c.upperCanvasEl;
    const handleDragOver = (e) => e.preventDefault();
    const handleDrop = async (e) => {
      e.preventDefault();
      const src = e.dataTransfer.getData("text/plain");
      if (!src) return;

      const rect = upper.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Fabric canvas coords are already 1:1 here (no zoom in MVP)
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

    // Export at full canvas resolution
    const dataUrl = c.toDataURL({
      format: "png",
      multiplier: 1
    });

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `90s-collage-${size.w}x${size.h}.png`;
    a.click();
  };

  const undo = () => historyRef.current?.undo?.();
  const redo = () => historyRef.current?.redo?.();

  // When size changes, remount CanvasStage by key (simple MVP approach).
  // Also cleanup old history listeners.
  useEffect(() => {
    return () => {
      cleanupHistoryRef.current?.();
    };
  }, [presetId, size.w, size.h]);

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
              key={`${size.w}x${size.h}`} // remount on size change
              width={size.w}
              height={size.h}
              onCanvasReady={(c) => {
                const teardownDnD = onCanvasReady(c);
                // return teardown function if needed later
                return teardownDnD;
              }}
            />
          </div>

          <div className="stageMeta">
            Canvas: <strong>{size.w}×{size.h}</strong>
            <span className="stageTip">Tip: hold Shift while resizing to keep proportions (Fabric behavior varies by version).</span>
          </div>
        </div>
      </main>
    </div>
  );
}
