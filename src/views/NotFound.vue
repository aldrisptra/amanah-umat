<script setup>
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<template>
  <section class="bg-white">
    <div
      class="mx-auto flex min-h-[70vh] max-w-3xl flex-col items-center justify-center px-5 pb-24 pt-36 text-center lg:px-8"
    >
      <span
        class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
      >
        Halaman tidak ditemukan
      </span>

      <h1
        class="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
      >
        404
      </h1>

      <p class="mt-5 max-w-xl leading-8 text-gray-600">
        Maaf, halaman yang Anda cari tidak tersedia atau alamatnya sudah
        berubah.
      </p>

      <div class="mt-8 flex flex-col gap-3 sm:flex-row">
        <router-link
          to="/"
          class="inline-flex items-center justify-center rounded-full bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700"
        >
          Kembali ke Beranda
        </router-link>

        <button
          type="button"
          @click="router.back()"
          class="inline-flex items-center justify-center rounded-full border border-gray-200 px-7 py-3.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50"
        >
          Halaman Sebelumnya
        </button>
      </div>
    </div>
  </section>
</template>
