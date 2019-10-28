import { Setup, Update } from "./events";
import { stopClock } from "./stopClock";
import { gridBlockDimensions, blockWidth, setBlock, allBlocks } from "./grid";
import { matches } from "./match";
import { Block } from "./block";
import { anyClearAnimations } from "./clearAnimation";

import { Vector } from "../math";
import * as gameOverScreen from "../gameOver";
import { switchScreens } from "../index";

const maxInitialStackHeight = 5;
const advanceAcceleration = 0.0000005;
const framesBeforeLoss = 180;

let blockAdvancement = maxInitialStackHeight + 1;
let advanceSpeed = 0.002;

export let loseClock = 0;
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

export function getDangerColumns() {
  let dangerColumns = new Set<number>();
  for (let block of allBlocks())  {
    for (let gridSlot of block.overlappingSlots()) {
      if (gridSlot.y <= previousFilledY - gridBlockDimensions.height + 1) {
        dangerColumns.add(gridSlot.x);
      }
    }
  }
  return dangerColumns;
}

export function isInLosingPosition() {
  for (let block of allBlocks())  {
    for (let gridSlot of block.overlappingSlots()) {
      if (gridSlot.y <= previousFilledY - gridBlockDimensions.height) {
        return true;
      }
    }
  }
  return false;
}

export function intentionalAdvance() {
  blockAdvancement = Math.floor(blockAdvancement) + 1.001;
  blockPixelAdvancement = blockAdvancement * blockWidth;
  fillNewRows();
}

Update.Subscribe(() => {
  let notMatchSafe = matches.size == 0 && stopClock == 0 && !anyClearAnimations();

  if (isInLosingPosition() && notMatchSafe) {
    loseClock++;
    if (loseClock > framesBeforeLoss) {
      gameOverScreen.Init(false);
      switchScreens(gameOverScreen);
    }
  } else {
    loseClock = 0;

    if (notMatchSafe) {
      blockAdvancement += advanceSpeed;
      blockPixelAdvancement = blockAdvancement * blockWidth;
      advanceSpeed += advanceAcceleration;
    }
    fillNewRows();
  }
});
