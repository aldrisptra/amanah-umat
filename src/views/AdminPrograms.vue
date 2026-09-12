<script setup>
import { onMounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";

const router = useRouter();

// ===============================
// STATE
// ===============================

const programs = ref([]);
const loading = ref(true);

const showModal = ref(false);
const saving = ref(false);
const deleting = ref(false);

const editingProgram = ref(null);
const errorMessage = ref("");

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

const uploadImageFile = async (file) => {
  if (!file) return "";

  const fileExt = file.name.split(".").pop() || "png";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `programs/${fileName}`;

  const { data, error } = await supabase.storage
    .from("images")
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from("images")
    .getPublicUrl(data.path);

  return publicUrlData.publicUrl;
};

const handleImageChange = (event) => {
  const file = event.target.files?.[0];

  if (!file) return;

  selectedImageFile.value = file;
  imagePreviewUrl.value = URL.createObjectURL(file);
};

// ===============================
// GET PROGRAMS
// ===============================

const getPrograms = async () => {
  loading.value = true;

  try {
    const { data, error } = await supabase
      .from("programs")
      .select("*")
      .order("created_at", { ascending: true });

    console.log("PROGRAM DATA:", data);
    console.log("PROGRAM ERROR:", error);

    if (error) {
      console.error("Gagal mengambil program:", error);

      programs.value = [];

      errorMessage.value = error.message;
      return;
    }

    programs.value = data || [];
  } catch (err) {
    console.error("ERROR GET PROGRAMS:", err);

    programs.value = [];
    errorMessage.value = "Gagal mengambil data program.";
  } finally {
    loading.value = false;
  }
};

// ===============================
// RESET FORM
// ===============================

const resetForm = () => {
  form.title = "";
  form.category = "";
  form.description = "";
  form.image_url = "";
  selectedImageFile.value = null;
  imagePreviewUrl.value = "";
};

// ===============================
// TAMBAH PROGRAM
// ===============================

const openAddModal = () => {
  editingProgram.value = null;
  errorMessage.value = "";

  resetForm();

  showModal.value = true;
};

// ===============================
// EDIT PROGRAM
// ===============================

const openEditModal = (program) => {
  editingProgram.value = program;
  errorMessage.value = "";

  form.title = program.title || "";
  form.category = program.category || "";
  form.description = program.description || "";
  form.image_url = program.image_url || "";
  selectedImageFile.value = null;
  imagePreviewUrl.value = program.image_url || "";

  showModal.value = true;
};

// ===============================
// TUTUP MODAL
// ===============================

const closeModal = () => {
  if (saving.value) return;

  showModal.value = false;
  editingProgram.value = null;
  errorMessage.value = "";

  resetForm();
};

// ===============================
// SIMPAN PROGRAM
// ===============================

const saveProgram = async () => {
  if (saving.value) return;

  saving.value = true;
  errorMessage.value = "";

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

    console.log("EDITING PROGRAM:", editingProgram.value);
    console.log("PAYLOAD:", payload);

    let result;

    if (editingProgram.value) {
      result = await supabase
        .from("programs")
        .update(payload)
        .eq("id", editingProgram.value.id)
        .select();

      console.log("UPDATE DATA:", result.data);
      console.log("UPDATE ERROR:", result.error);
    } else {
      result = await supabase.from("programs").insert(payload).select();

      console.log("INSERT DATA:", result.data);
      console.log("INSERT ERROR:", result.error);
    }

    if (result.error) {
      throw result.error;
    }

    showModal.value = false;
    editingProgram.value = null;
    resetForm();
    await getPrograms();
  } catch (err) {
    console.error("ERROR SAVE PROGRAM:", err);

    errorMessage.value =
      err.message || "Terjadi kesalahan saat menyimpan program.";
  } finally {
    saving.value = false;
  }
};

// ===============================
// HAPUS PROGRAM
// ===============================

const deleteProgram = async (program) => {
  if (deleting.value) return;

  const confirmed = window.confirm(
    `Yakin ingin menghapus program "${program.title}"?`,
  );

  if (!confirmed) return;

  deleting.value = true;

  console.log("==============================");
  console.log("MULAI HAPUS PROGRAM");
  console.log("PROGRAM:", program);
  console.log("PROGRAM ID:", program.id);
  console.log("==============================");

  try {
    const { data, error } = await supabase
      .from("programs")
      .delete()
      .eq("id", program.id)
      .select();

    console.log("DELETE DATA:", data);
    console.log("DELETE ERROR:", error);

    // =========================
    // JIKA ADA ERROR
    // =========================

    if (error) {
      console.error("GAGAL MENGHAPUS PROGRAM:", error);

      window.alert(`Program gagal dihapus.\n\nError:\n${error.message}`);

      return;
    }

    // =========================
    // JIKA TIDAK ADA DATA
    // =========================

    if (!data || data.length === 0) {
      console.warn("TIDAK ADA DATA YANG TERHAPUS");

      window.alert(
        "Program tidak terhapus.\n\n" +
          "Kemungkinan DELETE Policy / RLS di Supabase belum mengizinkan akun admin menghapus data.",
      );

      return;
    }

    // =========================
    // BERHASIL
    // =========================

    console.log("==============================");
    console.log("PROGRAM BERHASIL DIHAPUS");
    console.log("DATA YANG DIHAPUS:", data);
    console.log("==============================");

    // Hapus langsung dari tampilan
    programs.value = programs.value.filter((item) => item.id !== program.id);

    window.alert("Program berhasil dihapus.");
  } catch (err) {
    console.error("ERROR DELETE PROGRAM:", err);

    window.alert("Terjadi kesalahan saat menghapus program.");
  } finally {
    deleting.value = false;
  }
};

// ===============================
// LOGOUT
// ===============================

const logout = async () => {
  await supabase.auth.signOut();

  router.replace("/admin/login");
};

// ===============================
// CHECK SESSION
// ===============================

const checkSession = async () => {
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error("SESSION ERROR:", error);

    router.replace("/admin/login");

    return false;
  }

  if (!data.session) {
    router.replace("/admin/login");

    return false;
  }

  return true;
};

// ===============================
// ON MOUNTED
// ===============================

onMounted(async () => {
  const isLoggedIn = await checkSession();

  if (isLoggedIn) {
    await getPrograms();
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- ========================= -->
    <!-- HEADER -->
    <!-- ========================= -->

    <header class="border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8"
      >
        <div>
          <h1 class="text-xl font-bold text-gray-900">Kelola Program</h1>

          <p class="text-sm text-gray-500">
            Kelola program yang tampil di website.
          </p>
        </div>

        <div class="flex items-center gap-3">
          <router-link
            to="/admin"
            class="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            ← Dashboard
          </router-link>

          <button
            @click="logout"
            class="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          >
            Keluar
          </button>
        </div>
      </div>
    </header>

    <!-- ========================= -->
    <!-- CONTENT -->
    <!-- ========================= -->

    <main class="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <!-- TOP -->

      <div
        class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"
      >
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Daftar Program</h2>

          <p class="mt-1 text-sm text-gray-500">
            {{ programs.length }} program tersedia.
          </p>
        </div>

        <button
          @click="openAddModal"
          class="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          + Tambah Program
        </button>
      </div>

      <!-- ERROR -->

      <div
        v-if="errorMessage && !showModal"
        class="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
      >
        {{ errorMessage }}
      </div>

      <!-- LOADING -->

      <div
        v-if="loading"
        class="mt-10 rounded-2xl bg-white p-12 text-center shadow-sm"
      >
        <p class="text-gray-500">Memuat program...</p>
      </div>

      <!-- EMPTY -->

      <div
        v-else-if="programs.length === 0"
        class="mt-10 rounded-2xl bg-white p-12 text-center shadow-sm"
      >
        <p class="text-gray-500">Belum ada program.</p>

        <button
          @click="openAddModal"
          class="mt-4 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          + Tambah Program
        </button>
      </div>

      <!-- PROGRAM LIST -->

      <div v-else class="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="program in programs"
          :key="program.id"
          class="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
        >
          <!-- IMAGE -->

          <div class="aspect-[4/3] overflow-hidden bg-gray-100">
            <img
              v-if="program.image_url"
              :src="program.image_url"
              :alt="program.title"
              class="h-full w-full object-cover"
            />

            <div
              v-else
              class="flex h-full items-center justify-center text-sm text-gray-400"
            >
              Tidak ada gambar
            </div>
          </div>

          <!-- CONTENT -->

          <div class="p-6">
            <span
              class="text-xs font-semibold uppercase tracking-wider text-emerald-600"
            >
              {{ program.category || "Program" }}
            </span>

            <h3 class="mt-2 text-xl font-bold text-gray-900">
              {{ program.title }}
            </h3>

            <p class="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
              {{ program.description }}
            </p>

            <!-- ACTION -->

            <div class="mt-6 flex gap-3">
              <!-- EDIT -->

              <button
                @click="openEditModal(program)"
                class="flex-1 rounded-xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-600 transition hover:bg-emerald-50"
              >
                Edit
              </button>

              <!-- DELETE -->

              <button
                @click="deleteProgram(program)"
                :disabled="deleting"
                class="flex-1 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {{ deleting ? "Menghapus..." : "Hapus" }}
              </button>
            </div>
          </div>
        </article>
      </div>
    </main>

    <!-- ========================= -->
    <!-- MODAL -->
    <!-- ========================= -->

    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5 py-10"
      @click.self="closeModal"
    >
      <div
        class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <!-- MODAL HEADER -->

        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">
              {{ editingProgram ? "Edit Program" : "Tambah Program" }}
            </h2>

            <p class="mt-1 text-sm text-gray-500">
              Isi informasi program di bawah.
            </p>
          </div>

          <button
            @click="closeModal"
            class="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-500 hover:bg-gray-200"
          >
            ×
          </button>
        </div>

        <!-- FORM -->

        <form @submit.prevent="saveProgram" class="mt-7 space-y-5">
          <!-- TITLE -->

          <div>
            <label class="text-sm font-semibold text-gray-700">
              Judul Program
            </label>

            <input
              v-model="form.title"
              type="text"
              required
              placeholder="Contoh: Program Pendidikan"
              class="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <!-- CATEGORY -->

          <div>
            <label class="text-sm font-semibold text-gray-700">
              Kategori
            </label>

            <input
              v-model="form.category"
              type="text"
              placeholder="Contoh: Pendidikan"
              class="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <!-- DESCRIPTION -->

          <div>
            <label class="text-sm font-semibold text-gray-700">
              Deskripsi
            </label>

            <textarea
              v-model="form.description"
              rows="5"
              required
              placeholder="Jelaskan program..."
              class="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            ></textarea>
          </div>

          <!-- IMAGE -->

          <div>
            <label class="text-sm font-semibold text-gray-700">
              Foto Program
            </label>

            <input
              type="file"
              accept="image/*"
              @change="handleImageChange"
              class="mt-2 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              :required="!editingProgram"
            />

            <p class="mt-2 text-xs text-gray-400">
              Upload foto dari perangkat admin. File akan otomatis disimpan di
              Supabase Storage.
            </p>
          </div>

          <div v-if="imagePreviewUrl || form.image_url">
            <p class="mb-2 text-sm font-semibold text-gray-700">Preview</p>

            <div class="overflow-hidden rounded-2xl bg-gray-100">
              <img
                :src="imagePreviewUrl || form.image_url"
                alt="Preview program"
                class="max-h-64 w-full object-cover"
              />
            </div>
          </div>

          <!-- ERROR -->

          <div
            v-if="errorMessage"
            class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
          >
            {{ errorMessage }}
          </div>

          <!-- ACTION -->

          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="closeModal"
              :disabled="saving"
              class="flex-1 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              :disabled="saving"
              class="flex-1 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ saving ? "Menyimpan..." : "Simpan" }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
