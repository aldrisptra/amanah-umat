/**
 * Teks halaman Program (/program dan /program/<unit>).
 *
 * Disimpan di tabel `program_page` (lihat supabase/program_units.sql) supaya
 * pengurus bisa mengubahnya dari panel admin. Selama tabel itu belum dibuat,
 * website memakai teks bawaan di bawah - halaman tetap utuh dan tidak
 * memunculkan pesan galat.
 */
import { supabase } from "./supabase";
import { tabelUnitBelumAda } from "./units";

export const PROGRAM_PAGE_BAWAAN = {
  eyebrow: "Program Kami",
  title: "Kegiatan untuk tumbuh dan berkembang bersama.",
  description:
    "Amanah Ummat menaungi dua unit dengan program masing-masing. Pilih unit untuk melihat kegiatannya.",
  cta_title: "Dukung kegiatan anak-anak Amanah Ummat.",
  cta_description:
    "Dukungan dari Anda dapat membantu keberlangsungan berbagai kegiatan dan kebutuhan anak-anak di Amanah Ummat.",
};

/**
 * Ambil teks halaman Program.
 *
 * @returns {Promise<{data: object|null, belumAda: boolean}>} `data` adalah
 *   baris tersimpan (atau null), `belumAda` bernilai true bila tabelnya belum
 *   dibuat
 */
export const getProgramPage = async () => {
  const { data, error } = await supabase
    .from("program_page")
    .select("*")
    .order("id", { ascending: true })
    .limit(1);

  if (error) {
    if (!tabelUnitBelumAda(error)) {
      console.error("Gagal mengambil teks halaman program:", error);
    }

    return { data: null, belumAda: tabelUnitBelumAda(error) };
  }

  return { data: data?.[0] || null, belumAda: false };
};

/**
 * Gabungkan isi tersimpan dengan teks bawaan. Isian yang dikosongkan
 * pengurus diganti teks bawaan, supaya halaman tidak pernah tampil kosong.
 */
export const isiProgramPage = (data) => {
  const hasil = { ...PROGRAM_PAGE_BAWAAN };

  for (const kunci of Object.keys(hasil)) {
    if (data?.[kunci]?.trim()) hasil[kunci] = data[kunci];
  }

  return hasil;
};
