<script setup>
import { onMounted, ref } from "vue";
import { supabase } from "../lib/supabase";

const contact = ref(null);
const loadingContact = ref(true);

const getContact = async () => {
  const { data, error } = await supabase
    .from("contact")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();

  if (error) {
    console.error("Gagal mengambil data kontak:", error);
    loadingContact.value = false;
    return;
  }

  contact.value = data;
  loadingContact.value = false;
};

onMounted(() => {
  getContact();
});
</script>

<template>
  <div>
    <!-- =========================
         HERO
    ========================== -->
    <section class="bg-emerald-50">
      <div class="mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-24">
        <div class="max-w-3xl">
          <span
            class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
          >
            Kontak
          </span>

          <h1
            class="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
          >
            Hubungi Panti Asuhan Amanah Umat.
          </h1>

          <p class="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Jika Anda ingin mengetahui lebih lanjut tentang Panti Asuhan Amanah
            Umat atau ingin memberikan dukungan, silakan hubungi kami.
          </p>
        </div>
      </div>
    </section>

    <!-- =========================
         CONTACT CONTENT
    ========================== -->
    <section class="bg-white py-20">
      <div class="mx-auto max-w-7xl px-5 lg:px-8">
        <!-- Loading -->
        <div v-if="loadingContact" class="py-20 text-center text-gray-500">
          Memuat informasi kontak...
        </div>

        <!-- Content -->
        <div v-else-if="contact" class="grid gap-10 lg:grid-cols-2">
          <!-- LEFT : CONTACT INFO -->
          <div>
            <span
              class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
            >
              Informasi Kontak
            </span>

            <h2
              class="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl"
            >
              Kami siap terhubung dengan Anda.
            </h2>

            <p class="mt-5 leading-8 text-gray-600">
              Jangan ragu untuk menghubungi kami untuk mendapatkan informasi
              lebih lanjut mengenai Panti Asuhan Amanah Umat.
            </p>

            <!-- Address -->
            <div class="mt-8 flex gap-4">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
              >
                📍
              </div>

              <div>
                <h3 class="font-bold text-gray-900">Alamat</h3>

                <p class="mt-1 leading-7 text-gray-600">
                  {{ contact.address || "Alamat belum tersedia." }}
                </p>
              </div>
            </div>

            <!-- Phone -->
            <div class="mt-6 flex gap-4">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
              >
                ☎
              </div>

              <div>
                <h3 class="font-bold text-gray-900">Telepon</h3>

                <a
                  v-if="contact.phone"
                  :href="`tel:${contact.phone}`"
                  class="mt-1 inline-block text-gray-600 transition hover:text-emerald-600"
                >
                  {{ contact.phone }}
                </a>

                <p v-else class="mt-1 text-gray-500">
                  Nomor telepon belum tersedia.
                </p>
              </div>
            </div>

            <!-- WhatsApp -->
            <div class="mt-6 flex gap-4">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
              >
                💬
              </div>

              <div>
                <h3 class="font-bold text-gray-900">WhatsApp</h3>

                <a
                  v-if="contact.whatsapp"
                  :href="`https://wa.me/${contact.whatsapp}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mt-1 inline-block text-gray-600 transition hover:text-emerald-600"
                >
                  {{ contact.whatsapp }}
                </a>

                <p v-else class="mt-1 text-gray-500">
                  Kontak WhatsApp belum tersedia.
                </p>
              </div>
            </div>

            <!-- Email -->
            <div class="mt-6 flex gap-4">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
              >
                ✉
              </div>

              <div>
                <h3 class="font-bold text-gray-900">Email</h3>

                <a
                  v-if="contact.email"
                  :href="`mailto:${contact.email}`"
                  class="mt-1 inline-block text-gray-600 transition hover:text-emerald-600"
                >
                  {{ contact.email }}
                </a>

                <p v-else class="mt-1 text-gray-500">Email belum tersedia.</p>
              </div>
            </div>
          </div>

          <!-- RIGHT : MAP -->
          <div class="overflow-hidden rounded-3xl bg-gray-100 shadow-sm">
            <!-- Map tersedia -->
            <iframe
              v-if="contact.latitude && contact.longitude"
              :src="`https://www.google.com/maps?q=${contact.latitude},${contact.longitude}&z=16&output=embed`"
              class="h-[450px] w-full border-0"
              loading="lazy"
              allowfullscreen
              referrerpolicy="no-referrer-when-downgrade"
            ></iframe>

            <!-- Map belum tersedia -->
            <div
              v-else
              class="flex h-[450px] items-center justify-center px-6 text-center"
            >
              <div>
                <div class="text-4xl">📍</div>

                <p class="mt-3 font-semibold text-gray-700">
                  Lokasi Panti Asuhan Amanah Umat
                </p>

                <p class="mt-2 text-sm leading-6 text-gray-500">
                  Lokasi panti akan ditampilkan setelah koordinat lokasi
                  tersedia.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty -->
        <div v-else class="py-20 text-center text-gray-500">
          Informasi kontak belum tersedia.
        </div>
      </div>
    </section>

    <!-- =========================
         CTA
    ========================== -->
    <section class="bg-emerald-50 px-5 py-20 lg:px-8">
      <div
        class="mx-auto max-w-7xl rounded-3xl bg-emerald-700 px-6 py-16 text-center sm:px-12"
      >
        <h2 class="mx-auto max-w-3xl text-3xl font-bold text-white sm:text-4xl">
          Mari terhubung dengan Amanah Umat.
        </h2>

        <p class="mx-auto mt-5 max-w-2xl leading-7 text-emerald-100">
          Hubungi kami untuk mendapatkan informasi lebih lanjut atau memberikan
          dukungan kepada anak-anak Panti Asuhan Amanah Umat.
        </p>

        <a
          v-if="contact?.whatsapp"
          :href="`https://wa.me/${contact.whatsapp}`"
          target="_blank"
          rel="noopener noreferrer"
          class="mt-8 inline-flex rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-emerald-700 shadow-lg transition hover:bg-gray-100"
        >
          Hubungi via WhatsApp
          <span class="ml-2">→</span>
        </a>
      </div>
    </section>
  </div>
</template>
