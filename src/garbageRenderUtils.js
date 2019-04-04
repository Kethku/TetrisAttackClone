import { garbageImages } from "./images";
import { blockWidth } from "./grid";
import { Vector } from "./math";

export function singleRowGarbageTexture(width) {
  switch (width) {
  case 3:
    return garbageImages.ThreeWide;
  case 4:
    return garbageImages.FourWide;
  case 5:
    return garbageImages.FiveWide;
  case 6:
    return garbageImages.SingleLine;
  default:
    throw "Invalid single high block.";
  }
}

export function* multiRowGarbageTexture(height) {
  if (height == 1) yield garbageImages.SingleLine;
  else if (height == 2) yield garbageImages.TwoLine;
  else {
    let middleBlockHeight = 2 - (height % 2);
    let remainingMiddles = height - 2 - middleBlockHeight;
    yield garbageImages.TopLine;
    for (let i = 0; i < remainingMiddles / 2; i++) {
      yield garbageImages.MiddleLineNoExclamationPoint;
    }
    yield height % 2 == 0
      ? garbageImages.EvenMiddleLine
      : garbageImages.MiddleLine;
    for (let i = 0; i < remainingMiddles / 2; i++) {
      yield garbageImages.MiddleLineNoExclamationPoint;
    }
    yield garbageImages.BottomLine;
  }
}

export function garbageTextureHeight(texture) {
  if (texture === garbageImages.EvenMiddleLine ||
      texture === garbageImages.TwoLine) {
    return blockWidth * 2;
  } else {
    return blockWidth;
  }
}

export function garbageRenderInfo(blockDimensions) {
  if (blockDimensions.y != 1 && blockDimensions.x != 6) {
    throw "Invalid Garbage Size";
  }

  if (blockDimensions.y == 1) {
    return [
      {
        texture: singleRowGarbageTexture(blockDimensions.width),
        dimensions: new Vector(blockDimensions.width * blockWidth, blockWidth)
      }
    ];
  }

  let textures = multiRowGarbageTexture(blockDimensions.height);
  return Array.from(textures).map(texture => {
    return {
      texture,
      dimensions: new Vector(6 * blockWidth, garbageTextureHeight(texture))
    };
  });
}
