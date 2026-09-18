<script setup>
import { ExternalLink } from "lucide-vue-next";

/**
 * Kerangka satu halaman pengelolaan.
 *
 * Menyeragamkan judul, penjelasan singkat, dan tautan "Lihat hasilnya di
 * website" — supaya pengurus selalu tahu bagian mana dari website yang sedang
 * diubah, dan bisa langsung memeriksa hasilnya.
 */
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: "" },
  // Alamat halaman publik yang dipengaruhi halaman ini
  publicPath: { type: String, default: "" },
  // Lebar isi; form panjang lebih nyaman dibaca bila tidak terlalu lebar
  wide: { type: Boolean, default: false },
});
</script>

<template>
  <div class="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <div :class="wide ? 'mx-auto max-w-6xl' : 'mx-auto max-w-3xl'">
      <!-- Judul halaman -->
      <div
        class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div class="min-w-0">
          <h1 class="text-2xl font-bold tracking-tight text-gray-900">
            {{ title }}
          </h1>

          <p
            v-if="description"
            class="mt-2 max-w-2xl text-sm leading-6 text-gray-600"
          >
            {{ description }}
          </p>
        </div>

        <a
          v-if="publicPath"
          :href="publicPath"
          target="_blank"
          rel="noopener"
          class="inline-flex shrink-0 items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
        >
          <ExternalLink class="h-4 w-4" />
          Lihat di website
        </a>
      </div>

      <!-- Tambahan di bawah judul, mis. tombol Tambah -->
      <slot name="toolbar" />

      <div class="mt-6">
        <slot />
      </div>
    </div>
  </div>
</template>
