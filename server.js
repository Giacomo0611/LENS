// 鏡頭選型工作台 - NAS 自架伺服器
// Node.js + Express，資料存成 JSON 檔（掛在 /app/data，記得在 docker-compose 掛 volume 才能持久化）
"use strict";

const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// 初始種子資料（34 筆相機／17 筆鏡頭，皆為查證過的真實型號規格）。
// 直接內嵌在程式碼裡，不依賴掛載進來的 data 資料夾裡是否有 seed.json——
// 這樣即使 docker-compose 把一個空的本機資料夾掛進 /app/data，第一次啟動還是會有完整初始資料。
const INITIAL_SEED = require("./seed-data.json");

// ---- 簡易 JSON 檔資料庫 ----
function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_SEED, null, 2));
    console.log(`已建立初始資料庫 ${DB_FILE}（相機 ${Object.keys(INITIAL_SEED.cameras||{}).length} 筆／鏡頭 ${Object.keys(INITIAL_SEED.lenses||{}).length} 筆）`);
  }
}
function readDb() {
  ensureDb();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
function writeDb(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ---- 公開讀取 API ----
app.get("/api/cameras", (req, res) => {
  const db = readDb();
  res.json(db.cameras || {});
});
app.get("/api/lenses", (req, res) => {
  const db = readDb();
  res.json(db.lenses || {});
});

// ---- 後台寫入 API（不需要密碼，靠前端隱形按鈕降低誤觸機率，內部工具用途）----
function slugify(brand, model) {
  const base = `${brand || ""}-${model || ""}`.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return (base || "item") + "-" + crypto.randomBytes(3).toString("hex");
}

app.post("/api/cameras", (req, res) => {
  const { brand, model, sensorW, sensorH, resH, resV, origin } = req.body || {};
  if (!model || !sensorW || !sensorH || !resH || !resV) {
    return res.status(400).json({ error: "請完整填寫型號、感測器尺寸與解析度" });
  }
  const db = readDb();
  const id = slugify(brand, model);
  db.cameras[id] = {
    brand: String(brand || ""), model: String(model),
    sensorW: Number(sensorW), sensorH: Number(sensorH),
    resH: parseInt(resH, 10), resV: parseInt(resV, 10),
    origin: origin || ""
  };
  writeDb(db);
  res.json({ id, data: db.cameras[id] });
});
app.delete("/api/cameras/:id", (req, res) => {
  const db = readDb();
  delete db.cameras[req.params.id];
  writeDb(db);
  res.json({ ok: true });
});

app.post("/api/lenses", (req, res) => {
  const { brand, model, focalMm, mount, origin } = req.body || {};
  if (!model || !focalMm) {
    return res.status(400).json({ error: "請至少填寫型號與焦距" });
  }
  const db = readDb();
  const id = slugify(brand, model);
  db.lenses[id] = {
    brand: String(brand || ""), model: String(model),
    focalMm: Number(focalMm), mount: String(mount || ""),
    origin: origin || ""
  };
  writeDb(db);
  res.json({ id, data: db.lenses[id] });
});
app.delete("/api/lenses/:id", (req, res) => {
  const db = readDb();
  delete db.lenses[req.params.id];
  writeDb(db);
  res.json({ ok: true });
});

app.listen(PORT, () => {
  ensureDb();
  console.log(`鏡頭選型工作台伺服器已啟動，監聽 port ${PORT}`);
});
