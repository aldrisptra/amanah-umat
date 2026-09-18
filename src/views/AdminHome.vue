<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { supabase } from "../lib/supabase";
import AdminPage from "../components/admin/AdminPage.vue";
import AdminCard from "../components/admin/AdminCard.vue";
import AdminField from "../components/admin/AdminField.vue";
import AdminImageInput from "../components/admin/AdminImageInput.vue";
import AdminSaveBar from "../components/admin/AdminSaveBar.vue";
import AdminAlert from "../components/admin/AdminAlert.vue";
import { buildStorageFileName } from "../lib/utils";
import { useUnsavedChanges } from "../lib/useUnsavedChanges";

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
   AMBIL DATA
========================= */
const getHomeContent = async () => {
  loading.value = true;
  errorMessage.value = "";

  // Memakai .limit(1) alih-alih .single(): .single() menghasilkan error
  // ketika tabel masih kosong, padahal kondisi itu wajar pada pemasangan
  // baru dan seharusnya membiarkan admin mengisi form untuk pertama kali.
  const { data, error } = await supabase
    .from("home_content")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Gagal mengambil data beranda:", error);
    errorMessage.value = error.message;
    loading.value = false;
    return;
  }

  const record = data?.[0] || null;

  homeContent.value = record;

  form.hero_title = record?.hero_title || "";
  form.hero_description = record?.hero_description || "";
  form.hero_image_url = record?.hero_image_url || "";
  form.cta_title = record?.cta_title || "";
  form.cta_description = record?.cta_description || "";

  revokePreview();
  imagePreviewUrl.value = form.hero_image_url;

  nilaiAwal.value = JSON.stringify(form);

  loading.value = false;
};

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
  imagePreviewUrl.value = form.hero_image_url;
};

const uploadImageFile = async (file) => {
  if (!file) return form.hero_image_url;

  uploading.value = true;

  const filePath = `home/${buildStorageFileName(file, "hero-")}`;

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

/* =========================
   SIMPAN
========================= */
const saveHome = async () => {
  if (saving.value) return;

  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    let uploadedImageUrl = form.hero_image_url;

    if (selectedImageFile.value) {
      uploadedImageUrl = await uploadImageFile(selectedImageFile.value);
    }

    const payload = {
      hero_title: form.hero_title.trim(),
      hero_description: form.hero_description.trim(),
      hero_image_url: uploadedImageUrl,
      cta_title: form.cta_title.trim(),
      cta_description: form.cta_description.trim(),
      updated_at: new Date().toISOString(),
    };

    let result;

    if (homeContent.value?.id) {
      result = await supabase
        .from("home_content")
        .update(payload)
        .eq("id", homeContent.value.id)
        .select();
    } else {
      // Belum ada baris konten beranda (pemasangan baru) -> buatkan.
      result = await supabase.from("home_content").insert(payload).select();
    }

    if (result.error) {
      throw result.error;
    }

    form.hero_image_url = uploadedImageUrl;
    selectedImageFile.value = null;

    await getHomeContent();

    successMessage.value =
      "Halaman depan berhasil diperbarui. Silakan periksa hasilnya lewat tombol Lihat di website.";
  } catch (error) {
    console.error("GAGAL MENYIMPAN BERANDA:", error);

    errorMessage.value = error.message || "Gagal menyimpan perubahan.";
  } finally {
    saving.value = false;
    uploading.value = false;
  }
};

onMounted(getHomeContent);
</script>

<template>
  <AdminPage
    title="Halaman Depan"
    description="Bagian paling pertama yang dilihat pengunjung saat membuka website: foto besar dengan tulisan di atasnya, serta kotak ajakan berdonasi di bagian bawah."
    public-path="/"
  >
    <!-- MEMUAT -->
    <div
      v-if="loading"
      class="rounded-2xl border border-gray-200 bg-white py-20 text-center text-sm text-gray-500"
    >
      Memuat isi halaman depan...
    </div>

    <form v-else @submit.prevent="saveHome">
      <AdminAlert
        :error="errorMessage"
        :success="successMessage"
        @dismiss="
          errorMessage = '';
          successMessage = '';
        "
      />

      <div class="space-y-5">
        <!-- =====================================================
             1. TAMPILAN PALING ATAS
        ====================================================== -->
        <AdminCard
          step="1"
          title="Tampilan paling atas"
          description="Foto besar satu layar penuh beserta tulisan di atasnya. Inilah kesan pertama pengunjung terhadap yayasan."
        >
          <AdminField
            v-slot="{ id }"
            label="Judul besar"
            hint="Tulisan paling besar di tengah foto. Sebaiknya singkat, cukup nama yayasan."
            required
            :value="form.hero_title"
            :max="40"
          >
            <input
              :id="id"
              v-model="form.hero_title"
              type="text"
              required
              placeholder="Contoh: Amanah Ummat"
              class="admin-input"
            />
          </AdminField>

          <AdminField
            v-slot="{ id }"
            label="Kalimat pengantar"
            hint="Satu sampai dua kalimat di bawah judul yang menjelaskan siapa Amanah Ummat dan untuk siapa."
            required
            :value="form.hero_description"
            :max="200"
          >
            <textarea
              :id="id"
              v-model="form.hero_description"
              rows="4"
              required
              placeholder="Contoh: Memberikan kasih sayang, pendidikan, dan kehidupan yang layak bagi anak-anak yatim, piatu, dan dhuafa di Balikpapan."
              class="admin-textarea"
            ></textarea>
          </AdminField>

          <div>
            <p class="text-sm font-semibold text-gray-800">Foto latar</p>

            <AdminImageInput
              class="mt-2"
              :preview-url="imagePreviewUrl"
              :file-name="selectedImageFile?.name || ''"
              :disabled="saving"
              hint="Foto yang memenuhi seluruh layar di bagian paling atas. Pilih foto mendatar (landscape) yang terang. Tulisan akan tampil di tengah foto, jadi sebaiknya bagian tengah foto tidak terlalu ramai."
              aspect="16/9"
              @select="handleImageSelect"
              @clear="handleImageClear"
              @error="errorMessage = $event"
            />
          </div>
        </AdminCard>

        <!-- =====================================================
             2. AJAKAN BERDONASI
        ====================================================== -->
        <AdminCard
          step="2"
          title="Ajakan berdonasi"
          description="Kotak hijau di bagian paling bawah halaman depan, berisi ajakan untuk ikut membantu."
        >
          <AdminField
            v-slot="{ id }"
            label="Judul ajakan"
            hint="Kalimat utama pada kotak hijau. Buat mengajak, bukan memerintah."
            required
            :value="form.cta_title"
            :max="90"
          >
            <input
              :id="id"
              v-model="form.cta_title"
              type="text"
              required
              placeholder="Contoh: Mari ikut mendukung perjalanan anak-anak Amanah Ummat."
              class="admin-input"
            />
          </AdminField>

          <AdminField
            v-slot="{ id }"
            label="Penjelasan ajakan"
            hint="Kalimat pendukung di bawah judul ajakan. Jelaskan donasi akan dipakai untuk apa."
            required
            :value="form.cta_description"
            :max="200"
          >
            <textarea
              :id="id"
              v-model="form.cta_description"
              rows="4"
              required
              placeholder="Contoh: Dukungan Anda membantu memenuhi kebutuhan harian dan pendidikan anak-anak LKSA Amanah Ummat."
              class="admin-textarea"
            ></textarea>
          </AdminField>
        </AdminCard>
      </div>

      <AdminSaveBar
        :dirty="adaPerubahan"
        :saving="saving"
        :busy-label="uploading ? 'Mengunggah foto...' : ''"
      />
    </form>
  </AdminPage>
</template>
