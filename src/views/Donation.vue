<script setup>
import { onMounted, ref } from "vue";
import { supabase } from "../lib/supabase";

const donationInfo = ref(null);
const loadingDonation = ref(true);

const getDonationInfo = async () => {
  const { data, error } = await supabase
    .from("donation_info")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1);

  console.log("DONATION DATA:", data);
  console.log("DONATION ERROR:", error);

  if (error) {
    console.error("Gagal mengambil data donasi:", error);
    loadingDonation.value = false;
    return;
  }

  donationInfo.value = data?.[0] || null;
  loadingDonation.value = false;
};

onMounted(() => {
  getDonationInfo();
});
</script>
<template>
  <div>
    <!-- =========================
         HERO
    ========================== -->
    <section class="bg-emerald-50">
      <div class="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
        <div class="mx-auto max-w-3xl text-center">
          <span
            class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
          >
            Donasi
          </span>

          <h1
            class="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
          >
            Bersama mendukung kebutuhan anak-anak Amanah Ummat.
          </h1>

          <p class="mt-6 text-lg leading-8 text-gray-600">
            Setiap dukungan yang diberikan dapat membantu memenuhi kebutuhan dan
            mendukung kegiatan anak-anak di LKSA Amanah Ummat.
          </p>
        </div>
      </div>
    </section>

    <!-- =========================
         DONATION CONTENT
    ========================== -->
    <section class="bg-white py-20">
      <div class="mx-auto grid max-w-6xl gap-10 px-5 lg:grid-cols-2 lg:px-8">
        <!-- LEFT -->
        <div>
          <span
            class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
          >
            Mengapa Berdonasi?
          </span>

          <h2 class="mt-3 text-3xl font-bold tracking-tight text-gray-900">
            Dukungan Anda berarti bagi mereka.
          </h2>

          <p class="mt-5 leading-8 text-gray-600">
            Donasi yang diberikan dapat membantu mendukung berbagai kebutuhan
            anak-anak, mulai dari kebutuhan sehari-hari, pendidikan, kesehatan,
            hingga kegiatan yang diselenggarakan oleh yayasan.
          </p>

          <!-- Benefits -->
          <div class="mt-8 space-y-5">
            <div class="flex gap-4">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-600"
              >
                ✓
              </div>

              <div>
                <h3 class="font-bold text-gray-900">Kebutuhan sehari-hari</h3>

                <p class="mt-1 text-sm leading-6 text-gray-600">
                  Membantu memenuhi kebutuhan harian anak-anak di yayasan.
                </p>
              </div>
            </div>

            <div class="flex gap-4">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-600"
              >
                ✓
              </div>

              <div>
                <h3 class="font-bold text-gray-900">Pendidikan</h3>

                <p class="mt-1 text-sm leading-6 text-gray-600">
                  Mendukung kebutuhan pendidikan dan kegiatan belajar anak-anak.
                </p>
              </div>
            </div>

            <div class="flex gap-4">
              <div
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-600"
              >
                ✓
              </div>

              <div>
                <h3 class="font-bold text-gray-900">Kegiatan anak</h3>

                <p class="mt-1 text-sm leading-6 text-gray-600">
                  Mendukung berbagai kegiatan dan pembinaan anak-anak.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- RIGHT -->
        <div class="rounded-3xl bg-gray-50 p-6 sm:p-8">
          <h2 class="text-2xl font-bold text-gray-900">Rekening Donasi</h2>

          <p class="mt-2 text-sm leading-6 text-gray-600">
            Silakan transfer donasi melalui rekening resmi berikut.
          </p>

          <!-- Loading -->
          <div
            v-if="loadingDonation"
            class="mt-7 rounded-2xl bg-white p-8 text-center shadow-sm"
          >
            <p class="text-sm text-gray-500">Memuat informasi donasi...</p>
          </div>

          <!-- Donation Info -->
          <template v-else-if="donationInfo">
            <!-- Bank -->
            <div class="mt-7 rounded-2xl bg-white p-6 shadow-sm">
              <p class="text-sm font-semibold text-gray-500">BANK</p>

              <p class="mt-1 text-xl font-bold text-gray-900">
                {{ donationInfo.bank_name }}
              </p>

              <p class="mt-5 text-sm font-semibold text-gray-500">
                NOMOR REKENING
              </p>

              <p class="mt-1 text-2xl font-bold tracking-wide text-emerald-600">
                {{ donationInfo.account_number }}
              </p>

              <p class="mt-3 text-sm text-gray-600">
                a.n. {{ donationInfo.account_name }}
              </p>
            </div>

            <!-- QRIS -->
            <div class="mt-5 rounded-2xl bg-white p-6 text-center shadow-sm">
              <p class="font-bold text-gray-900">Donasi melalui QRIS</p>

              <div
                v-if="donationInfo.qris_url"
                class="mx-auto mt-5 flex h-52 w-52 items-center justify-center overflow-hidden rounded-2xl bg-gray-100"
              >
                <img
                  :src="donationInfo.qris_url"
                  alt="QRIS Donasi Amanah Ummat"
                  class="h-full w-full object-contain"
                />
              </div>

              <div
                v-else
                class="mx-auto mt-5 flex h-52 w-52 items-center justify-center rounded-2xl bg-gray-100"
              >
                <span class="text-sm text-gray-400"> QRIS belum tersedia </span>
              </div>

              <p class="mt-4 text-sm text-gray-500">
                QRIS resmi LKSA Amanah Ummat
              </p>
            </div>
          </template>

          <!-- Empty -->
          <div
            v-else
            class="mt-7 rounded-2xl bg-white p-8 text-center shadow-sm"
          >
            <p class="text-sm text-gray-500">
              Informasi donasi belum tersedia.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- =========================
         CONFIRMATION
    ========================== -->
    <section class="bg-gray-50 py-20">
      <div class="mx-auto max-w-3xl px-5 text-center lg:px-8">
        <span
          class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
        >
          Konfirmasi Donasi
        </span>

        <h2 class="mt-3 text-3xl font-bold text-gray-900 sm:text-4xl">
          Sudah melakukan donasi?
        </h2>

        <p class="mx-auto mt-5 max-w-2xl leading-7 text-gray-600">
          Silakan konfirmasi donasi melalui WhatsApp agar kami dapat mencatat
          dan mengelola donasi dengan baik.
        </p>

        <a
          v-if="donationInfo?.whatsapp_number"
          :href="`https://wa.me/${donationInfo.whatsapp_number}`"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-8 inline-flex rounded-full bg-emerald-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
        >
          Konfirmasi via WhatsApp
          <span class="ml-2">→</span>
        </a>

        <p v-else class="mt-8 text-sm text-gray-500">
          Kontak WhatsApp untuk konfirmasi donasi belum tersedia.
        </p>
      </div>
    </section>

    <!-- =========================
         TRANSPARENCY
    ========================== -->
    <section class="bg-white py-20">
      <div class="mx-auto max-w-7xl px-5 lg:px-8">
        <div
          class="rounded-3xl border border-emerald-100 bg-emerald-50 p-8 sm:p-10"
        >
          <div class="max-w-3xl">
            <span
              class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
            >
              Amanah
            </span>

            <h2 class="mt-3 text-2xl font-bold text-gray-900 sm:text-3xl">
              Menjaga setiap amanah yang diberikan.
            </h2>

            <p class="mt-4 leading-8 text-gray-600">
              Setiap dukungan yang diberikan merupakan amanah yang harus
              dikelola dengan baik dan digunakan untuk mendukung kebutuhan serta
              kegiatan anak-anak LKSA Amanah Ummat.
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
