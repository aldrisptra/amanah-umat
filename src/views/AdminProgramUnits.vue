<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from "vue";
import { RouterLink } from "vue-router";
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
import { tabelUnitBelumAda } from "../lib/units";
import { PROGRAM_PAGE_BAWAAN, getProgramPage } from "../lib/programPage";

/* =========================================================
   STATE

   Halaman /program berisi pilihan unit (LKSA / TPQ), masing-masing
   menuju halaman programnya sendiri. Seluruh tulisan dan logo pada
   kedua halaman itu diatur dari sini; daftar programnya sendiri tetap
   di menu Program.
========================================================= */

const loading = ref(true);
const saving = ref(false);
const uploading = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

// Tiga keadaan database yang mungkin belum siap
const tabelUnitTidakAda = ref(false);
const fiturBelumAktif = ref(false);

const pageId = ref(null);

const pageForm = reactive({ ...PROGRAM_PAGE_BAWAAN });

// Satu isian per unit. `berkasLogo` dan `pratinjau` tidak ikut disimpan.
const unitForms = ref([]);

const ISIAN_UNIT = [
  "short_name",
  "name",
  "description",
  "page_title",
  "page_description",
  "logo_url",
];

const potretIsian = () =>
  JSON.stringify({
    page: pageForm,
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

  const [hasilUnit, hasilHalaman] = await Promise.all([
    supabase
      .from("units")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("id", { ascending: true }),
    getProgramPage(),
  ]);

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
  fiturBelumAktif.value =
    hasilHalaman.belumAda || (daftar.length > 0 && !("logo_url" in daftar[0]));

  pageId.value = hasilHalaman.data?.id || null;

  for (const kunci of Object.keys(PROGRAM_PAGE_BAWAAN)) {
    pageForm[kunci] = hasilHalaman.data?.[kunci] ?? PROGRAM_PAGE_BAWAAN[kunci];
  }

  unitForms.value.forEach(lepasPratinjau);

  unitForms.value = daftar.map((unit) => ({
    id: unit.id,
    slug: unit.slug,
    short_name: unit.short_name || "",
    name: unit.name || "",
    description: unit.description || "",
    page_title: unit.page_title || "",
    page_description: unit.page_description || "",
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

  if (!pageForm.title.trim()) {
    errorMessage.value = "Judul halaman Program tidak boleh kosong.";
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
          page_title: unit.page_title.trim(),
          page_description: unit.page_description.trim(),
          logo_url: unit.logo_url || null,
        })
        .eq("id", unit.id)
        .select(),
    );

    const isiHalaman = {
      ...Object.fromEntries(
        Object.keys(PROGRAM_PAGE_BAWAAN).map((kunci) => [
          kunci,
          pageForm[kunci].trim(),
        ]),
      ),
      updated_at: new Date().toISOString(),
    };

    permintaan.push(
      pageId.value
        ? supabase
            .from("program_page")
            .update(isiHalaman)
            .eq("id", pageId.value)
            .select()
        : supabase.from("program_page").insert(isiHalaman).select(),
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
      "Halaman Program berhasil disimpan. Perubahan langsung tampil di website.";
  } catch (err) {
    console.error("Gagal menyimpan halaman program:", err);
    errorMessage.value = err.message || "Gagal menyimpan halaman program.";
  } finally {
    saving.value = false;
    uploading.value = false;
  }
};

onMounted(muatData);
</script>

<template>
  <AdminPage
    title="Pilihan Unit Program"
    description="Halaman Program kini dibuka dengan pilihan unit (LKSA atau TPQ). Di sini Anda mengatur logo, nama, dan tulisan pada halaman pilihan maupun halaman program tiap unit."
    public-path="/program"
  >
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
          Tempat penyimpanan logo unit dan tulisan halaman Program belum dibuat
          di database. Website tetap berjalan normal memakai tulisan bawaan.
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
      Memuat halaman program...
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
        <!-- =====================================================
             1. BAGIAN ATAS HALAMAN PILIHAN
        ====================================================== -->
        <AdminCard
          step="1"
          title="Bagian atas halaman Program"
          description="Tulisan besar yang menyambut pengunjung sebelum memilih unit."
        >
          <AdminField
            v-slot="{ id }"
            label="Label kecil"
            hint="Tulisan hijau kecil di atas judul."
            required
            :value="pageForm.eyebrow"
            :max="30"
          >
            <input
              :id="id"
              v-model="pageForm.eyebrow"
              type="text"
              required
              class="admin-input"
            />
          </AdminField>

          <AdminField
            v-slot="{ id }"
            label="Judul"
            required
            :value="pageForm.title"
            :max="70"
          >
            <input
              :id="id"
              v-model="pageForm.title"
              type="text"
              required
              class="admin-input"
            />
          </AdminField>

          <AdminField
            v-slot="{ id }"
            label="Penjelasan"
            hint="Satu atau dua kalimat, misalnya ajakan memilih unit."
            :value="pageForm.description"
            :max="200"
          >
            <textarea
              :id="id"
              v-model="pageForm.description"
              rows="3"
              class="admin-textarea"
            ></textarea>
          </AdminField>
        </AdminCard>

        <!-- =====================================================
             2. TIAP UNIT
        ====================================================== -->
        <AdminCard
          v-for="(unit, index) in unitForms"
          :key="unit.id"
          :step="index + 2"
          :title="`Unit ${unit.short_name || unit.slug}`"
          :description="`Kartu pilihan di halaman Program, dan halaman /program/${unit.slug} yang terbuka saat kartu itu diklik.`"
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
            hint="Tampil sebagai judul kartu pilihan, juga di bagian Unit Kami pada halaman Tentang Kami."
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
            hint="Tampil di kartu pilihan dan di halaman Tentang Kami. Cukup 1-2 kalimat."
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

          <div class="rounded-2xl bg-gray-50 p-4">
            <p class="text-sm font-semibold text-gray-800">
              Halaman program {{ unit.short_name }}
            </p>

            <p class="mt-1 text-xs leading-5 text-gray-500">
              Bagian atas halaman yang terbuka setelah kartu
              {{ unit.short_name }} diklik.
            </p>

            <div class="mt-4 space-y-5">
              <AdminField
                v-slot="{ id }"
                label="Judul halaman"
                :hint="`Bila kosong, tertulis &quot;Program ${unit.short_name}&quot;.`"
                :value="unit.page_title"
                :max="70"
              >
                <input
                  :id="id"
                  v-model="unit.page_title"
                  type="text"
                  :placeholder="`Program ${unit.short_name}`"
                  class="admin-input"
                />
              </AdminField>

              <AdminField
                v-slot="{ id }"
                label="Penjelasan halaman"
                hint="Bila kosong, memakai penjelasan singkat unit di atas."
                :value="unit.page_description"
                :max="300"
              >
                <textarea
                  :id="id"
                  v-model="unit.page_description"
                  rows="3"
                  class="admin-textarea"
                ></textarea>
              </AdminField>
            </div>
          </div>
        </AdminCard>

        <!-- =====================================================
             3. AJAKAN DONASI
        ====================================================== -->
        <AdminCard
          :step="unitForms.length + 2"
          title="Ajakan donasi"
          description="Kotak hijau di bagian bawah halaman Program dan halaman tiap unit."
        >
          <AdminField
            v-slot="{ id }"
            label="Judul"
            required
            :value="pageForm.cta_title"
            :max="70"
          >
            <input
              :id="id"
              v-model="pageForm.cta_title"
              type="text"
              required
              class="admin-input"
            />
          </AdminField>

          <AdminField
            v-slot="{ id }"
            label="Penjelasan"
            :value="pageForm.cta_description"
            :max="200"
          >
            <textarea
              :id="id"
              v-model="pageForm.cta_description"
              rows="3"
              class="admin-textarea"
            ></textarea>
          </AdminField>
        </AdminCard>

        <p class="text-sm text-gray-500">
          Daftar program tiap unit diatur di menu
          <RouterLink
            to="/admin/program"
            class="font-semibold text-emerald-700 hover:underline"
          >
            Program
          </RouterLink>
          — pilih unit penyelenggara pada setiap program.
        </p>
      </div>

      <AdminSaveBar
        :dirty="adaPerubahan"
        :saving="saving"
        :busy-label="uploading ? 'Mengunggah logo...' : ''"
        label="Simpan Halaman Program"
      />
    </form>
  </AdminPage>
</template>
