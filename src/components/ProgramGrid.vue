<script setup>
import { labelUnit } from "../lib/units";

/**
 * Daftar kartu program, dipakai halaman Program maupun halaman per unit.
 */
const props = defineProps({
  programs: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
  // Daftar unit, untuk label kecil "LKSA" / "TPQ" di kartu
  units: { type: Array, default: () => [] },
  // Di halaman satu unit, label unit tidak perlu diulang di setiap kartu
  showUnit: { type: Boolean, default: true },
  emptyText: { type: String, default: "Belum ada program yang tersedia." },
});

const tandaUnit = (program) =>
  props.showUnit ? labelUnit(props.units, program.unit) : "";
</script>

<template>
  <div v-if="loading" class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
    <div
      v-for="n in 6"
      :key="n"
      class="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm"
    >
      <div class="skeleton aspect-4/3 rounded-none"></div>

      <div class="space-y-3 p-7">
        <div class="skeleton h-3 w-20"></div>
        <div class="skeleton h-5 w-3/4"></div>
        <div class="skeleton h-3 w-full"></div>
        <div class="skeleton h-3 w-5/6"></div>
      </div>
    </div>
  </div>

  <div v-else-if="programs.length === 0" class="py-20 text-center text-gray-500">
    {{ emptyText }}
  </div>

  <div v-else class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
    <article
      v-for="(program, index) in programs"
      :key="program.id"
      v-reveal="{ delay: (index % 3) * 110 }"
      class="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:border-emerald-200 hover:shadow-xl"
    >
      <div class="aspect-4/3 overflow-hidden">
        <img
          :src="program.image_url"
          :alt="program.title"
          loading="lazy"
          class="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </div>

      <div class="p-7">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-2">
          <span
            v-if="program.category"
            class="text-sm font-semibold text-emerald-600"
          >
            {{ program.category }}
          </span>

          <span
            v-if="tandaUnit(program)"
            class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600"
          >
            {{ tandaUnit(program) }}
          </span>
        </div>

        <h2 class="mt-2 text-2xl font-bold text-gray-900">
          {{ program.title }}
        </h2>

        <p class="mt-4 leading-7 text-gray-600">
          {{ program.description }}
        </p>
      </div>
    </article>
  </div>
</template>
