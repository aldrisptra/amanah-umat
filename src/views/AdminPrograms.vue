<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { Pencil, Plus, Trash2 } from "lucide-vue-next";
import { supabase } from "../lib/supabase";
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

  const filePath = `programs/${buildStorageFileName(file)}`;

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

    let uploadedImageUrl = form.image_url.trim();

    if (selectedImageFile.value) {
      uploadedImageUrl = await uploadImageFile(selectedImageFile.value);
    }

    const payload = {
      title: form.title.trim(),
      category: form.category.trim(),
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

onMounted(getPrograms);
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

        <button
          type="button"
          @click="openAddModal"
          class="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          <Plus class="h-4 w-4" />
          Tambah Program
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

    <!-- DAFTAR -->
    <div v-else class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      <article
        v-for="program in programs"
        :key="program.id"
        class="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white"
      >
        <div class="aspect-[4/3] overflow-hidden bg-gray-100">
          <img
            v-if="program.image_url"
            :src="program.image_url"
            :alt="program.title"
            loading="lazy"
            class="h-full w-full object-cover"
          />

          <div
            v-else
            class="flex h-full items-center justify-center text-sm text-gray-400"
          >
            Tidak ada foto
          </div>
        </div>

        <div class="flex flex-1 flex-col p-5">
          <span
            v-if="program.category"
            class="self-start rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
          >
            {{ program.category }}
          </span>

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
            hint="Satu kata pengelompokan, tampil sebagai label kecil di atas nama program."
            :value="form.category"
            :max="24"
          >
            <input
              :id="id"
              v-model="form.category"
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
              hint="Foto kegiatan ini berlangsung. Foto mendatar (landscape) akan tampil paling rapi."
              aspect="4/3"
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
