<template>
  <header class="sticky top-0 z-20 bg-white shadow py-4 border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 flex justify-between items-center">
      <h1 class="text-2xl font-semibold text-gray-900">
        {{ title }}
      </h1>
      <select v-model="localLocale" class="bg-gray-100 border rounded-md px-3 py-2 focus:outline-none">
        <option v-for="lang in availableLocales" :key="lang.code" :value="lang.code">
          {{ lang.label }}
        </option>
      </select>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, watch, defineProps, defineEmits } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  title: { type: String, default: 'Activity Dashboard' },
  locale: { type: String, default: 'en' }
});
const emit = defineEmits(['update:locale']);

const availableLocales = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' }
];

const localLocale = ref(props.locale);
const { locale: i18nLocale } = useI18n();
i18nLocale.value = localLocale.value;

watch(localLocale, (newVal) => {
  i18nLocale.value = newVal;
  emit('update:locale', newVal);
});
</script>

<style scoped>
  /* ...existing styles... */
</style>
