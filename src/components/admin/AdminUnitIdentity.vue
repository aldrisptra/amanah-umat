<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { TriangleAlert } from "lucide-vue-next";
import { supabase } from "../../lib/supabase";
import { CACHE_FOTO } from "../../lib/imageCompress";
import AdminCard from "./AdminCard.vue";
import AdminField from "./AdminField.vue";
import AdminImageInput from "./AdminImageInput.vue";
import AdminAlert from "./AdminAlert.vue";
import { buildStorageFileName } from "../../lib/utils";
import { useUnsavedChanges } from "../../lib/useUnsavedChanges";
import { tabelUnitBelumAda } from "../../lib/units";

const loading = ref(true);
const saving = ref(false);
const uploading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

// Tiga keadaan database yang mungkin belum siap
const tabelUnitTidakAda = ref(false);
const fiturBelumAktif = ref(false);


// Satu isian per unit. `berkasLogo` dan `pratinjau` tidak ikut disimpan.
const unitForms = ref([]);

const ISIAN_UNIT = [
  "short_name",
  "name",
  "description",
  "logo_url",
];

const potretIsian = () =>
  JSON.stringify({
    units: unitForms.value.map((unit) =>
      Object.fromEntries(ISIAN_UNIT.map((kunci) => [kunci, unit[kunci]])),
    ),
  });

// Harus ref: computed di bawah membacanya, dan Vue hanya melacak
// perubahan pada nilai reaktif.
const nilaiAwal = ref("");

const adaPerubahan = computed(
  () =>
    !loading.value &&
    (potretIsian() !== nilaiAwal.value ||
      unitForms.value.some((unit) => unit.berkasLogo)),
);

useUnsavedChanges(adaPerubahan);

/* =========================
   LOGO
========================= */

// URL pratinjau lokal harus dibebaskan agar tidak menumpuk di memori
const lepasPratinjau = (unit) => {
  if (unit.pratinjau?.startsWith("blob:")) {
    URL.revokeObjectURL(unit.pratinjau);
  }
};

onBeforeUnmount(() => unitForms.value.forEach(lepasPratinjau));

const pilihLogo = (unit, file) => {
  errorMessage.value = "";
  successMessage.value = "";

  lepasPratinjau(unit);

  unit.berkasLogo = file;
  unit.pratinjau = URL.createObjectURL(file);
};

const batalkanLogo = (unit) => {
  lepasPratinjau(unit);

  unit.berkasLogo = null;
  unit.pratinjau = unit.logo_url;
};

const hapusLogo = (unit) => {
  lepasPratinjau(unit);

  unit.berkasLogo = null;
  unit.pratinjau = "";
  unit.logo_url = "";
  successMessage.value = "";
};

// Logo sengaja TIDAK diperkecil: harus tetap tajam, dan PNG transparan
// akan berubah berlatar putih bila diubah menjadi JPEG.
const unggahLogo = async (unit) => {
  const filePath = `units/${buildStorageFileName(unit.berkasLogo, `logo-${unit.slug}-`)}`;

  const { data, error } = await supabase.storage
    .from("images")
    .upload(filePath, unit.berkasLogo, {
      cacheControl: CACHE_FOTO,
      upsert: false,
    });

  if (error) throw error;

  return supabase.storage.from("images").getPublicUrl(data.path).data
    .publicUrl;
};

/* =========================
   AMBIL DATA
========================= */

const muatData = async () => {
  loading.value = true;
  errorMessage.value = "";

  const hasilUnit = await supabase.from("units").select("*").order("sort_order").order("id");

  if (hasilUnit.error) {
    if (tabelUnitBelumAda(hasilUnit.error)) {
      tabelUnitTidakAda.value = true;
    } else {
      console.error("Gagal mengambil unit:", hasilUnit.error);
      errorMessage.value = hasilUnit.error.message;
    }

    loading.value = false;
    return;
  }

  const daftar = hasilUnit.data || [];

  // Kolom logo_url baru ada setelah supabase/program_units.sql dijalankan.
  // select("*") mengembalikan semua kolom, jadi cukup diperiksa keberadaannya.
  fiturBelumAktif.value = daftar.length > 0 && !("logo_url" in daftar[0]);

  unitForms.value.forEach(lepasPratinjau);

  unitForms.value = daftar.map((unit) => ({
    id: unit.id,
    slug: unit.slug,
    short_name: unit.short_name || "",
    name: unit.name || "",
    description: unit.description || "",
    logo_url: unit.logo_url || "",
    berkasLogo: null,
    pratinjau: unit.logo_url || "",
  }));

  nilaiAwal.value = potretIsian();
  loading.value = false;
};

/* =========================
   SIMPAN
========================= */

const simpan = async () => {
  if (saving.value) return;

  const kosong = unitForms.value.find(
    (unit) => !unit.short_name.trim() || !unit.name.trim(),
  );

  if (kosong) {
    errorMessage.value =
      "Nama singkat dan nama lengkap setiap unit tidak boleh kosong.";
    return;
  }

  saving.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    // Logo diunggah lebih dulu, satu per satu, supaya bila salah satu
    // gagal belum ada data yang terlanjur berubah.
    uploading.value = unitForms.value.some((unit) => unit.berkasLogo);

    for (const unit of unitForms.value) {
      if (unit.berkasLogo) {
        unit.logo_url = await unggahLogo(unit);
      }
    }

    uploading.value = false;

    const permintaan = unitForms.value.map((unit) =>
      supabase
        .from("units")
        .update({
          short_name: unit.short_name.trim(),
          name: unit.name.trim(),
          description: unit.description.trim(),
          logo_url: unit.logo_url || null,
        })
        .eq("id", unit.id)
        .select(),
    );

    const hasil = await Promise.all(permintaan);

    const gagal = hasil.find((item) => item.error);
    if (gagal) throw gagal.error;

    // Ditolak diam-diam oleh kebijakan keamanan (RLS) = tidak ada baris
    // yang kembali.
    if (hasil.some((item) => !item.data?.length)) {
      throw new Error(
        "Sebagian perubahan tidak tersimpan. Kemungkinan sesi admin sudah berakhir. Coba keluar lalu masuk kembali.",
      );
    }

    await muatData();

    successMessage.value =
      "Identitas unit berhasil disimpan. Perubahan tampil di halaman Tentang Kami.";
  } catch (err) {
    console.error("Gagal menyimpan identitas unit:", err);
    errorMessage.value = err.message || "Gagal menyimpan identitas unit.";
  } finally {
    saving.value = false;
    uploading.value = false;
  }
};

onMounted(muatData);
</script>

<template>
  <section class="mt-8">
    <h2 class="mb-5 text-2xl font-bold text-gray-900">Identitas LKSA & TPQ</h2>
    <!-- Tabel unit belum dibuat -->
    <div
      v-if="tabelUnitTidakAda || (!loading && fiturBelumAktif)"
      class="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4"
    >
      <TriangleAlert class="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

      <div class="min-w-0">
        <p class="text-sm font-semibold text-amber-900">
          Fitur ini belum diaktifkan
        </p>

        <p class="mt-1 text-sm leading-6 text-amber-800">
          Tempat penyimpanan identitas atau logo unit belum tersedia di database.
        </p>

        <p class="mt-2 text-sm leading-6 text-amber-800">
          Untuk mengaktifkannya, minta pengelola teknis menjalankan
          <template v-if="tabelUnitTidakAda">
            berkas
            <code class="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
              supabase/unit_lembaga.sql
            </code>
            lalu
          </template>
          berkas
          <code class="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
            supabase/program_units.sql
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
      Memuat identitas unit...
    </div>

    <form v-else @submit.prevent="simpan">
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
          v-for="(unit, index) in unitForms"
          :key="unit.id"
          :step="index + 1"
          :title="`Unit ${unit.short_name || unit.slug}`"
          description="Nama, logo, dan penjelasan unit yang tampil di halaman Tentang Kami."
        >
          <div>
            <p class="text-sm font-semibold text-gray-800">
              Logo unit
              <span class="ml-1 text-xs font-normal text-gray-400">
                (boleh dikosongkan)
              </span>
            </p>

            <AdminImageInput
              class="mt-2"
              :preview-url="unit.pratinjau"
              :file-name="unit.berkasLogo?.name || ''"
              :disabled="saving"
              hint="Logo berbentuk persegi, sebaiknya PNG berlatar transparan dan di bawah 300 KB. Bila kosong, website menampilkan kotak hijau berisi nama singkat unit."
              aspect="1/1"
              fit="contain"
              @select="pilihLogo(unit, $event)"
              @clear="batalkanLogo(unit)"
              @error="errorMessage = $event"
            />

            <div v-if="unit.logo_url && !unit.berkasLogo" class="mt-3">
              <button
                type="button"
                @click="hapusLogo(unit)"
                class="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                Hapus logo
              </button>

              <p class="mt-2 text-xs text-gray-500">
                Logo baru benar-benar terhapus setelah tombol Simpan ditekan.
              </p>
            </div>
          </div>

          <AdminField
            v-slot="{ id }"
            label="Nama singkat"
            hint="Dipakai pada tombol dan label kecil, mis. LKSA atau TPQ."
            required
            :value="unit.short_name"
            :max="12"
          >
            <input
              :id="id"
              v-model="unit.short_name"
              type="text"
              required
              class="admin-input"
            />
          </AdminField>

          <AdminField
            v-slot="{ id }"
            label="Nama lengkap"
            hint="Tampil di bagian Unit Kami pada halaman Tentang Kami."
            required
            :value="unit.name"
            :max="80"
          >
            <input
              :id="id"
              v-model="unit.name"
              type="text"
              required
              class="admin-input"
            />
          </AdminField>

          <AdminField
            v-slot="{ id }"
            label="Penjelasan singkat"
            hint="Tampil di halaman Tentang Kami. Cukup 1-2 kalimat."
            :value="unit.description"
            :max="220"
          >
            <textarea
              :id="id"
              v-model="unit.description"
              rows="3"
              class="admin-textarea"
            ></textarea>
          </AdminField>

        </AdminCard>

      </div>
      <button type="submit" :disabled="saving || !adaPerubahan" class="mt-5 rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{{ saving ? 'Menyimpan...' : 'Simpan Identitas Unit' }}</button>
    </form>
  </section>
</template>
