<script setup>
import { computed, onMounted, ref } from "vue";
import { supabase } from "../lib/supabase";
import { buildWhatsappUrl } from "../lib/utils";
import { useSiteIdentity } from "../lib/siteIdentity";
import SiteLogo from "./SiteLogo.vue";

const contact = ref(null);

const tahunSekarang = new Date().getFullYear();

const { identitas } = useSiteIdentity();

const whatsappUrl = computed(() => buildWhatsappUrl(contact.value?.whatsapp));

const getContact = async () => {
  const { data, error } = await supabase
    .from("contact")
    .select("address, phone, email, whatsapp")
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    console.error("Gagal mengambil kontak footer:", error);
    return;
  }

  contact.value = data?.[0] || null;
};

onMounted(() => {
  getContact();
});
</script>

<template>
  <footer class="mt-20 bg-gray-950 text-white">
    <div
      class="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-3 lg:px-8"
    >
      <!-- Brand -->
      <div>
        <div class="mb-5">
          <SiteLogo name-class="text-white" />
        </div>

        <p class="max-w-sm text-sm leading-7 text-gray-400">
          Bersama memberikan kasih sayang, pendidikan, dan kehidupan yang layak
          bagi anak-anak yatim, piatu, dan dhuafa di Balikpapan.
        </p>
      </div>

      <!-- Menu -->
      <div>
        <h3 class="mb-5 text-sm font-semibold uppercase tracking-wider">
          Menu
        </h3>

        <div class="flex flex-col gap-3 text-sm">
          <router-link to="/" class="text-gray-400 transition hover:text-white">
            Beranda
          </router-link>

          <router-link
            to="/tentang-kami"
            class="text-gray-400 transition hover:text-white"
          >
            Tentang Kami
          </router-link>

          <router-link
            to="/program"
            class="text-gray-400 transition hover:text-white"
          >
            Program
          </router-link>

          <router-link
            to="/galeri"
            class="text-gray-400 transition hover:text-white"
          >
            Galeri
          </router-link>

          <router-link
            to="/kontak"
            class="text-gray-400 transition hover:text-white"
          >
            Kontak
          </router-link>
        </div>
      </div>

      <!-- Contact -->
      <div>
        <h3 class="mb-5 text-sm font-semibold uppercase tracking-wider">
          Kontak
        </h3>

        <div class="space-y-3 text-sm text-gray-400">
          <p>{{ contact?.address || "Alamat belum tersedia" }}</p>

          <p>
            <a
              v-if="contact?.phone"
              :href="`tel:${contact.phone}`"
              class="transition hover:text-white"
            >
              {{ contact.phone }}
            </a>

            <span v-else>Nomor telepon belum tersedia</span>
          </p>

          <p>
            <a
              v-if="contact?.email"
              :href="`mailto:${contact.email}`"
              class="transition hover:text-white"
            >
              {{ contact.email }}
            </a>

            <span v-else>Email belum tersedia</span>
          </p>

          <p v-if="whatsappUrl">
            <a
              :href="whatsappUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="transition hover:text-white"
            >
              Hubungi via WhatsApp
            </a>
          </p>
        </div>
      </div>
    </div>

    <!-- Copyright -->
    <div class="border-t border-gray-800">
      <div class="mx-auto max-w-7xl px-5 py-6 lg:px-8">
        <p class="text-center text-sm text-gray-500">
          © {{ tahunSekarang }} {{ identitas.site_name }}. Seluruh hak cipta
          dilindungi.
        </p>
      </div>
    </div>
  </footer>
</template>
