<template>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Bar Chart : Activité horaire -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span class="mr-2">📊</span>
          Hourly Activity
        </h3>
        <div class="relative h-64">
          <!-- Use the parent's reactive barData -->
          <Bar
            :data="barData"
            :options="barOptions"
            :key="JSON.stringify(barData)"
          />
        </div>
      </div>
  
      <!-- Applications Distribution -->
      <!-- Add a dynamic key to force re-render on chartData change -->
      <div class="bg-white rounded-lg shadow p-6" :key="JSON.stringify(chartData)">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span class="mr-2">📈</span>
          Applications Distribution
        </h3>
        <div v-if="chartData && chartData.length">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              v-for="segment in chartData"
              :key="segment.name"
              class="flex items-center p-4 bg-gray-50 rounded-md shadow-sm"
            >
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
  import { ref, computed } from 'vue';
  import { Bar } from 'vue-chartjs';
  import { defineProps, withDefaults } from 'vue';
  import { useActivityStore } from '../stores/activity';
  
  // Définition des props avec des valeurs par défaut.
  // Même si on accepte la prop barData, on l'ignore ici pour calculer notre propre graphique.
  const props = withDefaults(
    defineProps<{
      barData: any;
      barOptions: any;
      chartData: Array<{ name: string; duration: number; percentage: number; color: string }>;
    }>(),
    {
      barData: { labels: [], datasets: [] },
      barOptions: {},
      chartData: [],
    }
  );
  
  const { barData, barOptions, chartData } = props;

  // Remove internal aggregations and watchers so that only parent's filtered data is used:
  // --- removed: computedBarData, allSegments, aggregatedByHour ---
  //
  // Also remove watchers on props.barData / props.chartData. Rely on :key on <Bar> to force re-render.
  
  // Fonction utilitaire pour formater une durée (en ms) en "Xh Ym"
  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // ...existing code, if any...
  </script>
  
  <style scoped>
  /* Ajoutez ici vos styles personnalisés si nécessaire */
  </style>
