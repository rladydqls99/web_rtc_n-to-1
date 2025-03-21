import { Server } from "socket.io";

const configureSocket = (server) => {
  const io = new Server(server);

  io.on("connection", (socket) => {
    socket.on("join_room", (roomId) => {
      console.log(`join_room 이벤트를 받았습니다. 방번호: ${roomId}`);
      socket.join(roomId);

      socket.to(roomId).emit("join_room", { receiverSocketId: socket.id });
    });

    socket.on("send_room", (roomId, done) => {
      console.log(`send-video 이벤트를 받았습니다. 방번호: ${roomId}`);
      socket.join(roomId);

      const activeRooms = getRooms(io);

      io.emit("room-list", activeRooms);
      done();
    });

    socket.on("get-rooms", () => {
      const activeRooms = getRooms(io);
      socket.emit("room-list", activeRooms);
    });

    socket.on("offer", ({ receiverSocketId, sdp }) => {
      console.log(`offer 이벤트를 받았습니다. 대상: ${receiverSocketId}`);

      socket.to(receiverSocketId).emit("offer", {
        senderSocketId: socket.id,
        sdp,
      });
    });

    socket.on("answer", ({ senderSocketId, sdp }) => {
      console.log(`answer 이벤트를 받았습니다. 대상: ${senderSocketId}`);

      socket
        .to(senderSocketId)
        .emit("answer", { receiverSocketId: socket.id, sdp });
    });

    socket.on("ice-candidate", ({ socketId, iceCandidate }) => {
      socket.to(socketId).emit("ice-candidate", {
        targetSocketId: socket.id,
        iceCandidate,
      });
    });

    socket.on("disconnect", () => {
      console.log("클라이언트 접속 해제:", socket.id);
    });
  });
};

// helper function ----------------------------------------------------------

const getRooms = (io) => {
  const { rooms, sids } = io.sockets.adapter;

  const activeRooms = [];
  rooms.forEach((_, roomId) => {
    if (!sids.has(roomId)) {
      activeRooms.push(roomId);
    }
  });

  return activeRooms;
};

export default configureSocket;
