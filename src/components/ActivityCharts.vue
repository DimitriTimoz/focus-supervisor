<template>
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
    <!-- Bar Chart -->
    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <span class="mr-2">📊</span>
        Hourly Activity
      </h3>
      <div class="relative h-64">
        <Bar :data="barData" :options="barOptions" :key="JSON.stringify(barData)" />
      </div>
    </div>
    <!-- Applications Distribution -->
    <div class="bg-white rounded-lg shadow p-6">
      <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <span class="mr-2">📈</span>
        Applications Distribution
      </h3>
      <div v-if="chartData.length">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div v-for="segment in chartData" :key="segment.name"
            class="flex items-center p-4 bg-gray-50 rounded-md shadow-sm">
            <div :class="segment.color" class="w-4 h-4 rounded-full mr-3"></div>
            <div>
              <p class="text-sm font-semibold text-gray-700">{{ segment.name }}</p>
              <p class="text-xs text-gray-500">
                {{ formatDuration(segment.duration) }} ({{ segment.percentage }}%)
              </p>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="text-gray-500 text-center py-4">
        No activity data
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue';
import { Bar } from 'vue-chartjs';

const props = defineProps<{
  barData: any;
  barOptions: any;
  chartData: Array<{ name: string; duration: number; percentage: number; color: string }>;
}>();

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};
</script>

<style scoped>
  /* ...existing styles... */
</style>
