import "babel-polyfill";

import { Setup, Update, Draw } from "./events";
import { drawToScreen, loadTextures, width, height } from "./graphics";
import { blockImages } from "./images";

import "./grid";
import "./touch";
import "./advance";
import "./combo";
import "./match";

let frames = 0;
function loop() {
  frames++;
  Update.Publish(frames);
  Draw.Publish(frames);
  drawToScreen();
  window.requestAnimationFrame(loop);
}

async function start()  {
  await loadTextures(Object.values(blockImages));
  Setup.Publish();
  window.requestAnimationFrame(loop);
}
start();
