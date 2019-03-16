import { Vector, Color } from "./math";
import { Update, Draw } from "./events";
import { image, screenSize, Resized } from "./graphics";
import { Block } from "./block";

import bang from "./images/Bang.png";

export const gridBlockDimensions = new Vector(6, 12);
const startingMargin = 0.1;
const maxInitialStackHeight = 5;

///////////////////////
// Initialize Blocks //
///////////////////////
let blocks = [];
let blockAdvancement = maxInitialStackHeight + 1;
let previousFilledY = maxInitialStackHeight;
let advanceSpeed = 0.002;
for (let x = 0; x < gridBlockDimensions.x; x++) {
  let stackHeight = Math.floor(Math.random() * 4) + maxInitialStackHeight - 3;
  for (let y = 0; y < stackHeight; y++) {
    blocks.push(new Block(new Vector(x, maxInitialStackHeight - y)));
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

/////////////////////////
// Subscribe to events //
/////////////////////////
Update.Subscribe(() => {
  for (let block of blocks) {
    block.update();
  }
  blockAdvancement += advanceSpeed;
  if (blockAdvancement - 1 > previousFilledY) {
    previousFilledY++;
    for (let x = 0; x < gridBlockDimensions.x; x++) {
      blocks.push(new Block(new Vector(x, previousFilledY)));
    }
  }

  blockPixelAdvancement = blockAdvancement * blockWidth;
});

Draw.Subscribe(() => {
  image(bang, gridCenter, gridDimensions, 0, new Color(0.5, 0.5, 0.5, 0.5));
  for (let block of blocks) {
    block.render();
  }
});
