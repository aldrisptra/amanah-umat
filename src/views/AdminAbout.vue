<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { supabase } from "../lib/supabase";
import { CACHE_FOTO, UKURAN, compressImage } from "../lib/imageCompress";
import AdminPage from "../components/admin/AdminPage.vue";
import AdminCard from "../components/admin/AdminCard.vue";
import AdminField from "../components/admin/AdminField.vue";
import AdminImageInput from "../components/admin/AdminImageInput.vue";
import AdminSaveBar from "../components/admin/AdminSaveBar.vue";
import AdminAlert from "../components/admin/AdminAlert.vue";
import { buildStorageFileName } from "../lib/utils";
import { useUnsavedChanges } from "../lib/useUnsavedChanges";

const about = ref(null);
const loading = ref(true);
const saving = ref(false);
const uploading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const selectedImageFile = ref(null);
const imagePreviewUrl = ref("");

const form = reactive({
  title: "",
  description: "",
  image_url: "",
});

// Salinan nilai awal, dipakai untuk mengetahui apakah ada perubahan.
// Harus berupa ref: computed di bawah membacanya, dan Vue hanya melacak
// perubahan pada nilai reaktif.
const nilaiAwal = ref(JSON.stringify(form));

const adaPerubahan = computed(
  () => JSON.stringify(form) !== nilaiAwal.value || Boolean(selectedImageFile.value),
);

useUnsavedChanges(adaPerubahan);

// URL pratinjau lokal harus dibebaskan agar tidak menumpuk di memori
const revokePreview = () => {
  if (imagePreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(imagePreviewUrl.value);
  }
};

onBeforeUnmount(revokePreview);

/* =========================
   FOTO
========================= */
const handleImageSelect = (file) => {
  errorMessage.value = "";
  successMessage.value = "";

  revokePreview();

  selectedImageFile.value = file;
  imagePreviewUrl.value = URL.createObjectURL(file);
};

const handleImageClear = () => {
  revokePreview();

  selectedImageFile.value = null;
  imagePreviewUrl.value = form.image_url;
};

const uploadImageFile = async (file) => {
  if (!file) return "";

  uploading.value = true;

  // Foto dari HP bisa 3-5 MB. Diperkecil dulu di browser supaya
  // pengunjung tidak perlu mengunduh berkas sebesar itu.
  const siap = await compressImage(file, UKURAN.standar);
  const filePath = `about/${buildStorageFileName(siap)}`;

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

/* =========================
   AMBIL DATA
========================= */
const getAbout = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const { data, error } = await supabase
      .from("about")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    const record = data?.[0] || null;
    about.value = record;

    form.title = record?.title || "";
    form.description = record?.description || "";
    form.image_url = record?.image_url || "";

    revokePreview();
    imagePreviewUrl.value = form.image_url;

    nilaiAwal.value = JSON.stringify(form);
  } catch (error) {
    console.error("Gagal mengambil data tentang:", error);
    errorMessage.value = error.message || "Gagal mengambil data tentang.";
  } finally {
    loading.value = false;
  }
};

/* =========================
   SIMPAN
========================= */
const saveAbout = async () => {
  if (saving.value) return;

  if (!form.title.trim()) {
    errorMessage.value = "Judul tidak boleh kosong.";
    return;
  }

  if (!form.description.trim()) {
    errorMessage.value = "Deskripsi tidak boleh kosong.";
    return;
  }

  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

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

    selectedImageFile.value = null;

    await getAbout();

    successMessage.value = "Halaman Tentang Kami berhasil diperbarui.";
  } catch (error) {
    console.error("Gagal menyimpan data tentang:", error);
    errorMessage.value = error.message || "Gagal menyimpan data tentang.";
  } finally {
    saving.value = false;
    uploading.value = false;
  }
};

onMounted(getAbout);
</script>

<template>
  <AdminPage
    title="Tentang Kami"
    description="Penjelasan mengenai LKSA Amanah Ummat. Isi bagian ini juga tampil sebagai ringkasan di halaman depan."
    public-path="/tentang-kami"
  >
    <div
      v-if="loading"
      class="rounded-2xl border border-gray-200 bg-white py-20 text-center text-sm text-gray-500"
    >
      Memuat data tentang kami...
    </div>

    <form v-else @submit.prevent="saveAbout">
      <AdminAlert
        :error="errorMessage"
        :success="successMessage"
        @dismiss="
          errorMessage = '';
          successMessage = '';
        "
      />

      <AdminCard
        title="Isi halaman Tentang Kami"
        description="Tulis dengan bahasa sederhana, seperti sedang bercerita kepada tamu yang baru pertama kali berkunjung."
      >
        <AdminField
          v-slot="{ id }"
          label="Judul"
          hint="Judul bagian ini di website. Contoh: Mengenal LKSA Amanah Ummat."
          required
          :value="form.title"
          :max="60"
        >
          <input
            :id="id"
            v-model="form.title"
            type="text"
            required
            placeholder="Mengenal LKSA Amanah Ummat"
            class="admin-input"
          />
        </AdminField>

        <AdminField
          v-slot="{ id }"
          label="Cerita tentang yayasan"
          hint="Ceritakan sejak kapan berdiri, siapa yang diasuh, dan kegiatan sehari-hari anak-anak. Tekan Enter untuk membuat paragraf baru — pemisahan paragrafnya akan ikut tampil di website."
          required
          :value="form.description"
        >
          <textarea
            :id="id"
            v-model="form.description"
            rows="10"
            required
            placeholder="LKSA Amanah Ummat Balikpapan merupakan tempat tinggal dan pembinaan bagi anak-anak yang membutuhkan perhatian, kasih sayang, pendidikan, dan pendampingan..."
            class="admin-textarea"
          ></textarea>
        </AdminField>

        <div>
          <p class="text-sm font-semibold text-gray-800">Foto utama</p>

          <AdminImageInput
            class="mt-2"
            :preview-url="imagePreviewUrl"
            :file-name="selectedImageFile?.name || ''"
            :disabled="saving"
            hint="Foto yang tampil di samping cerita. Pilih foto kegiatan bersama anak-anak, bukan foto gedung kosong."
            aspect="4/3"
            @select="handleImageSelect"
            @clear="handleImageClear"
            @error="errorMessage = $event"
          />
        </div>
      </AdminCard>

      <AdminSaveBar
        :dirty="adaPerubahan"
        :saving="saving"
        :busy-label="uploading ? 'Mengunggah foto...' : ''"
        label="Simpan Tentang Kami"
      />
    </form>
  </AdminPage>
</template>
