import React, { useEffect, useRef } from "react";
import { Canvas } from "fabric";

export default function CanvasStage({ size, onReady }) {
  const wrapRef = useRef(null);
  const canvasElRef = useRef(null);
  const canvasRef = useRef(null);

  // Create Fabric canvas ONCE
  useEffect(() => {
    const el = canvasElRef.current;
    if (!el) return;

    const canvas = new Canvas(el, {
      preserveObjectStacking: true,
      selection: true,
    });

    canvas.backgroundColor = "#ffffff";
    canvas.setWidth(size.w);
    canvas.setHeight(size.h);
    canvas.requestRenderAll();

    canvasRef.current = canvas;

    if (onReady) onReady(canvas);

    return () => {
      canvas.dispose();
      canvasRef.current = null;
    };
  }, []);

  // Update logical size only when preset changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setWidth(size.w);
    canvas.setHeight(size.h);
    canvas.backgroundColor = "#ffffff";
    canvas.requestRenderAll();
  }, [size.w, size.h]);

  // Responsive display scaling (non-destructive)
  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const fit = () => {
      const rect = wrap.getBoundingClientRect();

      const pad = 24;
      const maxW = Math.max(100, rect.width - pad);
      const maxH = Math.max(100, rect.height - pad);

      const scale = Math.min(maxW / size.w, maxH / size.h, 1);

      canvas.setZoom(scale);
      canvas.__displayZoom = scale;
      canvas.requestRenderAll();
    };

    fit();

    const ro = new ResizeObserver(() => fit());
    ro.observe(wrap);
    window.addEventListener("resize", fit);

    return () => {
      window.removeEventListener("resize", fit);
      ro.disconnect();
    };
  }, [size.w, size.h]);

  return (
    <div className="stageOuter">
      <div className="stageFrame" ref={wrapRef}>
        <div
          className="canvasWrap"
          style={{
            display: "grid",
            placeItems: "center",
            width: "100%",
            height: "100%",
          }}
        >
          <canvas ref={canvasElRef} />
        </div>

        <div className="stageMeta">
          Canvas: {size.w}×{size.h}
          <span className="stageTip"> • Drag stickers from the sidebar</span>
        </div>
      </div>
    </div>
  );
}
