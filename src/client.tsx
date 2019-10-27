import "babel-polyfill";
import "./index.html";

import { EventManager } from "./eventManager";

import * as baseScreen from "./events";
import * as playScreen from "./play";

import "./renderer/webgl";
import "./touch";

interface IScreen {
  Update: EventManager<[number]>;
  Draw: EventManager<[number]>;
}

export let currentScreen: IScreen = playScreen;

export function switchScreens(newScreen: IScreen) {
  currentScreen = newScreen;
}

let frames = 0;
function loop() {
  frames++;

  baseScreen.Update.Publish(frames);
  currentScreen.Update.Publish(frames);
  currentScreen.Draw.Publish(frames);
  baseScreen.Draw.Publish(frames);
  window.requestAnimationFrame(loop);
}

async function start()  {
  await Promise.all(baseScreen.Setup.Publish());
  playScreen.Setup.Publish();
  window.requestAnimationFrame(loop);
}
start();
