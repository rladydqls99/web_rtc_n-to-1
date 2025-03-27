"use strict";

// 모든 필요한 모듈 가져오기
import MapManager from "./modules/receiver/map-manager.js";
import SocketManagerReceiver from "./modules/receiver/socket-manager-receiver.js";
import RoomManagerReceiver from "./modules/receiver/room-manager-receiver.js";

/**
 * 애플리케이션 초기화
 */
function initApp() {
  // 지도 초기화
  MapManager.initialize();

  // 소켓 통신 초기화
  SocketManagerReceiver.initialize();
}

// 애플리케이션 시작
document.addEventListener("DOMContentLoaded", initApp);

// 전역 객체로 내보내기 (DOM에서 직접 접근용)
window.RoomManager = RoomManagerReceiver;
window.MapManager = MapManager;
