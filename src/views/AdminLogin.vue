<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";

const router = useRouter();

const email = ref("");
const password = ref("");
const loading = ref(false);
const errorMessage = ref("");

const login = async () => {
  loading.value = true;
  errorMessage.value = "";

  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  });

  if (error) {
    console.error("Login gagal:", error);

    errorMessage.value = "Email atau password yang kamu masukkan salah.";

    loading.value = false;
    return;
  }

  loading.value = false;

  router.push("/admin");
};
</script>

<template>
  <div class="min-h-screen bg-emerald-50">
    <div class="flex min-h-screen items-center justify-center px-5 py-12">
      <div class="w-full max-w-md">
        <!-- Header -->
        <div class="mb-8 text-center">
          <div
            class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-600 text-2xl font-bold text-white shadow-lg"
          >
            AU
          </div>

          <h1 class="mt-5 text-3xl font-bold text-gray-900">
            Admin Amanah Ummat
          </h1>

          <p class="mt-2 text-sm text-gray-600">
            Masuk untuk mengelola konten website.
          </p>
        </div>

        <!-- Login Card -->
        <div class="rounded-3xl bg-white p-7 shadow-xl sm:p-8">
          <form @submit.prevent="login">
            <!-- Email -->
            <div>
              <label for="email" class="text-sm font-semibold text-gray-700">
                Email
              </label>

              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="admin@amanahumat.com"
                required
                class="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <!-- Password -->
            <div class="mt-5">
              <label for="password" class="text-sm font-semibold text-gray-700">
                Password
              </label>

              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="Masukkan password"
                required
                class="mt-2 w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            <!-- Error -->
            <div
              v-if="errorMessage"
              class="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {{ errorMessage }}
            </div>

            <!-- Button -->
            <button
              type="submit"
              :disabled="loading"
              class="mt-6 w-full rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ loading ? "Memproses..." : "Masuk sebagai Admin" }}
            </button>
          </form>

          <!-- Back -->
          <div class="mt-6 text-center">
            <router-link
              to="/"
              class="text-sm font-medium text-gray-500 transition hover:text-emerald-600"
            >
              ← Kembali ke website
            </router-link>
          </div>
        </div>

        <p class="mt-6 text-center text-xs text-gray-400">
          LKSA Amanah Ummat Balikpapan
        </p>
      </div>
    </div>
  </div>
</template>
