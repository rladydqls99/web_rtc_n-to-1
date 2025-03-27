"use strict";

/**
 * DOM 요소 관리 클래스
 */
export class DOMManager {
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
      roomConnectionForm: document.getElementById("room-connection-form"),
      roomIdInput: document.querySelector("#room-connection-form input"),
      disConnectButton: document.getElementById("disconnect-button"),
      streamContainer: document.getElementById("stream-container"),
      localVideo: document.querySelector("#stream-container video"),
      cameraSelect: document.querySelector("#stream-container select"),
      audioToggle: document.getElementById("audio-toggle"),
      videoToggle: document.getElementById("video-toggle"),
      userCount: document.getElementById("user-count"),
    };
  }

  /**
   * 카메라 옵션 목록 업데이트
   */
  updateCameraOptions(cameras, currentCamera) {
    const select = this.elements.cameraSelect;
    select.innerHTML = "";

    cameras.forEach((camera) => {
      const option = document.createElement("option");
      option.value = camera.deviceId;
      option.text = camera.label;
      option.selected = currentCamera && currentCamera.label === camera.label;
      select.appendChild(option);
    });
  }

  /**
   * 로컬 비디오 스트림 설정
   */
  setLocalStream(stream) {
    this.elements.localVideo.srcObject = stream;
  }

  /**
   * 연결 해제 버튼 표시 상태 설정
   */
  setDisConnectButtonVisibility(isVisible) {
    this.elements.disConnectButton.hidden = !isVisible;
  }

  /**
   * 방 연결 폼 표시 상태 설정
   */
  setRoomConnectionFormVisibility(isVisible) {
    this.elements.roomConnectionForm.hidden = !isVisible;
  }

  /**
   * 방 ID 입력 초기화
   */
  resetRoomIdInput() {
    this.elements.roomIdInput.value = "";
  }

  /**
   * 오디오 버튼 텍스트 업데이트
   */
  updateAudioButtonText(isMuted) {
    this.elements.audioToggle.textContent = isMuted ? "Audio Off" : "Audio On";
  }

  /**
   * 비디오 버튼 텍스트 업데이트
   */
  updateVideoButtonText(isCameraOff) {
    this.elements.videoToggle.textContent = isCameraOff
      ? "Video Off"
      : "Video On";
  }

  /**
   * 사용자 수 업데이트
   */
  updateUserCount(roomMemberCount) {
    this.elements.userCount.textContent = `${roomMemberCount} Users`;
  }
}

// 싱글톤 인스턴스 생성
export default new DOMManager();
