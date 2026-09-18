<script setup>
import { onBeforeUnmount, watch } from "vue";
import { TriangleAlert } from "lucide-vue-next";

/**
 * Pengganti window.confirm().
 *
 * Kotak konfirmasi bawaan browser tampil sebagai jendela sistem yang asing,
 * tanpa penjelasan, dan pada ponsel sering terlihat seperti peringatan virus.
 * Komponen ini memakai bahasa yang sama dengan sisa panel.
 */
const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  message: { type: String, default: "" },
  confirmLabel: { type: String, default: "Ya, lanjutkan" },
  cancelLabel: { type: String, default: "Batal" },
  danger: { type: Boolean, default: false },
  busy: { type: Boolean, default: false },
});

const emit = defineEmits(["confirm", "cancel"]);

const handleKeydown = (event) => {
  if (event.key === "Escape" && !props.busy) emit("cancel");
};

watch(
  () => props.open,
  (terbuka) => {
    document.body.style.overflow = terbuka ? "hidden" : "";

    if (terbuka) {
      window.addEventListener("keydown", handleKeydown);
    } else {
      window.removeEventListener("keydown", handleKeydown);
    }
  },
);

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  document.body.style.overflow = "";
});
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 sm:items-center"
    role="dialog"
    aria-modal="true"
    @click.self="!busy && emit('cancel')"
  >
    <div class="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl sm:p-7">
      <div class="flex gap-4">
        <div
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          :class="danger ? 'bg-red-100' : 'bg-amber-100'"
        >
          <TriangleAlert
            class="h-5 w-5"
            :class="danger ? 'text-red-600' : 'text-amber-600'"
          />
        </div>

        <div class="min-w-0">
          <h2 class="text-lg font-bold text-gray-900">{{ title }}</h2>

          <p v-if="message" class="mt-2 text-sm leading-6 text-gray-600">
            {{ message }}
          </p>
        </div>
      </div>

      <div class="mt-7 flex flex-col-reverse gap-3 sm:flex-row">
        <button
          type="button"
          :disabled="busy"
          @click="emit('cancel')"
          class="flex-1 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {{ cancelLabel }}
        </button>

        <button
          type="button"
          :disabled="busy"
          @click="emit('confirm')"
          class="flex-1 rounded-xl px-5 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          :class="
            danger
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-emerald-600 hover:bg-emerald-700'
          "
        >
          {{ busy ? "Memproses..." : confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
