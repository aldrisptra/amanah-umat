<script setup>
import { onMounted, ref } from "vue";
import { supabase } from "../lib/supabase";

const about = ref(null);
const loadingAbout = ref(true);

const getAbout = async () => {
  const { data, error } = await supabase
    .from("about")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1);

  console.log("DATA ABOUT:", data);
  console.log("ERROR ABOUT:", error);

  if (error) {
    console.error("Gagal mengambil data tentang kami:", error);
    loadingAbout.value = false;
    return;
  }

  if (data && data.length > 0) {
    about.value = data[0];
  }

  loadingAbout.value = false;
};

onMounted(() => {
  getAbout();
});
</script>

<template>
  <div>
    <!-- =========================
         HERO
    ========================== -->
    <section class="bg-emerald-50">
      <div class="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
        <div class="max-w-3xl">
          <span
            class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
          >
            Tentang Kami
          </span>

          <h1
            class="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
          >
            Mengenal LKSA Amanah Ummat.
          </h1>

          <p class="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Mengenal lebih dekat tempat kami mendampingi dan membersamai
            anak-anak LKSA Amanah Ummat.
          </p>
        </div>
      </div>
    </section>

    <!-- =========================
         ABOUT CONTENT
    ========================== -->
    <section class="bg-white py-20">
      <div class="mx-auto max-w-7xl px-5 lg:px-8">
        <!-- Loading -->
        <div v-if="loadingAbout" class="py-20 text-center text-gray-500">
          Memuat informasi...
        </div>

        <!-- Content -->
        <div v-else-if="about" class="grid items-center gap-12 lg:grid-cols-2">
          <!-- IMAGE -->
          <div class="overflow-hidden rounded-3xl">
            <img
              :src="about.image_url"
              :alt="about.title"
              class="h-[450px] w-full object-cover"
            />
          </div>

          <!-- TEXT -->
          <div>
            <span
              class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
            >
              Tentang Amanah Ummat
            </span>

            <h2
              class="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            >
              {{ about.title }}
            </h2>

            <p class="mt-6 whitespace-pre-line leading-8 text-gray-600">
              {{ about.description }}
            </p>
          </div>
        </div>

        <!-- Empty -->
        <div v-else class="py-20 text-center text-gray-500">
          Informasi tentang LKSA belum tersedia.
        </div>
      </div>
    </section>

    <!-- =========================
         SIMPLE CTA
    ========================== -->
    <section class="bg-emerald-50 px-5 py-20 lg:px-8">
      <div
        class="mx-auto max-w-7xl rounded-3xl bg-emerald-700 px-6 py-16 text-center sm:px-12"
      >
        <h2 class="mx-auto max-w-3xl text-3xl font-bold text-white sm:text-4xl">
          Mari ikut mendukung anak-anak Amanah Ummat.
        </h2>

        <p class="mx-auto mt-5 max-w-2xl leading-7 text-emerald-100">
          Bersama, kita dapat membantu memenuhi kebutuhan dan mendukung
          perjalanan anak-anak di LKSA Amanah Ummat.
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
