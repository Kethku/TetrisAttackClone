import { MatchCompleted } from "./match";
import { ComboFinished } from "./combo";
import { Update } from "../events";

export let stopClock = 0;

const framesPerBlock = 10;
const framesPerCombo = 60;

export function resetClock() {
  stopClock = 0;
}

Update.Subscribe(() => {
  if (stopClock > 0) {
    stopClock--;
  }
});

MatchCompleted.Subscribe(blocks => {
  stopClock += blocks.length * framesPerBlock;
});

ComboFinished.Subscribe(cascades => {
  stopClock += cascades * framesPerCombo;
});


