<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Tags,
  Trash2,
} from "lucide-vue-next";
import { supabase } from "../lib/supabase";
import { CACHE_FOTO, UKURAN, compressImage } from "../lib/imageCompress";
import AdminPage from "../components/admin/AdminPage.vue";
import AdminField from "../components/admin/AdminField.vue";
import AdminImageInput from "../components/admin/AdminImageInput.vue";
import AdminConfirm from "../components/admin/AdminConfirm.vue";
import AdminAlert from "../components/admin/AdminAlert.vue";
import { buildStorageFileName } from "../lib/utils";

// Dipakai selama tabel gallery_categories belum dibuat, supaya galeri tetap
// berjalan seperti sebelumnya alih-alih kehilangan seluruh pilihan kategori.
const KATEGORI_BAWAAN = ["Pendidikan", "Keagamaan", "Kebersamaan", "Kegiatan"];

const kategori = ref([]);
const tabelKategoriAda = ref(false);

const gallery = ref([]);
const loading = ref(true);

const showModal = ref(false);
const saving = ref(false);
const uploading = ref(false);

// Foto yang sedang menunggu konfirmasi hapus
const fotoDihapus = ref(null);
const deleting = ref(false);

const editingGallery = ref(null);
const errorMessage = ref("");
const successMessage = ref("");
const listErrorMessage = ref("");
const selectedImageFile = ref(null);
const imagePreviewUrl = ref("");

// Penyaring tampilan daftar, membantu saat foto sudah banyak.
// TANPA_KATEGORI adalah penanda buatan, bukan nama kategori sungguhan -
// dipakai supaya foto yang belum dikelompokkan tetap bisa ditemukan.
const TANPA_KATEGORI = "__tanpa_kategori";

const filterKategori = ref("Semua");

const form = reactive({
  image_url: "",
  alt_text: "",
  category: "",
});

// URL pratinjau lokal harus dibebaskan agar tidak menumpuk di memori
const revokePreview = () => {
  if (imagePreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(imagePreviewUrl.value);
  }
};

onBeforeUnmount(revokePreview);

const daftarFilter = computed(() => {
  const adaDiData = new Set(
    gallery.value.map((item) => item.category).filter(Boolean),
  );

  // Urutannya mengikuti pengaturan pengurus. Kategori yang belum punya foto
  // tidak ditampilkan supaya tidak ada tombol penyaring yang selalu kosong.
  const terurut = namaKategori.value.filter((nama) => adaDiData.has(nama));

  // Nilai lama yang tidak ada di daftar kategori tetap tampil, agar fotonya
  // tidak menjadi tidak terjangkau.
  const sisa = [...adaDiData].filter((nama) => !terurut.includes(nama));

  // Diletakkan paling belakang, dan hanya bila memang ada fotonya
  const tanpa = gallery.value.some((item) => !item.category)
    ? [TANPA_KATEGORI]
    : [];

  return ["Semua", ...terurut, ...sisa, ...tanpa];
});

// Pilihan pada form foto. Kategori lama yang tidak ada di daftar tetap
// disertakan supaya foto tidak diam-diam kehilangan kategorinya saat disimpan.
const pilihanKategori = computed(() => {
  const gabungan = new Set(namaKategori.value);

  if (form.category) gabungan.add(form.category);

  return [...gabungan];
});

const galeriTersaring = computed(() => {
  if (filterKategori.value === "Semua") return gallery.value;

  if (filterKategori.value === TANPA_KATEGORI) {
    return gallery.value.filter((item) => !item.category);
  }

  return gallery.value.filter((item) => item.category === filterKategori.value);
});

const jumlahTanpaKategori = computed(
  () => gallery.value.filter((item) => !item.category).length,
);

// Penanda buatan perlu diterjemahkan sebelum ditampilkan sebagai tombol
const labelFilter = (nama) => (nama === TANPA_KATEGORI ? "Lainnya" : nama);

/* =========================
   KATEGORI

   Kategori disimpan pada tabelnya sendiri agar pengurus bisa menambah,
   mengubah nama, menghapus, dan mengurutkannya. Nama kategori tetap ikut
   tersimpan sebagai teks pada tiap foto, jadi mengubah nama kategori berarti
   ikut memperbarui seluruh foto yang memakainya.
========================= */

const showKategoriModal = ref(false);
const kategoriBaru = ref("");
const kategoriDiubah = ref(null);
const namaDiubah = ref("");
const kategoriSibuk = ref(false);
const kategoriPesan = ref("");
const kategoriDihapus = ref(null);
const memindahKategori = ref(false);

const tabelHilang = (error) =>
  error?.code === "PGRST205" || error?.code === "42P01";

const getKategori = async () => {
  const { data, error } = await supabase
    .from("gallery_categories")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    if (tabelHilang(error)) {
      // Belum diaktifkan: pakai daftar bawaan, dan sembunyikan tombol
      // pengelolaan supaya pengurus tidak menekan tombol yang pasti gagal.
      tabelKategoriAda.value = false;
      kategori.value = KATEGORI_BAWAAN.map((nama, i) => ({
        id: `bawaan-${i}`,
        name: nama,
      }));
      return;
    }

    console.error("Gagal mengambil kategori galeri:", error);
    return;
  }

  tabelKategoriAda.value = true;
  kategori.value = data || [];
};

const namaKategori = computed(() => kategori.value.map((k) => k.name));

// Berapa foto yang memakai satu kategori. Dipakai untuk menjelaskan dampaknya
// sebelum kategori diubah namanya atau dihapus.
const jumlahFoto = (nama) =>
  gallery.value.filter((item) => item.category === nama).length;

const sudahDipakai = (nama, kecualiId = null) =>
  kategori.value.some(
    (k) =>
      k.id !== kecualiId &&
      k.name.trim().toLowerCase() === nama.trim().toLowerCase(),
  );

const bukaKategoriModal = () => {
  kategoriPesan.value = "";
  kategoriBaru.value = "";
  kategoriDiubah.value = null;
  showKategoriModal.value = true;
};

const tutupKategoriModal = () => {
  if (kategoriSibuk.value) return;

  showKategoriModal.value = false;
  kategoriDiubah.value = null;
  kategoriPesan.value = "";
};

const tambahKategori = async () => {
  const nama = kategoriBaru.value.trim();

  if (!nama || kategoriSibuk.value) return;

  if (sudahDipakai(nama)) {
    kategoriPesan.value = `Kategori "${nama}" sudah ada.`;
    return;
  }

  kategoriSibuk.value = true;
  kategoriPesan.value = "";

  try {
    const urutanTerakhir = kategori.value.length
      ? Math.max(...kategori.value.map((k) => k.sort_order ?? 0))
      : 0;

    const { error } = await supabase
      .from("gallery_categories")
      .insert({ name: nama, sort_order: urutanTerakhir + 1 });

    if (error) throw error;

    kategoriBaru.value = "";

    await getKategori();

    successMessage.value = `Kategori "${nama}" berhasil ditambahkan.`;
  } catch (error) {
    console.error("Gagal menambah kategori:", error);
    kategoriPesan.value = error.message || "Gagal menambah kategori.";
  } finally {
    kategoriSibuk.value = false;
  }
};

const mulaiUbahKategori = (item) => {
  kategoriDiubah.value = item;
  namaDiubah.value = item.name;
  kategoriPesan.value = "";
};

const simpanUbahKategori = async () => {
  const item = kategoriDiubah.value;
  const namaBaru = namaDiubah.value.trim();

  if (!item || !namaBaru || kategoriSibuk.value) return;

  if (namaBaru === item.name) {
    kategoriDiubah.value = null;
    return;
  }

  if (sudahDipakai(namaBaru, item.id)) {
    kategoriPesan.value = `Kategori "${namaBaru}" sudah ada.`;
    return;
  }

  kategoriSibuk.value = true;
  kategoriPesan.value = "";

  try {
    const terdampak = jumlahFoto(item.name);

    const { error } = await supabase
      .from("gallery_categories")
      .update({ name: namaBaru })
      .eq("id", item.id);

    if (error) throw error;

    // Nama kategori juga tersimpan di tiap foto, jadi harus ikut diperbarui.
    // Tanpa langkah ini, foto lama menggantung pada kategori yang namanya
    // sudah tidak ada lagi.
    const { error: errorFoto } = await supabase
      .from("gallery")
      .update({ category: namaBaru })
      .eq("category", item.name);

    if (errorFoto) throw errorFoto;

    // Penyaring daftar ikut disesuaikan supaya tampilan tidak mendadak kosong
    if (filterKategori.value === item.name) {
      filterKategori.value = namaBaru;
    }

    kategoriDiubah.value = null;

    await Promise.all([getKategori(), getGallery()]);

    successMessage.value = terdampak
      ? `Kategori diubah menjadi "${namaBaru}". ${terdampak} foto ikut diperbarui.`
      : `Kategori berhasil diubah menjadi "${namaBaru}".`;
  } catch (error) {
    console.error("Gagal mengubah kategori:", error);
    kategoriPesan.value = error.message || "Gagal mengubah kategori.";
  } finally {
    kategoriSibuk.value = false;
  }
};

const hapusKategori = async () => {
  const item = kategoriDihapus.value;

  if (!item || kategoriSibuk.value) return;

  kategoriSibuk.value = true;
  kategoriPesan.value = "";

  try {
    const terdampak = jumlahFoto(item.name);

    // Fotonya sendiri tidak ikut dihapus - hanya kehilangan kategorinya,
    // sehingga masuk ke kelompok "Umum". Ikut menghapus foto hanya karena
    // kategorinya dihapus akan terasa seperti kehilangan data.
    if (terdampak) {
      const { error: errorFoto } = await supabase
        .from("gallery")
        .update({ category: null })
        .eq("category", item.name);

      if (errorFoto) throw errorFoto;
    }

    const { error } = await supabase
      .from("gallery_categories")
      .delete()
      .eq("id", item.id);

    if (error) throw error;

    if (filterKategori.value === item.name) {
      filterKategori.value = "Semua";
    }

    await Promise.all([getKategori(), getGallery()]);

    successMessage.value = terdampak
      ? `Kategori "${item.name}" dihapus. ${terdampak} foto kini tanpa kategori.`
      : `Kategori "${item.name}" berhasil dihapus.`;
  } catch (error) {
    console.error("Gagal menghapus kategori:", error);
    kategoriPesan.value = error.message || "Gagal menghapus kategori.";
  } finally {
    kategoriSibuk.value = false;
    kategoriDihapus.value = null;
  }
};

const pindahKategori = async (index, arah) => {
  const tujuan = index + arah;

  if (memindahKategori.value) return;
  if (tujuan < 0 || tujuan >= kategori.value.length) return;

  memindahKategori.value = true;
  kategoriPesan.value = "";

  // Tukar posisi di tampilan lebih dulu supaya terasa cepat
  const salinan = [...kategori.value];
  [salinan[index], salinan[tujuan]] = [salinan[tujuan], salinan[index]];
  kategori.value = salinan;

  try {
    const hasil = await Promise.all(
      salinan.map((item, i) =>
        supabase
          .from("gallery_categories")
          .update({ sort_order: i + 1 })
          .eq("id", item.id),
      ),
    );

    const gagal = hasil.find((r) => r.error);

    if (gagal) throw gagal.error;

    await getKategori();
  } catch (error) {
    console.error("Gagal mengubah urutan kategori:", error);
    kategoriPesan.value = error.message || "Gagal mengubah urutan.";

    // Kembalikan ke keadaan sebenarnya di database
    await getKategori();
  } finally {
    memindahKategori.value = false;
  }
};

/* =========================
   FOTO
========================= */
const uploadImageFile = async (file) => {
  if (!file) return "";

  uploading.value = true;

  // Foto dari HP bisa 3-5 MB. Diperkecil dulu di browser supaya
  // pengunjung tidak perlu mengunduh berkas sebesar itu.
  const siap = await compressImage(file, UKURAN.standar);
  const filePath = `gallery/${buildStorageFileName(siap)}`;

  const { data, error } = await supabase.storage
    .from("images")
    .upload(filePath, siap, {
      cacheControl: CACHE_FOTO,
      upsert: false,
    });

  if (error) {
    uploading.value = false;
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from("images")
    .getPublicUrl(data.path);

  uploading.value = false;

  return publicUrlData.publicUrl;
};

const handleImageSelect = (file) => {
  errorMessage.value = "";

  revokePreview();

  selectedImageFile.value = file;
  imagePreviewUrl.value = URL.createObjectURL(file);
};

const handleImageClear = () => {
  revokePreview();

  selectedImageFile.value = null;
  imagePreviewUrl.value = form.image_url;
};

/* =========================
   AMBIL DATA
========================= */
const getGallery = async () => {
  loading.value = true;

  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Gagal mengambil data galeri:", error);
    listErrorMessage.value = error.message;
    loading.value = false;
    return;
  }

  listErrorMessage.value = "";
  gallery.value = data || [];
  loading.value = false;
};

/* =========================
   MODAL
========================= */
const resetForm = () => {
  form.image_url = "";
  form.alt_text = "";
  form.category = "";
  selectedImageFile.value = null;
  revokePreview();
  imagePreviewUrl.value = "";
};

const openAddModal = () => {
  editingGallery.value = null;
  resetForm();
  errorMessage.value = "";
  successMessage.value = "";
  showModal.value = true;
};

const openEditModal = (item) => {
  editingGallery.value = item;

  form.image_url = item.image_url || "";
  form.alt_text = item.alt_text || "";
  form.category = item.category || "";

  selectedImageFile.value = null;
  revokePreview();
  imagePreviewUrl.value = item.image_url || "";

  errorMessage.value = "";
  successMessage.value = "";
  showModal.value = true;
};

const closeModal = () => {
  if (saving.value) return;

  showModal.value = false;
  editingGallery.value = null;
  errorMessage.value = "";
  resetForm();
};

/* =========================
   SIMPAN
========================= */
const saveGallery = async () => {
  if (saving.value) return;

  saving.value = true;
  errorMessage.value = "";

  try {
    if (!editingGallery.value && !selectedImageFile.value) {
      errorMessage.value = "Pilih foto terlebih dahulu sebelum menyimpan.";
      saving.value = false;
      return;
    }

    let uploadedImageUrl = form.image_url;

    if (selectedImageFile.value) {
      uploadedImageUrl = await uploadImageFile(selectedImageFile.value);
    }

    const payload = {
      image_url: uploadedImageUrl,
      alt_text: form.alt_text.trim(),
      category: form.category || null,
    };

    let result;

    if (editingGallery.value) {
      result = await supabase
        .from("gallery")
        .update(payload)
        .eq("id", editingGallery.value.id)
        .select();
    } else {
      result = await supabase.from("gallery").insert(payload).select();
    }

    if (result.error) {
      throw result.error;
    }

    const sedangEdit = Boolean(editingGallery.value);

    showModal.value = false;
    editingGallery.value = null;
    resetForm();

    await getGallery();

    successMessage.value = sedangEdit
      ? "Keterangan foto berhasil diperbarui."
      : "Foto berhasil ditambahkan ke galeri.";
  } catch (error) {
    console.error("GAGAL MENYIMPAN GALERI:", error);
    errorMessage.value = error.message || "Gagal menyimpan foto.";
  } finally {
    saving.value = false;
    uploading.value = false;
  }
};

/* =========================
   HAPUS
========================= */
const deleteGallery = async () => {
  const item = fotoDihapus.value;

  if (!item || deleting.value) return;

  deleting.value = true;
  listErrorMessage.value = "";
  successMessage.value = "";

  try {
    // .select() dipakai agar bisa membedakan "benar-benar terhapus" dari
    // "ditolak diam-diam oleh kebijakan keamanan (RLS) Supabase".
    const { data, error } = await supabase
      .from("gallery")
      .delete()
      .eq("id", item.id)
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      listErrorMessage.value =
        "Foto tidak terhapus. Kemungkinan sesi admin sudah berakhir. Coba keluar lalu masuk kembali.";
      return;
    }

    await getGallery();

    successMessage.value = "Foto berhasil dihapus dari galeri.";
  } catch (error) {
    console.error("Gagal menghapus foto:", error);
    listErrorMessage.value = error.message || "Gagal menghapus foto.";
  } finally {
    deleting.value = false;
    fotoDihapus.value = null;
  }
};

onMounted(() => {
  getGallery();
  getKategori();
});
</script>

<template>
  <AdminPage
    title="Galeri Foto"
    description="Kumpulan foto kegiatan dan keseharian anak-anak. Delapan foto pertama juga tampil di halaman depan."
    public-path="/galeri"
    wide
  >
    <template #toolbar>
      <div
        class="mt-6 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p class="text-sm text-gray-600">
          <template v-if="loading">Memuat...</template>

          <template v-else-if="gallery.length">
            Saat ini ada
            <strong class="font-semibold text-gray-900">
              {{ gallery.length }} foto
            </strong>
            di galeri.
          </template>

          <template v-else>Belum ada foto yang ditambahkan.</template>
        </p>

        <div class="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            @click="bukaKategoriModal"
            class="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <Tags class="h-4 w-4" />
            Kelola Kategori
          </button>

          <button
            type="button"
            @click="openAddModal"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
          >
            <Plus class="h-4 w-4" />
            Tambah Foto
          </button>
        </div>
      </div>
    </template>

    <AdminAlert
      :error="listErrorMessage"
      :success="successMessage"
      @dismiss="
        listErrorMessage = '';
        successMessage = '';
      "
    />

    <!-- Penyaring kategori -->
    <div v-if="daftarFilter.length > 1" class="mb-5 flex flex-wrap gap-2">
      <button
        v-for="kategori in daftarFilter"
        :key="kategori"
        type="button"
        @click="filterKategori = kategori"
        class="rounded-full px-4 py-2 text-sm font-semibold transition"
        :class="
          filterKategori === kategori
            ? 'bg-emerald-600 text-white'
            : 'bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50'
        "
      >
        {{ labelFilter(kategori) }}
      </button>
    </div>

    <!-- MEMUAT -->
    <div
      v-if="loading"
      class="rounded-2xl border border-gray-200 bg-white p-16 text-center text-sm text-gray-500"
    >
      Memuat galeri...
    </div>

    <!-- KOSONG -->
    <div
      v-else-if="gallery.length === 0"
      class="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center"
    >
      <p class="font-semibold text-gray-900">Galeri masih kosong</p>

      <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        Foto kegiatan membantu calon donatur melihat langsung keseharian
        anak-anak. Mulailah dengan beberapa foto terbaik.
      </p>

      <button
        type="button"
        @click="openAddModal"
        class="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        <Plus class="h-4 w-4" />
        Tambah Foto Pertama
      </button>
    </div>

    <!-- KOSONG SETELAH DISARING -->
    <div
      v-else-if="galeriTersaring.length === 0"
      class="rounded-2xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-500"
    >
      Belum ada foto pada kategori "{{ labelFilter(filterKategori) }}".
    </div>

    <!-- DAFTAR -->
    <div v-else class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <article
        v-for="item in galeriTersaring"
        :key="item.id"
        class="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white"
      >
        <div class="aspect-square overflow-hidden bg-gray-100">
          <img
            :src="item.image_url"
            :alt="item.alt_text || 'Foto galeri Amanah Ummat'"
            loading="lazy"
            class="h-full w-full object-cover"
          />
        </div>

        <div class="flex flex-1 flex-col p-4">
          <span
            v-if="item.category"
            class="self-start rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700"
          >
            {{ item.category }}
          </span>

          <h2 class="mt-2 line-clamp-2 flex-1 text-sm font-bold text-gray-900">
            {{ item.alt_text || "Tanpa keterangan" }}
          </h2>

          <div class="mt-4 flex gap-2">
            <button
              type="button"
              @click="openEditModal(item)"
              class="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Pencil class="h-4 w-4" />
              Ubah
            </button>

            <button
              type="button"
              @click="fotoDihapus = item"
              aria-label="Hapus foto"
              class="flex items-center justify-center rounded-xl border border-gray-200 px-3 py-2.5 text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </article>
    </div>

    <!-- =========================================================
         FORM TAMBAH / UBAH
    ========================================================== -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
      @click.self="closeModal"
    >
      <div
        class="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl"
      >
        <div
          class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-white px-6 py-5"
        >
          <div>
            <h2 class="text-xl font-bold text-gray-900">
              {{ editingGallery ? "Ubah Foto" : "Tambah Foto" }}
            </h2>

            <p class="mt-1 text-sm text-gray-500">
              Pilih foto dan beri keterangan singkat.
            </p>
          </div>

          <button
            type="button"
            @click="closeModal"
            aria-label="Tutup"
            class="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form @submit.prevent="saveGallery" class="space-y-5 px-6 py-6">
          <AdminAlert :error="errorMessage" @dismiss="errorMessage = ''" />

          <div>
            <p class="text-sm font-semibold text-gray-800">
              Foto
              <span class="text-red-500">*</span>
            </p>

            <AdminImageInput
              class="mt-2"
              :preview-url="imagePreviewUrl"
              :file-name="selectedImageFile?.name || ''"
              :disabled="saving"
              hint="Pilih foto yang terang dan tidak buram. Hindari foto yang memperlihatkan data pribadi anak seperti rapor atau kartu keluarga."
              aspect="1/1"
              @select="handleImageSelect"
              @clear="handleImageClear"
              @error="errorMessage = $event"
            />
          </div>

          <AdminField
            v-slot="{ id }"
            label="Keterangan foto"
            hint="Jelaskan singkat foto ini tentang apa. Keterangan ini muncul saat foto dibuka besar, dan dibacakan oleh pembaca layar bagi pengunjung tunanetra."
            required
            :value="form.alt_text"
            :max="80"
          >
            <input
              :id="id"
              v-model="form.alt_text"
              type="text"
              required
              placeholder="Contoh: Anak-anak belajar bersama di ruang tamu"
              class="admin-input"
            />
          </AdminField>

          <AdminField
            v-slot="{ id }"
            label="Kategori"
            hint="Dipakai pengunjung untuk menyaring foto di halaman galeri. Daftar pilihannya diatur lewat tombol Kelola Kategori."
          >
            <select :id="id" v-model="form.category" class="admin-select">
              <option value="">
                Tanpa kategori — tampil di kelompok "Lainnya"
              </option>

              <option v-for="k in pilihanKategori" :key="k" :value="k">
                {{ k }}
              </option>
            </select>
          </AdminField>

          <div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              @click="closeModal"
              :disabled="saving"
              class="flex-1 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              :disabled="saving"
              class="flex-1 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{
                saving
                  ? uploading
                    ? "Mengunggah foto..."
                    : "Menyimpan..."
                  : "Simpan"
              }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- =========================================================
         KELOLA KATEGORI
    ========================================================== -->
    <div
      v-if="showKategoriModal"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
      @click.self="tutupKategoriModal"
    >
      <div
        class="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl"
      >
        <div
          class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-white px-6 py-5"
        >
          <div>
            <h2 class="text-xl font-bold text-gray-900">Kelola Kategori</h2>

            <p class="mt-1 text-sm text-gray-500">
              Kelompok foto yang bisa dipilih pengunjung di halaman galeri.
            </p>
          </div>

          <button
            type="button"
            @click="tutupKategoriModal"
            aria-label="Tutup"
            class="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <div class="space-y-5 px-6 py-6">
          <!-- Tabel belum dibuat -->
          <div
            v-if="!tabelKategoriAda"
            class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4"
          >
            <p class="text-sm font-semibold text-amber-900">
              Pengelolaan kategori belum diaktifkan
            </p>

            <p class="mt-1 text-sm leading-6 text-amber-800">
              Galeri tetap berjalan normal memakai empat kategori bawaan, hanya
              daftarnya belum bisa diubah sendiri.
            </p>

            <p class="mt-2 text-sm leading-6 text-amber-800">
              Untuk mengaktifkannya, minta pengelola teknis menjalankan berkas
              <code
                class="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs"
              >
                supabase/gallery_categories.sql
              </code>
              pada menu SQL Editor di Supabase. Cukup dilakukan satu kali.
            </p>
          </div>

          <template v-else>
            <AdminAlert :error="kategoriPesan" @dismiss="kategoriPesan = ''" />

            <!-- Tambah kategori -->
            <form
              class="flex flex-col gap-2 sm:flex-row"
              @submit.prevent="tambahKategori"
            >
              <input
                v-model="kategoriBaru"
                type="text"
                placeholder="Nama kategori baru, misalnya Rekreasi"
                maxlength="30"
                class="admin-input flex-1"
              />

              <button
                type="submit"
                :disabled="!kategoriBaru.trim() || kategoriSibuk"
                class="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus class="h-4 w-4" />
                Tambah
              </button>
            </form>

            <!-- Daftar kategori -->
            <div
              v-if="kategori.length === 0"
              class="rounded-2xl border border-dashed border-gray-300 p-8 text-center"
            >
              <p class="font-semibold text-gray-900">Belum ada kategori</p>

              <p class="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-500">
                Tambahkan lewat kolom di atas. Contoh: Pendidikan, Keagamaan,
                Rekreasi.
              </p>
            </div>

            <ul v-else class="space-y-2">
              <li
                v-for="(item, index) in kategori"
                :key="item.id"
                class="flex items-center gap-3 rounded-2xl border border-gray-200 p-3"
              >
                <!-- Urutan tampil di halaman galeri -->
                <div class="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    :disabled="index === 0 || memindahKategori"
                    @click="pindahKategori(index, -1)"
                    aria-label="Pindahkan ke atas"
                    class="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronUp class="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    :disabled="
                      index === kategori.length - 1 || memindahKategori
                    "
                    @click="pindahKategori(index, 1)"
                    aria-label="Pindahkan ke bawah"
                    class="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronDown class="h-4 w-4" />
                  </button>
                </div>

                <!-- Sedang diubah namanya -->
                <template v-if="kategoriDiubah?.id === item.id">
                  <input
                    v-model="namaDiubah"
                    type="text"
                    maxlength="30"
                    class="admin-input flex-1"
                    @keydown.enter.prevent="simpanUbahKategori"
                    @keydown.esc="kategoriDiubah = null"
                  />

                  <button
                    type="button"
                    :disabled="kategoriSibuk"
                    @click="simpanUbahKategori"
                    class="shrink-0 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {{ kategoriSibuk ? "..." : "Simpan" }}
                  </button>

                  <button
                    type="button"
                    :disabled="kategoriSibuk"
                    @click="kategoriDiubah = null"
                    class="shrink-0 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
                  >
                    Batal
                  </button>
                </template>

                <!-- Tampilan biasa -->
                <template v-else>
                  <div class="min-w-0 flex-1">
                    <p class="truncate font-semibold text-gray-900">
                      {{ item.name }}
                    </p>

                    <p class="text-xs text-gray-500">
                      {{
                        jumlahFoto(item.name)
                          ? `${jumlahFoto(item.name)} foto`
                          : "Belum dipakai foto mana pun"
                      }}
                    </p>
                  </div>

                  <button
                    type="button"
                    @click="mulaiUbahKategori(item)"
                    aria-label="Ubah nama kategori"
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  >
                    <Pencil class="h-4 w-4" />
                  </button>

                  <button
                    type="button"
                    @click="kategoriDihapus = item"
                    aria-label="Hapus kategori"
                    class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </template>
              </li>
            </ul>

            <!-- Kelompok bawaan: foto yang belum diberi kategori.
                 Terbentuk sendiri, jadi tidak bisa diubah atau dihapus -
                 ditampilkan agar pengurus tahu masih ada foto yang
                 belum dikelompokkan. -->
            <div
              class="flex items-center gap-3 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-3"
            >
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-gray-700">Tanpa kategori</p>

                <p class="text-xs leading-5 text-gray-500">
                  {{
                    jumlahTanpaKategori
                      ? `${jumlahTanpaKategori} foto`
                      : "Tidak ada foto"
                  }}
                  — tampil sebagai "Lainnya" di halaman galeri
                </p>
              </div>

              <button
                type="button"
                @click="
                  filterKategori = TANPA_KATEGORI;
                  tutupKategoriModal();
                "
                :disabled="!jumlahTanpaKategori"
                class="shrink-0 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Lihat
              </button>
            </div>

            <p class="text-xs leading-5 text-gray-500">
              Mengubah nama kategori akan ikut memperbarui seluruh foto yang
              memakainya. Urutan di atas menentukan urutan tombol penyaring di
              halaman galeri.
            </p>
          </template>

          <button
            type="button"
            @click="tutupKategoriModal"
            :disabled="kategoriSibuk"
            class="w-full rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>

    <!-- KONFIRMASI HAPUS KATEGORI -->
    <AdminConfirm
      :open="Boolean(kategoriDihapus)"
      danger
      :busy="kategoriSibuk"
      title="Hapus kategori ini?"
      :message="
        jumlahFoto(kategoriDihapus?.name)
          ? `Kategori &quot;${kategoriDihapus?.name}&quot; akan dihapus. ${jumlahFoto(kategoriDihapus?.name)} foto yang memakainya TIDAK ikut terhapus, hanya berpindah menjadi tanpa kategori.`
          : `Kategori &quot;${kategoriDihapus?.name || ''}&quot; akan dihapus dari daftar pilihan. Belum ada foto yang memakainya.`
      "
      confirm-label="Ya, hapus"
      @confirm="hapusKategori"
      @cancel="kategoriDihapus = null"
    />

    <!-- KONFIRMASI HAPUS -->
    <AdminConfirm
      :open="Boolean(fotoDihapus)"
      danger
      :busy="deleting"
      title="Hapus foto ini?"
      :message="`Foto &quot;${fotoDihapus?.alt_text || 'tanpa keterangan'}&quot; akan langsung hilang dari galeri di website. Tindakan ini tidak dapat dibatalkan.`"
      confirm-label="Ya, hapus"
      @confirm="deleteGallery"
      @cancel="fotoDihapus = null"
    />
  </AdminPage>
</template>
