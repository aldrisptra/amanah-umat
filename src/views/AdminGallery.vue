<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import {
  Pencil,
  Plus,
  Trash2,
} from "lucide-vue-next";
import { supabase } from "../lib/supabase";
import { DEFAULT_GROUPS, getGalleryGroups, galleryGroup, galleryGroupLabel, matchesGalleryGroup } from "../lib/galleryGroups";
import { CACHE_FOTO, UKURAN, compressImage } from "../lib/imageCompress";
import AdminPage from "../components/admin/AdminPage.vue";
import AdminField from "../components/admin/AdminField.vue";
import AdminImageInput from "../components/admin/AdminImageInput.vue";
import AdminConfirm from "../components/admin/AdminConfirm.vue";
import AdminAlert from "../components/admin/AdminAlert.vue";
import { buildStorageFileName } from "../lib/utils";

const groups = ref(DEFAULT_GROUPS);
const groupsAvailable = ref(false);
const filterUnit = ref("Semua");
const unitFilters = computed(() => [{ slug: "Semua", name: "Semua" }, ...groups.value]);
const showGroups = ref(false);
const groupName = ref("");
const editingGroup = ref(null);
const deletingGroup = ref(null);
const groupBusy = ref(false);
const groupError = ref("");
async function loadGroups() {
  try {
    const result = await getGalleryGroups();
    groups.value = result.groups;
    groupsAvailable.value = result.available;
  } catch (error) { listErrorMessage.value = "Gagal memuat kelompok anak: " + error.message; }
}
async function saveGroup() {
  const name = groupName.value.trim();
  if (!name || groupBusy.value) return;
  if (name.toLowerCase() === "semua" || groups.value.some(g => g.slug !== editingGroup.value?.slug && g.name.toLowerCase() === name.toLowerCase())) {
    groupError.value = "Nama kelompok sudah dipakai atau merupakan pilihan Semua."; return;
  }
  groupBusy.value = true; groupError.value = "";
  try {
    const result = editingGroup.value
      ? await supabase.from("gallery_groups").update({ name }).eq("slug", editingGroup.value.slug).select()
      : await supabase.from("gallery_groups").insert({ name, slug: "group-" + crypto.randomUUID() }).select();
    if (result.error) throw result.error;
    if (!result.data?.length) throw new Error("Perubahan tidak tersimpan. Periksa sesi admin.");
    editingGroup.value = null; groupName.value = "";
    await loadGroups();
  } catch (error) { groupError.value = error.message; }
  finally { groupBusy.value = false; }
}
async function deleteGroup() {
  if (!deletingGroup.value || groupBusy.value) return;
  groupBusy.value = true; groupError.value = "";
  try {
    const { data, error } = await supabase.from("gallery_groups").delete().eq("slug", deletingGroup.value.slug).select();
    if (error) throw error;
    if (!data?.length) throw new Error("Kelompok tidak terhapus. Periksa sesi admin.");
    if (filterUnit.value === deletingGroup.value.slug) filterUnit.value = "Semua";
    if (editingGroup.value?.slug === deletingGroup.value.slug) { editingGroup.value = null; groupName.value = ""; }
    await loadGroups();
  } catch (error) { groupError.value = error.message; }
  finally { groupBusy.value = false; deletingGroup.value = null; }
}

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

const form = reactive({
  image_url: "",
  alt_text: "",
  unit: "",
});

// URL pratinjau lokal harus dibebaskan agar tidak menumpuk di memori
const revokePreview = () => {
  if (imagePreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(imagePreviewUrl.value);
  }
};

onBeforeUnmount(revokePreview);

const pilihanUnitFoto = computed(() => groups.value.map(g => ({ value: g.slug, label: g.name })));
const galeriTersaring = computed(() => gallery.value.filter(item => matchesGalleryGroup(item, filterUnit.value)));

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
  form.unit = "";
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
  form.unit = galleryGroup(item);

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

    if (!pilihanUnitFoto.value.some(group => group.value === form.unit)) throw new Error("Pilih kelompok anak yang tersedia terlebih dahulu.");
    let uploadedImageUrl = form.image_url;

    if (selectedImageFile.value) {
      uploadedImageUrl = await uploadImageFile(selectedImageFile.value);
    }

    const payload = {
      image_url: uploadedImageUrl,
      alt_text: form.alt_text.trim(),
    };

    // Kolom unit baru ada setelah supabase/unit_lembaga.sql dijalankan.
    // Menyertakannya sebelum itu akan ditolak Supabase (PGRST204).
    payload.unit = form.unit;

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

onMounted(async () => {
  getGallery();
  loadGroups();

});
</script>

<template>
  <AdminPage
    title="Galeri Anak"
    description="Kelola foto dan keterangan anak-anak binaan berdasarkan kelompoknya. Delapan foto pertama juga tampil di halaman depan."
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
          <button type="button" @click="showGroups = true" class="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">Kelola Kelompok Anak</button>


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

    <div class="mb-5 flex flex-wrap gap-2" aria-label="Kelompok anak">
      <button v-for="unit in unitFilters" :key="unit.slug" type="button"
        @click="filterUnit = unit.slug" :aria-pressed="filterUnit === unit.slug"
        class="rounded-full px-4 py-2 text-sm font-semibold"
        :class="filterUnit === unit.slug ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'">{{ unit.name }}</button>
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
      Belum ada foto untuk kelompok {{ filterUnit }}.
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
            v-if="galleryGroupLabel(item, groups)"
            class="self-start rounded-full bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700"
          >
            {{ galleryGroupLabel(item, groups) }}
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
            v-if="pilihanUnitFoto.length"
            v-slot="{ id }"
            label="Kelompok anak"
            required
            hint="Pilih kelompok anak. Pilihan ini menentukan filter foto di galeri."
          >
            <select :id="id" v-model="form.unit" required class="admin-select">
              <option value="">Belum ditentukan</option>

              <option
                v-for="pilihan in pilihanUnitFoto"
                :key="pilihan.value"
                :value="pilihan.value"
              >
                {{ pilihan.label }}
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

    <div v-if="showGroups" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5" @click.self="!groupBusy && (showGroups = false)">
      <section role="dialog" aria-modal="true" aria-labelledby="groups-title" class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6">
        <div class="flex items-center justify-between gap-4">
          <h2 id="groups-title" class="text-xl font-bold">Kelola Kelompok Anak</h2>
          <button type="button" :disabled="groupBusy" @click="showGroups = false" aria-label="Tutup" class="p-2">&#215;</button>
        </div>
        <p class="mt-3 text-sm text-gray-600">Kelompok digunakan pada formulir foto dan filter galeri. Menghapus kelompok tidak menghapus fotonya; foto tetap ada di Semua.</p>
        <p v-if="!groupsAvailable" class="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Jalankan supabase/gallery_group_management.sql di Supabase SQL Editor untuk mengaktifkan pengelolaan kelompok.</p>
        <AdminAlert class="mt-4" :error="groupError" @dismiss="groupError = ''" />
        <form class="my-5 flex gap-2" @submit.prevent="saveGroup">
          <input v-model="groupName" aria-label="Nama kelompok" required maxlength="60" placeholder="Nama kelompok anak" class="admin-input min-w-0 flex-1" :disabled="groupBusy || !groupsAvailable" />
          <button class="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50" :disabled="groupBusy || !groupsAvailable">{{ editingGroup ? 'Simpan' : 'Tambah' }}</button>
          <button v-if="editingGroup" type="button" :disabled="groupBusy" @click="editingGroup = null; groupName = ''">Batal</button>
        </form>
        <ul class="space-y-3">
          <li v-for="group in groups" :key="group.slug" class="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
            <span class="flex-1 font-semibold">{{ group.name }}</span>
            <button type="button" :disabled="groupBusy || !groupsAvailable" @click="editingGroup = group; groupName = group.name" class="text-emerald-700 disabled:opacity-50">Ubah</button>
            <button type="button" :disabled="groupBusy || !groupsAvailable" @click="deletingGroup = group" class="text-red-600 disabled:opacity-50">Hapus</button>
          </li>
        </ul>
      </section>
    </div>
    <AdminConfirm :open="Boolean(deletingGroup)" danger :busy="groupBusy" title="Hapus kelompok anak?"
      :message="`Kelompok ${deletingGroup?.name || ''} akan dihapus. Foto tetap tersimpan dan dapat ditemukan melalui Semua.`"
      confirm-label="Ya, hapus" @confirm="deleteGroup" @cancel="deletingGroup = null" />

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
