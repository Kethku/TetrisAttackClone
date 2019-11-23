import * as React from "react";
import { useState } from "react";
import * as ReactDOM from "react-dom";
import * as io from "socket.io-client";

import "./index.html";
import * as api from "./clientAPI";
import { Home } from "./home";
import { Lobby } from "./lobby";
import { GameComponent } from "./game";
import { unreachable, createProxy } from "./utils";

export enum Screens {
  Home = "Home",
  Lobby = "Lobby",
  Game = "Game"
}

const server = createProxy<typeof import("./serverAPI")>(io(), api);

function Game() {
  const [ screen, setScreen ] = useState(Screens.Home);
  const [ name, setName ] = useState("");

  switch (screen) {
    case Screens.Home:
      return <Home name={name} setName={setName} setScreen={setScreen} server={server} />;
    case Screens.Lobby:
      return <Lobby server={server} />;
    case Screens.Game:
      return <GameComponent />;
    default: unreachable(screen);
  }
}

ReactDOM.render(
  <Game />,
  document.getElementById("app")
);
