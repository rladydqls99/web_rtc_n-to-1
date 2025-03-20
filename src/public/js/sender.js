const socket = io();

const roomConnectionForm = document.getElementById("room-connection-form");

const handleSendVideo = (e) => {
  e.preventDefault();

  const roomIdInput = roomConnectionForm.querySelector("input");
  const roomId = roomIdInput.value;

  socket.emit("sendVideo", roomId);

  roomIdInput.value = "";
};

roomConnectionForm.addEventListener("submit", handleSendVideo);
