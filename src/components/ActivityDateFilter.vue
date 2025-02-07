
<template>
  <div class="flex flex-wrap gap-3">
    <button
      v-for="filter in filters"
      :key="filter"
      type="button"
      @click="$emit('update:filter', filter)"
      :class="[
        'px-5 py-2 rounded-md transition duration-200',
        filter === currentFilter
          ? 'bg-blue-600 text-white shadow-md'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      ]"
    >
      {{ filter }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';

const props = defineProps({
  currentFilter: { type: String, default: 'jour' }
});

const filters = ['jour', 'semaine', 'mois', 'tout'];
</script>

<style scoped>
  /* ...existing styles... */
</style>