<script setup>
import { Eye, Heart } from "lucide-vue-next";
import { ref, onMounted } from "vue";
import { supabase } from "../lib/supabase";

const programs = ref([]);
const loadingPrograms = ref(true);

const getPrograms = async () => {
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Gagal mengambil data program:", error);
    return;
  }

  programs.value = data;
  loadingPrograms.value = false;
};

onMounted(() => {
  getPrograms();
});

const gallery = [
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1504159506876-f8338247a14a?auto=format&fit=crop&w=800&q=80",
  "https://images.unsplash.com/photo-1554721299-e0b8aa7666ce?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
  "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?auto=format&fit=crop&w=800&q=80",
];
</script>

<template>
  <div>
    <!-- =========================
         HERO
    ========================== -->
    <section class="relative min-h-[calc(100vh-73px)] overflow-hidden">
      <!-- Background Image -->
      <img
        src="https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=2000&q=85"
        alt="Anak-anak Panti Asuhan Amanah Umat"
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
            Panti Asuhan Amanah Umat Balikpapan
          </span>

          <!-- Heading -->
          <h1
            class="mx-auto mt-6 max-w-4xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Amanah <span class="text-emerald-300">Umat</span>
          </h1>

          <!-- Description -->
          <p
            class="mx-auto mt-6 max-w-2xl text-base leading-8 text-gray-200 sm:text-lg"
          >
            Memberikan kasih sayang, pendidikan, dan kehidupan yang layak bagi
            anak-anak yatim, dan piatu di Balikpapan, Kalimantan Timur.
          </p>

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
      <div class="mx-auto grid max-w-7xl gap-12 px-5 lg:grid-cols-2 lg:px-8">
        <div>
          <span
            class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
          >
            Tentang Kami
          </span>

          <h2
            class="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            Mengenal Panti Asuhan Amanah Umat.
          </h2>
        </div>

        <div>
          <p class="leading-8 text-gray-600">
            Panti Asuhan Amanah Umat Balikpapan merupakan tempat tinggal dan
            pembinaan bagi anak-anak yang membutuhkan perhatian, kasih sayang,
            pendidikan, dan pendampingan.
          </p>

          <p class="mt-5 leading-8 text-gray-600">
            Di panti, anak-anak menjalani keseharian bersama, belajar,
            beribadah, bermain, dan mengikuti berbagai kegiatan yang mendukung
            tumbuh kembang mereka.
          </p>

          <router-link
            to="/tentang-kami"
            class="mt-6 inline-flex font-semibold text-emerald-600 transition hover:text-emerald-700"
          >
            Selengkapnya
            <span class="ml-2">→</span>
          </router-link>
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
            pembinaan, dan kegiatan anak-anak Panti Asuhan Amanah Umat.
          </p>
        </div>

        <!-- Program Cards -->
        <div class="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="program in programs"
            :key="program.title"
            class="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div class="aspect-[4/3] overflow-hidden">
              <img
                :src="program.image_url"
                :alt="program.title"
                class="h-full w-full object-cover transition duration-500 hover:scale-105"
              />
            </div>

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

        <div class="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
          <div
            v-for="(image, index) in gallery"
            :key="index"
            class="aspect-square overflow-hidden rounded-2xl"
          >
            <img
              :src="image"
              alt="Kegiatan anak-anak Panti Asuhan Amanah Umat"
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
        <h2 class="mx-auto max-w-3xl text-3xl font-bold text-white sm:text-4xl">
          Mari ikut mendukung perjalanan anak-anak Amanah Umat.
        </h2>

        <p class="mx-auto mt-5 max-w-2xl leading-7 text-emerald-100">
          Dukungan Anda dapat membantu memenuhi kebutuhan dan mendukung berbagai
          kegiatan anak-anak Panti Asuhan Amanah Umat.
        </p>

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
