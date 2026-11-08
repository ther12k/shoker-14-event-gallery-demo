import fs from "node:fs";
import path from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import {
  buildFaceGroups,
  euclideanDistance,
  FACE_CLUSTER_MAX_DISTANCE,
  type FaceBoundingBox,
  type FaceCropRecord,
  type FaceGroup,
  type IndexedFace,
} from "../src/lib/faceSearchUtils";
import { GALLERY_ITEMS } from "./items";

const DATA_DIR = path.resolve(process.cwd(), "data");
const FACES_DIR = path.join(DATA_DIR, "images", "faces");
const INDEX_PATH = path.join(DATA_DIR, "face-index.json");
const QUEUE_PATH = path.join(DATA_DIR, "scan-queue.json");
const STATUS_PATH = path.join(DATA_DIR, "scan-status.json");
const SCAN_LOG_PATH = path.join(DATA_DIR, "scan-log.txt");
const WORKER_PATH = path.resolve(process.cwd(), "scripts", "scan_faces.py");
const QUERY_PATH = path.resolve(process.cwd(), "scripts", "face_query.py");

const CLUSTER_THRESHOLD = process.env.FACE_CLUSTER_THRESHOLD
  ? parseFloat(process.env.FACE_CLUSTER_THRESHOLD)
  : FACE_CLUSTER_MAX_DISTANCE;

interface FaceIndexFile {
  version: 3;
  model: string;
  generatedAt: string;
  scanned: Record<string, { title: string; faces: number; at: string }>;
  faces: IndexedFace[];
}

export interface FaceGroupsPayload {
  groups: FaceGroup<FaceCropRecord>[];
  faces: FaceCropRecord[];
  indexedPhotosCount: number;
  totalFaces: number;
  generatedAt: string;
}

function toPublicRecord(face: IndexedFace, groupId: string): FaceCropRecord {
  return {
    faceId: face.faceId,
    fileId: face.fileId,
    photoTitle: face.photoTitle,
    category: face.category,
    session: face.session,
    time: face.time,
    fileName: face.fileName,
    box: face.box,
    cropUrl: face.cropUrl,
    detectionScore: face.detectionScore,
    groupId,
  };
}

let cacheKey = "";
let cachePayload: FaceGroupsPayload | null = null;
let cacheMatchFaces: Array<IndexedFace & { groupId: string }> = [];

function emptyPayload(): FaceGroupsPayload {
  return { groups: [], faces: [], indexedPhotosCount: 0, totalFaces: 0, generatedAt: "" };
}

/**
 * Loads the private worker index and clusters it into person groups.
 * Results (public payload + descriptor-tagged faces for matching) are cached
 * by index file size + threshold.
 */
export function getFaceGroups(): FaceGroupsPayload {
  let raw: string;
  try {
    raw = fs.readFileSync(INDEX_PATH, "utf8");
  } catch {
    cachePayload = emptyPayload();
    cacheMatchFaces = [];
    return cachePayload;
  }

  const key = `${Buffer.byteLength(raw)}:${CLUSTER_THRESHOLD}`;
  if (cachePayload && key === cacheKey) return cachePayload;

  let index: FaceIndexFile;
  try {
    index = JSON.parse(raw);
  } catch {
    cachePayload = emptyPayload();
    cacheMatchFaces = [];
    return cachePayload;
  }
  if (index.version !== 3 || !Array.isArray(index.faces)) {
    cachePayload = emptyPayload();
    cacheMatchFaces = [];
    return cachePayload;
  }

  const groups = buildFaceGroups(index.faces, CLUSTER_THRESHOLD);
  const groupOfFace = new Map<string, FaceGroup<IndexedFace>>();
  const publicGroups: FaceGroup<FaceCropRecord>[] = groups.map((group) => {
    for (const face of group.faces) groupOfFace.set(face.faceId, group);
    return {
      groupId: group.groupId,
      faces: group.faces.map((face) => toPublicRecord(face, group.groupId)),
      representative: toPublicRecord(group.representative, group.groupId),
      photoIds: group.photoIds,
      photoCount: group.photoCount,
    };
  });

  const faces = index.faces.map((face) =>
    toPublicRecord(face, groupOfFace.get(face.faceId)?.groupId ?? "")
  );
  cacheMatchFaces = index.faces.map((face) => ({
    ...face,
    groupId: groupOfFace.get(face.faceId)?.groupId ?? "",
  }));

  cacheKey = key;
  cachePayload = {
    groups: publicGroups,
    faces,
    indexedPhotosCount: Object.keys(index.scanned || {}).length,
    totalFaces: index.faces.length,
    generatedAt: index.generatedAt || "",
  };
  return cachePayload;
}

/** Indexed faces with descriptors + group ids, for upload-query matching */
function facesForMatching(): Array<IndexedFace & { groupId: string }> {
  getFaceGroups();
  return cacheMatchFaces;
}

export interface ScanStatus {
  running: boolean;
  processed: number;
  total: number;
  failed: number;
  lastFile: string;
  startedAt: string;
  updatedAt: string;
  done: boolean;
}

export function getScanStatus(): ScanStatus | null {
  try {
    return JSON.parse(fs.readFileSync(STATUS_PATH, "utf8")) as ScanStatus;
  } catch {
    return null;
  }
}

/**
 * Writes the work queue from the static gallery manifest and starts the
 * sequential Python worker as a detached background process. Safe to call
 * repeatedly — a second call while a scan is running is a no-op.
 */
export function triggerFaceScan(): { started: boolean; reason: string } {
  const status = getScanStatus();
  if (status?.running) {
    return { started: false, reason: "Pemindaian sedang berjalan." };
  }

  const items = GALLERY_ITEMS;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(
    QUEUE_PATH,
    JSON.stringify({
      generatedAt: new Date().toISOString(),
      items: items.map((item) => ({
        id: item.id,
        gid: item.gid,
        title: item.title,
        category: item.category,
        session: item.session,
        time: item.time,
        fileName: item.fileName,
        local: item.local,
      })),
    }),
    "utf8"
  );

  const python = process.env.FACE_SCAN_PYTHON || "python3";
  const logFd = fs.openSync(SCAN_LOG_PATH, "a");
  const child = spawn(python, [WORKER_PATH], {
    cwd: path.resolve(process.cwd()),
    detached: true,
    stdio: ["ignore", logFd, logFd],
    env: { ...process.env },
  });
  child.unref();
  fs.closeSync(logFd);

  return { started: true, reason: `Pemindaian berurutan dimulai untuk ${items.length} file.` };
}

/* ── Upload / paste face search ─────────────────────────────────────────── */

export interface DetectedUploadFace {
  box: FaceBoundingBox;
  score: number;
  /** Aligned 112px preview of the detected face (data URL, in-memory only) */
  preview: string;
}

export interface FaceSearchMatch {
  fileId: string;
  similarity: number;
  faceId: string;
  cropUrl: string;
  photoTitle: string;
  category: string;
  time: string;
  groupId: string;
}

/** Maximum embedding distance for an uploaded face to count as a match */
const MATCH_MAX_DISTANCE = 1.0;
const MATCH_LIMIT = 40;
/** Max concurrent face_query.py processes — each one loads two ONNX models */
const QUERY_CONCURRENCY = 2;

const queryQueue: Array<() => void> = [];
let runningQueries = 0;

function acquireQuerySlot(): Promise<void> {
  if (runningQueries < QUERY_CONCURRENCY) {
    runningQueries++;
    return Promise.resolve();
  }
  return new Promise((resolve) => queryQueue.push(resolve));
}

function releaseQuerySlot(): void {
  const next = queryQueue.shift();
  if (next) {
    next();
  } else {
    runningQueries--;
  }
}

/** Runs scripts/face_query.py once with a JSON request (stdin → stdout) */
async function runFaceQuery(request: unknown): Promise<any> {
  await acquireQuerySlot();
  return new Promise((resolve, reject) => {
    const python = process.env.FACE_SCAN_PYTHON || "python3";
    const child: ChildProcess = spawn(python, [QUERY_PATH], {
      cwd: path.resolve(process.cwd()),
      stdio: ["pipe", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    let settled = false;
    const finish = (err: Error | null, value?: any) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      releaseQuerySlot();
      if (err) reject(err);
      else resolve(value);
    };
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      finish(new Error("Proses deteksi wajah habis waktu. Coba gambar yang lebih kecil."));
    }, 30000);

    child.stdout?.on("data", (chunk) => (stdout += chunk));
    child.stderr?.on("data", (chunk) => (stderr += chunk));
    // Python may exit before reading stdin (e.g. cv2 import failure) — an
    // unhandled EPIPE here would crash the whole server.
    child.stdin?.on("error", () => {});
    child.on("error", (err) => finish(new Error(`Gagal menjalankan deteksi wajah: ${err.message}`)));
    child.on("close", () => {
      try {
        finish(null, JSON.parse(stdout));
      } catch {
        finish(
          new Error(
            stderr.trim() || "Deteksi wajah gagal. Pastikan server telah memasang OpenCV."
          )
        );
      }
    });
    child.stdin?.write(JSON.stringify(request));
    child.stdin?.end();
  });
}

/** Detects faces in an uploaded/pasted image for crop guidance */
export async function detectFacesInUpload(image: string): Promise<DetectedUploadFace[]> {
  const res = await runFaceQuery({ action: "detect", image });
  if (res?.error) throw new Error(res.error);
  return Array.isArray(res?.faces) ? res.faces : [];
}

/**
 * Embeds the selected face (auto-detected or user-adjusted box) with the same
 * SFace model used for indexing and ranks gallery photos by distance.
 */
export async function searchByUploadedFace(
  image: string,
  box?: FaceBoundingBox
): Promise<{ matches: FaceSearchMatch[]; preview: string; bestGroupId: string }> {
  const res = await runFaceQuery({ action: "search", image, box });
  if (res?.error) throw new Error(res.error);
  const descriptor: number[] | undefined = res?.descriptor;
  if (!Array.isArray(descriptor) || descriptor.length === 0) {
    throw new Error("Wajah tidak dapat diproses. Coba sesuaikan area potongan.");
  }

  const bestByPhoto = new Map<string, FaceSearchMatch>();
  for (const face of facesForMatching()) {
    const distance = euclideanDistance(descriptor, face.descriptor);
    if (distance > MATCH_MAX_DISTANCE) continue;
    const similarity = Math.round(Math.max(0, (1 - distance / 1.414)) * 100);
    const existing = bestByPhoto.get(face.fileId);
    if (!existing || similarity > existing.similarity) {
      bestByPhoto.set(face.fileId, {
        fileId: face.fileId,
        similarity,
        faceId: face.faceId,
        cropUrl: face.cropUrl,
        photoTitle: face.photoTitle,
        category: face.category,
        time: face.time,
        groupId: face.groupId,
      });
    }
  }

  const matches = Array.from(bestByPhoto.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, MATCH_LIMIT);

  return {
    matches,
    preview: res.preview,
    bestGroupId: matches[0]?.groupId ?? "",
  };
}

export { FACES_DIR };
