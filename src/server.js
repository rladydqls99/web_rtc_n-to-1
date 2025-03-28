import http from "http";
import express from "express";
import dotenv from "dotenv";
import configureApp from "./configure/app.js";
import configureSocket from "./configure/socket.js";

// 환경 변수 로드
dotenv.config();

const PORT = process.env.PORT || 3000;

// Express 앱 생성
const app = express();
const server = http.createServer(app);

const initializeApp = () => {
  configureApp(app);
  configureSocket(server);

  server.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
  });
};

initializeApp();
