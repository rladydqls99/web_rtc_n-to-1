"use strict";

// WebRTC 및 미디어 관련 설정
export const CONFIG = {
  ICE_SERVERS: [
    { urls: "stun:stun.stunprotocol.org:3478" },
    { urls: "stun:stun.l.google.com:19302" },
  ],
  MEDIA: {
    DEFAULT_CONSTRAINTS: {
      audio: true,
      video: { facingMode: "user" },
    },
    SPECIFIC_DEVICE_CONSTRAINTS: (deviceId, enableAudio) => ({
      audio: enableAudio,
      video: { deviceId: { exact: deviceId } },
    }),
  },
};

// 지도 관련 설정 (receiver 전용)
export const MAP_CONFIG = {
  LOCATION: {
    latitude: 36.38516688369645,
    longitude: 127.3194762861434,
  },
  MAP_OPTIONS: {
    level: 4,
  },
};
