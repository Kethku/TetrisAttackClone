import { Update, Draw } from "./events";
import { EventManager1 } from "./eventManager";
import { Block, BlockState, BlockType } from "./block";
import { setBlock, gridToScreen, GridElement } from "./grid";
import { garbageImages } from "./images";
import { MatchStarted } from "./match";
import { Garbage, garbageBlocks } from "./garbage";
import { image } from "./graphics";
import { Vector } from "./math";

const clearDelay = 60;
const blockClearDelay = 10;
const breakDelay = 30;

const clearAnimations = new Set();

export const ClearAnimationFinished = new EventManager1();
export const ClearAnimationStarted = new EventManager1();
export const GarbageBroken = new EventManager1();

class ClearAnimation {
  public triggeringBlocks: Block[];
  public garbageBlocks: Set<Garbage>;
  public spawnedBlocks: GridElement[];

  private timer: number;
  private breakTimeStarted: number;
  private coveredSlots: Map<string, Vector>;

  constructor(triggeringBlocks: Block[], garbageBlocks: Set<Garbage>) {
    this.timer = 0;
    this.triggeringBlocks = triggeringBlocks;
    this.garbageBlocks = garbageBlocks;
    this.coveredSlots = new Map();
    this.spawnedBlocks = [];

    for (let garbage of garbageBlocks) {
      for (let slot of garbage.overlappingSlots()) {
        this.coveredSlots.set(JSON.stringify(slot), slot);
      }

      this.createSpawnedBlocks(garbage);
    }
  }

  createSpawnedBlocks(garbage: Garbage) {
    for (let x = garbage.gridSlot.x; x < garbage.gridSlot.x + garbage.gridDimensions.x; x++) {
      let slot = new Vector(x, garbage.gridSlot.y + garbage.gridDimensions.y - 1);
      this.spawnedBlocks.push(new Block(slot));
    }

    if (garbage.gridDimensions.y > 1) {
      let dimensions = garbage.gridDimensions.withY(garbage.gridDimensions.height - 1);
      this.spawnedBlocks.push(new Garbage(garbage.gridSlot, dimensions));
    }
  }

  update() {
    if (this.timer > clearDelay) {
      if ((this.timer - clearDelay) % blockClearDelay == 0) {
        let anyUncovered = false;
        for (let coveredSlot of this.coveredSlots.values()) {
          this.coveredSlots.delete(JSON.stringify(coveredSlot));
          anyUncovered = true;
          break;
        }

        if (!anyUncovered && !this.breakTimeStarted) {
          this.breakTimeStarted = this.timer;
        }
      }
    }

    if (this.breakTimeStarted &&
        this.timer - this.breakTimeStarted > breakDelay) {
      clearAnimations.delete(this);
      for (let spawnedBlock of this.spawnedBlocks) {
        setBlock(spawnedBlock);
        if (spawnedBlock.type === BlockType.Garbage) {
          garbageBlocks.add(spawnedBlock);
        }
        spawnedBlock.state = BlockState.Waiting;
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
      spawnedBlock.render();
    }

    for (let coveredSlot of this.coveredSlots.values()) {
      let renderInfo = gridToScreen({
        position: coveredSlot,
        dimensions: Vector.one
      });

      image({
        imageUrl: garbageImages.Clear,
        center: Vector.topLeft,
        ...renderInfo
      });
    }
  }
}

export function anyClearAnimations() {
  return clearAnimations.size != 0;
}

function breakBlocks(garbageBlocks: Set<Garbage>, matchedBlocks: Block[]) {
  let clearAnimation = new ClearAnimation(matchedBlocks, garbageBlocks);
  for (let garbage of garbageBlocks) {
    garbage.state = BlockState.Clearing;
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

  let garbageToBreak = new Set<Garbage>();

  let foundNewBrokenGarbage: boolean;
  do {
    foundNewBrokenGarbage = false;
    for (let garbage of garbageBlocks) {
      if (garbageToBreak.has(garbage)) continue;
      if (garbage.state == BlockState.Clearing) continue;
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
