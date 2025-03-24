import { Server } from "socket.io";

// Event constants
const SOCKET_EVENTS = {
  // Connection events
  CONNECTION: "connection",
  DISCONNECT: "disconnect",
  DISCONNECTING: "disconnecting",

  // Room events
  JOIN_ROOM: "join_room",
  SEND_ROOM: "send_room",
  GET_ROOMS: "get_rooms",
  CLOSE_ROOM: "close_room",
  LEAVE_ROOM: "leave_room",
  ROOM_MEMBER_COUNT: "room_member_count",
  ROOM_LIST: "room_list",

  // WebRTC signaling events
  OFFER: "offer",
  ANSWER: "answer",
  ICE_CANDIDATE: "ice-candidate",
};

class RoomService {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
  }

  joinRoom(socket, roomId) {
    socket.join(roomId);
    socket
      .to(roomId)
      .emit(SOCKET_EVENTS.JOIN_ROOM, { receiverSocketId: socket.id });
  }

  createRoom(socket, roomId, location) {
    socket.join(roomId);
    this.rooms.set(roomId, location);
  }

  leaveRoom(socket, roomId) {
    socket.leave(roomId);
  }

  closeRoom(roomId) {
    this.io.in(roomId).socketsLeave(roomId);
    this.io.emit(SOCKET_EVENTS.CLOSE_ROOM, roomId);
  }

  notifyRoomMemberCount(roomId) {
    const roomMembers = this.getRoomMembers(roomId);
    this.io
      .to(roomId)
      .emit(SOCKET_EVENTS.ROOM_MEMBER_COUNT, roomMembers.size - 1);
  }

  notifyActiveRooms() {
    const activeRooms = this.getActiveRooms();
    this.io.emit(SOCKET_EVENTS.ROOM_LIST, activeRooms);
  }

  setHost(socket) {
    socket.host = true;
  }

  getActiveRooms() {
    const { rooms, sids } = this.io.sockets.adapter;
    const activeRooms = [];

    rooms.forEach((_, roomId) => {
      if (!sids.has(roomId)) {
        const room = this.rooms.get(roomId);

        activeRooms.push({ roomId, location: room });
      }
    });

    return activeRooms;
  }

  getRoomMembers(roomId) {
    return this.io.sockets.adapter.rooms.get(roomId);
  }

  getJoinedRooms(socket) {
    return Array.from(socket.rooms).filter((room) => room !== socket.id);
  }
}

class SignalingService {
  sendOffer(socket, receiverSocketId, sdp) {
    socket.to(receiverSocketId).emit(SOCKET_EVENTS.OFFER, {
      senderSocketId: socket.id,
      sdp,
    });
  }

  sendAnswer(socket, senderSocketId, sdp) {
    socket.to(senderSocketId).emit(SOCKET_EVENTS.ANSWER, {
      receiverSocketId: socket.id,
      sdp,
    });
  }

  sendIceCandidate(socket, targetSocketId, iceCandidate) {
    socket.to(targetSocketId).emit(SOCKET_EVENTS.ICE_CANDIDATE, {
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

  io.on(SOCKET_EVENTS.CONNECTION, (socket) => {
    logger.logConnection(socket.id);

    // 방 관련 이벤트 핸들러
    setupRoomEventHandlers(socket, io, roomService, logger);

    // WebRTC 시그널링 관련 이벤트 핸들러
    setupSignalingEventHandlers(socket, signalingService, logger);

    socket.on(SOCKET_EVENTS.DISCONNECT, () => {
      logger.logDisconnection(socket.id);
    });
  });

  return io;
};

const setupRoomEventHandlers = (socket, io, roomService, logger) => {
  socket.on(SOCKET_EVENTS.JOIN_ROOM, (roomId) => {
    logger.logEvent(SOCKET_EVENTS.JOIN_ROOM, roomId);
    roomService.joinRoom(socket, roomId);

    roomService.notifyRoomMemberCount(roomId);
  });

  socket.on(SOCKET_EVENTS.SEND_ROOM, ({ roomId, location }) => {
    logger.logEvent(SOCKET_EVENTS.SEND_ROOM, roomId);

    roomService.createRoom(socket, roomId, location);
    roomService.setHost(socket);
    roomService.notifyActiveRooms();
  });

  socket.on(SOCKET_EVENTS.GET_ROOMS, () => {
    logger.logEvent(SOCKET_EVENTS.GET_ROOMS);

    roomService.notifyActiveRooms();
  });

  socket.on(SOCKET_EVENTS.CLOSE_ROOM, (roomId) => {
    logger.logEvent(SOCKET_EVENTS.CLOSE_ROOM, roomId);

    roomService.closeRoom(roomId);
    roomService.notifyActiveRooms();
  });

  socket.on(SOCKET_EVENTS.LEAVE_ROOM, (roomId) => {
    logger.logEvent(SOCKET_EVENTS.LEAVE_ROOM, roomId);

    roomService.leaveRoom(socket, roomId);
    roomService.notifyRoomMemberCount(roomId);
  });

  socket.on(SOCKET_EVENTS.DISCONNECTING, () => {
    logger.logEvent(SOCKET_EVENTS.DISCONNECTING, socket.id);

    const joinedRooms = roomService.getJoinedRooms(socket);

    joinedRooms.forEach((roomId) => {
      if (socket.host) {
        roomService.closeRoom(roomId);
        roomService.notifyActiveRooms();
      } else {
        roomService.leaveRoom(socket, roomId);
        roomService.notifyRoomMemberCount(roomId);
      }
    });
  });
};

const setupSignalingEventHandlers = (socket, signalingService, logger) => {
  socket.on(SOCKET_EVENTS.OFFER, ({ receiverSocketId, sdp }) => {
    logger.logEvent(SOCKET_EVENTS.OFFER, receiverSocketId);
    signalingService.sendOffer(socket, receiverSocketId, sdp);
  });

  socket.on(SOCKET_EVENTS.ANSWER, ({ senderSocketId, sdp }) => {
    logger.logEvent(SOCKET_EVENTS.ANSWER, senderSocketId);
    signalingService.sendAnswer(socket, senderSocketId, sdp);
  });

  socket.on(SOCKET_EVENTS.ICE_CANDIDATE, ({ socketId, iceCandidate }) => {
    logger.logEvent(SOCKET_EVENTS.ICE_CANDIDATE, socketId);
    signalingService.sendIceCandidate(socket, socketId, iceCandidate);
  });
};

export { SOCKET_EVENTS };
export default configureSocket;
