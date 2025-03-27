"use strict";

import { CONFIG } from '../common/config.js';
import domManagerReceiver from './dom-manager-receiver.js';
import SocketManagerReceiver from './socket-manager-receiver.js';

/**
 * WebRTC 연결 관리 클래스
 */
class PeerConnectionManagerReceiverClass {
  constructor() {
    this.peerConnections = {};
  }

  /**
   * 새 피어 연결 생성
   * @param {string} roomId - 방 ID
   * @param {string} senderSocketId - 발신자 소켓 ID
   * @returns {RTCPeerConnection} 생성된 피어 연결
   */
  async createConnection(roomId, senderSocketId) {
    const peerConnection = new RTCPeerConnection({
      iceServers: CONFIG.ICE_SERVERS,
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        SocketManagerReceiver.sendIceCandidate(senderSocketId, event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      const stream = event.streams[0];
      domManagerReceiver.setRemoteStream(stream, roomId);
    };

    this.peerConnections[roomId] = peerConnection;

    return peerConnection;
  }

  /**
   * 피어 연결 종료
   * @param {string} roomId - 방 ID
   */
  closeConnection(roomId) {
    const peerConnection = this.peerConnections[roomId];

    if (peerConnection) {
      peerConnection.close();
      delete this.peerConnections[roomId];
    }
  }

  /**
   * ICE 후보 추가
   * @param {string} roomId - 방 ID
   * @param {RTCIceCandidate} candidate - ICE 후보
   */
  async addIceCandidate(roomId, candidate) {
    const peerConnection = this.peerConnections[roomId];

    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(candidate);
      } catch (error) {
        console.error(`Error adding ICE candidate: ${error}`);
      }
    }
  }

  /**
   * Offer 처리
   * @param {string} roomId - 방 ID
   * @param {string} senderSocketId - 발신자 소켓 ID
   * @param {RTCSessionDescription} sdp - SDP 설명
   */
  async handleOffer(roomId, senderSocketId, sdp) {
    const peerConnection = await this.createConnection(roomId, senderSocketId);

    try {
      await peerConnection.setRemoteDescription(sdp);
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      SocketManagerReceiver.sendAnswer(senderSocketId, peerConnection.localDescription);
    } catch (error) {
      console.error(`Error creating answer: ${error}`);
    }
  }
}

// 싱글톤 인스턴스 생성
export default new PeerConnectionManagerReceiverClass();
