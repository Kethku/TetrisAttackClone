import "babel-polyfill";

import { Setup, Update, Draw } from "./events";
import { drawToScreen, loadTextures } from "./webgl";
import { imageURLs } from "./images";

import "./grid";
import "./touch";
import "./advance";
import "./combo";
import "./match";
import "./garbage";
import "./clearAnimation";

let frames = 0;
function loop() {
  frames++;
  Update.Publish(frames);
  Draw.Publish(frames);
  drawToScreen();
  window.requestAnimationFrame(loop);
}

async function start()  {
  await loadTextures(imageURLs);
  Setup.Publish();
  window.requestAnimationFrame(loop);
}
start();
