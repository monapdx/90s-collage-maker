import React, { useState } from "react";
import { PRESETS } from "../lib/canvasPresets";

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
