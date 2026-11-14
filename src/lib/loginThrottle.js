/**
 * Pembatas percobaan login.
 *
 * Setelah beberapa kali salah password, halaman login dikunci sementara.
 * Tujuannya menahan tebakan password beruntun (brute force) dan memberi jeda
 * yang jelas bagi pengurus yang memang lupa passwordnya.
 *
 * CATATAN PENTING soal batasnya:
 * Hitungan ini tersimpan di browser, jadi ia menahan orang yang menebak lewat
 * halaman ini - bukan penyerang yang memanggil server Supabase langsung.
 * Lapisan itu tetap ditangani Supabase di sisi server. Anggap berkas ini
 * sebagai rem pertama, bukan satu-satunya pengaman.
 */

const KUNCI_PENYIMPANAN = "amanahummat.percobaan-login";

// Lebih dari lima kegagalan: kegagalan keenam memulai jeda.
export const MAKS_PERCOBAAN = 6;
export const MENIT_TERKUNCI = 15;

const KOSONG = { gagal: 0, terkunciSampai: 0 };
let cadangan = { ...KOSONG };

// localStorage bisa dilarang browser (mode penyamaran, cookie diblokir).
// Bila itu terjadi, login harus tetap bisa dipakai - jadi kegagalannya
// diabaikan, bukan dilempar ke pengguna.
const tulis = (data) => {
  cadangan = { ...data };
  try {
    localStorage.setItem(KUNCI_PENYIMPANAN, JSON.stringify(data));
  } catch {
    // Tetap batasi percobaan selama halaman terbuka bila storage ditolak.
  }
};

const baca = () => {
  let data = cadangan;
  try {
    const isi = localStorage.getItem(KUNCI_PENYIMPANAN);
    data = isi ? JSON.parse(isi) : KOSONG;
  } catch {
    // Gunakan salinan memori bila penyimpanan browser tidak tersedia.
  }
  const hasil = {
    gagal: Number.isSafeInteger(data?.gagal) && data.gagal > 0 ? data.gagal : 0,
    terkunciSampai: Number.isFinite(data?.terkunciSampai) && data.terkunciSampai > 0 ? data.terkunciSampai : 0,
  };
  if (hasil.terkunciSampai && hasil.terkunciSampai <= Date.now()) {
    tulis(KOSONG);
    return { ...KOSONG };
  }
  return hasil;
};

/** Sisa detik sampai kuncian berakhir. 0 berarti tidak sedang terkunci. */
export const sisaDetikTerkunci = () => {
  const { terkunciSampai } = baca();
  const sisa = terkunciSampai - Date.now();

  return sisa > 0 ? Math.ceil(sisa / 1000) : 0;
};

/** Berapa kali percobaan yang masih tersisa sebelum terkunci. */
export const sisaPercobaan = () => {
  const { gagal } = baca();

  return Math.max(0, MAKS_PERCOBAAN - gagal);
};

/**
 * Catat satu percobaan yang gagal.
 * @returns {{terkunci: boolean, sisa: number}}
 */
export const catatGagal = () => {
  const data = baca();
  // Permintaan dari tab lain yang selesai belakangan tidak memperpanjang jeda.
  if (data.terkunciSampai > Date.now()) return { terkunci: true, sisa: 0 };
  const gagal = data.gagal + 1;

  if (gagal >= MAKS_PERCOBAAN) {
    tulis({ gagal, terkunciSampai: Date.now() + MENIT_TERKUNCI * 60 * 1000 });

    return { terkunci: true, sisa: 0 };
  }

  tulis({ gagal, terkunciSampai: 0 });

  return { terkunci: false, sisa: MAKS_PERCOBAAN - gagal };
};

/** Dipanggil setelah login berhasil, supaya hitungannya kembali bersih. */
export const resetPercobaan = () => {
  cadangan = { ...KOSONG };
  try {
    localStorage.removeItem(KUNCI_PENYIMPANAN);
  } catch {
    // Diabaikan dengan sengaja
  }
};

/** Ubah sisa detik menjadi teks yang enak dibaca, mis. "14 menit 20 detik". */
export const formatSisaWaktu = (detik) => {
  if (detik <= 0) return "";

  const menit = Math.floor(detik / 60);
  const sisaDetik = detik % 60;

  if (menit === 0) return `${sisaDetik} detik`;
  if (sisaDetik === 0) return `${menit} menit`;

  return `${menit} menit ${sisaDetik} detik`;
};
