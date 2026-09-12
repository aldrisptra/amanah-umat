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
const loadingHome = ref(true);

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
  const { data, error } = await supabase
    .from("home_content")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error) {
    console.error("Gagal mengambil konten beranda:", error);
    loadingHome.value = false;
    return;
  }

  homeContent.value = data;
  loadingHome.value = false;
};

/* =========================
   GET ABOUT
========================= */

const getAbout = async () => {
  const { data, error } = await supabase
    .from("about")
    .select("*")
    .order("created_at", { ascending: true })
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
    <section class="relative min-h-[calc(100vh-73px)] overflow-hidden">
      <!-- Background Image -->
      <img
        :src="homeContent?.hero_image_url || heroPanti"
        alt="Anak-anak LKSA Amanah Ummat"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <!-- Dark Overlay -->
      <div class="absolute inset-0 bg-black/60"></div>

      <!-- Hero Content -->
      <div
        class="relative z-10 flex min-h-[calc(100vh-73px)] items-center justify-center px-5 py-20 text-center"
      >
        <div class="mx-auto max-w-4xl">
          <!-- Bismillah -->
          <div class="mb-8">
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
            class="inline-flex rounded-full border border-white/30 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur-sm"
          >
            LKSA Amanah Ummat Balikpapan
          </span>

          <!-- Loading Hero -->
          <div v-if="loadingHome" class="mt-6 text-white">Memuat...</div>

          <!-- Hero Content -->
          <template v-else>
            <!-- Heading -->
            <h1
              class="mx-auto mt-6 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              {{ homeContent?.hero_title || "Amanah Ummat" }}
            </h1>

            <!-- Description -->
            <p
              class="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-200 sm:text-lg"
            >
              {{
                homeContent?.hero_description ||
                "Memberikan kasih sayang, pendidikan, dan kehidupan yang layak bagi anak-anak yatim, piatu, dan dhuafa di Balikpapan, Kalimantan Timur."
              }}
            </p>
          </template>

          <!-- Buttons -->
          <div
            class="mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row"
          >
            <!-- Donation -->
            <router-link
              to="/donasi"
              class="inline-flex min-w-[190px] items-center justify-center rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-emerald-900/30 transition duration-300 hover:-translate-y-1 hover:bg-emerald-500"
            >
              <Heart class="mr-2 h-4 w-4" />
              Donasi Sekarang
            </router-link>

            <!-- Program -->
            <router-link
              to="/program"
              class="inline-flex min-w-[190px] items-center justify-center rounded-full border border-white/60 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:bg-white hover:text-gray-900"
            >
              <Eye class="mr-2 h-4 w-4" />
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
        <div v-if="loadingAbout" class="py-10 text-center text-gray-500">
          Memuat informasi tentang kami...
        </div>

        <!-- About Content -->
        <div v-else-if="about" class="grid items-center gap-12 lg:grid-cols-2">
          <!-- Image -->
          <div class="overflow-hidden rounded-3xl">
            <img
              :src="about.image_url"
              :alt="about.title"
              class="h-[360px] w-full object-cover"
            />
          </div>

          <!-- Text -->
          <div>
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

            <p class="mt-5 whitespace-pre-line leading-8 text-gray-600">
              {{ about.description }}
            </p>

            <!-- Link -->
            <router-link
              to="/tentang-kami"
              class="mt-6 inline-flex font-semibold text-emerald-600 transition hover:text-emerald-700"
            >
              Selengkapnya
              <span class="ml-2">→</span>
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
        <div class="text-center">
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
        <div v-if="loadingPrograms" class="py-20 text-center text-gray-500">
          Memuat program...
        </div>

        <!-- Program Cards -->
        <div
          v-else-if="programs.length > 0"
          class="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3"
        >
          <article
            v-for="program in programs.slice(0, 3)"
            :key="program.id"
            class="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <!-- Image -->
            <div class="aspect-[4/3] overflow-hidden">
              <img
                :src="program.image_url"
                :alt="program.title"
                class="h-full w-full object-cover transition duration-500 hover:scale-105"
              />
            </div>

            <!-- Content -->
            <div class="p-6">
              <h3 class="text-xl font-bold text-gray-900">
                {{ program.title }}
              </h3>

              <p class="mt-3 text-sm leading-7 text-gray-600">
                {{ program.description }}
              </p>

              <router-link
                to="/program"
                class="mt-5 inline-flex text-sm font-semibold text-emerald-600"
              >
                Selengkapnya →
              </router-link>
            </div>
          </article>
        </div>

        <!-- Empty -->
        <div v-else class="py-20 text-center text-gray-500">
          Belum ada program yang tersedia.
        </div>

        <!-- All Programs -->
        <div class="mt-10 text-center">
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

          <router-link to="/galeri" class="font-semibold text-emerald-600">
            Lihat Semua →
          </router-link>
        </div>

        <!-- Loading -->
        <div v-if="loadingGallery" class="py-20 text-center text-gray-500">
          Memuat galeri...
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
            v-for="image in gallery.slice(0, 8)"
            :key="image.id"
            class="aspect-square overflow-hidden rounded-2xl"
          >
            <img
              :src="image.image_url"
              :alt="image.alt_text || 'Kegiatan anak-anak LKSA Amanah Ummat'"
              class="h-full w-full object-cover transition duration-500 hover:scale-105"
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
        class="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-emerald-700 px-6 py-16 text-center sm:px-12"
      >
        <!-- CTA Title -->
        <h2 class="mx-auto max-w-3xl text-3xl font-bold text-white sm:text-4xl">
          {{
            homeContent?.cta_title ||
            "Mari ikut mendukung perjalanan anak-anak Amanah Ummat."
          }}
        </h2>

        <!-- CTA Description -->
        <p class="mx-auto mt-5 max-w-2xl leading-7 text-emerald-100">
          {{
            homeContent?.cta_description ||
            "Dukungan Anda dapat membantu memenuhi kebutuhan dan mendukung berbagai kegiatan anak-anak LKSA Amanah Ummat."
          }}
        </p>

        <!-- CTA Button -->
        <router-link
          to="/donasi"
          class="mt-8 inline-flex rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-emerald-700 shadow-lg transition hover:bg-gray-100"
        >
          Mulai Berdonasi
        </router-link>
      </div>
    </section>
  </div>
</template>
