import "babel-polyfill";

import { Setup, Update, Draw } from "./events";
import { drawToScreen, loadTextures, width, height } from "./graphics";
import images from "./images/*.png";

import "./grid";
import "./touch";

/////////////////////////////
// Deal with parcel reload //
/////////////////////////////
import { refreshOnReload } from "./utils";
refreshOnReload(module);

let imageUrls = Object.values(images);

let frames = 0;
function loop() {
  frames++;
  Update.Publish(frames);
  Draw.Publish(frames);
  drawToScreen();
  window.requestAnimationFrame(loop);
}

async function start()  {
  await loadTextures(imageUrls);
  Setup.Publish();
  window.requestAnimationFrame(loop);
}
start();
