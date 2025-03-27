"use strict";

import domManager from './dom-manager.js';
import LocationManager from './location-manager.js';
import SocketManager from './socket-manager.js';
import PeerConnectionManager from './peer-connection-manager.js';

/**
 * 방 관리 클래스
 */
class RoomManagerClass {
  constructor() {
    this.roomId = "";
    this.currentPosition = null;
  }

  /**
   * 방 연결 처리
   */
  async handleRoomConnection(event) {
    event.preventDefault();

    const roomId = domManager.elements.roomIdInput.value.trim();

    if (!roomId) {
      alert("방 ID를 입력해주세요.");
      return;
    }

    this.roomId = roomId;
    this.currentPosition = await LocationManager.getCurrentPosition();
    SocketManager.emitRoomJoin(this.roomId, this.currentPosition);

    domManager.setRoomConnectionFormVisibility(false);
    domManager.setDisConnectButtonVisibility(true);
    domManager.resetRoomIdInput();
  }

  /**
   * 방 연결 해제 처리
   */
  handleRoomDisconnection() {
    SocketManager.emitCloseRoom(this.roomId);
    PeerConnectionManager.disconnectAll();

    domManager.setRoomConnectionFormVisibility(true);
    domManager.setDisConnectButtonVisibility(false);
  }

  /**
   * 현재 방 ID 반환
   */
  getRoomId() {
    return this.roomId;
  }
}

// 싱글톤 인스턴스 생성
export default new RoomManagerClass();
