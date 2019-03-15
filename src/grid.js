import { Vector, Color } from "./math";
import { Update, Draw } from "./events";
import { image, screenSize } from "./graphics";
import { Block } from "./block";

import bang from "./images/Bang.png";

export const gridBlockDimensions = new Vector(6, 12);

const startingMargin = 0.1;

let blocks = [];

let maxStackHeight = 5;
for (let x = 0; x < gridBlockDimensions.x; x++) {
  let stackHeight = Math.floor(Math.random() * 4) + maxStackHeight - 3;
  for (let y = 0; y < stackHeight; y++) {
    blocks.push(new Block(new Vector(x, maxStackHeight - y)));
  }
}

function calculateGridPosition() {
  let gridCenter = screenSize.divide(2);

  let margin = Math.max(screenSize.width * startingMargin, screenSize.height * startingMargin);
  let maxWidth = screenSize.width - margin;
  let maxHeight = screenSize.height - margin;

  // Try Horizontal
  let gridDimensions = new Vector(maxWidth, maxWidth * 2);

  if (gridDimensions.y > maxHeight) {
    // Fallback to vertical
    gridDimensions = new Vector(maxHeight / 2, maxHeight);
  }

  return { gridCenter, gridDimensions };
}

Update.Subscribe(() => {
  let { gridCenter, gridDimensions } = calculateGridPosition();
  let blockWidth = gridDimensions.x / gridBlockDimensions.x;


  for (let block of blocks) {
    block.update(gridCenter, gridDimensions, blockWidth, (maxStackHeight + 1) * blockWidth);
  }
});

Draw.Subscribe(() => {
  let { gridCenter, gridDimensions } = calculateGridPosition();
  image(bang, gridCenter, gridDimensions, 0, new Color(0.5, 0.5, 0.5, 1));

  let blockWidth = gridDimensions.x / gridBlockDimensions.x;
  for (let block of blocks) {
    block.render(gridCenter, gridDimensions, blockWidth, (maxStackHeight + 1) * blockWidth);
  }
});
