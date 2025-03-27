"use strict";

import { MAP_CONFIG } from '../common/config.js';
import domManagerReceiver from './dom-manager-receiver.js';
import RoomManager from './room-manager-receiver.js';

/**
 * 지도 관리 클래스
 */
class MapManagerClass {
  constructor() {
    this.map = null;
    this.markers = new Map();
  }

  /**
   * 지도 초기화
   */
  initialize() {
    const { latitude, longitude } = MAP_CONFIG.LOCATION;
    const mapOptions = {
      center: new kakao.maps.LatLng(latitude, longitude),
      level: MAP_CONFIG.MAP_OPTIONS.level,
    };

    this.map = new kakao.maps.Map(domManagerReceiver.elements.mapContainer, mapOptions);
    return this.map;
  }

  /**
   * 지도에 마커 업데이트
   * @param {Array} rooms - 방 목록
   */
  updateMarkers(rooms) {
    this.clearMarkers();

    rooms.forEach((room) => {
      const { latitude, longitude } = room.location;
      const markerPosition = new kakao.maps.LatLng(latitude, longitude);

      const marker = new kakao.maps.Marker({
        title: room.roomId,
        position: markerPosition,
        clickable: true,
      });

      this.markers.set(room.roomId, marker);
      marker.setMap(this.map);

      kakao.maps.event.addListener(marker, "click", () => {
        RoomManager.joinRoom(room.roomId);
      });
    });
  }

  /**
   * 모든 마커 제거
   */
  clearMarkers() {
    this.markers.forEach((marker) => marker.setMap(null));
    this.markers.clear();
  }
}

// 싱글톤 인스턴스 생성
export default new MapManagerClass();
