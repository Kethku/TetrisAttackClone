import { gridBlockWidth } from "./grid";
import { image } from "./graphics";
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
  constructor(gridX, gridY) {
    this.type = randomType();
    this.blockLeft = gridX;
    this.blockTop = gridY;
  }

  render(gridLeft, blocksTop, gridWidth) {
    let blockWidth = gridWidth / gridBlockWidth;
    let centerX = gridLeft + blockWidth * this.blockLeft + blockWidth / 2;
    let centerY = blocksTop - blockWidth * this.blockTop + blockWidth / 2;
    image(blockImages[this.type], centerX, centerY, blockWidth, blockWidth);
  }
}
