import { Vector, Color } from "./math";
import { image } from "./graphics";
import { touchPosition, touchDown, touchStarted } from "./touch";
import { blocks, gridCenter, gridDimensions, gridBlockDimensions, blockWidth, blockPixelAdvancement, intentionalAdvance } from "./grid";
import { clearingTime } from "./match";
import blockImages from "./images/*.png";

/////////////////////////////
// Deal with parcel reload //
/////////////////////////////
import { refreshOnReload } from "./utils";
refreshOnReload(module);

const pickingUpFrameLength = 5;
const pickedUpScale = 1.2;
const maxDragVelocity = 0.9;
const scaleVelocity = 0.08;
const settleVelocity = 0.7;
const swapFrameLength = 30;
const fallSpeed = 0.3;
const rotateSpeed = 0.3;

export const type = {
  CIRCLE: "Circle",
  TRIANGLE_UP: "TriangleUp",
  TRIANGLE_DOWN: "TriangleDown",
  DIAMOND: "Diamond",
  STAR: "Star",
  HEART: "Heart",
  BANG: "Bang"
};

export const state = {
  WAITING: "Waiting",
  SPAWNING: "Spawning",
  DRAGGING: "Dragging",
  FALLING: "Falling",
  MATCHED: "Matched",
  CLEARING: "Clearing",
  CLEARED: "Cleared"
};

export let heldBlock = null;

function randomType() {
  let keys = Object.keys(type);
  return type[keys[Math.floor(Math.random() * keys.length)]];
}

export function deleteBlock(block) {
  blocks[block.gridSlot.y][block.gridSlot.x] = null;
  dropBlock(block);
}

export function dropBlock(block) {
  if (heldBlock === block) heldBlock = null;
}

export class Block {
  constructor(gridSlot) {
    this.type = randomType();
    this.gridSlot = gridSlot;
    this.gridPosition = gridSlot.clone();
    this.state = state.SPAWNING;
    this.scale = 1;
  }

  calculateLocation() {
    let blocksTopLeft = new Vector(
      gridCenter.x - gridDimensions.width / 2,
      gridCenter.y - gridDimensions.height / 2 + blockPixelAdvancement);

    // To get the actual position of a block, add the block position times the
    // block width with the y axis reversed.
    let topLeft = blocksTopLeft.add(this.gridPosition.multiply(blockWidth).multiplyParts(new Vector(1, -1)));
    let dimensions = new Vector(blockWidth, blockWidth);

    return { center: topLeft.add(dimensions.divide(2).multiplyParts(new Vector(1, -1))), dimensions };
  }

  calculateColor(centerY) {
    if (this.state === state.MATCHED) {
      return new Color(1.5, 1.5, 1.5, 1);
    } else if (this.state === state.CLEARING) {
      let percentageDone = this.clearTimer / clearingTime;
      return new Color(1, 1, 1, 1 - percentageDone);
    } else if (this.state === state.CLEARED) {
      return Color.clear;
    } else if (this.state === state.SPAWNING) {
      let gridBottom = gridCenter.y - gridDimensions.height / 2;
      let blockBottom = centerY - blockWidth / 2;
      let distanceFromBottom = blockBottom - gridBottom;

      if (distanceFromBottom >= 0) {
        if (this.state === state.SPAWNING) {
          this.state = state.WAITING;
        }
        return 1;
      }
      if (distanceFromBottom < -blockWidth) return 0;

      return new Color(1, 1, 1, (distanceFromBottom + blockWidth) / (blockWidth * 2));
    } else {
      return Color.white;
    }
  }

  animateBlockSize() {
    if (this.state === state.CLEARING) {
      this.scale += 0.01;
    } else if (this.state === state.DRAGGING) {
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

  handleDragging(center, dimensions) {
    if (touchDown) {
      if (heldBlock == null) {
        // Start Dragging
        if (this.state === state.WAITING && touchPosition.within(center, dimensions) && touchStarted) {
          this.state = state.DRAGGING;
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
          let leftBlock = blocks[this.gridSlot.y][this.gridSlot.x - 1];
          if (leftBlock && leftBlock.state !== state.WAITING) {
            if (this.gridPosition.x < this.gridSlot.x) {
              this.gridPosition.x = this.gridSlot.x;
            }
          }
        }

        if (this.gridSlot.x < 5) {
          let rightBlock = blocks[this.gridSlot.y][this.gridSlot.x + 1];
          if (rightBlock && rightBlock.state !== state.WAITING) {
            if (this.gridPosition.x > this.gridSlot.x) {
              this.gridPosition.x = this.gridSlot.x;
            }
          }
        }

        if (this.gridPosition.x < 0) this.gridPosition.x = 0;
        if (this.gridPosition.x > 5) this.gridPosition.x = 5;

        this.gridSlot.x = Math.round(this.gridPosition.x);

        if (previousSlotX !== this.gridSlot.x) {
          let blockInTheWay = blocks[this.gridSlot.y][this.gridSlot.x];
          blocks[this.gridSlot.y][this.gridSlot.x] = this;
          blocks[this.gridSlot.y][previousSlotX] = blockInTheWay;

          if (blockInTheWay) {
            blockInTheWay.gridSlot.x = previousSlotX;
          }
        }
      }
    } else if (this.state === state.DRAGGING) {
      // Stop Dragging
      this.state = state.WAITING;
      heldBlock = null;
    }

    if (this.state !== state.DRAGGING) {
      // Bounced Back to Grid
      this.gridPosition.x += (this.gridSlot.x - this.gridPosition.x) * settleVelocity;
    }
  }

  handleFalling(center, dimensions) {
    if (this.state === state.SPAWNING ||
        this.state === state.MATCHED ||
        this.state === state.CLEARING ||
        this.state === state.CLEARED) {
      return;
    }

    if (!blocks[this.gridSlot.y + 1][this.gridSlot.x]) {
      this.state = state.FALLING;
      if (heldBlock === this) heldBlock = null;
    }

    if (this.state === state.FALLING) {
      this.gridPosition.y += fallSpeed;
      if (this.gridPosition.y > this.gridSlot.y && blocks[this.gridSlot.y + 1][this.gridSlot.x]) {
        this.gridPosition.y = this.gridSlot.y;
        this.state = state.WAITING;
      } else {
        let previousSlot = this.gridSlot.clone();
        this.gridSlot.y = Math.ceil(this.gridPosition.y);
        if (!previousSlot.equals(this.gridSlot)) {
          blocks[previousSlot.y][previousSlot.x] = null;
          blocks[this.gridSlot.y][this.gridSlot.x] = this;
        }
      }
    }
  }

  handleClearAnimation() {
    if (this.state === state.CLEARING) {
      if (!this.clearTimer) this.clearTimer = 0;
      this.clearTimer++;

      let percentDone = this.clearTimer / clearingTime;
      if (this.clearTimer >= clearingTime) {
        this.state = state.CLEARED;
      }
    }
  }

  update() {
    let { center, dimensions } = this.calculateLocation();

    this.handleDragging(center, dimensions);
    this.handleFalling(center, dimensions);
    this.animateBlockSize();
    this.handleClearAnimation();

    if (this.state === state.SPAWNING && touchPosition.within(center, dimensions) && touchStarted) {
      intentionalAdvance();
    }
  }

  render() {
    let { center, dimensions } = this.calculateLocation();

    let tint = this.calculateColor(center.y);
    if (this.state === state.DRAGGING || this.state === state.CLEARING) {
      center = center.withZ(10);
    }
    dimensions = dimensions.multiply(this.scale);

    image(blockImages[this.type], center, dimensions, 0, tint, Vector.center);
  }
}
