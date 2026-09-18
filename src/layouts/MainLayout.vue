<template>
  <div class="flex min-h-screen flex-col">
    <Navbar />

    <main class="flex-1">
      <!--
        Transisi antar halaman.

        Sengaja singkat (200 md keluar, 300 md masuk): pergantian halaman
        harus terasa mulus, bukan lambat. Animasi panjang di navigasi adalah
        keluhan paling umum pada website yang "terlalu banyak animasi".
      -->
      <router-view v-slot="{ Component, route }">
        <Transition
          mode="out-in"
          enter-active-class="transition-all duration-300 ease-out"
          enter-from-class="opacity-0 translate-y-3"
          leave-active-class="transition-opacity duration-200 ease-in"
          leave-to-class="opacity-0"
        >
          <component :is="Component" :key="route.path" />
        </Transition>
      </router-view>
    </main>

    <Footer />
  </div>
</template>

<script setup>
import Navbar from "../components/Navbar.vue";
import Footer from "../components/Footer.vue";
</script>
