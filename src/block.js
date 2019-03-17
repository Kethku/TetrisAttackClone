import { Vector, Color } from "./math";
import { image } from "./graphics";
import { touchPosition, touchDown, touchStarted } from "./touch";
import { blocks, gridCenter, gridDimensions, gridBlockDimensions, blockWidth, blockPixelAdvancement, intentionalAdvance } from "./grid";
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
const settleVelocity = 0.5;
const swapFrameLength = 30;
const fallSpeed = 0.1;
const rotateSpeed = 0.3;

export const types = {
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
  CLEARING: "Clearing"
};

export let heldBlock = null;

function randomType() {
  let keys = Object.keys(types);
  return types[keys[Math.floor(Math.random() * keys.length)]];
}

export function deleteBlock(block) {
  blocks[block.gridSlot.y][block.gridSlot.x] = null;
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

  calculateOpacity(centerY) {
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

    return (distanceFromBottom + blockWidth) / (blockWidth * 2);
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
    if (this.state !== state.SPAWNING && !blocks[this.gridSlot.y + 1][this.gridSlot.x]) {
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

  animateBlockSize() {
    if (this.state === state.DRAGGING) {
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

  update() {
    let { center, dimensions } = this.calculateLocation();

    this.handleDragging(center, dimensions);
    this.handleFalling(center, dimensions);
    this.animateBlockSize();

    if (this.state === state.SPAWNING && touchPosition.within(center, dimensions) && touchStarted) {
      intentionalAdvance();
    }
  }

  // Blocks are positioned in a sliding grid up from the bottom starting at the
  // bottom of the grid position. The y value of the gridPosition is actually
  // reversed to prevent needing to increment all block positions as they move
  // up the screen.
  render() {
    let { center, dimensions } = this.calculateLocation();

    let opacity = this.calculateOpacity(center.y);
    let tint = new Color(1, 1, 1, opacity);

    if (this.state === state.DRAGGING) {
      center = center.withZ(10);
    }
    dimensions = dimensions.multiply(this.scale);

    image(blockImages[this.type], center, dimensions, 0, tint, Vector.center);
  }
}
