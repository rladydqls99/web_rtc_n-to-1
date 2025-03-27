"use strict";

import domManager from './dom-manager.js';
import MediaStreamManager from './media-stream-manager.js';
import RoomManager from './room-manager.js';

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

// 싱글톤 인스턴스 생성
export default new EventManagerClass();
