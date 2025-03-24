(function () {
  "use strict";

  const CONFIG = {
    ICE_SERVERS: [
      { urls: "stun:stun.stunprotocol.org:3478" },
      { urls: "stun:stun.l.google.com:19302" },
    ],
    LOCATION: {
      latitude: 36.38516688369645,
      longitude: 127.3194762861434,
    },
  };

  const DOMElements = {
    roomList: document.getElementById("room-list"),
    roomCount: document.getElementById("room-count"),
    streamContainer: document.getElementById("stream-container"),
    remoteVideo: document.querySelector("#stream-container video"),
    disConnectButton: document.getElementById("disconnect-button"),
    mapContainer: document.getElementById("map"),

    updateRooms(rooms) {
      this.roomList.innerHTML = "";

      if (rooms.length === 0) {
        const li = document.createElement("li");
        li.textContent = "No rooms available";
        li.className = "room-card";
        this.roomList.appendChild(li);
        this.roomCount.textContent = `${rooms.length} room`;

        MapManager.updataMapMarker(rooms);
        return;
      }

      rooms.forEach((room) => {
        const li = document.createElement("li");
        li.textContent = room.roomId;
        li.className = "room-card";
        li.addEventListener("click", () =>
          RoomManager.handleJoinRoom(room.roomId)
        );
        this.roomList.appendChild(li);

        MapManager.updataMapMarker(rooms);
      });

      this.roomCount.textContent = `${rooms.length} room`;
    },

    setStreamVisibility(isVisible) {
      this.streamContainer.hidden = !isVisible;
    },

    setRemoteStream(stream) {
      this.remoteVideo.srcObject = stream;
    },

    resetStream() {
      this.remoteVideo.srcObject = null;
      this.streamContainer.hidden = true;
    },
  };

  const MapManager = {
    map: null,
    markers: new Map(),

    initializeMap() {
      const { latitude, longitude } = CONFIG.LOCATION;
      const mapOptions = {
        center: new kakao.maps.LatLng(latitude, longitude),
        level: 4,
      };

      this.map = new kakao.maps.Map(DOMElements.mapContainer, mapOptions);
      return map;
    },

    updataMapMarker(rooms) {
      this.markers.forEach((marker) => marker.setMap(null));
      this.markers.clear();

      rooms.forEach((room) => {
        const { latitude, longitude } = room.location;
        const markerPosition = new kakao.maps.LatLng(latitude, longitude);

        const marker = new kakao.maps.Marker({
          position: markerPosition,
        });

        this.markers.set(room.roomId, marker);
        marker.setMap(this.map);
      });
    },

    resetMapMarker() {
      this.markers.forEach((marker) => marker.setMap(null));
      this.markers.clear();
    },
  };

  const PeerConnectionManager = {
    peerConnections: {},

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

      this.peerConnections[senderSocketId] = peerConnection;
      return peerConnection;
    },

    disConnectPeerConnection(socketId) {
      const connection = this.peerConnections[socketId];

      if (connection) {
        connection.close();
        delete this.peerConnections[socketId];
      }
    },

    async addIceCandidate(socketId, candidate) {
      const connection = this.peerConnections[socketId];

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
      this.socket.on("room_list", (rooms) => {
        DOMElements.updateRooms(rooms);
      });

      this.socket.on("close_room", (roomId) => {
        if (RoomManager.roomId === roomId) {
          DOMElements.resetStream();
          PeerConnectionManager.disConnectPeerConnection(this.roomId);
        }
      });
    },

    getRoomList() {
      this.socket.emit("get_rooms");
    },

    joinRoom(roomId) {
      this.socket.emit("join_room", roomId);
    },

    emitLeaveRoom(roomId) {
      this.socket.emit("leave_room", roomId);
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
    roomId: "",
    location: null,

    handleJoinRoom(roomId) {
      this.roomId = roomId;

      SocketManager.joinRoom(roomId);
      DOMElements.setStreamVisibility(true);
    },

    handleLeaveRoom() {
      SocketManager.emitLeaveRoom(this.roomId);
      DOMElements.resetStream();
      PeerConnectionManager.disConnectPeerConnection(this.roomId);

      this.roomId = "";
    },
  };

  const EventManager = {
    init() {
      DOMElements.disConnectButton.addEventListener("click", () =>
        RoomManager.handleLeaveRoom()
      );
    },
  };
  function initApp() {
    // 스트림 컨테이너 초기 상태 설정
    DOMElements.setStreamVisibility(false);
    MapManager.initializeMap();

    // 소켓 통신 초기화
    SocketManager.init();

    // 이벤트 초기화
    EventManager.init();
  }

  // 앱 시작
  initApp();
})();
