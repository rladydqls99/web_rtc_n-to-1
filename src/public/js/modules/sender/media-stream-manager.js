"use strict";

import { CONFIG } from "../common/config.js";
import domManager from "./dom-manager.js";
import PeerConnectionManager from "./peer-connection-manager.js";

/**
 * 미디어 스트림 관리 클래스
 */
class MediaStreamManagerClass {
  constructor() {
    this.stream = null;
    this.isMuted = false;
    this.isCameraOff = false;
  }

  /**
   * 미디어 스트림 획득
   */
  async getMediaStream(deviceId) {
    try {
      const constraints = deviceId
        ? CONFIG.MEDIA.SPECIFIC_DEVICE_CONSTRAINTS(deviceId, !this.isMuted)
        : CONFIG.MEDIA.DEFAULT_CONSTRAINTS;

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);

      if (!deviceId) {
        await this.getCameras();
      }

      domManager.setLocalStream(this.stream);
      return this.stream;
    } catch (error) {
      console.error(`미디어를 가져오는 도중 에러가 발생했습니다: ${error}`);
      return null;
    }
  }

  /**
   * 사용 가능한 카메라 목록 획득
   */
  async getCameras() {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter((device) => device.kind === "videoinput");
      const currentCamera = this.stream?.getVideoTracks()[0];

      domManager.updateCameraOptions(cameras, currentCamera);
    } catch (error) {
      console.error(
        `카메라 목록을 가져오는 도중 에러가 발생했습니다: ${error}`
      );
    }
  }

  /**
   * 오디오 토글
   */
  toggleAudio() {
    if (!this.stream) return;

    const audioTracks = this.stream.getAudioTracks();
    audioTracks.forEach((track) => {
      track.enabled = this.isMuted;
    });

    domManager.updateAudioButtonText(this.isMuted);
    this.isMuted = !this.isMuted;
  }

  /**
   * 비디오 토글
   */
  toggleCamera() {
    if (!this.stream) return;

    const videoTracks = this.stream.getVideoTracks();
    videoTracks.forEach((track) => {
      track.enabled = this.isCameraOff;
    });

    domManager.updateVideoButtonText(this.isCameraOff);
    this.isCameraOff = !this.isCameraOff;
  }

  /**
   * 카메라 변경
   */
  async changeCamera() {
    const deviceId = domManager.elements.cameraSelect.value;
    await this.getMediaStream(deviceId);

    if (!this.stream) return;

    const videoTrack = this.stream.getVideoTracks()[0];
    if (!videoTrack) return;

    // 모든 피어 연결에 새 비디오 트랙 적용
    Object.entries(PeerConnectionManager.peerConnections).forEach(
      ([_, peerConnection]) => {
        const senders = peerConnection.getSenders();
        const currentVideoSender = senders.find(
          (sender) => sender.track && sender.track.kind === "video"
        );

        if (currentVideoSender) {
          currentVideoSender.replaceTrack(videoTrack);
        }
      }
    );
  }
}

// 싱글톤 인스턴스 생성
export default new MediaStreamManagerClass();
