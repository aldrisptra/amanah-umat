<script setup>
import { useSiteIdentity } from "../lib/siteIdentity";

/**
 * Logo + nama yayasan.
 *
 * Bila admin sudah mengunggah logo, gambar itu yang dipakai. Selama belum ada,
 * ditampilkan kotak hijau berisi huruf awal nama yayasan - supaya website tidak
 * pernah terlihat kosong atau rusak.
 */
defineProps({
  // Ukuran kotak/gambar logo
  size: { type: String, default: "md" }, // "sm" | "md"
  // Tampilkan nama di sebelah logo
  showName: { type: Boolean, default: true },
  // Kelas tambahan untuk teks nama, agar cocok di latar terang maupun gelap
  nameClass: { type: String, default: "text-gray-900" },
});

const { identitas, inisial } = useSiteIdentity();

const UKURAN = {
  sm: { kotak: "h-9 w-9 rounded-lg text-sm", teks: "text-sm" },
  md: { kotak: "h-10 w-10 rounded-xl text-lg", teks: "text-xl" },
};
</script>

<template>
  <span class="flex items-center gap-3">
    <!-- Logo yang diunggah admin -->
    <img
      v-if="identitas.logo_url"
      :src="identitas.logo_url"
      :alt="`Logo ${identitas.site_name}`"
      class="shrink-0 object-contain"
      :class="UKURAN[size].kotak"
    />

    <!-- Cadangan: huruf awal nama yayasan -->
    <span
      v-else
      aria-hidden="true"
      class="flex shrink-0 items-center justify-center bg-emerald-600 font-bold text-white"
      :class="UKURAN[size].kotak"
    >
      {{ inisial }}
    </span>

    <span
      v-if="showName"
      class="truncate font-bold tracking-tight"
      :class="[UKURAN[size].teks, nameClass]"
    >
      {{ identitas.site_name }}
    </span>
  </span>
</template>
