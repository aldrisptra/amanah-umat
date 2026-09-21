<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  LoaderCircle,
  Lock,
} from "lucide-vue-next";
import { supabase } from "../lib/supabase";
import { useSiteIdentity } from "../lib/siteIdentity";
import { resetPercobaan } from "../lib/loginThrottle";

/**
 * Halaman membuat password baru.
 *
 * Dibuka lewat tautan yang dikirim ke email pengurus. Tautan itu membawa
 * sesi pemulihan sementara dari Supabase - cukup untuk mengganti password,
 * tidak untuk hal lain.
 *
 * Halaman ini sengaja TIDAK berada di balik penjaga login: yang membukanya
 * memang sedang tidak bisa masuk. Keamanannya bersandar pada tautan email
 * yang hanya berlaku satu jam dan sekali pakai.
 */

const router = useRouter();
const { identitas, inisial } = useSiteIdentity();

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
   SESI PEMULIHAN

   Supabase membaca tautan dari email lalu membuat sesi sementara. Prosesnya
   tidak selesai seketika, jadi halaman menunggu sebentar sebelum memutuskan
   tautannya sah atau tidak - bukan langsung menuduh "tautan kedaluwarsa".
========================================================= */

const memeriksa = ref(true);
const sesiSiap = ref(false);
const pesanTautan = ref("");

let hentikanPantauan = null;
let batasWaktu = null;

const tandaiTautanBermasalah = () => {
  memeriksa.value = false;
  sesiSiap.value = false;

  // Alamat bisa membawa keterangan galat dari Supabase, mis. tautan kedaluwarsa
  const keterangan = new URLSearchParams(
    window.location.hash.replace(/^#/, ""),
  ).get("error_description");

  pesanTautan.value =
    keterangan ||
    "Tautan tidak berlaku lagi. Tautan atur ulang password hanya berlaku satu jam dan sekali pakai.";
};

onMounted(async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) {
    memeriksa.value = false;
    sesiSiap.value = true;
    return;
  }

  // Belum ada sesi: mungkin tautannya masih sedang diproses
  const { data } = supabase.auth.onAuthStateChange((_peristiwa, sesiBaru) => {
    if (!sesiBaru) return;

    memeriksa.value = false;
    sesiSiap.value = true;

    if (batasWaktu) clearTimeout(batasWaktu);
  });

  hentikanPantauan = data?.subscription;

  batasWaktu = setTimeout(() => {
    if (!sesiSiap.value) tandaiTautanBermasalah();
  }, 4000);
});

onBeforeUnmount(() => {
  hentikanPantauan?.unsubscribe?.();

  if (batasWaktu) clearTimeout(batasWaktu);
});

/* =========================================================
   PASSWORD BARU
========================================================= */

const PANJANG_MINIMAL = 8;

const password = ref("");
const ulangi = ref("");
const showPassword = ref(false);
const menyimpan = ref(false);
const errorMessage = ref("");
const berhasil = ref(false);
const capsLockAktif = ref(false);

const cekCapsLock = (event) => {
  capsLockAktif.value = Boolean(event.getModifierState?.("CapsLock"));
};

/* Penilaian kekuatan password.
   Bukan penghalang - password pendek tetap ditolak lewat aturan di bawah -
   melainkan penunjuk agar pengurus tahu mana yang sudah cukup kuat. */
const kekuatan = computed(() => {
  const isi = password.value;

  if (!isi) return { nilai: 0, label: "", warna: "" };

  let nilai = 0;

  if (isi.length >= PANJANG_MINIMAL) nilai += 1;
  if (isi.length >= 12) nilai += 1;
  if (/[a-z]/.test(isi) && /[A-Z]/.test(isi)) nilai += 1;
  if (/\d/.test(isi)) nilai += 1;
  if (/[^A-Za-z0-9]/.test(isi)) nilai += 1;

  if (nilai <= 2) return { nilai, label: "Lemah", warna: "bg-red-500" };
  if (nilai === 3) return { nilai, label: "Cukup", warna: "bg-amber-500" };
  if (nilai === 4) return { nilai, label: "Kuat", warna: "bg-emerald-500" };

  return { nilai, label: "Sangat kuat", warna: "bg-emerald-600" };
});

const simpanPassword = async () => {
  if (menyimpan.value) return;

  errorMessage.value = "";

  if (password.value.length < PANJANG_MINIMAL) {
    errorMessage.value = `Password baru minimal ${PANJANG_MINIMAL} karakter.`;
    return;
  }

  if (password.value !== ulangi.value) {
    errorMessage.value =
      "Kedua isian password belum sama. Periksa kembali ketikannya.";
    return;
  }

  menyimpan.value = true;

  try {
    const { error } = await supabase.auth.updateUser({
      password: password.value,
    });

    if (error) {
      console.error("Gagal mengganti password:", error);

      errorMessage.value =
        error.message ||
        "Password gagal diganti. Coba minta tautan baru dari halaman masuk.";

      return;
    }

    berhasil.value = true;

    // Hitungan percobaan login dibersihkan: pemiliknya sudah terbukti
    // memegang email yang terdaftar.
    resetPercobaan();

    // Sesi pemulihan tidak dipakai untuk masuk ke panel. Pengurus diminta
    // masuk ulang memakai password barunya, supaya yakin password itu benar
    // dan tersimpan di pengelola kata sandinya.
    await supabase.auth.signOut();

    setTimeout(() => router.replace("/admin/login"), 2500);
  } catch (error) {
    console.error("Gagal mengganti password:", error);

    errorMessage.value =
      "Tidak dapat terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.";
  } finally {
    menyimpan.value = false;
  }
};
</script>

<template>
  <div
    class="flex min-h-screen items-center justify-center bg-gray-100 px-5 py-12"
  >
    <div class="w-full max-w-md">
      <!-- Identitas -->
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

        <h1 class="mt-5 text-2xl font-bold text-gray-900">Password Baru</h1>

        <p class="mt-2 text-sm leading-6 text-gray-600">
          Buat password baru untuk panel pengelola {{ identitas.site_name }}.
        </p>
      </div>

      <div
        class="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <!-- Sedang memeriksa tautan -->
        <div v-if="memeriksa" class="py-8 text-center">
          <LoaderCircle
            class="mx-auto h-6 w-6 animate-spin text-emerald-600"
          />

          <p class="mt-4 text-sm text-gray-600">Memeriksa tautan...</p>
        </div>

        <!-- Sudah berhasil -->
        <div v-else-if="berhasil" class="py-4 text-center">
          <div
            class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100"
          >
            <CircleCheck class="h-7 w-7 text-emerald-600" />
          </div>

          <h2 class="mt-5 text-lg font-bold text-gray-900">
            Password berhasil diganti
          </h2>

          <p class="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-600">
            Silakan masuk kembali memakai password baru Anda. Halaman masuk
            akan terbuka sebentar lagi.
          </p>

          <router-link
            to="/admin/login"
            class="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Masuk sekarang
          </router-link>
        </div>

        <!-- Tautan bermasalah -->
        <div v-else-if="!sesiSiap" class="py-4 text-center">
          <div
            class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100"
          >
            <CircleAlert class="h-7 w-7 text-red-600" />
          </div>

          <h2 class="mt-5 text-lg font-bold text-gray-900">
            Tautan tidak berlaku
          </h2>

          <p class="mx-auto mt-2 max-w-xs text-sm leading-6 text-gray-600">
            {{ pesanTautan }}
          </p>

          <router-link
            to="/admin/login"
            class="mt-6 inline-flex rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Minta tautan baru
          </router-link>
        </div>

        <!-- Form password baru -->
        <form v-else class="space-y-5" @submit.prevent="simpanPassword">
          <div>
            <label for="password-baru" class="text-sm font-semibold text-gray-800">
              Password baru
            </label>

            <div class="relative mt-2">
              <Lock
                class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              />

              <input
                id="password-baru"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                :placeholder="`Minimal ${PANJANG_MINIMAL} karakter`"
                required
                class="admin-input pl-11 pr-24"
                @keyup="cekCapsLock"
                @keydown="cekCapsLock"
              />

              <button
                type="button"
                :aria-pressed="showPassword"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 px-4 text-xs font-semibold text-gray-500 transition hover:text-emerald-600"
              >
                {{ showPassword ? "Sembunyikan" : "Lihat" }}
              </button>
            </div>

            <!-- Penunjuk kekuatan -->
            <div v-if="password" class="mt-3">
              <div class="flex gap-1.5">
                <span
                  v-for="n in 5"
                  :key="n"
                  class="h-1.5 flex-1 rounded-full transition-colors"
                  :class="n <= kekuatan.nilai ? kekuatan.warna : 'bg-gray-200'"
                ></span>
              </div>

              <p class="mt-1.5 text-xs text-gray-500">
                Kekuatan password:
                <strong class="font-semibold text-gray-700">
                  {{ kekuatan.label }}
                </strong>
              </p>
            </div>

            <p
              v-if="capsLockAktif"
              class="mt-2 flex items-center gap-1.5 text-xs font-medium text-amber-700"
            >
              <CircleAlert class="h-3.5 w-3.5 shrink-0" />
              Caps Lock sedang menyala.
            </p>
          </div>

          <div>
            <label for="password-ulang" class="text-sm font-semibold text-gray-800">
              Ulangi password baru
            </label>

            <div class="relative mt-2">
              <Lock
                class="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
              />

              <input
                id="password-ulang"
                v-model="ulangi"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                placeholder="Ketik ulang password baru"
                required
                class="admin-input pl-11"
              />
            </div>

            <p
              v-if="ulangi && password !== ulangi"
              class="mt-2 text-xs font-medium text-amber-700"
            >
              Kedua isian belum sama.
            </p>
          </div>

          <div
            class="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs leading-5 text-gray-600"
          >
            Gunakan password yang hanya Anda ketahui, minimal
            {{ PANJANG_MINIMAL }} karakter. Hindari tanggal lahir, nama
            yayasan, atau password yang dipakai di tempat lain.
          </div>

          <div
            v-if="errorMessage"
            role="alert"
            class="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5"
          >
            <CircleAlert class="mt-0.5 h-5 w-5 shrink-0 text-red-600" />

            <p class="text-sm leading-6 text-red-700">{{ errorMessage }}</p>
          </div>

          <button
            type="submit"
            :disabled="menyimpan"
            class="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LoaderCircle v-if="menyimpan" class="h-4 w-4 animate-spin" />
            {{ menyimpan ? "Menyimpan..." : "Simpan password baru" }}
          </button>
        </form>
      </div>

      <div class="mt-6 text-center">
        <router-link
          to="/admin/login"
          class="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-emerald-600"
        >
          <ArrowLeft class="h-4 w-4" />
          Kembali ke halaman masuk
        </router-link>
      </div>
    </div>
  </div>
</template>
