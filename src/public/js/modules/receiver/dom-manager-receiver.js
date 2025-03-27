"use strict";

/**
 * DOM 요소 관리 클래스
 */
class DOMManagerReceiver {
  constructor() {
    this.elements = {};
    
    // DOM이 완전히 로드된 후 요소를 초기화
    document.addEventListener('DOMContentLoaded', () => {
      this.initElements();
    });
    
    // 이미 DOM이 로드되었다면 즉시 초기화
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      this.initElements();
    }
  }
  
  /**
   * DOM 요소 초기화
   */
  initElements() {
    this.elements = {
      roomCount: document.getElementById("room-count"),
      streamContainer: document.getElementById("stream-container"),
      mapContainer: document.getElementById("map"),
    };
  }

  /**
   * 비디오 요소 생성
   * @param {string} roomId - 방 ID
   */
  createVideoElement(roomId) {
    const videoContainer = document.createElement("div");
    videoContainer.id = `video-container-${roomId}`;
    videoContainer.className = "video-container";

    const videoHeader = document.createElement("div");
    videoHeader.className = "video-header";

    const videoTitle = document.createElement("h2");
    videoTitle.className = "video-title";
    videoTitle.textContent = `Room ${roomId}`;

    const videoDisconnectButton = document.createElement("button");
    videoDisconnectButton.className = "video-disconnect-button";
    videoDisconnectButton.textContent = "Disconnect";
    videoDisconnectButton.addEventListener("click", () => {
      // RoomManager는 import 대신 전역 객체로 접근
      RoomManager.leaveCurrentRoom(roomId);
    });

    const videoWrapper = document.createElement("div");
    videoWrapper.className = "video-wrapper";

    const video = document.createElement("video");
    video.id = `video-${roomId}`;
    video.className = "video";
    video.autoplay = true;
    video.playsInline = true;

    videoHeader.appendChild(videoTitle);
    videoHeader.appendChild(videoDisconnectButton);

    videoWrapper.appendChild(video);

    videoContainer.appendChild(videoHeader);
    videoContainer.appendChild(videoWrapper);

    this.elements.streamContainer.appendChild(videoContainer);
  }

  /**
   * 방 목록 업데이트
   * @param {Array} rooms - 사용 가능한 방 목록
   */
  updateRooms(rooms) {
    const { roomCount } = this.elements;

    roomCount.textContent = `${rooms.length} ${
      rooms.length < 1 ? "room" : "rooms"
    }`;

    if (rooms.length === 0) {
      // MapManager는 import 대신 전역 객체로 접근
      MapManager.clearMarkers();
    } else {
      MapManager.updateMarkers(rooms);
    }
  }

  /**
   * 원격 스트림 설정
   * @param {MediaStream} stream - 원격 미디어 스트림
   * @param {string} roomId - 방 ID
   */
  setRemoteStream(stream, roomId) {
    const videoElement = document.getElementById(`video-${roomId}`);
    videoElement.srcObject = stream;
  }

  /**
   * 비디오 요소 삭제
   * @param {string} roomId - 방 ID
   */
  deleteVideoElement(roomId) {
    const videoElement = document.getElementById(`video-container-${roomId}`);
    if (videoElement) {
      videoElement.remove();
    }
  }
}

// 싱글톤 인스턴스 생성
export default new DOMManagerReceiver();
