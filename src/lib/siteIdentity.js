import { computed, ref } from "vue";
import { supabase } from "./supabase";

/**
 * Identitas website: logo dan nama yayasan.
 *
 * Dipakai di banyak tempat sekaligus (Navbar pada setiap halaman, Footer pada
 * setiap halaman, dan menu samping panel admin). Karena itu datanya diambil
 * SEKALI lalu dibagikan, bukan diminta ulang oleh masing-masing komponen.
 */

export const IDENTITAS_BAWAAN = {
  site_name: "Amanah Ummat",
  logo_url: "",
};

const identitas = ref({ ...IDENTITAS_BAWAAN });
const siap = ref(false);

// Menandai tabel site_settings belum dibuat di Supabase. Website tetap
// berjalan dengan nilai bawaan; panel admin memakai penanda ini untuk
// menampilkan petunjuk cara membuatnya.
export const tabelBelumDibuat = ref(false);

let permintaanBerjalan = null;

// Ikon tab browser SENGAJA tidak mengikuti logo di sini. Ikon itu diambil
// dari berkas tetap di public/ (favicon.ico, icon-192.png) yang sudah
// berbentuk persegi dan berukuran tepat. Google hanya menerima favicon
// persegi, dan ia membaca halaman SETELAH JavaScript berjalan - jadi mengganti
// ikon di sini justru membuat Google menolaknya dan menampilkan bola dunia.

const tabelTidakDitemukan = (error) =>
  // PostgREST memakai PGRST205, PostgreSQL memakai 42P01
  error?.code === "PGRST205" ||
  error?.code === "42P01" ||
  /site_settings/i.test(error?.message || "");

/**
 * Ambil identitas dari Supabase. Aman dipanggil berkali-kali: permintaan yang
 * sedang berjalan akan dipakai bersama, dan hasil yang sudah ada tidak diambil
 * ulang kecuali diminta secara tegas.
 */
export const muatIdentitas = async ({ paksa = false } = {}) => {
  if (!paksa) {
    if (permintaanBerjalan) return permintaanBerjalan;
    if (siap.value) return identitas.value;
  }

  permintaanBerjalan = (async () => {
    const { data, error } = await supabase
      .from("site_settings")
      .select("site_name, logo_url")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      tabelBelumDibuat.value = tabelTidakDitemukan(error);

      if (!tabelBelumDibuat.value) {
        console.error("Gagal mengambil identitas website:", error);
      }

      // Website tetap tampil memakai nilai bawaan
      siap.value = true;
      return identitas.value;
    }

    tabelBelumDibuat.value = false;

    const record = data?.[0] || null;

    identitas.value = {
      site_name: record?.site_name?.trim() || IDENTITAS_BAWAAN.site_name,
      logo_url: record?.logo_url || "",
    };

    siap.value = true;

    return identitas.value;
  })();

  try {
    return await permintaanBerjalan;
  } finally {
    permintaanBerjalan = null;
  }
};

/**
 * Perbarui nilai yang dibagikan tanpa menunggu permintaan baru, dipakai panel
 * admin tepat setelah menyimpan agar logo di menu samping langsung berubah.
 */
export const terapkanIdentitas = (nilai) => {
  identitas.value = {
    site_name: nilai?.site_name?.trim() || IDENTITAS_BAWAAN.site_name,
    logo_url: nilai?.logo_url || "",
  };

  siap.value = true;
};

/**
 * Dipakai komponen tampilan. Pemanggilan pertama memicu pengambilan data.
 */
export const useSiteIdentity = () => {
  muatIdentitas();

  return {
    identitas,
    siap,

    // Huruf awal nama, dipakai sebagai logo cadangan bila belum ada gambar
    inisial: computed(
      () => identitas.value.site_name.trim().charAt(0).toUpperCase() || "A",
    ),
  };
};
