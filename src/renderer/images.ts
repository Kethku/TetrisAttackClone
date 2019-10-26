export const blockImages = {
  "Bang": "./images/Bang.png",
  "Cloud": "./images/Cloud.png",
  "Leaf": "./images/Leaf.png",
  "Moon": "./images/Moon.png",
  "Rain": "./images/Rain.png",
  "Stick": "./images/Stick.png",
  "Sun": "./images/Sun.png"
};

export const garbageImages = {
  "ThreeWide": "./images/garbage/ThreeWideGarbage.png",
  "FourWide": "./images/garbage/FourWideGarbage.png",
  "FiveWide": "./images/garbage/FiveWideGarbage.png",
  "SingleLine": "./images/garbage/SingleLineGarbage.png",
  "TwoLine": "./images/garbage/TwoLineGarbage.png",

  "TopLine": "./images/garbage/TopLineGarbage.png",
  "MiddleLine": "./images/garbage/MiddleLineGarbage.png",
  "EvenMiddleLine": "./images/garbage/EvenMiddleLineGarbage.png",
  "MiddleLineNoExclamationPoint": "./images/garbage/MiddleLineGarbageNoExclamationPoint.png",
  "BottomLine": "./images/garbage/BottomLineGarbage.png",

  "Lock": "./images/garbage/Lock.png",
  "Clear": "./images/garbage/Clear.png"
};

export const Lose = "./images/Lose.png";
export const LoseWidthOverHeight = 65 / 30;

export const Win = "./images/Win.png";
export const WinWidthOverHeight = 51 / 30;

export const imageURLs = Object.values(blockImages).concat(Object.values(garbageImages)).concat([ Lose, Win ]);
