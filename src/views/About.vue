<script setup>
import { onMounted, ref } from "vue";
import { supabase } from "../lib/supabase";
import { ambilIkonNilai } from "../lib/aboutIcons";

const about = ref(null);
const loadingAbout = ref(true);

// Dua bagian tambahan ini berasal dari tabel yang dibuat menyusul.
// Selama tabelnya belum ada, bagiannya cukup tidak ditampilkan -
// halaman tetap utuh dan tidak menampilkan pesan galat.
const values = ref([]);
const milestones = ref([]);

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

const tabelBelumAda = (error) =>
  error?.code === "PGRST205" || error?.code === "42P01";

const getValues = async () => {
  const { data, error } = await supabase
    .from("about_values")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (!tabelBelumAda(error)) {
      console.error("Gagal mengambil nilai:", error);
    }
    return;
  }

  values.value = data || [];
};

const getMilestones = async () => {
  const { data, error } = await supabase
    .from("about_milestones")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (!tabelBelumAda(error)) {
      console.error("Gagal mengambil perjalanan:", error);
    }
    return;
  }

  milestones.value = data || [];
};

onMounted(() => {
  getAbout();
  getValues();
  getMilestones();
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
        <div v-if="loadingAbout" class="grid items-center gap-12 lg:grid-cols-2">
          <div class="skeleton h-[450px] rounded-3xl"></div>

          <div class="space-y-4">
            <div class="skeleton h-3 w-40"></div>
            <div class="skeleton h-9 w-4/5"></div>
            <div class="skeleton h-4 w-full"></div>
            <div class="skeleton h-4 w-full"></div>
            <div class="skeleton h-4 w-full"></div>
            <div class="skeleton h-4 w-3/5"></div>
          </div>
        </div>

        <!-- Content -->
        <div v-else-if="about" class="grid items-center gap-12 lg:grid-cols-2">
          <!-- IMAGE -->
          <div
            v-reveal="{ arah: 'kiri' }"
            class="group overflow-hidden rounded-3xl"
          >
            <img
              :src="about.image_url"
              :alt="about.title"
              class="h-[450px] w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
          </div>

          <!-- TEXT -->
          <div v-reveal="{ arah: 'kanan' }">
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
         NILAI KAMI
    ========================== -->
    <section v-if="values.length" class="bg-emerald-50/60 py-20">
      <div class="mx-auto max-w-7xl px-5 lg:px-8">
        <div v-reveal class="mx-auto max-w-2xl text-center">
          <span
            class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
          >
            Nilai Kami
          </span>

          <h2
            class="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            Yang kami pegang setiap hari
          </h2>
        </div>

        <div class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <article
            v-for="(nilai, index) in values"
            :key="nilai.id"
            v-reveal="{ delay: index * 100 }"
            class="group rounded-3xl border border-emerald-100 bg-white p-7 transition-all duration-300 hover:-translate-y-2 hover:border-emerald-200 hover:shadow-xl"
          >
            <div
              class="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white"
            >
              <component :is="ambilIkonNilai(nilai.icon)" class="h-6 w-6" />
            </div>

            <h3 class="mt-5 text-lg font-bold text-gray-900">
              {{ nilai.title }}
            </h3>

            <p class="mt-2 text-sm leading-7 text-gray-600">
              {{ nilai.description }}
            </p>
          </article>
        </div>
      </div>
    </section>

    <!-- =========================
         PERJALANAN KAMI
    ========================== -->
    <section v-if="milestones.length" class="bg-white py-20">
      <div class="mx-auto max-w-5xl px-5 lg:px-8">
        <div v-reveal class="mx-auto max-w-2xl text-center">
          <span
            class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
          >
            Perjalanan Kami
          </span>

          <h2
            class="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
          >
            Langkah demi langkah bersama anak-anak
          </h2>
        </div>

        <!-- Garis waktu.
             Di layar lebar, isi berselang-seling kiri dan kanan mengapit
             satu garis di tengah. Di ponsel semuanya menumpuk di kanan
             garis, karena dua kolom terlalu sempit untuk dibaca. -->
        <div class="relative mt-14">
          <!-- Garis vertikal -->
          <span
            aria-hidden="true"
            class="absolute inset-y-0 left-4 w-px bg-linear-to-b from-emerald-200 via-emerald-300 to-transparent md:left-1/2 md:-translate-x-px"
          ></span>

          <div class="space-y-10">
            <div
              v-for="(langkah, index) in milestones"
              :key="langkah.id"
              v-reveal="{ arah: index % 2 === 0 ? 'kanan' : 'kiri' }"
              class="relative pl-12 md:flex md:items-center md:gap-8 md:pl-0"
              :class="index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'"
            >
              <!-- Titik pada garis -->
              <span
                aria-hidden="true"
                class="absolute left-4 top-6 flex h-4 w-4 -translate-x-1/2 items-center justify-center md:left-1/2"
              >
                <span
                  class="absolute h-4 w-4 animate-ping rounded-full bg-emerald-400/50 motion-reduce:hidden"
                ></span>
                <span
                  class="relative h-3 w-3 rounded-full border-2 border-white bg-emerald-600 shadow"
                ></span>
              </span>

              <!-- Kartu isi -->
              <div class="md:w-1/2" :class="index % 2 === 0 ? 'md:pr-8 md:text-right' : 'md:pl-8'">
                <div
                  class="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                >
                  <span
                    class="inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold tracking-wide text-white"
                  >
                    {{ langkah.year }}
                  </span>

                  <h3 class="mt-3 text-lg font-bold text-gray-900">
                    {{ langkah.title }}
                  </h3>

                  <p
                    v-if="langkah.description"
                    class="mt-2 text-sm leading-7 text-gray-600"
                  >
                    {{ langkah.description }}
                  </p>
                </div>
              </div>

              <!-- Penyeimbang agar kartu tetap separuh lebar di layar besar -->
              <div class="hidden md:block md:w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- =========================
         SIMPLE CTA
    ========================== -->
    <section class="bg-emerald-50 px-5 py-20 lg:px-8">
      <div
        v-reveal
        class="mx-auto max-w-7xl rounded-3xl bg-linear-to-br from-emerald-700 to-emerald-600 px-6 py-16 text-center shadow-2xl shadow-emerald-900/20 sm:px-12"
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
