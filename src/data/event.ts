import poster from "@/assets/img/poster.jpg";
import kajian from "@/assets/img/kajian.jpg";
import bahtera from "@/assets/img/bahtera.jpg";
import film from "@/assets/img/film.jpg";
import snack from "@/assets/img/snack.jpg";
import masjid from "@/assets/img/masjid.jpg";
import games from "@/assets/img/games.jpg";
import craft from "@/assets/img/craft.jpg";
import dongeng from "@/assets/img/dongeng.jpg";
import doa from "@/assets/img/doa.jpg";

export const ART = { poster, kajian, bahtera, film, snack, masjid, games, craft, dongeng, doa };

export const EVENT = {
  edition: "Shoker #14",
  theme: "Stories of the Prophet",
  tagline: "Berlayar bersama Bahtera Nuh",
  age: "7–12 Tahun",
  dateLabel: "Ahad, 8 November 2026",
  timeLabel: "08.00 – 13.00 WIB",
  startISO: "2026-11-08T08:00:00+07:00",
  endISO: "2026-11-08T13:00:00+07:00",
  venue: "Masjid Alam Al-Barakah",
  address:
    "Jl. Raya Relife Greenville, Cikarageman, Kec. Setu, Kabupaten Bekasi, Jawa Barat 17320",
  maps: "https://maps.app.goo.gl/T4psSeY1LDy91Yt66",
  mapsEmbed:
    "https://www.google.com/maps?q=Masjid%20Alam%20Al-Barakah%20Cikarageman%20Setu%20Bekasi&output=embed",
  register: "https://bit.ly/CONTOH-PENDAFTARAN",
  drive: "https://drive.google.com/drive/folders/CONTOH-FOLDER",
  bank: "Bank Contoh",
  account: "000000000000",
  accountName: "Nama Panitia (contoh)",
  cpName: "CP Panitia (contoh)",
  cpPhone: "6280000000000",
  cpPhonePretty: "+62 800-0000-0000",
  earlyPrice: 40000,
  normalPrice: 55000,
  earlyQuota: 15,
  earlyTakenSeed: 9,
  participants: 68,
  crews: 14,
};

export const rupiah = (n: number) => "Rp" + n.toLocaleString("id-ID");

export type AlbumId = "shoker14" | "shoker13" | "shoker12" | "grafis";

export const ALBUMS: { id: AlbumId; label: string; short: string; note: string }[] = [
  {
    id: "shoker14",
    label: "Shoker #14 · Hasil Kegiatan",
    short: "#14 Hasil Kegiatan",
    note: "Dokumentasi lengkap — 8 November 2026",
  },
  {
    id: "shoker13",
    label: "Shoker #13 · Cahaya Hijrah",
    short: "#13 Cahaya Hijrah",
    note: "Dokumentasi kegiatan — Juli 2026",
  },
  {
    id: "shoker12",
    label: "Shoker #12 · Jejak Rasul",
    short: "#12 Jejak Rasul",
    note: "Dokumentasi kegiatan — April 2026",
  },
  { id: "grafis", label: "Poster & Grafis", short: "Poster & Grafis", note: "Karya tim kreatif Shoker" },
];

export const CATEGORIES = [
  "Kajian",
  "Kreatif",
  "Film",
  "Bermain",
  "Konsumsi",
  "Kebersamaan",
  "Lokasi",
  "Grafis",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_TONE: Record<Category, string> = {
  Kajian: "#12798C",
  Kreatif: "#F2A63B",
  Film: "#7A5AA8",
  Bermain: "#3E9E62",
  Konsumsi: "#E8663C",
  Kebersamaan: "#1B9FA8",
  Lokasi: "#2E8FA8",
  Grafis: "#C2412D",
};

export type Photo = {
  id: string;
  src: string;
  title: string;
  caption: string;
  album: AlbumId;
  category: Category;
  date: string;
  credit: string;
  likes: number;
  shape: "std" | "tall" | "wide";
  pos?: string;
  zoom?: number;
  tone: string;
  /** rundown chapter this frame belongs to (Shoker #14 only) */
  session?: number;
  time?: string;
};

const P = (
  id: string,
  src: string,
  title: string,
  caption: string,
  album: AlbumId,
  category: Category,
  date: string,
  credit: string,
  likes: number,
  shape: Photo["shape"],
  tone: string,
  pos?: string,
  zoom?: number,
  session?: number,
  time?: string,
): Photo => ({ id, src, title, caption, album, category, date, credit, likes, shape, tone, pos, zoom, session, time });

const D14 = "2026-11-08";

export const PHOTOS: Photo[] = [
  /* ---------- Shoker #14 — hasil kegiatan, urut sesi ---------- */
  P("r01", snack, "Meja snack pukul delapan", "Kotak snack pagi tersusun rapi sebelum peserta pertama turun dari mobil.", "shoker14", "Konsumsi", D14, "Kak Desi", 64, "wide", "#e8663c", "50% 45%", 1.05, 1, "08.04"),
  P("r02", masjid, "Pagi di halaman Al-Barakah", "Panitia menggelar tikar di serambi, langit Bekasi cerah sejak subuh.", "shoker14", "Lokasi", D14, "Kak Ilham", 88, "std", "#1b9fa8", undefined, undefined, 1, "08.11"),
  P("r03", kajian, "Name tag bahtera dibagikan", "Enam puluh delapan anak menerima name tag bergambar kapal dan nomor regu.", "shoker14", "Kebersamaan", D14, "Kak Rahman", 121, "std", "#12798c", "62% 55%", 1.45, 2, "08.36"),
  P("r04", games, "Tepuk Bahtera pembuka", "Ice breaking pertama: tepuk tiga ketuk yang langsung dihafal semua peserta.", "shoker14", "Bermain", D14, "Kak Ilham", 97, "wide", "#3e9e62", "45% 50%", 1.2, 2, "08.48"),
  P("r05", dongeng, "Kak Fadhil membuka kisah", "Buku besar dibuka, halaman bahtera menghadap anak-anak, dan aula mendadak senyap.", "shoker14", "Kajian", D14, "Kak Rahman", 214, "tall", "#0d4356", undefined, undefined, 3, "09.12"),
  P("r06", kajian, "Seratus tangan terangkat", "Sesi tanya jawab: siapa yang masih ingat nama putra Nabi Nuh? Semua ingin menjawab.", "shoker14", "Kajian", D14, "Kak Salma", 176, "wide", "#12798c", "50% 42%", 1.12, 3, "09.41"),
  P("r07", bahtera, "Bahtera pertama selesai", "Miniatur kayu dan kardus buatan Regu Jerapah, lengkap dengan lentera kertas.", "shoker14", "Kreatif", D14, "Kak Salma", 189, "std", "#8a5a34", undefined, undefined, 4, "10.18"),
  P("r08", craft, "Hewan naik berpasangan", "Gajah, jerapah, singa, zebra, dan merpati — dua-dua, seperti dalam kisah.", "shoker14", "Kreatif", D14, "Kak Salma", 152, "std", "#f2a63b", undefined, undefined, 4, "10.33"),
  P("r09", film, "Lampu padam, layar menyala", "Nobar animasi kisah Nabi Nuh a.s. memenuhi aula yang digelapkan.", "shoker14", "Film", D14, "Kak Ilham", 143, "wide", "#082c3a", undefined, undefined, 5, "10.52"),
  P("r10", film, "Berkas cahaya proyektor", "Debu menari di dalam berkas cahaya; tak ada yang beranjak dari karpet.", "shoker14", "Film", D14, "Kak Ilham", 78, "std", "#082c3a", "32% 38%", 1.75, 5, "11.09"),
  P("r11", games, "Estafet tali antar regu", "Regu Bahtera menang tipis atas Regu Merpati di permainan kekompakan.", "shoker14", "Bermain", D14, "Kak Ilham", 134, "std", "#3e9e62", undefined, undefined, 6, "11.38"),
  P("r12", craft, "Pameran karya di serambi", "Hasil kelas kreatif dijajarkan agar orang tua bisa melihatnya saat penjemputan.", "shoker14", "Kreatif", D14, "Kak Salma", 91, "wide", "#f7ce68", "55% 58%", 1.3, 6, "12.02"),
  P("r13", snack, "Makan siang bersama", "Nasi kotak, ayam, tempe, dan buah potong — habis tanpa sisa.", "shoker14", "Konsumsi", D14, "Kak Desi", 73, "std", "#e8663c", "50% 62%", 1.35, 7, "12.21"),
  P("r14", doa, "Doa penutup bahtera", "Tangan-tangan kecil menengadah, memohon ilmu yang bermanfaat sebelum pulang.", "shoker14", "Kebersamaan", D14, "Kak Rahman", 231, "tall", "#f2a63b", undefined, undefined, 7, "12.47"),

  /* ---------- grafis ---------- */
  P("p01", poster, "Bahtera Nuh", "Poster resmi Shoker #14 — bahtera berlayar menuju pelangi setelah badai.", "grafis", "Grafis", "2026-10-02", "Tim Kreatif", 128, "tall", "#0d4356"),
  P("p07", poster, "Janji setelah badai", "Detail pelangi pada poster — tanda kasih sayang Allah setelah ujian.", "grafis", "Grafis", "2026-10-02", "Tim Kreatif", 67, "std", "#e8663c", "50% 26%", 1.9),
  P("p08", poster, "Merpati pembawa kabar", "Seekor merpati dengan ranting zaitun, pertanda daratan telah dekat.", "grafis", "Grafis", "2026-10-02", "Tim Kreatif", 59, "std", "#0d4356", "66% 17%", 2.4),

  /* ---------- Shoker #13 ---------- */
  P("p10", kajian, "Halaqah pembuka", "Barisan pertama selalu penuh. Shoker #13 dibuka dengan kisah dan tanya jawab.", "shoker13", "Kajian", "2026-07-19", "Kak Rahman", 143, "wide", "#12798c"),
  P("p12", film, "Nonton bareng", "Aula digelapkan, proyektor menyala, dan cerita Nabi tampil di layar lebar.", "shoker13", "Film", "2026-07-19", "Kak Ilham", 132, "wide", "#082c3a"),
  P("p13", games, "Estafet tali", "Permainan kekompakan di halaman masjid — regu Bahtera menang tipis!", "shoker13", "Bermain", "2026-07-19", "Kak Ilham", 105, "std", "#3e9e62"),
  P("p15", doa, "Doa penutup", "Tangan-tangan kecil menengadah, memohon ilmu yang bermanfaat.", "shoker13", "Kebersamaan", "2026-07-19", "Kak Salma", 167, "tall", "#f2a63b"),
  P("p16", craft, "Meja kreatif", "Lem, gunting, dan mata mainan — setiap anak membawa pulang karyanya.", "shoker13", "Kreatif", "2026-07-19", "Kak Salma", 79, "std", "#f7ce68", "60% 50%", 1.25),
  P("p17", masjid, "Menara dan taman", "Tempat kita berkumpul setiap edisi Shoker, teduh sejak pagi.", "shoker13", "Lokasi", "2026-07-19", "Kak Ilham", 47, "std", "#1b9fa8", "35% 40%", 1.4),

  /* ---------- Shoker #12 ---------- */
  P("p18", kajian, "Melengkapi barisan", "Peserta Shoker #12 menyimak kisah perjuangan Rasulullah ﷺ.", "shoker12", "Kajian", "2026-04-12", "Kak Rahman", 91, "std", "#12798c", "68% 55%", 1.5),
  P("p19", games, "Sorak regu Bahtera", "Teriakan penyemangat dari pinggir lapangan sama serunya dengan lombanya.", "shoker12", "Bermain", "2026-04-12", "Kak Ilham", 84, "wide", "#3e9e62", "40% 45%", 1.3),
  P("p20", bahtera, "Cat dan kesabaran", "Mengecat lambung kapal mengajarkan bahwa yang besar dibangun perlahan.", "shoker12", "Kreatif", "2026-04-12", "Kak Salma", 63, "std", "#8a5a34", "58% 60%", 1.6),
  P("p21", dongeng, "Satu buku, satu kisah", "Pendongeng Shoker #12 dan anak-anak yang tak berkedip mendengarkannya.", "shoker12", "Kajian", "2026-04-12", "Kak Rahman", 57, "std", "#082c3a", "38% 40%", 1.5),
  P("p22", doa, "Pulang membawa cerita", "Sebelum berpisah, kami berdoa dan berfoto bersama satu angkatan.", "shoker12", "Kebersamaan", "2026-04-12", "Kak Salma", 112, "std", "#f2a63b", "50% 60%", 1.35),
];

export const RUNDOWN = [
  { time: "08.00", end: "08.30", title: "Registrasi & Snack Pagi", desc: "Absensi, name tag bahtera, dan snack pembuka di serambi masjid.", icon: "ticket" },
  { time: "08.30", end: "09.00", title: "Pembukaan & Ice Breaking", desc: "Salam, doa pembuka, dan Tepuk Bahtera bersama kakak fasilitator.", icon: "sparkle" },
  { time: "09.00", end: "10.00", title: "Kajian Interaktif Kisah Nabi Nuh", desc: "Berlayar bersama bahtera: kesabaran, ketaatan, dan pertolongan Allah.", icon: "book" },
  { time: "10.00", end: "10.45", title: "Kelas Kreatif Bahtera", desc: "Membuat miniatur bahtera dan hewan berpasangan dari kertas.", icon: "scissors" },
  { time: "10.45", end: "11.30", title: "Menonton Film Bersama", desc: "Film animasi kisah Nabi Nuh a.s. di layar lebar aula masjid.", icon: "film" },
  { time: "11.30", end: "12.15", title: "Games Kekompakan & Kuis", desc: "Permainan regu di halaman dan kuis berhadiah seputar kisah Nabi.", icon: "flag" },
  { time: "12.15", end: "13.00", title: "Makan Siang & Penutup", desc: "Makan siang bersama, doa penutup, dan foto keluarga besar Shoker.", icon: "bowl" },
];

/** Short chapter labels used by the gallery's session rail. */
export const SESSIONS = RUNDOWN.map((r, i) => ({
  n: i + 1,
  time: r.time,
  end: r.end,
  label: [
    "Registrasi",
    "Pembukaan",
    "Kajian",
    "Kelas Kreatif",
    "Nobar Film",
    "Games & Kuis",
    "Penutup",
  ][i],
  tone: ["#E8663C", "#3E9E62", "#12798C", "#F2A63B", "#7A5AA8", "#46C3B2", "#C2412D"][i],
}));

export const BENEFITS = [
  { icon: "sandwich", title: "Snack Pagi", desc: "Camilan pembuka begitu peserta tiba di lokasi.", tone: "#F2A63B" },
  { icon: "book", title: "Kajian Interaktif & Seru", desc: "Kisah Nabi Nuh a.s. dibawakan dengan cerita, gambar, dan tanya jawab.", tone: "#46C3B2" },
  { icon: "film", title: "Menonton Film Bersama", desc: "Nobar film animasi kisah nabi di layar lebar.", tone: "#7A5AA8" },
  { icon: "gem", title: "Pengalaman Belajar & Bermain", desc: "Kelas kreatif, games regu, dan kuis berhadiah khas Shoker.", tone: "#E8663C" },
  { icon: "bowl", title: "Makan Siang", desc: "Menu sehat ramah anak sebelum pulang.", tone: "#3E9E62" },
];

export const FAQ = [
  {
    q: "Di mana saya bisa melihat foto hasil kegiatan?",
    a: "Seluruh dokumentasi Shoker #14 tersusun per sesi pada galeri di halaman ini. Versi resolusi penuh dapat diunduh dari Google Drive panitia, dan setiap foto punya tautan yang bisa dibagikan.",
  },
  {
    q: "Siapa saja yang boleh ikut Shoker berikutnya?",
    a: "Anak Muslim usia 7–12 tahun. Adik yang lebih kecil belum bisa mengikuti kelas, namun orang tua dapat menunggu di area pendamping yang disediakan panitia.",
  },
  {
    q: "Bagaimana cara mendapatkan harga Early Bird?",
    a: `Early Bird ${rupiah(EVENT.earlyPrice)} hanya untuk 15 pendaftar pertama yang menyelesaikan pembayaran. Setelah kuota habis, berlaku HTM normal ${rupiah(EVENT.normalPrice)}.`,
  },
  {
    q: "Apakah pendaftaran wajib online?",
    a: `Ya, wajib daftar online melalui ${EVENT.register}. Setelah mengisi formulir, lakukan infaq HTM ke rekening ${EVENT.bank} ${EVENT.account} a.n. ${EVENT.accountName}, lalu kirim bukti transfer ke ${EVENT.cpName}.`,
  },
  {
    q: "Apa yang perlu dibawa peserta?",
    a: "Botol minum, alat tulis, jaket tipis, dan pakaian yang nyaman untuk bergerak. Perlengkapan kelas kreatif sudah disiapkan panitia.",
  },
];