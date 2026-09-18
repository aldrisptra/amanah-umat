/**
 * Ikon tab browser (favicon) yang mengikuti identitas website.
 *
 * Berkas `public/favicon.svg` bersifat statis dan sudah tampil sebelum
 * JavaScript berjalan. Modul ini menggantinya setelah identitas dari CMS
 * termuat, sehingga:
 *
 *   - logo yang diunggah admin ikut menjadi ikon tab, dan
 *   - bila logo belum ada, ikon dibuat dari huruf awal nama yayasan —
 *     sama seperti logo cadangan di navbar.
 */

const WARNA_LATAR = "#059669"; // emerald-600, sama dengan logo cadangan

const escapeXml = (teks) =>
  String(teks)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

/**
 * Buat ikon kotak hijau berisi satu huruf, sebagai gambar SVG tertanam.
 */
const buatIkonHuruf = (huruf) => {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
    `<rect width="64" height="64" rx="15" fill="${WARNA_LATAR}"/>`,
    '<text x="32" y="32" text-anchor="middle" dominant-baseline="central"',
    ' font-family="system-ui,-apple-system,Segoe UI,Roboto,sans-serif"',
    ' font-size="38" font-weight="700" fill="#ffffff">',
    escapeXml(huruf),
    "</text></svg>",
  ].join("");

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

/**
 * Pasang ikon baru.
 *
 * Elemen <link> lama dihapus lalu dibuat ulang, bukan sekadar diubah
 * alamatnya: sebagian browser mengabaikan perubahan href pada elemen yang
 * sudah ada dan tetap menampilkan ikon lama.
 */
const pasangLink = (rel, href) => {
  document
    .querySelectorAll(`link[rel="${rel}"]`)
    .forEach((el) => el.remove());

  const link = document.createElement("link");

  link.rel = rel;
  link.href = href;

  document.head.appendChild(link);
};

/**
 * @param {{ site_name?: string, logo_url?: string }} identitas
 */
export const terapkanFavicon = (identitas) => {
  // Fungsi ini juga termuat pada lingkungan tanpa browser (uji render),
  // di sana tidak ada document sama sekali.
  if (typeof document === "undefined") return;

  const logo = identitas?.logo_url;

  const href = logo
    ? logo
    : buatIkonHuruf(
        (identitas?.site_name || "A").trim().charAt(0).toUpperCase() || "A",
      );

  try {
    pasangLink("icon", href);

    // Dipakai saat website disimpan ke layar utama ponsel
    pasangLink("apple-touch-icon", href);
  } catch (error) {
    // Ikon tab bukan hal yang boleh menghentikan website
    console.error("Gagal memasang ikon tab:", error);
  }
};
