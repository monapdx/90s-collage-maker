import React, { useEffect, useRef } from "react";
import { Canvas } from "fabric";

export default function CanvasStage({ size, onReady }) {
  const wrapRef = useRef(null);
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);

  useEffect(() => {
    const el = canvasElRef.current;
    if (!el) return;

    const canvas = new Canvas(el, {
      preserveObjectStacking: true,
      selection: true,
      backgroundColor: "#ffffff",
    });

    fabricRef.current = canvas;

    if (onReady) onReady(canvas);

    return () => {
      try {
        canvas.dispose();
      } catch {}
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const canvas = fabricRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const fit = () => {
      const rect = wrap.getBoundingClientRect();

      const pad = 24;
      const maxW = Math.max(100, rect.width - pad);
      const maxH = Math.max(100, rect.height - pad);

      const scale = Math.min(maxW / size.w, maxH / size.h, 1);

      const dispW = Math.round(size.w * scale);
      const dispH = Math.round(size.h * scale);

      canvas.setWidth(dispW);
      canvas.setHeight(dispH);
      canvas.setZoom(scale);

      canvas.setBackgroundColor("#ffffff", canvas.renderAll.bind(canvas));
      canvas.requestRenderAll();

      canvas.__displayZoom = scale;
      canvas.__logicalSize = { ...size };
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
        <div className="canvasWrap" style={{ display: "grid", placeItems: "center" }}>
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
