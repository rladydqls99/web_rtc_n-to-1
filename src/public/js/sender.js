// Socket 연결 설정
const socket = io();

// DOM 요소
const elements = {
  roomConnectionForm: document.getElementById("room-connection-form"),
  roomIdInput: document.querySelector("#room-connection-form input"),

  streamContainer: document.getElementById("stream-container"),
  localVideo: document.querySelector("#stream-container video"),
  cameraSelect: document.querySelector("#stream-container select"),

  audioToggle: document.getElementById("audio-toggle"),
  videoToggle: document.getElementById("video-toggle"),
};

// 미디어 상태 관리
const mediaState = {
  stream: null,
  isMuted: false,
  isCameraOff: false,
  peerConnections: {},
};

// 미디어 구성 함수 ----------------------------------------------------------

const getMediaConfig = (deviceId) => {
  if (deviceId) {
    return { audio: true, video: { deviceId: { exact: deviceId } } };
  }
  return { audio: true, video: { facingMode: "user" } };
};

const getCameras = async () => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const cameras = devices.filter((device) => device.kind === "videoinput");
    const currentCamera = mediaState.stream.getVideoTracks()[0];

    cameras.forEach((camera) => {
      const option = document.createElement("option");

      option.value = camera.deviceId;
      option.text = camera.label;
      option.selected = currentCamera.label === camera.label;

      elements.cameraSelect.appendChild(option);
    });
  } catch (error) {
    console.error(`카메라 목록을 가져오는 도중 에러가 발생했습니다: ${error}`);
  }
};

const getMediaStream = async (deviceId) => {
  try {
    const constraints = getMediaConfig(deviceId);
    mediaState.stream = await navigator.mediaDevices.getUserMedia(constraints);

    if (!deviceId) {
      getCameras();
    }

    elements.localVideo.srcObject = mediaState.stream;
  } catch (error) {
    console.error(`미디어를 가져오는 도중 에러가 발생했습니다: ${error}`);
  }
};

const createPeerConnection = (receiverSocketId) => {
  const peerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.stunprotocol.org:3478" },
      { urls: "stun:stun.l.google.com:19302" },
    ],
  });

  const localStream = mediaState.stream.getTracks();
  localStream.forEach((track) =>
    peerConnection.addTrack(track, mediaState.stream)
  );

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        socketId: receiverSocketId,
        iceCandidate: event.candidate,
      });
    }
  };

  mediaState.peerConnections[receiverSocketId] = peerConnection;

  return peerConnection;
};

// 소켓 이벤트 ----------------------------------------------------------

socket.on("join_room", async ({ receiverSocketId }) => {
  const peerConnection = createPeerConnection(receiverSocketId);

  try {
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    socket.emit("offer", {
      receiverSocketId,
      sdp: peerConnection.localDescription,
    });
  } catch (error) {
    console.error(`offer를 생성하는 도중 에러가 발생했습니다: ${error}`);
  }
});

socket.on("answer", async ({ receiverSocketId, sdp }) => {
  try {
    const peerConnection = mediaState.peerConnections[receiverSocketId];
    await peerConnection.setRemoteDescription(sdp);
  } catch (error) {
    console.error(`answer를 처리하는 도중 에러가 발생했습니다: ${error}`);
  }
});

socket.on("ice-candidate", async ({ targetSocketId, iceCandidate }) => {
  const peerConnection = mediaState.peerConnections[targetSocketId];

  if (peerConnection) {
    try {
      await peerConnection.addIceCandidate(iceCandidate);
    } catch (error) {
      console.error(`ICE candidate 추가 중 에러가 발생했습니다: ${error}`);
    }
  }
});

// 핸들러 ----------------------------------------------------------

const handleRoomConnection = (event) => {
  event.preventDefault();

  const roomId = elements.roomIdInput.value.trim();

  if (!roomId) {
    alert("방 ID를 입력해주세요.");
    return;
  }

  socket.emit("send_room", roomId, getMediaStream);
  elements.roomIdInput.value = "";
};

const handleMuteToggle = () => {
  if (!mediaState.stream) return;

  const audioTracks = mediaState.stream.getAudioTracks();
  audioTracks.forEach((track) => {
    track.enabled = mediaState.isMuted;
  });

  elements.audioToggle.textContent = mediaState.isMuted
    ? "Audio Off"
    : "Audio On";
  mediaState.isMuted = !mediaState.isMuted;
};

const handleCameraChange = () => {
  const deviceId = elements.cameraSelect.value;

  getMediaStream(deviceId);
};

const handleCameraOffToggle = () => {
  if (!mediaState.stream) return;

  const videoTracks = mediaState.stream.getVideoTracks();
  videoTracks.forEach((track) => {
    track.enabled = mediaState.isCameraOff;
  });

  elements.videoToggle.textContent = mediaState.isCameraOff
    ? "Video Off"
    : "Video On";
  mediaState.isCameraOff = !mediaState.isCameraOff;
};

const initEventListeners = () => {
  elements.roomConnectionForm.addEventListener("submit", handleRoomConnection);
  elements.audioToggle.addEventListener("click", handleMuteToggle);
  elements.videoToggle.addEventListener("click", handleCameraOffToggle);
  elements.cameraSelect.addEventListener("change", handleCameraChange);
};

// 초기화 ----------------------------------------------------------

const init = () => {
  initEventListeners();
  getMediaStream();
};

init();
