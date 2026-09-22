/**
 * Memperkecil foto di browser sebelum diunggah.
 *
 * Foto dari kamera HP umumnya 3-5 MB dan berukuran 4000 piksel lebih,
 * padahal di website hanya tampil selebar 400-1600 piksel. Tanpa diperkecil,
 * pengunjung harus mengunduh puluhan megabyte hanya untuk membuka halaman
 * Galeri - itulah penyebab foto terasa lambat muncul.
 *
 * Hasilnya biasanya 85-95% lebih kecil tanpa beda yang terlihat mata.
 *
 * SENGAJA TIDAK DIPAKAI untuk logo dan kode QRIS: keduanya harus tetap tajam
 * sempurna. QRIS yang sedikit buram bisa gagal dipindai aplikasi bank.
 */

// Berkas foto yang disimpan berganti nama setiap kali diunggah, jadi aman
// disimpan di cache browser selama setahun penuh. Pengunjung yang kembali
// tidak perlu mengunduh ulang foto yang sama.
export const CACHE_FOTO = "31536000";

export const UKURAN = {
  // Foto biasa: kartu program, galeri, prestasi, tentang kami.
  // 1600 piksel cukup tajam untuk dibuka besar di layar laptop.
  standar: { sisiTerpanjang: 1600, kualitas: 0.82 },

  // Foto latar beranda memenuhi seluruh layar, jadi perlu lebih lebar.
  hero: { sisiTerpanjang: 2048, kualitas: 0.8 },
};

// Foto yang sudah sekecil ini tidak perlu diproses ulang
const BATAS_SUDAH_RINGAN = 350 * 1024;

// JPEG, bukan WebP. WebP sekitar 30% lebih ringan, tetapi penyimpanan
// Supabase bisa diatur hanya menerima jenis berkas tertentu - dan semua foto
// yang sudah tersimpan berjenis JPEG. Memilih JPEG menjamin unggahan
// pengurus tidak tiba-tiba ditolak.
//
// Bila pengaturan bucket "images" sudah dipastikan menerima image/webp
// (Supabase -> Storage -> images -> Edit bucket -> Allowed MIME types), cukup
// ganti dua nilai di bawah ini.
const FORMAT_HASIL = "image/jpeg";
const EKSTENSI_HASIL = "jpg";

const ubahEkstensi = (nama, ekstensiBaru) => {
  const titik = nama.lastIndexOf(".");
  const dasar = titik > 0 ? nama.slice(0, titik) : nama;

  return `${dasar}.${ekstensiBaru}`;
};

const bacaGambar = async (berkas) => {
  // imageOrientation wajib ditulis: foto potret dari HP menyimpan arah putar
  // di data EXIF. Tanpa ini, sebagian foto akan tersimpan dalam posisi miring.
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(berkas, { imageOrientation: "from-image" });
    } catch {
      // Jatuh ke cara lama di bawah
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(berkas);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Foto tidak dapat dibaca."));
    };

    img.src = url;
  });
};

const kanvasKeBlob = (kanvas, tipe, kualitas) =>
  new Promise((resolve) => kanvas.toBlob(resolve, tipe, kualitas));

/**
 * Perkecil satu foto.
 *
 * @param {File|Blob} berkas
 * @param {{sisiTerpanjang?: number, kualitas?: number, nama?: string}} [opsi]
 * @returns {Promise<File>} foto yang sudah diperkecil, atau berkas aslinya bila
 *   tidak ada gunanya diproses (sudah kecil, atau hasilnya justru lebih besar)
 */
export const compressImage = async (berkas, opsi = {}) => {
  const { sisiTerpanjang, kualitas } = { ...UKURAN.standar, ...opsi };
  const nama = opsi.nama || berkas.name || "foto.jpg";

  // GIF bisa bergerak; mengubahnya lewat kanvas akan membuatnya diam
  if (!berkas.type?.startsWith("image/") || berkas.type === "image/gif") {
    return berkas;
  }

  const gambar = await bacaGambar(berkas);

  const lebarAsli = gambar.width;
  const tinggiAsli = gambar.height;
  const skala = Math.min(1, sisiTerpanjang / Math.max(lebarAsli, tinggiAsli));

  // Sudah kecil dari sisi ukuran maupun berat: biarkan apa adanya
  if (skala === 1 && berkas.size <= BATAS_SUDAH_RINGAN) {
    gambar.close?.();
    return berkas;
  }

  const lebar = Math.round(lebarAsli * skala);
  const tinggi = Math.round(tinggiAsli * skala);

  const kanvas = document.createElement("canvas");
  kanvas.width = lebar;
  kanvas.height = tinggi;

  const ctx = kanvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  // JPEG tidak mengenal latar transparan: bagian bening pada PNG akan
  // berubah HITAM bila tidak diberi alas putih lebih dulu.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, lebar, tinggi);
  ctx.drawImage(gambar, 0, 0, lebar, tinggi);

  gambar.close?.();

  const blob = await kanvasKeBlob(kanvas, FORMAT_HASIL, kualitas);

  // Jaga-jaga: bila hasilnya tidak lebih kecil, pakai yang asli
  if (!blob || blob.size >= berkas.size) {
    return berkas;
  }

  return new File([blob], ubahEkstensi(nama, EKSTENSI_HASIL), {
    type: blob.type,
    lastModified: Date.now(),
  });
};
