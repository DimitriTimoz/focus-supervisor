
<template>
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
    <div class="p-6 bg-white rounded-lg shadow" v-for="(stat, index) in stats" :key="index"
      :style="{ animationDelay: `${(index + 1) * 100}ms` }">
      <p class="text-sm text-gray-500">{{ stat.label }}</p>
      <p class="mt-2 text-3xl font-bold text-gray-900">{{ stat.value }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';

interface Stat {
  label: string;
  value: string | number;
}

const props = defineProps<{
  totalTrackedTime: number;
  totalActivities: number;
  averageActivityDuration: number;
}>();

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

const stats = computed<Stat[]>(() => [
  { label: 'Total time', value: formatDuration(props.totalTrackedTime) },
  { label: 'Activities recorded', value: props.totalActivities },
  { label: 'Average duration', value: formatDuration(props.averageActivityDuration) }
]);
</script>

<style scoped>
  /* ...existing styles... */
</style>