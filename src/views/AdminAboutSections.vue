<script setup>
import { onMounted, reactive, ref } from "vue";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-vue-next";
import { supabase } from "../lib/supabase";
import AdminPage from "../components/admin/AdminPage.vue";
import AdminCard from "../components/admin/AdminCard.vue";
import AdminField from "../components/admin/AdminField.vue";
import AdminConfirm from "../components/admin/AdminConfirm.vue";
import AdminAlert from "../components/admin/AdminAlert.vue";
import { DAFTAR_IKON_NILAI, ambilIkonNilai } from "../lib/aboutIcons";

/**
 * Mengelola dua daftar pada halaman Tentang Kami: "Nilai Kami" dan
 * "Perjalanan Kami".
 *
 * Halaman ini sengaja terpisah dari halaman Tentang Kami yang berisi form
 * biasa. Alasannya: form disimpan dengan tombol Simpan, sedangkan daftar
 * tersimpan seketika lewat jendela isian. Mencampur keduanya dalam satu
 * halaman membuat pengurus ragu apakah perubahannya sudah tersimpan.
 */

const loading = ref(true);
const tabelBelumDibuat = ref(false);
const errorMessage = ref("");
const successMessage = ref("");

const values = ref([]);
const milestones = ref([]);

/* =========================================================
   PENGATURAN TIAP DAFTAR

   Kedua daftar bekerja dengan cara yang sama, jadi perilakunya
   ditulis sekali lalu dibedakan lewat objek pengaturan ini.
========================================================= */

const DAFTAR = {
  nilai: { tabel: "about_values", data: values },
  perjalanan: { tabel: "about_milestones", data: milestones },
};

const jenisAktif = ref("nilai");
const showModal = ref(false);
const saving = ref(false);
const editingItem = ref(null);
const modalError = ref("");

const form = reactive({
  icon: "heart",
  year: "",
  title: "",
  description: "",
});

const itemDihapus = ref(null);
const jenisDihapus = ref("nilai");
const deleting = ref(false);
const memindahId = ref(null);

/* =========================================================
   AMBIL DATA
========================================================= */

const cekTabelHilang = (error) =>
  error?.code === "PGRST205" || error?.code === "42P01";

const ambilSatu = async (kunci) => {
  const { tabel, data } = DAFTAR[kunci];

  const { data: hasil, error } = await supabase
    .from(tabel)
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (cekTabelHilang(error)) {
      tabelBelumDibuat.value = true;
      return;
    }

    console.error(`Gagal mengambil ${tabel}:`, error);
    errorMessage.value = error.message;
    return;
  }

  data.value = hasil || [];
};

const ambilSemua = async () => {
  loading.value = true;
  errorMessage.value = "";
  tabelBelumDibuat.value = false;

  await Promise.all([ambilSatu("nilai"), ambilSatu("perjalanan")]);

  loading.value = false;
};

/* =========================================================
   JENDELA ISIAN
========================================================= */

const bukaTambah = (kunci) => {
  jenisAktif.value = kunci;
  editingItem.value = null;
  modalError.value = "";
  successMessage.value = "";

  Object.assign(form, {
    icon: "heart",
    year: "",
    title: "",
    description: "",
  });

  showModal.value = true;
};

const bukaUbah = (kunci, item) => {
  jenisAktif.value = kunci;
  editingItem.value = item;
  modalError.value = "";
  successMessage.value = "";

  Object.assign(form, {
    icon: item.icon || "heart",
    year: item.year || "",
    title: item.title || "",
    description: item.description || "",
  });

  showModal.value = true;
};

const tutupModal = () => {
  if (saving.value) return;

  showModal.value = false;
  editingItem.value = null;
  modalError.value = "";
};

/* =========================================================
   SIMPAN
========================================================= */

const simpan = async () => {
  if (saving.value) return;

  const kunci = jenisAktif.value;
  const { tabel, data } = DAFTAR[kunci];

  if (!form.title.trim()) {
    modalError.value = "Judul wajib diisi.";
    return;
  }

  if (kunci === "perjalanan" && !form.year.trim()) {
    modalError.value = "Tahun wajib diisi.";
    return;
  }

  saving.value = true;
  modalError.value = "";

  try {
    const payload =
      kunci === "nilai"
        ? {
            icon: form.icon,
            title: form.title.trim(),
            description: form.description.trim(),
          }
        : {
            year: form.year.trim(),
            title: form.title.trim(),
            description: form.description.trim(),
          };

    let result;

    if (editingItem.value) {
      result = await supabase
        .from(tabel)
        .update(payload)
        .eq("id", editingItem.value.id)
        .select();
    } else {
      // Item baru diletakkan di urutan paling belakang
      const urutanTerakhir = data.value.length
        ? Math.max(...data.value.map((x) => x.sort_order ?? 0))
        : 0;

      result = await supabase
        .from(tabel)
        .insert({ ...payload, sort_order: urutanTerakhir + 1 })
        .select();
    }

    if (result.error) {
      throw result.error;
    }

    const sedangUbah = Boolean(editingItem.value);

    showModal.value = false;
    editingItem.value = null;

    await ambilSatu(kunci);

    successMessage.value = sedangUbah
      ? "Perubahan berhasil disimpan."
      : "Data baru berhasil ditambahkan.";
  } catch (error) {
    console.error("Gagal menyimpan:", error);
    modalError.value = error.message || "Gagal menyimpan data.";
  } finally {
    saving.value = false;
  }
};

/* =========================================================
   URUTAN

   Urutan penting terutama untuk garis waktu: pengunjung membacanya
   dari atas ke bawah, jadi harus bisa diatur pengurus.
========================================================= */

const pindah = async (kunci, index, arah) => {
  if (memindahId.value) return;

  const { tabel, data } = DAFTAR[kunci];
  const daftar = data.value;
  const tujuan = index + arah;

  if (tujuan < 0 || tujuan >= daftar.length) return;

  const a = daftar[index];
  const b = daftar[tujuan];

  memindahId.value = a.id;
  errorMessage.value = "";
  successMessage.value = "";

  // Tukar posisi di tampilan lebih dulu supaya terasa cepat
  const salinan = [...daftar];
  salinan[index] = b;
  salinan[tujuan] = a;
  data.value = salinan;

  try {
    // Urutan ditulis ulang berdasarkan posisi baru, bukan sekadar menukar
    // dua nilai. Cara ini tetap benar walau data lama punya sort_order
    // yang kembar atau kosong.
    const pembaruan = salinan.map((item, i) =>
      supabase
        .from(tabel)
        .update({ sort_order: i + 1 })
        .eq("id", item.id),
    );

    const hasil = await Promise.all(pembaruan);
    const gagal = hasil.find((r) => r.error);

    if (gagal) {
      throw gagal.error;
    }

    await ambilSatu(kunci);
  } catch (error) {
    console.error("Gagal mengubah urutan:", error);
    errorMessage.value = error.message || "Gagal mengubah urutan.";

    // Kembalikan ke keadaan sebenarnya di database
    await ambilSatu(kunci);
  } finally {
    memindahId.value = null;
  }
};

/* =========================================================
   HAPUS
========================================================= */

const mintaHapus = (kunci, item) => {
  jenisDihapus.value = kunci;
  itemDihapus.value = item;
};

const hapus = async () => {
  const item = itemDihapus.value;
  const kunci = jenisDihapus.value;

  if (!item || deleting.value) return;

  deleting.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const { data, error } = await supabase
      .from(DAFTAR[kunci].tabel)
      .delete()
      .eq("id", item.id)
      .select();

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      errorMessage.value =
        "Data tidak terhapus. Kemungkinan sesi admin sudah berakhir. Coba keluar lalu masuk kembali.";
      return;
    }

    await ambilSatu(kunci);

    successMessage.value = `"${item.title}" berhasil dihapus.`;
  } catch (error) {
    console.error("Gagal menghapus:", error);
    errorMessage.value = error.message || "Gagal menghapus data.";
  } finally {
    deleting.value = false;
    itemDihapus.value = null;
  }
};

onMounted(ambilSemua);
</script>

<template>
  <AdminPage
    title="Perjalanan & Nilai"
    description="Dua bagian tambahan pada halaman Tentang Kami: kartu nilai yang dipegang yayasan, dan garis waktu perjalanan yayasan dari masa ke masa."
    public-path="/tentang-kami"
    wide
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
          Tempat penyimpanannya belum dibuat di database. Halaman Tentang Kami
          tetap tampil normal, hanya kedua bagian ini yang belum muncul.
        </p>

        <p class="mt-2 text-sm leading-6 text-amber-800">
          Untuk mengaktifkannya, minta pengelola teknis menjalankan berkas
          <code class="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
            supabase/about_sections.sql
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
      Memuat data...
    </div>

    <div v-else class="space-y-5">
      <AdminAlert
        :error="errorMessage"
        :success="successMessage"
        @dismiss="
          errorMessage = '';
          successMessage = '';
        "
      />

      <!-- =====================================================
           NILAI KAMI
      ====================================================== -->
      <AdminCard
        step="1"
        title="Nilai Kami"
        description="Empat sampai lima kartu berisi hal yang dipegang teguh yayasan. Tampil sebagai deretan kartu berikon di halaman Tentang Kami."
      >
        <div
          v-if="values.length === 0"
          class="rounded-2xl border border-dashed border-gray-300 p-8 text-center"
        >
          <p class="font-semibold text-gray-900">Belum ada nilai</p>

          <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            Contoh: Kasih Sayang, Pendidikan, Amanah, Kemandirian.
          </p>
        </div>

        <ul v-else class="space-y-3">
          <li
            v-for="(nilai, index) in values"
            :key="nilai.id"
            class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4"
          >
            <!-- Urutan -->
            <div class="flex shrink-0 flex-col gap-1">
              <button
                type="button"
                :disabled="index === 0 || Boolean(memindahId)"
                @click="pindah('nilai', index, -1)"
                aria-label="Pindahkan ke atas"
                class="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronUp class="h-4 w-4" />
              </button>

              <button
                type="button"
                :disabled="index === values.length - 1 || Boolean(memindahId)"
                @click="pindah('nilai', index, 1)"
                aria-label="Pindahkan ke bawah"
                class="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronDown class="h-4 w-4" />
              </button>
            </div>

            <div
              class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
            >
              <component :is="ambilIkonNilai(nilai.icon)" class="h-5 w-5" />
            </div>

            <div class="min-w-0 flex-1">
              <p class="font-bold text-gray-900">{{ nilai.title }}</p>

              <p class="line-clamp-2 text-sm leading-6 text-gray-500">
                {{ nilai.description || "Belum ada penjelasan" }}
              </p>
            </div>

            <div class="flex shrink-0 gap-2">
              <button
                type="button"
                @click="bukaUbah('nilai', nilai)"
                aria-label="Ubah nilai"
                class="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Pencil class="h-4 w-4" />
              </button>

              <button
                type="button"
                @click="mintaHapus('nilai', nilai)"
                aria-label="Hapus nilai"
                class="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </li>
        </ul>

        <button
          type="button"
          @click="bukaTambah('nilai')"
          class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Plus class="h-4 w-4" />
          Tambah Nilai
        </button>
      </AdminCard>

      <!-- =====================================================
           PERJALANAN KAMI
      ====================================================== -->
      <AdminCard
        step="2"
        title="Perjalanan Kami"
        description="Garis waktu berisi tahapan penting yayasan. Urutkan dari yang paling lama ke yang paling baru — pengunjung membacanya dari atas ke bawah."
      >
        <div
          v-if="milestones.length === 0"
          class="rounded-2xl border border-dashed border-gray-300 p-8 text-center"
        >
          <p class="font-semibold text-gray-900">Belum ada tahapan</p>

          <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            Contoh: tahun yayasan berdiri, pindah ke gedung baru, jumlah anak
            asuh bertambah, atau program baru dimulai.
          </p>
        </div>

        <ul v-else class="space-y-3">
          <li
            v-for="(langkah, index) in milestones"
            :key="langkah.id"
            class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4"
          >
            <div class="flex shrink-0 flex-col gap-1">
              <button
                type="button"
                :disabled="index === 0 || Boolean(memindahId)"
                @click="pindah('perjalanan', index, -1)"
                aria-label="Pindahkan ke atas"
                class="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronUp class="h-4 w-4" />
              </button>

              <button
                type="button"
                :disabled="
                  index === milestones.length - 1 || Boolean(memindahId)
                "
                @click="pindah('perjalanan', index, 1)"
                aria-label="Pindahkan ke bawah"
                class="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronDown class="h-4 w-4" />
              </button>
            </div>

            <span
              class="shrink-0 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white"
            >
              {{ langkah.year }}
            </span>

            <div class="min-w-0 flex-1">
              <p class="font-bold text-gray-900">{{ langkah.title }}</p>

              <p class="line-clamp-2 text-sm leading-6 text-gray-500">
                {{ langkah.description || "Belum ada penjelasan" }}
              </p>
            </div>

            <div class="flex shrink-0 gap-2">
              <button
                type="button"
                @click="bukaUbah('perjalanan', langkah)"
                aria-label="Ubah tahapan"
                class="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Pencil class="h-4 w-4" />
              </button>

              <button
                type="button"
                @click="mintaHapus('perjalanan', langkah)"
                aria-label="Hapus tahapan"
                class="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </li>
        </ul>

        <button
          type="button"
          @click="bukaTambah('perjalanan')"
          class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Plus class="h-4 w-4" />
          Tambah Tahapan
        </button>
      </AdminCard>
    </div>

    <!-- =========================================================
         JENDELA ISIAN
    ========================================================== -->
    <div
      v-if="showModal"
      class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-6"
      @click.self="tutupModal"
    >
      <div
        class="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white sm:rounded-3xl"
      >
        <div
          class="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-gray-100 bg-white px-6 py-5"
        >
          <div>
            <h2 class="text-xl font-bold text-gray-900">
              {{ editingItem ? "Ubah" : "Tambah" }}
              {{ jenisAktif === "nilai" ? "Nilai" : "Tahapan" }}
            </h2>

            <p class="mt-1 text-sm text-gray-500">
              {{
                jenisAktif === "nilai"
                  ? "Satu hal yang dipegang teguh yayasan."
                  : "Satu peristiwa penting dalam perjalanan yayasan."
              }}
            </p>
          </div>

          <button
            type="button"
            @click="tutupModal"
            aria-label="Tutup"
            class="-mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        <form @submit.prevent="simpan" class="space-y-5 px-6 py-6">
          <AdminAlert :error="modalError" @dismiss="modalError = ''" />

          <!-- Pilihan ikon, khusus Nilai -->
          <div v-if="jenisAktif === 'nilai'">
            <p class="text-sm font-semibold text-gray-800">
              Ikon
              <span class="text-red-500">*</span>
            </p>

            <p class="mt-1 text-xs leading-5 text-gray-500">
              Gambar kecil di atas judul. Pilih yang paling mendekati maksud
              nilai tersebut.
            </p>

            <div class="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-7">
              <button
                v-for="pilihan in DAFTAR_IKON_NILAI"
                :key="pilihan.kunci"
                type="button"
                :title="pilihan.label"
                :aria-label="pilihan.label"
                :aria-pressed="form.icon === pilihan.kunci"
                @click="form.icon = pilihan.kunci"
                class="flex aspect-square items-center justify-center rounded-xl border transition"
                :class="
                  form.icon === pilihan.kunci
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-2 ring-emerald-100'
                    : 'border-gray-200 text-gray-500 hover:border-emerald-200 hover:bg-emerald-50/50'
                "
              >
                <component :is="pilihan.komponen" class="h-5 w-5" />
              </button>
            </div>
          </div>

          <!-- Tahun, khusus Perjalanan -->
          <AdminField
            v-if="jenisAktif === 'perjalanan'"
            v-slot="{ id }"
            label="Tahun"
            hint="Boleh satu tahun (2010), rentang (2010-2015), atau keterangan singkat (Sejak awal)."
            required
            :value="form.year"
            :max="16"
          >
            <input
              :id="id"
              v-model="form.year"
              type="text"
              required
              placeholder="2010"
              class="admin-input"
            />
          </AdminField>

          <AdminField
            v-slot="{ id }"
            label="Judul"
            :hint="
              jenisAktif === 'nilai'
                ? 'Satu atau dua kata. Contoh: Kasih Sayang.'
                : 'Peristiwanya apa. Contoh: Yayasan resmi berdiri.'
            "
            required
            :value="form.title"
            :max="jenisAktif === 'nilai' ? 24 : 60"
          >
            <input
              :id="id"
              v-model="form.title"
              type="text"
              required
              :placeholder="
                jenisAktif === 'nilai'
                  ? 'Kasih Sayang'
                  : 'Yayasan resmi berdiri'
              "
              class="admin-input"
            />
          </AdminField>

          <AdminField
            v-slot="{ id }"
            label="Penjelasan"
            hint="Satu sampai dua kalimat singkat."
            :value="form.description"
            :max="160"
          >
            <textarea
              :id="id"
              v-model="form.description"
              rows="4"
              :placeholder="
                jenisAktif === 'nilai'
                  ? 'Anak-anak tumbuh dalam lingkungan yang hangat dan diperhatikan.'
                  : 'Menampung sepuluh anak pertama di rumah sederhana di Baru Tengah.'
              "
              class="admin-textarea"
            ></textarea>
          </AdminField>

          <div class="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              @click="tutupModal"
              :disabled="saving"
              class="flex-1 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Batal
            </button>

            <button
              type="submit"
              :disabled="saving"
              class="flex-1 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ saving ? "Menyimpan..." : "Simpan" }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- KONFIRMASI HAPUS -->
    <AdminConfirm
      :open="Boolean(itemDihapus)"
      danger
      :busy="deleting"
      :title="
        jenisDihapus === 'nilai' ? 'Hapus nilai ini?' : 'Hapus tahapan ini?'
      "
      :message="`&quot;${itemDihapus?.title || ''}&quot; akan langsung hilang dari halaman Tentang Kami. Tindakan ini tidak dapat dibatalkan.`"
      confirm-label="Ya, hapus"
      @confirm="hapus"
      @cancel="itemDihapus = null"
    />
  </AdminPage>
</template>
