import { Vector, Color } from "./math";
import { Update, Draw } from "./events";
import { image, screenSize, Resized } from "./graphics";
import { deleteBlock, heldBlock, state, type, Block } from "./block";
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

export function setBlock(arg) {
  if (arg.type) {
    if (!blocks[arg.gridSlot.y]) {
      blocks[arg.gridSlot.y] = [];
    }
    blocks[arg.gridSlot.y][arg.gridSlot.x] = arg;
  }
  else {
    if (blocks[arg.y]) {
      delete blocks[arg.y][arg.x];
    }
  }
}

export function* allBlocks() {
  for (let y in blocks) {
    let row = blocks[y];
    if (row) {
      for (let block of row) {
        if (block) {
          yield block;
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

Draw.Subscribe(() => {
  image(blockImages[type.BANG], gridCenter, gridDimensions, 0, new Color(0.5, 0.5, 0.5, 0.5));
  for (let block of allBlocks()) {
    block.render();
  }
});
