/**
 * CLI helper: writes data/scan-queue.json from the static gallery manifest,
 * so scripts/scan_faces.py can be run by hand (`npm run faces:scan`).
 * The server's triggerFaceScan() writes the same file before spawning the
 * worker, so this is only needed for manual/first runs.
 */
import fs from "node:fs";
import path from "node:path";
import { GALLERY_ITEMS } from "../backend/items";

const QUEUE_PATH = path.resolve(process.cwd(), "data", "scan-queue.json");

fs.mkdirSync(path.dirname(QUEUE_PATH), { recursive: true });
fs.writeFileSync(
  QUEUE_PATH,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      items: GALLERY_ITEMS.map((item) => ({ ...item })),
    },
    null,
    2
  ),
  "utf8"
);
console.log(`Wrote ${QUEUE_PATH} with ${GALLERY_ITEMS.length} items.`);
