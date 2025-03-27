"use strict";

/**
 * 위치 관리 클래스
 */
class LocationManagerClass {
  constructor() {
    this.currentPosition = null;
  }

  /**
   * 현재 위치 획득
   */
  async getCurrentPosition() {
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });

      this.currentPosition = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };

      return this.currentPosition;
    } catch (error) {
      console.error(`위치 정보를 가져오는 도중 에러가 발생했습니다: ${error}`);
      return null;
    }
  }
}

// 싱글톤 인스턴스 생성
export default new LocationManagerClass();
