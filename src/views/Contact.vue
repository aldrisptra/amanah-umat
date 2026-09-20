<script setup>
import { computed, onMounted, ref } from "vue";
import { MapPin } from "lucide-vue-next";
import { supabase } from "../lib/supabase";
import { buildWhatsappUrl } from "../lib/utils";
import { buatEmbedPeta, buatTautanPeta } from "../lib/mapLocation";

const contact = ref(null);
const loadingContact = ref(true);

const fallbackMapEmbedUrl =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d205.15782885079486!2d116.81811197479935!3d-1.235029399999991!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2df1473fd39e937d%3A0xa0d99127e037ab21!2sPanti%20asuhan%20Amanah%20Ummat!5e1!3m2!1sen!2sid!4v1788662116802!5m2!1sen!2sid";

// Nomor dari CMS sering ditulis format lokal ("0813..."), sedangkan wa.me
// hanya menerima format internasional ("62813...").
const whatsappUrl = computed(() =>
  buildWhatsappUrl(
    contact.value?.whatsapp,
    "Assalamu'alaikum, saya ingin bertanya mengenai LKSA Amanah Ummat.",
  ),
);

// Titik lokasi diatur pengurus lewat panel admin. Bila belum diisi, peta
// jatuh ke titik bawaan agar halaman Kontak tidak pernah tampil tanpa peta.
const mapEmbedUrl = computed(
  () =>
    buatEmbedPeta(contact.value?.latitude, contact.value?.longitude) ||
    fallbackMapEmbedUrl,
);

// Tombol menuju aplikasi peta, supaya pengunjung bisa langsung mencari rute
const mapLinkUrl = computed(() =>
  buatTautanPeta(contact.value?.latitude, contact.value?.longitude),
);

const getContact = async () => {
  const { data, error } = await supabase
    .from("contact")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Gagal mengambil data kontak:", error);
    loadingContact.value = false;
    return;
  }

  contact.value = data?.[0] || null;
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
      <div class="mx-auto max-w-7xl px-5 pb-20 pt-32 lg:px-8 lg:pb-24 lg:pt-40">
        <div class="max-w-3xl">
          <span
            class="text-sm font-semibold uppercase tracking-wider text-emerald-600"
          >
            Kontak
          </span>

          <h1
            class="mt-4 text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl"
          >
            Hubungi LKSA Amanah Ummat.
          </h1>

          <p class="mt-6 max-w-2xl text-lg leading-8 text-gray-600">
            Jika Anda ingin mengetahui lebih lanjut tentang LKSA Amanah Ummat
            atau ingin memberikan dukungan, silakan hubungi kami.
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
        <div v-if="loadingContact" class="grid gap-10 lg:grid-cols-2">
          <div class="space-y-4">
            <div class="skeleton h-3 w-36"></div>
            <div class="skeleton h-9 w-4/5"></div>
            <div class="skeleton h-4 w-full"></div>

            <div v-for="n in 4" :key="n" class="flex gap-4 pt-3">
              <div class="skeleton h-11 w-11 shrink-0 rounded-full"></div>

              <div class="flex-1 space-y-2">
                <div class="skeleton h-4 w-24"></div>
                <div class="skeleton h-3 w-2/3"></div>
              </div>
            </div>
          </div>

          <div class="skeleton h-[450px] rounded-3xl"></div>
        </div>

        <!-- Content -->
        <div v-else-if="contact" class="grid gap-10 lg:grid-cols-2">
          <!-- LEFT : CONTACT INFO -->
          <div v-reveal="{ arah: 'kiri' }">
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
              lebih lanjut mengenai LKSA Amanah Ummat.
            </p>

            <!-- Address -->
            <div class="mt-8 flex gap-4">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition-transform duration-300 group-hover/kontak:scale-110"
              >
                📍
              </div>

              <div>
                <h3 class="font-bold text-gray-900">Alamat</h3>

                <p class="mt-1 whitespace-pre-line leading-7 text-gray-600">
                  {{ contact.address || "Alamat belum tersedia." }}
                </p>
              </div>
            </div>

            <!-- Phone -->
            <div class="mt-6 flex gap-4">
              <div
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition-transform duration-300 group-hover/kontak:scale-110"
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
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition-transform duration-300 group-hover/kontak:scale-110"
              >
                💬
              </div>

              <div>
                <h3 class="font-bold text-gray-900">WhatsApp</h3>

                <a
                  v-if="whatsappUrl"
                  :href="whatsappUrl"
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
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 transition-transform duration-300 group-hover/kontak:scale-110"
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
          <div v-reveal="{ arah: 'kanan' }">
            <div class="overflow-hidden rounded-3xl bg-gray-100 shadow-sm">
              <iframe
                :src="mapEmbedUrl"
                title="Lokasi LKSA Amanah Ummat Balikpapan"
                class="h-[450px] w-full border-0"
                loading="lazy"
                allowfullscreen
                referrerpolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>

            <a
              v-if="mapLinkUrl"
              :href="mapLinkUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="group mt-4 inline-flex items-center gap-2 rounded-full border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <MapPin class="h-4 w-4" />
              Buka di Google Maps
              <span
                class="transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </a>
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
        v-reveal
        class="mx-auto max-w-7xl rounded-3xl bg-linear-to-br from-emerald-700 to-emerald-600 px-6 py-16 text-center shadow-2xl shadow-emerald-900/20 sm:px-12"
      >
        <h2 class="mx-auto max-w-3xl text-3xl font-bold text-white sm:text-4xl">
          Mari terhubung dengan Amanah Ummat.
        </h2>

        <p class="mx-auto mt-5 max-w-2xl leading-7 text-emerald-100">
          Hubungi kami untuk mendapatkan informasi lebih lanjut atau memberikan
          dukungan kepada anak-anak LKSA Amanah Ummat.
        </p>

        <a
          v-if="whatsappUrl"
          :href="whatsappUrl"
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
