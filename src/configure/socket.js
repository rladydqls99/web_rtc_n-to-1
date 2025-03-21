import { Server } from "socket.io";

class RoomService {
  constructor(io) {
    this.io = io;
  }

  joinRoom(socket, roomId) {
    socket.join(roomId);
    socket.to(roomId).emit("join_room", { receiverSocketId: socket.id });
  }

  createRoom(socket, roomId) {
    socket.join(roomId);
  }

  leaveRoom(socket, roomId) {
    socket.leave(roomId);
  }

  closeRoom(roomId) {
    this.io.in(roomId).socketsLeave(roomId);
  }

  getActiveRooms() {
    const { rooms, sids } = this.io.sockets.adapter;
    const activeRooms = [];

    rooms.forEach((_, roomId) => {
      if (!sids.has(roomId)) {
        activeRooms.push(roomId);
      }
    });

    return activeRooms;
  }
}

class SignalingService {
  sendOffer(socket, receiverSocketId, sdp) {
    socket.to(receiverSocketId).emit("offer", {
      senderSocketId: socket.id,
      sdp,
    });
  }

  sendAnswer(socket, senderSocketId, sdp) {
    socket.to(senderSocketId).emit("answer", {
      receiverSocketId: socket.id,
      sdp,
    });
  }

  sendIceCandidate(socket, targetSocketId, iceCandidate) {
    socket.to(targetSocketId).emit("ice-candidate", {
      targetSocketId: socket.id,
      iceCandidate,
    });
  }
}

class SocketEventLogger {
  logConnection(socketId) {
    console.log(`클라이언트 접속: ${socketId}`);
  }

  logDisconnection(socketId) {
    console.log(`클라이언트 접속 해제: ${socketId}`);
  }

  logEvent(eventName, targetId) {
    if (targetId) {
      console.log(`${eventName} 이벤트를 받았습니다. 대상: ${targetId}`);
    } else {
      console.log(`${eventName} 이벤트를 받았습니다.`);
    }
  }
}

const configureSocket = (server) => {
  const io = new Server(server);
  const roomService = new RoomService(io);
  const signalingService = new SignalingService();
  const logger = new SocketEventLogger();

  io.on("connection", (socket) => {
    logger.logConnection(socket.id);

    // 방 관련 이벤트 핸들러
    setupRoomEventHandlers(socket, io, roomService, logger);

    // WebRTC 시그널링 관련 이벤트 핸들러
    setupSignalingEventHandlers(socket, signalingService, logger);

    // 연결 해제 이벤트 핸들러
    socket.on("disconnect", () => {
      logger.logDisconnection(socket.id);
    });
  });

  return io;
};

const setupRoomEventHandlers = (socket, io, roomService, logger) => {
  socket.on("join_room", (roomId) => {
    logger.logEvent("join_room", roomId);
    roomService.joinRoom(socket, roomId);
  });

  socket.on("send_room", (roomId) => {
    logger.logEvent("send_room", roomId);
    roomService.createRoom(socket, roomId);

    const activeRooms = roomService.getActiveRooms();
    io.emit("room_list", activeRooms);
  });

  socket.on("get_rooms", () => {
    logger.logEvent("get_rooms");

    const activeRooms = roomService.getActiveRooms();
    socket.emit("room_list", activeRooms);
  });

  socket.on("close_room", (roomId) => {
    logger.logEvent("close_room", roomId);

    roomService.closeRoom(roomId);
    io.emit("close_room", roomId);

    const activeRooms = roomService.getActiveRooms();
    io.emit("room_list", activeRooms);
  });

  socket.on("leave_room", (roomId) => {
    logger.logEvent("leave_room", roomId);
    roomService.leaveRoom(socket, roomId);
  });
};

const setupSignalingEventHandlers = (socket, signalingService, logger) => {
  socket.on("offer", ({ receiverSocketId, sdp }) => {
    logger.logEvent("offer", receiverSocketId);
    signalingService.sendOffer(socket, receiverSocketId, sdp);
  });

  socket.on("answer", ({ senderSocketId, sdp }) => {
    logger.logEvent("answer", senderSocketId);
    signalingService.sendAnswer(socket, senderSocketId, sdp);
  });

  socket.on("ice-candidate", ({ socketId, iceCandidate }) => {
    logger.logEvent("ice-candidate", socketId);
    signalingService.sendIceCandidate(socket, socketId, iceCandidate);
  });
};

export default configureSocket;
