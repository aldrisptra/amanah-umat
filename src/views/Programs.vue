```vue
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
            Program Kami
          </span>

          <h1
            class="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
          >
            Kegiatan untuk tumbuh dan berkembang bersama.
          </h1>

          <p class="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Berbagai kegiatan yang diselenggarakan LKSA Amanah Ummat untuk
            mendukung pendidikan, pembinaan, dan tumbuh kembang anak-anak.
          </p>
        </div>
      </div>
    </section>

    <!-- =========================
         PROGRAM LIST
    ========================== -->
    <section class="bg-white py-20">
      <div class="mx-auto max-w-7xl px-5 lg:px-8">
        <div v-if="loadingPrograms" class="py-20 text-center text-gray-500">
          Memuat program...
        </div>

        <div
          v-else-if="programs.length === 0"
          class="py-20 text-center text-gray-500"
        >
          Belum ada program yang tersedia.
        </div>

        <div v-else class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="program in programs"
            :key="program.title"
            class="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div class="aspect-[4/3] overflow-hidden">
              <img
                :src="program.image_url"
                :alt="program.title"
                class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            </div>

            <div class="p-7">
              <span class="text-sm font-semibold text-emerald-600">
                {{ program.category }}
              </span>

              <h2 class="mt-2 text-2xl font-bold text-gray-900">
                {{ program.title }}
              </h2>

              <p class="mt-4 leading-7 text-gray-600">
                {{ program.description }}
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- =========================
         CTA
    ========================== -->
    <section class="px-5 pb-20 lg:px-8">
      <div
        class="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-emerald-700 px-6 py-16 text-center sm:px-12"
      >
        <h2 class="mx-auto max-w-3xl text-3xl font-bold text-white sm:text-4xl">
          Dukung kegiatan anak-anak Amanah Ummat.
        </h2>

        <p class="mx-auto mt-5 max-w-2xl leading-7 text-emerald-100">
          Dukungan dari Anda dapat membantu keberlangsungan berbagai kegiatan
          dan kebutuhan anak-anak di LKSA Amanah Ummat.
        </p>

        <router-link
          to="/donasi"
          class="mt-8 inline-flex rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-emerald-700 shadow-lg transition hover:bg-gray-100"
        >
          Donasi Sekarang
        </router-link>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { supabase } from "../lib/supabase";

const programs = ref([]);
const loadingPrograms = ref(true);

const getPrograms = async () => {
  const { data, error } = await supabase
    .from("programs")
    .select("*")
    .order("created_at", { ascending: true });

  console.log("PUBLIC PROGRAM DATA:", data);
  console.log("PUBLIC PROGRAM ERROR:", error);

  if (error) {
    console.error("Gagal mengambil data program:", error);
    loadingPrograms.value = false;
    return;
  }

  programs.value = data;
  loadingPrograms.value = false;
};

onMounted(() => {
  getPrograms();
});
</script>
```
