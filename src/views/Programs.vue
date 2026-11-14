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
            {{ teks.eyebrow }}
          </span>

          <h1
            class="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
          >
            {{ teks.title }}
          </h1>

          <p class="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            {{ teks.description }}
          </p>
        </div>
      </div>
    </section>

    <!-- =========================
         PILIHAN UNIT
    ========================== -->
    <section class="bg-white py-20">
      <div class="mx-auto max-w-7xl px-5 lg:px-8">
        <div class="mb-10 flex flex-wrap gap-3" aria-label="Kategori kegiatan">
          <button v-for="category in categories" :key="category" type="button"
            @click="activeCategory = category" :aria-pressed="activeCategory === category"
            class="rounded-full px-5 py-2.5 text-sm font-semibold transition"
            :class="activeCategory === category ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-emerald-50'">
            {{ category }}
          </button>
        </div>
        <ProgramGrid :programs="filteredPrograms" :loading="loadingPrograms" :show-unit="false" />
      </div>
    </section>

    <ProgramCta :title="teks.cta_title" :description="teks.cta_description" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { supabase } from "../lib/supabase";
import { getProgramCategories, programCategoryOptions } from "../lib/programCategories";
import { getProgramPage, isiProgramPage } from "../lib/programPage";
import ProgramGrid from "../components/ProgramGrid.vue";
import ProgramCta from "../components/ProgramCta.vue";

const programs = ref([]);
const loadingPrograms = ref(true);

const activeCategory = ref("Semua");
const savedCategories = ref([]);
const categories = computed(() => ["Semua", ...programCategoryOptions(savedCategories.value, programs.value)]);
const filteredPrograms = computed(() => activeCategory.value === "Semua" ? programs.value : programs.value.filter(p => p.category?.trim() === activeCategory.value));

const halaman = ref(null);
const teks = computed(() => isiProgramPage(halaman.value));

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

onMounted(async () => {
  getPrograms();
  getProgramCategories().then(result => { savedCategories.value = result.names; }).catch(console.error);

  getProgramPage().then(({ data }) => {
    halaman.value = data;
  });


});
</script>
