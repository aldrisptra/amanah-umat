<template>
  <header
    class="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur"
  >
    <div
      class="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8"
    >
      <!-- Logo -->
      <router-link to="/" class="flex items-center gap-3">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-lg font-bold text-white"
        >
          A
        </div>

        <span class="text-xl font-bold tracking-tight text-gray-900">
          Amanah Umat
        </span>
      </router-link>

      <!-- Desktop Navigation -->
      <nav class="hidden items-center gap-8 md:flex">
        <router-link
          to="/"
          class="text-sm font-medium text-gray-600 transition hover:text-emerald-600"
          active-class="!text-emerald-600"
        >
          Beranda
        </router-link>

        <router-link
          to="/tentang-kami"
          class="text-sm font-medium text-gray-600 transition hover:text-emerald-600"
          active-class="!text-emerald-600"
        >
          Tentang Kami
        </router-link>

        <router-link
          to="/program"
          class="text-sm font-medium text-gray-600 transition hover:text-emerald-600"
          active-class="!text-emerald-600"
        >
          Program
        </router-link>

        <router-link
          to="/galeri"
          class="text-sm font-medium text-gray-600 transition hover:text-emerald-600"
          active-class="!text-emerald-600"
        >
          Galeri
        </router-link>

        <router-link
          to="/kontak"
          class="text-sm font-medium text-gray-600 transition hover:text-emerald-600"
          active-class="!text-emerald-600"
        >
          Kontak
        </router-link>

        <!-- Donation Button -->
        <router-link
          to="/donasi"
          class="inline-flex items-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 hover:shadow-md"
        >
          <Heart class="mr-2 h-4 w-4" /> Donasi
        </router-link>
      </nav>

      <!-- Mobile Menu Button -->
      <button
        type="button"
        class="flex h-10 w-10 items-center justify-center rounded-lg text-gray-700 transition hover:bg-gray-100 md:hidden"
        @click="isMenuOpen = !isMenuOpen"
        aria-label="Toggle menu"
      >
        <svg
          v-if="!isMenuOpen"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          class="h-6 w-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"
          />
        </svg>

        <svg
          v-else
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          class="h-6 w-6"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>

    <!-- Mobile Navigation -->
    <div v-if="isMenuOpen" class="border-t border-gray-100 bg-white md:hidden">
      <nav class="mx-auto flex max-w-7xl flex-col px-5 py-4">
        <router-link
          to="/"
          class="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          active-class="bg-emerald-50 !text-emerald-600"
          @click="closeMenu"
        >
          Beranda
        </router-link>

        <router-link
          to="/tentang-kami"
          class="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          active-class="bg-emerald-50 !text-emerald-600"
          @click="closeMenu"
        >
          Tentang Kami
        </router-link>

        <router-link
          to="/program"
          class="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          active-class="bg-emerald-50 !text-emerald-600"
          @click="closeMenu"
        >
          Program
        </router-link>

        <router-link
          to="/galeri"
          class="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          active-class="bg-emerald-50 !text-emerald-600"
          @click="closeMenu"
        >
          Galeri
        </router-link>

        <router-link
          to="/kontak"
          class="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
          active-class="bg-emerald-50 !text-emerald-600"
          @click="closeMenu"
        >
          Kontak
        </router-link>

        <router-link
          to="/donasi"
          class="mt-3 rounded-full bg-emerald-600 px-5 py-3 text-center text-sm font-semibold text-white transition hover:bg-emerald-700"
          @click="closeMenu"
        >
          Donasi
        </router-link>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { Eye, Heart } from "lucide-vue-next";
import { ref } from "vue";

const isMenuOpen = ref(false);

const closeMenu = () => {
  isMenuOpen.value = false;
};
</script>
