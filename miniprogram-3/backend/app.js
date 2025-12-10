// backend/app.js (minimal safe mode)
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Basic root
app.get("/", (req, res) => {
  res.send("Backend running!");
});

// Small health / test endpoints (no DB)
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "ok", time: new Date().toISOString() });
});
app.get("/api/hello", (req, res) => {
  res.json({ success: true, hello: "world" });
});

// Try to load existing routers, but protect with try/catch to avoid crash
try {
  // if your routes folder exists and exports routers, these will be used
  const appointmentRouter = require("./routes/appointment");
  const scheduleRouter = require("./routes/schedule");
  const authRouter = require("./routes/auth");

  if (appointmentRouter && typeof appointmentRouter === "function") {
    app.use("/api/appointment", appointmentRouter);
  }
  if (scheduleRouter && typeof scheduleRouter === "function") {
    app.use("/api/schedule", scheduleRouter);
  }
  if (authRouter && typeof authRouter === "function") {
    app.use("/api/auth", authRouter);
  }
} catch (err) {
  // 把错误打印到日志，但不要抛出，确保服务仍然可用
  console.error("⚠️ 路由加载出现错误（已被捕获）：", err && err.message ? err.message : err);
  // 提供调试接口，便于查看错误（可删）
  app.get("/api/_router_load_error", (req, res) => {
    res.json({ success: false, message: "Router load error", error: (err && err.message) || "unknown" });
  });
}

module.exports = app;
