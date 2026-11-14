<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { Pencil, Plus, Trash2 } from "lucide-vue-next";
import { supabase } from "../lib/supabase";
import { getProgramCategories, programCategoryOptions } from "../lib/programCategories";
import { CACHE_FOTO, UKURAN, compressImage } from "../lib/imageCompress";
import AdminProgramText from "../components/admin/AdminProgramText.vue";
import AdminPage from "../components/admin/AdminPage.vue";
import AdminField from "../components/admin/AdminField.vue";
import AdminImageInput from "../components/admin/AdminImageInput.vue";
import AdminConfirm from "../components/admin/AdminConfirm.vue";
import AdminAlert from "../components/admin/AdminAlert.vue";
import { buildStorageFileName } from "../lib/utils";

// ===============================
// STATE
// ===============================

const programs = ref([]);
const loading = ref(true);

const tabAktif = ref("Semua");
const savedCategories = ref([]);
const categoriesAvailable = ref(false);
const categories = computed(() => programCategoryOptions(savedCategories.value, programs.value));
const showCategories = ref(false);
const categoryName = ref("");
const editingCategory = ref(null);
const deletingCategory = ref(null);
const categoryBusy = ref(false);
const categoryError = ref("");
async function loadCategories() {
  try {
    const result = await getProgramCategories();
    savedCategories.value = result.names; categoriesAvailable.value = result.available;
  } catch (error) { listErrorMessage.value = "Gagal memuat jenis program: " + error.message; }
}
async function saveCategory() {
  const name = categoryName.value.trim();
  if (!name || categoryBusy.value) return;
  if (name.toLowerCase() === "semua" || categories.value.some(n => n !== editingCategory.value && n.toLowerCase() === name.toLowerCase())) {
    categoryError.value = "Nama sudah digunakan atau merupakan pilihan Semua."; return;
  }
  categoryBusy.value = true; categoryError.value = "";
  try {
    const result = editingCategory.value !== null
      ? await supabase.from("program_categories").update({ name }).eq("name", editingCategory.value).select()
      : await supabase.from("program_categories").insert({ name }).select();
    if (result.error) throw result.error;
    if (!result.data?.length) throw new Error("Perubahan tidak tersimpan. Periksa sesi admin.");
    if (tabAktif.value === editingCategory.value) tabAktif.value = name;
    categoryName.value = ""; editingCategory.value = null;
    await Promise.all([loadCategories(), getPrograms()]);
  } catch (error) { categoryError.value = error.message; }
  finally { categoryBusy.value = false; }
}
async function deleteCategory() {
  if (deletingCategory.value === null || categoryBusy.value) return;
  categoryBusy.value = true; categoryError.value = "";
  try {
    const { data, error } = await supabase.from("program_categories").delete().eq("name", deletingCategory.value).select();
    if (error) throw error;
    if (!data?.length) throw new Error("Jenis program tidak terhapus. Periksa sesi admin.");
    if (tabAktif.value === deletingCategory.value) tabAktif.value = "Semua";
    if (editingCategory.value === deletingCategory.value) { editingCategory.value = null; categoryName.value = ""; }
    await Promise.all([loadCategories(), getPrograms()]);
  } catch (error) { categoryError.value = error.message; }
  finally { categoryBusy.value = false; deletingCategory.value = null; }
}
const programTampil = computed(() => tabAktif.value === "Semua" ? programs.value : programs.value.filter(p => p.category?.trim() === tabAktif.value));

const showModal = ref(false);
const saving = ref(false);
const uploading = ref(false);

// Program yang sedang menunggu konfirmasi hapus
const programDihapus = ref(null);
const deleting = ref(false);

const editingProgram = ref(null);
const errorMessage = ref("");
const successMessage = ref("");
const listErrorMessage = ref("");

// ===============================
// FORM
// ===============================

const form = reactive({
  title: "",
  category: "",
  description: "",
  image_url: "",
});

const selectedImageFile = ref(null);
const imagePreviewUrl = ref("");

// URL pratinjau lokal harus dibebaskan agar tidak menumpuk di memori
const revokePreview = () => {
  if (imagePreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(imagePreviewUrl.value);
  }
};

onBeforeUnmount(revokePreview);

const uploadImageFile = async (file) => {
  if (!file) return "";

  uploading.value = true;

  // Foto dari HP bisa 3-5 MB. Diperkecil dulu di browser supaya
  // pengunjung tidak perlu mengunduh berkas sebesar itu.
  const siap = await compressImage(file, UKURAN.standar);
  const filePath = `programs/${buildStorageFileName(siap)}`;

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

// ===============================
// AMBIL DATA
// ===============================

const getPrograms = async () => {
  loading.value = true;

  try {
    const { data, error } = await supabase
      .from("programs")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Gagal mengambil program:", error);

      programs.value = [];
      listErrorMessage.value = error.message;
      return;
    }

    listErrorMessage.value = "";
    programs.value = data || [];
  } catch (err) {
    console.error("ERROR GET PROGRAMS:", err);

    programs.value = [];
    listErrorMessage.value = "Gagal mengambil data program.";
  } finally {
    loading.value = false;
  }
};

// ===============================
// MODAL
// ===============================

const resetForm = () => {
  form.title = "";
  form.category = "";
  form.description = "";
  form.image_url = "";
  selectedImageFile.value = null;
  revokePreview();
  imagePreviewUrl.value = "";
};

const openAddModal = () => {
  editingProgram.value = null;
  errorMessage.value = "";
  successMessage.value = "";

  resetForm();


  showModal.value = true;
};

const openEditModal = (program) => {
  editingProgram.value = program;
  errorMessage.value = "";
  successMessage.value = "";

  form.title = program.title || "";
  form.category = program.category || "";
  form.description = program.description || "";
  form.image_url = program.image_url || "";

  selectedImageFile.value = null;
  revokePreview();
  imagePreviewUrl.value = program.image_url || "";

  showModal.value = true;
};

const closeModal = () => {
  if (saving.value) return;

  showModal.value = false;
  editingProgram.value = null;
  errorMessage.value = "";

  resetForm();
};

// ===============================
// SIMPAN
// ===============================

const saveProgram = async () => {
  if (saving.value) return;

  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    if (!editingProgram.value && !selectedImageFile.value) {
      errorMessage.value =
        "Pilih foto program terlebih dahulu sebelum menyimpan.";
      saving.value = false;
      return;
    }

    if (form.category.trim().toLowerCase() === "semua") throw new Error("Gunakan nama jenis kegiatan selain Semua.");
    if (categoriesAvailable.value && form.category.trim()) {
      const { error } = await supabase.from("program_categories").upsert({ name: form.category.trim() }, { onConflict: "name", ignoreDuplicates: true });
      if (error) throw error;
      await loadCategories();
    }
    let uploadedImageUrl = form.image_url.trim();

    if (selectedImageFile.value) {
      uploadedImageUrl = await uploadImageFile(selectedImageFile.value);
    }

    const payload = {
      title: form.title.trim(),
      category: form.category.trim() || null,
      description: form.description.trim(),
      image_url: uploadedImageUrl,
    };


    let result;

    if (editingProgram.value) {
      result = await supabase
        .from("programs")
        .update(payload)
        .eq("id", editingProgram.value.id)
        .select();
    } else {
      result = await supabase.from("programs").insert(payload).select();
    }

    if (result.error) {
      throw result.error;
    }

    const sedangEdit = Boolean(editingProgram.value);

    showModal.value = false;
    editingProgram.value = null;
    resetForm();

    await getPrograms();

    successMessage.value = sedangEdit
      ? "Program berhasil diperbarui."
      : "Program baru berhasil ditambahkan.";
  } catch (err) {
    console.error("ERROR SAVE PROGRAM:", err);

    errorMessage.value =
      err.message || "Terjadi kesalahan saat menyimpan program.";
  } finally {
    saving.value = false;
    uploading.value = false;
  }
};

// ===============================
// HAPUS
// ===============================

const deleteProgram = async () => {
  const program = programDihapus.value;

  if (!program || deleting.value) return;

  deleting.value = true;
  listErrorMessage.value = "";
  successMessage.value = "";

  try {
    // .select() dipakai agar bisa membedakan "benar-benar terhapus" dari
    // "ditolak diam-diam oleh kebijakan keamanan (RLS) Supabase".
    const { data, error } = await supabase
      .from("programs")
      .delete()
      .eq("id", program.id)
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      listErrorMessage.value =
        "Program tidak terhapus. Kemungkinan sesi admin sudah berakhir. Coba keluar lalu masuk kembali.";
      return;
    }

    programs.value = programs.value.filter((item) => item.id !== program.id);

    successMessage.value = `Program "${program.title}" berhasil dihapus.`;
  } catch (err) {
    console.error("ERROR DELETE PROGRAM:", err);

    listErrorMessage.value =
      err.message || "Terjadi kesalahan saat menghapus program.";
  } finally {
    deleting.value = false;
    programDihapus.value = null;
  }
};

onMounted(() => { getPrograms(); loadCategories(); });
</script>

<template>
  <AdminPage
    title="Program"
    description="Daftar kegiatan dan program yang dijalankan bersama anak-anak. Tiga program pertama juga tampil di halaman depan."
    public-path="/program"
    wide
  >
    <template #toolbar>
      <div
        class="mt-6 flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
      >
        <p class="text-sm text-gray-600">
          <template v-if="loading">Memuat...</template>

          <template v-else-if="programs.length">
            Saat ini ada
            <strong class="font-semibold text-gray-900">
              {{ programs.length }} program
            </strong>
            yang tampil di website.
          </template>

          <template v-else>Belum ada program yang ditambahkan.</template>


        </p>

        <div class="flex flex-col gap-3 sm:flex-row">
          <button type="button" @click="showCategories = true" class="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">Kelola Program</button>
        <button
          type="button"
          @click="openAddModal"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          <Plus class="h-4 w-4" />
          Tambah Program
        </button>
        </div>
      </div>
    </template>

    <AdminProgramText />

    <AdminAlert
      :error="listErrorMessage"
      :success="successMessage"
      @dismiss="
        listErrorMessage = '';
        successMessage = '';
      "
    />

    <div class="mb-5 flex flex-wrap gap-2">
      <button v-for="category in ['Semua', ...categories]" :key="category" type="button"
        @click="tabAktif = category" :aria-pressed="tabAktif === category"
        class="rounded-full px-4 py-2 text-sm font-semibold"
        :class="tabAktif === category ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600'">{{ category }}</button>
    </div>

    <!-- MEMUAT -->
    <div
      v-if="loading"
      class="rounded-2xl border border-gray-200 bg-white p-16 text-center text-sm text-gray-500"
    >
      Memuat program...
    </div>

    <!-- KOSONG -->
    <div
      v-else-if="programs.length === 0"
      class="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center"
    >
      <p class="font-semibold text-gray-900">Belum ada program</p>

      <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
        Tambahkan kegiatan yang rutin dijalankan bersama anak-anak, misalnya
        bimbingan belajar, mengaji, atau pemeriksaan kesehatan.
      </p>

      <button
        type="button"
        @click="openAddModal"
        class="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
      >
        <Plus class="h-4 w-4" />
        Tambah Program Pertama
      </button>
    </div>

    <!-- TAB KOSONG -->
    <div
      v-else-if="programTampil.length === 0"
      class="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-sm text-gray-500"
    >
      Belum ada program pada kategori ini.
    </div>

    <!-- DAFTAR -->
    <div v-else class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="program in programTampil"
        :key="program.id"
        class="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white"
      >
        <div class="aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            v-if="program.image_url"
            :src="program.image_url"
            :alt="program.title"
            loading="lazy"
            class="h-full w-full object-contain"
          />

          <div
            v-else
            class="flex h-full items-center justify-center text-sm text-gray-400"
          >
            Tidak ada foto
          </div>
        </div>

        <div class="flex flex-1 flex-col p-5">
          <div class="flex flex-wrap gap-1.5">
            <span
              v-if="program.category"
              class="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
            >
              {{ program.category }}
            </span>


          </div>

          <h2 class="mt-2 text-lg font-bold text-gray-900">
            {{ program.title }}
          </h2>

          <p class="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-gray-500">
            {{ program.description }}
          </p>

          <div class="mt-5 flex gap-2">
            <button
              type="button"
              @click="openEditModal(program)"
              class="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Pencil class="h-4 w-4" />
              Ubah
            </button>

            <button
              type="button"
              @click="programDihapus = program"
              aria-label="Hapus program"
              class="flex items-center justify-center rounded-xl border border-gray-200 px-3.5 py-2.5 text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
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
              {{ editingProgram ? "Ubah Program" : "Tambah Program" }}
            </h2>

            <p class="mt-1 text-sm text-gray-500">
              Isi keterangan program, lalu tekan Simpan.
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

        <form @submit.prevent="saveProgram" class="space-y-5 px-6 py-6">
          <datalist id="program-categories"><option v-for="category in categories" :key="category" :value="category" /></datalist>
          <AdminAlert :error="errorMessage" @dismiss="errorMessage = ''" />

          <AdminField
            v-slot="{ id }"
            label="Nama program"
            hint="Nama kegiatan seperti yang biasa disebut sehari-hari."
            required
            :value="form.title"
            :max="60"
          >
            <input
              :id="id"
              v-model="form.title"
              type="text"
              required
              placeholder="Contoh: Bimbingan Belajar"
              class="admin-input"
            />
          </AdminField>

          <AdminField
            v-slot="{ id }"
            label="Kategori"
            hint="Isi jenis kegiatan sendiri atau pilih kategori yang sudah ada. Kategori menjadi pilihan filter di halaman Program."
            :value="form.category"
            :max="24"
          >
            <input
              :id="id"
              v-model="form.category"
              list="program-categories"
              type="text"
              placeholder="Contoh: Pendidikan"
              class="admin-input"
            />
          </AdminField>



          <AdminField
            v-slot="{ id }"
            label="Penjelasan program"
            hint="Jelaskan kegiatannya seperti apa dan manfaatnya bagi anak-anak. Cukup 2-3 kalimat."
            required
            :value="form.description"
            :max="300"
          >
            <textarea
              :id="id"
              v-model="form.description"
              rows="5"
              required
              placeholder="Contoh: Kegiatan belajar bersama setiap sore untuk membantu anak-anak menyelesaikan tugas sekolah."
              class="admin-textarea"
            ></textarea>
          </AdminField>

          <div>
            <p class="text-sm font-semibold text-gray-800">
              Foto program
              <span class="text-red-500">*</span>
            </p>

            <AdminImageInput
              class="mt-2"
              :preview-url="imagePreviewUrl"
              :file-name="selectedImageFile?.name || ''"
              :disabled="saving"
              hint="Foto kegiatan ditampilkan utuh tanpa terpotong. Foto tegak maupun mendatar bisa digunakan."
              aspect="4/3"
              fit="contain"
              @select="handleImageSelect"
              @clear="handleImageClear"
              @error="errorMessage = $event"
            />
          </div>

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

    <div v-if="showCategories" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5" @click.self="!categoryBusy && (showCategories = false)">
      <section role="dialog" aria-modal="true" aria-labelledby="category-title" class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6">
        <div class="flex items-center justify-between gap-4">
          <h2 id="category-title" class="text-xl font-bold">Kelola Program</h2>
          <button type="button" :disabled="categoryBusy" @click="showCategories = false" aria-label="Tutup" class="p-2">&#215;</button>
        </div>
        <p class="mt-3 text-sm text-gray-600">Atur jenis kegiatan untuk pilihan kategori dan filter halaman Program. Mengubah nama juga memperbarui label program yang memakainya.</p>
        <p v-if="!categoriesAvailable" class="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800">Jalankan supabase/program_categories.sql di Supabase SQL Editor untuk mengaktifkan pengelolaan jenis program.</p>
        <AdminAlert class="mt-4" :error="categoryError" @dismiss="categoryError = ''" />
        <form class="my-5 flex gap-2" @submit.prevent="saveCategory">
          <input v-model="categoryName" aria-label="Nama jenis kegiatan" required maxlength="60" placeholder="Nama jenis kegiatan" class="admin-input min-w-0 flex-1" :disabled="categoryBusy || !categoriesAvailable" />
          <button class="rounded-xl bg-emerald-600 px-4 py-2 font-semibold text-white disabled:opacity-50" :disabled="categoryBusy || !categoriesAvailable">{{ editingCategory !== null ? 'Simpan' : 'Tambah' }}</button>
          <button v-if="editingCategory !== null" type="button" :disabled="categoryBusy" @click="editingCategory = null; categoryName = ''">Batal</button>
        </form>
        <ul class="space-y-3">
          <li v-for="category in categories" :key="category" class="flex items-center gap-3 rounded-xl border border-gray-200 p-3">
            <span class="flex-1 font-semibold">{{ category }}</span>
            <button type="button" :disabled="categoryBusy || !categoriesAvailable" @click="editingCategory = category; categoryName = category" class="text-emerald-700 disabled:opacity-50">Ubah</button>
            <button type="button" :disabled="categoryBusy || !categoriesAvailable" @click="deletingCategory = category" class="text-red-600 disabled:opacity-50">Hapus</button>
          </li>
        </ul>
        <p v-if="!categories.length" class="text-sm text-gray-500">Belum ada jenis kegiatan.</p>
      </section>
    </div>
    <AdminConfirm :open="deletingCategory !== null" danger :busy="categoryBusy" title="Hapus jenis program?"
      :message="`Jenis ${deletingCategory || ''} akan dihapus. Programnya tetap tersimpan di Semua dengan kategori dikosongkan.`"
      confirm-label="Ya, hapus" @confirm="deleteCategory" @cancel="deletingCategory = null" />

    <!-- KONFIRMASI HAPUS -->
    <AdminConfirm
      :open="Boolean(programDihapus)"
      danger
      :busy="deleting"
      title="Hapus program ini?"
      :message="`Program &quot;${programDihapus?.title || ''}&quot; akan langsung hilang dari website. Tindakan ini tidak dapat dibatalkan.`"
      confirm-label="Ya, hapus"
      @confirm="deleteProgram"
      @cancel="programDihapus = null"
    />
  </AdminPage>
</template>
