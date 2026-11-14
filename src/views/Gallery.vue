<template>
  <div>
    <!-- =========================
         HERO
    ========================== -->
    <section class="bg-emerald-50">
      <div class="mx-auto max-w-7xl px-5 pb-20 pt-32 lg:px-8 lg:pb-24 lg:pt-40">
        <div class="max-w-3xl">
          <span
            class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
          >
            Galeri Anak
          </span>

          <h1
            class="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
          >
            Mengenal anak-anak Amanah Ummat.
          </h1>

          <p class="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Potret anak-anak binaan Amanah Ummat yang tumbuh dan belajar bersama.
          </p>
        </div>
      </div>
    </section>

    <!-- =========================
         GALLERY
    ========================== -->
    <section class="bg-white py-20">
      <div class="mx-auto max-w-7xl px-5 lg:px-8">
        <!-- FILTER -->
        <div
          v-if="categories.length > 1"
          class="mb-10 flex flex-wrap gap-3"
        >
          <button
            v-for="category in categories"
            :key="category.slug"
            @click="activeCategory = category.slug"
            class="rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
            :class="
              activeCategory === category.slug
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
            "
          >
            {{ category.name }}
          </button>
        </div>

        <!-- LOADING -->
        <div
          v-if="loadingGallery"
          class="columns-1 gap-5 sm:columns-2 lg:columns-3"
        >
          <div
            v-for="n in 9"
            :key="n"
            class="skeleton mb-5 w-full rounded-2xl"
            :style="{ height: `${180 + ((n * 47) % 140)}px` }"
          ></div>
        </div>

        <!-- GALLERY -->
        <div
          v-else-if="filteredGallery.length > 0"
          class="columns-1 gap-5 sm:columns-2 lg:columns-3"
        >
          <button
            v-for="(item, index) in filteredGallery"
            :key="item.id"
            v-reveal="{ delay: (index % 6) * 80 }"
            @click="openLightbox(item)"
            class="group relative mb-5 block w-full overflow-hidden rounded-2xl bg-gray-100 text-left transition-shadow duration-300 hover:shadow-xl"
          >
            <img
              :src="item.image_url"
              :alt="item.alt_text || 'Kegiatan anak-anak Amanah Ummat'"
              loading="lazy"
              class="w-full object-cover transition-transform duration-700 group-hover:scale-110"
            />

            <!-- Hover Overlay -->
            <div
              class="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition duration-300 group-hover:opacity-100"
            >
              <div class="p-5 text-white">
                <p class="font-semibold">
                  {{ item.alt_text }}
                </p>

                <p class="mt-1 text-sm text-gray-200">
                  {{ galleryGroupLabel(item, groups) }}
                </p>
              </div>
            </div>
          </button>
        </div>

        <!-- EMPTY STATE -->
        <div v-else class="py-20 text-center">
          <p class="text-gray-500">Belum ada foto pada kategori ini.</p>
        </div>
      </div>
    </section>

    <!-- =========================
         LIGHTBOX
    ========================== -->
    <div
      v-if="selectedImage"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5"
      @click.self="closeLightbox"
    >
      <!-- CLOSE -->
      <button
        @click="closeLightbox"
        class="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
        aria-label="Tutup"
      >
        ×
      </button>

      <!-- PREVIOUS -->
      <button
        v-if="filteredGallery.length > 1"
        @click.stop="previousImage"
        class="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20 sm:left-8"
        aria-label="Foto sebelumnya"
      >
        ←
      </button>

      <!-- IMAGE -->
      <div class="max-h-[90vh] max-w-5xl">
        <img
          :src="selectedImage.image_url"
          :alt="
            selectedImage.alt_text || 'Kegiatan anak-anak Amanah Ummat'
          "
          class="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
        />

        <div class="mt-4 text-center">
          <p class="text-lg font-semibold text-white">
            {{ selectedImage.alt_text }}
          </p>

          <p class="mt-1 text-sm text-gray-300">
            {{ galleryGroupLabel(selectedImage, groups) }}
          </p>
        </div>
      </div>

      <!-- NEXT -->
      <button
        v-if="filteredGallery.length > 1"
        @click.stop="nextImage"
        class="absolute right-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20 sm:right-8"
        aria-label="Foto berikutnya"
      >
        →
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { supabase } from "../lib/supabase";
import { DEFAULT_GROUPS, getGalleryGroups, galleryGroupLabel, matchesGalleryGroup } from "../lib/galleryGroups";

const activeCategory = ref("Semua");

const selectedImage = ref(null);

const gallery = ref([]);
const loadingGallery = ref(true);

const groups = ref(DEFAULT_GROUPS);
const categories = computed(() => [{ slug: "Semua", name: "Semua" }, ...groups.value]);

const getGallery = async () => {
  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Gagal mengambil data galeri:", error);
    loadingGallery.value = false;
    return;
  }

  gallery.value = data || [];
  loadingGallery.value = false;
};

onMounted(() => {
  getGallery();
  getGalleryGroups().then(result => { groups.value = result.groups; }).catch(console.error);
});

const filteredGallery = computed(() => gallery.value.filter(
  (item) => matchesGalleryGroup(item, activeCategory.value),
));

function openLightbox(item) {
  selectedImage.value = item;
}

function closeLightbox() {
  selectedImage.value = null;
}

/* =========================
   KONTROL KEYBOARD LIGHTBOX
========================= */

const handleKeydown = (event) => {
  if (!selectedImage.value) return;

  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowRight") nextImage();
  if (event.key === "ArrowLeft") previousImage();
};

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onBeforeUnmount(() => {
  window.removeEventListener("keydown", handleKeydown);
  document.body.style.overflow = "";
});

// Cegah halaman di belakang ikut ter-scroll saat lightbox terbuka
watch(selectedImage, (image) => {
  document.body.style.overflow = image ? "hidden" : "";
});

// Bila filter diganti saat lightbox terbuka, foto aktif bisa tidak ada lagi
// di daftar sehingga tombol maju/mundur berhenti bekerja.
watch(activeCategory, () => {
  closeLightbox();
});

function nextImage() {
  if (!selectedImage.value || filteredGallery.value.length === 0) {
    return;
  }

  const currentIndex = filteredGallery.value.findIndex(
    (item) => item.id === selectedImage.value.id,
  );

  const nextIndex = (currentIndex + 1) % filteredGallery.value.length;

  selectedImage.value = filteredGallery.value[nextIndex];
}

function previousImage() {
  if (!selectedImage.value || filteredGallery.value.length === 0) {
    return;
  }

  const currentIndex = filteredGallery.value.findIndex(
    (item) => item.id === selectedImage.value.id,
  );

  const previousIndex =
    (currentIndex - 1 + filteredGallery.value.length) %
    filteredGallery.value.length;

  selectedImage.value = filteredGallery.value[previousIndex];
}
</script>
