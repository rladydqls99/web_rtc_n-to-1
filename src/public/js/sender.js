// Socket 연결 설정
const socket = io();

// DOM 요소
const elements = {
  roomConnectionForm: document.getElementById("room-connection-form"),
  roomIdInput: document.querySelector("#room-connection-form input"),

  streamContainer: document.getElementById("stream-container"),
  localVideo: document.querySelector("#stream-container video"),
  cameraSelect: document.querySelector("#stream-container select"),
  connectionStatus: document.querySelector(
    "#stream-container #connection-status"
  ),

  audioToggle: document.getElementById("audio-toggle"),
  videoToggle: document.getElementById("video-toggle"),
};

// 미디어 상태 관리
const mediaState = {
  stream: null,
  isMuted: false,
  isCameraOff: false,
};

// 미디어 구성 옵션
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
      elements.connectionStatus.textContent = "연결완료";
    }

    elements.localVideo.srcObject = mediaState.stream;
  } catch (error) {
    console.error(`미디어를 가져오는 도중 에러가 발생했습니다: ${error}`);
    elements.connectionStatus.textContent = "연결실패";
  }
};

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
    ? "오디오 Off"
    : "오디오 On";
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
    ? "비디오 Off"
    : "비디오 On";
  mediaState.isCameraOff = !mediaState.isCameraOff;
};

const initEventListeners = () => {
  elements.roomConnectionForm.addEventListener("submit", handleRoomConnection);
  elements.audioToggle.addEventListener("click", handleMuteToggle);
  elements.videoToggle.addEventListener("click", handleCameraOffToggle);
  elements.cameraSelect.addEventListener("change", handleCameraChange);
};

const init = () => {
  initEventListeners();
};

init();
