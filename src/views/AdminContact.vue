<script setup>
import { onMounted, reactive, ref } from "vue";
import { supabase } from "../lib/supabase";

const contact = ref(null);
const loading = ref(true);
const saving = ref(false);
const errorMessage = ref("");

const form = reactive({
  address: "",
  phone: "",
  whatsapp: "",
  email: "",
});

const resetForm = () => {
  form.address = "";
  form.phone = "";
  form.whatsapp = "";
  form.email = "";
};

const getContact = async () => {
  loading.value = true;
  errorMessage.value = "";

  try {
    const { data, error } = await supabase
      .from("contact")
      .select("*")
      .order("created_at", { ascending: true })
      .limit(1);

    if (error) {
      throw error;
    }

    const record = data?.[0] || null;
    contact.value = record;

    if (record) {
      form.address = record.address || "";
      form.phone = record.phone || "";
      form.whatsapp = record.whatsapp || "";
      form.email = record.email || "";
    } else {
      resetForm();
    }
  } catch (error) {
    console.error("Gagal mengambil data kontak:", error);
    errorMessage.value = error.message || "Gagal mengambil data kontak.";
  } finally {
    loading.value = false;
  }
};

const saveContact = async () => {
  if (saving.value) return;

  saving.value = true;
  errorMessage.value = "";

  try {
    const payload = {
      address: form.address.trim(),
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim(),
      email: form.email.trim(),
    };

    let result;

    if (contact.value?.id) {
      result = await supabase
        .from("contact")
        .update(payload)
        .eq("id", contact.value.id)
        .select();
    } else {
      result = await supabase.from("contact").insert(payload).select();
    }

    if (result.error) {
      throw result.error;
    }

    await getContact();
  } catch (error) {
    console.error("Gagal menyimpan kontak:", error);
    errorMessage.value = error.message || "Gagal menyimpan data kontak.";
  } finally {
    saving.value = false;
  }
};

onMounted(() => {
  getContact();
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
          <h1 class="mt-1 text-2xl font-bold text-gray-900">Kelola Kontak</h1>
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
        <div class="mb-6 flex items-center justify-between gap-3">
          <div>
            <h2 class="text-xl font-bold text-gray-900">Data Kontak Website</h2>
            <p class="mt-1 text-sm text-gray-500">
              Atur alamat, nomor telepon, WhatsApp, dan email.
            </p>
          </div>
        </div>

        <div
          v-if="errorMessage"
          class="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {{ errorMessage }}
        </div>

        <form v-if="!loading" @submit.prevent="saveContact" class="space-y-5">
          <div>
            <label class="mb-2 block text-sm font-semibold text-gray-700"
              >Alamat</label
            >
            <textarea
              v-model="form.address"
              rows="4"
              class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-emerald-500"
              placeholder="Masukkan alamat lengkap"
            />
          </div>

          <div class="grid gap-5 sm:grid-cols-2">
            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700"
                >Telepon</label
              >
              <input
                v-model="form.phone"
                type="text"
                class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-emerald-500"
                placeholder="08xxxxxxxxxx"
              />
            </div>

            <div>
              <label class="mb-2 block text-sm font-semibold text-gray-700"
                >WhatsApp</label
              >
              <input
                v-model="form.whatsapp"
                type="text"
                class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-emerald-500"
                placeholder="628123456789"
              />
            </div>
          </div>

          <div>
            <label class="mb-2 block text-sm font-semibold text-gray-700"
              >Email</label
            >
            <input
              v-model="form.email"
              type="email"
              class="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-700 outline-none transition focus:border-emerald-500"
              placeholder="contoh@email.com"
            />
          </div>

          <div class="flex items-center justify-end pt-2">
            <button
              type="submit"
              :disabled="saving"
              class="rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
            >
              {{ saving ? "Menyimpan..." : "Simpan Kontak" }}
            </button>
          </div>
        </form>

        <div v-else class="py-10 text-center text-sm text-gray-500">
          Memuat data kontak...
        </div>
      </div>
    </main>
  </div>
</template>
