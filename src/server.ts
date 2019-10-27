import * as path from "path";
import * as http from "http";
import * as express from "express";
import * as io from "socket.io";

const port = 8080;
const app = express();
const httpServer = http.createServer(app);
const socketServer = io(httpServer);

const staticFilePath = __dirname;
console.log(staticFilePath);
app.use(express.static(__dirname));

httpServer.listen(port, function () {
  console.log(`listening on *:${port}`);
});

socketServer.on('connection', function (_) {
  console.log('A user connected.');
});
