import { useMemo, useState } from "react";
import { EVENT, rupiah } from "@/data/event";
import { Reveal, copyText, jumpTo, usePersistentState, useToast } from "@/lib/store";
import { ambience } from "@/lib/audio";
import {
  IconCheck,
  IconClose,
  IconCopy,
  IconInfo,
  IconLink,
  IconSparkle,
  IconTicket,
  IconTrash,
  IconUsers,
  IconWarn,
  IconWhatsapp,
} from "./Icons";

type Ticket = "early" | "normal";
type Reg = {
  id: string;
  code: string;
  ticket: Ticket;
  qty: number;
  child: string;
  age: number;
  parent: string;
  phone: string;
  note: string;
  paid: boolean;
  createdAt: number;
};

const EMPTY = { child: "", age: "", parent: "", phone: "", note: "" };
const priceOf = (t: Ticket) => (t === "early" ? EVENT.earlyPrice : EVENT.normalPrice);

export function Register() {
  const { push } = useToast();
  const [regs, setRegs] = usePersistentState<Reg[]>("shoker14.regs", []);
  const [ticket, setTicket] = useState<Ticket>("early");
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({ ...EMPTY });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const usedEarly = useMemo(
    () => regs.filter((r) => r.ticket === "early").reduce((s, r) => s + r.qty, 0),
    [regs],
  );
  const remaining = Math.max(0, EVENT.earlyQuota - EVENT.earlyTakenSeed - usedEarly);
  const earlyOpen = remaining > 0;
  const activeTicket: Ticket = !earlyOpen && ticket === "early" ? "normal" : ticket;
  const total = priceOf(activeTicket) * qty;

  const copy = async (text: string, key: string, label: string) => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(key);
      window.setTimeout(() => setCopied((c) => (c === key ? null : c)), 1800);
      ambience.blip(700, 0.1);
    }
    push({ title: ok ? `${label} disalin` : "Gagal menyalin", desc: text, tone: ok ? "ok" : "warn" });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.child.trim().length < 2) e.child = "Nama anak minimal 2 huruf.";
    const age = Number(form.age);
    if (!form.age) e.age = "Pilih usia peserta.";
    else if (age < 7 || age > 12) e.age = "Shoker #14 untuk usia 7–12 tahun.";
    if (form.parent.trim().length < 2) e.parent = "Nama orang tua/wali wajib diisi.";
    if (!/^(\+?62|0)8[1-9][0-9]{6,11}$/.test(form.phone.replace(/[\s-]/g, "")))
      e.phone = "Format WhatsApp belum benar, contoh 081234567890.";
    if (activeTicket === "early" && !editing && qty > remaining)
      e.qty = `Sisa kuota Early Bird tinggal ${remaining} peserta.`;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) {
      ambience.blip(200, 0.18, "sawtooth", 0.05);
      push({ title: "Periksa lagi isianmu", desc: "Beberapa kolom masih perlu diperbaiki.", tone: "warn" });
      return;
    }
    if (editing) {
      setRegs((prev) =>
        prev.map((r) =>
          r.id === editing
            ? {
                ...r,
                ticket: activeTicket,
                qty,
                child: form.child.trim(),
                age: Number(form.age),
                parent: form.parent.trim(),
                phone: form.phone.trim(),
                note: form.note.trim(),
              }
            : r,
        ),
      );
      push({ title: "Pendaftaran diperbarui", desc: form.child.trim(), tone: "ok" });
      setEditing(null);
    } else {
      const reg: Reg = {
        id: `${Date.now()}`,
        code: `SHK14-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        ticket: activeTicket,
        qty,
        child: form.child.trim(),
        age: Number(form.age),
        parent: form.parent.trim(),
        phone: form.phone.trim(),
        note: form.note.trim(),
        paid: false,
        createdAt: Date.now(),
      };
      setRegs((prev) => [reg, ...prev]);
      setOpenRow(reg.id);
      push({
        title: "Pendaftaran tercatat",
        desc: `${reg.code} · ${rupiah(priceOf(reg.ticket) * reg.qty)} — segera transfer & konfirmasi.`,
        tone: "ok",
      });
    }
    ambience.chime();
    setForm({ ...EMPTY });
    setQty(1);
    setErrors({});
  };

  const startEdit = (r: Reg) => {
    setEditing(r.id);
    setTicket(r.ticket);
    setQty(r.qty);
    setForm({ child: r.child, age: String(r.age), parent: r.parent, phone: r.phone, note: r.note });
    setErrors({});
    jumpTo("form-daftar", 140);
  };

  const remove = (r: Reg) => {
    setRegs((prev) => prev.filter((x) => x.id !== r.id));
    if (editing === r.id) {
      setEditing(null);
      setForm({ ...EMPTY });
    }
    ambience.blip(260, 0.16);
    push({
      title: "Pendaftaran dibatalkan",
      desc: `${r.code} · ${r.child}`,
      tone: "bad",
      action: {
        label: "Urungkan",
        run: () => {
          setRegs((prev) => [r, ...prev.filter((x) => x.id !== r.id)]);
          push({ title: "Dikembalikan", desc: r.code, tone: "ok" });
        },
      },
    });
  };

  const togglePaid = (r: Reg) => {
    setRegs((prev) => prev.map((x) => (x.id === r.id ? { ...x, paid: !x.paid } : x)));
    ambience.blip(r.paid ? 420 : 880, 0.14);
    push({
      title: r.paid ? "Ditandai belum transfer" : "Ditandai sudah transfer",
      desc: `${r.code} · panitia akan memverifikasi via WhatsApp.`,
      tone: r.paid ? "info" : "ok",
    });
  };

  const waText = (r: Reg) =>
    `Assalamu'alaikum ${EVENT.cpName}, saya sudah mendaftar ${EVENT.edition}.%0A%0A` +
    `Kode: ${r.code}%0ANama anak: ${r.child} (${r.age} th)%0AWali: ${r.parent}%0A` +
    `Tiket: ${r.ticket === "early" ? "Early Bird" : "Normal"} x${r.qty}%0A` +
    `Total infaq: ${rupiah(priceOf(r.ticket) * r.qty)}%0A%0A` +
    `Berikut bukti transfernya. Jazakillah khairan.`;

  const summaryText = (r: Reg) =>
    `${EVENT.edition} — ${EVENT.theme}: ${EVENT.tagline}\n` +
    `Kode: ${r.code}\nAnak: ${r.child} (${r.age} tahun)\nWali: ${r.parent} — ${r.phone}\n` +
    `Tiket: ${r.ticket === "early" ? "Early Bird" : "Normal"} × ${r.qty}\n` +
    `Total: ${rupiah(priceOf(r.ticket) * r.qty)}\n` +
    `${EVENT.dateLabel}, ${EVENT.timeLabel}\n${EVENT.venue}\n` +
    `Transfer: ${EVENT.bank} ${EVENT.account} a.n. ${EVENT.accountName}`;

  return (
    <section id="daftar" className="relative overflow-hidden bg-abyss py-16 sm:py-24">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_60%_at_20%_0%,#0d4356_0%,transparent_55%),radial-gradient(70%_50%_at_100%_80%,#c2412d33_0%,transparent_60%)]" />
      <div className="pattern-star pointer-events-none absolute inset-0 opacity-[0.05]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-coral/40 bg-coral/12 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-coral">
            <IconTicket width={14} height={14} /> Pendaftaran
          </span>
          <h2 className="font-display mt-4 text-4xl leading-[1.05] font-semibold text-parchment sm:text-5xl">
            Ambil kursi di <span className="italic text-gold">bahtera</span>
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-mist">
            Isi formulir di bawah untuk menyiapkan rincian infaq, lalu selesaikan pendaftaran resmi
            dan konfirmasi ke panitia. Data tersimpan di perangkatmu.
          </p>
        </Reveal>

        {/* tickets */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <Reveal>
            <TicketCard
              active={activeTicket === "early"}
              disabled={!earlyOpen}
              onClick={() => {
                setTicket("early");
                ambience.blip(680, 0.1);
              }}
              badge="Hemat 15K"
              title="Early Bird"
              price={EVENT.earlyPrice}
              note={`Hanya untuk ${EVENT.earlyQuota} pendaftar pertama`}
              remaining={remaining}
              quota={EVENT.earlyQuota}
              taken={EVENT.earlyTakenSeed + usedEarly}
            />
          </Reveal>
          <Reveal delay={80}>
            <TicketCard
              active={activeTicket === "normal"}
              onClick={() => {
                setTicket("normal");
                ambience.blip(560, 0.1);
              }}
              title="HTM Normal"
              price={EVENT.normalPrice}
              note="Berlaku setelah kuota Early Bird habis"
            />
          </Reveal>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          {/* ---------- form ---------- */}
          <Reveal>
            <form
              id="form-daftar"
              onSubmit={submit}
              noValidate
              className="rounded-3xl border border-foam/20 bg-hull/55 p-5 backdrop-blur-sm sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-xl font-semibold text-parchment">
                  {editing ? "Ubah pendaftaran" : "Formulir peserta"}
                </h3>
                {editing && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(null);
                      setForm({ ...EMPTY });
                      setErrors({});
                    }}
                    className="flex items-center gap-1.5 rounded-full border border-mist/30 px-3 py-1.5 text-xs font-semibold text-mist hover:text-parchment"
                  >
                    <IconClose width={13} height={13} /> Batal ubah
                  </button>
                )}
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Field label="Nama lengkap anak" error={errors.child} className="sm:col-span-2">
                  <input
                    value={form.child}
                    onChange={(e) => setForm({ ...form, child: e.target.value })}
                    placeholder="cth. Aisyah Nur Rahmani"
                    className={inputCls(!!errors.child)}
                  />
                </Field>

                <Field label="Usia peserta" error={errors.age}>
                  <select
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    className={inputCls(!!errors.age)}
                  >
                    <option value="">Pilih usia…</option>
                    {[7, 8, 9, 10, 11, 12].map((a) => (
                      <option key={a} value={a}>
                        {a} tahun
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="Jumlah peserta" error={errors.qty}>
                  <div className="flex items-center gap-2">
                    <Stepper value={qty} onChange={setQty} max={activeTicket === "early" && !editing ? Math.max(1, remaining) : 5} />
                  </div>
                </Field>

                <Field label="Nama orang tua / wali" error={errors.parent}>
                  <input
                    value={form.parent}
                    onChange={(e) => setForm({ ...form, parent: e.target.value })}
                    placeholder="cth. Ummu Aisyah"
                    className={inputCls(!!errors.parent)}
                  />
                </Field>

                <Field label="Nomor WhatsApp" error={errors.phone}>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    inputMode="tel"
                    placeholder="081234567890"
                    className={inputCls(!!errors.phone)}
                  />
                </Field>

                <Field label="Catatan (alergi, kebutuhan khusus) — opsional" className="sm:col-span-2">
                  <textarea
                    value={form.note}
                    onChange={(e) => setForm({ ...form, note: e.target.value })}
                    rows={2}
                    placeholder="cth. alergi ayam, datang bersama kakak"
                    className={inputCls(false) + " resize-none"}
                  />
                </Field>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-2xl border border-amber/25 bg-amber/8 p-4">
                <div className="mr-auto">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-mist">
                    Total infaq HTM
                  </p>
                  <p className="font-display font-numeric text-3xl font-semibold text-gold">
                    {rupiah(total)}
                  </p>
                  <p className="text-xs text-mist">
                    {activeTicket === "early" ? "Early Bird" : "Normal"} · {qty} peserta ×{" "}
                    {rupiah(priceOf(activeTicket))}
                  </p>
                </div>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-full bg-gradient-to-r from-amber to-coral px-6 py-3.5 text-sm font-bold text-abyss transition hover:brightness-110 active:scale-95"
                >
                  <IconCheck width={18} height={18} />
                  {editing ? "Simpan perubahan" : "Catat pendaftaran"}
                </button>
              </div>

              <p className="mt-3 flex items-start gap-2 text-xs leading-relaxed text-mist">
                <IconInfo width={15} height={15} className="mt-0.5 shrink-0 text-foam" />
                Formulir ini menyiapkan rincian pembayaran. Pendaftaran resmi tetap melalui{" "}
                <a href={EVENT.register} target="_blank" rel="noreferrer" className="font-semibold text-foam underline underline-offset-2">
                  bit.ly/CONTOH-PENDAFTARAN
                </a>
                .
              </p>
            </form>
          </Reveal>

          {/* ---------- payment ---------- */}
          <Reveal delay={90}>
            <div className="lg:sticky lg:top-28 space-y-4">
              <div className="overflow-hidden rounded-3xl border border-foam/25 bg-gradient-to-br from-deep via-hull to-abyss p-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-foam">Infaq HTM</p>
                <p className="font-display mt-2 text-lg font-semibold text-parchment">
                  Bank {EVENT.bank}
                </p>
                <button
                  onClick={() => copy(EVENT.account, "acc", "Nomor rekening")}
                  className="group mt-2 flex w-full items-center justify-between gap-3 rounded-2xl border border-foam/25 bg-abyss/60 px-4 py-3.5 text-left transition hover:border-amber"
                >
                  <span className="font-numeric font-display text-2xl font-semibold tracking-wide text-gold sm:text-[26px]">
                    {EVENT.account}
                  </span>
                  <span className="shrink-0 text-mist transition group-hover:text-gold">
                    {copied === "acc" ? <IconCheck width={19} height={19} /> : <IconCopy width={19} height={19} />}
                  </span>
                </button>
                <p className="mt-2 text-sm text-mist">
                  a.n. <strong className="font-semibold text-parchment">{EVENT.accountName}</strong>
                </p>

                <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-coral/25 bg-coral/10 px-4 py-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-mist">
                      Nominal pilihanmu
                    </p>
                    <p className="font-numeric font-display text-xl font-semibold text-coral">{rupiah(total)}</p>
                  </div>
                  <button
                    onClick={() => copy(String(total), "amt", "Nominal")}
                    className="rounded-full border border-coral/40 p-2 text-coral transition hover:bg-coral hover:text-abyss"
                    aria-label="Salin nominal"
                  >
                    {copied === "amt" ? <IconCheck width={17} height={17} /> : <IconCopy width={17} height={17} />}
                  </button>
                </div>

                <a
                  href={`https://wa.me/${EVENT.cpPhone}?text=${encodeURIComponent(
                    `Assalamu'alaikum ${EVENT.cpName}, saya ingin konfirmasi pembayaran ${EVENT.edition}.`,
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex items-center justify-center gap-2 rounded-full bg-ok px-5 py-3 text-sm font-bold text-parchment transition hover:brightness-110 active:scale-95"
                >
                  <IconWhatsapp width={18} height={18} /> Konfirmasi ke {EVENT.cpName}
                </a>
              </div>

              <a
                href={EVENT.register}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl border border-foam/20 bg-hull/50 px-4 py-3.5 transition hover:border-foam/50 hover:bg-hull/80"
              >
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-foam/15 text-foam">
                  <IconLink width={19} height={19} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-parchment">Formulir resmi panitia</span>
                  <span className="block truncate text-xs text-mist">bit.ly/CONTOH-PENDAFTARAN</span>
                </span>
              </a>
            </div>
          </Reveal>
        </div>

        {/* ---------- my registrations ---------- */}
        <div className="mt-12">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h3 className="font-display text-2xl font-semibold text-parchment">
              Pendaftaran saya
              <span className="font-numeric ml-2 rounded-full bg-foam/15 px-2.5 py-0.5 align-middle text-sm text-foam">
                {regs.length}
              </span>
            </h3>
            {regs.length > 0 && (
              <p className="text-sm text-mist">
                Total infaq{" "}
                <strong className="font-numeric text-gold">
                  {rupiah(regs.reduce((s, r) => s + priceOf(r.ticket) * r.qty, 0))}
                </strong>
              </p>
            )}
          </div>

          {regs.length === 0 ? (
            <div className="mt-4 flex flex-col items-center gap-3 rounded-3xl border border-dashed border-foam/25 bg-hull/30 px-6 py-14 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-foam/10 text-foam">
                <IconUsers width={26} height={26} />
              </span>
              <p className="font-display text-lg font-semibold text-parchment">Belum ada pendaftaran</p>
              <p className="max-w-sm text-sm text-mist">
                Isi formulir di atas untuk menyiapkan rincian infaq. Semua data tersimpan aman di
                perangkat ini dan bisa diubah atau dibatalkan kapan saja.
              </p>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {regs.map((r) => {
                const open = openRow === r.id;
                return (
                  <li
                    key={r.id}
                    className="anim-pop overflow-hidden rounded-2xl border border-foam/18 bg-hull/45"
                  >
                    <div className="flex flex-wrap items-center gap-3 p-4">
                      <span
                        className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl text-sm font-bold ${
                          r.paid ? "bg-ok/20 text-ok" : "bg-warn/18 text-warn"
                        }`}
                      >
                        {r.paid ? <IconCheck width={20} height={20} /> : <IconWarn width={19} height={19} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2">
                          <span className="font-display text-base font-semibold text-parchment">{r.child}</span>
                          <span className="rounded-full bg-foam/12 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-foam">
                            {r.ticket === "early" ? "Early Bird" : "Normal"} ×{r.qty}
                          </span>
                        </p>
                        <p className="font-numeric text-xs text-mist">
                          {r.code} · {r.age} tahun · {r.paid ? "Menunggu verifikasi panitia" : "Menunggu pembayaran"}
                        </p>
                      </div>
                      <span className="font-numeric font-display text-lg font-semibold text-gold">
                        {rupiah(priceOf(r.ticket) * r.qty)}
                      </span>
                      <button
                        onClick={() => setOpenRow(open ? null : r.id)}
                        aria-expanded={open}
                        className="rounded-full border border-foam/25 px-3 py-1.5 text-xs font-semibold text-mist transition hover:border-foam hover:text-parchment"
                      >
                        {open ? "Tutup" : "Rincian"}
                      </button>
                    </div>

                    {open && (
                      <div className="anim-pop border-t border-foam/15 bg-abyss/40 p-4">
                        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                          <Row k="Orang tua / wali" v={r.parent} />
                          <Row k="WhatsApp" v={r.phone} />
                          <Row k="Tanggal acara" v={`${EVENT.dateLabel} · ${EVENT.timeLabel}`} />
                          <Row k="Tempat" v={EVENT.venue} />
                          {r.note && <Row k="Catatan" v={r.note} className="sm:col-span-2" />}
                        </dl>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => togglePaid(r)}
                            className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition active:scale-95 ${
                              r.paid
                                ? "border border-mist/30 text-mist hover:text-parchment"
                                : "bg-ok text-parchment hover:brightness-110"
                            }`}
                          >
                            <IconCheck width={15} height={15} />
                            {r.paid ? "Tandai belum transfer" : "Tandai sudah transfer"}
                          </button>
                          <a
                            href={`https://wa.me/${EVENT.cpPhone}?text=${waText(r)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 rounded-full border border-ok/50 px-4 py-2 text-xs font-bold text-ok transition hover:bg-ok/15"
                          >
                            <IconWhatsapp width={15} height={15} /> Kirim bukti transfer
                          </a>
                          <button
                            onClick={() => copy(summaryText(r), `sum-${r.id}`, "Rincian pendaftaran")}
                            className="flex items-center gap-2 rounded-full border border-foam/30 px-4 py-2 text-xs font-bold text-foam transition hover:bg-foam/12"
                          >
                            {copied === `sum-${r.id}` ? <IconCheck width={15} height={15} /> : <IconCopy width={15} height={15} />}
                            Salin rincian
                          </button>
                          <button
                            onClick={() => startEdit(r)}
                            className="flex items-center gap-2 rounded-full border border-amber/40 px-4 py-2 text-xs font-bold text-gold transition hover:bg-amber/12"
                          >
                            <IconSparkle width={15} height={15} /> Ubah
                          </button>
                          <button
                            onClick={() => remove(r)}
                            className="ml-auto flex items-center gap-2 rounded-full border border-bad/40 px-4 py-2 text-xs font-bold text-bad transition hover:bg-bad hover:text-parchment"
                          >
                            <IconTrash width={15} height={15} /> Batalkan
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

const inputCls = (bad: boolean) =>
  `w-full rounded-xl border bg-abyss/55 px-3.5 py-2.5 text-sm text-parchment placeholder:text-mist/50 transition focus:outline-none ${
    bad ? "border-bad focus:border-bad" : "border-foam/20 focus:border-foam"
  }`;

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-[0.16em] text-mist">
        {label}
      </span>
      {children}
      {error && (
        <span className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-bad">
          <IconWarn width={13} height={13} /> {error}
        </span>
      )}
    </label>
  );
}

function Stepper({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (n: number) => void;
  max: number;
}) {
  const btn =
    "grid h-10 w-10 place-items-center rounded-xl border border-foam/25 text-lg font-bold text-parchment transition hover:border-amber hover:text-gold active:scale-90 disabled:opacity-35 disabled:hover:border-foam/25 disabled:hover:text-parchment";
  return (
    <div className="flex items-center gap-2">
      <button type="button" className={btn} onClick={() => onChange(Math.max(1, value - 1))} disabled={value <= 1} aria-label="Kurangi peserta">
        −
      </button>
      <span className="font-numeric font-display w-12 rounded-xl border border-foam/20 bg-abyss/55 py-2 text-center text-lg font-semibold text-gold">
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max} aria-label="Tambah peserta">
        +
      </button>
    </div>
  );
}

function Row({ k, v, className = "" }: { k: string; v: string; className?: string }) {
  return (
    <div className={className}>
      <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-mist">{k}</dt>
      <dd className="text-parchment">{v}</dd>
    </div>
  );
}

function TicketCard({
  active,
  disabled,
  onClick,
  title,
  price,
  note,
  badge,
  remaining,
  quota,
  taken,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  price: number;
  note: string;
  badge?: string;
  remaining?: number;
  quota?: number;
  taken?: number;
}) {
  const pct = quota ? Math.min(100, ((taken ?? 0) / quota) * 100) : 0;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={`relative w-full overflow-hidden rounded-3xl border-2 p-5 text-left transition-all duration-300 ${
        active
          ? "border-amber bg-gradient-to-br from-amber/18 to-coral/10 shadow-[0_18px_44px_-24px_rgba(242,166,59,0.9)]"
          : "border-foam/18 bg-hull/40 hover:border-foam/45"
      } ${disabled ? "cursor-not-allowed opacity-55" : "active:scale-[0.99]"}`}
    >
      <span className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber/10 blur-2xl" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2">
            <span className="font-display text-xl font-semibold text-parchment">{title}</span>
            {badge && !disabled && (
              <span className="rounded-full bg-coral px-2 py-0.5 text-[10px] font-bold text-abyss">{badge}</span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-mist">{note}</p>
        </div>
        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 transition ${
            active ? "border-amber bg-amber text-abyss" : "border-mist/40"
          }`}
        >
          {active && <IconCheck width={13} height={13} strokeWidth={3} />}
        </span>
      </div>
      <p className="font-display font-numeric mt-3 text-4xl font-semibold text-gold">
        {rupiah(price)}
        <span className="ml-1 text-sm font-normal text-mist">/ anak</span>
      </p>
      {quota !== undefined && (
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className={disabled ? "text-bad" : "text-foam"}>
              {disabled ? "Kuota Early Bird habis" : `Sisa ${remaining} dari ${quota} kursi`}
            </span>
            <span className="font-numeric text-mist">{taken}/{quota} terisi</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-abyss/70">
            <div
              className="h-full rounded-full bg-gradient-to-r from-foam via-amber to-coral transition-[width] duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}
    </button>
  );
}
