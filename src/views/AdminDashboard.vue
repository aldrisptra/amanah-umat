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
          <p
            class="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600"
          >
            Admin Panel
          </p>

          <h1 class="mt-1 text-xl font-bold text-gray-900">Amanah Ummat</h1>
        </div>

        <button
          @click="logout"
          class="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          Keluar
        </button>
      </div>
    </header>

    <!-- MAIN -->
    <main class="mx-auto max-w-7xl px-5 py-10 lg:px-8">
      <!-- WELCOME -->
      <section
        class="rounded-3xl bg-gradient-to-r from-emerald-700 to-emerald-600 px-6 py-10 text-white shadow-lg sm:px-10"
      >
        <p class="text-sm font-medium text-emerald-100">
          Selamat datang, Admin
        </p>

        <h2 class="mt-2 text-3xl font-bold sm:text-4xl">
          Kelola konten website Amanah Ummat
        </h2>

        <p
          class="mt-4 max-w-2xl text-sm leading-7 text-emerald-50 sm:text-base"
        >
          Gunakan dashboard ini untuk mengelola program, galeri, dan tampilan
          utama website secara cepat dan rapi.
        </p>
      </section>

      <!-- MENU -->
      <section class="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        <!-- BERANDA -->
        <router-link
          to="/admin/home"
          class="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-xl"
          >
            🏠
          </div>

          <h3 class="mt-5 text-xl font-bold text-gray-900">Beranda</h3>

          <p class="mt-2 text-sm leading-6 text-gray-500">
            Kelola judul, deskripsi, foto background, dan bagian ajakan donasi
            pada halaman beranda.
          </p>

          <span class="mt-5 inline-flex text-sm font-semibold text-emerald-600">
            Kelola Beranda →
          </span>
        </router-link>

        <!-- PROGRAM -->
        <router-link
          to="/admin/program"
          class="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-xl"
          >
            📚
          </div>

          <h3 class="mt-5 text-xl font-bold text-gray-900">Program</h3>

          <p class="mt-2 text-sm leading-6 text-gray-500">
            Tambah, ubah, dan hapus program yang tampil di website.
          </p>

          <span class="mt-5 inline-flex text-sm font-semibold text-emerald-600">
            Kelola Program →
          </span>
        </router-link>

        <!-- GALERI -->
        <router-link
          to="/admin/gallery"
          class="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-xl"
          >
            🖼️
          </div>

          <h3 class="mt-5 text-xl font-bold text-gray-900">Galeri</h3>

          <p class="mt-2 text-sm leading-6 text-gray-500">
            Kelola foto kegiatan dan momen penting organisasi.
          </p>

          <span class="mt-5 inline-flex text-sm font-semibold text-emerald-600">
            Kelola Galeri →
          </span>
        </router-link>

        <!-- KONTAK -->
        <router-link
          to="/admin/contact"
          class="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-100 text-xl"
          >
            📞
          </div>

          <h3 class="mt-5 text-xl font-bold text-gray-900">Kontak</h3>

          <p class="mt-2 text-sm leading-6 text-gray-500">
            Ubah alamat, nomor telepon, email, dan lokasi kontak website.
          </p>

          <span class="mt-5 inline-flex text-sm font-semibold text-emerald-600">
            Kelola Kontak →
          </span>
        </router-link>

        <!-- DONASI -->
        <router-link
          to="/admin/donation"
          class="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-xl"
          >
            💰
          </div>

          <h3 class="mt-5 text-xl font-bold text-gray-900">Donasi</h3>

          <p class="mt-2 text-sm leading-6 text-gray-500">
            Kelola rekening donasi, QRIS, dan kontak konfirmasi donasi.
          </p>

          <span class="mt-5 inline-flex text-sm font-semibold text-emerald-600">
            Kelola Donasi →
          </span>
        </router-link>

        <!-- TENTANG -->
        <router-link
          to="/admin/about"
          class="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-xl"
          >
            🏠
          </div>

          <h3 class="mt-5 text-xl font-bold text-gray-900">Tentang</h3>

          <p class="mt-2 text-sm leading-6 text-gray-500">
            Kelola judul, deskripsi, dan foto utama halaman Tentang Kami.
          </p>

          <span class="mt-5 inline-flex text-sm font-semibold text-emerald-600">
            Kelola Tentang →
          </span>
        </router-link>

        <!-- LIHAT WEBSITE -->
        <router-link
          to="/"
          class="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg"
        >
          <div
            class="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-xl"
          >
            🌐
          </div>

          <h3 class="mt-5 text-xl font-bold text-gray-900">Lihat Website</h3>

          <p class="mt-2 text-sm leading-6 text-gray-500">
            Buka tampilan website publik sebagai pengunjung.
          </p>

          <span class="mt-5 inline-flex text-sm font-semibold text-emerald-600">
            Buka Website →
          </span>
        </router-link>
      </section>
    </main>
  </div>
</template>
