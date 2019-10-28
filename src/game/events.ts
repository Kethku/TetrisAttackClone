import { EventManager } from "../eventManager";

export const Setup = new EventManager<[], Promise<void> | void>();
export const Draw = new EventManager<[number]>();
export const Update = new EventManager<[number]>();
