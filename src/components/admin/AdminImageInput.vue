<script setup>
import { computed, ref } from "vue";
import { ImageIcon, Trash2, UploadCloud } from "lucide-vue-next";
import { MAX_IMAGE_SIZE_MB, validateImageFile } from "../../lib/utils";

/**
 * Pemilih foto dengan seret-dan-lepas, pratinjau, dan validasi.
 *
 * Input file bawaan browser hanya menampilkan tombol kecil bertuliskan
 * "Choose File" dan nama berkas, sehingga pengurus sulit memastikan foto mana
 * yang akan terpasang. Komponen ini selalu menampilkan pratinjau besar.
 */
const props = defineProps({
  // URL pratinjau: bisa foto yang sudah tersimpan, atau blob: foto baru
  previewUrl: { type: String, default: "" },
  // Nama berkas yang baru dipilih (kosong bila memakai foto lama)
  fileName: { type: String, default: "" },
  hint: { type: String, default: "" },
  // Perbandingan sisi kotak pratinjau, mengikuti bentuk di website
  aspect: { type: String, default: "16/9" },
  // "cover" memenuhi kotak dan memotong sisi berlebih - cocok untuk foto.
  // "contain" menampilkan gambar utuh tanpa terpotong - wajib untuk logo
  // dan kode QRIS, yang akan rusak maknanya bila terpotong.
  fit: { type: String, default: "cover" },
  disabled: { type: Boolean, default: false },
});

const emit = defineEmits(["select", "error", "clear"]);

const inputRef = ref(null);
const sedangDiseret = ref(false);

const adaFotoBaru = computed(() => Boolean(props.fileName));

const prosesFile = (file) => {
  if (!file) return;

  const pesanError = validateImageFile(file);

  if (pesanError) {
    emit("error", pesanError);

    if (inputRef.value) inputRef.value.value = "";

    return;
  }

  emit("select", file);
};

const handleChange = (event) => {
  prosesFile(event.target.files?.[0]);
};

const handleDrop = (event) => {
  sedangDiseret.value = false;

  if (props.disabled) return;

  prosesFile(event.dataTransfer?.files?.[0]);
};

const bukaPemilih = () => {
  if (props.disabled) return;

  inputRef.value?.click();
};

const batalkanFotoBaru = () => {
  if (inputRef.value) inputRef.value.value = "";

  emit("clear");
};
</script>

<template>
  <div>
    <p v-if="hint" class="mb-2 text-xs leading-5 text-gray-500">
      {{ hint }}
    </p>

    <!-- Pratinjau -->
    <div
      class="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
      :style="{ aspectRatio: aspect }"
    >
      <img
        v-if="previewUrl"
        :src="previewUrl"
        alt="Pratinjau foto"
        class="h-full w-full"
        :class="fit === 'contain' ? 'object-contain p-3' : 'object-cover'"
      />

      <div
        v-else
        class="flex h-full flex-col items-center justify-center gap-2 text-gray-400"
      >
        <ImageIcon class="h-8 w-8" />
        <p class="text-sm">Belum ada foto</p>
      </div>

      <span
        v-if="adaFotoBaru"
        class="absolute left-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white shadow"
      >
        Foto baru — belum disimpan
      </span>
    </div>

    <!-- Area pilih / seret -->
    <div
      class="mt-3 rounded-2xl border-2 border-dashed p-4 transition"
      :class="[
        sedangDiseret
          ? 'border-emerald-400 bg-emerald-50'
          : 'border-gray-300 bg-white',
        disabled ? 'opacity-60' : 'cursor-pointer hover:border-emerald-300',
      ]"
      @click="bukaPemilih"
      @dragover.prevent="sedangDiseret = true"
      @dragleave.prevent="sedangDiseret = false"
      @drop.prevent="handleDrop"
    >
      <div class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700"
        >
          <UploadCloud class="h-5 w-5" />
        </div>

        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-gray-800">
            {{ previewUrl ? "Ganti foto" : "Pilih foto" }}
          </p>

          <p class="mt-0.5 truncate text-xs text-gray-500">
            <template v-if="adaFotoBaru">
              {{ fileName }}
            </template>

            <template v-else>
              Klik di sini, atau seret foto ke area ini
            </template>
          </p>
        </div>

        <button
          v-if="adaFotoBaru"
          type="button"
          @click.stop="batalkanFotoBaru"
          class="flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 class="h-3.5 w-3.5" />
          Batalkan
        </button>
      </div>

      <input
        ref="inputRef"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        :disabled="disabled"
        class="hidden"
        @change="handleChange"
      />
    </div>

    <p class="mt-2 text-xs text-gray-400">
      Format JPG, PNG, atau WebP. Ukuran maksimal {{ MAX_IMAGE_SIZE_MB }} MB.
    </p>
  </div>
</template>
