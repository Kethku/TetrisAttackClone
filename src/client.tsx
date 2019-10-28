import * as React from "react";
import * as ReactDOM from "react-dom";

import "./index.html";
import { GameComponent } from "./game";

ReactDOM.render(
  <GameComponent />,
  document.getElementById("app")
);
