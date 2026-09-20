<script setup>
import { onBeforeUnmount, onMounted, reactive, ref } from "vue";
import {
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
  Trophy,
} from "lucide-vue-next";
import { supabase } from "../lib/supabase";
import AdminPage from "../components/admin/AdminPage.vue";
import AdminField from "../components/admin/AdminField.vue";
import AdminImageInput from "../components/admin/AdminImageInput.vue";
import AdminConfirm from "../components/admin/AdminConfirm.vue";
import AdminAlert from "../components/admin/AdminAlert.vue";
import { buildStorageFileName } from "../lib/utils";

/**
 * Mengelola daftar prestasi yang tampil di halaman /prestasi.
 *
 * Seperti halaman Perjalanan & Nilai, daftar ini tersimpan seketika lewat
 * jendela isian (bukan tombol Simpan di bawah layar), sehingga tidak ada
 * keraguan apakah perubahan sudah masuk atau belum.
 *
 * Foto sengaja tidak diwajibkan: banyak prestasi hanya berupa catatan tanpa
 * dokumentasi. Kartu yang tidak berfoto tetap tampil rapi di website dengan
 * lambang piala.
 */

const daftar = ref([]);
const loading = ref(true);
const tabelBelumDibuat = ref(false);

const errorMessage = ref("");
const successMessage = ref("");

const showModal = ref(false);
const saving = ref(false);
const uploading = ref(false);
const modalError = ref("");
const editingItem = ref(null);

const itemDihapus = ref(null);
const deleting = ref(false);
const memindahId = ref(null);

const form = reactive({
  title: "",
  year: "",
  category: "",
  organizer: "",
  description: "",
  image_url: "",
});

const selectedImageFile = ref(null);
const imagePreviewUrl = ref("");

/* =========================================================
   FOTO
========================================================= */

// URL pratinjau lokal harus dibebaskan agar tidak menumpuk di memori
const revokePreview = () => {
  if (imagePreviewUrl.value.startsWith("blob:")) {
    URL.revokeObjectURL(imagePreviewUrl.value);
  }
};

onBeforeUnmount(revokePreview);

const handleImageSelect = (file) => {
  modalError.value = "";

  revokePreview();

  selectedImageFile.value = file;
  imagePreviewUrl.value = URL.createObjectURL(file);
};

// Membatalkan foto BARU yang belum disimpan - foto lama tetap terpasang
const handleImageClear = () => {
  revokePreview();

  selectedImageFile.value = null;
  imagePreviewUrl.value = form.image_url;
};

// Melepas foto yang sudah tersimpan, agar kartu kembali memakai lambang piala
const lepasFotoLama = () => {
  revokePreview();

  selectedImageFile.value = null;
  form.image_url = "";
  imagePreviewUrl.value = "";
};

const unggahFoto = async (file) => {
  uploading.value = true;

  try {
    const filePath = `achievements/${buildStorageFileName(file)}`;

    const { data, error } = await supabase.storage
      .from("images")
      .upload(filePath, file, { cacheControl: "3600", upsert: false });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from("images")
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } finally {
    uploading.value = false;
  }
};

/* =========================================================
   AMBIL DATA
========================================================= */

const cekTabelHilang = (error) =>
  error?.code === "PGRST205" || error?.code === "42P01";

const ambilData = async () => {
  loading.value = true;
  errorMessage.value = "";

  const { data, error } = await supabase
    .from("achievements")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (cekTabelHilang(error)) {
      tabelBelumDibuat.value = true;
    } else {
      console.error("Gagal mengambil prestasi:", error);
      errorMessage.value = error.message;
    }

    loading.value = false;
    return;
  }

  tabelBelumDibuat.value = false;
  daftar.value = data || [];
  loading.value = false;
};

onMounted(ambilData);

/* =========================================================
   JENDELA ISIAN
========================================================= */

const resetForm = () => {
  Object.assign(form, {
    title: "",
    year: "",
    category: "",
    organizer: "",
    description: "",
    image_url: "",
  });

  selectedImageFile.value = null;
  revokePreview();
  imagePreviewUrl.value = "";
};

const bukaTambah = () => {
  editingItem.value = null;
  modalError.value = "";
  successMessage.value = "";

  resetForm();

  showModal.value = true;
};

const bukaUbah = (item) => {
  editingItem.value = item;
  modalError.value = "";
  successMessage.value = "";

  Object.assign(form, {
    title: item.title || "",
    year: item.year || "",
    category: item.category || "",
    organizer: item.organizer || "",
    description: item.description || "",
    image_url: item.image_url || "",
  });

  selectedImageFile.value = null;
  revokePreview();
  imagePreviewUrl.value = item.image_url || "";

  showModal.value = true;
};

const tutupModal = () => {
  if (saving.value) return;

  showModal.value = false;
  editingItem.value = null;
  modalError.value = "";

  resetForm();
};

/* =========================================================
   SIMPAN
========================================================= */

const simpan = async () => {
  if (saving.value) return;

  if (!form.title.trim()) {
    modalError.value = "Nama prestasi wajib diisi.";
    return;
  }

  saving.value = true;
  modalError.value = "";

  try {
    let imageUrl = form.image_url.trim();

    if (selectedImageFile.value) {
      imageUrl = await unggahFoto(selectedImageFile.value);
    }

    const payload = {
      title: form.title.trim(),
      year: form.year.trim(),
      category: form.category.trim(),
      organizer: form.organizer.trim(),
      description: form.description.trim(),
      // Disimpan null (bukan teks kosong) supaya halaman publik cukup
      // memeriksa keberadaan nilainya
      image_url: imageUrl || null,
    };

    let result;

    if (editingItem.value) {
      result = await supabase
        .from("achievements")
        .update(payload)
        .eq("id", editingItem.value.id)
        .select();
    } else {
      // Prestasi baru diletakkan di urutan paling belakang
      const urutanTerakhir = daftar.value.length
        ? Math.max(...daftar.value.map((x) => x.sort_order ?? 0))
        : 0;

      result = await supabase
        .from("achievements")
        .insert({ ...payload, sort_order: urutanTerakhir + 1 })
        .select();
    }

    if (result.error) throw result.error;

    const sedangUbah = Boolean(editingItem.value);

    showModal.value = false;
    editingItem.value = null;
    resetForm();

    await ambilData();

    successMessage.value = sedangUbah
      ? "Perubahan berhasil disimpan."
      : "Prestasi baru berhasil ditambahkan.";
  } catch (error) {
    console.error("Gagal menyimpan prestasi:", error);
    modalError.value = error.message || "Gagal menyimpan data.";
  } finally {
    saving.value = false;
  }
};

/* =========================================================
   URUTAN

   Urutan di panel ini sama persis dengan urutan di halaman publik,
   jadi prestasi terbaru atau terpenting bisa diletakkan paling atas.
========================================================= */

const pindah = async (index, arah) => {
  if (memindahId.value) return;

  const tujuan = index + arah;

  if (tujuan < 0 || tujuan >= daftar.value.length) return;

  const a = daftar.value[index];
  const b = daftar.value[tujuan];

  memindahId.value = a.id;
  errorMessage.value = "";
  successMessage.value = "";

  // Tukar posisi di tampilan lebih dulu supaya terasa cepat
  const salinan = [...daftar.value];
  salinan[index] = b;
  salinan[tujuan] = a;
  daftar.value = salinan;

  try {
    // Urutan ditulis ulang berdasarkan posisi baru, bukan sekadar menukar dua
    // nilai. Cara ini tetap benar walau data lama punya sort_order kembar.
    const pembaruan = salinan.map((item, i) =>
      supabase
        .from("achievements")
        .update({ sort_order: i + 1 })
        .eq("id", item.id),
    );

    const hasil = await Promise.all(pembaruan);
    const gagal = hasil.find((r) => r.error);

    if (gagal) throw gagal.error;

    await ambilData();
  } catch (error) {
    console.error("Gagal mengubah urutan:", error);
    errorMessage.value = error.message || "Gagal mengubah urutan.";

    // Kembalikan ke keadaan sebenarnya di database
    await ambilData();
  } finally {
    memindahId.value = null;
  }
};

/* =========================================================
   HAPUS
========================================================= */

const hapus = async () => {
  const item = itemDihapus.value;

  if (!item || deleting.value) return;

  deleting.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  try {
    const { data, error } = await supabase
      .from("achievements")
      .delete()
      .eq("id", item.id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      errorMessage.value =
        "Data tidak terhapus. Kemungkinan sesi admin sudah berakhir. Coba keluar lalu masuk kembali.";
      return;
    }

    await ambilData();

    successMessage.value = `"${item.title}" berhasil dihapus.`;
  } catch (error) {
    console.error("Gagal menghapus prestasi:", error);
    errorMessage.value = error.message || "Gagal menghapus data.";
  } finally {
    deleting.value = false;
    itemDihapus.value = null;
  }
};
</script>

<template>
  <AdminPage
    title="Prestasi"
    description="Daftar penghargaan dan capaian anak-anak maupun lembaga, yang tampil di halaman Prestasi. Urutan di sini sama dengan urutan yang dilihat pengunjung."
    public-path="/prestasi"
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
          Tempat penyimpanannya belum dibuat di database. Website tetap tampil
          normal, hanya halaman Prestasi yang masih kosong.
        </p>

        <p class="mt-2 text-sm leading-6 text-amber-800">
          Untuk mengaktifkannya, minta pengelola teknis menjalankan berkas
          <code class="rounded bg-amber-100 px-1.5 py-0.5 font-mono text-xs">
            supabase/achievements.sql
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

    <div v-else>
      <AdminAlert
        :error="errorMessage"
        :success="successMessage"
        @dismiss="
          errorMessage = '';
          successMessage = '';
        "
      />

      <!-- Belum ada isi -->
      <div
        v-if="daftar.length === 0"
        class="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center"
      >
        <div
          class="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"
        >
          <Trophy class="h-6 w-6" />
        </div>

        <p class="mt-4 font-semibold text-gray-900">Belum ada prestasi</p>

        <p class="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
          Contoh: juara lomba yang diraih anak asuh, penghargaan dari dinas,
          atau status akreditasi lembaga.
        </p>

        <button
          type="button"
          @click="bukaTambah"
          class="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Plus class="h-4 w-4" />
          Tambah Prestasi
        </button>
      </div>

      <!-- Daftar -->
      <div v-else class="space-y-4">
        <ul class="space-y-3">
          <li
            v-for="(item, index) in daftar"
            :key="item.id"
            class="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4"
          >
            <!-- Urutan -->
            <div class="flex shrink-0 flex-col gap-1">
              <button
                type="button"
                :disabled="index === 0 || Boolean(memindahId)"
                @click="pindah(index, -1)"
                aria-label="Pindahkan ke atas"
                class="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronUp class="h-4 w-4" />
              </button>

              <button
                type="button"
                :disabled="index === daftar.length - 1 || Boolean(memindahId)"
                @click="pindah(index, 1)"
                aria-label="Pindahkan ke bawah"
                class="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronDown class="h-4 w-4" />
              </button>
            </div>

            <!-- Foto / lambang -->
            <div
              class="h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-emerald-50"
            >
              <img
                v-if="item.image_url"
                :src="item.image_url"
                :alt="item.title"
                class="h-full w-full object-cover"
              />

              <div
                v-else
                class="flex h-full w-full items-center justify-center text-emerald-600"
              >
                <Trophy class="h-5 w-5" />
              </div>
            </div>

            <!-- Keterangan -->
            <div class="min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <span
                  v-if="item.year"
                  class="rounded-full bg-emerald-600 px-2.5 py-0.5 text-xs font-bold text-white"
                >
                  {{ item.year }}
                </span>

                <span
                  v-if="item.category"
                  class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600"
                >
                  {{ item.category }}
                </span>
              </div>

              <p class="mt-1 font-bold text-gray-900">{{ item.title }}</p>

              <p class="line-clamp-1 text-sm leading-6 text-gray-500">
                {{ item.organizer || "Penyelenggara belum diisi" }}
              </p>
            </div>

            <!-- Tindakan -->
            <div class="flex shrink-0 gap-2">
              <button
                type="button"
                @click="bukaUbah(item)"
                aria-label="Ubah prestasi"
                class="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              >
                <Pencil class="h-4 w-4" />
              </button>

              <button
                type="button"
                @click="itemDihapus = item"
                aria-label="Hapus prestasi"
                class="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <Trash2 class="h-4 w-4" />
              </button>
            </div>
          </li>
        </ul>

        <button
          type="button"
          @click="bukaTambah"
          class="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <Plus class="h-4 w-4" />
          Tambah Prestasi
        </button>
      </div>
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
              {{ editingItem ? "Ubah Prestasi" : "Tambah Prestasi" }}
            </h2>

            <p class="mt-1 text-sm text-gray-500">
              Satu penghargaan atau capaian yang diraih anak asuh maupun
              lembaga.
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

          <AdminField
            v-slot="{ id }"
            label="Nama prestasi"
            hint="Tulis seperti yang tertera di piagam. Contoh: Juara 1 Musabaqah Hifzhil Quran Tingkat Kota."
            required
            :value="form.title"
            :max="90"
          >
            <input
              :id="id"
              v-model="form.title"
              type="text"
              required
              placeholder="Juara 1 Musabaqah Hifzhil Quran Tingkat Kota"
              class="admin-input"
            />
          </AdminField>

          <div class="grid gap-5 sm:grid-cols-2">
            <AdminField
              v-slot="{ id }"
              label="Tahun"
              hint="Boleh satu tahun (2024) atau rentang (2023-2024)."
              :value="form.year"
              :max="16"
            >
              <input
                :id="id"
                v-model="form.year"
                type="text"
                placeholder="2024"
                class="admin-input"
              />
            </AdminField>

            <AdminField
              v-slot="{ id }"
              label="Kategori"
              hint="Dipakai sebagai tombol penyaring di halaman Prestasi. Contoh: Tahfidz, Akademik, Olahraga, Kelembagaan."
              :value="form.category"
              :max="24"
            >
              <input
                :id="id"
                v-model="form.category"
                type="text"
                placeholder="Tahfidz"
                class="admin-input"
              />
            </AdminField>
          </div>

          <AdminField
            v-slot="{ id }"
            label="Penyelenggara"
            hint="Pihak yang memberikan penghargaan."
            :value="form.organizer"
            :max="70"
          >
            <input
              :id="id"
              v-model="form.organizer"
              type="text"
              placeholder="Kementerian Agama Kota Balikpapan"
              class="admin-input"
            />
          </AdminField>

          <AdminField
            v-slot="{ id }"
            label="Penjelasan"
            hint="Satu sampai tiga kalimat tentang prestasi tersebut."
            :value="form.description"
            :max="260"
          >
            <textarea
              :id="id"
              v-model="form.description"
              rows="4"
              placeholder="Ananda asuh LKSA Amanah Ummat meraih juara pertama pada cabang hafalan 5 juz tingkat Kota Balikpapan."
              class="admin-textarea"
            ></textarea>
          </AdminField>

          <!-- Foto -->
          <div>
            <p class="text-sm font-semibold text-gray-800">
              Foto piagam atau dokumentasi

              <span class="ml-1 text-xs font-normal text-gray-400">
                (boleh dikosongkan)
              </span>
            </p>

            <div class="mt-2">
              <AdminImageInput
                :preview-url="imagePreviewUrl"
                :file-name="selectedImageFile?.name || ''"
                hint="Bila dikosongkan, kartu di website menampilkan lambang piala di atas latar hijau."
                aspect="4/3"
                :disabled="saving"
                @select="handleImageSelect"
                @clear="handleImageClear"
                @error="modalError = $event"
              />
            </div>

            <button
              v-if="form.image_url && !selectedImageFile"
              type="button"
              @click="lepasFotoLama"
              class="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              <Trash2 class="h-3.5 w-3.5" />
              Tampilkan tanpa foto
            </button>
          </div>

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
              {{
                uploading
                  ? "Mengunggah foto..."
                  : saving
                    ? "Menyimpan..."
                    : "Simpan"
              }}
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
      title="Hapus prestasi ini?"
      :message="`&quot;${itemDihapus?.title || ''}&quot; akan langsung hilang dari halaman Prestasi. Tindakan ini tidak dapat dibatalkan.`"
      confirm-label="Ya, hapus"
      @confirm="hapus"
      @cancel="itemDihapus = null"
    />
  </AdminPage>
</template>
