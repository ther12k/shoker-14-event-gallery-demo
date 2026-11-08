#!/usr/bin/env python3
"""
One-shot face query helper for the gallery server (spawned per request).

Reads a JSON request on stdin and writes a JSON response on stdout:

  {"action": "detect", "image": "<base64/data-url jpeg|png>"}
    -> {"faces": [{"box": {x,y,w,h}, "score": 0.9, "preview": "data:image/jpeg;base64,..."}]}

  {"action": "search", "image": "...", "box": {"x","y","w","h"} }   # box optional, normalized
    -> {"descriptor": [128 floats], "preview": "data:image/jpeg;base64,..."}

Detection previews and query embeddings use the exact YuNet + SFace models the
indexer used, so query and index descriptors live in the same vector space.
When the caller supplies an adjusted crop box, the best-overlapping detection's
landmarks are re-fitted to that box so manual corrections nudge the alignment.
"""
import base64
import json
import os
import sys

import cv2
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
YUNET_PATH = os.path.join(ROOT, "models", "onnx", "yunet.onnx")
SFACE_PATH = os.path.join(ROOT, "models", "onnx", "sface.onnx")

DETECTOR = cv2.FaceDetectorYN.create(YUNET_PATH, "", (320, 320), score_threshold=0.45, top_k=50)
RECOGNIZER = cv2.FaceRecognizerSF.create(SFACE_PATH, "")


def decode_image(payload):
    raw = base64.b64decode(payload.split(",")[-1])
    img = cv2.imdecode(np.frombuffer(raw, dtype=np.uint8), cv2.IMREAD_COLOR)
    if img is None or img.size == 0:
        raise ValueError("Gambar tidak dapat dibaca. Gunakan file JPG atau PNG.")
    return img


def to_data_url(mat, quality=82):
    ok, buf = cv2.imencode(".jpg", mat, [cv2.IMWRITE_JPEG_QUALITY, quality])
    if not ok:
        raise ValueError("Gagal membuat pratinjau wajah.")
    return "data:image/jpeg;base64," + base64.b64encode(buf).decode()


def detect_faces(img):
    height, width = img.shape[:2]
    DETECTOR.setInputSize((width, height))
    _, faces = DETECTOR.detect(img)
    out = []
    if faces is not None:
        for i in range(faces.shape[0]):
            x, y, fw, fh = (float(v) for v in faces[i, 0:4])
            score = float(faces[i, 14])
            if score < 0.6 or fw < 40 or fh < 40:
                continue  # only suggest usable faces as crop guidance
            aligned = RECOGNIZER.alignCrop(img, faces[i])
            out.append(
                {
                    "box": {
                        "x": round(x / width, 4),
                        "y": round(y / height, 4),
                        "w": round(fw / width, 4),
                        "h": round(fh / height, 4),
                    },
                    "score": round(score, 3),
                    "preview": to_data_url(aligned),
                }
            )
    out.sort(key=lambda f: -f["score"])
    return out


def box_iou(ax, ay, aw, ah, bx, by, bw, bh):
    x1, y1 = max(ax, bx), max(ay, by)
    x2, y2 = min(ax + aw, bx + bw), min(ay + ah, by + bh)
    inter = max(0.0, x2 - x1) * max(0.0, y2 - y1)
    union = aw * ah + bw * bh - inter
    return inter / union if union > 0 else 0.0


def fit_face_row_to_box(row, user_box, width, height):
    """Re-fits a detection row (box + 5 landmarks) onto the user's edited box."""
    ux, uy = user_box["x"] * width, user_box["y"] * height
    uw, uh = user_box["w"] * width, user_box["h"] * height
    sx, sy, sw, sh = float(row[0]), float(row[1]), float(row[2]), float(row[3])
    scale_x = uw / sw if sw > 0 else 1.0
    scale_y = uh / sh if sh > 0 else 1.0
    fitted = np.array(row, dtype=np.float32)
    fitted[0], fitted[1], fitted[2], fitted[3] = ux, uy, uw, uh
    for k in range(5):
        lx, ly = float(row[4 + 2 * k]), float(row[5 + 2 * k])
        fitted[4 + 2 * k] = ux + (lx - sx) * scale_x
        fitted[5 + 2 * k] = uy + (ly - sy) * scale_y
    return fitted


def search_face(img, user_box):
    height, width = img.shape[:2]
    DETECTOR.setInputSize((width, height))
    _, faces = DETECTOR.detect(img)
    if faces is None or faces.shape[0] == 0:
        raise ValueError("Tidak ada wajah terdeteksi pada gambar ini. Coba foto yang lebih jelas.")

    row = faces[0]
    if user_box:
        ux, uy = user_box["x"] * width, user_box["y"] * height
        uw, uh = user_box["w"] * width, user_box["h"] * height
        best_i, best_iou = 0, -1.0
        for i in range(faces.shape[0]):
            fx, fy, fw, fh = (float(v) for v in faces[i, 0:4])
            overlap = box_iou(ux, uy, uw, uh, fx, fy, fw, fh)
            if overlap > best_iou:
                best_iou, best_i = overlap, i
        if best_iou < 0.15:
            # fall back to the detection whose center is closest to the box center
            cx, cy = ux + uw / 2, uy + uh / 2
            best_i, best_dist = 0, float("inf")
            for i in range(faces.shape[0]):
                fx, fy, fw, fh = (float(v) for v in faces[i, 0:4])
                d = (fx + fw / 2 - cx) ** 2 + (fy + fh / 2 - cy) ** 2
                if d < best_dist:
                    best_dist, best_i = d, i
        row = fit_face_row_to_box(faces[best_i], user_box, width, height)

    aligned = RECOGNIZER.alignCrop(img, row)
    feat = RECOGNIZER.feature(aligned)
    desc = feat[0].astype(np.float32)
    desc = desc / (np.linalg.norm(desc) or 1.0)
    return {
        "descriptor": [round(float(v), 6) for v in desc],
        "preview": to_data_url(aligned),
    }


def main():
    try:
        req = json.load(sys.stdin)
        img = decode_image(req.get("image", ""))
        if req.get("action") == "detect":
            print(json.dumps({"faces": detect_faces(img)}))
        else:
            print(json.dumps(search_face(img, req.get("box"))))
    except Exception as err:  # noqa: BLE001 - surfaced to the browser as a message
        print(json.dumps({"error": str(err)}))


if __name__ == "__main__":
    main()
