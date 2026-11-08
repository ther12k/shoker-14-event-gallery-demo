/**
 * Exports the local face scan (data/face-index.json + data/images/faces) into
 * static artifacts under public/demo/ for the GitHub Pages build:
 *
 *   public/demo/faces.json        payload + descriptors (illustrations only —
 *                                 generated images, no real persons)
 *   public/demo/images/faces/*    112px crop images
 *
 * Run after `npm run faces:scan`. cropUrl is stored relative to BASE_URL so
 * the singlefile build works under /shoker-14-event-gallery-demo/.
 */
import fs from "node:fs";
import path from "node:path";
import { buildFaceGroups, type IndexedFace } from "../src/lib/faceSearchUtils";

const ROOT = path.resolve(process.cwd());
const INDEX = path.join(ROOT, "data", "face-index.json");
const CROPS = path.join(ROOT, "data", "images", "faces");
const OUT_DIR = path.join(ROOT, "public", "demo");
const OUT_CROPS = path.join(OUT_DIR, "images", "faces");

interface FaceIndexFile {
  version: number;
  model: string;
  generatedAt: string;
  scanned: Record<string, unknown>;
  faces: IndexedFace[];
}

const raw = fs.readFileSync(INDEX, "utf8");
const index = JSON.parse(raw) as FaceIndexFile;
if (index.version !== 3) throw new Error(`Unsupported face-index version ${index.version}`);

const groups = buildFaceGroups(index.faces);
const groupOf = new Map<string, string>();
for (const g of groups) for (const f of g.faces) groupOf.set(f.faceId, g.groupId);

fs.mkdirSync(OUT_CROPS, { recursive: true });
for (const face of index.faces) {
  const src = path.join(CROPS, `${face.faceId}.jpg`);
  if (!fs.existsSync(src)) throw new Error(`Missing crop for ${face.faceId} — run npm run faces:scan first`);
  fs.copyFileSync(src, path.join(OUT_CROPS, `${face.faceId}.jpg`));
}

/** Browser matching payload: public record + descriptor (illustration-only) */
const faces = index.faces.map((f) => ({
  ...f,
  cropUrl: `demo/images/faces/${f.faceId}.jpg`,
  groupId: groupOf.get(f.faceId) ?? "",
}));

const payload = {
  version: 1,
  engine: "browser" as const,
  model: index.model,
  generatedAt: index.generatedAt || new Date().toISOString(),
  indexedPhotosCount: Object.keys(index.scanned || {}).length,
  totalFaces: index.faces.length,
  groups: groups.map((g) => ({
    groupId: g.groupId,
    faces: g.faces.map((f) => f.faceId),
    representative: g.representative.faceId,
    photoIds: g.photoIds,
    photoCount: g.photoCount,
  })),
  faces,
};

fs.writeFileSync(path.join(OUT_DIR, "faces.json"), JSON.stringify(payload));
console.log(
  `Exported ${payload.totalFaces} faces, ${payload.groups.length} groups → public/demo/ (${(
    fs.statSync(path.join(OUT_DIR, "faces.json")).size / 1024
  ).toFixed(0)} KB json)`
);
