import { Setup, Update } from "./events";
import { stopClock } from "./stopClock";
import { gridBlockDimensions, blockWidth, setBlock } from "./grid";
import { matches } from "./match";
import { Block } from "./block";
import { Vector } from "./math";
import { anyClearAnimations } from "./clearAnimation";

const maxInitialStackHeight = 5;
const advanceAcceleration = 0.0000005;
let blockAdvancement = maxInitialStackHeight + 1;
let advanceSpeed = 0.002;

export let blockPixelAdvancement = 0;
export let previousFilledY = maxInitialStackHeight;

Setup.Subscribe(() => {
  for (let x = 0; x < gridBlockDimensions.x; x++) {
    let stackHeight = Math.floor(Math.random() * 4) + maxInitialStackHeight - 3;
    for (let y = 0; y < stackHeight; y++) {
      setBlock(new Block(new Vector(x, maxInitialStackHeight - y)));
    }
  }
});

function fillNewRows() {
  if (blockAdvancement - 1 > previousFilledY) {
    previousFilledY++;
    for (let x = 0; x < gridBlockDimensions.x; x++) {
      setBlock(new Block(new Vector(x, previousFilledY)));
    }
  }
}

export function intentionalAdvance() {
  blockAdvancement = Math.floor(blockAdvancement) + 1.001;
  blockPixelAdvancement = blockAdvancement * blockWidth;
  fillNewRows();
}

Update.Subscribe(() => {
  if (matches.size == 0 && stopClock == 0 && !anyClearAnimations()) {
    blockAdvancement += advanceSpeed;
    blockPixelAdvancement = blockAdvancement * blockWidth;
    advanceSpeed += advanceAcceleration;
  }
  fillNewRows();
});
