import express from "express";
import path from "path";
import { fileURLToPath } from "url";

// 상수 정의
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIEWS_DIR = path.join(__dirname, "../views");
const PUBLIC_DIR = path.join(__dirname, "../public");

const configureApp = (app) => {
  // 정적 파일 서빙 설정
  app.use(express.static(PUBLIC_DIR));

  /**
   * 라우트 핸들러 - 각 페이지 라우트 정의
   */
  app.get("/", (req, res) => {
    res.sendFile(path.join(VIEWS_DIR, "index.html"));
  });

  app.get("/receiver", (req, res) => {
    res.sendFile(path.join(VIEWS_DIR, "receiver.html"));
  });

  app.get("/sender", (req, res) => {
    res.sendFile(path.join(VIEWS_DIR, "sender.html"));
  });

  // 404 페이지 처리
  app.use((req, res) => {
    res.status(404).sendFile(path.join(VIEWS_DIR, "404.html"));
  });

  app.get("/*", (_, res) => res.redirect("/"));

  // 에러 핸들러
  app.use((err, req, res) => {
    console.error("서버 에러:", err);
    res.status(500).send("500 Internal Server Error");
  });
};

export default configureApp;
