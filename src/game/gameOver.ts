import { EventManager } from "../eventManager";
import { Vector } from "./math";
import { screenSize } from "./renderer/webgl";
import { image } from "./renderer/graphics";
import { Lose, LoseWidthOverHeight, Win, WinWidthOverHeight } from "./renderer/images";

import { Draw as gameDraw } from "./play/events";

let imageToDraw: string;
let widthOverHeight: number;

export const Draw = new EventManager<[number]>();
export const Update = new EventManager<[number]>();

export function Init(win: boolean) {
  if (win) {
    imageToDraw = Win;
    widthOverHeight = WinWidthOverHeight;
  } else {
    imageToDraw = Lose;
    widthOverHeight = LoseWidthOverHeight;
  }
}

Draw.Subscribe(gameDraw.Publish.bind(gameDraw));

Draw.Subscribe(() => {
  let width = screenSize.width * 0.75;
  image({
    imageUrl: imageToDraw,
    position: screenSize.divide(2),
    dimensions: new Vector(width, width / widthOverHeight)
  });
});
