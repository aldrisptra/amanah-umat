<script setup>
import { onMounted, ref } from "vue";
import { ChevronRight, ExternalLink } from "lucide-vue-next";
import { supabase } from "../lib/supabase";
import { ADMIN_MENU, MENU_COLORS } from "../lib/adminMenu";
import AdminImageOptimizer from "../components/admin/AdminImageOptimizer.vue";

/**
 * Beranda panel.
 *
 * Selain sebagai pintu masuk ke tiap bagian, halaman ini menunjukkan ringkasan
 * isi tiap bagian (mis. "5 program", "Belum diisi"), sehingga pengurus bisa
 * langsung melihat bagian mana yang masih kosong tanpa membukanya satu per satu.
 */

const ringkasan = ref({});
const memuatRingkasan = ref(true);

const ambilRingkasan = async () => {
  const hasil = {};

  await Promise.all(
    ADMIN_MENU.map(async (menu) => {
      const { table, kind, unit } = menu.summary;

      const { count, error } = await supabase
        .from(table)
        .select("id", { count: "exact", head: true });

      if (error) {
        // Tabel site_settings dibuat menyusul lewat berkas SQL. Selama belum
        // dibuat, tandai sebagai belum aktif alih-alih menampilkan galat.
        const belumDibuat =
          error.code === "PGRST205" || error.code === "42P01";

        if (!belumDibuat) {
          console.error(`Gagal membaca ringkasan ${table}:`, error);
        }

        hasil[menu.to] = belumDibuat
          ? { teks: "Belum aktif", kosong: true }
          : null;

        return;
      }

      if (kind === "list") {
        hasil[menu.to] = {
          teks: count ? `${count} ${unit}` : `Belum ada ${unit}`,
          kosong: !count,
        };
      } else {
        hasil[menu.to] = {
          teks: count ? "Sudah diisi" : "Belum diisi",
          kosong: !count,
        };
      }
    }),
  );

  ringkasan.value = hasil;
  memuatRingkasan.value = false;
};

onMounted(ambilRingkasan);
</script>

<template>
  <div class="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <div class="mx-auto max-w-6xl">
      <!-- =========================================================
           SAMBUTAN
      ========================================================== -->
      <section
        class="rounded-3xl bg-gradient-to-br from-emerald-700 to-emerald-600 px-6 py-8 text-white shadow-lg sm:px-9 sm:py-10"
      >
        <h1 class="text-2xl font-bold sm:text-3xl">
          Selamat datang di panel pengelola
        </h1>

        <p class="mt-3 max-w-2xl text-sm leading-7 text-emerald-50">
          Dari sini Anda dapat mengubah isi website Amanah Ummat sendiri —
          tulisan, foto, program, nomor kontak, dan rekening donasi. Pilih
          bagian yang ingin diubah, lalu tekan Simpan. Perubahan langsung
          tampil di website.
        </p>

        <a
          href="/"
          target="_blank"
          rel="noopener"
          class="mt-6 inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
        >
          <ExternalLink class="h-4 w-4" />
          Lihat website
        </a>
      </section>

      <!-- =========================================================
           PILIHAN BAGIAN
      ========================================================== -->
      <h2 class="mt-9 text-lg font-bold text-gray-900">
        Pilih bagian yang ingin diubah
      </h2>

      <div class="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <router-link
          v-for="menu in ADMIN_MENU"
          :key="menu.to"
          :to="menu.to"
          class="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg"
        >
          <div class="flex items-start justify-between gap-3">
            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              :class="MENU_COLORS[menu.color]"
            >
              <component :is="menu.icon" class="h-5 w-5" />
            </div>

            <!-- Ringkasan isi -->
            <span
              v-if="!memuatRingkasan && ringkasan[menu.to]?.teks"
              class="rounded-full px-2.5 py-1 text-xs font-semibold"
              :class="
                ringkasan[menu.to].kosong
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-gray-100 text-gray-600'
              "
            >
              {{ ringkasan[menu.to].teks }}
            </span>

            <span
              v-else-if="memuatRingkasan"
              class="h-6 w-16 animate-pulse rounded-full bg-gray-100"
            ></span>
          </div>

          <h3 class="mt-4 text-lg font-bold text-gray-900">
            {{ menu.label }}
          </h3>

          <p class="mt-1.5 flex-1 text-sm leading-6 text-gray-500">
            {{ menu.description }}
          </p>

          <span
            class="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-600"
          >
            Buka
            <ChevronRight
              class="h-4 w-4 transition group-hover:translate-x-0.5"
            />
          </span>
        </router-link>
      </div>

      <!-- =========================================================
           PERAWATAN
      ========================================================== -->
      <h2 class="mt-9 text-lg font-bold text-gray-900">Perawatan website</h2>

      <div class="mt-4">
        <AdminImageOptimizer />
      </div>

      <!-- =========================================================
           PANDUAN SINGKAT
      ========================================================== -->
      <section class="mt-9 rounded-2xl border border-gray-200 bg-white p-6">
        <h2 class="text-base font-bold text-gray-900">Hal yang perlu diingat</h2>

        <ul class="mt-4 space-y-3 text-sm leading-6 text-gray-600">
          <li class="flex gap-3">
            <span
              class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
            ></span>
            Perubahan baru tersimpan setelah tombol
            <strong class="font-semibold text-gray-800">Simpan</strong> ditekan
            dan muncul pesan hijau. Jika muncul pesan merah, perubahan belum
            masuk.
          </li>

          <li class="flex gap-3">
            <span
              class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
            ></span>
            Foto sebaiknya berformat JPG atau PNG dan berukuran di bawah 5 MB
            agar website tetap cepat dibuka.
          </li>

          <li class="flex gap-3">
            <span
              class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
            ></span>
            Gunakan tombol
            <strong class="font-semibold text-gray-800">Lihat di website</strong>
            di setiap halaman untuk memastikan hasilnya sudah sesuai.
          </li>

          <li class="flex gap-3">
            <span
              class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
            ></span>
            Periksa kembali nomor rekening dan nama pemilik rekening pada bagian
            Donasi sebelum menyimpan — bagian ini dilihat langsung oleh calon
            donatur.
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
