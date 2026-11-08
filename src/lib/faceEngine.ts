/**
 * Browser face engine for the static (GitHub Pages) demo.
 *
 * Runs the exact same pipeline as the server worker — YuNet detection +
 * SFace embeddings — but fully client-side:
 *   - @techstark/opencv-js (WASM) provides FaceDetectorYN and warpAffine
 *   - onnxruntime-web executes sface.onnx with OpenCV's preprocessing
 *     (blobFromImage(aligned, 1.0, 112x112, mean 0, swapRB=true)), ported
 *     verbatim from opencv/modules/objdetect/src/face_recognize.cpp
 *   - the 5-point similarity transform (Umeyama) is ported from the same file
 *
 * Validated against Python cv2: identical top detections, aligned-crop MAE
 * 0.55/255, embedding cosine 0.9999.
 *
 * Everything heavy (13 MB opencv.js, ORT wasm, 38 MB sface.onnx) is lazy —
 * nothing loads until the user actually uses the face panel.
 */

import type { FaceBoundingBox } from "./faceSearchUtils";

const OPENCV_URL = "https://cdn.jsdelivr.net/npm/@techstark/opencv-js@5.0.0-release.1/dist/opencv.js";
const ORT_URL = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/ort.min.js";
const YUNET_URL = `${import.meta.env.BASE_URL}models/onnx/yunet.onnx`;
const SFACE_URL = `${import.meta.env.BASE_URL}models/onnx/sface.onnx`;

/** Detection quality gates mirroring scripts/face_query.py */
const DETECT_MIN_SCORE = 0.6;
const DETECT_MIN_PX = 40;

export interface EngineDetectedFace {
  box: FaceBoundingBox;
  score: number;
  /** Aligned 112px preview as a data URL */
  preview: string;
}

interface CvNS {
  Mat: any;
  Size: any;
  Scalar: any;
  CV_8UC3: number;
  CV_64F: number;
  INTER_LINEAR: number;
  BORDER_CONSTANT: number;
  COLOR_RGBA2BGR: number;
  FS: { writeFile(name: string, data: Uint8Array): void };
  FaceDetectorYN: any;
  warpAffine(src: any, dst: any, M: any, size: any, flags: number, border: number, value: any): void;
  cvtColor(src: any, dst: any, code: number): void;
  matFromImageData(data: ImageData): any;
}

let readyPromise: Promise<{ cv: CvNS; ort: any; detector: any; session: any }> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[data-face-engine="${src}"]`);
    if (existing) return void (existing as HTMLScriptElement).addEventListener("load", () => resolve(), { once: true });
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.dataset.faceEngine = src;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error("Gagal memuat pustaka deteksi wajah (CDN)."));
    document.head.appendChild(el);
  });
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gambar tidak dapat dibaca."));
    img.src = dataUrl;
  });
}

/** Canvas → BGR Mat (OpenCV's native channel order) */
function toBgrMat(cv: CvNS, img: HTMLImageElement, canvas: HTMLCanvasElement): any {
  const w = img.naturalWidth, h = img.naturalHeight;
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const rgba = ctx.getImageData(0, 0, w, h);
  const src = cv.matFromImageData(rgba);
  const bgr = new cv.Mat();
  cv.cvtColor(src, bgr, cv.COLOR_RGBA2BGR);
  src.delete();
  return bgr;
}

/** Umeyama similarity transform ported from FaceRecognizerSFImpl (2x3 affine) */
function similarityTransform(pts: number[][]): number[] {
  const dst = [[38.2946, 51.6963], [73.5318, 51.5014], [56.0252, 71.7366], [41.5493, 92.3655], [70.7299, 92.2041]];
  const srcMean = [0, 0], dstMean = [56.0262, 71.9008];
  for (let i = 0; i < 5; i++) { srcMean[0] += pts[i][0] / 5; srcMean[1] += pts[i][1] / 5; }
  const sd = pts.map((p) => [p[0] - srcMean[0], p[1] - srcMean[1]]);
  const dd = dst.map((p) => [p[0] - dstMean[0], p[1] - dstMean[1]]);
  let A00 = 0, A01 = 0, A10 = 0, A11 = 0;
  for (let i = 0; i < 5; i++) { A00 += dd[i][0] * sd[i][0]; A01 += dd[i][0] * sd[i][1]; A10 += dd[i][1] * sd[i][0]; A11 += dd[i][1] * sd[i][1]; }
  A00 /= 5; A01 /= 5; A10 /= 5; A11 /= 5;
  const d = [1, 1];
  if (A00 * A11 - A01 * A10 < 0) d[1] = -1;

  // analytic 2x2 SVD: A = U·S·Vᵀ
  const a = A00, b = A01, c = A10, e = A11;
  const ATA = [[a * a + c * c, a * b + c * e], [a * b + c * e, b * b + e * e]];
  const tr = ATA[0][0] + ATA[1][1];
  const detM = ATA[0][0] * ATA[1][1] - ATA[0][1] * ATA[1][0];
  const disc = Math.sqrt(Math.max(0, (tr * tr) / 4 - detM));
  const l1 = tr / 2 + disc, l2 = tr / 2 - disc;
  const s = [Math.sqrt(Math.max(0, l1)), Math.sqrt(Math.max(0, l2))];
  const eigenVec = (m: number[][], l: number) => {
    const vx = m[0][1], vy = l - m[0][0];
    const n = Math.hypot(vx, vy);
    if (n < 1e-12) return [1, 0];
    return [vx / n, vy / n];
  };
  const v0 = eigenVec(ATA, l1), v1 = eigenVec(ATA, l2);
  const V = [[v0[0], v1[0]], [v0[1], v1[1]]];
  const eps = 1e-12;
  const u0 = [(a * V[0][0] + b * V[1][0]) / (s[0] || eps), (a * V[0][1] + b * V[1][1]) / (s[1] || eps)];
  const u1 = [(c * V[0][0] + e * V[1][0]) / (s[0] || eps), (c * V[0][1] + e * V[1][1]) / (s[1] || eps)];
  const n0 = Math.hypot(u0[0], u0[1]) || 1, n1 = Math.hypot(u1[0], u1[1]) || 1;
  const U = [[u0[0] / n0, u1[0] / n1], [u0[1] / n0, u1[1] / n1]];
  const Vt = [[V[0][0], V[1][0]], [V[0][1], V[1][1]]];
  const smax = Math.max(s[0], s[1]);
  const tol = smax * 2 * 2.220446049250313e-16;
  const rank = (s[0] > tol ? 1 : 0) + (s[1] > tol ? 1 : 0);
  let T = [[1, 0], [0, 1]];
  const detU = U[0][0] * U[1][1] - U[0][1] * U[1][0];
  const detVt = Vt[0][0] * Vt[1][1] - Vt[0][1] * Vt[1][0];
  const mul = (M: number[][], N: number[][]) => [
    [M[0][0] * N[0][0] + M[0][1] * N[1][0], M[0][0] * N[0][1] + M[0][1] * N[1][1]],
    [M[1][0] * N[0][0] + M[1][1] * N[1][0], M[1][0] * N[0][1] + M[1][1] * N[1][1]],
  ];
  if (rank === 1) {
    if (detU * detVt > 0) T = mul(U, Vt);
    else { T = mul(mul(U, [[1, 0], [0, -1]]), Vt); d[1] = -1; }
  } else {
    T = mul(mul(U, [[d[0], 0], [0, d[1]]]), Vt);
  }
  let var1 = 0, var2 = 0;
  for (let i = 0; i < 5; i++) { var1 += sd[i][0] * sd[i][0]; var2 += sd[i][1] * sd[i][1]; }
  var1 /= 5; var2 /= 5;
  const scale = (1.0 / (var1 + var2)) * (s[0] * d[0] + s[1] * d[1]);
  const TS0 = T[0][0] * srcMean[0] + T[0][1] * srcMean[1];
  const TS1 = T[1][0] * srcMean[0] + T[1][1] * srcMean[1];
  const t02 = dstMean[0] - scale * TS0, t12 = dstMean[1] - scale * TS1;
  return [T[0][0] * scale, T[0][1] * scale, t02, T[1][0] * scale, T[1][1] * scale, t12];
}

async function initEngine() {
  const [cvMod, ortAny] = await Promise.all([
    (async () => {
      await loadScript(OPENCV_URL);
      const mod = (window as any).cv;
      const cv: CvNS = typeof mod?.then === "function" ? await mod : mod;
      if (!cv?.Mat) throw new Error("OpenCV.wasm gagal dimuat.");
      return cv;
    })(),
    (async () => {
      await loadScript(ORT_URL);
      const ort = (window as any).ort;
      if (!ort) throw new Error("ONNX Runtime gagal dimuat.");
      ort.env.wasm.numThreads = 1;
      return ort;
    })(),
  ]);

  const [yunetBuf, sfaceBuf] = await Promise.all([
    fetch(YUNET_URL).then((r) => r.arrayBuffer()),
    fetch(SFACE_URL).then((r) => r.arrayBuffer()),
  ]);
  cvMod.FS.writeFile("/yunet.onnx", new Uint8Array(yunetBuf));
  const detector = new cvMod.FaceDetectorYN("/yunet.onnx", "", new cvMod.Size(320, 320));
  detector.setScoreThreshold(0.45);
  detector.setTopK(100);
  detector.setNMSThreshold(0.3);

  const session = await ortAny.InferenceSession.create(sfaceBuf, { executionProviders: ["wasm"] });
  return { cv: cvMod, ort: ortAny, detector, session };
}

function engine() {
  if (!readyPromise) readyPromise = initEngine().catch((err) => { readyPromise = null; throw err; });
  return readyPromise;
}

/** Full detection row (box + 5 landmarks + score) list for an image Mat */
function detectRows(cv: CvNS, detector: any, mat: any): number[][] {
  detector.setInputSize(new cv.Size(mat.cols, mat.rows));
  const out = new cv.Mat();
  detector.detect(mat, out);
  const rows: number[][] = [];
  for (let i = 0; i < out.rows; i++) {
    const row: number[] = [];
    for (let c = 0; c < 15; c++) row.push(out.data32F[i * 15 + c]);
    rows.push(row);
  }
  out.delete();
  rows.sort((a, b) => b[14] - a[14]);
  return rows;
}

function alignRow(cv: CvNS, mat: any, row: number[]): any {
  const pts = [[row[4], row[5]], [row[6], row[7]], [row[8], row[9]], [row[10], row[11]], [row[12], row[13]]];
  const M = new cv.Mat(2, 3, cv.CV_64F);
  M.data64F.set(similarityTransform(pts));
  const aligned = new cv.Mat();
  cv.warpAffine(mat, aligned, M, new cv.Size(112, 112), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar(0, 0, 0, 0));
  M.delete();
  return aligned;
}

function matToJpegDataUrl(canvas: HTMLCanvasElement, mat: any, quality = 0.82): string {
  // BGR 112x112 → canvas (RGB) via manual swap
  const ctx = canvas.getContext("2d")!;
  canvas.width = mat.cols;
  canvas.height = mat.rows;
  const img = ctx.createImageData(mat.cols, mat.rows);
  for (let p = 0, n = 0; p < mat.cols * mat.rows; p++, n += 3) {
    img.data[n] = mat.data[n + 2];
    img.data[n + 1] = mat.data[n + 1];
    img.data[n + 2] = mat.data[n];
    img.data[n + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  return canvas.toDataURL("image/jpeg", quality);
}

async function embedAligned(session: any, aligned: any): Promise<Float32Array> {
  const px = aligned.data; // BGR uint8
  const NCHW = new Float32Array(3 * 112 * 112);
  for (let p = 0, n = 0; p < 112 * 112; p++, n += 3) {
    NCHW[p] = px[n + 2];
    NCHW[112 * 112 + p] = px[n + 1];
    NCHW[2 * 112 * 112 + p] = px[n];
  }
  const input = new (window as any).ort.Tensor("float32", NCHW, [1, 3, 112, 112]);
  const results = await session.run({ [session.inputNames[0]]: input });
  const raw: Float32Array = results[session.outputNames[0]].data;
  let norm = 0;
  for (let i = 0; i < raw.length; i++) norm += raw[i] * raw[i];
  norm = Math.sqrt(norm) || 1;
  const out = new Float32Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw[i] / norm;
  return out;
}

/** Re-fit a detection row (box + landmarks) onto a user-edited box, mirroring
    scripts/face_query.py fit_face_row_to_box */
function fitRowToBox(row: number[], box: FaceBoundingBox, width: number, height: number): number[] {
  const ux = box.x * width, uy = box.y * height;
  const uw = box.w * width, uh = box.h * height;
  const sx = row[0], sy = row[1], sw = row[2], sh = row[3];
  const scaleX = sw > 0 ? uw / sw : 1;
  const scaleY = sh > 0 ? uh / sh : 1;
  const fitted = row.slice();
  fitted[0] = ux; fitted[1] = uy; fitted[2] = uw; fitted[3] = uh;
  for (let k = 0; k < 5; k++) {
    fitted[4 + 2 * k] = ux + (row[4 + 2 * k] - sx) * scaleX;
    fitted[5 + 2 * k] = uy + (row[5 + 2 * k] - sy) * scaleY;
  }
  return fitted;
}

function iou(a: FaceBoundingBox, b: number[], w: number, h: number): number {
  const ax = a.x * w, ay = a.y * h, aw = a.w * w, ah = a.h * h;
  const bx = b[0], by = b[1], bw = b[2], bh = b[3];
  const x1 = Math.max(ax, bx), y1 = Math.max(ay, by);
  const x2 = Math.min(ax + aw, bx + bw), y2 = Math.min(ay + ah, by + bh);
  const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const union = aw * ah + bw * bh - inter;
  return union > 0 ? inter / union : 0;
}

/** Detect usable faces for crop guidance (mirrors POST /api/faces/detect) */
export async function browserDetectFaces(image: string): Promise<EngineDetectedFace[]> {
  const { cv, detector } = await engine();
  const img = await loadImage(image);
  const canvas = document.createElement("canvas");
  const mat = toBgrMat(cv, img, canvas);
  try {
    const rows = detectRows(cv, detector, mat).filter(
      (r) => r[14] >= DETECT_MIN_SCORE && r[2] >= DETECT_MIN_PX && r[3] >= DETECT_MIN_PX
    );
    return rows.slice(0, 20).map((r) => ({
      box: { x: r[0] / mat.cols, y: r[1] / mat.rows, w: r[2] / mat.cols, h: r[3] / mat.rows },
      score: Math.round(r[14] * 1000) / 1000,
      preview: matToJpegDataUrl(canvas, alignRow(cv, mat, r)),
    }));
  } finally {
    mat.delete();
  }
}

/** Embed one face (auto best or user-adjusted box) — mirrors POST /api/faces/search */
export async function browserEmbedFace(
  image: string,
  box?: FaceBoundingBox
): Promise<{ descriptor: Float32Array; preview: string }> {
  const { cv, detector, session } = await engine();
  const img = await loadImage(image);
  const canvas = document.createElement("canvas");
  const mat = toBgrMat(cv, img, canvas);
  try {
    const rows = detectRows(cv, detector, mat);
    if (rows.length === 0) throw new Error("Tidak ada wajah terdeteksi pada gambar ini. Coba foto yang lebih jelas.");
    let row = rows[0];
    if (box) {
      let best = 0, bestIou = -1;
      for (let i = 0; i < rows.length; i++) {
        const v = iou(box, rows[i], mat.cols, mat.rows);
        if (v > bestIou) { bestIou = v; best = i; }
      }
      if (bestIou < 0.15) {
        const cx = box.x * mat.cols + (box.w * mat.cols) / 2;
        const cy = box.y * mat.rows + (box.h * mat.rows) / 2;
        let bestDist = Infinity;
        for (let i = 0; i < rows.length; i++) {
          const dx = rows[i][0] + rows[i][2] / 2 - cx;
          const dy = rows[i][1] + rows[i][3] / 2 - cy;
          const d2 = dx * dx + dy * dy;
          if (d2 < bestDist) { bestDist = d2; best = i; }
        }
      }
      row = fitRowToBox(rows[best], box, mat.cols, mat.rows);
    }
    const aligned = alignRow(cv, mat, row);
    try {
      const descriptor = await embedAligned(session, aligned);
      return { descriptor, preview: matToJpegDataUrl(canvas, aligned) };
    } finally {
      aligned.delete();
    }
  } finally {
    mat.delete();
  }
}
