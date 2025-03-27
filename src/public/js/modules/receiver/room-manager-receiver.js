"use strict";

import domManagerReceiver from './dom-manager-receiver.js';
import SocketManagerReceiver from './socket-manager-receiver.js';
import PeerConnectionManagerReceiver from './peer-connection-manager-receiver.js';

/**
 * 방 관리 클래스
 */
class RoomManagerReceiverClass {
  constructor() {
    this.currentRoomSet = new Set();
  }

  /**
   * 방 입장 처리
   * @param {string} roomId - 방 ID
   */
  joinRoom(roomId) {
    this.currentRoomSet.add(roomId);

    SocketManagerReceiver.joinRoom(roomId);
    domManagerReceiver.createVideoElement(roomId);
  }

  /**
   * 현재 방 퇴장
   * @param {string} roomId - 방 ID
   */
  leaveCurrentRoom(roomId) {
    this.currentRoomSet.delete(roomId);

    domManagerReceiver.deleteVideoElement(roomId);
    SocketManagerReceiver.leaveRoom(roomId);
    PeerConnectionManagerReceiver.closeConnection(roomId);
  }

  /**
   * 방 종료 처리
   * @param {string} roomId - 방 ID
   */
  handleRoomClosed(roomId) {
    this.currentRoomSet.delete(roomId);

    domManagerReceiver.deleteVideoElement(roomId);
    PeerConnectionManagerReceiver.closeConnection(roomId);
  }
}

// 싱글톤 인스턴스 생성
export default new RoomManagerReceiverClass();
