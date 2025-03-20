import express from "express";
import configureApp from "./configure/app.js";

const PORT = process.env.PORT || 3000;

// Express 앱 생성
const app = express();

const initializeApp = () => {
  configureApp(app);

  app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다`);
  });
};

initializeApp();
