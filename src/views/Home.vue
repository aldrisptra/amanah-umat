<script setup>
import { ref, onMounted } from "vue";
import { Eye, Heart } from "lucide-vue-next";
import { supabase } from "../lib/supabase";
import heroPanti from "../assets/images/hero.jpg";

/* =========================
   STATE
========================= */

// Home
const homeContent = ref(null);

// About
const about = ref(null);
const loadingAbout = ref(true);

// Programs
const programs = ref([]);
const loadingPrograms = ref(true);

// Gallery
const gallery = ref([]);
const loadingGallery = ref(true);

/* =========================
   GET HOME CONTENT
========================= */

const getHomeContent = async () => {
  // .limit(1) tanpa .single(): .single() melempar error ketika tabel masih
  // kosong, padahal beranda seharusnya tetap tampil memakai teks cadangan.
  const { data, error } = await supabase
    .from("home_content")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Gagal mengambil konten beranda:", error);
    return;
  }

  homeContent.value = data?.[0] || null;
};

/* =========================
   GET ABOUT
========================= */

const getAbout = async () => {
  const { data, error } = await supabase
    .from("about")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Gagal mengambil data tentang kami:", error);
    loadingAbout.value = false;
    return;
  }

  about.value = data?.[0] || null;
  loadingAbout.value = false;
};

/* =========================
   GET PROGRAMS
========================= */

const getPrograms = async () => {
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Gagal mengambil data program:", error);
    loadingPrograms.value = false;
    return;
  }

  programs.value = data || [];
  loadingPrograms.value = false;
};

/* =========================
   GET GALLERY
========================= */

const getGallery = async () => {
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Gagal mengambil data galeri:", error);
    loadingGallery.value = false;
    return;
  }

  gallery.value = data || [];
  loadingGallery.value = false;
};

/* =========================
   LOAD ALL DATA
========================= */

onMounted(() => {
  getHomeContent();
  getAbout();
  getPrograms();
  getGallery();
});
</script>

<template>
  <div>
    <!-- =========================
         HERO
    ========================== -->
    <section class="relative min-h-svh overflow-hidden">
      <!-- Background Image -->
      <img
        :src="homeContent?.hero_image_url || heroPanti"
        alt="Anak-anak LKSA Amanah Ummat"
        fetchpriority="high"
        class="hero-zoom absolute inset-0 h-full w-full object-cover"
      />
      <!-- Dark Overlay -->
      <div
        class="absolute inset-0 bg-linear-to-b from-black/70 via-black/55 to-black/75"
      ></div>

      <!-- Hero Content -->
      <div
        class="relative z-10 flex min-h-svh items-center justify-center px-5 pb-24 pt-28 text-center"
      >
        <div class="mx-auto max-w-4xl">
          <!-- Bismillah -->
          <div class="hero-masuk mb-8" style="--tunda: 0ms">
            <p
              dir="rtl"
              class="font-serif text-3xl leading-relaxed text-emerald-100 sm:text-4xl lg:text-5xl"
            >
              بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ
            </p>

            <!-- Decorative Line -->
            <div class="mx-auto mt-5 flex items-center justify-center gap-3">
              <span class="h-px w-16 bg-emerald-300/70"></span>

              <span class="text-lg text-emerald-200">✦</span>

              <span class="h-px w-16 bg-emerald-300/70"></span>
            </div>
          </div>

          <!-- Small Label -->
          <span
            class="hero-masuk inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur-md"
            style="--tunda: 120ms"
          >
            <span class="relative flex h-2 w-2" aria-hidden="true">
              <span
                class="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:hidden"
              ></span>
              <span
                class="relative inline-flex h-2 w-2 rounded-full bg-emerald-400"
              ></span>
            </span>

            LKSA Amanah Ummat Balikpapan
          </span>

          <!-- Judul & deskripsi.
               Tanpa keadaan "memuat": teks cadangan sudah tersedia sehingga
               pengunjung langsung melihat isi, bukan tulisan "Memuat..."
               setinggi satu layar penuh. -->

          <!-- Heading -->
          <h1
            class="hero-masuk mx-auto mt-6 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
            style="--tunda: 220ms"
          >
            {{ homeContent?.hero_title || "Amanah Ummat" }}
          </h1>

          <!-- Description -->
          <p
            class="hero-masuk mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-200 sm:text-lg"
            style="--tunda: 320ms"
          >
            {{
              homeContent?.hero_description ||
              "Memberikan kasih sayang, pendidikan, dan kehidupan yang layak bagi anak-anak yatim, piatu, dan dhuafa di Balikpapan, Kalimantan Timur."
            }}
          </p>

          <!-- Buttons -->
          <div
            class="hero-masuk mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row"
            style="--tunda: 420ms"
          >
            <!-- Donation -->
            <router-link
              to="/donasi"
              class="group relative inline-flex min-w-[190px] items-center justify-center overflow-hidden rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-emerald-900/30 transition duration-300 hover:-translate-y-1 hover:bg-emerald-500 hover:shadow-2xl active:translate-y-0"
            >
              <span
                aria-hidden="true"
                class="absolute inset-0 -translate-x-full bg-linear-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full motion-reduce:hidden"
              ></span>

              <Heart
                class="relative mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-125"
              />

              <span class="relative">Donasi Sekarang</span>
            </router-link>

            <!-- Program -->
            <router-link
              to="/program"
              class="group inline-flex min-w-[190px] items-center justify-center rounded-full border border-white/50 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:bg-white hover:text-gray-900 active:translate-y-0"
            >
              <Eye
                class="mr-2 h-4 w-4 transition-transform duration-300 group-hover:scale-110"
              />
              Lihat Program
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- =========================
         ABOUT
    ========================== -->
    <section class="bg-white py-20">
      <div class="mx-auto max-w-7xl px-5 lg:px-8">
        <!-- Loading -->
        <div v-if="loadingAbout" class="grid items-center gap-12 lg:grid-cols-2">
          <div class="skeleton h-[360px] rounded-3xl"></div>

          <div class="space-y-4">
            <div class="skeleton h-3 w-28"></div>
            <div class="skeleton h-9 w-4/5"></div>
            <div class="skeleton h-4 w-full"></div>
            <div class="skeleton h-4 w-full"></div>
            <div class="skeleton h-4 w-2/3"></div>
          </div>
        </div>

        <!-- About Content -->
        <div v-else-if="about" class="grid items-center gap-12 lg:grid-cols-2">
          <!-- Image -->
          <div v-reveal="{ arah: 'kiri' }" class="group overflow-hidden rounded-3xl">
            <img
              :src="about.image_url"
              :alt="about.title"
              loading="lazy"
              class="h-[360px] w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>

          <!-- Text -->
          <div v-reveal="{ arah: 'kanan' }">
            <span
              class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
            >
              Tentang Kami
            </span>

            <h2
              class="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            >
              {{ about.title }}
            </h2>

            <p
              class="mt-5 line-clamp-6 whitespace-pre-line leading-8 text-gray-600"
            >
              {{ about.description }}
            </p>

            <!-- Link -->
            <router-link
              to="/tentang-kami"
              class="group mt-6 inline-flex items-center font-semibold text-emerald-600 transition hover:text-emerald-700"
            >
              Selengkapnya
              <span
                class="ml-2 transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </router-link>
          </div>
        </div>

        <!-- Empty -->
        <div v-else class="py-10 text-center text-gray-500">
          Informasi tentang LKSA belum tersedia.
        </div>
      </div>
    </section>

    <!-- =========================
         PROGRAM
    ========================== -->
    <section class="bg-emerald-50 py-20">
      <div class="mx-auto max-w-7xl px-5 lg:px-8">
        <!-- Heading -->
        <div v-reveal class="text-center">
          <span
            class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
          >
            Program Kami
          </span>

          <h2
            class="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            Program untuk mendukung tumbuh kembang anak
          </h2>

          <p class="mx-auto mt-4 max-w-2xl leading-7 text-gray-600">
            Berbagai program yang diselenggarakan untuk mendukung pendidikan,
            pembinaan, dan kegiatan anak-anak LKSA Amanah Ummat.
          </p>
        </div>

        <!-- Loading -->
        <div
          v-if="loadingPrograms"
          class="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <div
            v-for="n in 3"
            :key="n"
            class="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100"
          >
            <div class="skeleton aspect-4/3 rounded-none"></div>

            <div class="space-y-3 p-6">
              <div class="skeleton h-3 w-20"></div>
              <div class="skeleton h-5 w-3/4"></div>
              <div class="skeleton h-3 w-full"></div>
              <div class="skeleton h-3 w-5/6"></div>
            </div>
          </div>
        </div>

        <!-- Program Cards -->
        <div
          v-else-if="programs.length > 0"
          class="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <article
            v-for="(program, index) in programs.slice(0, 3)"
            :key="program.id"
            v-reveal="{ delay: index * 110 }"
            class="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:ring-emerald-200"
          >
            <!-- Image -->
            <div class="aspect-4/3 overflow-hidden">
              <img
                :src="program.image_url"
                :alt="program.title"
                loading="lazy"
                class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>

            <!-- Content -->
            <div class="p-6">
              <span
                v-if="program.category"
                class="text-xs font-semibold uppercase tracking-wider text-emerald-600"
              >
                {{ program.category }}
              </span>

              <h3 class="mt-2 text-xl font-bold text-gray-900">
                {{ program.title }}
              </h3>

              <p class="mt-3 line-clamp-3 text-sm leading-7 text-gray-600">
                {{ program.description }}
              </p>

              <router-link
                to="/program"
                class="mt-5 inline-flex items-center text-sm font-semibold text-emerald-600"
              >
                Selengkapnya
                <span
                  class="ml-1.5 transition-transform duration-300 group-hover:translate-x-1"
                >
                  →
                </span>
              </router-link>
            </div>
          </article>
        </div>

        <!-- Empty -->
        <div v-else class="py-20 text-center text-gray-500">
          Belum ada program yang tersedia.
        </div>

        <!-- All Programs -->
        <div v-reveal class="mt-10 text-center">
          <router-link
            to="/program"
            class="inline-flex rounded-full border border-emerald-600 px-6 py-3 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-600 hover:text-white"
          >
            Lihat Semua Program
          </router-link>
        </div>
      </div>
    </section>

    <!-- =========================
         GALLERY
    ========================== -->
    <section class="bg-white py-20">
      <div class="mx-auto max-w-7xl px-5 lg:px-8">
        <!-- Heading -->
        <div
          v-reveal
          class="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"
        >
          <div>
            <span
              class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
            >
              Galeri
            </span>

            <h2 class="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
              Momen bersama anak-anak
            </h2>
          </div>

          <router-link
            to="/galeri"
            class="group inline-flex items-center font-semibold text-emerald-600"
          >
            Lihat Semua
            <span
              class="ml-1.5 transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </router-link>
        </div>

        <!-- Loading -->
        <div
          v-if="loadingGallery"
          class="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4"
        >
          <div
            v-for="n in 8"
            :key="n"
            class="skeleton aspect-square rounded-2xl"
          ></div>
        </div>

        <!-- Empty -->
        <div
          v-else-if="gallery.length === 0"
          class="py-20 text-center text-gray-500"
        >
          Belum ada foto galeri yang tersedia.
        </div>

        <!-- Gallery -->
        <div v-else class="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div
            v-for="(image, index) in gallery.slice(0, 8)"
            :key="image.id"
            v-reveal="{ delay: index * 70 }"
            class="aspect-square overflow-hidden rounded-2xl"
          >
            <img
              :src="image.image_url"
              :alt="image.alt_text || 'Kegiatan anak-anak LKSA Amanah Ummat'"
              loading="lazy"
              class="h-full w-full object-cover transition duration-700 hover:scale-110"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- =========================
         DONATION CTA
    ========================== -->
    <section class="px-5 py-20 lg:px-8">
      <div
        v-reveal
        class="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-linear-to-br from-emerald-700 to-emerald-600 px-6 py-16 text-center shadow-2xl shadow-emerald-900/20 sm:px-12"
      >
        <!-- Bulatan samar sebagai hiasan latar -->
        <span
          aria-hidden="true"
          class="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-2xl"
        ></span>
        <span
          aria-hidden="true"
          class="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-emerald-300/10 blur-2xl"
        ></span>

        <!-- CTA Title -->
        <h2
          class="relative mx-auto max-w-3xl text-3xl font-bold text-white sm:text-4xl"
        >
          {{
            homeContent?.cta_title ||
            "Mari ikut mendukung perjalanan anak-anak Amanah Ummat."
          }}
        </h2>

        <!-- CTA Description -->
        <p class="relative mx-auto mt-5 max-w-2xl leading-7 text-emerald-100">
          {{
            homeContent?.cta_description ||
            "Dukungan Anda dapat membantu memenuhi kebutuhan dan mendukung berbagai kegiatan anak-anak LKSA Amanah Ummat."
          }}
        </p>

        <!-- CTA Button -->
        <router-link
          to="/donasi"
          class="group relative mt-8 inline-flex items-center rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-emerald-700 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl active:translate-y-0"
        >
          Mulai Berdonasi
          <span
            class="ml-2 transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </router-link>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* Foto hero membesar sangat perlahan. Hanya `transform`, sehingga
   dikerjakan kartu grafis dan tidak membebani ponsel. */
.hero-zoom {
  animation: hero-zoom 22s ease-out forwards;
}

@keyframes hero-zoom {
  from {
    transform: scale(1);
  }
  to {
    transform: scale(1.09);
  }
}

/* Isi hero muncul berurutan, diatur lewat variabel --tunda di tiap elemen */
.hero-masuk {
  animation: hero-masuk 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--tunda, 0ms);
}

@keyframes hero-masuk {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-zoom,
  .hero-masuk {
    animation: none;
  }
}
</style>
