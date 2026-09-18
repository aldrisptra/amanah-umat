<script setup>
import { computed, useId } from "vue";

/**
 * Pembungkus satu isian form.
 *
 * Tujuannya menjawab tiga pertanyaan yang paling sering muncul di benak
 * pengurus saat mengisi CMS:
 *   1. Ini untuk apa?        -> `hint`
 *   2. Wajib diisi atau tidak? -> `required`
 *   3. Boleh sepanjang apa?   -> `max` (penghitung karakter)
 */
const props = defineProps({
  label: { type: String, required: true },
  hint: { type: String, default: "" },
  required: { type: Boolean, default: false },
  // Nilai saat ini, hanya dipakai untuk menghitung jumlah karakter
  value: { type: String, default: "" },
  // Panjang yang disarankan; melewatinya tidak menghalangi penyimpanan,
  // hanya memberi peringatan agar tampilan website tetap rapi.
  max: { type: Number, default: 0 },
});

const fieldId = useId();

const jumlahKarakter = computed(() => props.value?.length || 0);

const terlaluPanjang = computed(
  () => props.max > 0 && jumlahKarakter.value > props.max,
);
</script>

<template>
  <div>
    <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <label :for="fieldId" class="text-sm font-semibold text-gray-800">
        {{ label }}

        <span v-if="required" class="text-red-500" aria-hidden="true">*</span>

        <span v-else class="ml-1 text-xs font-normal text-gray-400">
          (boleh dikosongkan)
        </span>
      </label>

      <span
        v-if="max > 0"
        class="text-xs tabular-nums"
        :class="terlaluPanjang ? 'font-semibold text-amber-600' : 'text-gray-400'"
      >
        {{ jumlahKarakter }} / {{ max }}
      </span>
    </div>

    <p v-if="hint" class="mt-1 text-xs leading-5 text-gray-500">
      {{ hint }}
    </p>

    <div class="mt-2">
      <slot :id="fieldId" />
    </div>

    <p v-if="terlaluPanjang" class="mt-1.5 text-xs text-amber-600">
      Tulisan cukup panjang. Masih bisa disimpan, tetapi tampilan di website
      akan lebih rapi bila diperpendek.
    </p>
  </div>
</template>
