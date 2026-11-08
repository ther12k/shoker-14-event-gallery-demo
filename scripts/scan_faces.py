#!/usr/bin/env python3
"""
Sequential face scanner for the Supercamp gallery (runs on the server).

Reads a work queue written by the Node app (data/scan-queue.json), then for
each not-yet-scanned Drive file: fetches one thumbnail, decodes it, detects
faces (YuNet), aligns + embeds each face (SFace), saves a 112px crop under
data/images/faces/, and appends records to data/face-index.json (v3).

Design constraints (small server):
  - strictly sequential: one image in memory at a time, one file at a time
  - resumable: every successfully fetched file is recorded (even 0 faces),
    fetch failures are retried on the next run
  - writes data/scan-status.json each step so the website can show progress

Usage: python3 scripts/scan_faces.py [--force] [--limit N] [--fetch-size w2048]
         [--score 0.6] [--delay 0.25]
"""
import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "data")
FACES_DIR = os.path.join(DATA_DIR, "images", "faces")
INDEX_PATH = os.path.join(DATA_DIR, "face-index.json")
QUEUE_PATH = os.path.join(DATA_DIR, "scan-queue.json")
STATUS_PATH = os.path.join(DATA_DIR, "scan-status.json")

YUNET_PATH = os.path.join(ROOT, "models", "onnx", "yunet.onnx")
SFACE_PATH = os.path.join(ROOT, "models", "onnx", "sface.onnx")

INDEX_VERSION = 3
MODEL_ID = "yunet-2023mar+sface-2021dec"


def load_json(path, fallback):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return fallback


def save_json(path, payload):
    tmp = path + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False)
    os.replace(tmp, path)


def fetch_image(file_id, size, attempts=4):
    """Downloads one Drive thumbnail, returning raw JPEG bytes or None."""
    urls = [
        "https://drive.google.com/thumbnail?id={}&sz={}".format(file_id, size),
        "https://lh3.googleusercontent.com/d/{}={}".format(file_id, size),
    ]
    for attempt in range(attempts):
        url = urls[attempt % len(urls)]
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=30) as res:
                data = res.read()
            ctype = res.headers.get("Content-Type", "")
            if ctype.startswith("image/") and len(data) > 1500:
                return data
        except urllib.error.HTTPError as err:
            if err.code in (429, 503):
                wait = 4.0 * (attempt + 1)
                log("  rate limited ({}), waiting {:.0f}s".format(err.code, wait))
                time.sleep(wait)
                continue
            time.sleep(0.8)
        except (urllib.error.URLError, OSError):
            time.sleep(1.2)
    return None


def log(message):
    print(message, flush=True)


class Scanner:
    def __init__(self, args):
        self.detector = cv2.FaceDetectorYN.create(
            YUNET_PATH, "", (320, 320), score_threshold=0.45, top_k=100
        )
        self.recognizer = cv2.FaceRecognizerSF.create(SFACE_PATH, "")
        self.fetch_size = args.fetch_size
        self.delay = args.delay
        # Quality gates: marginal detections (backs of heads, blurry tiny faces)
        # produce garbage embeddings that pollute and fragment person groups.
        self.min_score = args.min_score
        self.min_face_px = args.min_face_px

    def scan_file(self, item, index):
        """Fetches, detects and embeds one queue item; returns face count."""
        size = self.fetch_size if item.get("mediaType") != "video" else "w1280"
        local = item.get("local")
        if local:
            path = os.path.join(ROOT, local)
            try:
                with open(path, "rb") as f:
                    raw = f.read()
            except OSError:
                return None  # missing local file → retried next run
        else:
            raw = fetch_image(item["id"], size)
            if raw is None:
                return None  # fetch failure → retried next run

        img = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
        del raw
        if img is None or img.shape[0] < 64 or img.shape[1] < 64:
            return 0
        height, width = img.shape[:2]

        self.detector.setInputSize((width, height))
        _, faces = self.detector.detect(img)
        count = 0
        if faces is None:
            del img
            return 0

        for idx in range(faces.shape[0]):
            box = faces[idx, 0:4]
            score = float(faces[idx, 14])
            if box[2] < self.min_face_px or score < self.min_score:
                continue
            aligned = self.recognizer.alignCrop(img, faces[idx])
            feat = self.recognizer.feature(aligned)
            desc = feat[0].astype(np.float32)
            desc = desc / (np.linalg.norm(desc) or 1.0)

            face_id = "{}_f{}".format(item["id"], count + 1)
            crop_path = os.path.join(FACES_DIR, face_id + ".jpg")
            cv2.imwrite(crop_path, aligned, [cv2.IMWRITE_JPEG_QUALITY, 88])

            index["faces"].append(
                {
                    "faceId": face_id,
                    "fileId": item["id"],
                    "photoTitle": item.get("title", ""),
                    "category": item.get("category", ""),
                    "session": item.get("session", 0),
                    "time": item.get("time", ""),
                    "fileName": item.get("fileName", ""),
                    "box": {
                        "x": round(float(box[0]) / width, 4),
                        "y": round(float(box[1]) / height, 4),
                        "w": round(float(box[2]) / width, 4),
                        "h": round(float(box[3]) / height, 4),
                    },
                    "cropUrl": "/images/faces/{}.jpg".format(face_id),
                    "detectionScore": round(float(faces[idx, 14]), 3),
                    "descriptor": [round(float(v), 6) for v in desc],
                }
            )
            count += 1
        del img
        return count


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true")
    parser.add_argument("--limit", type=int, default=0)
    parser.add_argument("--fetch-size", default="w2048")
    parser.add_argument("--min-score", type=float, default=0.7)
    parser.add_argument("--min-face-px", type=int, default=48)
    parser.add_argument("--delay", type=float, default=0.25)
    args = parser.parse_args()

    os.makedirs(FACES_DIR, exist_ok=True)

    queue = load_json(QUEUE_PATH, None)
    if not queue or not isinstance(queue.get("items"), list):
        log("Queue data/scan-queue.json missing or empty — run the app first.")
        sys.exit(1)
    items = queue["items"]

    index = load_json(INDEX_PATH, None)
    if args.force or not index or index.get("version") != INDEX_VERSION:
        index = {
            "version": INDEX_VERSION,
            "model": MODEL_ID,
            "generatedAt": "",
            "scanned": {},
            "faces": [],
        }
    scanned = index.setdefault("scanned", {})

    todo = [
        it
        for it in items
        if args.force or it["id"] not in scanned
    ]
    if args.limit > 0:
        todo = todo[: args.limit]

    log(
        "Scanning {} of {} files ({} faces indexed, {} already scanned)".format(
            len(todo), len(items), len(index.get("faces", [])), len(scanned)
        )
    )
    status = {
        "running": True,
        "processed": 0,
        "total": len(todo),
        "failed": 0,
        "lastFile": "",
        "startedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "updatedAt": "",
        "done": False,
    }

    def persist():
        index["generatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        save_json(INDEX_PATH, index)
        status["updatedAt"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        save_json(STATUS_PATH, status)

    persist()
    scanner = Scanner(args)

    for pos, item in enumerate(todo, start=1):
        status["processed"] = pos
        status["lastFile"] = item.get("title", item["id"])
        label = "[{}/{}] {}".format(pos, len(todo), status["lastFile"])

        result = scanner.scan_file(item, index)
        if result is None:
            status["failed"] += 1
            log("{} -> FETCH FAILED, will retry next run".format(label))
        else:
            scanned[item["id"]] = {
                "title": item.get("title", ""),
                "faces": result,
                "at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            }
            log("{} -> {} face(s), total {}".format(label, result, len(index["faces"])))
        persist()
        time.sleep(args.delay)

    status["running"] = False
    status["done"] = True
    persist()
    log(
        "DONE: {} files, {} failed, {} faces -> {}".format(
            len(todo), status["failed"], len(index["faces"]), INDEX_PATH
        )
    )


if __name__ == "__main__":
    main()
