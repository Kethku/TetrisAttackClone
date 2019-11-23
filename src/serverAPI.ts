import { Proxied } from "./utils";

type ClientAPI = Proxied<typeof import("./clientAPI")>;

interface Lobby {
  name: string;
  participants: Player[];
}

let openLobbies = new Map<string, Lobby>();

interface Player {
  name: string;
  lobby: Lobby;
  client: ClientAPI;
}

let players = new Map<ClientAPI, Player>();

export function joinGame(client: ClientAPI, playerName: string, serverName: string) {
  let lobby = openLobbies.get(serverName);
  if (!lobby) {
    lobby = {
      name: serverName,
      participants: []
    };
    openLobbies.set(serverName, lobby);
    for (let clientAPI of serversSubscriptions) clientAPI.serversChanged(Array.from(openLobbies.values()).map(lobby => lobby.name));
  }

  let player = {
    name: playerName,
    lobby, client
  };
  players.set(client, player);

  lobby.participants.push(player);
  for (let player of lobby.participants) player.client.lobbyPlayersChanged(lobby.participants.map(lobbyPlayer => lobbyPlayer.name));
}

let serversSubscriptions = new Set<ClientAPI>();
export function subscribeToServers(client: ClientAPI) {
  serversSubscriptions.add(client);
  client.serversChanged(Array.from(openLobbies.values()).map(lobby => lobby.name))
}
export function unsubscribeFromServers(client: ClientAPI) {
  serversSubscriptions.delete(client);
}

export function sendChatMessage(client: ClientAPI, message: string) {
  let player = players.get(client);
  let playerName = player.name;
  let lobby = player.lobby;
  let labeledMessage = `${playerName}: ${message}`

  for (let lobbyPlayer of lobby.participants) {
    lobbyPlayer.client.chatMessage(labeledMessage);
  }
}
