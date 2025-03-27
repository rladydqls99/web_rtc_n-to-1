"use strict";

// 모든 필요한 모듈 가져오기
import MapManager from "./modules/receiver/map-manager.js";
import SocketManagerReceiver from "./modules/receiver/socket-manager-receiver.js";
import RoomManagerReceiver from "./modules/receiver/room-manager-receiver.js";
import { API_KEYS, loadApiKeys } from "./modules/common/config.js";

/**
 * 애플리케이션 초기화
 */
async function initApp() {
  // API 키 로드
  await loadApiKeys();

  // 카카오맵 스크립트 동적 로드
  loadKakaoMapScript();
}

/**
 * 카카오맵 스크립트 동적 로드
 */
function loadKakaoMapScript() {
  console.log("카카오맵 API 로드 시작...");

  // 스크립트 요소 생성
  const script = document.createElement("script");
  script.type = "text/javascript";
  script.async = true;
  script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${API_KEYS.KAKAO_MAP}&autoload=false`;

  // 스크립트 로드 완료 후 처리
  script.onload = () => {
    console.log("카카오맵 스크립트 로드 완료, 초기화 중...");

    // kakao.maps.load를 사용하여 초기화
    kakao.maps.load(() => {
      console.log("카카오맵 API 초기화 성공");

      // 지도 초기화
      MapManager.initialize();

      // 소켓 통신 초기화
      SocketManagerReceiver.initialize();
    });
  };

  // 스크립트 오류 처리
  script.onerror = (error) => {
    console.error("카카오맵 스크립트 로드 오류:", error);
  };

  // 문서에 스크립트 요소 추가
  document.head.appendChild(script);
}

// 애플리케이션 시작
document.addEventListener("DOMContentLoaded", initApp);

// 전역 객체로 내보내기 (DOM에서 직접 접근용)
window.RoomManager = RoomManagerReceiver;
window.MapManager = MapManager;
