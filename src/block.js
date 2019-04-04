import { Vector, Color } from "./math";
import { image } from "./graphics";
import { touchPosition, touchDown, touchStarted } from "./touch";
import { getBlock, setBlock, clearSlot, gridCenter, gridDimensions, gridBlockDimensions, blockWidth } from "./grid";
import { intentionalAdvance, blockPixelAdvancement, previousFilledY } from "./advance";
import { clearingTime } from "./match";
import { blockImages } from "./images";

const pickingUpFrameLength = 5;
const pickedUpScale = 1.2;
const maxDragVelocity = 0.9;
const scaleVelocity = 0.08;
const settleVelocity = 0.7;
const swapFrameLength = 30;
const rotateSpeed = 0.3;

export const fallSpeed = 0.3;

export const type = {
  STICK: "Stick",
  SUN: "Sun",
  CLOUD: "Cloud",
  LEAF: "Leaf",
  MOON: "Moon",
  RAIN: "Rain",
  BANG: "Bang",
  GARBAGE: "Garbage"
};

export const standardBlocks = [
  type.STICK,
  type.SUN,
  type.CLOUD,
  type.LEAF,
  type.MOON,
  type.RAIN
];

export const state = {
  WAITING: "Waiting",
  SPAWNING: "Spawning",
  DRAGGING: "Dragging",
  FALLING: "Falling",
  MATCHED: "Matched",
  CLEARING: "Clearing",
  CLEARED: "Cleared",
};

export const volatileStates = [
  state.MATCHED,
  state.CLEARING,
  state.CLEARED
];

export let heldBlock = null;

function randomType() {
  return standardBlocks[Math.floor(Math.random() * standardBlocks.length)];
}

export function deleteBlock(block) {
  clearSlot(block.gridSlot);
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

  overlappingSlots() {
    return [ this.gridSlot ];
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
          let leftBlock = getBlock(this.gridSlot.withX(this.gridSlot.x - 1));
          if (leftBlock && (leftBlock.state !== state.WAITING || leftBlock.type === type.GARBAGE)) {
            if (this.gridPosition.x < this.gridSlot.x) {
              this.gridPosition.x = this.gridSlot.x;
            }
          }
        }

        if (this.gridSlot.x < 5) {
          let rightBlock = getBlock(this.gridSlot.withX(this.gridSlot.x + 1));
          if (rightBlock && (rightBlock.state !== state.WAITING || rightBlock.type === type.GARBAGE)) {
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

  handleFalling() {
    if (this.state === state.SPAWNING ||
        this.state === state.MATCHED ||
        this.state === state.CLEARING ||
        this.state === state.CLEARED) {
      return;
    }

    if (!getBlock(this.gridSlot.withY(this.gridSlot.y + 1))) {
      this.state = state.FALLING;
      if (heldBlock === this) heldBlock = null;
    }

    if (this.state === state.FALLING) {
      this.gridPosition.y += fallSpeed;
      if (this.gridPosition.y > this.gridSlot.y && getBlock(this.gridSlot.withY(this.gridSlot.y + 1))) {
        this.gridPosition.y = this.gridSlot.y;
        this.state = state.WAITING;
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
    this.handleFalling();
    this.animateBlockSize();
    this.handleClearAnimation();

    if (this.state === state.SPAWNING && touchPosition.within(center, dimensions) && touchStarted) {
      intentionalAdvance();
    }
  }

  render(texture) {
    let { center, dimensions } = this.calculateLocation();

    let tint = this.calculateColor(center.y);
    if (this.state === state.DRAGGING || this.state === state.CLEARING) {
      center = center.withZ(10);
    }

    let heldDimensions = dimensions.multiply(this.scale);
    let shadowOffset = (heldDimensions.width - dimensions.width);

    if (shadowOffset >= 0.1) {
      image({
        imageUrl: texture || blockImages[this.type],
        position: center.add(new Vector(shadowOffset, -shadowOffset)).withZ(0),
        dimensions,
        tint: new Color(0, 0, 0, tint.a * 0.4)
      });
    }

    image({
      imageUrl: texture || blockImages[this.type],
      position: center,
      dimensions: heldDimensions,
      tint
    });
  }
}
