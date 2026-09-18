<script setup>
import { CircleAlert, CircleCheck, X } from "lucide-vue-next";

/**
 * Pesan hasil tindakan (berhasil / gagal).
 *
 * Diberi ikon dan warna tegas supaya terbaca sekilas, karena inilah satu-
 * satunya cara pengurus mengetahui perubahannya benar-benar tersimpan.
 */
defineProps({
  error: { type: String, default: "" },
  success: { type: String, default: "" },
});

const emit = defineEmits(["dismiss"]);
</script>

<template>
  <div v-if="error || success" class="mb-5 space-y-3">
    <div
      v-if="error"
      role="alert"
      class="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5"
    >
      <CircleAlert class="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold text-red-800">Belum tersimpan</p>
        <p class="mt-0.5 text-sm leading-6 text-red-700">{{ error }}</p>
      </div>

      <button
        type="button"
        aria-label="Tutup pesan"
        @click="emit('dismiss')"
        class="-m-1 shrink-0 rounded-lg p-1 text-red-400 transition hover:bg-red-100 hover:text-red-600"
      >
        <X class="h-4 w-4" />
      </button>
    </div>

    <div
      v-if="success"
      role="status"
      class="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5"
    >
      <CircleCheck class="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

      <p class="min-w-0 flex-1 text-sm font-medium leading-6 text-emerald-800">
        {{ success }}
      </p>

      <button
        type="button"
        aria-label="Tutup pesan"
        @click="emit('dismiss')"
        class="-m-1 shrink-0 rounded-lg p-1 text-emerald-500 transition hover:bg-emerald-100 hover:text-emerald-700"
      >
        <X class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>
