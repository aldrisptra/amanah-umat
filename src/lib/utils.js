/* =========================================================
   HELPER BERSAMA
   Dipakai oleh halaman publik maupun panel admin.
========================================================= */

/**
 * Ubah nomor telepon Indonesia menjadi format internasional untuk wa.me.
 * wa.me menolak nomor yang diawali "0" atau mengandung spasi/tanda hubung,
 * jadi "0813-4781-7612" harus menjadi "6281347817612".
 *
 * @param {string} nomor
 * @returns {string} nomor siap pakai, atau "" bila tidak valid
 */
export const normalizeWhatsapp = (nomor) => {
  if (!nomor) return "";

  // Buang semua karakter selain angka dan tanda "+"
  let bersih = String(nomor).replace(/[^\d+]/g, "");

  if (bersih.startsWith("+")) {
    bersih = bersih.slice(1);
  }

  if (bersih.startsWith("0")) {
    bersih = `62${bersih.slice(1)}`;
  } else if (bersih.startsWith("8")) {
    bersih = `62${bersih}`;
  }

  // Nomor Indonesia yang wajar minimal 10 digit setelah kode negara
  if (bersih.length < 10) return "";

  return bersih;
};

/**
 * Bangun tautan WhatsApp lengkap. Mengembalikan "" bila nomor tidak valid,
 * sehingga tombol bisa disembunyikan alih-alih menampilkan tautan rusak.
 *
 * @param {string} nomor
 * @param {string} [pesan] teks pesan otomatis
 */
export const buildWhatsappUrl = (nomor, pesan = "") => {
  const tujuan = normalizeWhatsapp(nomor);

  if (!tujuan) return "";

  const url = `https://wa.me/${tujuan}`;

  return pesan ? `${url}?text=${encodeURIComponent(pesan)}` : url;
};

/* =========================================================
   VALIDASI FOTO
========================================================= */

export const MAX_IMAGE_SIZE_MB = 5;

const TIPE_GAMBAR_DIIZINKAN = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

/**
 * Periksa file yang dipilih admin sebelum diunggah.
 *
 * @param {File} file
 * @returns {string} pesan error, atau "" bila file valid
 */
export const validateImageFile = (file) => {
  if (!file) return "Silakan pilih file foto terlebih dahulu.";

  if (!file.type.startsWith("image/")) {
    return "File yang dipilih harus berupa gambar.";
  }

  if (!TIPE_GAMBAR_DIIZINKAN.includes(file.type)) {
    return "Format foto harus JPG, JPEG, PNG, atau WebP.";
  }

  if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
    return `Ukuran foto maksimal ${MAX_IMAGE_SIZE_MB} MB. Silakan perkecil ukuran foto terlebih dahulu.`;
  }

  return "";
};

/**
 * Nama file unik agar unggahan tidak saling menimpa di Supabase Storage.
 */
export const buildStorageFileName = (file, prefix = "") => {
  const ekstensi = (file.name.split(".").pop() || "png").toLowerCase();
  const acak = Math.random().toString(36).slice(2, 10);

  return `${prefix}${Date.now()}-${acak}.${ekstensi}`;
};

/* =========================================================
   MEDIA SOSIAL

   Pengurus tidak perlu tahu bentuk tautan yang benar. Isian boleh berupa
   tautan penuh, "@namaakun", atau "namaakun" saja - semuanya diubah menjadi
   tautan yang bisa dibuka.
========================================================= */

const POLA_TAUTAN = /^https?:\/\//i;
const POLA_WWW = /^www\./i;

const bersihkanNamaAkun = (nilai) =>
  String(nilai || "")
    .trim()
    .replace(/^@/, "")
    .replace(/\/+$/, "");

/**
 * Bangun tautan media sosial yang siap dibuka.
 *
 * @param {"instagram"|"youtube"} jenis
 * @param {string} nilai isian dari panel admin
 * @returns {string} tautan lengkap, atau "" bila isian kosong
 */
export const buildSocialUrl = (jenis, nilai) => {
  const isi = String(nilai || "").trim();

  if (!isi) return "";

  // Sudah berupa tautan - pakai apa adanya supaya tautan kanal YouTube
  // berbentuk /channel/UCxxxx tidak ikut diubah menjadi /@UCxxxx.
  if (POLA_TAUTAN.test(isi)) return isi;
  if (POLA_WWW.test(isi)) return `https://${isi}`;

  const akun = bersihkanNamaAkun(isi);

  if (!akun) return "";

  return jenis === "youtube"
    ? `https://www.youtube.com/@${akun}`
    : `https://www.instagram.com/${akun}`;
};

/**
 * Teks pendek untuk ditampilkan di website, mis. "@amanahummat".
 * Dipakai supaya pengunjung melihat nama akun, bukan tautan panjang.
 */
export const socialLabel = (nilai) => {
  const isi = String(nilai || "").trim();

  if (!isi) return "";

  if (POLA_TAUTAN.test(isi) || POLA_WWW.test(isi)) {
    const potongan = isi.replace(/\/+$/, "").split("/");

    return `@${bersihkanNamaAkun(potongan[potongan.length - 1])}`;
  }

  return `@${bersihkanNamaAkun(isi)}`;
};
