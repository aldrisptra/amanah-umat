<script setup>
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { supabase } from "../lib/supabase";

const router = useRouter();

const checkSession = async () => {
  const { data } = await supabase.auth.getSession();

  if (!data.session) {
    router.replace("/admin/login");
  }
};

const logout = async () => {
  await supabase.auth.signOut();

  router.replace("/admin/login");
};

onMounted(() => {
  checkSession();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- HEADER -->
    <header class="border-b border-gray-200 bg-white">
      <div
        class="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8"
      >
        <div>
          <h1 class="text-xl font-bold text-gray-900">Admin Amanah Umat</h1>

          <p class="text-sm text-gray-500">Dashboard pengelolaan website</p>
        </div>

        <button
          @click="logout"
          class="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          Keluar
        </button>
      </div>
    </header>

    <!-- CONTENT -->
    <main class="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <!-- Welcome -->
      <div
        class="rounded-3xl bg-emerald-700 px-6 py-10 text-white shadow-lg sm:px-10"
      >
        <p class="text-sm font-medium text-emerald-100">
          Selamat datang, Admin
        </p>

        <h2 class="mt-2 text-3xl font-bold sm:text-4xl">
          Kelola Website Amanah Umat
        </h2>

        <p class="mt-4 max-w-2xl leading-7 text-emerald-100">
          Gunakan dashboard ini untuk mengelola informasi yang tampil pada
          website Panti Asuhan Amanah Umat.
        </p>
      </div>

      <!-- MENU -->
      <div class="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <!-- PROGRAM -->
        <router-link
          to="/admin/program"
          class="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-xl"
          >
            📚
          </div>

          <h3 class="mt-5 text-xl font-bold text-gray-900">Program</h3>

          <p class="mt-2 text-sm leading-6 text-gray-500">
            Tambah, ubah, dan hapus program yang ditampilkan pada website.
          </p>

          <span
            class="mt-5 inline-flex text-sm font-semibold text-emerald-600 transition group-hover:text-emerald-700"
          >
            Kelola Program →
          </span>
        </router-link>

        <!-- GALLERY -->
        <router-link
          to="/admin/gallery"
          class="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl"
          >
            🖼️
          </div>

          <h3 class="mt-5 text-xl font-bold text-gray-900">Galeri</h3>

          <p class="mt-2 text-sm leading-6 text-gray-500">
            Kelola foto kegiatan dan momen anak-anak Amanah Umat.
          </p>

          <span
            class="mt-5 inline-flex text-sm font-semibold text-emerald-600 transition group-hover:text-emerald-700"
          >
            Kelola Galeri →
          </span>
        </router-link>

        <!-- ABOUT -->
        <router-link
          to="/admin/about"
          class="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-xl"
          >
            ℹ️
          </div>

          <h3 class="mt-5 text-xl font-bold text-gray-900">Tentang Kami</h3>

          <p class="mt-2 text-sm leading-6 text-gray-500">
            Kelola informasi dan foto tentang Panti Asuhan Amanah Umat.
          </p>

          <span
            class="mt-5 inline-flex text-sm font-semibold text-emerald-600 transition group-hover:text-emerald-700"
          >
            Kelola Tentang Kami →
          </span>
        </router-link>

        <!-- DONATION -->
        <router-link
          to="/admin/donation"
          class="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-xl"
          >
            💰
          </div>

          <h3 class="mt-5 text-xl font-bold text-gray-900">Donasi</h3>

          <p class="mt-2 text-sm leading-6 text-gray-500">
            Kelola rekening, QRIS, dan informasi donasi.
          </p>

          <span
            class="mt-5 inline-flex text-sm font-semibold text-emerald-600 transition group-hover:text-emerald-700"
          >
            Kelola Donasi →
          </span>
        </router-link>

        <!-- CONTACT -->
        <router-link
          to="/admin/contact"
          class="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-xl"
          >
            📞
          </div>

          <h3 class="mt-5 text-xl font-bold text-gray-900">Kontak</h3>

          <p class="mt-2 text-sm leading-6 text-gray-500">
            Kelola alamat, nomor WhatsApp, email, dan informasi kontak.
          </p>

          <span
            class="mt-5 inline-flex text-sm font-semibold text-emerald-600 transition group-hover:text-emerald-700"
          >
            Kelola Kontak →
          </span>
        </router-link>

        <!-- WEBSITE -->
        <router-link
          to="/"
          class="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-xl"
          >
            🌐
          </div>

          <h3 class="mt-5 text-xl font-bold text-gray-900">Lihat Website</h3>

          <p class="mt-2 text-sm leading-6 text-gray-500">
            Kembali melihat tampilan website sebagai pengunjung.
          </p>

          <span
            class="mt-5 inline-flex text-sm font-semibold text-emerald-600 transition group-hover:text-emerald-700"
          >
            Buka Website →
          </span>
        </router-link>
      </div>
    </main>
  </div>
</template>
