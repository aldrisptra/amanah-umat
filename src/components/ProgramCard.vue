<template>
  <article
    class="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
  >
    <!-- Image -->
    <div class="aspect-[4/3] overflow-hidden">
      <img
        :src="program.image"
        :alt="program.title"
        class="h-full w-full object-cover transition duration-500 group-hover:scale-105"
      />
    </div>

    <!-- Content -->
    <div class="p-6">
      <!-- Category -->
      <span
        class="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
      >
        {{ program.category }}
      </span>

      <h3 class="mt-4 text-xl font-bold text-gray-900">
        {{ program.title }}
      </h3>

      <p class="mt-3 line-clamp-3 text-sm leading-7 text-gray-600">
        {{ program.description }}
      </p>

      <div class="mt-6 flex items-center justify-between">
        <span class="text-sm text-gray-500">
          {{ program.location }}
        </span>

        <button
          type="button"
          class="text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
        >
          Lihat Detail →
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
defineProps({
  program: {
    type: Object,
    required: true,
  },
});
</script>
