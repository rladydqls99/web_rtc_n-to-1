const socket = io();

socket.on("room-list", (rooms) => {
  const roomList = document.getElementById("room-list");
  roomList.innerHTML = "";

  rooms.forEach((room) => {
    const li = document.createElement("li");
    li.textContent = room;
    li.className = "room-card";
    roomList.appendChild(li);
  });
});
