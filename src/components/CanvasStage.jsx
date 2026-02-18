import React, { useEffect, useRef } from "react";
import { fabric } from "fabric";

/**
 * CanvasStage
 * - Creates a Fabric canvas once
 * - Fits/zooms the canvas to the available stage area (responsive)
 * - Keeps the logical design size (size.w x size.h) but displays it scaled
 */
export default function CanvasStage({ size, onReady }) {
  const wrapRef = useRef(null);
  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);

  // Create fabric canvas once
  useEffect(() => {
    const el = canvasElRef.current;
    if (!el) return;

    const canvas = new fabric.Canvas(el, {
      preserveObjectStacking: true,
      selection: true,
      backgroundColor: "#ffffff",
    });

    fabricRef.current = canvas;

    // Let parent wire up history / DnD
    if (onReady) onReady(canvas);

    return () => {
      try {
        canvas.dispose();
      } catch {}
      fabricRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fit to container whenever size changes or on resize
  useEffect(() => {
    const canvas = fabricRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const fit = () => {
      // Available space inside the stage wrapper
      const rect = wrap.getBoundingClientRect();

      // Add a little padding so it never touches edges
      const pad = 24;
      const maxW = Math.max(100, rect.width - pad);
      const maxH = Math.max(100, rect.height - pad);

      // Compute scale to fit (never exceed 1 unless you WANT upscaling)
      const scale = Math.min(maxW / size.w, maxH / size.h, 1);

      // Set the "display size" of the canvas element
      const dispW = Math.round(size.w * scale);
      const dispH = Math.round(size.h * scale);

      // IMPORTANT: Fabric uses its own coordinate system.
      // We keep logical size = size.w/size.h, and apply zoom for display.
      canvas.setWidth(dispW);
      canvas.setHeight(dispH);
      canvas.setZoom(scale);

      // Ensure the background stays white and redraw
      canvas.setBackgroundColor("#ffffff", canvas.renderAll.bind(canvas));
      canvas.requestRenderAll();

      // Store zoom so export can use it (optional but helpful)
      canvas.__displayZoom = scale;
      canvas.__logicalSize = { ...size };
    };

    fit();

    // Use ResizeObserver so it fits even when sidebar width changes
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
