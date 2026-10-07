<script setup>
/**
 * Logo satu unit (LKSA / TPQ).
 *
 * Bila admin sudah mengunggah logo, gambar itu yang dipakai. Selama belum
 * ada, ditampilkan kotak hijau berisi nama singkat unit - supaya kartu
 * pilihan tidak pernah terlihat kosong atau rusak.
 */
defineProps({
  unit: { type: Object, required: true },
  // Kelas ukuran, mis. "h-24 w-24"
  sizeClass: { type: String, default: "h-20 w-20" },
});
</script>

<template>
  <img
    v-if="unit.logo_url"
    :src="unit.logo_url"
    :alt="`Logo ${unit.short_name}`"
    class="shrink-0 object-contain"
    :class="sizeClass"
  />

  <span
    v-else
    aria-hidden="true"
    class="flex shrink-0 items-center justify-center rounded-3xl bg-emerald-600 text-lg font-bold tracking-wide text-white"
    :class="sizeClass"
  >
    {{ unit.short_name }}
  </span>
</template>
