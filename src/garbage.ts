import { Update } from "./events";
import { previousFilledY } from "./advance";
import { gridBlockDimensions, gridToScreen, blockWidth, getBlock, clearSlot, setBlock } from "./grid";
import { garbageImages } from "./images";
import { image, shake } from "./graphics";
import { BlockType, BlockState, fallSpeed } from "./block";
import { Vector } from "./math";

export const garbageBlocks = new Set();

function singleRowGarbageTexture(width: number) {
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

export class Garbage {
  public gridSlot: Vector;
  public gridPosition: Vector;
  public gridDimensions: Vector;
  public type: BlockType;
  public state: BlockState;

  constructor(gridSlot: Vector, gridDimensions: Vector) {
    this.gridSlot = gridSlot;
    this.gridPosition = this.gridSlot.clone();
    this.gridDimensions = gridDimensions;
    this.type = BlockType.Garbage;
    this.state = BlockState.Falling;
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

  adjacentTo(slot: Vector) {
    for (let overlappingSlot of this.overlappingSlots()) {
      if (slot.adjacentTo(overlappingSlot)) return true;
    }
    return false;
  }

  update() {
    if (this.state === BlockState.Clearing) return;

    if (this.state === BlockState.Waiting && this.gapBelow()) {
      this.state = BlockState.Falling;
    }

    if (this.state === BlockState.Falling) {
      this.gridPosition.y += fallSpeed;
      if (this.gridPosition.y > this.gridSlot.y && !this.gapBelow()) {
        this.gridPosition.y = this.gridSlot.y;
        shake();
        this.state = BlockState.Waiting;
      } else {
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
    let { position, dimensions } = gridToScreen({
      position: this.gridPosition
        .withZ(-0.1),
      dimensions: this.gridDimensions
    });

    for (let i = 0; i < this.gridDimensions.height; i++) {
      image({
        imageUrl: singleRowGarbageTexture(this.gridDimensions.width),
        position: position.withY(position.y - i * blockWidth).withZ(-0.1),
        dimensions: new Vector(dimensions.width, blockWidth),
        center: Vector.topLeft
      });
    }
  }
}

Update.Subscribe(() => {
  let gridTop = previousFilledY - gridBlockDimensions.height;

  if (Math.random() < 0.002) {
    let height = Math.floor(Math.pow(Math.random(), 3) * 3);
    let top = gridTop + height;
    let newGarbage = new Garbage(new Vector(0, top), new Vector(6, height));
    setBlock(newGarbage);
    garbageBlocks.add(newGarbage);
  }

  if (Math.random() < 0.002) {
    let top = gridTop;
    let width = Math.floor(Math.random() * 3) + 3;
    let left = Math.floor(Math.random() * (6 - width));
    let newGarbage = new Garbage(new Vector(left, top), new Vector(width, 1));
    setBlock(newGarbage);
    garbageBlocks.add(newGarbage);
  }
});
