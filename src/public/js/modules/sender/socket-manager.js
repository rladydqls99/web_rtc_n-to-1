"use strict";

import PeerConnectionManager from './peer-connection-manager.js';
import domManager from './dom-manager.js';
import RoomManager from './room-manager.js';

/**
 * 소켓 통신 관리 클래스
 */
class SocketManagerClass {
  constructor() {
    this.socket = null;
    
    // Socket.IO가 로드되었는지 확인
    if (typeof io !== 'undefined') {
      this.socket = io();
    } else {
      console.error('Socket.IO가 로드되지 않았습니다.');
    }
  }

  /**
   * 소켓 연결 및 이벤트 등록
   */
  init() {
    if (!this.socket) {
      console.error('소켓이 초기화되지 않았습니다.');
      return;
    }
    
    this._registerSocketEvents();
  }

  /**
   * 소켓 이벤트 리스너 등록
   */
  _registerSocketEvents() {
    this.socket.on("join_room", (data) => {
      PeerConnectionManager.handleJoinRoom(data);
    });

    this.socket.on("room_member_count", (roomMemberCount) => {
      domManager.updateUserCount(roomMemberCount);
    });

    this.socket.on("answer", (data) => {
      PeerConnectionManager.handleAnswer(data);
    });

    this.socket.on("ice-candidate", (data) => {
      PeerConnectionManager.handleIceCandidate(data);
    });
  }

  /**
   * 방 참가 이벤트 발송
   */
  emitRoomJoin(roomId, location) {
    this.socket.emit("send_room", { roomId, location });
  }

  /**
   * 방 종료 이벤트 발송
   */
  emitCloseRoom(roomId) {
    this.socket.emit("close_room", roomId);
  }

  /**
   * Offer SDP 발송
   */
  emitOffer(receiverSocketId, sdp) {
    this.socket.emit("offer", {
      roomId: RoomManager.getRoomId(),
      receiverSocketId,
      sdp,
    });
  }

  /**
   * ICE 후보 발송
   */
  emitIceCandidate(socketId, iceCandidate) {
    this.socket.emit("ice-candidate", {
      socketId,
      iceCandidate,
    });
  }
}

// 싱글톤 인스턴스 생성
export default new SocketManagerClass();
