<script setup>
import { computed, onMounted, reactive, ref } from "vue";
import { supabase } from "../../lib/supabase";
import { PROGRAM_PAGE_BAWAAN, getProgramPage, isiProgramPage } from "../../lib/programPage";
import { useUnsavedChanges } from "../../lib/useUnsavedChanges";
import AdminCard from "./AdminCard.vue";
import AdminField from "./AdminField.vue";
import AdminAlert from "./AdminAlert.vue";
const pageForm = reactive({ ...PROGRAM_PAGE_BAWAAN });
const loading = ref(true), saving = ref(false), unavailable = ref(false);
const pageId = ref(null), errorMessage = ref(""), successMessage = ref("");
const initial = ref(JSON.stringify(pageForm));
const dirty = computed(() => !loading.value && JSON.stringify(pageForm) !== initial.value);
useUnsavedChanges(dirty);
onMounted(async () => {
  try {
    const result = await getProgramPage();
    unavailable.value = result.belumAda;
    pageId.value = result.data?.id || null;
    Object.assign(pageForm, isiProgramPage(result.data));
    initial.value = JSON.stringify(pageForm);
  } catch (error) { errorMessage.value = error.message; }
  finally { loading.value = false; }
});
async function simpan() {
  if (saving.value) return;
  saving.value = true; errorMessage.value = ""; successMessage.value = "";
  try {
    const payload = Object.fromEntries(Object.entries(pageForm).map(([key, value]) => [key, value.trim()]));
    const result = pageId.value
      ? await supabase.from("program_page").update(payload).eq("id", pageId.value).select()
      : await supabase.from("program_page").insert(payload).select();
    if (result.error) throw result.error;
    if (!result.data?.length) throw new Error("Perubahan tidak tersimpan. Periksa sesi admin.");
    pageId.value = result.data[0].id;
    initial.value = JSON.stringify(pageForm);
    successMessage.value = "Teks halaman Program berhasil disimpan.";
  } catch (error) { errorMessage.value = error.message; }
  finally { saving.value = false; }
}
</script>
<template>
  <details class="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
    <summary class="cursor-pointer font-semibold text-gray-900">Pengaturan Teks Halaman Program</summary>
    <p class="my-4 text-sm text-gray-600">Atur judul, pengantar, dan ajakan dukungan yang tampil di halaman Program.</p>
    <AdminAlert :error="errorMessage" :success="successMessage" @dismiss="errorMessage = ''; successMessage = ''" />
    <p v-if="loading" class="py-5 text-sm text-gray-500">Memuat teks halaman...</p>
    <p v-else-if="unavailable" class="text-sm text-amber-800">Penyimpanan teks belum tersedia. Jalankan supabase/program_units.sql di Supabase SQL Editor.</p>
    <form v-else @submit.prevent="simpan" class="space-y-5">
        <AdminCard
          step="1"
          title="Bagian atas halaman Program"
          description="Tulisan besar yang menyambut pengunjung di daftar kegiatan."
        >
          <AdminField
            v-slot="{ id }"
            label="Label kecil"
            hint="Tulisan hijau kecil di atas judul."
            required
            :value="pageForm.eyebrow"
            :max="30"
          >
            <input
              :id="id"
              v-model="pageForm.eyebrow"
              type="text"
              required
              class="admin-input"
            />
          </AdminField>

          <AdminField
            v-slot="{ id }"
            label="Judul"
            required
            :value="pageForm.title"
            :max="70"
          >
            <input
              :id="id"
              v-model="pageForm.title"
              type="text"
              required
              class="admin-input"
            />
          </AdminField>

          <AdminField
            v-slot="{ id }"
            label="Penjelasan"
            hint="Satu atau dua kalimat pengantar tentang kegiatan anak-anak."
            :value="pageForm.description"
            :max="200"
          >
            <textarea
              :id="id"
              v-model="pageForm.description"
              rows="3"
              class="admin-textarea"
            ></textarea>
          </AdminField>
        </AdminCard>

        <AdminCard
          step="2"
          title="Ajakan donasi"
          description="Kotak hijau di bagian bawah halaman Program ."
        >
          <AdminField
            v-slot="{ id }"
            label="Judul"
            required
            :value="pageForm.cta_title"
            :max="70"
          >
            <input
              :id="id"
              v-model="pageForm.cta_title"
              type="text"
              required
              class="admin-input"
            />
          </AdminField>

          <AdminField
            v-slot="{ id }"
            label="Penjelasan"
            :value="pageForm.cta_description"
            :max="200"
          >
            <textarea
              :id="id"
              v-model="pageForm.cta_description"
              rows="3"
              class="admin-textarea"
            ></textarea>
          </AdminField>
        </AdminCard>

      <button type="submit" :disabled="saving || !dirty" class="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white disabled:opacity-50">{{ saving ? 'Menyimpan...' : 'Simpan Teks Program' }}</button>
    </form>
  </details>
</template>
