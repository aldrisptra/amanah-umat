<script setup>
import { computed, onBeforeUnmount, onMounted, nextTick, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { Heart, Menu, X } from "lucide-vue-next";
import SiteLogo from "./SiteLogo.vue";
import { gerakanDikurangi } from "../lib/motion";

const route = useRoute();

const MENU = [
  { to: "/", label: "Beranda" },
  { to: "/tentang-kami", label: "Tentang Kami" },
  { to: "/program", label: "Program" },
  { to: "/galeri", label: "Galeri" },
  { to: "/kontak", label: "Kontak" },
];

const isMenuOpen = ref(false);
const sudahDigulir = ref(false);

// Hanya beranda yang punya foto besar gelap di baliknya. Di halaman lain
// latar belakangnya terang, jadi tulisan navbar harus gelap sejak awal.
const diBeranda = computed(() => route.path === "/");

const modeTerang = computed(() => diBeranda.value && !sudahDigulir.value);

/* =========================================================
   MORPH SAAT DIGULIR

   Di puncak halaman navbar melebar penuh dan menyatu dengan foto.
   Begitu digulir, ia mengerut menjadi "pil" mengambang.
========================================================= */

const handleScroll = () => {
  sudahDigulir.value = window.scrollY > 24;
};

/* =========================================================
   PENANDA MENU AKTIF YANG MELUNCUR

   Alih-alih sekadar mengubah warna teks, sebuah pil hijau bergeser
   ke menu yang sedang dibuka. Posisinya diukur dari elemen aslinya,
   bukan ditebak, supaya tetap tepat pada lebar layar mana pun.
========================================================= */

const navRef = ref(null);
const penanda = ref({ left: 0, width: 0, tampil: false });

const perbaruiPenanda = async () => {
  await nextTick();

  const wadah = navRef.value;

  if (!wadah) return;

  const aktif = wadah.querySelector(`[data-path="${route.path}"]`);

  if (!aktif) {
    penanda.value = { ...penanda.value, tampil: false };
    return;
  }

  penanda.value = {
    left: aktif.offsetLeft,
    width: aktif.offsetWidth,
    tampil: true,
  };
};

let pengamatUkuran = null;

onMounted(() => {
  handleScroll();
  window.addEventListener("scroll", handleScroll, { passive: true });

  // Lebar navbar berubah saat berubah bentuk menjadi pil, dan saat layar
  // diputar. ResizeObserver menangkap keduanya tanpa perlu menebak durasi
  // animasi.
  if (navRef.value && "ResizeObserver" in window) {
    pengamatUkuran = new ResizeObserver(perbaruiPenanda);
    pengamatUkuran.observe(navRef.value);
  }

  perbaruiPenanda();
});

onBeforeUnmount(() => {
  window.removeEventListener("scroll", handleScroll);
  pengamatUkuran?.disconnect();
  document.body.style.overflow = "";
});

watch(() => route.path, perbaruiPenanda);

/* =========================================================
   MENU PONSEL
========================================================= */

const tutupMenu = () => {
  isMenuOpen.value = false;
};

watch(isMenuOpen, (terbuka) => {
  // Cegah halaman di belakang ikut bergulir saat menu layar penuh terbuka
  document.body.style.overflow = terbuka ? "hidden" : "";
});

watch(() => route.path, tutupMenu);
</script>

<template>
  <header class="pointer-events-none fixed inset-x-0 top-0 z-50">
    <div
      class="pointer-events-auto mx-auto flex items-center justify-between transition-all duration-500 ease-out"
      :class="
        sudahDigulir
          ? 'mt-3 h-16 max-w-5xl rounded-full border border-black/5 bg-white/75 px-3 shadow-lg shadow-black/5 backdrop-blur-xl sm:px-4'
          : 'mt-0 h-20 max-w-7xl rounded-none border border-transparent bg-transparent px-5 lg:px-8'
      "
    >
      <!-- LOGO -->
      <router-link
        to="/"
        class="flex min-w-0 items-center rounded-full transition-transform duration-300 hover:scale-[1.03] active:scale-95"
        :class="sudahDigulir ? 'pl-1' : ''"
      >
        <SiteLogo :name-class="modeTerang ? 'text-white' : 'text-gray-900'" />
      </router-link>

      <!-- MENU LAYAR BESAR -->
      <nav ref="navRef" class="relative hidden items-center gap-1 md:flex">
        <!-- Pil penanda yang meluncur -->
        <span
          aria-hidden="true"
          class="absolute inset-y-0 my-auto h-9 rounded-full transition-all duration-500 ease-out"
          :class="[
            modeTerang ? 'bg-white/20' : 'bg-emerald-50',
            penanda.tampil ? 'opacity-100' : 'opacity-0',
          ]"
          :style="{ left: `${penanda.left}px`, width: `${penanda.width}px` }"
        ></span>

        <router-link
          v-for="item in MENU"
          :key="item.to"
          :to="item.to"
          :data-path="item.to"
          class="relative rounded-full px-4 py-2 text-sm font-medium transition-colors duration-300"
          :class="[
            modeTerang
              ? 'text-white/80 hover:text-white'
              : 'text-gray-600 hover:text-emerald-700',
            route.path === item.to && !modeTerang ? 'text-emerald-700!' : '',
            route.path === item.to && modeTerang ? 'text-white!' : '',
          ]"
        >
          {{ item.label }}
        </router-link>
      </nav>

      <!-- TOMBOL DONASI -->
      <router-link
        to="/donasi"
        class="group relative ml-2 hidden items-center overflow-hidden rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 md:inline-flex"
        :class="
          modeTerang
            ? 'bg-white text-emerald-700 shadow-lg shadow-black/10 hover:shadow-xl'
            : 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700'
        "
      >
        <!-- Kilau yang menyapu saat disentuh kursor -->
        <span
          aria-hidden="true"
          class="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full motion-reduce:hidden"
        ></span>

        <Heart
          class="relative mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-125"
        />

        <span class="relative">Donasi</span>
      </router-link>

      <!-- TOMBOL MENU PONSEL -->
      <button
        type="button"
        class="flex h-11 w-11 items-center justify-center rounded-full transition-all duration-300 active:scale-90 md:hidden"
        :class="
          modeTerang
            ? 'bg-white/10 text-white backdrop-blur hover:bg-white/20'
            : 'bg-gray-100/80 text-gray-800 hover:bg-gray-200'
        "
        @click="isMenuOpen = true"
        aria-label="Buka menu"
      >
        <Menu class="h-5 w-5" />
      </button>
    </div>

    <!-- =========================================================
         MENU PONSEL LAYAR PENUH
    ========================================================== -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isMenuOpen"
        class="pointer-events-auto fixed inset-0 z-50 bg-gray-950/95 backdrop-blur-xl md:hidden"
      >
        <div class="flex h-full flex-col">
          <!-- Kepala -->
          <div class="flex items-center justify-between px-5 py-5">
            <SiteLogo name-class="text-white" />

            <button
              type="button"
              class="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition active:scale-90"
              @click="tutupMenu"
              aria-label="Tutup menu"
            >
              <X class="h-5 w-5" />
            </button>
          </div>

          <!-- Daftar menu, muncul berurutan satu per satu -->
          <nav class="flex flex-1 flex-col justify-center gap-1 px-6">
            <router-link
              v-for="(item, index) in MENU"
              :key="item.to"
              :to="item.to"
              class="menu-masuk rounded-2xl px-5 py-4 text-2xl font-bold tracking-tight transition-colors"
              :class="
                route.path === item.to
                  ? 'bg-white/10 text-emerald-300'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              "
              :style="
                gerakanDikurangi ? {} : { animationDelay: `${index * 60}ms` }
              "
              @click="tutupMenu"
            >
              {{ item.label }}
            </router-link>
          </nav>

          <!-- Ajakan donasi -->
          <div class="px-6 pb-10">
            <router-link
              to="/donasi"
              class="menu-masuk flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-6 py-4 text-base font-bold text-white shadow-xl shadow-emerald-500/25 transition active:scale-95"
              :style="
                gerakanDikurangi
                  ? {}
                  : { animationDelay: `${MENU.length * 60}ms` }
              "
              @click="tutupMenu"
            >
              <Heart class="h-5 w-5" />
              Donasi Sekarang
            </router-link>
          </div>
        </div>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
/* Tiap butir menu ponsel meluncur naik sedikit terlambat dari butir
   sebelumnya, sehingga terasa mengalir alih-alih muncul serentak. */
.menu-masuk {
  animation: menu-masuk 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes menu-masuk {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .menu-masuk {
    animation: none;
  }
}
</style>
