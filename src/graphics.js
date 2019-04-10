import { Update } from "./events";
import { imagesToDraw } from "./webgl";
import { Color, Vector } from "./math";

export function image({ imageUrl, position, dimensions, rotation = 0, tint = Color.white, center = Vector.half }) {
  let shakenPosition = position.withY(position.y + currentShake);
  imagesToDraw.push({ imageUrl, position: shakenPosition, dimensions, rotation, tint, center });
}

const shakeDecay = 0.8;
const shakeAmount = 50;

let currentShake = 0;
let cameraShake = 0;

export function shake() {
  cameraShake = shakeAmount;
}

Update.Subscribe(() => {
  cameraShake *= shakeDecay;
  currentShake = (Math.random() - 0.5) * cameraShake;
});
