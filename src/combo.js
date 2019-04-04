import { getBlock, gridBlockDimensions } from "./grid";
import { state, type, volatileStates } from "./block";
import { MatchStarted, MatchCompleted, findNewMatches } from "./match";
import { Update } from "./events";
import { previousFilledY } from "./advance";
import { ClearAnimationStarted } from "./clearAnimation";

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
    this.matchedBlocks = new Set();
    matchedBlocks.forEach(matchedBlock => this.matchedBlocks.add(matchedBlock));
  }

  processMatchedBlocks(matchedBlocks) {
    for (let matchedBlock of matchedBlocks) {
      this.matchedBlocks.add(matchedBlock);
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
      if (trackedBlock.state !== state.SPAWNING &&
          trackedBlock.state !== state.FALLING &&
          trackedBlock.state !== state.MATCHED &&
          trackedBlock.state !== state.CLEARING &&
          (trackedBlock.type === type.GARBAGE ||
           !emptySlotBelow(trackedBlock))) {
        this.trackedBlocks.delete(trackedBlock);
      }
    }

    for (let matchedBlock of this.matchedBlocks) {
      if (matchedBlock.state !== state.CLEARED) {
        return false;
      }
    }

    if (this.trackedBlocks.size == 0) {
      if (this.cascades > 0) {
        ComboFinished.Publish(this.cascades);
      } else {
        console.log("Combo fizzled");
      }
      return true;
    }

    return false;
  }
}

MatchStarted.Subscribe(matchedBlocks => {
  let foundExistingCombo = false;

  for (let combo of combos) {
    if (matchedBlocks.some(matchedBlock => combo.trackedBlocks.has(matchedBlock))) {
      foundExistingCombo = true;
      combo.cascades++;
      ComboExtended.Publish(matchedBlocks, combo.cascades);
    }
  }

  if (!foundExistingCombo) {
    combos.add(new Combo(matchedBlocks));
  }
});

MatchCompleted.Subscribe(clearedBlocks => {
  for (let combo of combos) {
    if (clearedBlocks.some(clearedBlock => combo.trackedBlocks.has(clearedBlock)) ||
        clearedBlocks.some(clearedBlock => combo.matchedBlocks.has(clearedBlock))) {
      combo.processMatchedBlocks(clearedBlocks);
    }
  }
});

ClearAnimationStarted.Subscribe(({ triggeringBlocks, spawnedBlocks }) => {
  for (let combo of combos) {
    for (let block of triggeringBlocks) {
      if (combo.matchedBlocks.has(block)) {
        for (let spawnedBlock of spawnedBlocks) {
          combo.trackedBlocks.add(spawnedBlock.block);
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
