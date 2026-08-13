```vue
<template>
  <div>
    <!-- =========================
         HERO
    ========================== -->
    <section class="bg-emerald-50">
      <div class="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
        <div class="max-w-3xl">
          <span
            class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
          >
            Galeri
          </span>

          <h1
            class="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
          >
            Momen bersama anak-anak Amanah Umat.
          </h1>

          <p class="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Kumpulan momen dari berbagai kegiatan dan keseharian anak-anak di
            Panti Asuhan Amanah Umat.
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
        <div class="mb-10 flex flex-wrap gap-3">
          <button
            v-for="category in categories"
            :key="category"
            @click="activeCategory = category"
            class="rounded-full px-5 py-2.5 text-sm font-semibold transition"
            :class="
              activeCategory === category
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
            "
          >
            {{ category }}
          </button>
        </div>

        <!-- MASONRY GALLERY -->
        <div class="columns-1 gap-5 sm:columns-2 lg:columns-3">
          <button
            v-for="item in filteredGallery"
            :key="item.id"
            @click="openLightbox(item)"
            class="group mb-5 block w-full overflow-hidden rounded-2xl bg-gray-100 text-left"
          >
            <img
              :src="item.image"
              :alt="item.title"
              class="w-full object-cover transition duration-500 group-hover:scale-105"
            />

            <!-- Hover Caption -->
            <div class="absolute"></div>
          </button>
        </div>

        <!-- EMPTY STATE -->
        <div v-if="filteredGallery.length === 0" class="py-20 text-center">
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
      <!-- Close -->
      <button
        @click="closeLightbox"
        class="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20"
        aria-label="Tutup"
      >
        ×
      </button>

      <!-- Previous -->
      <button
        @click.stop="previousImage"
        class="absolute left-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-2xl text-white transition hover:bg-white/20 sm:left-8"
        aria-label="Foto sebelumnya"
      >
        ←
      </button>

      <!-- Image -->
      <div class="max-h-[90vh] max-w-5xl">
        <img
          :src="selectedImage.image"
          :alt="selectedImage.title"
          class="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
        />

        <div class="mt-4 text-center">
          <p class="text-lg font-semibold text-white">
            {{ selectedImage.title }}
          </p>

          <p class="mt-1 text-sm text-gray-300">
            {{ selectedImage.category }}
          </p>
        </div>
      </div>

      <!-- Next -->
      <button
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
import { computed, ref } from "vue";

const activeCategory = ref("Semua");
const selectedImage = ref(null);

const categories = [
  "Semua",
  "Pendidikan",
  "Keagamaan",
  "Kebersamaan",
  "Kegiatan",
];

const gallery = [
  {
    id: 1,
    title: "Kegiatan Bersama Anak-anak",
    category: "Kebersamaan",
    image:
      "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 2,
    title: "Kegiatan Belajar",
    category: "Pendidikan",
    image:
      "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 3,
    title: "Aktivitas Anak-anak",
    category: "Kegiatan",
    image:
      "https://images.unsplash.com/photo-1504159506876-f8338247a14a?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 4,
    title: "Kegiatan Kreatif",
    category: "Kegiatan",
    image:
      "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 5,
    title: "Kegiatan Keagamaan",
    category: "Keagamaan",
    image:
      "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 6,
    title: "Momen Kebersamaan",
    category: "Kebersamaan",
    image:
      "https://images.unsplash.com/photo-1516627145497-ae6968895b74?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 7,
    title: "Belajar Bersama",
    category: "Pendidikan",
    image:
      "https://images.unsplash.com/photo-1497486751825-1233686d5d80?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 8,
    title: "Kegiatan Anak",
    category: "Kegiatan",
    image:
      "https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=1200&q=80",
  },
  {
    id: 9,
    title: "Kebersamaan",
    category: "Kebersamaan",
    image:
      "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=1200&q=80",
  },
];

const filteredGallery = computed(() => {
  if (activeCategory.value === "Semua") {
    return gallery;
  }

  return gallery.filter((item) => item.category === activeCategory.value);
});

function openLightbox(item) {
  selectedImage.value = item;
}

function closeLightbox() {
  selectedImage.value = null;
}

function nextImage() {
  const currentIndex = filteredGallery.value.findIndex(
    (item) => item.id === selectedImage.value.id,
  );

  const nextIndex = (currentIndex + 1) % filteredGallery.value.length;

  selectedImage.value = filteredGallery.value[nextIndex];
}

function previousImage() {
  const currentIndex = filteredGallery.value.findIndex(
    (item) => item.id === selectedImage.value.id,
  );

  const previousIndex =
    (currentIndex - 1 + filteredGallery.value.length) %
    filteredGallery.value.length;

  selectedImage.value = filteredGallery.value[previousIndex];
}
</script>
```
