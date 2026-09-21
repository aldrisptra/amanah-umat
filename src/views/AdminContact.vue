<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import {
  CircleAlert,
  CircleCheck,
  ExternalLink,
  Instagram,
  MapPin,
  Youtube,
} from "lucide-vue-next";
import { supabase } from "../lib/supabase";
import AdminPage from "../components/admin/AdminPage.vue";
import AdminCard from "../components/admin/AdminCard.vue";
import AdminField from "../components/admin/AdminField.vue";
import AdminSaveBar from "../components/admin/AdminSaveBar.vue";
import AdminAlert from "../components/admin/AdminAlert.vue";
import { buildSocialUrl, normalizeWhatsapp } from "../lib/utils";
import {
  bacaKoordinat,
  buatEmbedPeta,
  buatTautanPeta,
  bulatkanKoordinat,
  diIndonesia,
  koordinatValid,
  tautanPendek,
} from "../lib/mapLocation";
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
  instagram: "",
  youtube: "",
  // Disimpan sebagai teks di form supaya kolom isian boleh dikosongkan.
  // Diubah menjadi angka hanya saat disimpan ke database.
  latitude: "",
  longitude: "",
});

// Kolom bantu: pengurus menempel tautan Google Maps di sini, lalu
// koordinatnya diisikan otomatis. Tidak ikut disimpan ke database.
const tautanPeta = ref("");
const pesanPeta = ref("");
const pesanPetaJenis = ref("info");

// Salinan nilai awal, dipakai untuk mengetahui apakah ada perubahan.
// Harus berupa ref: computed di bawah membacanya, dan Vue hanya melacak
// perubahan pada nilai reaktif.
const nilaiAwal = ref(JSON.stringify(form));

const adaPerubahan = computed(() => JSON.stringify(form) !== nilaiAwal.value);

useUnsavedChanges(adaPerubahan);

// Tampilkan hasil konversi nomor supaya pengurus tahu tautan WhatsApp yang
// akan dipakai website. wa.me menolak format "0812...".
const whatsappPreview = computed(() => normalizeWhatsapp(form.whatsapp));

// Tampilkan tautan jadinya, supaya pengurus bisa memastikan akunnya benar
// sebelum menyimpan - bukan baru ketahuan salah setelah tampil di website.
const instagramPreview = computed(() =>
  buildSocialUrl("instagram", form.instagram),
);

const youtubePreview = computed(() => buildSocialUrl("youtube", form.youtube));

const resetForm = () => {
  form.address = "";
  form.phone = "";
  form.whatsapp = "";
  form.email = "";
  form.instagram = "";
  form.youtube = "";
  form.latitude = "";
  form.longitude = "";
};

/* =========================================================
   LOKASI PETA
========================================================= */

const koordinat = computed(() => {
  const lat = Number.parseFloat(form.latitude);
  const lng = Number.parseFloat(form.longitude);

  return koordinatValid(lat, lng) ? { lat, lng } : null;
});

const embedPeta = computed(() =>
  koordinat.value ? buatEmbedPeta(koordinat.value.lat, koordinat.value.lng) : "",
);

const tautanBukaPeta = computed(() =>
  koordinat.value
    ? buatTautanPeta(koordinat.value.lat, koordinat.value.lng)
    : "",
);

// Peringatan halus bila koordinat jatuh di luar Indonesia. Penyebab
// tersering: lintang dan bujur tertukar posisinya.
const lokasiDiLuarIndonesia = computed(
  () =>
    Boolean(koordinat.value) &&
    !diIndonesia(koordinat.value.lat, koordinat.value.lng),
);

const terapkanTautan = () => {
  const isi = tautanPeta.value.trim();

  if (!isi) {
    pesanPetaJenis.value = "error";
    pesanPeta.value = "Tempel dulu tautan Google Maps-nya.";
    return;
  }

  const hasil = bacaKoordinat(isi);

  if (hasil) {
    form.latitude = String(bulatkanKoordinat(hasil.lat));
    form.longitude = String(bulatkanKoordinat(hasil.lng));

    pesanPetaJenis.value = "sukses";
    pesanPeta.value =
      "Titik lokasi berhasil dibaca. Periksa petanya di bawah, lalu tekan Simpan.";

    tautanPeta.value = "";
    return;
  }

  pesanPetaJenis.value = "error";

  // Tautan pendek tidak bisa dibuka dari browser karena aturan keamanan
  // lintas-domain. Beri jalan keluar yang konkret, bukan sekadar "gagal".
  pesanPeta.value = tautanPendek(isi)
    ? "Tautan ini masih berbentuk pendek. Buka dulu tautannya di browser sampai peta muncul, lalu salin alamat lengkap dari kolom alamat browser dan tempel di sini."
    : "Tautan tidak dikenali. Pastikan yang ditempel adalah tautan Google Maps yang memuat titik lokasi.";
};

const hapusLokasi = () => {
  form.latitude = "";
  form.longitude = "";
  tautanPeta.value = "";
  pesanPeta.value = "";
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
      form.instagram = record.instagram || "";
      form.youtube = record.youtube || "";
      form.latitude =
        record.latitude === null || record.latitude === undefined
          ? ""
          : String(record.latitude);
      form.longitude =
        record.longitude === null || record.longitude === undefined
          ? ""
          : String(record.longitude);
    } else {
      resetForm();
    }

    pesanPeta.value = "";
    tautanPeta.value = "";

    nilaiAwal.value = JSON.stringify(form);
  } catch (error) {
    console.error("Gagal mengambil data kontak:", error);
    errorMessage.value = error.message || "Gagal mengambil data kontak.";
  } finally {
    loading.value = false;
  }
};

// Supabase menolak kolom yang belum ada dengan kode PGRST204. Pesannya
// diperiksa juga karena kode galat bisa berbeda antar versi PostgREST.
const kolomSosialBelumAda = (error) =>
  error?.code === "PGRST204" ||
  /instagram|youtube/i.test(error?.message || "");

const saveContact = async () => {
  if (saving.value) return;

  if (form.whatsapp.trim() && !normalizeWhatsapp(form.whatsapp)) {
    errorMessage.value =
      "Nomor WhatsApp tidak valid. Gunakan format 08xxxxxxxxxx atau 628xxxxxxxxxx.";
    return;
  }

  // Titik lokasi boleh dikosongkan, tetapi bila diisi harus lengkap dan sah -
  // separuh koordinat membuat peta menunjuk tempat yang keliru.
  const adaIsianLokasi = Boolean(
    form.latitude.trim() || form.longitude.trim(),
  );

  if (adaIsianLokasi && !koordinat.value) {
    errorMessage.value =
      "Titik lokasi belum benar. Tempel tautan Google Maps pada kolom di atas, atau kosongkan kedua isian koordinat.";
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
      instagram: form.instagram.trim(),
      youtube: form.youtube.trim(),
      latitude: koordinat.value ? koordinat.value.lat : null,
      longitude: koordinat.value ? koordinat.value.lng : null,
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

    // Kolom media sosial ditambahkan menyusul lewat berkas SQL. Selama
    // berkas itu belum dijalankan, sisa data kontak tetap harus bisa
    // disimpan - jadi ulangi tanpa kedua kolom tersebut, lalu beri tahu
    // pengurus mengapa bagian itu belum tersimpan.
    if (result.error && kolomSosialBelumAda(result.error)) {
      const { instagram, youtube, ...tanpaSosial } = payload;

      const ulang = contact.value?.id
        ? await supabase
            .from("contact")
            .update(tanpaSosial)
            .eq("id", contact.value.id)
            .select()
        : await supabase.from("contact").insert(tanpaSosial).select();

      if (ulang.error) {
        throw ulang.error;
      }

      await getContact();

      errorMessage.value =
        "Alamat dan nomor kontak tersimpan, tetapi Instagram dan YouTube belum. " +
        "Tempat penyimpanannya belum dibuat di database - minta pengelola teknis " +
        "menjalankan berkas supabase/social_media.sql pada SQL Editor di Supabase. " +
        "Cukup sekali saja.";

      return;
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

        <AdminCard
          step="3"
          title="Media sosial"
          description="Tautan akun resmi yayasan. Tampil sebagai tombol di halaman Kontak dan di bagian bawah setiap halaman. Boleh dikosongkan bila belum punya."
        >
          <div class="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p class="text-sm leading-6 text-emerald-900">
              Cukup tulis nama akunnya saja, misalnya
              <strong class="font-semibold">amanahummat</strong>. Boleh juga
              memakai tanda @ atau menempel tautan lengkapnya — website akan
              merapikannya sendiri.
            </p>
          </div>

          <AdminField
            v-slot="{ id }"
            label="Instagram"
            hint="Nama akun Instagram yayasan."
            :value="form.instagram"
          >
            <input
              :id="id"
              v-model="form.instagram"
              type="text"
              placeholder="amanahummat"
              class="admin-input"
            />

            <p
              v-if="instagramPreview"
              class="mt-2 flex items-center gap-1.5 text-xs text-emerald-700"
            >
              <Instagram class="h-3.5 w-3.5 shrink-0" />

              <a
                :href="instagramPreview"
                target="_blank"
                rel="noopener"
                class="underline underline-offset-2"
              >
                {{ instagramPreview }}
              </a>
            </p>
          </AdminField>

          <AdminField
            v-slot="{ id }"
            label="YouTube"
            hint="Nama kanal YouTube yayasan. Bila kanalnya belum punya nama khusus, tempel saja tautan kanalnya."
            :value="form.youtube"
          >
            <input
              :id="id"
              v-model="form.youtube"
              type="text"
              placeholder="amanahummat"
              class="admin-input"
            />

            <p
              v-if="youtubePreview"
              class="mt-2 flex items-center gap-1.5 text-xs text-emerald-700"
            >
              <Youtube class="h-3.5 w-3.5 shrink-0" />

              <a
                :href="youtubePreview"
                target="_blank"
                rel="noopener"
                class="underline underline-offset-2"
              >
                {{ youtubePreview }}
              </a>
            </p>
          </AdminField>
        </AdminCard>

        <AdminCard
          step="4"
          title="Lokasi di peta"
          description="Titik yang ditampilkan pada peta di halaman Kontak, supaya calon donatur dan tamu dapat menemukan alamat yayasan."
        >
          <!-- Cara termudah: tempel tautan Google Maps -->
          <div class="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
            <p class="text-sm font-semibold text-emerald-900">
              Cara mengisi
            </p>

            <ol
              class="mt-2 list-inside list-decimal space-y-1 text-sm leading-6 text-emerald-800"
            >
              <li>Buka Google Maps, cari lokasi yayasan.</li>
              <li>Salin tautan dari kolom alamat browser.</li>
              <li>Tempel di bawah ini, lalu tekan Baca Lokasi.</li>
            </ol>

            <div class="mt-4 flex flex-col gap-2 sm:flex-row">
              <input
                v-model="tautanPeta"
                type="text"
                placeholder="Tempel tautan Google Maps di sini"
                class="admin-input flex-1"
                @keydown.enter.prevent="terapkanTautan"
              />

              <button
                type="button"
                @click="terapkanTautan"
                class="shrink-0 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Baca Lokasi
              </button>
            </div>

            <p
              v-if="pesanPeta"
              class="mt-3 flex items-start gap-1.5 text-xs leading-5"
              :class="
                pesanPetaJenis === 'sukses' ? 'text-emerald-700' : 'text-red-600'
              "
            >
              <component
                :is="pesanPetaJenis === 'sukses' ? CircleCheck : CircleAlert"
                class="mt-0.5 h-3.5 w-3.5 shrink-0"
              />
              {{ pesanPeta }}
            </p>
          </div>

          <!-- Koordinat, untuk yang ingin mengisi manual -->
          <div class="grid gap-5 sm:grid-cols-2">
            <AdminField
              v-slot="{ id }"
              label="Lintang (latitude)"
              hint="Terisi otomatis dari tautan di atas."
              :value="form.latitude"
            >
              <input
                :id="id"
                v-model="form.latitude"
                type="text"
                inputmode="decimal"
                placeholder="-1.235027"
                class="admin-input"
              />
            </AdminField>

            <AdminField
              v-slot="{ id }"
              label="Bujur (longitude)"
              hint="Terisi otomatis dari tautan di atas."
              :value="form.longitude"
            >
              <input
                :id="id"
                v-model="form.longitude"
                type="text"
                inputmode="decimal"
                placeholder="116.818451"
                class="admin-input"
              />
            </AdminField>
          </div>

          <!-- Peringatan koordinat tertukar -->
          <div
            v-if="lokasiDiLuarIndonesia"
            class="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3"
          >
            <CircleAlert class="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />

            <p class="text-sm leading-6 text-amber-800">
              Titik ini berada di luar Indonesia. Biasanya karena lintang dan
              bujur tertukar posisinya. Periksa petanya di bawah sebelum
              menyimpan.
            </p>
          </div>

          <!-- Pratinjau peta -->
          <div>
            <div class="mb-2 flex flex-wrap items-center justify-between gap-2">
              <p class="text-sm font-semibold text-gray-800">
                Pratinjau peta
              </p>

              <div class="flex items-center gap-3">
                <a
                  v-if="tautanBukaPeta"
                  :href="tautanBukaPeta"
                  target="_blank"
                  rel="noopener"
                  class="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 transition hover:text-emerald-800"
                >
                  <ExternalLink class="h-3.5 w-3.5" />
                  Buka di Google Maps
                </a>

                <button
                  v-if="koordinat"
                  type="button"
                  @click="hapusLokasi"
                  class="text-xs font-semibold text-gray-500 transition hover:text-red-600"
                >
                  Hapus titik
                </button>
              </div>
            </div>

            <div
              class="overflow-hidden rounded-2xl border border-gray-200 bg-gray-50"
            >
              <iframe
                v-if="embedPeta"
                :src="embedPeta"
                title="Pratinjau lokasi yayasan"
                class="h-72 w-full border-0"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>

              <div
                v-else
                class="flex h-72 flex-col items-center justify-center gap-2 text-gray-400"
              >
                <MapPin class="h-8 w-8" />

                <p class="text-sm">Titik lokasi belum diatur</p>

                <p class="max-w-xs text-center text-xs">
                  Halaman Kontak akan menampilkan peta lokasi bawaan sampai
                  titik ini diisi.
                </p>
              </div>
            </div>
          </div>
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
