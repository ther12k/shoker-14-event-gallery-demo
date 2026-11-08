# Shoker #14 · Bahtera Nuh — Event Gallery & Face Search (Demo Publik)

Versi **demo publik** dari landing page + galeri + **pencarian wajah** acara
Shoker #14 (Stories of the Prophet — Berlayar bersama Bahtera Nuh).

> 🖼️ **Semua foto pada repositori ini adalah ilustrasi**, bukan dokumentasi asli
> dan bukan foto peserta. Data panitia (rekening, nomor kontak, tautan
> pendaftaran) memakai placeholder. Versi produksi dengan dokumentasi asli
> disimpan terpisah secara privat.

## Fitur

- **Galeri multi-edisi** — album Shoker #14 / #13 / #12 + grafis, filter sesi &
  kategori, mozaik & grid, favorit, lightbox, deep link `#foto-r05`
- **Cari Wajah** — unggah/tempel potongan wajah → deteksi wajah (YuNet) →
  pencocokan embedding (SFace) → hasil terurut skor kemiripan; plus direktori
  grup wajah ("wajah yang sering muncul"). Di demo ini pipeline berjalan di
  atas ilustrasi galeri.
- Responsif 375px→desktop, tombol melayang "Cari Wajah" di ponsel, audio
  ambience, formulir pendaftaran (data contoh), rundown, lokasi, FAQ

## Arsitektur

```
src/            SPA React 19 + Vite + Tailwind 4 (singlefile build)
  components/FaceSearch.tsx   panel pencarian & grup wajah
  lib/faceSearchUtils.ts      NN-chain average-linkage clustering
backend/        Express: /api/faces*, static dist + crops
  faceService.ts   clustering, scan trigger, upload-search (concurrency-capped)
  items.ts         manifest galeri (id foto → berkas ilustrasi lokal)
scripts/        Python worker (OpenCV): scan_faces.py, face_query.py
models/onnx/    yunet.onnx + sface.onnx (unduh sendiri — lihat bawah)
data/           face-index.json + crops (di-gitignore; hasil scan lokal)
```

Pipeline wajah diporting dari
[supercamp-sdit-gallery](https://github.com/ihalotec/supercamp-sdit-gallery):
scan berurutan & resumable → embedding 128-d L2-normalized → clustering
agglomerative (NN-chain, threshold 0.9, aturan *cannot-link* satu-foto-satu-orang)
→ query dengan model yang sama (ruang vektor konsisten). Deskriptor wajah tidak
pernah dikirim ke browser. Varian demo menambahkan dukungan item antrean
`"local"` pada `scan_faces.py` sehingga pemindaian bisa membaca berkas gambar
dari disk tanpa Google Drive.

## Demo online (GitHub Pages)

Versi statis demo ini juga di-host di GitHub Pages dengan **pencarian wajah
yang berjalan sepenuhnya di browser** (tanpa server):

> https://ther12k.github.io/shoker-14-event-gallery-demo/

YuNet berjalan via opencv.js (WASM), embedding SFace via onnxruntime-web —
pemrosesan awal dipindahkan 1:1 dari FaceRecognizerSFImpl OpenCV dan
divalidasi terhadap hasil Python cv2 (kosinus embedding 0,9999). Indeks wajah
(ilustrasi) dimuat dari public/demo/faces.json, dihasilkan oleh
npm run faces:export. Semua berkas besar (opencv.js, wasm, model ONNX)
dimuat malas saat panel wajah pertama kali dipakai.

## Menjalankan

```bash
npm install
npm test            # test clustering
npm run build       # build SPA → dist/

# Model ONNX (sekali saja):
#   yunet: https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx
#   sface: https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx
mkdir -p models/onnx && mv face_detection_yunet_2023mar.onnx models/onnx/yunet.onnx \
                          && mv face_recognition_sface_2021dec.onnx models/onnx/sface.onnx

pip install opencv-python numpy   # butuh python3 + OpenCV
npm run faces:scan                # tulis queue lalu pindai ilustrasi (± beberapa detik)

npm start            # Express di 127.0.0.1:3000 — SPA + /api/faces*
```

Setelah itu buka http://127.0.0.1:3000, potong satu wajah dari galeri
(klik kanan → salin gambar), tempel di panel **Cari Wajah**, dan lihat
pencocokannya. Scan juga bisa dipicu dari UI (tombol "Pindai galeri sekarang")
atau `curl -X POST localhost:3000/api/faces/scan`.

## Catatan privasi

Foto yang diunggah pengguna hanya dipakai sejenak di memori server untuk membuat
embedding — tidak disimpan. `data/` (indeks wajah) sengaja di-gitignore.
