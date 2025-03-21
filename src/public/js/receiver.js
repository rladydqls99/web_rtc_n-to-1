(function () {
  "use strict";

  const CONFIG = {
    ICE_SERVERS: [
      { urls: "stun:stun.stunprotocol.org:3478" },
      { urls: "stun:stun.l.google.com:19302" },
    ],
  };

  const DOMElements = {
    roomList: document.getElementById("room-list"),
    roomCount: document.getElementById("room-count"),
    streamContainer: document.getElementById("stream-container"),
    remoteVideo: document.querySelector("#stream-container video"),

    updateRooms(rooms) {
      this.roomList.innerHTML = "";

      if (rooms.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No rooms available";
        li.className = "room-card";
        this.roomList.appendChild(li);
        return;
      }

      rooms.forEach((room) => {
        const li = document.createElement("li");
        li.textContent = room;
        li.className = "room-card";
        li.addEventListener("click", () => RoomManager.joinRoom(room));
        this.roomList.appendChild(li);
      });

      this.roomCount.textContent = `${rooms.length} room`;
    },

    setStreamVisibility(isVisible) {
      this.streamContainer.hidden = !isVisible;
    },

    setRemoteStream(stream) {
      this.remoteVideo.srcObject = stream;
    },
  };

  const PeerConnectionManager = {
    connections: {},

    async createConnection(senderSocketId) {
      const peerConnection = new RTCPeerConnection({
        iceServers: CONFIG.ICE_SERVERS,
      });

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          SocketManager.emitIceCandidate(senderSocketId, event.candidate);
        }
      };

      peerConnection.ontrack = (event) => {
        const stream = event.streams[0];
        DOMElements.setRemoteStream(stream);
      };

      this.connections[senderSocketId] = peerConnection;
      return peerConnection;
    },

    async addIceCandidate(socketId, candidate) {
      const connection = this.connections[socketId];

      if (connection) {
        try {
          await connection.addIceCandidate(candidate);
        } catch (error) {
          console.error(`ICE candidate 추가 중 에러가 발생했습니다: ${error}`);
        }
      }
    },

    async handleOffer(senderSocketId, sdp) {
      const peerConnection = await this.createConnection(senderSocketId);

      try {
        await peerConnection.setRemoteDescription(sdp);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);

        SocketManager.emitAnswer(
          senderSocketId,
          peerConnection.localDescription
        );
      } catch (error) {
        console.error(`Answer 생성 중 에러가 발생했습니다: ${error}`);
      }
    },
  };

  const SocketManager = {
    socket: io(),

    init() {
      this.registerEvents();
      this.getRoomList();
    },

    registerEvents() {
      // Offer 수신 처리
      this.socket.on("offer", async ({ senderSocketId, sdp }) => {
        await PeerConnectionManager.handleOffer(senderSocketId, sdp);
      });

      // ICE 후보 수신 처리
      this.socket.on(
        "ice-candidate",
        async ({ targetSocketId, iceCandidate }) => {
          await PeerConnectionManager.addIceCandidate(
            targetSocketId,
            iceCandidate
          );
        }
      );

      // 방 목록 수신 처리
      this.socket.on("room-list", (rooms) => {
        DOMElements.updateRooms(rooms);
      });
    },

    getRoomList() {
      this.socket.emit("get-rooms");
    },

    joinRoom(roomId) {
      this.socket.emit("join_room", roomId);
    },

    emitAnswer(senderSocketId, sdp) {
      this.socket.emit("answer", {
        senderSocketId,
        sdp,
      });
    },

    emitIceCandidate(socketId, candidate) {
      this.socket.emit("ice-candidate", {
        socketId,
        iceCandidate: candidate,
      });
    },
  };

  const RoomManager = {
    joinRoom(roomId) {
      SocketManager.joinRoom(roomId);
      DOMElements.setStreamVisibility(true);
    },
  };

  function initApp() {
    // 스트림 컨테이너 초기 상태 설정
    DOMElements.setStreamVisibility(false);

    // 소켓 통신 초기화
    SocketManager.init();
  }

  // 앱 시작
  initApp();
})();
