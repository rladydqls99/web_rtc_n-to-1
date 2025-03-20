import { Server } from "socket.io";

const configureSocket = (server) => {
  const io = new Server(server);

  io.on("connection", (socket) => {
    console.log("새로운 클라이언트 접속:", socket.id);

    socket.on("disconnect", () => {
      console.log("클라이언트 접속 해제:", socket.id);
    });
  });
};

export default configureSocket;
