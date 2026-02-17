import { FabricImage } from "fabric";

/**
 * Adds an image to the canvas at a reasonable default size/position.
 */
export async function addImageToCanvas(canvas, src, opts = {}) {
  const img = await FabricImage.fromURL(src, { crossOrigin: "anonymous" });

  // Default: scale down if huge
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
  const obj = canvas.getActiveObject();
  if (!obj) return;
  canvas.bringObjectForward(obj);
  canvas.requestRenderAll();
}

export function sendBackwards(canvas) {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  canvas.sendObjectBackwards(obj);
  canvas.requestRenderAll();
}

export function bringToFront(canvas) {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  canvas.bringObjectToFront(obj);
  canvas.requestRenderAll();
}

export function sendToBack(canvas) {
  const obj = canvas.getActiveObject();
  if (!obj) return;
  canvas.sendObjectToBack(obj);
  canvas.requestRenderAll();
}

export function duplicateActive(canvas) {
  const obj = canvas.getActiveObject();
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
  const obj = canvas.getActiveObject();
  if (!obj) return;
  canvas.remove(obj);
  canvas.discardActiveObject();
  canvas.requestRenderAll();
}
