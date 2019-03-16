import { Vector, Color } from "./math";
import { image } from "./graphics";
import { touchPosition, touchDown } from "./touch";
import { gridCenter, gridDimensions, blockWidth, blockPixelAdvancement } from "./grid";
import blockImages from "./images/*.png";

const types = {
  CIRCLE: "Circle",
  TRIANGLE_UP: "TriangleUp",
  TRIANGLE_DOWN: "TriangleDown",
  DIAMOND: "Diamond",
  STAR: "Star",
  HEART: "Heart",
  BANG: "Bang"
};

function randomType() {
  let keys = Object.keys(types);
  return types[keys[Math.floor(Math.random() * keys.length)]];
}

export class Block {
  constructor(blockPosition) {
    this.type = randomType();
    this.blockPosition = blockPosition;
    this.enabled = false;
  }

  calculateLocation() {
    let blocksTopLeft = new Vector(
      gridCenter.x - gridDimensions.width / 2,
      gridCenter.y - gridDimensions.height / 2 + blockPixelAdvancement);

    // To get the actual position of a block, add the block position times the
    // block width with the y axis reversed.
    let topLeft = blocksTopLeft.add(this.blockPosition.multiply(blockWidth).multiplyParts(new Vector(1, -1)));
    let dimensions = new Vector(blockWidth, blockWidth);

    return { topLeft, dimensions };
  }

  calculateOpacity(blockTop) {
    let gridBottom = gridCenter.y - gridDimensions.height / 2;
    let amountBelow = (blockTop - blockWidth) - gridBottom;

    if (amountBelow >= 0) {
      this.enabled = true;
      return 1;
    }
    if (amountBelow < -blockWidth) return 0;

    return (amountBelow + blockWidth) / (blockWidth * 2);
  }

  update() {
    let { topLeft, dimensions } = this.calculateLocation();

    if (touchDown) {
      if (touchPosition.x >= topLeft.x && touchPosition.x <= topLeft.x + dimensions.width &&
          touchPosition.y <= topLeft.y && touchPosition.y >= topLeft.y - dimensions.height) {
        this.type = randomType();
      }
    }
  }

  // Blocks are positioned in a sliding grid up from the bottom starting at the
  // bottom of the grid position. The y value of the blockPosition is actually
  // reversed to prevent needing to increment all block positions as they move
  // up the screen.
  render() {
    let { topLeft, dimensions } = this.calculateLocation();

    let opacity = this.calculateOpacity(topLeft.y);
    let tint = new Color(1, 1, 1, opacity);
    image(blockImages[this.type], topLeft, dimensions, 0, tint, Vector.topLeft);
  }
}
