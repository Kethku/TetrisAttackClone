import { Vector, Color } from "./math";
import { Update, Draw } from "./events";
import { image, screenSize, Resized } from "./graphics";
import { deleteBlock, heldBlock, state, type, Block, standardBlocks } from "./block";
import { matches } from "./match";
import { blockImages } from "./images";

const startingMargin = 0.05;
export const gridBlockDimensions = new Vector(6, 12);

/////////////////
// Setup State //
/////////////////
let blocks = {};

export function getBlock(gridSlot) {
  let row = blocks[gridSlot.y];
  if (row) {
    return row[gridSlot.x];
  }
  return undefined;
}

export function setBlock(block) {
  let topLeft = block.gridSlot;

  for (let overlappingSlot of block.overlappingSlots()) {
    if (!blocks[overlappingSlot.y]) {
      blocks[overlappingSlot.y] = [];
    }
    blocks[overlappingSlot.y][overlappingSlot.x] = block;
  }
}

export function clearSlot(position) {
  if (blocks[position.y]) {
    delete blocks[position.y][position.x];
  }
}

export function* allBlocks() {
  let seenBlocks = new Set();

  let rowYValues = Object.keys(blocks);
  let topRow = Math.min(...rowYValues);
  let bottomRow = Math.max(...rowYValues);
  for (let y = bottomRow + 1; y >= topRow; y--) {
    let row = blocks[y];
    if (row) {
      for (let block of row) {
        if (block && !seenBlocks.has(block)) {
          yield block;
          seenBlocks.add(block);
        }
      }
    }
  }
}

/////////////////////
// Handle Resizing //
/////////////////////
export let gridCenter = Vector.zero;
export let gridDimensions = Vector.one;
export let blockWidth = 0;

function calculateGridSizes() {
  gridCenter = screenSize.divide(2);

  let margin = Math.max(screenSize.width * startingMargin, screenSize.height * startingMargin);
  let maxWidth = screenSize.width - margin;
  let maxHeight = screenSize.height - margin;

  // Try Horizontal
  gridDimensions = new Vector(maxWidth, maxWidth * 2);

  if (gridDimensions.y > maxHeight) {
    // Fallback to vertical
    gridDimensions = new Vector(maxHeight / 2, maxHeight);
  }

  blockWidth = gridDimensions.x / gridBlockDimensions.x;
}
Resized.Subscribe(calculateGridSizes);
calculateGridSizes();

/////////////////////////
// Subscribe to events //
/////////////////////////
Update.Subscribe(() => {
  for (let block of allBlocks()) {
    block.update();
  }
});

let background = standardBlocks[Math.floor(Math.random() * standardBlocks.length)];

Draw.Subscribe(() => {
  image({
    imageUrl: blockImages[background],
    position: gridCenter.withZ(-5),
    dimensions: gridDimensions,
    tint: new Color(0.5, 0.5, 0.5, 0.5)
  });

  for (let block of allBlocks()) {
    block.render();
  }
});
