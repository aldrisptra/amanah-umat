<script setup>
import { onMounted, reactive, ref } from "vue";
import { supabase } from "../lib/supabase";

const loading = ref(true);
const saving = ref(false);
const uploading = ref(false);

const errorMessage = ref("");
const successMessage = ref("");

const homeContent = ref(null);

const selectedImageFile = ref(null);
const imagePreviewUrl = ref("");

const form = reactive({
  hero_title: "",
  hero_description: "",
  hero_image_url: "",
  cta_title: "",
  cta_description: "",
});

/* =========================
   GET HOME CONTENT
========================= */
const getHomeContent = async () => {
  loading.value = true;
  errorMessage.value = "";

  const { data, error } = await supabase
    .from("home_content")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  console.log("HOME DATA:", data);
  console.log("HOME ERROR:", error);

  if (error) {
    console.error("Gagal mengambil data beranda:", error);
    errorMessage.value = error.message;
    loading.value = false;
    return;
  }

  homeContent.value = data;

  form.hero_title = data.hero_title || "";
  form.hero_description = data.hero_description || "";
  form.hero_image_url = data.hero_image_url || "";
  form.cta_title = data.cta_title || "";
  form.cta_description = data.cta_description || "";

  loading.value = false;
};

/* =========================
   HANDLE IMAGE
========================= */
const handleImageChange = (event) => {
  const file = event.target.files?.[0];

  if (!file) return;

  // Cek file harus gambar
  if (!file.type.startsWith("image/")) {
    errorMessage.value = "File yang dipilih harus berupa gambar.";
    selectedImageFile.value = null;
    imagePreviewUrl.value = "";
    return;
  }

  // Maksimal 5 MB
  if (file.size > 5 * 1024 * 1024) {
    errorMessage.value = "Ukuran foto maksimal 5 MB.";
    selectedImageFile.value = null;
    imagePreviewUrl.value = "";
    return;
  }

  errorMessage.value = "";
  successMessage.value = "";

  selectedImageFile.value = file;

  // Preview foto baru
  imagePreviewUrl.value = URL.createObjectURL(file);
};

/* =========================
   UPLOAD IMAGE
========================= */
const uploadImageFile = async (file) => {
  if (!file) return form.hero_image_url;

  uploading.value = true;

  const fileExt = file.name.split(".").pop() || "png";

  const fileName = `hero-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${fileExt}`;

  const filePath = `home/${fileName}`;

  const { data, error } = await supabase.storage
    .from("images")
    .upload(filePath, file, {
      cacheControl: "3600",
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

/* =========================
   SAVE HOME
========================= */
const saveHome = async () => {
  if (!homeContent.value) return;

  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    let uploadedImageUrl = form.hero_image_url;

    // Upload foto jika admin memilih foto baru
    if (selectedImageFile.value) {
      uploadedImageUrl = await uploadImageFile(selectedImageFile.value);
    }

    const payload = {
      hero_title: form.hero_title,
      hero_description: form.hero_description,
      hero_image_url: uploadedImageUrl,
      cta_title: form.cta_title,
      cta_description: form.cta_description,
      updated_at: new Date().toISOString(),
    };

    console.log("HOME PAYLOAD:", payload);

    const { data, error } = await supabase
      .from("home_content")
      .update(payload)
      .eq("id", homeContent.value.id)
      .select();

    if (error) {
      throw error;
    }

    console.log("BERANDA BERHASIL DISIMPAN:", data);

    form.hero_image_url = uploadedImageUrl;

    selectedImageFile.value = null;

    if (imagePreviewUrl.value) {
      URL.revokeObjectURL(imagePreviewUrl.value);
    }

    imagePreviewUrl.value = "";

    successMessage.value = "Perubahan beranda berhasil disimpan.";

    await getHomeContent();
  } catch (error) {
    console.error("GAGAL MENYIMPAN BERANDA:", error);

    errorMessage.value = error.message || "Gagal menyimpan perubahan.";
  } finally {
    saving.value = false;
    uploading.value = false;
  }
};

onMounted(() => {
  getHomeContent();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- HEADER -->
    <div class="border-b bg-white">
      <div
        class="mx-auto flex max-w-7xl items-center justify-between px-5 py-6 lg:px-8"
      >
        <div>
          <h1 class="text-2xl font-bold text-gray-900">Kelola Beranda</h1>

          <p class="mt-1 text-sm text-gray-500">
            Kelola tampilan utama halaman beranda Amanah Ummat.
          </p>
        </div>

        <router-link
          to="/admin"
          class="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
        >
          ← Dashboard
        </router-link>
      </div>
    </div>

    <!-- CONTENT -->
    <main class="mx-auto max-w-5xl px-5 py-8 lg:px-8">
      <!-- LOADING -->
      <div
        v-if="loading"
        class="rounded-2xl bg-white py-20 text-center text-gray-500 shadow-sm"
      >
        Memuat beranda...
      </div>

      <!-- FORM -->
      <form v-else @submit.prevent="saveHome" class="space-y-6">
        <!-- HERO -->
        <section class="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div class="mb-7">
            <h2 class="text-xl font-bold text-gray-900">Hero Beranda</h2>

            <p class="mt-1 text-sm text-gray-500">
              Bagian utama yang pertama kali dilihat pengunjung website.
            </p>
          </div>

          <!-- TITLE -->
          <div class="mb-5">
            <label class="text-sm font-semibold text-gray-700">
              Judul Hero
            </label>

            <input
              v-model="form.hero_title"
              type="text"
              placeholder="Contoh: Amanah Ummat"
              class="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              required
            />
          </div>

          <!-- DESCRIPTION -->
          <div class="mb-5">
            <label class="text-sm font-semibold text-gray-700">
              Deskripsi Hero
            </label>

            <textarea
              v-model="form.hero_description"
              rows="5"
              placeholder="Masukkan deskripsi singkat tentang Amanah Ummat."
              class="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              required
            ></textarea>
          </div>

          <!-- IMAGE FILE -->
          <div>
            <label class="text-sm font-semibold text-gray-700">
              Foto Background Hero
            </label>

            <input
              type="file"
              accept="image/*"
              @change="handleImageChange"
              class="mt-2 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />

            <p class="mt-2 text-xs text-gray-400">
              Upload foto dari perangkat admin. Format JPG, JPEG, PNG, atau
              WebP. Maksimal 5 MB.
            </p>
          </div>

          <!-- PREVIEW -->
          <div v-if="imagePreviewUrl || form.hero_image_url" class="mt-6">
            <p class="mb-2 text-sm font-semibold text-gray-700">Preview Foto</p>

            <div class="overflow-hidden rounded-2xl bg-gray-100">
              <img
                :src="imagePreviewUrl || form.hero_image_url"
                alt="Preview background hero"
                class="h-72 w-full object-cover"
              />
            </div>

            <p v-if="imagePreviewUrl" class="mt-2 text-xs text-emerald-600">
              Foto baru dipilih. Klik Simpan untuk menerapkannya.
            </p>
          </div>
        </section>

        <!-- CTA -->
        <section class="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
          <div class="mb-7">
            <h2 class="text-xl font-bold text-gray-900">Call to Action</h2>

            <p class="mt-1 text-sm text-gray-500">
              Bagian ajakan donasi di bagian bawah halaman beranda.
            </p>
          </div>

          <!-- CTA TITLE -->
          <div class="mb-5">
            <label class="text-sm font-semibold text-gray-700">
              Judul CTA
            </label>

            <input
              v-model="form.cta_title"
              type="text"
              placeholder="Contoh: Mari ikut mendukung perjalanan anak-anak Amanah Ummat."
              class="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              required
            />
          </div>

          <!-- CTA DESCRIPTION -->
          <div>
            <label class="text-sm font-semibold text-gray-700">
              Deskripsi CTA
            </label>

            <textarea
              v-model="form.cta_description"
              rows="5"
              placeholder="Masukkan deskripsi ajakan donasi."
              class="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              required
            ></textarea>
          </div>
        </section>

        <!-- ERROR -->
        <div
          v-if="errorMessage"
          class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {{ errorMessage }}
        </div>

        <!-- SUCCESS -->
        <div
          v-if="successMessage"
          class="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        >
          {{ successMessage }}
        </div>

        <!-- BUTTON -->
        <div class="flex justify-end">
          <button
            type="submit"
            :disabled="saving"
            class="rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {{
              saving
                ? uploading
                  ? "Mengupload foto..."
                  : "Menyimpan..."
                : "Simpan Perubahan"
            }}
          </button>
        </div>
      </form>
    </main>
  </div>
</template>
