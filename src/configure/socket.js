import { Server } from "socket.io";

const configureSocket = (server) => {
  const io = new Server(server);

  io.on("connection", (socket) => {
    socket.on("join_room", (roomId) => {
      console.log(`join_room 이벤트를 받았습니다. 방번호: ${roomId}`);
      socket.join(roomId);
    });

    socket.on("send_room", (roomId, done) => {
      console.log(`send-video 이벤트를 받았습니다. 방번호: ${roomId}`);
      socket.join(roomId);

      const { rooms, sids } = io.sockets.adapter;

      const activeRooms = [];
      rooms.forEach((_, roomId) => {
        if (!sids.has(roomId)) {
          activeRooms.push(roomId);
        }
      });

      io.emit("room-list", activeRooms);
      done();
    });

    socket.on("disconnect", () => {
      console.log("클라이언트 접속 해제:", socket.id);
    });
  });
};

export default configureSocket;
