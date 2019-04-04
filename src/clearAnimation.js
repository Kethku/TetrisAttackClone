import { Update, Draw } from "./events";
import { EventManager1 } from "./eventManager";
import { Block, state } from "./block";
import { setBlock } from "./grid";
import { garbageImages } from "./images";
import { MatchStarted } from "./match";
import { garbageBlocks } from "./garbage";

const clearDelay = 60;
const blockClearDelay = 10;
const breakDelay = 30;

const clearAnimations = new Set();

export const ClearAnimationFinished = new EventManager1();
export const ClearAnimationStarted = new EventManager1();
export const GarbageBroken = new EventManager1();

class ClearAnimation {
  constructor(triggeringBlocks, garbageBlocks) {
    this.timer = 0;
    this.triggeringBlocks = triggeringBlocks;
    this.garbageBlocks = garbageBlocks;
    this.spawnedBlocks = [];

    for (let garbage of garbageBlocks) {
      for (let slot of garbage.overlappingSlots()) {
        this.spawnedBlocks.push({
          visible: false,
          block: new Block(slot)
        });
      }
    }
  }

  update() {
    if (this.timer > clearDelay) {
      if ((this.timer - clearDelay) % blockClearDelay == 0) {
        let anyHidden = false;
        for (let spawnedBlock of this.spawnedBlocks) {
          if (!spawnedBlock.visible) {
            spawnedBlock.visible = true;
            anyHidden = true;
            break;
          }
        }

        if (!anyHidden && !this.breakTimeStarted) {
          this.breakTimeStarted = this.timer;
        }
      }
    }

    if (this.breakTimeStarted &&
        this.timer - this.breakTimeStarted > breakDelay) {
      clearAnimations.delete(this);
      for (let spawnedBlock of this.spawnedBlocks) {
        setBlock(spawnedBlock.block);
        spawnedBlock.block.state = state.WAITING;
      }
      ClearAnimationFinished.Publish(this);
    }

    if (this.timer == 0) {
      ClearAnimationStarted.Publish(this);
    }

    this.timer++;
  }

  render() {
    for (let spawnedBlock of this.spawnedBlocks) {
      if (!spawnedBlock.visible) {
        spawnedBlock.block.render(garbageImages.Clear);
      } else {
        spawnedBlock.block.render();
      }
    }
  }
}

export function anyClearAnimations() {
  return clearAnimations.size != 0;
}

function breakBlocks(garbageBlocks, matchedBlocks) {
  let clearAnimation = new ClearAnimation(matchedBlocks, garbageBlocks);
  for (let garbage of garbageBlocks) {
    garbage.state = state.CLEARING;
    GarbageBroken.Publish({
      garbage,
      matchedBlocks,
      spawnedBlocks: clearAnimation.spawnedBlocks
    });
  }

  clearAnimations.add(clearAnimation);
}

MatchStarted.Subscribe(matchedBlocks => {
  let triggeringSlots = [];
  for (let matchedBlock of matchedBlocks) {
    triggeringSlots.push(matchedBlock.gridSlot);
  }

  let garbageToBreak = new Set();

  let foundNewBrokenGarbage;
  do {
    foundNewBrokenGarbage = false;
    for (let garbage of garbageBlocks) {
      if (garbageToBreak.has(garbage)) continue;
      if (garbage.state == state.CLEARING) continue;
      for (let triggeringSlot of triggeringSlots) {
        if (garbage.adjacentTo(triggeringSlot)) {
          foundNewBrokenGarbage = true;
          garbageToBreak.add(garbage);
          triggeringSlots = triggeringSlots.concat(Array.from(garbage.overlappingSlots()));
          break;
        }
      }
    }
  } while (foundNewBrokenGarbage)

  if (garbageToBreak.size != 0) {
    breakBlocks(garbageToBreak, matchedBlocks);
  }
});

Update.Subscribe(() => {
  for (let clearAnimation of clearAnimations) {
    clearAnimation.update();
  }
});

Draw.Subscribe(() => {
  for (let clearAnimation of clearAnimations) {
    clearAnimation.render();
  }
});
