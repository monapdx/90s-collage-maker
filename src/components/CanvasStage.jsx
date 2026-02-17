import React, { useEffect, useRef } from "react";
import { Canvas as FabricCanvas, Rect } from "fabric";

export default function CanvasStage({ width, height, onCanvasReady }) {
  const elRef = useRef(null);
  const canvasRef = useRef(null);

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

    // Optional: a “safe area” border (visual only)
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

    canvasRef.current = c;
    onCanvasReady?.(c);

    return () => {
      c.dispose();
      canvasRef.current = null;
    };
  }, []); // mount once

  // If size changes, re-init is simplest for MVP.
  // App will re-mount this component by key when preset changes.

  return (
    <div className="canvasWrap">
      <canvas ref={elRef} />
    </div>
  );
}
