import { getBlock, gridBlockDimensions } from "./grid";
import { state, type, volatileStates } from "./block";
import { MatchStarted, MatchCompleted, findNewMatches } from "./match";
import { Update } from "./events";
import { previousFilledY } from "./advance";
import { GarbageBroken } from "./garbage";

import { EventManager1, EventManager2 } from "./eventManager";

export const combos = new Set();

export const ComboExtended = new EventManager1();
export const ComboFinished = new EventManager1();

function emptySlotBelow(block) {
  for (let y = block.gridSlot.y + 1; y <= previousFilledY; y++) {
    let possiblyEmptyBlock = getBlock(block.gridSlot.withY(y));
    if (!possiblyEmptyBlock || volatileStates.includes(possiblyEmptyBlock.state)) {
      return true;
    }
  }
  return false;
}

export class Combo {
  constructor(matchedBlocks) {
    this.cascades = 0;
    this.trackedBlocks = new Set();
    this.processMatchedBlocks(matchedBlocks);
  }

  processMatchedBlocks(matchedBlocks) {
    for (let matchedBlock of matchedBlocks) {
      for (let y = matchedBlock.gridSlot.y - 1; y > 0; y--) {
        let fallingBlock = getBlock(matchedBlock.gridSlot.withY(y));
        if (!fallingBlock) break;
        if (fallingBlock.state === state.WAITING) {
          this.trackedBlocks.add(fallingBlock);
        }
      }
      this.trackedBlocks.delete(matchedBlock);
    }
  }

  update() {
    for (let trackedBlock of this.trackedBlocks) {
      if (trackedBlock.state !== state.FALLING &&
          trackedBlock.state !== state.MATCHED &&
          trackedBlock.state !== state.CLEARING &&
          (trackedBlock.type === type.GARBAGE ||
           !emptySlotBelow(trackedBlock))) {
        this.trackedBlocks.delete(trackedBlock);
      }
    }

    if (this.trackedBlocks.size == 0) {
      if (this.cascades > 0) {
        ComboFinished.Publish(this.cascades);
      }
      return true;
    }

    return false;
  }
}

MatchStarted.Subscribe(matchedBlocks => {
  for (let combo of combos) {
    if (matchedBlocks.some(matchedBlock => combo.trackedBlocks.has(matchedBlock))) {
      combo.cascades++;
      ComboExtended.Publish(matchedBlocks, combo.cascades);
    }
  }
});

MatchCompleted.Subscribe(clearedBlocks => {
  let foundExistingCombo = false;
  for (let combo of combos) {
    if (clearedBlocks.some(clearedBlock => combo.trackedBlocks.has(clearedBlock))) {
      foundExistingCombo = true;
      combo.processMatchedBlocks(clearedBlocks);
    }
  }

  if (!foundExistingCombo) {
    combos.add(new Combo(clearedBlocks));
  }
});

GarbageBroken.Subscribe(({ matchedBlocks, spawnedBlocks }) => {
  for (let combo of combos) {
    for (let block of matchedBlocks) {
      if (combo.trackedBlocks.has(block)) {
        for (let spawnedBlock of spawnedBlocks) {
          combo.trackedBlocks.add(spawnedBlock);
        }
        break;
      }
    }
  }
});

function update() {
  let combosToRemove = [];
  for (let combo of combos) {
    if (combo.update()) combosToRemove.push(combo);
  }

  combosToRemove.forEach(comboToRemove => combos.delete(comboToRemove));
}

Update.Subscribe(update);

ComboFinished.Subscribe(cascades => console.log((cascades + 1) + " Match Combo!"));
ComboExtended.Subscribe((_, cascades) => console.log("Combo Extended!"));
