<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  Info,
  LoaderCircle,
  Lock,
  Mail,
  ShieldAlert,
} from "lucide-vue-next";
import { supabase } from "../lib/supabase";
import { useSiteIdentity } from "../lib/siteIdentity";
import {
  MAKS_PERCOBAAN,
  MENIT_TERKUNCI,
  catatGagal,
  formatSisaWaktu,
  resetPercobaan,
  sisaDetikTerkunci,
  sisaPercobaan,
} from "../lib/loginThrottle";

const router = useRouter();
const route = useRoute();

const { identitas, inisial } = useSiteIdentity();

/* =========================================================
   LOGO

   Tiga lapis, dari yang paling sesuai ke yang paling aman:
   1. Logo yang sudah diunggah lewat menu "Logo & Nama"
   2. Berkas tetap public/logo.png yang disertakan di kode
   3. Kotak hijau berisi huruf awal nama yayasan

   Lapis kedua ada supaya halaman login tetap berlogo walau tabel
   site_settings belum dibuat atau sedang gagal dimuat.
========================================================= */

const LOGO_STATIS = "/logo.png";

const logoCmsGagal = ref(false);
const logoStatisGagal = ref(false);

const sumberLogo = computed(() => {
  if (identitas.value.logo_url && !logoCmsGagal.value) {
    return identitas.value.logo_url;
  }

  return logoStatisGagal.value ? "" : LOGO_STATIS;
});

const tandaiLogoGagal = () => {
  if (identitas.value.logo_url && !logoCmsGagal.value) {
    logoCmsGagal.value = true;
    return;
  }

  logoStatisGagal.value = true;
};

/* =========================================================
   FORM
========================================================= */

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref("");
const infoMessage = ref("");
const capsLockAktif = ref(false);
const percobaanTersisa = ref(MAKS_PERCOBAAN);

const POLA_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const emailValid = computed(() => POLA_EMAIL.test(email.value.trim()));

/* =========================================================
   KUNCIAN SEMENTARA
========================================================= */

const detikTerkunci = ref(0);
let pewaktu = null;

const terkunci = computed(() => detikTerkunci.value > 0);

const sisaWaktuTeks = computed(() => formatSisaWaktu(detikTerkunci.value));

const perbaruiKuncian = () => {
  detikTerkunci.value = sisaDetikTerkunci();

  if (detikTerkunci.value === 0) {
    percobaanTersisa.value = sisaPercobaan();
  }
};

onMounted(() => {
  perbaruiKuncian();
  percobaanTersisa.value = sisaPercobaan();

  // Hitungan mundur berjalan tiap detik agar pengurus tahu persis kapan
  // bisa mencoba lagi, alih-alih menebak-nebak.
  pewaktu = setInterval(perbaruiKuncian, 1000);

  // Alasan mengapa pengguna sampai di halaman ini, dikirim oleh panel admin
  const alasan = route.query.alasan;

  if (alasan === "idle") {
    infoMessage.value =
      "Sesi Anda berakhir otomatis karena panel dibiarkan terbuka tanpa aktivitas. Silakan masuk kembali.";
  } else if (alasan === "keluar") {
    infoMessage.value = "Anda telah keluar dari panel pengelola.";
  }
});

onBeforeUnmount(() => {
  if (pewaktu) clearInterval(pewaktu);
});

/* =========================================================
   MASUK
========================================================= */

const login = async () => {
  if (loading.value || terkunci.value) return;

  errorMessage.value = "";
  infoMessage.value = "";

  if (!emailValid.value) {
    errorMessage.value =
      "Format email belum benar. Contoh penulisan yang benar: nama@contoh.com";
    return;
  }

  if (!password.value) {
    errorMessage.value = "Password belum diisi.";
    return;
  }

  loading.value = true;

  try {
    const { error } = await supabase.auth.signInWithPassword({
      // Alamat email tidak membedakan huruf besar-kecil, tetapi spasi ikut
      // terkirim bila tidak dibersihkan - penyebab gagal login yang paling
      // sering terjadi saat email disalin-tempel.
      email: email.value.trim().toLowerCase(),
      password: password.value,
    });

    if (error) {
      console.error("Login gagal:", error);

      // Masalah jaringan tidak dihitung sebagai percobaan gagal: pengurus
      // tidak boleh terkunci hanya karena internetnya sedang buruk.
      const salahKredensial = error.status === 400 || error.status === 401;

      if (!salahKredensial) {
        errorMessage.value =
          "Tidak dapat terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.";
        return;
      }

      const hasil = catatGagal();

      perbaruiKuncian();
      percobaanTersisa.value = hasil.sisa;

      // Pesannya sengaja tidak menyebut mana yang salah - email atau
      // password. Menyebutkannya sama saja memberi tahu orang luar alamat
      // email mana yang terdaftar sebagai pengelola.
      errorMessage.value = hasil.terkunci
        ? `Terlalu banyak percobaan gagal. Demi keamanan, login dikunci selama ${MENIT_TERKUNCI} menit.`
        : "Email atau password salah. Periksa kembali, perhatikan huruf besar dan kecil.";

      password.value = "";

      return;
    }

    resetPercobaan();

    // Kembali ke halaman yang tadinya hendak dibuka sebelum diminta login.
    // Hanya alamat di dalam /admin yang diterima, supaya tautan login tidak
    // bisa dipakai mengarahkan orang ke situs lain.
    const tujuan = route.query.redirect;

    router.replace(
      typeof tujuan === "string" &&
        tujuan.startsWith("/admin") &&
        !tujuan.startsWith("//")
        ? tujuan
        : "/admin",
    );
  } catch (error) {
    console.error("Login gagal:", error);

    errorMessage.value =
      "Tidak dapat terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.";
  } finally {
    loading.value = false;
  }
};

/* =========================================================
   CAPS LOCK

   Password tidak terlihat saat diketik, jadi Caps Lock yang menyala adalah
   penyebab gagal login yang paling membingungkan.
========================================================= */

const cekCapsLock = (event) => {
  capsLockAktif.value = Boolean(event.getModifierState?.("CapsLock"));
};

/* =========================================================
   LUPA PASSWORD
========================================================= */

const modeLupa = ref(false);
const emailLupa = ref("");
const mengirimReset = ref(false);
const pesanReset = ref("");
const errorReset = ref("");

const bukaLupaPassword = () => {
  modeLupa.value = true;
  emailLupa.value = email.value.trim();
  pesanReset.value = "";
  errorReset.value = "";
};

const tutupLupaPassword = () => {
  if (mengirimReset.value) return;

  modeLupa.value = false;
  pesanReset.value = "";
  errorReset.value = "";
};

const kirimTautanReset = async () => {
  if (mengirimReset.value) return;

  const tujuan = emailLupa.value.trim().toLowerCase();

  if (!POLA_EMAIL.test(tujuan)) {
    errorReset.value = "Tulis alamat email pengelola yang terdaftar.";
    return;
  }

  mengirimReset.value = true;
  errorReset.value = "";

  try {
    const { error } = await supabase.auth.resetPasswordForEmail(tujuan, {
      redirectTo: `${window.location.origin}/admin/atur-ulang-password`,
    });

    if (error) {
      console.error("Gagal mengirim tautan atur ulang:", error);
    }

    // Pesannya sama persis, berhasil maupun tidak. Membedakannya akan
    // membocorkan alamat email mana yang terdaftar sebagai pengelola.
    pesanReset.value =
      "Bila alamat email tersebut terdaftar sebagai pengelola, kami telah mengirim tautan untuk mengatur ulang password. Periksa kotak masuk dan folder spam. Tautannya berlaku satu jam.";
  } catch (error) {
    console.error("Gagal mengirim tautan atur ulang:", error);

    errorReset.value =
      "Tidak dapat terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.";
  } finally {
    mengirimReset.value = false;
  }
};
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-gray-100 px-5 py-12"
  >
    <div class="w-full max-w-md">
      <!-- =====================================================
           IDENTITAS
      ====================================================== -->
      <div class="text-center">
        <div class="mx-auto flex h-20 w-20 items-center justify-center">
          <img
            v-if="sumberLogo"
            :src="sumberLogo"
            :alt="`Logo ${identitas.site_name}`"
            class="h-20 w-20 rounded-2xl bg-white object-contain p-2 shadow-sm ring-1 ring-gray-200"
            @error="tandaiLogoGagal"
          />

          <span
            v-else
            aria-hidden="true"
            class="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-600 text-3xl font-bold text-white shadow-lg shadow-emerald-600/25"
          >
            {{ inisial }}
          </span>
        </div>

        <h1 class="mt-5 text-2xl font-bold text-gray-900">Panel Pengelola</h1>

        <p class="mt-2 text-sm leading-6 text-gray-600">
          {{ identitas.site_name }} — masuk untuk mengubah isi website.
        </p>
      </div>

      <!-- =====================================================
           KOTAK UTAMA
      ====================================================== -->
      <div
        class="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <!-- ---------------------------------------------
             LUPA PASSWORD
        ---------------------------------------------- -->
        <div v-if="modeLupa">
          <h2 class="text-lg font-bold text-gray-900">Lupa password</h2>

          <p class="mt-2 text-sm leading-6 text-gray-600">
            Masukkan email pengelola. Kami akan mengirim tautan untuk membuat
            password baru.
          </p>

          <!-- Berhasil dikirim -->
          <div
            v-if="pesanReset"
            role="status"
            class="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5"
          >
            <CircleCheck class="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />

            <p class="text-sm leading-6 text-emerald-800">{{ pesanReset }}</p>
          </div>

          <form v-else class="mt-5 space-y-5" @submit.prevent="kirimTautanReset">
            <div>
              <label for="email-lupa" class="text-sm font-semibold text-gray-800">
                Email pengelola
              </label>

              <div class="relative mt-2">
                <Mail
                  class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="email-lupa"
                  v-model="emailLupa"
                  type="email"
                  autocomplete="username"
                  inputmode="email"
                  placeholder="nama@contoh.com"
                  required
                  class="admin-input pl-11"
                />
              </div>
            </div>

            <div
              v-if="errorReset"
              role="alert"
              class="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5"
            >
              <CircleAlert class="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <p class="text-sm leading-6 text-red-700">{{ errorReset }}</p>
            </div>

            <button
              type="submit"
              :disabled="mengirimReset"
              class="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LoaderCircle v-if="mengirimReset" class="h-4 w-4 animate-spin" />
              {{ mengirimReset ? "Mengirim..." : "Kirim tautan" }}
            </button>
          </form>

          <button
            type="button"
            @click="tutupLupaPassword"
            :disabled="mengirimReset"
            class="mt-4 flex w-full items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-50"
          >
            <ArrowLeft class="h-4 w-4" />
            Kembali ke halaman masuk
          </button>
        </div>

        <!-- ---------------------------------------------
             MASUK
        ---------------------------------------------- -->
        <template v-else>
          <!-- Keterangan mengapa sampai di halaman ini -->
          <div
            v-if="infoMessage"
            role="status"
            class="mb-5 flex items-start gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3.5"
          >
            <Info class="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />

            <p class="text-sm leading-6 text-sky-800">{{ infoMessage }}</p>
          </div>

          <!-- Sedang terkunci -->
          <div
            v-if="terkunci"
            role="alert"
            class="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-4"
          >
            <ShieldAlert class="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <div class="min-w-0">
              <p class="text-sm font-semibold text-red-800">
                Login dikunci sementara
              </p>

              <p class="mt-1 text-sm leading-6 text-red-700">
                Terlalu banyak percobaan gagal. Coba lagi dalam
                <strong class="font-semibold tabular-nums">
                  {{ sisaWaktuTeks }}</strong
                >. Bila lupa password, gunakan tautan
                <em>Lupa password</em> di bawah.
              </p>
            </div>
          </div>

          <form class="space-y-5" @submit.prevent="login">
            <!-- Email -->
            <div>
              <label for="email" class="text-sm font-semibold text-gray-800">
                Email
              </label>

              <div class="relative mt-2">
                <Mail
                  class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="email"
                  v-model="email"
                  type="email"
                  autocomplete="username"
                  inputmode="email"
                  spellcheck="false"
                  placeholder="nama@contoh.com"
                  required
                  :disabled="terkunci"
                  class="admin-input pl-11"
                />
              </div>
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="text-sm font-semibold text-gray-800">
                Password
              </label>

              <div class="relative mt-2">
                <Lock
                  class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
                />

                <input
                  id="password"
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  autocomplete="current-password"
                  placeholder="Masukkan password"
                  required
                  :disabled="terkunci"
                  class="admin-input pl-11 pr-24"
                  @keyup="cekCapsLock"
                  @keydown="cekCapsLock"
                />

                <button
                  type="button"
                  :disabled="terkunci"
                  :aria-pressed="showPassword"
                  @click="showPassword = !showPassword"
                  class="absolute inset-y-0 right-0 px-4 text-xs font-semibold text-gray-500 transition hover:text-emerald-600 disabled:opacity-50"
                >
                  {{ showPassword ? "Sembunyikan" : "Lihat" }}
                </button>
              </div>

              <!-- Caps Lock -->
              <p
                v-if="capsLockAktif"
                class="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700"
              >
                <CircleAlert class="h-3.5 w-3.5 shrink-0" />
                Caps Lock sedang menyala — password membedakan huruf besar dan
                kecil.
              </p>
            </div>

            <!-- Pesan gagal -->
            <div
              v-if="errorMessage"
              role="alert"
              class="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5"
            >
              <CircleAlert class="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

              <p class="text-sm leading-6 text-red-700">{{ errorMessage }}</p>
            </div>

            <!-- Peringatan mendekati kuncian -->
            <p
              v-if="!terkunci && percobaanTersisa < MAKS_PERCOBAAN"
              class="text-xs leading-5 text-amber-700"
            >
              Tersisa {{ percobaanTersisa }} percobaan sebelum login dikunci
              selama {{ MENIT_TERKUNCI }} menit.
            </p>

            <button
              type="submit"
              :disabled="loading || terkunci"
              class="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin" />
              {{ loading ? "Memeriksa..." : "Masuk" }}
            </button>
          </form>

          <button
            type="button"
            @click="bukaLupaPassword"
            class="mt-5 block w-full text-center text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
          >
            Lupa password?
          </button>
        </template>
      </div>

      <div class="mt-6 text-center">
        <router-link
          to="/"
          class="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-emerald-600"
        >
          <ArrowLeft class="h-4 w-4" />
          Kembali ke website
        </router-link>
      </div>

      <p class="mt-8 text-center text-xs leading-5 text-gray-400">
        Halaman ini khusus pengurus {{ identitas.site_name }}.<br />
        Jangan bagikan email dan password kepada siapa pun.
      </p>
    </div>
  </div>
</template>
