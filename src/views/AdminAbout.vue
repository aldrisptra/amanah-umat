<script setup>
import { onMounted, reactive, ref } from "vue";
import { supabase } from "../lib/supabase";

const about = ref(null);
const loading = ref(true);
const saving = ref(false);
const errorMessage = ref("");
const selectedImageFile = ref(null);
const imagePreviewUrl = ref("");

const form = reactive({
  title: "",
  description: "",
  image_url: "",
});

const uploadImageFile = async (file) => {
  if (!file) return "";

  const fileExt = file.name.split(".").pop() || "png";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `about/${fileName}`;

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

const resetForm = () => {
  form.title = "";
  form.description = "";
  form.image_url = "";
  selectedImageFile.value = null;
  imagePreviewUrl.value = "";
};

const getAbout = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const { data, error } = await supabase
      .from("about")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1);

    if (error) {
      throw error;
    }

    const record = data?.[0] || null;
    about.value = record;

    if (record) {
      form.title = record.title || "";
      form.description = record.description || "";
      form.image_url = record.image_url || "";
      imagePreviewUrl.value = record.image_url || "";
    } else {
      resetForm();
    }
  } catch (error) {
    console.error("Gagal mengambil data tentang:", error);
    errorMessage.value = error.message || "Gagal mengambil data tentang.";
  } finally {
    loading.value = false;
  }
};

const saveAbout = async () => {
  if (saving.value) return;

  saving.value = true;
  errorMessage.value = "";

  try {
    let uploadedImageUrl = form.image_url.trim();

    if (selectedImageFile.value) {
      uploadedImageUrl = await uploadImageFile(selectedImageFile.value);
    }

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      image_url: uploadedImageUrl,
    };

    let result;

    if (about.value?.id) {
      result = await supabase
        .from("about")
        .update(payload)
        .eq("id", about.value.id)
        .select();
    } else {
      result = await supabase.from("about").insert(payload).select();
    }

    if (result.error) {
      throw result.error;
    }

    await getAbout();
  } catch (error) {
    console.error("Gagal menyimpan data tentang:", error);
    errorMessage.value = error.message || "Gagal menyimpan data tentang.";
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  getAbout();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8"
      >
        <div>
          <p
            class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600"
          >
            Admin Panel
          </p>
          <h1 class="mt-1 text-2xl font-bold text-gray-900">Kelola Tentang</h1>
        </div>

        <router-link
          to="/admin"
          class="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
        >
          ← Dashboard
        </router-link>
      </div>
    </header>

    <main class="mx-auto max-w-4xl px-5 py-8 lg:px-8">
      <div
        class="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div class="mb-6">
          <h2 class="text-xl font-bold text-gray-900">
            Informasi Halaman Tentang
          </h2>
          <p class="mt-1 text-sm text-gray-500">
            Atur judul, deskripsi, dan foto utama pada halaman Tentang Kami.
          </p>
        </div>

        <div
          v-if="errorMessage"
          class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {{ errorMessage }}
        </div>

        <form v-if="!loading" @submit.prevent="saveAbout" class="space-y-5">
          <div>
            <label class="mb-2 block text-sm font-semibold text-gray-700"
              >Judul</label
            >
            <input
              v-model="form.title"
              type="text"
              class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-emerald-500"
              placeholder="Mengenal LKSA Asuhan Amanah Ummat"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-gray-700"
              >Deskripsi</label
            >
            <textarea
              v-model="form.description"
              rows="7"
              class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-emerald-500"
              placeholder="Masukkan deskripsi tentang yayasan"
            />
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-gray-700"
              >Upload Foto</label
            >

            <div
              class="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4"
            >
              <input
                type="file"
                accept="image/*"
                @change="handleImageChange"
                class="block w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </div>

            <div
              v-if="imagePreviewUrl"
              class="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white p-3"
            >
              <img
                :src="imagePreviewUrl"
                alt="Preview Tentang"
                class="h-56 w-full rounded-xl object-cover"
              />
            </div>
          </div>

          <div class="flex items-center justify-end pt-2">
            <button
              type="submit"
              :disabled="saving"
              class="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {{ saving ? "Menyimpan..." : "Simpan Tentang" }}
            </button>
          </div>
        </form>

        <div v-else class="py-10 text-center text-sm text-gray-500">
          Memuat data tentang...
        </div>
      </div>
    </main>
  </div>
</template>
