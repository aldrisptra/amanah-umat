<script setup>
/**
 * Kotak ajakan donasi di bagian bawah halaman Program.
 */
defineProps({
  title: { type: String, required: true },
  description: { type: String, default: "" },
});
</script>

<template>
  <section class="px-5 pb-20 lg:px-8">
    <div
      v-reveal
      class="mx-auto max-w-7xl overflow-hidden rounded-3xl bg-linear-to-br from-emerald-700 to-emerald-600 px-6 py-16 text-center shadow-2xl shadow-emerald-900/20 sm:px-12"
    >
      <h2 class="mx-auto max-w-3xl text-3xl font-bold text-white sm:text-4xl">
        {{ title }}
      </h2>

      <p
        v-if="description"
        class="mx-auto mt-5 max-w-2xl leading-7 text-emerald-100"
      >
        {{ description }}
      </p>

      <router-link
        to="/donasi"
        class="mt-8 inline-flex rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-emerald-700 shadow-lg transition hover:bg-gray-100"
      >
        Donasi Sekarang
      </router-link>
    </div>
  </section>
</template>
