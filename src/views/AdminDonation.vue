<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { CircleAlert, CircleCheck, TriangleAlert } from "lucide-vue-next";
import { supabase } from "../lib/supabase";
import AdminPage from "../components/admin/AdminPage.vue";
import AdminCard from "../components/admin/AdminCard.vue";
import AdminField from "../components/admin/AdminField.vue";
import AdminImageInput from "../components/admin/AdminImageInput.vue";
import AdminSaveBar from "../components/admin/AdminSaveBar.vue";
import AdminAlert from "../components/admin/AdminAlert.vue";
import { buildStorageFileName, normalizeWhatsapp } from "../lib/utils";
import { useUnsavedChanges } from "../lib/useUnsavedChanges";

const donationInfo = ref(null);
const loading = ref(true);
const saving = ref(false);
const uploading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");
const selectedQrFile = ref(null);
const qrPreviewUrl = ref("");

const form = reactive({
  bank_name: "",
  account_number: "",
  account_name: "",
  whatsapp_number: "",
  qris_url: "",
});

// Salinan nilai awal, dipakai untuk mengetahui apakah ada perubahan.
// Harus berupa ref: computed di bawah membacanya, dan Vue hanya melacak
// perubahan pada nilai reaktif.
const nilaiAwal = ref(JSON.stringify(form));

const adaPerubahan = computed(
  () => JSON.stringify(form) !== nilaiAwal.value || Boolean(selectedQrFile.value),
);

useUnsavedChanges(adaPerubahan);

const whatsappPreview = computed(() => normalizeWhatsapp(form.whatsapp_number));

// URL pratinjau lokal harus dibebaskan agar tidak menumpuk di memori
const revokePreview = () => {
  if (qrPreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(qrPreviewUrl.value);
  }
};

onBeforeUnmount(revokePreview);

/* =========================
   QRIS
========================= */
const handleQrSelect = (file) => {
  errorMessage.value = "";
  successMessage.value = "";

  revokePreview();

  selectedQrFile.value = file;
  qrPreviewUrl.value = URL.createObjectURL(file);
};

const handleQrClear = () => {
  revokePreview();

  selectedQrFile.value = null;
  qrPreviewUrl.value = form.qris_url;
};

const uploadQrFile = async (file) => {
  if (!file) return "";

  uploading.value = true;

  const filePath = `donation/${buildStorageFileName(file)}`;

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
   AMBIL DATA
========================= */
const resetForm = () => {
  form.bank_name = "";
  form.account_number = "";
  form.account_name = "";
  form.whatsapp_number = "";
  form.qris_url = "";
  selectedQrFile.value = null;
  revokePreview();
  qrPreviewUrl.value = "";
};

const getDonationInfo = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const { data, error } = await supabase
      .from("donation_info")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    const record = data?.[0] || null;
    donationInfo.value = record;

    if (record) {
      form.bank_name = record.bank_name || "";
      form.account_number = record.account_number || "";
      form.account_name = record.account_name || "";
      form.whatsapp_number = record.whatsapp_number || "";
      form.qris_url = record.qris_url || "";

      revokePreview();
      qrPreviewUrl.value = form.qris_url;
    } else {
      resetForm();
    }

    nilaiAwal.value = JSON.stringify(form);
  } catch (error) {
    console.error("Gagal mengambil data donasi:", error);
    errorMessage.value = error.message || "Gagal mengambil data donasi.";
  } finally {
    loading.value = false;
  }
};

/* =========================
   SIMPAN
========================= */
const saveDonation = async () => {
  if (saving.value) return;

  // Data rekening adalah informasi paling kritis di website ini: salah ketik
  // berarti donasi masuk ke rekening yang keliru. Karena itu divalidasi
  // sebelum disimpan, bukan sekadar diandalkan pada ketelitian admin.
  if (!form.bank_name.trim()) {
    errorMessage.value = "Nama bank wajib diisi.";
    return;
  }

  if (!form.account_number.trim()) {
    errorMessage.value = "Nomor rekening wajib diisi.";
    return;
  }

  if (!/^[\d\s-]+$/.test(form.account_number.trim())) {
    errorMessage.value = "Nomor rekening hanya boleh berisi angka.";
    return;
  }

  if (!form.account_name.trim()) {
    errorMessage.value = "Nama pemilik rekening wajib diisi.";
    return;
  }

  if (form.whatsapp_number.trim() && !normalizeWhatsapp(form.whatsapp_number)) {
    errorMessage.value =
      "Nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx atau 628xxxxxxxxxx.";
    return;
  }

  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    let uploadedQrUrl = form.qris_url.trim();

    if (selectedQrFile.value) {
      uploadedQrUrl = await uploadQrFile(selectedQrFile.value);
    }

    const payload = {
      bank_name: form.bank_name.trim(),
      account_number: form.account_number.trim(),
      account_name: form.account_name.trim(),
      whatsapp_number: form.whatsapp_number.trim(),
      qris_url: uploadedQrUrl,
    };

    let result;

    if (donationInfo.value?.id) {
      result = await supabase
        .from("donation_info")
        .update(payload)
        .eq("id", donationInfo.value.id)
        .select();
    } else {
      result = await supabase.from("donation_info").insert(payload).select();
    }

    if (result.error) {
      throw result.error;
    }

    selectedQrFile.value = null;

    await getDonationInfo();

    successMessage.value = "Informasi donasi berhasil disimpan.";
  } catch (error) {
    console.error("Gagal menyimpan data donasi:", error);
    errorMessage.value = error.message || "Gagal menyimpan data donasi.";
  } finally {
    saving.value = false;
    uploading.value = false;
  }
};

onMounted(getDonationInfo);
</script>

<template>
  <AdminPage
    title="Donasi"
    description="Rekening, QRIS, dan kontak konfirmasi yang dipakai calon donatur untuk menyalurkan bantuan."
    public-path="/donasi"
  >
    <div
      v-if="loading"
      class="rounded-2xl border border-gray-200 bg-white py-20 text-center text-sm text-gray-500"
    >
      Memuat data donasi...
    </div>

    <form v-else @submit.prevent="saveDonation">
      <AdminAlert
        :error="errorMessage"
        :success="successMessage"
        @dismiss="
          errorMessage = '';
          successMessage = '';
        "
      />

      <!-- Peringatan khusus: bagian ini menyangkut uang -->
      <div
        class="mb-5 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4"
      >
        <TriangleAlert class="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

        <div>
          <p class="text-sm font-semibold text-amber-900">
            Periksa dua kali sebelum menyimpan
          </p>

          <p class="mt-1 text-sm leading-6 text-amber-800">
            Nomor rekening dan nama pemilik rekening di halaman ini langsung
            dibaca calon donatur. Satu angka yang salah membuat donasi masuk ke
            rekening orang lain.
          </p>
        </div>
      </div>

      <div class="space-y-5">
        <!-- =====================================================
             1. REKENING BANK
        ====================================================== -->
        <AdminCard
          step="1"
          title="Rekening bank"
          description="Rekening resmi atas nama yayasan. Jangan memakai rekening pribadi pengurus."
        >
          <div class="grid gap-5 sm:grid-cols-2">
            <AdminField
              v-slot="{ id }"
              label="Nama bank"
              hint="Contoh: Bank Mandiri, BSI, BRI."
              required
              :value="form.bank_name"
            >
              <input
                :id="id"
                v-model="form.bank_name"
                type="text"
                required
                placeholder="Bank Mandiri"
                class="admin-input"
              />
            </AdminField>

            <AdminField
              v-slot="{ id }"
              label="Nomor rekening"
              hint="Angka saja. Boleh diberi spasi agar mudah dibaca."
              required
              :value="form.account_number"
            >
              <input
                :id="id"
                v-model="form.account_number"
                type="text"
                inputmode="numeric"
                required
                placeholder="1234567890"
                class="admin-input font-semibold tracking-wide"
              />
            </AdminField>
          </div>

          <AdminField
            v-slot="{ id }"
            label="Nama pemilik rekening"
            hint="Tulis persis seperti yang tercetak di buku tabungan, supaya donatur yakin rekeningnya benar."
            required
            :value="form.account_name"
          >
            <input
              :id="id"
              v-model="form.account_name"
              type="text"
              required
              placeholder="Yayasan Amanah Ummat"
              class="admin-input"
            />
          </AdminField>

          <!-- Pratinjau seperti yang dilihat donatur -->
          <div class="rounded-2xl border border-gray-200 bg-gray-50 p-4">
            <p class="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Tampilan di website
            </p>

            <div class="mt-3 rounded-xl bg-white p-4 shadow-sm">
              <p class="text-xs font-semibold text-gray-500">BANK</p>
              <p class="mt-0.5 font-bold text-gray-900">
                {{ form.bank_name || "—" }}
              </p>

              <p class="mt-3 text-xs font-semibold text-gray-500">
                NOMOR REKENING
              </p>
              <p class="mt-0.5 text-xl font-bold tracking-wide text-emerald-600">
                {{ form.account_number || "—" }}
              </p>

              <p class="mt-2 text-sm text-gray-600">
                a.n. {{ form.account_name || "—" }}
              </p>
            </div>
          </div>
        </AdminCard>

        <!-- =====================================================
             2. QRIS
        ====================================================== -->
        <AdminCard
          step="2"
          title="Kode QRIS"
          description="Agar donatur bisa membayar cukup dengan memindai dari aplikasi bank atau e-wallet."
        >
          <AdminImageInput
            :preview-url="qrPreviewUrl"
            :file-name="selectedQrFile?.name || ''"
            :disabled="saving"
            hint="Unggah gambar kode QRIS resmi yayasan. Pastikan kode terlihat jelas dan tidak terpotong — bila buram, aplikasi donatur tidak dapat memindainya."
            aspect="1/1"
            fit="contain"
            @select="handleQrSelect"
            @clear="handleQrClear"
            @error="errorMessage = $event"
          />
        </AdminCard>

        <!-- =====================================================
             3. KONFIRMASI
        ====================================================== -->
        <AdminCard
          step="3"
          title="Konfirmasi donasi"
          description="Nomor WhatsApp tempat donatur mengabari setelah mengirim donasi."
        >
          <AdminField
            v-slot="{ id }"
            label="Nomor WhatsApp konfirmasi"
            hint="Boleh ditulis mulai 08. Pastikan nomor ini sering dibuka agar donatur tidak menunggu balasan terlalu lama."
            :value="form.whatsapp_number"
          >
            <input
              :id="id"
              v-model="form.whatsapp_number"
              type="text"
              inputmode="numeric"
              placeholder="08123456789"
              class="admin-input"
            />

            <p
              v-if="whatsappPreview"
              class="mt-2 flex items-center gap-1.5 text-xs text-emerald-700"
            >
              <CircleCheck class="h-3.5 w-3.5 shrink-0" />
              Tautan yang dipakai website: wa.me/{{ whatsappPreview }}
            </p>

            <p
              v-else-if="form.whatsapp_number"
              class="mt-2 flex items-center gap-1.5 text-xs text-red-600"
            >
              <CircleAlert class="h-3.5 w-3.5 shrink-0" />
              Nomor belum benar. Contoh yang benar: 08123456789
            </p>
          </AdminField>
        </AdminCard>
      </div>

      <AdminSaveBar
        :dirty="adaPerubahan"
        :saving="saving"
        :busy-label="uploading ? 'Mengunggah QRIS...' : ''"
        label="Simpan Donasi"
      />
    </form>
  </AdminPage>
</template>
