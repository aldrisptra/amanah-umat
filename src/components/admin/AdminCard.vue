<script setup>
/**
 * Satu kelompok isian di dalam form.
 *
 * Form yang panjang dipecah menjadi beberapa kartu bertajuk, supaya pengurus
 * bisa mengenali bagian mana yang sedang diubah tanpa harus membaca semuanya.
 */
defineProps({
  title: { type: String, default: "" },
  description: { type: String, default: "" },
  // Nomor langkah kecil di sebelah judul, mis. 1, 2, 3
  step: { type: [Number, String], default: "" },
});
</script>

<template>
  <section class="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
    <div v-if="title" class="mb-5 flex gap-3">
      <span
        v-if="step !== ''"
        class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700"
      >
        {{ step }}
      </span>

      <div class="min-w-0">
        <h2 class="text-base font-bold text-gray-900">{{ title }}</h2>

        <p v-if="description" class="mt-1 text-sm leading-6 text-gray-500">
          {{ description }}
        </p>
      </div>
    </div>

    <div class="space-y-5">
      <slot />
    </div>
  </section>
</template>
