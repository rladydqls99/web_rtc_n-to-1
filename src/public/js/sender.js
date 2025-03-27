"use strict";

// 모든 필요한 모듈 가져오기
import domManager from "./modules/sender/dom-manager.js";
import MediaStreamManager from "./modules/sender/media-stream-manager.js";
import SocketManager from "./modules/sender/socket-manager.js";
import EventManager from "./modules/sender/event-manager.js";

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
