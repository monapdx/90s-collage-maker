import React, { useEffect, useRef } from "react";
import { Canvas, Rect } from "fabric";

export default function CanvasStage({ size, onReady }) {
  const wrapRef = useRef(null);
  const canvasElRef = useRef(null);
  const canvasRef = useRef(null);
  const bgRef = useRef(null);

  // Create Fabric canvas ONCE
  useEffect(() => {
    const el = canvasElRef.current;
    if (!el) return;

    const canvas = new Canvas(el, {
      preserveObjectStacking: true,
      selection: true,
    });

    // Set logical size
    canvas.setWidth(size.w);
    canvas.setHeight(size.h);

    // Create locked white background rectangle
    const bgRect = new Rect({
      left: 0,
      top: 0,
      width: size.w,
      height: size.h,
      fill: "#ffffff",
      selectable: false,
      evented: false,
      hasControls: false,
      hasBorders: false,
      excludeFromExport: false,
    });

    canvas.add(bgRect);
    canvas.sendToBack(bgRect);

    bgRef.current = bgRect;
    canvasRef.current = canvas;

    canvas.requestRenderAll();

    if (onReady) onReady(canvas);

    return () => {
      canvas.dispose();
      canvasRef.current = null;
    };
  }, []);

  // Update background + size when preset changes
  useEffect(() => {
    const canvas = canvasRef.current;
    const bgRect = bgRef.current;
    if (!canvas || !bgRect) return;

    canvas.setWidth(size.w);
    canvas.setHeight(size.h);

    bgRect.set({
      width: size.w,
      height: size.h,
    });

    canvas.sendToBack(bgRect);
    canvas.requestRenderAll();
  }, [size.w, size.h]);

  // Responsive display scaling (zoom only — non-destructive)
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
