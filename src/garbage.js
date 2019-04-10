import { Setup, Update } from "./events";
import { previousFilledY, blockPixelAdvancement } from "./advance";
import { gridBlockDimensions, gridCenter, gridDimensions, blockWidth, getBlock, clearSlot, setBlock } from "./grid";
import { garbageRenderInfo } from "./garbageRenderUtils";
import { image, shake } from "./graphics";
import { type, state, fallSpeed } from "./block";
import { Vector } from "./math";
import { EventManager1 } from "./eventManager";

export const garbageBlocks = new Set();

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
      if (slot.adjacentTo(overlappingSlot)) return true;
    }
    return false;
  }

  calculateTopLeft() {
    let blocksTopLeft = new Vector(
      gridCenter.x - gridDimensions.width / 2,
      gridCenter.y - gridDimensions.height / 2 + blockPixelAdvancement);
    return blocksTopLeft.add(this.gridPosition.multiply(blockWidth).multiplyParts(new Vector(1, -1))).withZ(2);
  }

  update() {
    if (this.state === state.CLEARING) return;

    if (this.state === state.WAITING && this.gapBelow()) {
      this.state = state.FALLING;
    }

    if (this.state === state.FALLING) {
      this.gridPosition.y += fallSpeed;
      if (this.gridPosition.y > this.gridSlot.y && !this.gapBelow()) {
        this.gridPosition.y = this.gridSlot.y;
        if (this.state !== state.WAITING) {
          shake();
          this.state = state.WAITING;
        }
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

  render() {
    let topLeft = this.calculateTopLeft();

    if (this.state !== state.CLEARING) {
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
  }
}

Setup.Subscribe(() => {
  setBlock(new Garbage(0, new Vector(6, 3)));
});

Update.Subscribe(() => {
  if (Math.random() < 0.002) {
    setBlock(new Garbage(0, new Vector(6, Math.floor(Math.pow(Math.random(), 3) * 3))));
  }

  if (Math.random() < 0.002) {
    let width = Math.floor(Math.random() * 3) + 3;
    setBlock(new Garbage(Math.floor(Math.random() * (6 - width)), new Vector(width, 1)));
  }
});
