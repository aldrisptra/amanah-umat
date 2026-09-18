<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ArrowLeft, CircleAlert, LoaderCircle } from "lucide-vue-next";
import { supabase } from "../lib/supabase";

const router = useRouter();
const route = useRoute();

const email = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref("");

const login = async () => {
  if (loading.value) return;

  loading.value = true;
  errorMessage.value = "";

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value,
    });

    if (error) {
      console.error("Login gagal:", error);

      // Bedakan masalah jaringan dari kredensial salah, supaya pengurus tidak
      // mengira passwordnya keliru padahal internetnya yang bermasalah.
      errorMessage.value =
        error.status === 400 || error.status === 401
          ? "Email atau password yang Anda masukkan salah. Periksa kembali, perhatikan huruf besar dan kecil."
          : "Tidak dapat terhubung ke server. Periksa koneksi internet Anda, lalu coba lagi.";

      return;
    }

    // Kembali ke halaman yang tadinya hendak dibuka sebelum diminta login.
    const tujuan = route.query.redirect;

    router.replace(
      typeof tujuan === "string" && tujuan.startsWith("/admin")
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
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gray-100 px-5 py-12">
    <div class="w-full max-w-md">
      <!-- Identitas -->
      <div class="text-center">
        <div
          class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-bold text-white shadow-lg shadow-emerald-600/25"
        >
          AU
        </div>

        <h1 class="mt-5 text-2xl font-bold text-gray-900">Panel Pengelola</h1>

        <p class="mt-2 text-sm leading-6 text-gray-600">
          Masuk untuk mengubah isi website LKSA Amanah Ummat.
        </p>
      </div>

      <!-- Form -->
      <div class="mt-8 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
        <form @submit.prevent="login" class="space-y-5">
          <div>
            <label for="email" class="text-sm font-semibold text-gray-800">
              Email
            </label>

            <input
              id="email"
              v-model="email"
              type="email"
              autocomplete="username"
              placeholder="admin@amanahummat.com"
              required
              class="admin-input mt-2"
            />
          </div>

          <div>
            <label for="password" class="text-sm font-semibold text-gray-800">
              Password
            </label>

            <div class="relative mt-2">
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="current-password"
                placeholder="Masukkan password"
                required
                class="admin-input pr-24"
              />

              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 px-4 text-xs font-semibold text-gray-500 transition hover:text-emerald-600"
              >
                {{ showPassword ? "Sembunyikan" : "Lihat" }}
              </button>
            </div>

            <p class="mt-2 text-xs text-gray-500">
              Gunakan tombol "Lihat" untuk memastikan password yang diketik
              sudah benar.
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

          <button
            type="submit"
            :disabled="loading"
            class="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LoaderCircle v-if="loading" class="h-4 w-4 animate-spin" />
            {{ loading ? "Memeriksa..." : "Masuk" }}
          </button>
        </form>
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

      <p class="mt-8 text-center text-xs text-gray-400">
        LKSA Amanah Ummat Balikpapan
      </p>
    </div>
  </div>
</template>
