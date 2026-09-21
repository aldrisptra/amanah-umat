<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  TriangleAlert,
  X,
} from "lucide-vue-next";
import { supabase } from "../lib/supabase";
import { ADMIN_MENU } from "../lib/adminMenu";
import AdminConfirm from "../components/admin/AdminConfirm.vue";
import SiteLogo from "../components/SiteLogo.vue";

const route = useRoute();
const router = useRouter();

const adminEmail = ref("");
const menuTerbuka = ref(false);
const konfirmasiKeluar = ref(false);

onMounted(async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  adminEmail.value = user?.email || "";
});

// Menu samping versi ponsel harus tertutup sendiri setelah berpindah halaman
watch(
  () => route.path,
  () => {
    menuTerbuka.value = false;
  },
);

const logout = async () => {
  await supabase.auth.signOut();

  router.replace({ path: "/admin/login", query: { alasan: "keluar" } });
};

/* =========================================================
   KELUAR OTOMATIS BILA DITINGGAL

   Panel ini sering dibuka dari komputer bersama di kantor yayasan. Bila
   ditinggal dalam keadaan terbuka, siapa pun yang lewat bisa mengubah isi
   website - termasuk nomor rekening donasi. Karena itu sesi ditutup sendiri
   setelah beberapa lama tanpa aktivitas, dengan peringatan lebih dulu supaya
   pekerjaan yang sedang berjalan tidak hilang mendadak.
========================================================= */

const MENIT_DIAM = 30;
const DETIK_PERINGATAN = 60;

const detikMundur = ref(0);
const peringatanTampil = ref(false);

let waktuAktivitasTerakhir = Date.now();
let pemeriksa = null;

const catatAktivitas = () => {
  // Selama peringatan tampil, gerakan tetikus tidak dihitung sebagai
  // aktivitas: pengurus harus menekan tombolnya secara sadar.
  if (peringatanTampil.value) return;

  waktuAktivitasTerakhir = Date.now();
};

const lanjutkanSesi = () => {
  peringatanTampil.value = false;
  waktuAktivitasTerakhir = Date.now();
};

const keluarKarenaDiam = async () => {
  if (pemeriksa) clearInterval(pemeriksa);

  await supabase.auth.signOut();

  router.replace({ path: "/admin/login", query: { alasan: "idle" } });
};

const periksaDiam = () => {
  const diamDetik = Math.floor((Date.now() - waktuAktivitasTerakhir) / 1000);
  const batas = MENIT_DIAM * 60;

  if (diamDetik >= batas) {
    keluarKarenaDiam();
    return;
  }

  if (diamDetik >= batas - DETIK_PERINGATAN) {
    peringatanTampil.value = true;
    detikMundur.value = batas - diamDetik;
    return;
  }

  peringatanTampil.value = false;
};

const PERISTIWA_AKTIVITAS = [
  "mousemove",
  "mousedown",
  "keydown",
  "touchstart",
  "scroll",
];

onMounted(() => {
  PERISTIWA_AKTIVITAS.forEach((nama) =>
    window.addEventListener(nama, catatAktivitas, { passive: true }),
  );

  pemeriksa = setInterval(periksaDiam, 1000);
});

onBeforeUnmount(() => {
  PERISTIWA_AKTIVITAS.forEach((nama) =>
    window.removeEventListener(nama, catatAktivitas),
  );

  if (pemeriksa) clearInterval(pemeriksa);
});
</script>

<template>
  <div class="min-h-screen bg-gray-100">
    <!-- =========================================================
         MENU SAMPING (layar besar)
    ========================================================== -->
    <aside
      class="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex"
    >
      <!-- Identitas -->
      <div class="border-b border-gray-100 px-5 py-5">
        <SiteLogo size="sm" name-class="text-gray-900" />

        <p class="mt-1.5 text-xs text-gray-500">Panel Pengelola</p>
      </div>

      <!-- Navigasi -->
      <nav class="flex-1 overflow-y-auto px-3 py-4">
        <router-link
          to="/admin"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition"
          :class="
            route.path === '/admin'
              ? 'bg-emerald-50 text-emerald-700'
              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
          "
        >
          <LayoutDashboard class="h-5 w-5 shrink-0" />
          Beranda Panel
        </router-link>

        <p
          class="mt-6 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400"
        >
          Isi Website
        </p>

        <div class="mt-2 space-y-1">
          <router-link
            v-for="item in ADMIN_MENU"
            :key="item.to"
            :to="item.to"
            class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition"
            :class="
              route.path === item.to
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            "
          >
            <component :is="item.icon" class="h-5 w-5 shrink-0" />
            {{ item.label }}
          </router-link>
        </div>
      </nav>

      <!-- Akun -->
      <div class="border-t border-gray-100 p-3">
        <a
          href="/"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 hover:text-gray-900"
        >
          <ExternalLink class="h-5 w-5 shrink-0" />
          Lihat Website
        </a>

        <div class="mt-2 rounded-xl bg-gray-50 px-3 py-3">
          <p class="text-xs text-gray-500">Masuk sebagai</p>

          <p class="mt-0.5 truncate text-sm font-semibold text-gray-800">
            {{ adminEmail || "Admin" }}
          </p>

          <button
            type="button"
            @click="konfirmasiKeluar = true"
            class="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut class="h-4 w-4" />
            Keluar
          </button>
        </div>
      </div>
    </aside>

    <!-- =========================================================
         MENU PONSEL
    ========================================================== -->
    <header
      class="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 lg:hidden"
    >
      <div class="min-w-0">
        <SiteLogo size="sm" name-class="text-gray-900" />
      </div>

      <button
        type="button"
        @click="menuTerbuka = true"
        aria-label="Buka menu"
        class="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition hover:bg-gray-50"
      >
        <Menu class="h-5 w-5" />
      </button>
    </header>

    <!-- Laci menu ponsel -->
    <div
      v-if="menuTerbuka"
      class="fixed inset-0 z-50 bg-black/40 lg:hidden"
      @click.self="menuTerbuka = false"
    >
      <div
        class="ml-auto flex h-full w-72 max-w-[85%] flex-col bg-white shadow-2xl"
      >
        <div
          class="flex items-center justify-between border-b border-gray-100 px-4 py-4"
        >
          <p class="text-sm font-bold text-gray-900">Menu Pengelola</p>

          <button
            type="button"
            @click="menuTerbuka = false"
            aria-label="Tutup menu"
            class="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <nav class="flex-1 overflow-y-auto px-3 py-4">
          <router-link
            to="/admin"
            class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition"
            :class="
              route.path === '/admin'
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-600 hover:bg-gray-50'
            "
          >
            <LayoutDashboard class="h-5 w-5 shrink-0" />
            Beranda Panel
          </router-link>

          <p
            class="mt-5 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400"
          >
            Isi Website
          </p>

          <div class="mt-2 space-y-1">
            <router-link
              v-for="item in ADMIN_MENU"
              :key="item.to"
              :to="item.to"
              class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition"
              :class="
                route.path === item.to
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50'
              "
            >
              <component :is="item.icon" class="h-5 w-5 shrink-0" />
              {{ item.label }}
            </router-link>
          </div>
        </nav>

        <div class="border-t border-gray-100 p-3">
          <a
            href="/"
            target="_blank"
            rel="noopener"
            class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            <ExternalLink class="h-5 w-5 shrink-0" />
            Lihat Website
          </a>

          <p class="mt-2 px-3 text-xs text-gray-500">
            Masuk sebagai
            <span class="font-semibold text-gray-700">
              {{ adminEmail || "Admin" }}
            </span>
          </p>

          <button
            type="button"
            @click="konfirmasiKeluar = true"
            class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-3 py-3 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            <LogOut class="h-4 w-4" />
            Keluar
          </button>
        </div>
      </div>
    </div>

    <!-- =========================================================
         ISI HALAMAN
    ========================================================== -->
    <div class="lg:pl-64">
      <router-view />
    </div>

    <AdminConfirm
      :open="konfirmasiKeluar"
      title="Keluar dari panel?"
      message="Anda perlu memasukkan email dan password lagi untuk masuk kembali."
      confirm-label="Ya, keluar"
      @confirm="logout"
      @cancel="konfirmasiKeluar = false"
    />

    <!-- =========================================================
         PERINGATAN SEBELUM KELUAR OTOMATIS

         Muncul sebagai bilah di bawah layar, bukan jendela yang menutupi
         halaman - supaya pengurus masih melihat pekerjaan yang sedang
         dikerjakannya saat memutuskan.
    ========================================================== -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="translate-y-full opacity-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-to-class="translate-y-full opacity-0"
    >
      <div
        v-if="peringatanTampil"
        role="alertdialog"
        aria-live="assertive"
        class="fixed inset-x-0 bottom-0 z-[70] px-4 pb-4"
      >
        <div
          class="mx-auto flex max-w-2xl flex-col gap-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 shadow-2xl sm:flex-row sm:items-center"
        >
          <TriangleAlert class="h-6 w-6 shrink-0 text-amber-600" />

          <div class="min-w-0 flex-1">
            <p class="text-sm font-semibold text-amber-900">
              Sesi akan berakhir dalam
              <span class="tabular-nums">{{ detikMundur }}</span> detik
            </p>

            <p class="mt-0.5 text-sm leading-6 text-amber-800">
              Panel ditutup sendiri karena tidak ada aktivitas. Perubahan yang
              belum disimpan bisa hilang.
            </p>
          </div>

          <button
            type="button"
            @click="lanjutkanSesi"
            class="shrink-0 rounded-xl bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700"
          >
            Tetap di sini
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>
