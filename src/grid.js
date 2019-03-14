import { Update, Draw } from "./events";
import { image, width, height } from "./graphics";
import { Block } from "./block";

import bang from "./images/Bang.png";

export const gridBlockWidth = 6;
export const gridBlockHeight = 12;

const startingMargin = 0.1;

let blocks = [];

let maxStackHeight = 5;
for (let x = 0; x < gridBlockWidth; x++) {
  let stackHeight = Math.floor(Math.random() * 4) + maxStackHeight - 3;
  for (let y = 0; y < stackHeight; y++) {
    blocks.push(new Block(x, maxStackHeight - y));
  }
}

function calculateGridPosition() {
  let margin = Math.max(width * startingMargin, height * startingMargin);
  let maxWidth = width - margin;
  let maxHeight = height - margin;

  // Try Horizontal
  let gridWidth = maxWidth;
  let gridHeight = gridWidth * 2;

  if (gridHeight > maxHeight) {
    // Fallback to vertical
    gridHeight = maxHeight;
    gridWidth = gridHeight / 2;
  }

  let gridLeft = (width - gridWidth) / 2;
  let gridTop = (height - gridHeight) / 2 + gridHeight;

  let blockWidth = gridHeight / gridBlockHeight;

  return { gridWidth, gridHeight, gridLeft, gridTop, blockWidth };
}

Draw.Subscribe(() => {
  let { gridWidth, gridHeight, gridLeft, gridTop, blockWidth } = calculateGridPosition();
  let blocksTop = gridTop - gridHeight + maxStackHeight * blockWidth;

  image(bang, gridLeft + gridWidth / 2, gridTop - gridHeight / 2, gridWidth, gridHeight);

  for (let block of blocks) {
    block.render(gridLeft, blocksTop, gridWidth);
  }
});
