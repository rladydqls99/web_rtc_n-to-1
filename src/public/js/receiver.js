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
  MAP_OPTIONS: {
    level: 4,
  },
};

/**
 * DOM 요소 관리 클래스
 */
class DOMManager {
  constructor() {
    this.elements = {
      roomList: document.getElementById("room-list"),
      roomCount: document.getElementById("room-count"),
      streamContainer: document.getElementById("stream-container"),
      remoteVideo: document.querySelector("#stream-container video"),
      disconnectButton: document.getElementById("disconnect-button"),
      mapContainer: document.getElementById("map"),
    };

    this.setupEventListeners();
  }

  setupEventListeners() {
    this.elements.disconnectButton.addEventListener("click", () => {
      RoomManager.leaveCurrentRoom();
    });
  }

  /**
   * 방 목록 업데이트
   * @param {Array} rooms - 사용 가능한 방 목록
   */
  updateRooms(rooms) {
    const { roomList, roomCount } = this.elements;
    roomList.innerHTML = "";

    if (rooms.length === 0) {
      const li = document.createElement("li");

      li.textContent = "No rooms available";
      li.className = "room-card";

      roomList.appendChild(li);
      roomCount.textContent = `${rooms.length} room`;

      MapManager.clearMarkers();
      return;
    }

    rooms.forEach((room) => {
      const li = document.createElement("li");

      li.textContent = room.roomId;
      li.className = "room-card";

      li.addEventListener("click", () => RoomManager.joinRoom(room.roomId));
      roomList.appendChild(li);
    });

    roomCount.textContent = `${rooms.length} ${
      rooms.length === 1 ? "room" : "rooms"
    }`;

    MapManager.updateMarkers(rooms);
  }

  /**
   * 스트림 표시 여부 설정
   * @param {boolean} isVisible - 스트림 표시 여부
   */
  setStreamVisibility(isVisible) {
    this.elements.streamContainer.hidden = !isVisible;
  }

  /**
   * 원격 스트림 설정
   * @param {MediaStream} stream - 원격 미디어 스트림
   */
  setRemoteStream(stream) {
    this.elements.remoteVideo.srcObject = stream;
  }

  /**
   * 스트림 초기화
   */
  resetStream() {
    this.elements.remoteVideo.srcObject = null;
    this.elements.streamContainer.hidden = true;
  }
}

/**
 * 지도 관리 클래스
 */
class MapManagerClass {
  constructor() {
    this.map = null;
    this.markers = new Map();
  }

  /**
   * 지도 초기화
   */
  initialize() {
    const { latitude, longitude } = CONFIG.LOCATION;
    const mapOptions = {
      center: new kakao.maps.LatLng(latitude, longitude),
      level: CONFIG.MAP_OPTIONS.level,
    };

    this.map = new kakao.maps.Map(domManager.elements.mapContainer, mapOptions);
    return this.map;
  }

  /**
   * 지도에 마커 업데이트
   * @param {Array} rooms - 방 목록
   */
  updateMarkers(rooms) {
    this.clearMarkers();

    rooms.forEach((room) => {
      const { latitude, longitude } = room.location;
      const markerPosition = new kakao.maps.LatLng(latitude, longitude);

      const marker = new kakao.maps.Marker({
        title: room.roomId,
        position: markerPosition,
        clickable: true,
      });

      this.markers.set(room.roomId, marker);
      marker.setMap(this.map);

      kakao.maps.event.addListener(marker, "click", () => {
        RoomManager.joinRoom(room.roomId);
      });
    });
  }

  /**
   * 모든 마커 제거
   */
  clearMarkers() {
    this.markers.forEach((marker) => marker.setMap(null));
    this.markers.clear();
  }
}

/**
 * WebRTC 연결 관리 클래스
 */
class PeerConnectionManagerClass {
  constructor() {
    this.connections = {};
  }

  /**
   * 새 피어 연결 생성
   * @param {string} senderSocketId - 발신자 소켓 ID
   * @returns {RTCPeerConnection} 생성된 피어 연결
   */
  async createConnection(senderSocketId) {
    const peerConnection = new RTCPeerConnection({
      iceServers: CONFIG.ICE_SERVERS,
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        SocketManager.sendIceCandidate(senderSocketId, event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      const stream = event.streams[0];
      domManager.setRemoteStream(stream);
    };

    this.connections[senderSocketId] = peerConnection;
    return peerConnection;
  }

  /**
   * 피어 연결 종료
   * @param {string} socketId - 소켓 ID
   */
  closeConnection(socketId) {
    const connection = this.connections[socketId];

    if (connection) {
      connection.close();
      delete this.connections[socketId];
    }
  }

  /**
   * ICE 후보 추가
   * @param {string} socketId - 소켓 ID
   * @param {RTCIceCandidate} candidate - ICE 후보
   */
  async addIceCandidate(socketId, candidate) {
    const connection = this.connections[socketId];

    if (connection) {
      try {
        await connection.addIceCandidate(candidate);
      } catch (error) {
        console.error(`Error adding ICE candidate: ${error}`);
      }
    }
  }

  /**
   * Offer 처리
   * @param {string} senderSocketId - 발신자 소켓 ID
   * @param {RTCSessionDescription} sdp - SDP 설명
   */
  async handleOffer(senderSocketId, sdp) {
    const peerConnection = await this.createConnection(senderSocketId);

    try {
      await peerConnection.setRemoteDescription(sdp);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      SocketManager.sendAnswer(senderSocketId, peerConnection.localDescription);
    } catch (error) {
      console.error(`Error creating answer: ${error}`);
    }
  }
}

/**
 * 소켓 통신 관리 클래스
 */
class SocketManagerClass {
  constructor() {
    this.socket = io();
    this.eventHandlers = {
      offer: this.handleOffer.bind(this),
      "ice-candidate": this.handleIceCandidate.bind(this),
      room_list: this.handleRoomList.bind(this),
      close_room: this.handleCloseRoom.bind(this),
    };
  }

  /**
   * 소켓 이벤트 등록 및 초기화
   */
  initialize() {
    // 이벤트 리스너 등록
    Object.entries(this.eventHandlers).forEach(([event, handler]) => {
      this.socket.on(event, handler);
    });

    // 방 목록 요청
    this.getRoomList();
  }

  /**
   * Offer 수신 처리
   * @param {Object} data - 수신 데이터
   */
  async handleOffer({ senderSocketId, sdp }) {
    await PeerConnectionManager.handleOffer(senderSocketId, sdp);
  }

  /**
   * ICE 후보 수신 처리
   * @param {Object} data - 수신 데이터
   */
  async handleIceCandidate({ targetSocketId, iceCandidate }) {
    await PeerConnectionManager.addIceCandidate(targetSocketId, iceCandidate);
  }

  /**
   * 방 목록 수신 처리
   * @param {Array} rooms - 방 목록
   */
  handleRoomList(rooms) {
    domManager.updateRooms(rooms);
  }

  /**
   * 방 종료 수신 처리
   * @param {string} roomId - 방 ID
   */
  handleCloseRoom(roomId) {
    if (RoomManager.currentRoomId === roomId) {
      RoomManager.handleRoomClosed();
    }
  }

  /**
   * 방 목록 요청
   */
  getRoomList() {
    this.socket.emit("get_rooms");
  }

  /**
   * 방 입장
   * @param {string} roomId - 방 ID
   */
  joinRoom(roomId) {
    this.socket.emit("join_room", roomId);
  }

  /**
   * 방 퇴장
   * @param {string} roomId - 방 ID
   */
  leaveRoom(roomId) {
    this.socket.emit("leave_room", roomId);
  }

  /**
   * Answer 전송
   * @param {string} senderSocketId - 발신자 소켓 ID
   * @param {RTCSessionDescription} sdp - SDP 설명
   */
  sendAnswer(senderSocketId, sdp) {
    this.socket.emit("answer", {
      senderSocketId,
      sdp,
    });
  }

  /**
   * ICE 후보 전송
   * @param {string} socketId - 소켓 ID
   * @param {RTCIceCandidate} candidate - ICE 후보
   */
  sendIceCandidate(socketId, candidate) {
    this.socket.emit("ice-candidate", {
      socketId,
      iceCandidate: candidate,
    });
  }
}

/**
 * 방 관리 클래스
 */
class RoomManagerClass {
  constructor() {
    this.currentRoomId = "";
  }

  /**
   * 방 입장 처리
   * @param {string} roomId - 방 ID
   */
  joinRoom(roomId) {
    this.currentRoomId = roomId;
    SocketManager.joinRoom(roomId);
    domManager.setStreamVisibility(true);
  }

  /**
   * 현재 방 퇴장
   */
  leaveCurrentRoom() {
    if (!this.currentRoomId) return;

    SocketManager.leaveRoom(this.currentRoomId);
    this.resetRoomState();
  }

  /**
   * 방 종료 처리
   */
  handleRoomClosed() {
    this.resetRoomState();
  }

  /**
   * 방 상태 초기화
   */
  resetRoomState() {
    domManager.resetStream();
    PeerConnectionManager.closeConnection(this.currentRoomId);
    this.currentRoomId = "";
  }
}

// 인스턴스 생성
const domManager = new DOMManager();
const MapManager = new MapManagerClass();
const PeerConnectionManager = new PeerConnectionManagerClass();
const SocketManager = new SocketManagerClass();
const RoomManager = new RoomManagerClass();

/**
 * 애플리케이션 초기화
 */
function initApp() {
  // DOM 요소 초기화
  domManager.setStreamVisibility(false);

  // 지도 초기화
  MapManager.initialize();

  // 소켓 통신 초기화
  SocketManager.initialize();
}

// 애플리케이션 시작
document.addEventListener("DOMContentLoaded", initApp);
