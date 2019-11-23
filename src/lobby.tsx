import * as React from "react";
import { useState, useEffect } from 'react';
import { Container, TextInput } from "nes-react";

import { lobbyPlayers as initialLobbyPlayers, LobbyPlayersUpdated, NewChatMessage } from "./clientAPI";
import { Proxied } from './utils';
import { CenterContainer } from "./components/centerContainer";

type ServerAPI = Proxied<typeof import("./serverAPI")>;

export interface LobbyProps {
  server: ServerAPI;
}

export function Lobby({ server }: LobbyProps) {
  const [ players, setPlayers ] = useState(initialLobbyPlayers);
  const [ chatLog, setChatLog ] = useState([]);
  const [ message, setMessage ] = useState("");

  useEffect(() => {
    LobbyPlayersUpdated.Subscribe(setPlayers);
    NewChatMessage.Subscribe(chatMessage => setChatLog(chatLog => [...chatLog, chatMessage]));
  }, [])

  return (
    <CenterContainer>
      <Container rounded title="Open Lobbies">
        <Container rounded title="Players">
          {players.join("  ")}
        </Container>
        <Container rounded title="Chat">
          {chatLog.map(chatMessage => (
            <p>{chatMessage}</p>
          ))}
          <TextInput 
            onChange={e => setMessage(e.target.value)} 
            onKeyDown={e => {
              if (e.keyCode === 13) {
                if (message.trim().length !== 0) {
                  server.sendChatMessage(message);
                }
                setMessage("")
              }
            }} 
            value={message}/>
        </Container>
      </Container>
    </CenterContainer>
  )
}
