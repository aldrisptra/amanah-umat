/**
 * Judul dan keterangan halaman untuk mesin pencari.
 *
 * Sebelumnya seluruh halaman memakai judul yang sama dari index.html, sehingga
 * di mata Google halaman Program, Galeri, dan Prestasi terlihat seperti satu
 * halaman yang sama. Berkas ini memberi tiap halaman judul dan keterangannya
 * sendiri.
 *
 * CATATAN JUJUR soal batasnya:
 * Website ini merakit isinya dengan JavaScript, jadi tag di sini baru terpasang
 * setelah halaman berjalan. Google menjalankan JavaScript sehingga tetap
 * terbaca. Namun perayap pratinjau tautan (WhatsApp, Facebook) TIDAK
 * menjalankannya - mereka hanya membaca index.html. Karena itu index.html tetap
 * memuat judul dan gambar pratinjau bawaan yang mewakili website secara umum.
 */

const NAMA_SITUS = "LKSA Amanah Ummat Balikpapan";

// Gambar pratinjau saat tautan dibagikan. Simpan berkasnya di public/.
// Bila belum ada, tautan tetap terbagi - hanya tanpa gambar.
const GAMBAR_BAWAAN = "/og-image.jpg";

/** Alamat penuh halaman saat ini, dipakai untuk canonical dan og:url. */
const alamatPenuh = (path = "/") => {
  if (typeof window === "undefined") return "";

  return `${window.location.origin}${path}`;
};

const setMeta = (kunci, nilai, pakaiProperty = false) => {
  if (typeof document === "undefined") return;

  const atribut = pakaiProperty ? "property" : "name";

  let tag = document.querySelector(`meta[${atribut}="${kunci}"]`);

  if (!nilai) {
    tag?.remove();
    return;
  }

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(atribut, kunci);
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", nilai);
};

const setCanonical = (url) => {
  if (typeof document === "undefined") return;

  let tag = document.querySelector('link[rel="canonical"]');

  if (!url) {
    tag?.remove();
    return;
  }

  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", "canonical");
    document.head.appendChild(tag);
  }

  tag.setAttribute("href", url);
};

/**
 * Pasang judul dan keterangan satu halaman.
 *
 * @param {object} opsi
 * @param {string} [opsi.title]       Judul halaman, tanpa nama yayasan
 * @param {string} [opsi.description] Satu sampai dua kalimat, 150-160 huruf
 * @param {string} [opsi.path]        Alamat halaman, mis. "/program"
 * @param {boolean} [opsi.noindex]    Larang halaman ini masuk hasil pencarian
 */
export const terapkanMetaHalaman = ({
  title = "",
  description = "",
  path = "/",
  noindex = false,
} = {}) => {
  if (typeof document === "undefined") return;

  const judulPenuh = title ? `${title} | ${NAMA_SITUS}` : NAMA_SITUS;

  document.title = judulPenuh;

  setMeta("description", description);

  // Halaman panel admin tidak boleh masuk hasil pencarian. Alamat kanonik
  // pun tidak dipasang, supaya tidak ada yang mengundang perayap ke sana.
  if (noindex) {
    setMeta("robots", "noindex, nofollow");
    setCanonical("");

    return;
  }

  setMeta("robots", "");

  const url = alamatPenuh(path);

  setCanonical(url);

  setMeta("og:title", judulPenuh, true);
  setMeta("og:description", description, true);
  setMeta("og:url", url, true);
  setMeta("og:image", alamatPenuh(GAMBAR_BAWAAN), true);

  setMeta("twitter:title", judulPenuh);
  setMeta("twitter:description", description);
  setMeta("twitter:image", alamatPenuh(GAMBAR_BAWAAN));
};
