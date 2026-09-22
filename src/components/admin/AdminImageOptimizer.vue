<script setup>
import { computed, onBeforeUnmount, ref } from "vue";
import {
  CircleAlert,
  CircleCheck,
  Gauge,
  LoaderCircle,
  Zap,
} from "lucide-vue-next";
import { supabase } from "../../lib/supabase";
import {
  CACHE_FOTO,
  UKURAN,
  compressImage,
} from "../../lib/imageCompress";
import { buildStorageFileName } from "../../lib/utils";

/**
 * Memperkecil foto yang sudah terlanjur diunggah dalam ukuran penuh.
 *
 * Foto baru sudah otomatis diperkecil saat diunggah. Alat ini untuk foto
 * lama - diunggah sebelum fitur itu ada - yang membuat halaman Galeri dan
 * Program lambat dibuka.
 *
 * Seluruh proses berjalan di browser memakai sesi login pengurus, jadi tidak
 * perlu kunci rahasia tambahan. Berkas lama sengaja TIDAK dihapus: kalau ada
 * yang tidak beres, foto aslinya masih tersimpan dan bisa dipulihkan.
 */

// Tabel mana saja yang menyimpan foto, dan seberapa besar fotonya perlu.
// Logo dan QRIS sengaja tidak dicantumkan - keduanya harus tetap tajam.
const SUMBER = [
  { tabel: "gallery", kolom: "image_url", label: "Galeri" },
  { tabel: "programs", kolom: "image_url", label: "Program" },
  { tabel: "achievements", kolom: "image_url", label: "Prestasi" },
  { tabel: "about", kolom: "image_url", label: "Tentang Kami" },
  {
    tabel: "home_content",
    kolom: "hero_image_url",
    label: "Foto beranda",
    ukuran: "hero",
  },
];

// Foto di bawah ukuran ini dianggap sudah cukup ringan
const BATAS_BERAT = 500 * 1024;

// Hanya foto di penyimpanan milik website sendiri yang diproses. Tautan ke
// situs luar tidak boleh diunduh lalu diunggah ulang sebagai milik kita.
const AWALAN_PENYIMPANAN = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/images/`;

const tahap = ref("awal"); // awal | memeriksa | hasil | memproses | selesai
const pesanGalat = ref("");

const daftarBerat = ref([]);
const totalSemua = ref(0);
const jumlahSemua = ref(0);

const diproses = ref(0);
const beratSebelum = ref(0);
const beratSesudah = ref(0);
const gagal = ref([]);

const formatUkuran = (byte) => {
  if (!byte) return "0 KB";

  if (byte >= 1024 * 1024) {
    return `${(byte / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
  }

  return `${Math.round(byte / 1024)} KB`;
};

const totalBerat = computed(() =>
  daftarBerat.value.reduce((jumlah, item) => jumlah + item.ukuran, 0),
);

const persenHemat = computed(() =>
  beratSebelum.value
    ? Math.round((1 - beratSesudah.value / beratSebelum.value) * 100)
    : 0,
);

const tabelTidakAda = (error) =>
  error?.code === "PGRST205" || error?.code === "42P01";

/* =========================================================
   CEGAH HALAMAN DITUTUP SAAT PROSES BERJALAN
========================================================= */

const tahanPenutupan = (event) => {
  event.preventDefault();
  event.returnValue = "";
};

onBeforeUnmount(() => {
  window.removeEventListener("beforeunload", tahanPenutupan);
});

/* =========================================================
   PERIKSA
========================================================= */

const periksa = async () => {
  tahap.value = "memeriksa";
  pesanGalat.value = "";

  try {
    // Satu foto bisa dipakai di lebih dari satu tempat. Dikelompokkan per
    // alamat supaya setiap foto hanya diperkecil sekali.
    const perAlamat = new Map();

    for (const sumber of SUMBER) {
      const { data, error } = await supabase
        .from(sumber.tabel)
        .select(`id, ${sumber.kolom}`)
        .not(sumber.kolom, "is", null);

      if (error) {
        if (tabelTidakAda(error)) continue;
        throw error;
      }

      for (const baris of data || []) {
        const url = baris[sumber.kolom];

        if (!url || !url.startsWith(AWALAN_PENYIMPANAN)) continue;

        if (!perAlamat.has(url)) {
          perAlamat.set(url, {
            url,
            ukuranJenis: sumber.ukuran || "standar",
            pemakai: [],
            label: new Set(),
          });
        }

        const item = perAlamat.get(url);

        item.pemakai.push({
          tabel: sumber.tabel,
          kolom: sumber.kolom,
          id: baris.id,
        });
        item.label.add(sumber.label);

        // Foto beranda memakai ukuran yang lebih besar
        if (sumber.ukuran === "hero") item.ukuranJenis = "hero";
      }
    }

    const semua = [...perAlamat.values()];

    // Ukuran berkas dibaca dari kepala tanggapan saja, tanpa mengunduh isinya
    await Promise.all(
      semua.map(async (item) => {
        try {
          const res = await fetch(item.url, { method: "HEAD" });
          item.ukuran = Number(res.headers.get("content-length")) || 0;
        } catch {
          item.ukuran = 0;
        }
      }),
    );

    jumlahSemua.value = semua.length;
    totalSemua.value = semua.reduce((j, i) => j + i.ukuran, 0);

    daftarBerat.value = semua
      .filter((item) => item.ukuran > BATAS_BERAT)
      .map((item) => ({ ...item, label: [...item.label].join(", ") }))
      .sort((a, b) => b.ukuran - a.ukuran);

    tahap.value = "hasil";
  } catch (error) {
    console.error("Gagal memeriksa foto:", error);

    pesanGalat.value =
      error.message || "Gagal memeriksa foto. Coba muat ulang halaman.";
    tahap.value = "awal";
  }
};

/* =========================================================
   PERKECIL
========================================================= */

const alamatKePath = (url) => url.slice(AWALAN_PENYIMPANAN.length);

const perkecilSatu = async (item) => {
  const jalurLama = alamatKePath(item.url);
  const folder = jalurLama.includes("/") ? jalurLama.split("/")[0] : "gallery";
  const namaLama = jalurLama.split("/").pop();

  const res = await fetch(item.url);

  if (!res.ok) throw new Error("Foto tidak dapat diunduh.");

  const asli = await res.blob();

  const kecil = await compressImage(asli, {
    ...UKURAN[item.ukuranJenis],
    nama: namaLama,
  });

  // Tidak ada gunanya diganti bila hasilnya tidak lebih ringan
  if (kecil === asli || kecil.size >= asli.size) {
    return { sebelum: asli.size, sesudah: asli.size };
  }

  const awalanNama = namaLama.startsWith("hero-") ? "hero-" : "";
  const jalurBaru = `${folder}/${buildStorageFileName(kecil, awalanNama)}`;

  const { data, error } = await supabase.storage
    .from("images")
    .upload(jalurBaru, kecil, { cacheControl: CACHE_FOTO, upsert: false });

  if (error) throw error;

  const { data: publik } = supabase.storage
    .from("images")
    .getPublicUrl(data.path);

  // Arahkan setiap tempat yang memakai foto ini ke berkas yang baru
  for (const pemakai of item.pemakai) {
    const { data: diubah, error: errorUbah } = await supabase
      .from(pemakai.tabel)
      .update({ [pemakai.kolom]: publik.publicUrl })
      .eq("id", pemakai.id)
      .select("id");

    if (errorUbah) throw errorUbah;

    // Penolakan diam-diam oleh kebijakan keamanan: tidak ada galat, tetapi
    // tidak ada baris yang berubah. Biasanya karena sesi login berakhir.
    if (!diubah?.length) {
      throw new Error(
        "Perubahan ditolak. Kemungkinan sesi login sudah berakhir - keluar lalu masuk kembali.",
      );
    }
  }

  return { sebelum: asli.size, sesudah: kecil.size };
};

const perkecilSemua = async () => {
  if (!daftarBerat.value.length) return;

  tahap.value = "memproses";
  diproses.value = 0;
  beratSebelum.value = 0;
  beratSesudah.value = 0;
  gagal.value = [];

  window.addEventListener("beforeunload", tahanPenutupan);

  // Satu per satu, bukan serentak: foto 3 MB yang diproses bersamaan bisa
  // menghabiskan memori HP dan membuat browser tertutup sendiri.
  for (const item of daftarBerat.value) {
    try {
      const hasil = await perkecilSatu(item);

      beratSebelum.value += hasil.sebelum;
      beratSesudah.value += hasil.sesudah;
    } catch (error) {
      console.error("Gagal memperkecil foto:", item.url, error);

      gagal.value.push({
        label: item.label,
        pesan: error.message || "Gagal diproses.",
      });
    }

    diproses.value += 1;
  }

  window.removeEventListener("beforeunload", tahanPenutupan);

  tahap.value = "selesai";
};

const persenKemajuan = computed(() =>
  daftarBerat.value.length
    ? Math.round((diproses.value / daftarBerat.value.length) * 100)
    : 0,
);
</script>

<template>
  <section class="rounded-2xl border border-gray-200 bg-white p-6">
    <div class="flex items-start gap-4">
      <div
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700"
      >
        <Gauge class="h-5 w-5" />
      </div>

      <div class="min-w-0 flex-1">
        <h2 class="text-base font-bold text-gray-900">Kecepatan foto</h2>

        <p class="mt-1 text-sm leading-6 text-gray-600">
          Foto yang terlalu berat membuat halaman Galeri dan Program lambat
          dibuka, terutama dari HP. Foto baru sudah otomatis diperkecil saat
          diunggah — alat ini untuk foto lama.
        </p>
      </div>
    </div>

    <!-- Galat -->
    <div
      v-if="pesanGalat"
      role="alert"
      class="mt-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5"
    >
      <CircleAlert class="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
      <p class="text-sm leading-6 text-red-700">{{ pesanGalat }}</p>
    </div>

    <!-- ===================== AWAL ===================== -->
    <button
      v-if="tahap === 'awal'"
      type="button"
      @click="periksa"
      class="mt-5 inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700"
    >
      <Gauge class="h-4 w-4" />
      Periksa ukuran foto
    </button>

    <!-- ===================== MEMERIKSA ===================== -->
    <div
      v-else-if="tahap === 'memeriksa'"
      class="mt-5 flex items-center gap-3 text-sm text-gray-600"
    >
      <LoaderCircle class="h-5 w-5 animate-spin text-sky-600" />
      Memeriksa seluruh foto...
    </div>

    <!-- ===================== HASIL ===================== -->
    <div v-else-if="tahap === 'hasil'" class="mt-5">
      <!-- Semua sudah ringan -->
      <div
        v-if="!daftarBerat.length"
        class="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5"
      >
        <CircleCheck class="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

        <p class="text-sm leading-6 text-emerald-800">
          Semua {{ jumlahSemua }} foto sudah ringan (total
          {{ formatUkuran(totalSemua) }}). Tidak ada yang perlu diperkecil.
        </p>
      </div>

      <template v-else>
        <div
          class="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4"
        >
          <p class="text-sm font-semibold text-amber-900">
            {{ daftarBerat.length }} dari {{ jumlahSemua }} foto terlalu berat
          </p>

          <p class="mt-1 text-sm leading-6 text-amber-800">
            Total <strong>{{ formatUkuran(totalBerat) }}</strong>. Setelah
            diperkecil biasanya tinggal 10–20% dari ukuran itu, tanpa beda
            yang terlihat mata.
          </p>
        </div>

        <ul
          class="mt-4 max-h-60 space-y-1.5 overflow-y-auto rounded-2xl border border-gray-100 p-3 text-sm"
        >
          <li
            v-for="item in daftarBerat"
            :key="item.url"
            class="flex items-center justify-between gap-3"
          >
            <span class="truncate text-gray-600">{{ item.label }}</span>
            <span class="shrink-0 font-semibold tabular-nums text-gray-900">
              {{ formatUkuran(item.ukuran) }}
            </span>
          </li>
        </ul>

        <p class="mt-4 text-xs leading-5 text-gray-500">
          Butuh sekitar 2–5 detik per foto. Jangan tutup halaman ini selama
          proses berjalan. Foto aslinya tetap tersimpan sebagai cadangan.
        </p>

        <div class="mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            @click="perkecilSemua"
            class="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700"
          >
            <Zap class="h-4 w-4" />
            Perkecil {{ daftarBerat.length }} foto
          </button>

          <button
            type="button"
            @click="tahap = 'awal'"
            class="rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
          >
            Nanti saja
          </button>
        </div>
      </template>
    </div>

    <!-- ===================== MEMPROSES ===================== -->
    <div v-else-if="tahap === 'memproses'" class="mt-5">
      <div class="flex items-center justify-between text-sm">
        <span class="flex items-center gap-2 font-semibold text-gray-800">
          <LoaderCircle class="h-4 w-4 animate-spin text-sky-600" />
          Memproses {{ diproses }} dari {{ daftarBerat.length }} foto
        </span>

        <span class="tabular-nums text-gray-500">{{ persenKemajuan }}%</span>
      </div>

      <div class="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          class="h-full rounded-full bg-sky-600 transition-all duration-300"
          :style="{ width: `${persenKemajuan}%` }"
        ></div>
      </div>

      <p class="mt-3 text-xs font-medium text-amber-700">
        Jangan tutup atau pindah halaman sampai selesai.
      </p>
    </div>

    <!-- ===================== SELESAI ===================== -->
    <div v-else-if="tahap === 'selesai'" class="mt-5 space-y-4">
      <div
        class="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4"
      >
        <CircleCheck class="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

        <div class="min-w-0">
          <p class="text-sm font-semibold text-emerald-900">
            Selesai — {{ daftarBerat.length - gagal.length }} foto diperkecil
          </p>

          <p class="mt-1 text-sm leading-6 text-emerald-800">
            Dari {{ formatUkuran(beratSebelum) }} menjadi
            {{ formatUkuran(beratSesudah) }}
            <strong>(hemat {{ persenHemat }}%)</strong>. Halaman Galeri dan
            Program sekarang jauh lebih cepat dibuka.
          </p>
        </div>
      </div>

      <div
        v-if="gagal.length"
        class="rounded-2xl border border-red-200 bg-red-50 px-4 py-4"
      >
        <p class="text-sm font-semibold text-red-800">
          {{ gagal.length }} foto gagal diproses
        </p>

        <ul class="mt-2 space-y-1 text-sm text-red-700">
          <li v-for="(item, i) in gagal" :key="i">
            <strong>{{ item.label }}</strong> — {{ item.pesan }}
          </li>
        </ul>

        <p class="mt-2 text-xs leading-5 text-red-700">
          Foto yang gagal tetap tampil seperti semula. Coba jalankan
          pemeriksaan sekali lagi.
        </p>
      </div>

      <button
        type="button"
        @click="periksa"
        class="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        <Gauge class="h-4 w-4" />
        Periksa lagi
      </button>
    </div>
  </section>
</template>
