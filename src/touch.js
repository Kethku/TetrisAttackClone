import { Vector } from "./math";
import { Update } from "./events";
import { canvas, screenSize } from "./graphics";

export let touchPosition = Vector.zero;

export let touchDown = false;
export let touchStarted = false;
export let touchReleased = false;

function handlePointerEvent(e) {
  touchPosition = new Vector(e.clientX, screenSize.height - e.clientY);
  touchDown = e.pressure > 0.1;
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

