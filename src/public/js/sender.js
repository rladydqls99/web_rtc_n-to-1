"use strict";

const CONFIG = {
  ICE_SERVERS: [
    { urls: "stun:stun.stunprotocol.org:3478" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
  MEDIA: {
    DEFAULT_CONSTRAINTS: {
      audio: true,
      video: { facingMode: "user" },
    },
    SPECIFIC_DEVICE_CONSTRAINTS: (deviceId) => ({
      audio: true,
      video: { deviceId: { exact: deviceId } },
    }),
  },
};

/**
 * DOM 요소 관리 클래스
 */
class DOMManager {
  constructor() {
    this.elements = {
      roomConnectionForm: document.getElementById("room-connection-form"),
      roomIdInput: document.querySelector("#room-connection-form input"),
      disConnectButton: document.getElementById("disconnect-button"),
      streamContainer: document.getElementById("stream-container"),
      localVideo: document.querySelector("#stream-container video"),
      cameraSelect: document.querySelector("#stream-container select"),
      audioToggle: document.getElementById("audio-toggle"),
      videoToggle: document.getElementById("video-toggle"),
      userCount: document.getElementById("user-count"),
    };
  }

  /**
   * 카메라 옵션 목록 업데이트
   */
  updateCameraOptions(cameras, currentCamera) {
    const select = this.elements.cameraSelect;
    select.innerHTML = "";

    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.text = camera.label;
      option.selected = currentCamera && currentCamera.label === camera.label;
      select.appendChild(option);
    });
  }

  /**
   * 로컬 비디오 스트림 설정
   */
  setLocalStream(stream) {
    this.elements.localVideo.srcObject = stream;
  }

  /**
   * 연결 해제 버튼 표시 상태 설정
   */
  setDisConnectButtonVisibility(isVisible) {
    this.elements.disConnectButton.hidden = !isVisible;
  }

  /**
   * 방 연결 폼 표시 상태 설정
   */
  setRoomConnectionFormVisibility(isVisible) {
    this.elements.roomConnectionForm.hidden = !isVisible;
  }

  /**
   * 방 ID 입력 초기화
   */
  resetRoomIdInput() {
    this.elements.roomIdInput.value = "";
  }

  /**
   * 오디오 버튼 텍스트 업데이트
   */
  updateAudioButtonText(isMuted) {
    this.elements.audioToggle.textContent = isMuted ? "Audio Off" : "Audio On";
  }

  /**
   * 비디오 버튼 텍스트 업데이트
   */
  updateVideoButtonText(isCameraOff) {
    this.elements.videoToggle.textContent = isCameraOff
      ? "Video Off"
      : "Video On";
  }

  /**
   * 사용자 수 업데이트
   */
  updateUserCount(roomMemberCount) {
    this.elements.userCount.textContent = `${roomMemberCount} Users`;
  }
}

/**
 * 미디어 스트림 관리 클래스
 */
class MediaStreamManagerClass {
  constructor() {
    this.stream = null;
    this.isMuted = false;
    this.isCameraOff = false;
  }

  /**
   * 미디어 스트림 획득
   */
  async getMediaStream(deviceId) {
    try {
      const constraints = deviceId
        ? CONFIG.MEDIA.SPECIFIC_DEVICE_CONSTRAINTS(deviceId)
        : CONFIG.MEDIA.DEFAULT_CONSTRAINTS;

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!deviceId) {
        await this.getCameras();
      }

      domManager.setLocalStream(this.stream);
      return this.stream;
    } catch (error) {
      console.error(`미디어를 가져오는 도중 에러가 발생했습니다: ${error}`);
      return null;
    }
  }

  /**
   * 사용 가능한 카메라 목록 획득
   */
  async getCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((device) => device.kind === "videoinput");
      const currentCamera = this.stream?.getVideoTracks()[0];

      domManager.updateCameraOptions(cameras, currentCamera);
    } catch (error) {
      console.error(
        `카메라 목록을 가져오는 도중 에러가 발생했습니다: ${error}`
      );
    }
  }

  /**
   * 오디오 토글
   */
  toggleAudio() {
    if (!this.stream) return;

    const audioTracks = this.stream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = this.isMuted;
    });

    domManager.updateAudioButtonText(this.isMuted);
    this.isMuted = !this.isMuted;
  }

  /**
   * 비디오 토글
   */
  toggleCamera() {
    if (!this.stream) return;

    const videoTracks = this.stream.getVideoTracks();
    videoTracks.forEach((track) => {
      track.enabled = this.isCameraOff;
    });

    domManager.updateVideoButtonText(this.isCameraOff);
    this.isCameraOff = !this.isCameraOff;
  }

  /**
   * 카메라 변경
   */
  async changeCamera() {
    const deviceId = domManager.elements.cameraSelect.value;
    await this.getMediaStream(deviceId);

    if (!this.stream) return;

    const videoTrack = this.stream.getVideoTracks()[0];
    if (!videoTrack) return;

    // 모든 피어 연결에 새 비디오 트랙 적용
    Object.entries(PeerConnectionManager.peerConnections).forEach(
      ([_, peerConnection]) => {
        const senders = peerConnection.getSenders();
        const currentVideoSender = senders.find(
          (sender) => sender.track && sender.track.kind === "video"
        );

        if (currentVideoSender) {
          currentVideoSender.replaceTrack(videoTrack);
        }
      }
    );
  }
}

/**
 * 피어 연결 관리 클래스
 */
class PeerConnectionManagerClass {
  constructor() {
    this.peerConnections = {};
  }

  /**
   * 새 WebRTC 피어 연결 생성
   */
  createConnection(receiverSocketId) {
    const peerConnection = new RTCPeerConnection({
      iceServers: CONFIG.ICE_SERVERS,
    });

    // 로컬 미디어 트랙 추가
    const localTracks = MediaStreamManager.stream.getTracks();
    localTracks.forEach((track) =>
      peerConnection.addTrack(track, MediaStreamManager.stream)
    );

    // ICE 후보 이벤트 핸들러
    peerConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        SocketManager.emitIceCandidate(receiverSocketId, candidate);
      }
    };

    this.peerConnections[receiverSocketId] = peerConnection;
    return peerConnection;
  }

  /**
   * 모든 피어 연결 종료
   */
  disconnectAll() {
    Object.values(this.peerConnections).forEach((peerConnection) => {
      peerConnection.close();
    });
    this.peerConnections = {};
  }

  /**
   * 특정 피어 연결 종료
   */
  closeConnection(socketId) {
    const connection = this.peerConnections[socketId];
    if (connection) {
      connection.close();
      delete this.peerConnections[socketId];
    }
  }

  /**
   * 방 참가 처리
   */
  async handleJoinRoom({ receiverSocketId }) {
    const peerConnection = this.createConnection(receiverSocketId);

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      SocketManager.emitOffer(
        receiverSocketId,
        peerConnection.localDescription
      );
    } catch (error) {
      console.error(`offer를 생성하는 도중 에러가 발생했습니다: ${error}`);
    }
  }

  /**
   * Answer SDP 처리
   */
  async handleAnswer({ receiverSocketId, sdp }) {
    try {
      const peerConnection = this.peerConnections[receiverSocketId];
      if (peerConnection) {
        await peerConnection.setRemoteDescription(sdp);
      }
    } catch (error) {
      console.error(`answer를 처리하는 도중 에러가 발생했습니다: ${error}`);
    }
  }

  /**
   * ICE 후보 처리
   */
  async handleIceCandidate({ targetSocketId, iceCandidate }) {
    const peerConnection = this.peerConnections[targetSocketId];

    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(iceCandidate);
      } catch (error) {
        console.error(`ICE candidate 추가 중 에러가 발생했습니다: ${error}`);
      }
    }
  }
}

/**
 * 소켓 통신 관리 클래스
 */
class SocketManagerClass {
  constructor() {
    this.socket = io();
  }

  /**
   * 소켓 연결 및 이벤트 등록
   */
  init() {
    this._registerSocketEvents();
  }

  /**
   * 소켓 이벤트 리스너 등록
   */
  _registerSocketEvents() {
    this.socket.on("join_room", (data) => {
      PeerConnectionManager.handleJoinRoom(data);
    });

    this.socket.on("room_member_count", (roomMemberCount) => {
      domManager.updateUserCount(roomMemberCount);
    });

    this.socket.on("answer", (data) => {
      PeerConnectionManager.handleAnswer(data);
    });

    this.socket.on("ice-candidate", (data) => {
      PeerConnectionManager.handleIceCandidate(data);
    });
  }

  /**
   * 방 참가 이벤트 발송
   */
  emitRoomJoin(roomId, location) {
    this.socket.emit("send_room", { roomId, location });
  }

  /**
   * 방 종료 이벤트 발송
   */
  emitCloseRoom(roomId) {
    this.socket.emit("close_room", roomId);
  }

  /**
   * Offer SDP 발송
   */
  emitOffer(receiverSocketId, sdp) {
    this.socket.emit("offer", {
      roomId: RoomManager.getRoomId(),
      receiverSocketId,
      sdp,
    });
  }

  /**
   * ICE 후보 발송
   */
  emitIceCandidate(socketId, iceCandidate) {
    this.socket.emit("ice-candidate", {
      socketId,
      iceCandidate,
    });
  }
}

/**
 * 위치 관리 클래스
 */
class LocationManagerClass {
  constructor() {
    this.currentPosition = null;
  }

  /**
   * 현재 위치 획득
   */
  async getCurrentPosition() {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      this.currentPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      return this.currentPosition;
    } catch (error) {
      console.error(`위치 정보를 가져오는 도중 에러가 발생했습니다: ${error}`);
      return null;
    }
  }
}

/**
 * 방 관리 클래스
 */
class RoomManagerClass {
  constructor() {
    this.roomId = "";
    this.currentPosition = null;
  }

  /**
   * 방 연결 처리
   */
  async handleRoomConnection(event) {
    event.preventDefault();

    const roomId = domManager.elements.roomIdInput.value.trim();

    if (!roomId) {
      alert("방 ID를 입력해주세요.");
      return;
    }

    this.roomId = roomId;
    this.currentPosition = await LocationManager.getCurrentPosition();
    SocketManager.emitRoomJoin(this.roomId, this.currentPosition);

    domManager.setRoomConnectionFormVisibility(false);
    domManager.setDisConnectButtonVisibility(true);
    domManager.resetRoomIdInput();
  }

  /**
   * 방 연결 해제 처리
   */
  handleRoomDisconnection() {
    SocketManager.emitCloseRoom(this.roomId);
    PeerConnectionManager.disconnectAll();

    domManager.setRoomConnectionFormVisibility(true);
    domManager.setDisConnectButtonVisibility(false);
  }

  getRoomId() {
    return this.roomId;
  }
}

/**
 * 이벤트 관리 클래스
 */
class EventManagerClass {
  constructor() {}

  /**
   * 이벤트 리스너 초기화
   */
  init() {
    // 방 연결 폼 제출 이벤트
    domManager.elements.roomConnectionForm.addEventListener("submit", (event) =>
      RoomManager.handleRoomConnection(event)
    );

    // 오디오 토글 버튼 이벤트
    domManager.elements.audioToggle.addEventListener("click", () =>
      MediaStreamManager.toggleAudio()
    );

    // 비디오 토글 버튼 이벤트
    domManager.elements.videoToggle.addEventListener("click", () =>
      MediaStreamManager.toggleCamera()
    );

    // 카메라 선택 변경 이벤트
    domManager.elements.cameraSelect.addEventListener("change", () =>
      MediaStreamManager.changeCamera()
    );

    // 연결 해제 버튼 이벤트
    domManager.elements.disConnectButton.addEventListener("click", () =>
      RoomManager.handleRoomDisconnection()
    );
  }
}

// 클래스 인스턴스 생성
const domManager = new DOMManager();
const MediaStreamManager = new MediaStreamManagerClass();
const PeerConnectionManager = new PeerConnectionManagerClass();
const SocketManager = new SocketManagerClass();
const LocationManager = new LocationManagerClass();
const RoomManager = new RoomManagerClass();
const EventManager = new EventManagerClass();

/**
 * 애플리케이션 초기화
 */
async function initApp() {
  // 1. DOM 초기화
  domManager.setDisConnectButtonVisibility(false);

  // 2. 소켓 통신 초기화
  SocketManager.init();

  // 3. 미디어 스트림 초기화
  await MediaStreamManager.getMediaStream();

  // 4. 이벤트 리스너 등록
  EventManager.init();
}

// 앱 시작
document.addEventListener("DOMContentLoaded", initApp);
