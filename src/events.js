import { EventManager0, EventManager1 } from "./eventManager";

/////////////////////////////
// Deal with parcel reload //
/////////////////////////////
import { refreshOnReload } from "./utils";
refreshOnReload(module);

export const Setup = new EventManager0();
export const Draw = new EventManager1();
export const Update = new EventManager1();
