export function createHistory(canvas, { limit = 40 } = {}) {
  let stack = [];
  let index = -1;
  let isApplying = false;

  const save = () => {
    if (isApplying) return;

    const json = canvas.toJSON();

    // Drop redo branch
    stack = stack.slice(0, index + 1);
    stack.push(json);

    if (stack.length > limit) stack.shift();
    index = stack.length - 1;

    console.log("History Saved", "Stack length:", stack.length, "Index:", index);
  };

  const apply = (json) =>
    new Promise((resolve) => {
      isApplying = true;

      canvas.loadFromJSON(json, () => {
        canvas.requestRenderAll();

        // IMPORTANT:
        // Fabric v6 can emit object:added/modified events *after* this callback.
        // Keep isApplying true until next frame so history doesn't record during restore.
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            isApplying = false;
            resolve();
          });
        });
      });
    });

  const undo = async () => {
    console.log("Undo Called", "Index before:", index);
    if (index <= 0) return;

    index -= 1;
    await apply(stack[index]);

    console.log("Undo Complete", "Index now:", index);
  };

  const redo = async () => {
    console.log("Redo Called", "Index before:", index);
    if (index >= stack.length - 1) return;

    index += 1;
    await apply(stack[index]);

    console.log("Redo Complete", "Index now:", index);
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
