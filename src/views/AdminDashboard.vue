<template>
  <div class="min-h-screen bg-gray-100">
    <header class="bg-emerald-600 px-6 py-4 text-white">
      <div class="mx-auto flex max-w-7xl items-center justify-between">
        <div>
          <h1 class="text-xl font-bold">Admin Amanah Umat</h1>
          <p class="text-sm text-emerald-100">Dashboard Admin</p>
        </div>

        <button
          @click="logout"
          class="rounded-lg bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/20"
        >
          Keluar
        </button>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-6 py-8">
      <h2 class="text-2xl font-bold text-gray-900">Selamat Datang, Admin 👋</h2>

      <p class="mt-2 text-gray-600">
        Dari halaman ini nantinya kamu bisa mengelola konten website.
      </p>

      <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div class="rounded-2xl bg-white p-6 shadow">
          <h3 class="font-semibold text-gray-900">Program</h3>
          <p class="mt-2 text-sm text-gray-500">Kelola program yayasan.</p>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow">
          <h3 class="font-semibold text-gray-900">Galeri</h3>
          <p class="mt-2 text-sm text-gray-500">Kelola foto kegiatan.</p>
        </div>

        <div class="rounded-2xl bg-white p-6 shadow">
          <h3 class="font-semibold text-gray-900">Konten Website</h3>
          <p class="mt-2 text-sm text-gray-500">Kelola konten website.</p>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";

const router = useRouter();

const logout = async () => {
  await supabase.auth.signOut();
  router.push("/admin/login");
};
</script>
