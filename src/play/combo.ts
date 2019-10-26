import { Update } from "./events";
import { getBlock } from "./grid";
import { Block, BlockState, BlockType, volatileStates } from "./block";
import { MatchStarted, MatchCompleted } from "./match";
import { previousFilledY } from "./advance";
import { ClearAnimationStarted } from "./clearAnimation";

import { EventManager } from "../eventManager";

export const combos = new Set<Combo>();

export const ComboExtended = new EventManager<[Block[], number]>();
export const ComboFinished = new EventManager<[number]>();


function emptySlotBelow(block: Block) {
  for (let y = block.gridSlot.y + 1; y <= previousFilledY; y++) {
    let possiblyEmptyBlock = getBlock(block.gridSlot.withY(y));
    
    if (!possiblyEmptyBlock || volatileStates.includes(possiblyEmptyBlock.state)) {
      return true;
    }
  }
  return false;
}

export class Combo {
  public cascades: number;
  public trackedBlocks: Set<Block>;
  public matchedBlocks: Set<Block>;

  constructor(matchedBlocks: Block[]) {
    this.cascades = 0;
    this.trackedBlocks = new Set();
    this.matchedBlocks = new Set();
    matchedBlocks.forEach(matchedBlock => this.matchedBlocks.add(matchedBlock));
  }

  processMatchedBlocks(matchedBlocks: Block[]) {
    for (let matchedBlock of matchedBlocks) {
      this.matchedBlocks.add(matchedBlock);
      for (let y = matchedBlock.gridSlot.y - 1; y > 0; y--) {
        let fallingBlock = getBlock(matchedBlock.gridSlot.withY(y)) as Block;
        if (!fallingBlock) break;
        if (fallingBlock.state === BlockState.Waiting) {
          this.trackedBlocks.add(fallingBlock);
        }
      }
      this.trackedBlocks.delete(matchedBlock);
    }
  }

  update() {
    for (let trackedBlock of this.trackedBlocks) {
      if (trackedBlock.state !== BlockState.Spawning &&
          trackedBlock.state !== BlockState.Falling &&
          trackedBlock.state !== BlockState.Matched &&
          trackedBlock.state !== BlockState.Clearing &&
          (trackedBlock.type === BlockType.Garbage ||
           !emptySlotBelow(trackedBlock))) {
        this.trackedBlocks.delete(trackedBlock);
      }
    }

    for (let matchedBlock of this.matchedBlocks) {
      if (matchedBlock.state !== BlockState.Cleared) {
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
          combo.trackedBlocks.add(spawnedBlock as Block);
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
ComboExtended.Subscribe(() => console.log("Combo Extended!"));
