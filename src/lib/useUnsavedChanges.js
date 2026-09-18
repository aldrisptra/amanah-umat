import { onBeforeUnmount, watch } from "vue";
import { onBeforeRouteLeave } from "vue-router";

/**
 * Cegah perubahan hilang tanpa disadari.
 *
 * Pengurus sering mengisi form lalu berpindah menu atau menutup tab tanpa
 * menekan Simpan. Tanpa penjaga ini, hasil ketikannya hilang begitu saja
 * tanpa peringatan apa pun.
 *
 * @param {import("vue").Ref<boolean>|import("vue").ComputedRef<boolean>} adaPerubahan
 */
export function useUnsavedChanges(adaPerubahan) {
  // Fungsi ini dipanggil saat setup komponen, yang juga dijalankan di
  // lingkungan tanpa browser (uji render / prarender). Di sana `window`
  // tidak ada, jadi bagian ini dilewati.
  const diBrowser = typeof window !== "undefined";

  // Peringatan bawaan browser saat tab ditutup / di-refresh
  const handleBeforeUnload = (event) => {
    if (!adaPerubahan.value) return;

    event.preventDefault();

    // Sebagian browser lama masih memerlukan nilai balik ini
    event.returnValue = "";
  };

  if (diBrowser) {
    watch(
      adaPerubahan,
      (aktif) => {
        if (aktif) {
          window.addEventListener("beforeunload", handleBeforeUnload);
        } else {
          window.removeEventListener("beforeunload", handleBeforeUnload);
        }
      },
      { immediate: true },
    );

    onBeforeUnmount(() => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    });
  }

  // Peringatan saat berpindah menu di dalam panel
  onBeforeRouteLeave(() => {
    if (!diBrowser || !adaPerubahan.value) return true;

    return window.confirm(
      "Ada perubahan yang belum disimpan.\n\n" +
        "Tekan Batal untuk kembali dan menyimpan dulu, " +
        "atau OK untuk meninggalkan halaman dan membuang perubahan.",
    );
  });
}
