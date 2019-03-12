import "babel-polyfill";

import { image, drawToScreen, loadTextures, width, height } from "./graphics";
import images from "./images/*.png";

let imageUrls = Object.values(images);

let time = 0;
function loop() {
  time++;
  let blockWidth = 20;
  for (let x = 0; x < width / blockWidth; x++) {
    for (let y = 0; y < height / blockWidth; y++) {
      let rotation = time / ((1 + x + y * Math.floor(width / blockWidth)) / 25) % (Math.PI / 2);
      if (rotation < 0.1 || rotation > Math.PI / 2 - 0.1) {
        image(imageUrls[(x + y * Math.floor(width / blockWidth)) % imageUrls.length], x * blockWidth - width / 2 + blockWidth / 2, y * blockWidth - height / 2 + blockWidth / 2, blockWidth, blockWidth, rotation);
      }
    }
  }
  drawToScreen();
  window.requestAnimationFrame(loop);
}

async function start()  {
  await loadTextures(imageUrls);
  window.requestAnimationFrame(loop);
}
start();
