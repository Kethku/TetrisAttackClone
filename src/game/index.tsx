import "babel-polyfill";

import * as React from "react";
import { useEffect } from "react";
import { EventManager } from "../eventManager";

import * as baseScreen from "./events";
import * as playScreen from "./play";

import "./renderer/webgl";
import "./touch";

interface IScreen {
  Update: EventManager<[number]>;
  Draw: EventManager<[number]>;
}

export let currentScreen: IScreen;

export function switchScreens(newScreen: IScreen) {
  currentScreen = newScreen;
}

let running = false;
let frames = 0;
function loop() {
  frames++;

  baseScreen.Update.Publish(frames);
  currentScreen.Update.Publish(frames);
  currentScreen.Draw.Publish(frames);
  baseScreen.Draw.Publish(frames);

  if (running) {
    window.requestAnimationFrame(loop);
  }
}

export const CanvasMounted = new EventManager<[HTMLCanvasElement]>();
async function canvasMounted(newCanvas: HTMLCanvasElement) {
  await Promise.all(baseScreen.Setup.Publish());

  currentScreen = playScreen;
  baseScreen.Setup.Publish();
  playScreen.Setup.Publish();

  CanvasMounted.Publish(newCanvas);
  window.requestAnimationFrame(loop);
  running = true;
}

export function GameComponent() {
  useEffect(() => {
    return function cleanup() {
      running = false;
    }
  }, [])
  return <canvas ref={canvasMounted} touch-action="none" />;
}
