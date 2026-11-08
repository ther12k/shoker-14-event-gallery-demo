import express from "express";
import fs from "node:fs";
import path from "node:path";
import {
  detectFacesInUpload,
  FACES_DIR,
  getFaceGroups,
  getScanStatus,
  searchByUploadedFace,
  triggerFaceScan,
} from "./faceService";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const HOST = process.env.HOST || "127.0.0.1";
const DIST_DIR = path.resolve(process.cwd(), "dist");

async function startServer() {
  const app = express();
  // 20mb so uploaded/pasted face-search photos fit as base64 JSON
  app.use(express.json({ limit: "20mb" }));

  // 0. Health check endpoint for monitoring & deployment
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "ok",
      app: "shoker-14-event-gallery",
      timestamp: new Date().toISOString(),
    });
  });

  // 1. Pre-clustered face groups & per-photo face records (no descriptors leave the server)
  app.get("/api/faces", (_req, res) => {
    res.json(getFaceGroups());
  });

  // 2. Start the sequential Python face-scan worker (no-op while one runs)
  app.post("/api/faces/scan", (req, res) => {
    try {
      const token = process.env.FACE_SCAN_TOKEN;
      if (token && req.header("x-scan-token") !== token) {
        return res.status(403).json({ error: "Token pemindaian tidak valid." });
      }
      res.json(triggerFaceScan());
    } catch (err: any) {
      res.status(500).json({ error: err?.message || "Gagal memulai pemindaian wajah." });
    }
  });

  // 3. Progress of a running/finished scan
  app.get("/api/faces/scan/status", (_req, res) => {
    res.json(getScanStatus() ?? { running: false, done: false, processed: 0, total: 0 });
  });

  // 4. Detect faces in an uploaded/pasted photo (crop guidance)
  app.post("/api/faces/detect", async (req, res) => {
    const { image } = req.body || {};
    if (typeof image !== "string" || image.length === 0) {
      return res.status(400).json({ error: "Gambar tidak disertakan." });
    }
    try {
      res.json({ faces: await detectFacesInUpload(image) });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || "Deteksi wajah gagal." });
    }
  });

  // 5. Search gallery photos by an uploaded face (auto or user-adjusted box)
  app.post("/api/faces/search", async (req, res) => {
    const { image, box } = req.body || {};
    if (typeof image !== "string" || image.length === 0) {
      return res.status(400).json({ error: "Gambar tidak disertakan." });
    }
    try {
      res.json(await searchByUploadedFace(image, box));
    } catch (err: any) {
      res.status(400).json({ error: err?.message || "Pencarian wajah gagal." });
    }
  });

  // 6. Face crops produced by the worker (persistent data dir, survives deploys)
  app.use(
    "/images/faces",
    express.static(FACES_DIR, {
      fallthrough: true,
      maxAge: "7d",
      setHeaders(res) {
        res.setHeader("Cache-Control", "public, max-age=604800, immutable");
      },
    })
  );

  // 7. Built SPA (vite-plugin-singlefile → dist/index.html) with SPA fallback
  app.use(express.static(DIST_DIR));
  app.get("*", (_req, res) => {
    const index = path.join(DIST_DIR, "index.html");
    if (fs.existsSync(index)) return res.sendFile(index);
    res.status(503).send("Shoker gallery has not been built yet (dist/ missing).");
  });

  app.listen(PORT, HOST, () => {
    console.log(`Shoker #14 Event Gallery & Face Search running on http://${HOST}:${PORT}`);
  });
}

startServer();
