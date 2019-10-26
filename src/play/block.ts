import { Vector, Color } from "../math";
import { image } from "../renderer/graphics";
import { touchPosition, touchDown, touchStarted } from "../touch";
import { getBlock, setBlock, clearSlot, gridToScreen, gridCenter, gridDimensions, gridBlockDimensions, blockWidth } from "./grid";
import { intentionalAdvance, isInLosingPosition } from "./advance";
import { clearingTime } from "./match";
import { blockImages } from "../renderer/images";

const pickedUpScale = 1.2;
const maxDragVelocity = 0.9;
const scaleVelocity = 0.08;
const settleVelocity = 0.7;

export const fallSpeed = 0.3;

export enum BlockType {
  Cloud = "Cloud",
  Moon = "Moon",
  Leaf = "Leaf",
  Rain = "Rain",
  Stick = "Stick",
  Sun = "Sun",
  Bang = "Bang",
  Garbage = "Garbage"
}

export const standardBlocks = [
  BlockType.Cloud,
  BlockType.Moon,
  BlockType.Sun,
  BlockType.Leaf,
  BlockType.Rain,
  BlockType.Stick
];

export enum BlockState {
  Waiting,
  Spawning,
  Dragging,
  Falling,
  Matched,
  Clearing,
  Cleared
};

export const volatileStates = [
  BlockState.Matched,
  BlockState.Clearing,
  BlockState.Cleared
];

export let heldBlock = null;

function randomType() {
  return standardBlocks[Math.floor(Math.random() * standardBlocks.length)];
}

export function deleteBlock(block: Block) {
  clearSlot(block.gridSlot);
  dropBlock(block);
}

export function dropBlock(block: Block) {
  if (heldBlock === block) heldBlock = null;
}

export class Block {
  public type: BlockType;
  public gridSlot: Vector;
  public gridPosition: Vector;
  public state: BlockState;
  public scale: number;

  clearTimer: number;
  dragOffset: Vector;

  constructor(gridSlot: Vector) {
    this.type = randomType();
    this.gridSlot = gridSlot;
    this.gridPosition = gridSlot.clone();
    this.state = BlockState.Spawning;
    this.scale = 1;
  }

  * overlappingSlots() {
    yield this.gridSlot;
  }

  calculateColor(centerY: number, frame: number, dangerColumns: Set<number>) {
    if (this.state === BlockState.Matched) {
      return new Color(1.5, 1.5, 1.5, 1);
    } else if (this.state === BlockState.Clearing) {
      let percentageDone = this.clearTimer / clearingTime;
      return new Color(1, 1, 1, 1 - percentageDone);
    } else if (this.state === BlockState.Cleared) {
      return Color.clear;
    } else if (this.state === BlockState.Spawning) {
      let gridBottom = gridCenter.y - gridDimensions.height / 2;
      let blockBottom = centerY - blockWidth / 2;
      let distanceFromBottom = blockBottom - gridBottom;

      if (distanceFromBottom >= 0) {
        if (this.state === BlockState.Spawning) {
          this.state = BlockState.Waiting;
        }
        return Color.white;
      }
      if (distanceFromBottom < -blockWidth) return Color.black;

      return new Color(1, 1, 1, (distanceFromBottom + blockWidth) / (blockWidth * 2));
    } else if (isInLosingPosition() && dangerColumns.has(this.gridSlot.x)) {
      return Color.gray;
    } else if (dangerColumns.has(this.gridSlot.x)) {
      let gray = 1 + Math.sin(frame / 5) / 4;
      return new Color(gray, gray, gray);
    } else {
      return Color.white;
    }
  }

  animateBlockSize() {
    if (this.state === BlockState.Clearing) {
      this.scale += 0.01;
    } else if (this.state === BlockState.Dragging) {
      if (this.scale < pickedUpScale) {
        this.scale += scaleVelocity;
      } else {
        this.scale = pickedUpScale;
      }
    } else {
      if (this.scale > 1) {
        this.scale -= scaleVelocity;
      } else {
        this.scale = 1;
      }
    }
  }

  handleDragging(center: Vector, dimensions: Vector) {
    if (touchDown) {
      if (heldBlock == null) {
        // Start Dragging
        if (this.state === BlockState.Waiting && touchPosition.within(center, dimensions) && touchStarted) {
          this.state = BlockState.Dragging;
          this.dragOffset = touchPosition.subtract(center);
          heldBlock = this;
        }
      } else if (heldBlock === this) {
        // Handle Dragged Block
        let previousSlotX = this.gridSlot.x;

        let correctedTouchX = touchPosition.x - this.dragOffset.x - blockWidth / 2;
        let gridLeft = gridCenter.x - gridDimensions.width / 2;
        let newGridXTarget = (correctedTouchX - gridLeft) * gridBlockDimensions.width / gridDimensions.width;

        let diff = newGridXTarget - this.gridPosition.x;
        if (diff > maxDragVelocity) diff = maxDragVelocity;
        if (diff < -maxDragVelocity) diff = -maxDragVelocity;

        this.gridPosition.x += diff;

        // Handle Boundaries
        if (this.gridSlot.x > 0) {
          let leftBlock = getBlock(this.gridSlot.withX(this.gridSlot.x - 1));
          if (leftBlock && (leftBlock.state !== BlockState.Waiting || leftBlock.type === BlockType.Garbage)) {
            if (this.gridPosition.x < this.gridSlot.x) {
              this.gridPosition.x = this.gridSlot.x;
            }
          }
        }

        if (this.gridSlot.x < 5) {
          let rightBlock = getBlock(this.gridSlot.withX(this.gridSlot.x + 1));
          if (rightBlock && (rightBlock.state !== BlockState.Waiting || rightBlock.type === BlockType.Garbage)) {
            if (this.gridPosition.x > this.gridSlot.x) {
              this.gridPosition.x = this.gridSlot.x;
            }
          }
        }

        if (this.gridPosition.x < 0) this.gridPosition.x = 0;
        if (this.gridPosition.x > 5) this.gridPosition.x = 5;

        this.gridSlot.x = Math.round(this.gridPosition.x);

        if (previousSlotX !== this.gridSlot.x) {
          let blockInTheWay = getBlock(this.gridSlot);
          setBlock(this);

          if (blockInTheWay) {
            blockInTheWay.gridSlot.x = previousSlotX;
            setBlock(blockInTheWay);
          } else {
            clearSlot(this.gridSlot.withX(previousSlotX));
          }
        }
      }
    } else if (this.state === BlockState.Dragging) {
      // Stop Dragging
      this.state = BlockState.Waiting;
      heldBlock = null;
    }

    if (this.state !== BlockState.Dragging) {
      // Bounced Back to Grid
      this.gridPosition.x += (this.gridSlot.x - this.gridPosition.x) * settleVelocity;
    }
  }

  handleFalling() {
    if (this.state === BlockState.Spawning ||
        this.state === BlockState.Matched ||
        this.state === BlockState.Clearing ||
        this.state === BlockState.Cleared) {
      return;
    }

    if (!getBlock(this.gridSlot.withY(this.gridSlot.y + 1))) {
      this.state = BlockState.Falling;
      if (heldBlock === this) heldBlock = null;
    }

    if (this.state === BlockState.Falling) {
      this.gridPosition.y += fallSpeed;
      if (this.gridPosition.y > this.gridSlot.y && getBlock(this.gridSlot.withY(this.gridSlot.y + 1))) {
        this.gridPosition.y = this.gridSlot.y;
        this.state = BlockState.Waiting;
      } else {
        let previousSlot = this.gridSlot.clone();
        this.gridSlot.y = Math.ceil(this.gridPosition.y);
        if (!previousSlot.equals(this.gridSlot)) {
          clearSlot(previousSlot);
          setBlock(this);
        }
      }
    }
  }

  handleClearAnimation() {
    if (this.state === BlockState.Clearing) {
      if (!this.clearTimer) this.clearTimer = 0;
      this.clearTimer++;

      if (this.clearTimer >= clearingTime) {
        this.state = BlockState.Cleared;
      }
    }
  }

  update() {
    let { position, dimensions } = gridToScreen({
      position: this.gridPosition.add(Vector.half),
      dimensions: Vector.one
    });

    this.handleDragging(position, dimensions);
    this.handleFalling();
    this.animateBlockSize();
    this.handleClearAnimation();

    if (this.state === BlockState.Spawning &&
        touchPosition.within(position, dimensions) &&
        touchStarted) {
      intentionalAdvance();
    }
  }

  render(frame: number, dangerColumns: Set<number>) {
    let { position, dimensions } = gridToScreen({
      position: this.gridPosition.add(Vector.half),
      dimensions: Vector.one
    });

    let tint = this.calculateColor(position.y, frame, dangerColumns);
    if (this.state === BlockState.Dragging || this.state === BlockState.Clearing) {
      position = position.withZ(10);
    }

    let heldDimensions = dimensions.multiply(this.scale);
    let shadowOffset = (heldDimensions.width - dimensions.width);

    if (shadowOffset >= 0.1) {
      image({
        imageUrl: blockImages[this.type],
        position: position.add(new Vector(shadowOffset, -shadowOffset))
                          .withZ(shadowOffset),
        dimensions,
        tint: new Color(0, 0, 0, tint.a * 0.4)
      });
    }

    image({
      imageUrl: blockImages[this.type],
      position: position.withZ(position.z + shadowOffset),
      dimensions: heldDimensions,
      tint
    });
  }
}
