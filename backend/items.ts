/**
 * Demo manifest for the face-search pipeline.
 * The demo gallery uses bundled illustrations (no Google Drive), so every
 * queue item points at a local image via `local` — scripts/scan_faces.py
 * reads those straight from disk instead of fetching Drive thumbnails.
 * `id` equals the gallery photo id (r01…, p01…) so matches map back 1:1.
 */
export interface GalleryItem {
  /** Gallery photo id — also the face-index fileId */
  id: string;
  gid: string;
  title: string;
  category: string;
  session: number;
  time: string;
  fileName: string;
  /** Repo-relative image path (scanner reads it from disk) */
  local: string;
}

export const GALLERY_ITEMS: GalleryItem[] = [
  { gid: "r01", id: "r01", title: "Meja snack pukul delapan", category: "Konsumsi", session: 1, time: "08.04", fileName: "snack.jpg", local: "src/assets/img/snack.jpg" },
  { gid: "r02", id: "r02", title: "Pagi di halaman Al-Barakah", category: "Lokasi", session: 1, time: "08.11", fileName: "masjid.jpg", local: "src/assets/img/masjid.jpg" },
  { gid: "r03", id: "r03", title: "Name tag bahtera dibagikan", category: "Kebersamaan", session: 2, time: "08.36", fileName: "kajian.jpg", local: "src/assets/img/kajian.jpg" },
  { gid: "r04", id: "r04", title: "Tepuk Bahtera pembuka", category: "Bermain", session: 2, time: "08.48", fileName: "games.jpg", local: "src/assets/img/games.jpg" },
  { gid: "r05", id: "r05", title: "Kak Fadhil membuka kisah", category: "Kajian", session: 3, time: "09.12", fileName: "dongeng.jpg", local: "src/assets/img/dongeng.jpg" },
  { gid: "r06", id: "r06", title: "Seratus tangan terangkat", category: "Kajian", session: 3, time: "09.41", fileName: "kajian.jpg", local: "src/assets/img/kajian.jpg" },
  { gid: "r07", id: "r07", title: "Bahtera pertama selesai", category: "Kreatif", session: 4, time: "10.18", fileName: "bahtera.jpg", local: "src/assets/img/bahtera.jpg" },
  { gid: "r08", id: "r08", title: "Hewan naik berpasangan", category: "Kreatif", session: 4, time: "10.33", fileName: "craft.jpg", local: "src/assets/img/craft.jpg" },
  { gid: "r09", id: "r09", title: "Lampu padam, layar menyala", category: "Film", session: 5, time: "10.52", fileName: "film.jpg", local: "src/assets/img/film.jpg" },
  { gid: "r10", id: "r10", title: "Berkas cahaya proyektor", category: "Film", session: 5, time: "11.09", fileName: "film.jpg", local: "src/assets/img/film.jpg" },
  { gid: "r11", id: "r11", title: "Estafet tali antar regu", category: "Bermain", session: 6, time: "11.38", fileName: "games.jpg", local: "src/assets/img/games.jpg" },
  { gid: "r12", id: "r12", title: "Pameran karya di serambi", category: "Kreatif", session: 6, time: "12.02", fileName: "craft.jpg", local: "src/assets/img/craft.jpg" },
  { gid: "r13", id: "r13", title: "Makan siang bersama", category: "Konsumsi", session: 7, time: "12.21", fileName: "snack.jpg", local: "src/assets/img/snack.jpg" },
  { gid: "r14", id: "r14", title: "Doa penutup bahtera", category: "Kebersamaan", session: 7, time: "12.47", fileName: "doa.jpg", local: "src/assets/img/doa.jpg" },
  { gid: "p01", id: "p01", title: "Bahtera Nuh", category: "Grafis", session: 0, time: "", fileName: "poster.jpg", local: "src/assets/img/poster.jpg" },
  { gid: "p07", id: "p07", title: "Janji setelah badai", category: "Grafis", session: 0, time: "", fileName: "poster.jpg", local: "src/assets/img/poster.jpg" },
  { gid: "p08", id: "p08", title: "Merpati pembawa kabar", category: "Grafis", session: 0, time: "", fileName: "poster.jpg", local: "src/assets/img/poster.jpg" },
  { gid: "p10", id: "p10", title: "Halaqah pembuka", category: "Kajian", session: 0, time: "", fileName: "kajian.jpg", local: "src/assets/img/kajian.jpg" },
  { gid: "p12", id: "p12", title: "Nonton bareng", category: "Film", session: 0, time: "", fileName: "film.jpg", local: "src/assets/img/film.jpg" },
  { gid: "p13", id: "p13", title: "Estafet tali", category: "Bermain", session: 0, time: "", fileName: "games.jpg", local: "src/assets/img/games.jpg" },
  { gid: "p15", id: "p15", title: "Doa penutup", category: "Kebersamaan", session: 0, time: "", fileName: "doa.jpg", local: "src/assets/img/doa.jpg" },
  { gid: "p16", id: "p16", title: "Meja kreatif", category: "Kreatif", session: 0, time: "", fileName: "craft.jpg", local: "src/assets/img/craft.jpg" },
  { gid: "p17", id: "p17", title: "Menara dan taman", category: "Lokasi", session: 0, time: "", fileName: "masjid.jpg", local: "src/assets/img/masjid.jpg" },
  { gid: "p18", id: "p18", title: "Melengkapi barisan", category: "Kajian", session: 0, time: "", fileName: "kajian.jpg", local: "src/assets/img/kajian.jpg" },
  { gid: "p19", id: "p19", title: "Sorak regu Bahtera", category: "Bermain", session: 0, time: "", fileName: "games.jpg", local: "src/assets/img/games.jpg" },
  { gid: "p20", id: "p20", title: "Cat dan kesabaran", category: "Kreatif", session: 0, time: "", fileName: "bahtera.jpg", local: "src/assets/img/bahtera.jpg" },
  { gid: "p21", id: "p21", title: "Satu buku, satu kisah", category: "Kajian", session: 0, time: "", fileName: "dongeng.jpg", local: "src/assets/img/dongeng.jpg" },
  { gid: "p22", id: "p22", title: "Pulang membawa cerita", category: "Kebersamaan", session: 0, time: "", fileName: "doa.jpg", local: "src/assets/img/doa.jpg" },
];
