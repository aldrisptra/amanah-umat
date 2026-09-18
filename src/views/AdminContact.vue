<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { CircleCheck, CircleAlert } from "lucide-vue-next";
import { supabase } from "../lib/supabase";
import AdminPage from "../components/admin/AdminPage.vue";
import AdminCard from "../components/admin/AdminCard.vue";
import AdminField from "../components/admin/AdminField.vue";
import AdminSaveBar from "../components/admin/AdminSaveBar.vue";
import AdminAlert from "../components/admin/AdminAlert.vue";
import { normalizeWhatsapp } from "../lib/utils";
import { useUnsavedChanges } from "../lib/useUnsavedChanges";

const contact = ref(null);
const loading = ref(true);
const saving = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const form = reactive({
  address: "",
  phone: "",
  whatsapp: "",
  email: "",
});

// Salinan nilai awal, dipakai untuk mengetahui apakah ada perubahan.
// Harus berupa ref: computed di bawah membacanya, dan Vue hanya melacak
// perubahan pada nilai reaktif.
const nilaiAwal = ref(JSON.stringify(form));

const adaPerubahan = computed(() => JSON.stringify(form) !== nilaiAwal.value);

useUnsavedChanges(adaPerubahan);

// Tampilkan hasil konversi nomor supaya pengurus tahu tautan WhatsApp yang
// akan dipakai website. wa.me menolak format "0812...".
const whatsappPreview = computed(() => normalizeWhatsapp(form.whatsapp));

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
      .order("created_at", { ascending: false })
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

    nilaiAwal.value = JSON.stringify(form);
  } catch (error) {
    console.error("Gagal mengambil data kontak:", error);
    errorMessage.value = error.message || "Gagal mengambil data kontak.";
  } finally {
    loading.value = false;
  }
};

const saveContact = async () => {
  if (saving.value) return;

  if (form.whatsapp.trim() && !normalizeWhatsapp(form.whatsapp)) {
    errorMessage.value =
      "Nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx atau 628xxxxxxxxxx.";
    return;
  }

  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

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
      // Sebelum menyisipkan baris baru, pastikan tabel memang masih kosong.
      // Tanpa pemeriksaan ini, satu kali gagal memuat data akan membuat
      // baris kontak ganda dan website bisa menampilkan data yang lama.
      const { data: existing, error: cekError } = await supabase
        .from("contact")
        .select("id")
        .order("created_at", { ascending: false })
        .limit(1);

      if (cekError) {
        throw cekError;
      }

      if (existing?.length) {
        result = await supabase
          .from("contact")
          .update(payload)
          .eq("id", existing[0].id)
          .select();
      } else {
        result = await supabase.from("contact").insert(payload).select();
      }
    }

    if (result.error) {
      throw result.error;
    }

    await getContact();

    successMessage.value = "Data kontak berhasil disimpan.";
  } catch (error) {
    console.error("Gagal menyimpan kontak:", error);
    errorMessage.value = error.message || "Gagal menyimpan data kontak.";
  } finally {
    saving.value = false;
  }
};

onMounted(getContact);
</script>

<template>
  <AdminPage
    title="Kontak"
    description="Alamat dan nomor yang dapat dihubungi. Data ini tampil di halaman Kontak sekaligus di bagian bawah setiap halaman website."
    public-path="/kontak"
  >
    <div
      v-if="loading"
      class="rounded-2xl border border-gray-200 bg-white py-20 text-center text-sm text-gray-500"
    >
      Memuat data kontak...
    </div>

    <form v-else @submit.prevent="saveContact">
      <AdminAlert
        :error="errorMessage"
        :success="successMessage"
        @dismiss="
          errorMessage = '';
          successMessage = '';
        "
      />

      <div class="space-y-5">
        <AdminCard
          step="1"
          title="Alamat yayasan"
          description="Alamat lengkap yang akan dibaca calon donatur dan tamu."
        >
          <AdminField
            v-slot="{ id }"
            label="Alamat"
            hint="Tulis lengkap sampai kota dan provinsi. Boleh dibuat beberapa baris."
            :value="form.address"
          >
            <textarea
              :id="id"
              v-model="form.address"
              rows="4"
              placeholder="Jl. Sepaku, RT.17 No.8, Baru Tengah, Kec. Balikpapan Barat, Kota Balikpapan, Kalimantan Timur"
              class="admin-textarea"
            ></textarea>
          </AdminField>
        </AdminCard>

        <AdminCard
          step="2"
          title="Nomor yang bisa dihubungi"
          description="Pastikan nomor ini aktif — inilah jalur utama calon donatur menghubungi yayasan."
        >
          <div class="grid gap-5 sm:grid-cols-2">
            <AdminField
              v-slot="{ id }"
              label="Nomor telepon"
              hint="Untuk ditelepon langsung. Boleh nomor rumah atau HP."
              :value="form.phone"
            >
              <input
                :id="id"
                v-model="form.phone"
                type="text"
                inputmode="numeric"
                placeholder="08123456789"
                class="admin-input"
              />
            </AdminField>

            <AdminField
              v-slot="{ id }"
              label="Nomor WhatsApp"
              hint="Boleh ditulis mulai 08. Sistem otomatis mengubahnya ke format internasional."
              :value="form.whatsapp"
            >
              <input
                :id="id"
                v-model="form.whatsapp"
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
                v-else-if="form.whatsapp"
                class="mt-2 flex items-center gap-1.5 text-xs text-red-600"
              >
                <CircleAlert class="h-3.5 w-3.5 shrink-0" />
                Nomor belum benar. Contoh yang benar: 08123456789
              </p>
            </AdminField>
          </div>

          <AdminField
            v-slot="{ id }"
            label="Email"
            hint="Alamat email resmi yayasan untuk surat-menyurat."
            :value="form.email"
          >
            <input
              :id="id"
              v-model="form.email"
              type="email"
              placeholder="amanahummat@email.com"
              class="admin-input"
            />
          </AdminField>
        </AdminCard>
      </div>

      <AdminSaveBar
        :dirty="adaPerubahan"
        :saving="saving"
        label="Simpan Kontak"
      />
    </form>
  </AdminPage>
</template>
