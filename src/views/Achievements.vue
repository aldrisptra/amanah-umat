<script setup>
import { computed, onMounted, ref } from "vue";
import { Award, Trophy } from "lucide-vue-next";
import { supabase } from "../lib/supabase";

/**
 * Halaman Prestasi.
 *
 * Isinya berasal dari tabel `achievements` yang dibuat menyusul lewat berkas
 * supabase/achievements.sql. Selama tabelnya belum ada, halaman tetap tampil
 * utuh dengan keterangan "belum tersedia" - bukan pesan galat.
 */

const achievements = ref([]);
const loading = ref(true);
const activeCategory = ref("Semua");

const tabelBelumAda = (error) =>
  error?.code === "PGRST205" || error?.code === "42P01";

const getAchievements = async () => {
  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (!tabelBelumAda(error)) {
      console.error("Gagal mengambil data prestasi:", error);
    }

    loading.value = false;
    return;
  }

  achievements.value = data || [];
  loading.value = false;
};

onMounted(getAchievements);

// Kategori diambil dari data, bukan daftar tetap. Kategori baru yang diisi
// lewat panel admin langsung muncul sebagai tombol penyaring, dan kategori
// yang belum punya isi tidak pernah menampilkan hasil kosong.
const categories = computed(() => {
  const dariData = achievements.value
    .map((item) => item.category)
    .filter(Boolean);

  return ["Semua", ...new Set(dariData)];
});

const filtered = computed(() => {
  if (activeCategory.value === "Semua") return achievements.value;

  return achievements.value.filter(
    (item) => item.category === activeCategory.value,
  );
});
</script>

<template>
  <div>
    <!-- =========================
         HERO
    ========================== -->
    <section class="bg-emerald-50">
      <div class="mx-auto max-w-7xl px-5 pb-20 pt-32 lg:px-8 lg:pb-24 lg:pt-40">
        <div class="max-w-3xl">
          <span
            class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
          >
            Prestasi
          </span>

          <h1
            class="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
          >
            Capaian anak-anak dan LKSA Amanah Ummat.
          </h1>

          <p class="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Setiap penghargaan di halaman ini adalah buah kerja keras anak-anak,
            pendampingan para pengurus, dan dukungan para donatur.
          </p>

          <!-- Angka ringkas -->
          <div v-if="!loading && achievements.length" class="mt-9">
            <div
              class="inline-block rounded-2xl border border-emerald-100 bg-white px-6 py-4"
            >
              <p class="text-3xl font-bold text-emerald-600">
                {{ achievements.length }}
              </p>

              <p class="mt-1 text-sm text-gray-500">Prestasi tercatat</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- =========================
         DAFTAR PRESTASI
    ========================== -->
    <section class="bg-white py-20">
      <div class="mx-auto max-w-7xl px-5 lg:px-8">
        <!-- Penyaring kategori -->
        <div v-if="categories.length > 1" class="mb-10 flex flex-wrap gap-3">
          <button
            v-for="category in categories"
            :key="category"
            @click="activeCategory = category"
            class="rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
            :class="
              activeCategory === category
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
            "
          >
            {{ category }}
          </button>
        </div>

        <!-- Memuat -->
        <div v-if="loading" class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="n in 6"
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

        <!-- Belum ada isi sama sekali -->
        <div
          v-else-if="achievements.length === 0"
          class="rounded-3xl border border-dashed border-gray-300 py-20 text-center"
        >
          <div
            class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"
          >
            <Trophy class="h-7 w-7" />
          </div>

          <p class="mt-5 font-semibold text-gray-900">
            Daftar prestasi belum tersedia
          </p>

          <p class="mx-auto mt-2 max-w-md px-5 text-sm leading-7 text-gray-500">
            Halaman ini akan segera diisi dengan penghargaan dan capaian
            anak-anak LKSA Amanah Ummat.
          </p>
        </div>

        <!-- Kosong karena penyaring -->
        <div
          v-else-if="filtered.length === 0"
          class="py-20 text-center text-gray-500"
        >
          Belum ada prestasi pada kategori ini.
        </div>

        <!-- Kartu prestasi -->
        <div v-else class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="(item, index) in filtered"
            :key="item.id"
            v-reveal="{ delay: (index % 6) * 90 }"
            class="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:ring-emerald-200"
          >
            <!-- Foto piagam / dokumentasi.
                 Bila prestasi belum berfoto, kotaknya tetap ada supaya tinggi
                 kartu seragam - diisi lambang piala di atas latar hijau. -->
            <div class="aspect-4/3 overflow-hidden">
              <img
                v-if="item.image_url"
                :src="item.image_url"
                :alt="item.title"
                loading="lazy"
                class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              />

              <div
                v-else
                class="flex h-full w-full items-center justify-center bg-linear-to-br from-emerald-600 to-emerald-500"
              >
                <Trophy
                  class="h-12 w-12 text-white/80 transition-transform duration-500 group-hover:scale-110"
                  aria-hidden="true"
                />
              </div>
            </div>

            <!-- Isi -->
            <div class="flex flex-1 flex-col p-6">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  v-if="item.year"
                  class="rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white"
                >
                  {{ item.year }}
                </span>

                <span
                  v-if="item.category"
                  class="text-xs font-semibold uppercase tracking-wider text-emerald-600"
                >
                  {{ item.category }}
                </span>
              </div>

              <h2 class="mt-3 text-lg font-bold leading-7 text-gray-900">
                {{ item.title }}
              </h2>

              <p
                v-if="item.organizer"
                class="mt-2 flex items-start gap-2 text-sm text-gray-500"
              >
                <Award class="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                {{ item.organizer }}
              </p>

              <p
                v-if="item.description"
                class="mt-3 whitespace-pre-line text-sm leading-7 text-gray-600"
              >
                {{ item.description }}
              </p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- =========================
         AJAKAN DONASI
    ========================== -->
    <section class="bg-emerald-50 px-5 py-20 lg:px-8">
      <div
        v-reveal
        class="mx-auto max-w-7xl rounded-3xl bg-linear-to-br from-emerald-700 to-emerald-600 px-6 py-16 text-center shadow-2xl shadow-emerald-900/20 sm:px-12"
      >
        <h2 class="mx-auto max-w-3xl text-3xl font-bold text-white sm:text-4xl">
          Setiap prestasi lahir dari dukungan yang tidak terlihat.
        </h2>

        <p class="mx-auto mt-5 max-w-2xl leading-7 text-emerald-100">
          Dukungan Anda membantu anak-anak tetap bersekolah, belajar, dan
          berlatih hingga mampu meraih capaian seperti di atas.
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
