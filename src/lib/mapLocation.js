/**
 * Titik lokasi yayasan di peta.
 *
 * Pengurus panti tidak bisa diminta mengetik koordinat seperti
 * "-1.23502671833616". Yang bisa mereka lakukan adalah membuka Google Maps,
 * mencari lokasinya, lalu menyalin tautannya. Modul ini menerjemahkan tautan
 * itu menjadi koordinat.
 */

// Batas wajar wilayah Indonesia. Dipakai untuk memperingatkan kesalahan yang
// paling sering terjadi: lintang dan bujur tertukar. Koordinat Balikpapan
// (-1.23, 116.81) bila tertukar menjadi (116.81, -1.23) yang bahkan bukan
// lintang yang sah.
const BATAS_INDONESIA = {
  latMin: -11.5,
  latMax: 6.5,
  lngMin: 94.5,
  lngMax: 141.5,
};

const angkaValid = (nilai) => typeof nilai === "number" && Number.isFinite(nilai);

export const koordinatValid = (lat, lng) =>
  angkaValid(lat) &&
  angkaValid(lng) &&
  lat >= -90 &&
  lat <= 90 &&
  lng >= -180 &&
  lng <= 180;

export const diIndonesia = (lat, lng) =>
  lat >= BATAS_INDONESIA.latMin &&
  lat <= BATAS_INDONESIA.latMax &&
  lng >= BATAS_INDONESIA.lngMin &&
  lng <= BATAS_INDONESIA.lngMax;

/**
 * Tautan pendek Google Maps (maps.app.goo.gl / goo.gl/maps) tidak dapat
 * dibuka dari browser karena aturan keamanan lintas-domain (CORS). Tautan
 * seperti itu harus dibuka dulu oleh pengurus, baru alamat lengkapnya
 * disalin dari kolom alamat browser.
 */
export const tautanPendek = (teks) =>
  /(?:maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(String(teks || ""));

/**
 * Ambil koordinat dari tautan Google Maps, atau dari koordinat yang
 * ditempel langsung.
 *
 * @param {string} teks
 * @returns {{ lat: number, lng: number } | null}
 */
export const bacaKoordinat = (teks) => {
  const isi = String(teks || "").trim();

  if (!isi) return null;

  // Urutan pemeriksaan penting. Pola "!3d...!4d..." menyimpan titik tempat
  // yang sebenarnya, sedangkan "@..." hanya menyimpan titik tengah layar
  // saat tautan dibuat - keduanya bisa berbeda beberapa puluh meter.
  const pola = [
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&](?:q|query|ll|center|destination|daddr)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/i,
    /^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/,
  ];

  for (const aturan of pola) {
    const cocok = isi.match(aturan);

    if (!cocok) continue;

    const lat = Number.parseFloat(cocok[1]);
    const lng = Number.parseFloat(cocok[2]);

    if (koordinatValid(lat, lng)) {
      return { lat, lng };
    }
  }

  return null;
};

/**
 * Bulatkan koordinat ke 6 angka di belakang koma (ketelitian sekitar 0,1 m).
 * Lebih dari itu hanya memperpanjang angka tanpa menambah ketelitian nyata.
 */
export const bulatkanKoordinat = (nilai) =>
  Math.round(Number(nilai) * 1e6) / 1e6;

/**
 * Alamat peta yang disematkan di halaman. Memakai bentuk `output=embed`
 * yang tidak memerlukan kunci API Google, sehingga tidak ada biaya dan
 * tidak ada kunci yang perlu dijaga.
 */
export const buatEmbedPeta = (lat, lng, zoom = 17) => {
  if (!koordinatValid(lat, lng)) return "";

  return `https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&hl=id&output=embed`;
};

/**
 * Alamat untuk dibuka di aplikasi Google Maps (tombol "Lihat rute").
 */
export const buatTautanPeta = (lat, lng) => {
  if (!koordinatValid(lat, lng)) return "";

  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
};
