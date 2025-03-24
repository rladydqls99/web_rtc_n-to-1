const KakaoMapService = (() => {
  const DEFAULT_COORDINATES = {
    latitude: 33.450701,
    longitude: 126.570667,
  };

  const DEFAULT_MAP_LEVEL = 3;

  const GEOLOCATION_OPTIONS = {
    enableHighAccuracy: true,
    timeout: 5000,
    maximumAge: 0,
  };

  let map = null;

  const initializeMap = (containerId, options = {}) => {
    const container = document.getElementById(containerId);

    if (!container) {
      throw new Error(`지도를 표시할 요소를 찾을 수 없습니다: ${containerId}`);
    }

    const mapOptions = {
      center: new kakao.maps.LatLng(
        options.latitude || DEFAULT_COORDINATES.latitude,
        options.longitude || DEFAULT_COORDINATES.longitude
      ),
      level: options.level || DEFAULT_MAP_LEVEL,
    };

    map = new kakao.maps.Map(container, mapOptions);
    return map;
  };

  const setMapToUserLocation = (onSuccess, onError) => {
    if (!map) {
      throw new Error(
        "지도가 초기화되지 않았습니다. 먼저 initializeMap을 호출하세요."
      );
    }

    const handleSuccess = (position) => {
      const { latitude, longitude } = position.coords;
      const userPosition = new kakao.maps.LatLng(latitude, longitude);

      map.setCenter(userPosition);

      if (onSuccess && typeof onSuccess === "function") {
        onSuccess(position, map);
      }
    };

    const handleError = (error) => {
      console.error("위치 정보를 가져오는 중 오류가 발생했습니다:", error);

      if (onError && typeof onError === "function") {
        onError(error, map);
      } else {
        alert(`위치 정보를 가져올 수 없습니다: ${error.message}`);
      }
    };

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        GEOLOCATION_OPTIONS
      );
    } else {
      const error = new Error(
        "이 브라우저에서는 위치 정보를 지원하지 않습니다."
      );
      handleError(error);
    }
  };

  const setMapCenter = (latitude, longitude) => {
    if (!map) {
      throw new Error(
        "지도가 초기화되지 않았습니다. 먼저 initializeMap을 호출하세요."
      );
    }

    const position = new kakao.maps.LatLng(latitude, longitude);
    map.setCenter(position);
  };

  const getMap = () => map;

  return {
    initializeMap,
    setMapToUserLocation,
    setMapCenter,
    getMap,
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  const map = KakaoMapService.initializeMap("map");

  KakaoMapService.setMapToUserLocation(
    (position, map) => {
      console.log("사용자 위치:", position);
    },

    (error, map) => {
      console.error("위치 오류:", error);
    }
  );
});
