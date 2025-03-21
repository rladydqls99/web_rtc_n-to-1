(function () {
  "use strict";

  const CONFIG = {
    ICE_SERVERS: [
      { urls: "stun:stun.stunprotocol.org:3478" },
      { urls: "stun:stun.l.google.com:19302" },
    ],
  };

  const DOMElements = {
    roomConnectionForm: document.getElementById("room-connection-form"),
    roomIdInput: document.querySelector("#room-connection-form input"),
    streamContainer: document.getElementById("stream-container"),
    localVideo: document.querySelector("#stream-container video"),
    cameraSelect: document.querySelector("#stream-container select"),
    audioToggle: document.getElementById("audio-toggle"),
    videoToggle: document.getElementById("video-toggle"),

    updateCameraOptions(cameras, currentCamera) {
      this.cameraSelect.innerHTML = "";
      cameras.forEach((camera) => {
        const option = document.createElement("option");
        option.value = camera.deviceId;
        option.text = camera.label;
        option.selected = currentCamera.label === camera.label;
        this.cameraSelect.appendChild(option);
      });
    },

    setLocalStream(stream) {
      this.localVideo.srcObject = stream;
    },

    updateAudioButtonText(isMuted) {
      this.audioToggle.textContent = isMuted ? "Audio Off" : "Audio On";
    },

    updateVideoButtonText(isCameraOff) {
      this.videoToggle.textContent = isCameraOff ? "Video Off" : "Video On";
    },
  };

  const MediaManager = {
    stream: null,
    isMuted: false,
    isCameraOff: false,

    getMediaConfig(deviceId) {
      if (deviceId) {
        return { audio: true, video: { deviceId: { exact: deviceId } } };
      }
      return { audio: true, video: { facingMode: "user" } };
    },

    async getCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(
          (device) => device.kind === "videoinput"
        );
        const currentCamera = this.stream.getVideoTracks()[0];

        DOMElements.updateCameraOptions(cameras, currentCamera);
      } catch (error) {
        console.error(
          `카메라 목록을 가져오는 도중 에러가 발생했습니다: ${error}`
        );
      }
    },

    async getMediaStream(deviceId) {
      try {
        const constraints = this.getMediaConfig(deviceId);
        this.stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (!deviceId) {
          this.getCameras();
        }

        DOMElements.setLocalStream(this.stream);
      } catch (error) {
        console.error(`미디어를 가져오는 도중 에러가 발생했습니다: ${error}`);
      }
    },

    toggleAudio() {
      if (!this.stream) return;

      const audioTracks = this.stream.getAudioTracks();
      audioTracks.forEach((track) => {
        track.enabled = this.isMuted;
      });

      DOMElements.updateAudioButtonText(this.isMuted);
      this.isMuted = !this.isMuted;
    },

    toggleCamera() {
      if (!this.stream) return;

      const videoTracks = this.stream.getVideoTracks();
      videoTracks.forEach((track) => {
        track.enabled = this.isCameraOff;
      });

      DOMElements.updateVideoButtonText(this.isCameraOff);
      this.isCameraOff = !this.isCameraOff;
    },

    async changeCamera() {
      const deviceId = DOMElements.cameraSelect.value;
      await this.getMediaStream(deviceId);

      const videoTrack = this.stream.getVideoTracks()[0];

      Object.entries(PeerConnectionManager.peerConnections).forEach(
        ([_, peerConnection]) => {
          const currentVideo = peerConnection
            .getSenders()
            .find((sender) => sender.track.kind === "video");

          currentVideo.replaceTrack(videoTrack);
        }
      );
    },
  };

  const PeerConnectionManager = {
    peerConnections: {},

    createConnection(receiverSocketId) {
      const peerConnection = new RTCPeerConnection({
        iceServers: CONFIG.ICE_SERVERS,
      });

      const localStream = MediaManager.stream.getTracks();
      localStream.forEach((track) =>
        peerConnection.addTrack(track, MediaManager.stream)
      );

      peerConnection.onicecandidate = ({ candidate }) => {
        if (candidate) {
          SocketManager.emitIceCandidate(receiverSocketId, candidate);
        }
      };

      this.peerConnections[receiverSocketId] = peerConnection;
      return peerConnection;
    },

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
    },

    async handleAnswer({ receiverSocketId, sdp }) {
      try {
        const peerConnection = this.peerConnections[receiverSocketId];
        await peerConnection.setRemoteDescription(sdp);
      } catch (error) {
        console.error(`answer를 처리하는 도중 에러가 발생했습니다: ${error}`);
      }
    },

    async handleIceCandidate({ targetSocketId, iceCandidate }) {
      const peerConnection = this.peerConnections[targetSocketId];

      if (peerConnection) {
        try {
          await peerConnection.addIceCandidate(iceCandidate);
        } catch (error) {
          console.error(`ICE candidate 추가 중 에러가 발생했습니다: ${error}`);
        }
      }
    },
  };

  const SocketManager = {
    socket: io(),

    init() {
      this.registerEvents();
    },

    registerEvents() {
      this.socket.on("join_room", (data) =>
        PeerConnectionManager.handleJoinRoom(data)
      );
      this.socket.on("answer", (data) =>
        PeerConnectionManager.handleAnswer(data)
      );
      this.socket.on("ice-candidate", (data) =>
        PeerConnectionManager.handleIceCandidate(data)
      );
    },

    emitRoomJoin(roomId) {
      this.socket.emit("send_room", roomId);
    },

    emitOffer(receiverSocketId, sdp) {
      this.socket.emit("offer", {
        receiverSocketId,
        sdp,
      });
    },

    emitIceCandidate(socketId, iceCandidate) {
      this.socket.emit("ice-candidate", {
        socketId,
        iceCandidate,
      });
    },
  };

  const RoomManager = {
    handleRoomConnection(event) {
      event.preventDefault();

      const roomId = DOMElements.roomIdInput.value.trim();

      if (!roomId) {
        alert("방 ID를 입력해주세요.");
        return;
      }

      SocketManager.emitRoomJoin(roomId);
      DOMElements.roomIdInput.value = "";
    },
  };

  const EventManager = {
    init() {
      DOMElements.roomConnectionForm.addEventListener("submit", (event) =>
        RoomManager.handleRoomConnection(event)
      );

      DOMElements.audioToggle.addEventListener("click", () =>
        MediaManager.toggleAudio()
      );

      DOMElements.videoToggle.addEventListener("click", () =>
        MediaManager.toggleCamera()
      );

      DOMElements.cameraSelect.addEventListener("change", () =>
        MediaManager.changeCamera()
      );
    },
  };

  async function initApp() {
    // 미디어 스트림 초기화
    await MediaManager.getMediaStream();

    // 이벤트 리스너 등록
    EventManager.init();

    // 소켓 통신 초기화
    SocketManager.init();
  }

  // 앱 시작
  initApp();
})();
