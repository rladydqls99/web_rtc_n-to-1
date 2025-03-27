"use strict";

import { CONFIG } from '../common/config.js';
import MediaStreamManager from './media-stream-manager.js';
import SocketManager from './socket-manager.js';

/**
 * 피어 연결 관리 클래스
 */
class PeerConnectionManagerClass {
  constructor() {
    this.peerConnections = {};
  }

  /**
   * 새 WebRTC 피어 연결 생성
   */
  createConnection(receiverSocketId) {
    const peerConnection = new RTCPeerConnection({
      iceServers: CONFIG.ICE_SERVERS,
    });

    // 로컬 미디어 트랙 추가
    const localTracks = MediaStreamManager.stream.getTracks();
    localTracks.forEach((track) =>
      peerConnection.addTrack(track, MediaStreamManager.stream)
    );

    // ICE 후보 이벤트 핸들러
    peerConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        SocketManager.emitIceCandidate(receiverSocketId, candidate);
      }
    };

    this.peerConnections[receiverSocketId] = peerConnection;
    return peerConnection;
  }

  /**
   * 모든 피어 연결 종료
   */
  disconnectAll() {
    Object.values(this.peerConnections).forEach((peerConnection) => {
      peerConnection.close();
    });
    this.peerConnections = {};
  }

  /**
   * 특정 피어 연결 종료
   */
  closeConnection(socketId) {
    const connection = this.peerConnections[socketId];
    if (connection) {
      connection.close();
      delete this.peerConnections[socketId];
    }
  }

  /**
   * 방 참가 처리
   */
  async handleJoinRoom({ receiverSocketId }) {
    const peerConnection = this.createConnection(receiverSocketId);

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      SocketManager.emitOffer(
        receiverSocketId,
        peerConnection.localDescription
      );
    } catch (error) {
      console.error(`offer를 생성하는 도중 에러가 발생했습니다: ${error}`);
    }
  }

  /**
   * Answer SDP 처리
   */
  async handleAnswer({ receiverSocketId, sdp }) {
    try {
      const peerConnection = this.peerConnections[receiverSocketId];
      if (peerConnection) {
        await peerConnection.setRemoteDescription(sdp);
      }
    } catch (error) {
      console.error(`answer를 처리하는 도중 에러가 발생했습니다: ${error}`);
    }
  }

  /**
   * ICE 후보 처리
   */
  async handleIceCandidate({ targetSocketId, iceCandidate }) {
    const peerConnection = this.peerConnections[targetSocketId];

    if (peerConnection) {
      try {
        await peerConnection.addIceCandidate(iceCandidate);
      } catch (error) {
        console.error(`ICE candidate 추가 중 에러가 발생했습니다: ${error}`);
      }
    }
  }
}

// 싱글톤 인스턴스 생성
export default new PeerConnectionManagerClass();
