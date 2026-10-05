/**
 * Unit lembaga di bawah Amanah Ummat.
 *
 * Amanah Ummat menaungi dua unit yang berbagi satu lokasi tetapi
 * menjalankan program yang berbeda: LKSA (pengasuhan anak) dan TPQ
 * (pendidikan Al-Qur'an). Sebagian anak mengikuti keduanya, sebagian
 * hanya salah satunya.
 *
 * Daftar unit disimpan di tabel `units`, bukan ditulis di dalam kode,
 * karena nama resminya masih dikonfirmasi ke pihak yayasan dan dapat
 * berubah tanpa perlu mengubah program.
 *
 * Selama tabel `units` belum dibuat (lihat supabase/unit_lembaga.sql),
 * seluruh fitur unit cukup tidak ditampilkan - halaman tetap utuh dan
 * tidak memunculkan pesan galat.
 */
import { supabase } from "./supabase";

// Penanda untuk program atau foto yang berlaku pada SEMUA unit.
// Sengaja bukan baris di tabel units, karena ini bukan unit tersendiri
// dan tidak boleh ikut tampil pada bagian "Unit Kami".
export const UNIT_KEDUANYA = "keduanya";

export const tabelUnitBelumAda = (error) =>
  error?.code === "PGRST205" || error?.code === "42P01";

/**
 * Ambil daftar unit.
 *
 * @returns {Promise<Array>} daftar unit, atau array kosong bila tabelnya
 *   belum dibuat
 */
export const getUnits = async () => {
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) {
    if (!tabelUnitBelumAda(error)) {
      console.error("Gagal mengambil unit:", error);
    }

    return [];
  }

  return data || [];
};

/**
 * Label pendek untuk ditempel pada kartu program atau foto.
 *
 * @param {Array} units daftar unit dari getUnits()
 * @param {string|null} slug isi kolom unit pada program/foto
 * @returns {string} label siap tampil, atau "" bila tidak perlu ditampilkan
 */
export const labelUnit = (units, slug) => {
  if (!slug || !units.length) return "";

  // Program yang berlaku di semua unit ditulis gabungan, mis. "LKSA & TPQ",
  // supaya pengunjung tidak perlu menebak arti kata "keduanya".
  if (slug === UNIT_KEDUANYA) {
    return units.map((unit) => unit.short_name).join(" & ");
  }

  return units.find((unit) => unit.slug === slug)?.short_name || "";
};

/**
 * Apakah satu program/foto termasuk dalam unit yang sedang dipilih.
 */
export const cocokUnit = (nilai, slugDipilih) =>
  nilai === slugDipilih || nilai === UNIT_KEDUANYA;

/**
 * Pilihan untuk dropdown di panel admin.
 *
 * Pilihan "keduanya" baru masuk akal bila ada lebih dari satu unit.
 */
export const pilihanUnit = (units) => {
  const daftar = units.map((unit) => ({
    value: unit.slug,
    label: unit.short_name,
  }));

  if (units.length > 1) {
    daftar.push({
      value: UNIT_KEDUANYA,
      label: units.map((unit) => unit.short_name).join(" & "),
    });
  }

  return daftar;
};
