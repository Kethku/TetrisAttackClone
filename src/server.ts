import * as socket from "socket.io";

const io = socket();

io.on('connection', client => {
  console.log("Player Connected");
});
