<script setup>
import { onMounted, reactive, ref } from "vue";
import { supabase } from "../lib/supabase";

const donationInfo = ref(null);
const loading = ref(true);
const saving = ref(false);
const errorMessage = ref("");
const selectedQrFile = ref(null);
const qrPreviewUrl = ref("");

const form = reactive({
  bank_name: "",
  account_number: "",
  account_name: "",
  whatsapp_number: "",
  qris_url: "",
});

const uploadQrFile = async (file) => {
  if (!file) return "";

  const fileExt = file.name.split(".").pop() || "png";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
  const filePath = `donation/${fileName}`;

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

const handleQrChange = (event) => {
  const file = event.target.files?.[0];

  if (!file) return;

  selectedQrFile.value = file;
  qrPreviewUrl.value = URL.createObjectURL(file);
};

const resetForm = () => {
  form.bank_name = "";
  form.account_number = "";
  form.account_name = "";
  form.whatsapp_number = "";
  form.qris_url = "";
  selectedQrFile.value = null;
  qrPreviewUrl.value = "";
};

const getDonationInfo = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const { data, error } = await supabase
      .from("donation_info")
      .select("*")
      .order("created_at", { ascending: true })
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
      qrPreviewUrl.value = record.qris_url || "";
    } else {
      resetForm();
    }
  } catch (error) {
    console.error("Gagal mengambil data donasi:", error);
    errorMessage.value = error.message || "Gagal mengambil data donasi.";
  } finally {
    loading.value = false;
  }
};

const saveDonation = async () => {
  if (saving.value) return;

  saving.value = true;
  errorMessage.value = "";

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

    await getDonationInfo();
  } catch (error) {
    console.error("Gagal menyimpan data donasi:", error);
    errorMessage.value = error.message || "Gagal menyimpan data donasi.";
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  getDonationInfo();
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
          <h1 class="mt-1 text-2xl font-bold text-gray-900">Kelola Donasi</h1>
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
          <h2 class="text-xl font-bold text-gray-900">Informasi Donasi</h2>
          <p class="mt-1 text-sm text-gray-500">
            Atur rekening bank, QRIS, dan kontak konfirmasi donasi.
          </p>
        </div>

        <div
          v-if="errorMessage"
          class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {{ errorMessage }}
        </div>

        <form v-if="!loading" @submit.prevent="saveDonation" class="space-y-5">
          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700"
                >Nama Bank</label
              >
              <input
                v-model="form.bank_name"
                type="text"
                class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-emerald-500"
                placeholder="Bank Mandiri"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700"
                >Nomor Rekening</label
              >
              <input
                v-model="form.account_number"
                type="text"
                class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-emerald-500"
                placeholder="1234567890"
              />
            </div>
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700"
                >Atas Nama</label
              >
              <input
                v-model="form.account_name"
                type="text"
                class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-emerald-500"
                placeholder="Amanah Ummat"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700"
                >WhatsApp Konfirmasi</label
              >
              <input
                v-model="form.whatsapp_number"
                type="text"
                class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-emerald-500"
                placeholder="628123456789"
              />
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-gray-700"
              >Upload QRIS</label
            >

            <div
              class="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-4"
            >
              <input
                type="file"
                accept="image/*"
                @change="handleQrChange"
                class="block w-full text-sm text-gray-600 file:mr-4 file:rounded-xl file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
              />
            </div>

            <div
              v-if="qrPreviewUrl"
              class="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white p-3"
            >
              <img
                :src="qrPreviewUrl"
                alt="Preview QRIS"
                class="mx-auto h-52 w-52 object-contain"
              />
            </div>
          </div>

          <div class="flex items-center justify-end pt-2">
            <button
              type="submit"
              :disabled="saving"
              class="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {{ saving ? "Menyimpan..." : "Simpan Donasi" }}
            </button>
          </div>
        </form>

        <div v-else class="py-10 text-center text-sm text-gray-500">
          Memuat data donasi...
        </div>
      </div>
    </main>
  </div>
</template>
