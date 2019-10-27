export const blockImages = {
  "Bang": require("../images/Bang.png"),
  "Cloud": require("../images/Cloud.png"),
  "Leaf": require("../images/Leaf.png"),
  "Moon": require("../images/Moon.png"),
  "Rain": require("../images/Rain.png"),
  "Stick": require("../images/Stick.png"),
  "Sun": require("../images/Sun.png")
};

export const garbageImages = {
  "ThreeWide": require("../images/garbage/ThreeWideGarbage.png"),
  "FourWide": require("../images/garbage/FourWideGarbage.png"),
  "FiveWide": require("../images/garbage/FiveWideGarbage.png"),
  "SingleLine": require("../images/garbage/SingleLineGarbage.png"),
  "TwoLine": require("../images/garbage/TwoLineGarbage.png"),

  "TopLine": require("../images/garbage/TopLineGarbage.png"),
  "MiddleLine": require("../images/garbage/MiddleLineGarbage.png"),
  "EvenMiddleLine": require("../images/garbage/EvenMiddleLineGarbage.png"),
  "MiddleLineNoExclamationPoint": require("../images/garbage/MiddleLineGarbageNoExclamationPoint.png"),
  "BottomLine": require("../images/garbage/BottomLineGarbage.png"),

  "Lock": require("../images/garbage/Lock.png"),
  "Clear": require("../images/garbage/Clear.png")
};

export const Lose = require("../images/Lose.png") as string;
export const LoseWidthOverHeight = 65 / 30;

export const Win = require("../images/Win.png") as string;
export const WinWidthOverHeight = 51 / 30;

export const imageURLs = Object.values(blockImages).concat(Object.values(garbageImages)).concat([ Lose, Win ]);
