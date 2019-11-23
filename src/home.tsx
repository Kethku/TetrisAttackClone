import * as React from "react";
import { useState, useEffect } from 'react';
import { Container, Button, TextInput } from "nes-react";

import { servers as initialServers, ServersUpdated } from "./clientAPI";
import { Screens } from "./client"
import { Proxied } from './utils';
import { CenterContainer } from "./components/centerContainer";

type ServerAPI = Proxied<typeof import("./serverAPI")>;

export interface HomeProps {
  name: string;
  setName: (name: string) => void;
  setScreen: (screen: Screens) => void;
  server: ServerAPI;
}

export function Home({ name, setName, setScreen, server }: HomeProps) {
  const canMultiplayer = name.trim().length == 0;
  const [ servers, setServers ] = useState(initialServers);

  function joinGame(serverName: string) {
    setScreen(Screens.Lobby);
    server.joinGame(name, serverName);
  }

  useEffect(() => {
    server.subscribeToServers();
    ServersUpdated.Subscribe(setServers);
  }, [])

  return (
    <CenterContainer>
      <Container rounded title="Endless">
        <Button onClick={() => setScreen(Screens.Game)}>
          Play!
        </Button>
      </Container>
      <Container rounded title="VS">
        <TextInput label="Name" value={name} onChange={e => setName(e.target.value)}/>

        <Button onClick={() => joinGame(name)} disabled={canMultiplayer} >
          Host!
        </Button>

        <Container rounded title="Open Lobbies" style={{ marginTop: 30 }}>
          {servers.map((server, id) => {
            return <div style={{margin: 25}} key={id}>
              <Button onClick={() => joinGame(server)} disabled={canMultiplayer} >
                {server}'s Game
              </Button>
            </div>
          })}
        </Container>
      </Container>
    </CenterContainer>
  );
}
