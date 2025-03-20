const socket = io();

const handleRoomClick = (e) => {
  const roomId = e.target.textContent;

  socket.emit("join_room", roomId);
};
socket.on("room-list", (rooms) => {
  const roomList = document.getElementById("room-list");
  roomList.innerHTML = "";

  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.textContent = room;
    li.className = "room-card";
    li.addEventListener("click", (e) => handleRoomClick(e));
    roomList.appendChild(li);
  });
});
