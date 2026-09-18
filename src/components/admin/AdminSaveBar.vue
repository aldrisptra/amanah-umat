<script setup>
import { CircleCheck, LoaderCircle, Save } from "lucide-vue-next";

/**
 * Bar simpan yang menempel di bagian bawah layar.
 *
 * Pada form panjang (Beranda, Donasi), tombol Simpan sebelumnya berada di
 * paling bawah sehingga harus digulir dulu. Akibatnya perubahan mudah
 * ditinggalkan tanpa disimpan. Bar ini selalu terlihat, sekaligus memberi
 * tahu apakah masih ada perubahan yang belum disimpan.
 */
defineProps({
  // Ada perubahan yang belum disimpan
  dirty: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  // Keterangan tambahan saat proses berjalan, mis. "Mengunggah foto..."
  busyLabel: { type: String, default: "" },
  label: { type: String, default: "Simpan Perubahan" },
});
</script>

<template>
  <div
    class="sticky bottom-0 z-20 -mx-4 mt-8 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
  >
    <div
      class="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p class="flex items-center gap-2 text-sm">
        <template v-if="saving">
          <LoaderCircle class="h-4 w-4 shrink-0 animate-spin text-emerald-600" />

          <span class="text-gray-600">
            {{ busyLabel || "Menyimpan..." }}
          </span>
        </template>

        <template v-else-if="dirty">
          <span
            class="h-2 w-2 shrink-0 rounded-full bg-amber-500"
            aria-hidden="true"
          ></span>

          <span class="font-medium text-amber-700">
            Ada perubahan yang belum disimpan
          </span>
        </template>

        <template v-else>
          <CircleCheck class="h-4 w-4 shrink-0 text-gray-400" />

          <span class="text-gray-500">Semua perubahan sudah tersimpan</span>
        </template>
      </p>

      <button
        type="submit"
        :disabled="saving"
        class="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Save class="h-4 w-4" />
        {{ saving ? "Menyimpan..." : label }}
      </button>
    </div>
  </div>
</template>
