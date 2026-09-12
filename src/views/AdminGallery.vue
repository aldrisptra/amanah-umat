<template>
  <div class="min-h-screen bg-gray-50">
    <!-- HEADER -->
    <div class="border-b bg-white">
      <div
        class="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Kelola Galeri</h1>

          <p class="mt-1 text-sm text-gray-500">
            Kelola foto kegiatan dan momen anak-anak Amanah Ummat.
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
            @click="openAddModal"
            class="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            + Tambah Foto
          </button>
        </div>
      </div>
    </div>

    <!-- CONTENT -->
    <main class="mx-auto max-w-7xl px-5 py-8 lg:px-8">
      <!-- LOADING -->
      <div
        v-if="loading"
        class="rounded-2xl bg-white py-20 text-center text-gray-500 shadow-sm"
      >
        Memuat galeri...
      </div>

      <!-- EMPTY -->
      <div
        v-else-if="gallery.length === 0"
        class="rounded-2xl bg-white py-20 text-center shadow-sm"
      >
        <p class="text-gray-500">Belum ada foto di galeri.</p>

        <button
          @click="openAddModal"
          class="mt-5 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Tambah Foto Pertama
        </button>
      </div>

      <!-- GALLERY GRID -->
      <div
        v-else
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        <article
          v-for="item in gallery"
          :key="item.id"
          class="overflow-hidden rounded-2xl bg-white shadow-sm"
        >
          <!-- IMAGE -->
          <div class="aspect-square overflow-hidden bg-gray-100">
            <img
              :src="item.image_url"
              :alt="item.alt_text || 'Foto galeri Amanah Ummat'"
              class="h-full w-full object-cover transition duration-500 hover:scale-105"
            />
          </div>

          <!-- INFO -->
          <div class="p-5">
            <p
              class="text-xs font-semibold uppercase tracking-wider text-emerald-600"
            >
              {{ item.category || "Umum" }}
            </p>

            <h2 class="mt-2 line-clamp-2 font-bold text-gray-900">
              {{ item.alt_text || "Foto Galeri" }}
            </h2>

            <div class="mt-5 flex gap-2">
              <button
                @click="openEditModal(item)"
                class="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Edit
              </button>

              <button
                @click="deleteGallery(item)"
                class="flex-1 rounded-xl bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                Hapus
              </button>
            </div>
          </div>
        </article>
      </div>
    </main>

    <!-- MODAL -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-5 py-8"
      @click.self="closeModal"
    >
      <div
        class="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8"
      >
        <!-- MODAL HEADER -->
        <div class="flex items-start justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-900">
              {{ editingGallery ? "Edit Foto" : "Tambah Foto" }}
            </h2>

            <p class="mt-1 text-sm text-gray-500">Isi informasi foto galeri.</p>
          </div>

          <button
            @click="closeModal"
            class="text-2xl text-gray-400 transition hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <!-- FORM -->
        <form @submit.prevent="saveGallery" class="mt-7 space-y-5">
          <!-- ALT TEXT -->
          <div>
            <label class="text-sm font-semibold text-gray-700">
              Judul / Keterangan Foto
            </label>

            <input
              v-model="form.alt_text"
              type="text"
              placeholder="Contoh: Kegiatan belajar bersama"
              class="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              required
            />
          </div>

          <!-- CATEGORY -->
          <div>
            <label class="text-sm font-semibold text-gray-700">
              Kategori
            </label>

            <select
              v-model="form.category"
              class="mt-2 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            >
              <option value="">Umum</option>
              <option value="Pendidikan">Pendidikan</option>
              <option value="Keagamaan">Keagamaan</option>
              <option value="Kebersamaan">Kebersamaan</option>
              <option value="Kegiatan">Kegiatan</option>
            </select>
          </div>

          <!-- IMAGE FILE -->
          <div>
            <label class="text-sm font-semibold text-gray-700">
              Foto Galeri
            </label>

            <input
              type="file"
              accept="image/*"
              @change="handleImageChange"
              class="mt-2 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
              :required="!editingGallery"
            />

            <p class="mt-2 text-xs text-gray-400">
              Upload foto dari perangkat admin. File akan disimpan di Supabase
              Storage.
            </p>
          </div>

          <!-- PREVIEW -->
          <div v-if="imagePreviewUrl || form.image_url">
            <p class="mb-2 text-sm font-semibold text-gray-700">Preview</p>

            <div class="overflow-hidden rounded-2xl bg-gray-100">
              <img
                :src="imagePreviewUrl || form.image_url"
                alt="Preview"
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

          <!-- BUTTONS -->
          <div class="flex gap-3 pt-2">
            <button
              type="button"
              @click="closeModal"
              class="flex-1 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
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

<script setup>
import { onMounted, reactive, ref } from "vue";
import { supabase } from "../lib/supabase";

const gallery = ref([]);
const loading = ref(true);

const showModal = ref(false);
const saving = ref(false);
const editingGallery = ref(null);
const errorMessage = ref("");
const selectedImageFile = ref(null);
const imagePreviewUrl = ref("");

const form = reactive({
  image_url: "",
  alt_text: "",
  category: "",
});

const uploadImageFile = async (file) => {
  if (!file) return "";

  const fileExt = file.name.split(".").pop() || "png";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `gallery/${fileName}`;

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

const getGallery = async () => {
  loading.value = true;

  const { data, error } = await supabase
    .from("gallery")
    .select("*")
    .order("created_at", { ascending: true });

  console.log("GALLERY DATA:", data);
  console.log("GALLERY ERROR:", error);

  if (error) {
    console.error("Gagal mengambil data galeri:", error);
    errorMessage.value = error.message;
    loading.value = false;
    return;
  }

  gallery.value = data || [];
  loading.value = false;
};

const resetForm = () => {
  form.image_url = "";
  form.alt_text = "";
  form.category = "";
  selectedImageFile.value = null;
  imagePreviewUrl.value = "";
};

const openAddModal = () => {
  editingGallery.value = null;
  resetForm();
  errorMessage.value = "";
  showModal.value = true;
};

const openEditModal = (item) => {
  editingGallery.value = item;

  form.image_url = item.image_url || "";
  form.alt_text = item.alt_text || "";
  form.category = item.category || "";
  selectedImageFile.value = null;
  imagePreviewUrl.value = item.image_url || "";

  errorMessage.value = "";
  showModal.value = true;
};

const closeModal = () => {
  if (saving.value) return;

  showModal.value = false;
  editingGallery.value = null;
  errorMessage.value = "";
  resetForm();
};

const saveGallery = async () => {
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
      alt_text: form.alt_text,
      category: form.category || null,
    };

    console.log("EDITING GALLERY:", editingGallery.value);
    console.log("PAYLOAD:", payload);

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

    console.log("GALERI BERHASIL DISIMPAN", result.data);

    showModal.value = false;
    resetForm();
    await getGallery();
  } catch (error) {
    console.error("GAGAL MENYIMPAN GALERI:", error);
    errorMessage.value = error.message || "Gagal menyimpan foto.";
  } finally {
    saving.value = false;
  }
};

const deleteGallery = async (item) => {
  const confirmed = window.confirm(
    `Hapus foto "${item.alt_text || "Foto Galeri"}"?`,
  );

  if (!confirmed) return;

  const { error } = await supabase.from("gallery").delete().eq("id", item.id);

  if (error) {
    console.error("Gagal menghapus foto:", error);

    window.alert(`Gagal menghapus foto: ${error.message}`);

    return;
  }

  console.log("FOTO BERHASIL DIHAPUS");

  await getGallery();
};

onMounted(() => {
  getGallery();
});
</script>
