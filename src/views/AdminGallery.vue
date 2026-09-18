<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { Pencil, Plus, Trash2 } from "lucide-vue-next";
import { supabase } from "../lib/supabase";
import AdminPage from "../components/admin/AdminPage.vue";
import AdminField from "../components/admin/AdminField.vue";
import AdminImageInput from "../components/admin/AdminImageInput.vue";
import AdminConfirm from "../components/admin/AdminConfirm.vue";
import AdminAlert from "../components/admin/AdminAlert.vue";
import { buildStorageFileName } from "../lib/utils";

const KATEGORI = ["Pendidikan", "Keagamaan", "Kebersamaan", "Kegiatan"];

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

// Penyaring tampilan daftar, membantu saat foto sudah banyak
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

  return ["Semua", ...adaDiData];
});

const galeriTersaring = computed(() => {
  if (filterKategori.value === "Semua") return gallery.value;

  return gallery.value.filter((item) => item.category === filterKategori.value);
});

/* =========================
   FOTO
========================= */
const uploadImageFile = async (file) => {
  if (!file) return "";

  uploading.value = true;

  const filePath = `gallery/${buildStorageFileName(file)}`;

  const { data, error } = await supabase.storage
    .from("images")
    .upload(filePath, file, { cacheControl: "3600", upsert: false });

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

onMounted(getGallery);
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

        <button
          type="button"
          @click="openAddModal"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          <Plus class="h-4 w-4" />
          Tambah Foto
        </button>
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
        {{ kategori }}
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
      Belum ada foto pada kategori "{{ filterKategori }}".
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
            hint="Dipakai pengunjung untuk menyaring foto di halaman galeri."
          >
            <select :id="id" v-model="form.category" class="admin-select">
              <option value="">Umum (tanpa kategori)</option>

              <option v-for="k in KATEGORI" :key="k" :value="k">
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
