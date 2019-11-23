import * as http from "http";
import * as express from "express";
import * as io from "socket.io";

import * as api from "./serverAPI";
import { createProxy } from './utils';

const port = 8080;
const app = express();
const httpServer = http.createServer(app);
const socketServer = io(httpServer);

app.use(express.static(__dirname));

httpServer.listen(port, function () {
  console.log(`listening on *:${port}`);
});

socketServer.on('connection', (socket) => {
  createProxy<typeof import("./clientAPI")>(socket, api);
});
