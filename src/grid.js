import { Vector, Color } from "./math";
import { Update, Draw } from "./events";
import { image, screenSize, Resized } from "./graphics";
import { deleteBlock, heldBlock, state, Block } from "./block";

import bang from "./images/Bang.png";

/////////////////////////////
// Deal with parcel reload //
/////////////////////////////
import { refreshOnReload } from "./utils";
refreshOnReload(module);

const startingMargin = 0.05;
const maxInitialStackHeight = 5;
export const gridBlockDimensions = new Vector(6, 12);

/////////////////
// Setup State //
/////////////////

export let matches = [];
export let blocks = {};
let blockAdvancement = maxInitialStackHeight + 1;
let previousFilledY = maxInitialStackHeight;
let advanceSpeed = 0.002;

function addBlock(block) {
  if (!blocks[block.gridPosition.y]) {
    blocks[block.gridPosition.y] = [];
  }
  blocks[block.gridPosition.y][block.gridPosition.x] = block;
}

function* allBlocks() {
  for (let y = previousFilledY + 1; y--; y >= 0) {
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

///////////////////////
// Initialize Blocks //
///////////////////////
for (let x = 0; x < gridBlockDimensions.x; x++) {
  let stackHeight = Math.floor(Math.random() * 4) + maxInitialStackHeight - 3;
  for (let y = 0; y < stackHeight; y++) {
    addBlock(new Block(new Vector(x, maxInitialStackHeight - y)));
  }
}

/////////////////////
// Handle Resizing //
/////////////////////
export let gridCenter = Vector.zero;
export let gridDimensions = Vector.one;
export let blockWidth = 0;
export let blockPixelAdvancement = 0;

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

////////////////////
// Handle Matches //
////////////////////

function findMatches() {
  let matches = [];
  let currentMatch = [];
  let currentBlockType = null;
  function breakMatch(nextBlock) {
    if (currentMatch.length >= 3) {
      matches.push(currentMatch);
    }
    if (nextBlock) {
      currentMatch = [nextBlock];
      currentBlockType = nextBlock.type;
    } else {
      currentMatch = [];
      currentBlockType = null;
    }
  }

  function processBlock(block) {
    if (block && (block.state !== state.WAITING && block.state !== state.DRAGGING)) {
      breakMatch();
      return;
    }

    if (currentBlockType == null && block) {
      currentBlockType = block.type;
      currentMatch.push(block);
      return;
    }

    if (!block) {
      breakMatch();
      return;
    }

    if (block.type !== currentBlockType) {
      breakMatch(block);
    } else {
      currentMatch.push(block);
    }
  }

  for (let y = 1; y <= previousFilledY; y++) {
    let row = blocks[y];
    for (let x = 0; x < gridBlockDimensions.x; x++) {
      processBlock(row[x]);
    }
    breakMatch();
  }

  for (let x = 0; x < gridBlockDimensions.x; x++) {
    for (let y = 1; y <= previousFilledY; y++) {
      processBlock(blocks[y][x]);
    }
    breakMatch();
  }

  return matches;
}

/////////////////////////
// Intentional Advance //
/////////////////////////
export function intentionalAdvance() {
  blockAdvancement = Math.floor(blockAdvancement) + 1;
}

/////////////////////////
// Subscribe to events //
/////////////////////////
Update.Subscribe(() => {
  for (let block of allBlocks()) {
    block.update();
  }

  for (let match of findMatches()) {
    for (let block of match) {
      deleteBlock(block);
    }
  }

  blockAdvancement += advanceSpeed;
  if (blockAdvancement - 1 > previousFilledY) {
    previousFilledY++;
    for (let x = 0; x < gridBlockDimensions.x; x++) {
      addBlock(new Block(new Vector(x, previousFilledY)));
    }
  }

  blockPixelAdvancement = blockAdvancement * blockWidth;
});

Draw.Subscribe(() => {
  image(bang, gridCenter, gridDimensions, 0, new Color(0.5, 0.5, 0.5, 0.5));
  for (let block of allBlocks()) {
    block.render();
  }
});
