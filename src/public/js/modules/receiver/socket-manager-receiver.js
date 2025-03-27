"use strict";

import domManagerReceiver from './dom-manager-receiver.js';
import PeerConnectionManagerReceiver from './peer-connection-manager-receiver.js';
import RoomManagerReceiver from './room-manager-receiver.js';

/**
 * 소켓 통신 관리 클래스
 */
class SocketManagerReceiverClass {
  constructor() {
    this.socket = null;
    
    // Socket.IO가 로드되었는지 확인
    if (typeof io !== 'undefined') {
      this.socket = io();
    } else {
      console.error('Socket.IO가 로드되지 않았습니다.');
    }
    this.eventHandlers = {
      offer: this.handleOffer.bind(this),
      "ice-candidate": this.handleIceCandidate.bind(this),
      room_list: this.handleRoomList.bind(this),
      close_room: this.handleCloseRoom.bind(this),
    };
  }

  /**
   * 소켓 이벤트 등록 및 초기화
   */
  initialize() {
    if (!this.socket) {
      console.error('소켓이 초기화되지 않았습니다.');
      return;
    }
    
    // 이벤트 리스너 등록
    Object.entries(this.eventHandlers).forEach(([event, handler]) => {
      this.socket.on(event, handler);
    });

    // 방 목록 요청
    this.getRoomList();
  }

  /**
   * Offer 수신 처리
   * @param {Object} data - 수신 데이터
   */
  async handleOffer({ roomId, senderSocketId, sdp }) {
    await PeerConnectionManagerReceiver.handleOffer(roomId, senderSocketId, sdp);
  }

  /**
   * ICE 후보 수신 처리
   * @param {Object} data - 수신 데이터
   */
  async handleIceCandidate({ targetSocketId, iceCandidate }) {
    await PeerConnectionManagerReceiver.addIceCandidate(targetSocketId, iceCandidate);
  }

  /**
   * 방 목록 수신 처리
   * @param {Array} rooms - 방 목록
   */
  handleRoomList(rooms) {
    domManagerReceiver.updateRooms(rooms);
  }

  /**
   * 방 종료 수신 처리
   * @param {string} roomId - 방 ID
   */
  handleCloseRoom(roomId) {
    RoomManagerReceiver.handleRoomClosed(roomId);
  }

  /**
   * 방 목록 요청
   */
  getRoomList() {
    this.socket.emit("get_rooms");
  }

  /**
   * 방 입장
   * @param {string} roomId - 방 ID
   */
  joinRoom(roomId) {
    this.socket.emit("join_room", roomId);
  }

  /**
   * 방 퇴장
   * @param {string} roomId - 방 ID
   */
  leaveRoom(roomId) {
    this.socket.emit("leave_room", roomId);
  }

  /**
   * Answer 전송
   * @param {string} senderSocketId - 발신자 소켓 ID
   * @param {RTCSessionDescription} sdp - SDP 설명
   */
  sendAnswer(senderSocketId, sdp) {
    this.socket.emit("answer", {
      senderSocketId,
      sdp,
    });
  }

  /**
   * ICE 후보 전송
   * @param {string} socketId - 소켓 ID
   * @param {RTCIceCandidate} candidate - ICE 후보
   */
  sendIceCandidate(socketId, candidate) {
    this.socket.emit("ice-candidate", {
      socketId,
      iceCandidate: candidate,
    });
  }
}

// 싱글톤 인스턴스 생성
export default new SocketManagerReceiverClass();
