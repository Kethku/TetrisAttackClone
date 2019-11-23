import { EventManager } from "./eventManager";

export let servers: string[] = [];
export const ServersUpdated = new EventManager<[string[]]>();

export function serversChanged(_, newServers: string[]) {
  servers = newServers;
  ServersUpdated.Publish(servers);
}

export let lobbyPlayers: string[] = [];
export const LobbyPlayersUpdated = new EventManager<[string[]]>();

export function lobbyPlayersChanged(_, newPlayers: string[]) {
  lobbyPlayers = newPlayers;
  LobbyPlayersUpdated.Publish(lobbyPlayers);
}

export const NewChatMessage = new EventManager<[string]>();

export function chatMessage(_, message: string) {
  NewChatMessage.Publish(message);
}
