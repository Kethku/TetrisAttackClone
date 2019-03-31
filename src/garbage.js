import { Setup, Update, Draw } from "./events";
import { garbageImages } from "./images";
import { fallSpeed, type, state, Block } from "./block";
import { getBlock, setBlock, clearSlot, gridCenter, gridDimensions, gridBlockDimensions, blockWidth } from "./grid";
import { blockPixelAdvancement, previousFilledY } from "./advance";
import { image } from "./graphics";
import { Vector, Color } from "./math";
import { MatchStarted } from "./match";
import { EventManager1 } from "./eventManager";

const clearDelay = 60;
const blockClearDelay = 10;
const breakDelay = 30;

export const garbageBlocks = new Set();

export const GarbageBroken = new EventManager1();

function singleRowGarbageTexture(width) {
  switch (width) {
  case 3:
    return garbageImages.ThreeWide;
  case 4:
    return garbageImages.FourWide;
  case 5:
    return garbageImages.FiveWide;
  case 6:
    return garbageImages.SingleLine;
  default:
    throw "Invalid single high block.";
  }
}

function* multiRowGarbageTexture(height) {
  if (height == 1) yield garbageImages.SingleLine;
  else if (height == 2) yield garbageImages.TwoLine;
  else {
    let middleBlockHeight = 2 - (height % 2);
    let remainingMiddles = height - 2 - middleBlockHeight;
    yield garbageImages.TopLine;
    for (let i = 0; i < remainingMiddles / 2; i++) {
      yield garbageImages.MiddleLineNoExclamationPoint;
    }
    yield height % 2 == 0
      ? garbageImages.EvenMiddleLine
      : garbageImages.MiddleLine;
    for (let i = 0; i < remainingMiddles / 2; i++) {
      yield garbageImages.MiddleLineNoExclamationPoint;
    }
    yield garbageImages.BottomLine;
  }
}

function garbageTextureHeight(texture) {
  if (texture === garbageImages.EvenMiddleLine ||
      texture === garbageImages.TwoLine) {
    return blockWidth * 2;
  } else {
    return blockWidth;
  }
}

function garbageRenderInfo(blockDimensions) {
  if (blockDimensions.y != 1 && blockDimensions.x != 6) {
    throw "Invalid Garbage Size";
  }

  if (blockDimensions.y == 1) {
    return [
      {
        texture: singleRowGarbageTexture(blockDimensions.width),
        dimensions: new Vector(blockDimensions.width * blockWidth, blockWidth)
      }
    ];
  }

  let textures = multiRowGarbageTexture(blockDimensions.height);
  return Array.from(textures).map(texture => {
    return {
      texture,
      dimensions: new Vector(6 * blockWidth, garbageTextureHeight(texture))
    };
  });
}

export class Garbage {
  constructor(left, gridDimensions) {
    this.gridSlot = new Vector(left, previousFilledY - gridBlockDimensions.height - gridDimensions.height);
    this.gridPosition = this.gridSlot.clone();
    this.gridDimensions = gridDimensions;
    this.type = type.GARBAGE;
    this.state = state.FALLING;
    garbageBlocks.add(this);
  }

  * overlappingSlots() {
    for (let y = this.gridSlot.y + this.gridDimensions.height - 1; y >= this.gridSlot.y; y--) {
      for (let x = this.gridSlot.x; x < this.gridSlot.x + this.gridDimensions.width; x++) {
        yield new Vector(x, y);
      }
    }
  }

  gapBelow() {
    let gapBelow = true;
    for (let x = this.gridSlot.x; x < this.gridSlot.x + this.gridDimensions.x; x++) {
      if (getBlock(new Vector(x, this.gridSlot.y + this.gridDimensions.height))) {
        gapBelow = false;
        break;
      }
    }
    return gapBelow;
  }

  adjacentTo(slot) {
    for (let overlappingSlot of this.overlappingSlots()) {
      if ((Math.abs(slot.x - overlappingSlot.x) == 1 &&
           slot.y - overlappingSlot.y == 0) ||
          (Math.abs(slot.y - overlappingSlot.y) == 1 &&
           slot.x - overlappingSlot.x == 0)) {
        return true;
      }
    }
    return false;
  }

  handleFalling() {
    if (this.state === state.CLEARING) return;

    if (this.state === state.WAITING && this.gapBelow()) {
      this.state = state.FALLING;
    }

    if (this.state === state.FALLING) {
      this.gridPosition.y += fallSpeed;
      if (this.gridPosition.y > this.gridSlot.y && !this.gapBelow()) {
        this.gridPosition.y = this.gridSlot.y;
        this.state = state.WAITING;
      } else {
        let previousSlot = this.gridSlot.clone();
        let newY = Math.ceil(this.gridPosition.y);
        if (newY != this.gridSlot.y) {
          for (let slot of this.overlappingSlots()) {
            clearSlot(slot);
          }
          this.gridSlot.y = newY;
          setBlock(this);
        }
      }
    }
  }

  break() {
    this.state = state.CLEARING;
    this.timer = 0;
    this.spawnedBlocks = [];

    for (let slot of this.overlappingSlots()) {
      this.spawnedBlocks.push({
        visible: false,
        block: new Block(slot)
      });
    }
  }

  handleBreaking() {
    if (this.state === state.CLEARING) {
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
        garbageBlocks.delete(this);
        for (let spawnedBlock of this.spawnedBlocks) {
          setBlock(spawnedBlock.block);
          spawnedBlock.block.state = state.WAITING;
        }
      }

      this.timer++;
    }
  }

  renderGarbage(topLeft) {
    let renderInfos = garbageRenderInfo(this.gridDimensions);
    for (let renderInfo of renderInfos) {
      image({
        imageUrl: renderInfo.texture,
        position: topLeft,
        dimensions: renderInfo.dimensions,
        center: Vector.topLeft
      });
      topLeft = topLeft.add(new Vector(0, -renderInfo.dimensions.height));
    }
  }

  renderBreaking(topLeft) {
    for (let spawnedBlock of this.spawnedBlocks) {
      if (!spawnedBlock.visible) {
        spawnedBlock.block.render(garbageImages.Clear);
      } else {
        spawnedBlock.block.render();
      }
    }
  }

  update() {
    this.handleFalling();
    this.handleBreaking();
  }

  render() {
    let blocksTopLeft = new Vector(
      gridCenter.x - gridDimensions.width / 2,
      gridCenter.y - gridDimensions.height / 2 + blockPixelAdvancement);
    let topLeft = blocksTopLeft.add(this.gridPosition.multiply(blockWidth).multiplyParts(new Vector(1, -1))).withZ(2);

    if (this.state === state.CLEARING) {
      this.renderBreaking(topLeft);
    } else {
      this.renderGarbage(topLeft);
    }
  }
}

MatchStarted.Subscribe(matchedBlocks => {
  for (let garbage of garbageBlocks) {
    if (garbage.state == state.CLEARING) continue;
    for (let matchedBlock of matchedBlocks) {
      if (garbage.adjacentTo(matchedBlock.gridSlot)) {
        garbage.break();
        GarbageBroken.Publish({
          matchedBlocks,
          spawnedBlocks: garbage.spawnedBlocks
        });
        break;
      }
    }
  }
});

export function anyGarbageBreaking() {
  for (let garbage of garbageBlocks) {
    if (garbage.state === state.CLEARING) return true;
  }
  return false;
}


Setup.Subscribe(() => {
  setBlock(new Garbage(0, new Vector(6, 3)));
});

Update.Subscribe(() => {
  if (Math.random() < 0.002) {
    setBlock(new Garbage(0, new Vector(6, Math.floor(Math.pow(Math.random(), 3) * 3))));
  }

  if (Math.random() < 0.002) {
    setBlock(new Garbage(Math.floor(Math.random() * 3), new Vector(Math.floor(Math.random() * 3) + 3, 1)));
  }
});
