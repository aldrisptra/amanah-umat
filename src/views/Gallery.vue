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
            Galeri
          </span>

          <h1
            class="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
          >
            Momen bersama anak-anak Amanah Ummat.
          </h1>

          <p class="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Kumpulan momen dari berbagai kegiatan dan keseharian anak-anak di
            LKSA Amanah Ummat.
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
            :key="category"
            @click="activeCategory = category"
            class="rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
            :class="
              activeCategory === category
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
            "
          >
            {{ labelKategori(category) }}
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
              :alt="item.alt_text || 'Kegiatan anak-anak LKSA Amanah Ummat'"
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
                  {{ item.category || LABEL_TANPA_KATEGORI }}
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
            selectedImage.alt_text || 'Kegiatan anak-anak LKSA Amanah Ummat'
          "
          class="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
        />

        <div class="mt-4 text-center">
          <p class="text-lg font-semibold text-white">
            {{ selectedImage.alt_text }}
          </p>

          <p class="mt-1 text-sm text-gray-300">
            {{ selectedImage.category || LABEL_TANPA_KATEGORI }}
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

// Penanda buatan untuk foto yang belum dikelompokkan. Bagi pengunjung
// ditampilkan sebagai "Lainnya" - kata "tanpa kategori" terdengar seperti
// ada yang belum selesai dikerjakan.
const TANPA_KATEGORI = "__tanpa_kategori";
const LABEL_TANPA_KATEGORI = "Lainnya";

const activeCategory = ref("Semua");

const labelKategori = (nama) =>
  nama === TANPA_KATEGORI ? LABEL_TANPA_KATEGORI : nama;
const selectedImage = ref(null);

const gallery = ref([]);
const loadingGallery = ref(true);

// Urutan kategori yang diatur pengurus lewat panel admin. Berasal dari tabel
// yang dibuat menyusul, jadi selama belum ada daftarnya cukup kosong dan
// urutan kategori kembali mengikuti urutan foto.
const urutanKategori = ref([]);

const getKategori = async () => {
  const { data, error } = await supabase
    .from("gallery_categories")
    .select("name")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    const tabelBelumAda = error.code === "PGRST205" || error.code === "42P01";

    if (!tabelBelumAda) {
      console.error("Gagal mengambil kategori galeri:", error);
    }

    return;
  }

  urutanKategori.value = (data || []).map((item) => item.name);
};

// Kategori diambil dari data, bukan daftar tetap. Dengan cara ini kategori
// baru yang ditambahkan lewat CMS langsung muncul sebagai filter, dan
// kategori yang belum punya foto tidak menampilkan hasil kosong.
const categories = computed(() => {
  const dariData = new Set(
    gallery.value.map((item) => item.category).filter(Boolean),
  );

  // Kategori yang sudah diurutkan pengurus tampil lebih dulu, dan hanya bila
  // benar-benar punya foto - supaya tidak ada tombol yang selalu kosong.
  const terurut = urutanKategori.value.filter((nama) => dariData.has(nama));

  // Kategori lama yang tidak ada di daftar pengaturan tetap ikut tampil,
  // agar fotonya tidak menjadi tidak terjangkau pengunjung.
  const sisa = [...dariData].filter((nama) => !terurut.includes(nama));

  // Selalu paling belakang, dan hanya muncul bila memang ada fotonya
  const tanpa = gallery.value.some((item) => !item.category)
    ? [TANPA_KATEGORI]
    : [];

  return ["Semua", ...terurut, ...sisa, ...tanpa];
});

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
  getKategori();
});

const filteredGallery = computed(() => {
  if (activeCategory.value === "Semua") {
    return gallery.value;
  }

  if (activeCategory.value === TANPA_KATEGORI) {
    return gallery.value.filter((item) => !item.category);
  }

  return gallery.value.filter((item) => item.category === activeCategory.value);
});

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
