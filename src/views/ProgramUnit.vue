<template>
  <div>
    <!-- =========================
         HERO
    ========================== -->
    <section class="bg-emerald-50">
      <div class="mx-auto max-w-7xl px-5 pb-20 pt-32 lg:px-8 lg:pb-24 lg:pt-40">
        <router-link
          to="/program"
          class="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-900"
        >
          <ArrowLeft class="h-4 w-4" />
          Semua unit
        </router-link>

        <div v-if="loadingUnits" class="mt-8 flex items-center gap-6">
          <div class="skeleton h-24 w-24 rounded-3xl"></div>

          <div class="flex-1 space-y-4">
            <div class="skeleton h-4 w-24"></div>
            <div class="skeleton h-10 w-2/3"></div>
          </div>
        </div>

        <div
          v-else-if="unit"
          class="mt-8 flex flex-col gap-8 sm:flex-row sm:items-center"
        >
          <UnitLogo :unit="unit" size-class="h-24 w-24 sm:h-32 sm:w-32" />

          <div class="max-w-3xl">
            <span
              class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
            >
              {{ unit.name }}
            </span>

            <h1
              class="mt-3 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
            >
              {{ judul }}
            </h1>

            <p
              v-if="penjelasan"
              class="mt-6 max-w-2xl text-lg leading-8 text-gray-600"
            >
              {{ penjelasan }}
            </p>
          </div>
        </div>

        <div v-else class="mt-8 max-w-3xl">
          <h1
            class="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
          >
            Unit tidak ditemukan.
          </h1>

          <p class="mt-6 text-lg leading-8 text-gray-600">
            Alamat yang Anda buka tidak cocok dengan unit mana pun. Silakan
            pilih unit dari halaman Program.
          </p>
        </div>
      </div>
    </section>

    <!-- =========================
         DAFTAR PROGRAM
    ========================== -->
    <section v-if="loadingUnits || unit" class="bg-white py-20">
      <div class="mx-auto max-w-7xl px-5 lg:px-8">
        <ProgramGrid
          :programs="programTampil"
          :loading="loadingPrograms || loadingUnits"
          :show-unit="false"
          empty-text="Belum ada program untuk unit ini."
        />

        <!-- Pindah ke unit lain tanpa harus kembali dulu -->
        <div
          v-if="unitLain.length"
          class="mt-16 flex flex-col items-center gap-4 border-t border-gray-100 pt-12 sm:flex-row sm:justify-center"
        >
          <p class="text-sm text-gray-500">Lihat juga:</p>

          <router-link
            v-for="lain in unitLain"
            :key="lain.slug"
            :to="`/program/${lain.slug}`"
            class="inline-flex items-center gap-3 rounded-full border border-gray-200 bg-white py-2 pl-2 pr-5 text-sm font-semibold text-gray-700 transition hover:border-emerald-200 hover:text-emerald-700"
          >
            <UnitLogo :unit="lain" size-class="h-9 w-9 rounded-full! text-[10px]!" />
            Program {{ lain.short_name }}
          </router-link>
        </div>
      </div>
    </section>

    <ProgramCta :title="teks.cta_title" :description="teks.cta_description" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch } from "vue";
import { useRoute } from "vue-router";
import { ArrowLeft } from "lucide-vue-next";
import { supabase } from "../lib/supabase";
import { cocokUnit, getUnits } from "../lib/units";
import { getProgramPage, isiProgramPage } from "../lib/programPage";
import { terapkanMetaHalaman } from "../lib/seo";
import UnitLogo from "../components/UnitLogo.vue";
import ProgramGrid from "../components/ProgramGrid.vue";
import ProgramCta from "../components/ProgramCta.vue";

const route = useRoute();

const programs = ref([]);
const loadingPrograms = ref(true);

const units = ref([]);
const loadingUnits = ref(true);

const halaman = ref(null);
const teks = computed(() => isiProgramPage(halaman.value));

const unit = computed(
  () => units.value.find((item) => item.slug === route.params.unit) || null,
);

const unitLain = computed(() =>
  units.value.filter((item) => item.slug !== route.params.unit),
);

const judul = computed(
  () => unit.value?.page_title?.trim() || `Program ${unit.value?.short_name}`,
);

const penjelasan = computed(
  () => unit.value?.page_description?.trim() || unit.value?.description || "",
);

const programTampil = computed(() =>
  programs.value.filter((program) =>
    cocokUnit(program.unit, route.params.unit),
  ),
);

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

// Judul tab mengikuti unit yang dibuka. Router hanya tahu judul umum,
// karena nama unit baru diketahui setelah data dimuat.
watch(unit, (aktif) => {
  if (!aktif) return;

  terapkanMetaHalaman({
    title: judul.value,
    description: penjelasan.value.slice(0, 160),
    path: route.path,
  });
});

onMounted(async () => {
  getPrograms();

  getProgramPage().then(({ data }) => {
    halaman.value = data;
  });

  units.value = await getUnits();
  loadingUnits.value = false;
});
</script>
