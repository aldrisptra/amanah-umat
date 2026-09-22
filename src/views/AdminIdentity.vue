<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { TriangleAlert } from "lucide-vue-next";
import { supabase } from "../lib/supabase";
import { CACHE_FOTO } from "../lib/imageCompress";
import AdminPage from "../components/admin/AdminPage.vue";
import AdminCard from "../components/admin/AdminCard.vue";
import AdminField from "../components/admin/AdminField.vue";
import AdminImageInput from "../components/admin/AdminImageInput.vue";
import AdminSaveBar from "../components/admin/AdminSaveBar.vue";
import AdminAlert from "../components/admin/AdminAlert.vue";
import { buildStorageFileName } from "../lib/utils";
import { useUnsavedChanges } from "../lib/useUnsavedChanges";
import {
  IDENTITAS_BAWAAN,
  muatIdentitas,
  tabelBelumDibuat,
  terapkanIdentitas,
} from "../lib/siteIdentity";

const settings = ref(null);
const loading = ref(true);
const saving = ref(false);
const uploading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const selectedLogoFile = ref(null);
const logoPreviewUrl = ref("");

const form = reactive({
  site_name: "",
  logo_url: "",
});

// Salinan nilai awal, dipakai untuk mengetahui apakah ada perubahan.
// Harus berupa ref: computed di bawah membacanya, dan Vue hanya melacak
// perubahan pada nilai reaktif.
const nilaiAwal = ref(JSON.stringify(form));

const adaPerubahan = computed(
  () =>
    JSON.stringify(form) !== nilaiAwal.value || Boolean(selectedLogoFile.value),
);

useUnsavedChanges(adaPerubahan);

// Huruf awal untuk logo cadangan, mengikuti nama yang sedang diketik
const inisial = computed(
  () => form.site_name.trim().charAt(0).toUpperCase() || "A",
);

// URL pratinjau lokal harus dibebaskan agar tidak menumpuk di memori
const revokePreview = () => {
  if (logoPreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(logoPreviewUrl.value);
  }
};

onBeforeUnmount(revokePreview);

/* =========================
   LOGO
========================= */
const handleLogoSelect = (file) => {
  errorMessage.value = "";
  successMessage.value = "";

  revokePreview();

  selectedLogoFile.value = file;
  logoPreviewUrl.value = URL.createObjectURL(file);
};

const handleLogoClear = () => {
  revokePreview();

  selectedLogoFile.value = null;
  logoPreviewUrl.value = form.logo_url;
};

// Hapus logo sepenuhnya, kembali memakai kotak huruf awal
const hapusLogo = () => {
  revokePreview();

  selectedLogoFile.value = null;
  logoPreviewUrl.value = "";
  form.logo_url = "";
  successMessage.value = "";
};

const uploadLogoFile = async (file) => {
  if (!file) return form.logo_url;

  uploading.value = true;

  const filePath = `site/${buildStorageFileName(file, "logo-")}`;

  const { data, error } = await supabase.storage
    .from("images")
    .upload(filePath, file, {
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
const getSettings = async () => {
  loading.value = true;
  errorMessage.value = "";

  const { data, error } = await supabase
    .from("site_settings")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    // Bila tabelnya memang belum dibuat, petunjuk khusus sudah ditampilkan
    // di bagian atas halaman - jangan tampilkan pesan galat teknis dua kali.
    await muatIdentitas({ paksa: true });

    if (!tabelBelumDibuat.value) {
      console.error("Gagal mengambil identitas website:", error);
      errorMessage.value = error.message;
    }

    loading.value = false;
    return;
  }

  const record = data?.[0] || null;
  settings.value = record;

  form.site_name = record?.site_name || IDENTITAS_BAWAAN.site_name;
  form.logo_url = record?.logo_url || "";

  revokePreview();
  logoPreviewUrl.value = form.logo_url;

  nilaiAwal.value = JSON.stringify(form);

  loading.value = false;
};

/* =========================
   SIMPAN
========================= */
const saveSettings = async () => {
  if (saving.value) return;

  if (!form.site_name.trim()) {
    errorMessage.value = "Nama website tidak boleh kosong.";
    return;
  }

  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    let uploadedLogoUrl = form.logo_url;

    if (selectedLogoFile.value) {
      uploadedLogoUrl = await uploadLogoFile(selectedLogoFile.value);
    }

    const payload = {
      site_name: form.site_name.trim(),
      logo_url: uploadedLogoUrl || null,
      updated_at: new Date().toISOString(),
    };

    let result;

    if (settings.value?.id) {
      result = await supabase
        .from("site_settings")
        .update(payload)
        .eq("id", settings.value.id)
        .select();
    } else {
      result = await supabase.from("site_settings").insert(payload).select();
    }

    if (result.error) {
      throw result.error;
    }

    form.logo_url = uploadedLogoUrl;
    selectedLogoFile.value = null;

    await getSettings();

    // Segarkan nilai bersama supaya logo di menu samping, navbar, dan footer
    // langsung berubah tanpa perlu memuat ulang halaman.
    terapkanIdentitas({
      site_name: form.site_name,
      logo_url: form.logo_url,
    });

    successMessage.value =
      "Logo dan nama website berhasil disimpan. Perubahan langsung tampil di seluruh halaman website.";
  } catch (error) {
    console.error("Gagal menyimpan identitas website:", error);
    errorMessage.value = error.message || "Gagal menyimpan identitas website.";
  } finally {
    saving.value = false;
    uploading.value = false;
  }
};

onMounted(getSettings);
</script>

<template>
  <AdminPage
    title="Logo & Nama Website"
    description="Logo dan nama yayasan yang tampil di bagian paling atas setiap halaman, serta di bagian bawah website."
    public-path="/"
  >
    <!-- Tabel belum dibuat -->
    <div
      v-if="tabelBelumDibuat"
      class="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4"
    >
      <TriangleAlert class="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

      <div class="min-w-0">
        <p class="text-sm font-semibold text-amber-900">
          Fitur ini belum diaktifkan
        </p>

        <p class="mt-1 text-sm leading-6 text-amber-800">
          Tempat penyimpanan logo belum dibuat di database. Website tetap
          berjalan normal memakai nama dan logo huruf bawaan.
        </p>

        <p class="mt-2 text-sm leading-6 text-amber-800">
          Untuk mengaktifkannya, minta pengelola teknis menjalankan berkas
          <code class="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
            supabase/site_settings.sql
          </code>
          pada menu SQL Editor di Supabase. Cukup dilakukan satu kali.
        </p>
      </div>
    </div>

    <!-- Memuat -->
    <div
      v-else-if="loading"
      class="rounded-2xl border border-gray-200 bg-white py-20 text-center text-sm text-gray-500"
    >
      Memuat identitas website...
    </div>

    <form v-else @submit.prevent="saveSettings">
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
             1. NAMA
        ====================================================== -->
        <AdminCard
          step="1"
          title="Nama website"
          description="Nama yayasan yang tampil di sebelah logo, dan juga dipakai pada baris hak cipta di bagian paling bawah website."
        >
          <AdminField
            v-slot="{ id }"
            label="Nama yayasan"
            hint="Sebaiknya singkat agar muat di layar ponsel. Nama panjang versi resmi bisa ditulis di halaman Tentang Kami."
            required
            :value="form.site_name"
            :max="24"
          >
            <input
              :id="id"
              v-model="form.site_name"
              type="text"
              required
              placeholder="Amanah Ummat"
              class="admin-input"
            />
          </AdminField>
        </AdminCard>

        <!-- =====================================================
             2. LOGO
        ====================================================== -->
        <AdminCard
          step="2"
          title="Logo"
          description="Gambar kecil di sebelah kiri nama yayasan, di bagian atas dan bawah setiap halaman. Boleh dikosongkan — bila kosong, website menampilkan kotak hijau berisi huruf awal nama."
        >
          <AdminImageInput
            :preview-url="logoPreviewUrl"
            :file-name="selectedLogoFile?.name || ''"
            :disabled="saving"
            hint="Gunakan logo berbentuk kotak (persegi) agar tampil rapi. Format PNG dengan latar transparan memberi hasil paling baik, karena logo akan tampil di atas latar putih maupun gelap. Usahakan di bawah 300 KB — logo ini dimuat di setiap halaman, jadi berkas yang berat membuat seluruh website lebih lambat."
            aspect="1/1"
            fit="contain"
            @select="handleLogoSelect"
            @clear="handleLogoClear"
            @error="errorMessage = $event"
          />

          <div v-if="form.logo_url && !selectedLogoFile">
            <button
              type="button"
              @click="hapusLogo"
              class="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              Hapus logo, kembali pakai huruf awal
            </button>

            <p class="mt-2 text-xs text-gray-500">
              Logo baru benar-benar terhapus setelah tombol Simpan ditekan.
            </p>
          </div>
        </AdminCard>

        <!-- =====================================================
             PRATINJAU
        ====================================================== -->
        <AdminCard
          title="Tampilan di website"
          description="Beginilah logo dan nama akan terlihat oleh pengunjung."
        >
          <!-- Tiruan navbar -->
          <div class="overflow-hidden rounded-2xl border border-gray-200">
            <div
              class="flex items-center justify-between gap-4 bg-white px-5 py-4"
            >
              <span class="flex min-w-0 items-center gap-3">
                <img
                  v-if="logoPreviewUrl"
                  :src="logoPreviewUrl"
                  alt="Pratinjau logo"
                  class="h-10 w-10 shrink-0 rounded-xl object-contain"
                />

                <span
                  v-else
                  aria-hidden="true"
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white"
                >
                  {{ inisial }}
                </span>

                <span class="truncate text-xl font-bold text-gray-900">
                  {{ form.site_name || "Nama Website" }}
                </span>
              </span>

              <span class="hidden shrink-0 gap-5 text-sm text-gray-400 sm:flex">
                <span>Beranda</span>
                <span>Program</span>
                <span>Galeri</span>
              </span>
            </div>

            <!-- Tiruan footer, untuk memeriksa logo di latar gelap -->
            <div class="flex items-center gap-3 bg-gray-950 px-5 py-4">
              <img
                v-if="logoPreviewUrl"
                :src="logoPreviewUrl"
                alt="Pratinjau logo pada latar gelap"
                class="h-10 w-10 shrink-0 rounded-xl object-contain"
              />

              <span
                v-else
                aria-hidden="true"
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white"
              >
                {{ inisial }}
              </span>

              <span class="truncate text-xl font-bold text-white">
                {{ form.site_name || "Nama Website" }}
              </span>
            </div>
          </div>

          <p class="text-xs leading-5 text-gray-500">
            Bagian bawah website berlatar gelap. Pastikan logo masih terbaca di
            kedua latar — logo berwarna gelap pekat akan hilang di sana.
          </p>

          <!-- Ikon tab & Google tidak mengikuti logo ini. Dijelaskan di sini
               supaya pengurus tidak bingung mengapa ikon tab tidak ikut
               berubah setelah logo diganti. -->
          <div
            class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5"
          >
            <p class="text-sm font-semibold text-gray-800">
              Tentang ikon tab browser dan Google
            </p>

            <p class="mt-1 text-xs leading-5 text-gray-600">
              Ikon kecil di tab browser dan di hasil pencarian Google
              <strong class="font-semibold">tidak</strong> ikut berubah saat
              logo di sini diganti. Ikon itu dibuat terpisah dalam ukuran
              khusus, karena Google hanya menerima ikon yang persegi sempurna.
              Bila logo yayasan berganti, minta pengelola teknis memperbarui
              ikonnya juga.
            </p>
          </div>
        </AdminCard>
      </div>

      <AdminSaveBar
        :dirty="adaPerubahan"
        :saving="saving"
        :busy-label="uploading ? 'Mengunggah logo...' : ''"
        label="Simpan Logo & Nama"
      />
    </form>
  </AdminPage>
</template>
