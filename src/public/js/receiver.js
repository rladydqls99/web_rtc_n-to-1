// Socket 연결 설정
const socket = io();

// DOM 요소
const elements = {
  roomList: document.getElementById("room-list"),
  streamContainer: document.getElementById("stream-container"),
  remoteVideo: document.querySelector("#stream-container video"),
};

// peer 상태 관리
const peerState = {
  peerConnections: {},
};

// 피어 연결 함수 ----------------------------------------------------------

const createPeerConnection = async (senderSocketId) => {
  const peerConnection = new RTCPeerConnection({
    iceServers: [
      { urls: "stun:stun.stunprotocol.org:3478" },
      { urls: "stun:stun.l.google.com:19302" },
    ],
  });

  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.emit("ice-candidate", {
        socketId: senderSocketId,
        iceCandidate: event.candidate,
      });
    }
  };

  peerConnection.ontrack = (event) => {
    const stream = event.streams[0];

    elements.remoteVideo.srcObject = stream;
  };

  peerState.peerConnections[senderSocketId] = peerConnection;

  return peerConnection;
};

// 소켓 이벤트 ----------------------------------------------------------
socket.on("offer", async ({ senderSocketId, sdp }) => {
  const peerConnection = await createPeerConnection(senderSocketId);

  try {
    await peerConnection.setRemoteDescription(sdp);

    const answer = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(answer);

    socket.emit("answer", {
      senderSocketId,
      sdp: peerConnection.localDescription,
    });
  } catch (error) {
    console.error(`answer를 생성하는 도중 에러가 발생했습니다: ${error}`);
  }
});

socket.on("ice-candidate", async ({ targetSocketId, iceCandidate }) => {
  const peerConnection = peerState.peerConnections[targetSocketId];

  if (peerConnection) {
    try {
      await peerConnection.addIceCandidate(iceCandidate);
    } catch (error) {
      console.error(`ICE candidate 추가 중 에러가 발생했습니다: ${error}`);
    }
  }
});

socket.on("room-list", (rooms) => {
  updateRoomList(rooms);
});

// 핸들러 ----------------------------------------------------------

const handleRoomClick = (roomId) => {
  socket.emit("join_room", roomId);
  elements.streamContainer.hidden = false;
};

// helper 함수 ----------------------------------------------------------

const updateRoomList = (rooms) => {
  elements.roomList.innerHTML = "";

  if (rooms.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No rooms available";
    li.className = "room-card";
    elements.roomList.appendChild(li);
    return;
  }

  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.textContent = room;
    li.className = "room-card";
    li.addEventListener("click", () => handleRoomClick(room));
    elements.roomList.appendChild(li);
  });
};

// 초기화 ----------------------------------------------------------

const initSocketEvents = () => {};

const init = () => {
  elements.streamContainer.hidden = true;

  socket.emit("get-rooms");

  initSocketEvents();
};

// 초기화 실행
init();
