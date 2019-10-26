import { Vector } from "./math";
import { Update } from "./events";
import { canvas, screenSize } from "./renderer/webgl";

export let touchPosition = Vector.zero;
export let touchId = null;
export let touchDown = false;
export let touchStarted = false;
export let touchReleased = false;

function handlePointerEvent(e: PointerEvent) {
  if (!touchDown || touchId == e.pointerId) {
    touchId = e.pointerId;
    touchPosition = new Vector(e.clientX, screenSize.height - e.clientY);
    touchDown = e.pressure > 0;
  }
}

let previousDown = false;
Update.Subscribe(() => {
  touchStarted = touchDown && !previousDown;
  touchReleased = !touchDown && previousDown;
  previousDown = touchDown;
});

canvas.addEventListener("pointerdown", handlePointerEvent);
canvas.addEventListener("pointerup", handlePointerEvent);
canvas.addEventListener("pointermove", handlePointerEvent);

