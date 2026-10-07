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
        <div v-if="loadingUnits" class="grid gap-8 md:grid-cols-2">
          <div
            v-for="n in 2"
            :key="n"
            class="skeleton h-80 rounded-3xl"
          ></div>
        </div>

        <div
          v-else-if="units.length"
          class="mx-auto grid gap-8 md:grid-cols-2"
          :class="units.length === 1 ? 'max-w-xl md:grid-cols-1' : ''"
        >
          <router-link
            v-for="(unit, index) in units"
            :key="unit.slug"
            v-reveal="{ delay: index * 120 }"
            :to="`/program/${unit.slug}`"
            class="group flex flex-col items-center rounded-3xl border border-emerald-100 bg-emerald-50/40 p-10 text-center transition-all duration-300 hover:-translate-y-2 hover:border-emerald-300 hover:bg-white hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-emerald-600"
          >
            <UnitLogo
              :unit="unit"
              size-class="h-28 w-28 transition-transform duration-500 group-hover:scale-110"
            />

            <span
              class="mt-7 inline-flex rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold tracking-wide text-white"
            >
              {{ unit.short_name }}
            </span>

            <h2 class="mt-4 text-2xl font-bold leading-snug text-gray-900">
              {{ unit.name }}
            </h2>

            <p
              v-if="unit.description"
              class="mt-4 max-w-md leading-7 text-gray-600"
            >
              {{ unit.description }}
            </p>

            <span
              class="mt-8 inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition group-hover:bg-emerald-700"
            >
              Lihat Program {{ unit.short_name }}
              <ArrowRight
                class="h-4 w-4 transition-transform group-hover:translate-x-1"
              />
            </span>

            <span
              v-if="!loadingPrograms"
              class="mt-3 text-xs font-medium text-gray-500"
            >
              {{ jumlahProgram(unit.slug) }} program
            </span>
          </router-link>
        </div>

        <!-- Tabel unit belum dibuat: tampilkan seluruh program seperti biasa -->
        <ProgramGrid
          v-else
          :programs="programs"
          :loading="loadingPrograms"
        />
      </div>
    </section>

    <ProgramCta :title="teks.cta_title" :description="teks.cta_description" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from "vue";
import { ArrowRight } from "lucide-vue-next";
import { supabase } from "../lib/supabase";
import { cocokUnit, getUnits } from "../lib/units";
import { getProgramPage, isiProgramPage } from "../lib/programPage";
import UnitLogo from "../components/UnitLogo.vue";
import ProgramGrid from "../components/ProgramGrid.vue";
import ProgramCta from "../components/ProgramCta.vue";

const programs = ref([]);
const loadingPrograms = ref(true);

const units = ref([]);
const loadingUnits = ref(true);

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

const jumlahProgram = (slug) =>
  programs.value.filter((program) => cocokUnit(program.unit, slug)).length;

onMounted(async () => {
  getPrograms();

  getProgramPage().then(({ data }) => {
    halaman.value = data;
  });

  units.value = await getUnits();
  loadingUnits.value = false;
});
</script>
