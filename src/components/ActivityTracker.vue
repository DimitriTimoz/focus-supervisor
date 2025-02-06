<script setup lang="ts">
import { useActivityStore } from '../stores/activity';
import { onMounted, onUnmounted, computed } from 'vue';
import ActivityHistory from './ActivityHistory.vue';

const APP_COLORS = [
  'bg-blue-500', 
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-purple-500',
  'bg-pink-500'
];

const activityStore = useActivityStore();

const chartData = computed(() => {
  if (!activityStore.history.length) return [];
  
  const totalDuration = activityStore.history.reduce((sum, entry) => 
    sum + (entry.end! - entry.start), 0);
  
  const apps = activityStore.history.reduce((acc, entry) => {
    const duration = entry.end! - entry.start;
    if (!acc[entry.name]) {
      acc[entry.name] = { duration, count: 1 };
    } else {
      acc[entry.name].duration += duration;
      acc[entry.name].count++;
    }
    return acc;
  }, {} as Record<string, { duration: number; count: number }>);

  return Object.entries(apps).map(([name, data], index) => ({
    name,
    percentage: Math.round((data.duration / totalDuration) * 100),
    duration: data.duration,
    count: data.count,
    color: APP_COLORS[index % APP_COLORS.length]
  }));
});

let intervalId: NodeJS.Timeout;
onMounted(() => {
  intervalId = setInterval(async () => {
    await activityStore.checkFocusedWindow();
  }, 1000);
});
onUnmounted(() => {
  clearInterval(intervalId);
});
</script>

<template>
  <div class="container mx-auto p-6 space-y-10">
    
    <!-- Section Activité en cours -->
    <section class="space-y-4">
      <h2 class="text-2xl font-bold text-gray-800">Activité en cours</h2>
      <div 
        v-if="activityStore.current" 
        class="p-6 bg-white rounded-xl shadow hover:shadow-lg transition-all duration-300"
      >
        <p class="text-xl font-semibold text-gray-700">
          {{ activityStore.current.name }}
          <span class="text-gray-500 font-normal">({{ activityStore.current.title }})</span>
        </p>
        <p class="mt-2 text-sm text-gray-600">
          Depuis <span class="font-medium">{{ formatTime(activityStore.current.start) }}</span>
        </p>
      </div>
      <div 
        v-else 
        class="p-6 bg-white rounded-xl shadow text-gray-500 italic"
      >
         Aucune activité en cours…
      </div>
    </section>
    
    <!-- Section Répartition des applications -->
    <section class="space-y-6">
      <h2 class="text-2xl font-bold text-gray-800">Répartition des applications</h2>
      
      <div v-if="chartData.length" class="space-y-6">
        <!-- Barre de progression -->
        <div class="relative h-8 w-full bg-gray-200 rounded-full overflow-hidden">
          <div class="flex h-full">
            <div 
              v-for="segment in chartData" 
              :key="segment.name"
              :style="{ width: `${segment.percentage}%` }"
              :class="segment.color"
              class="h-full transition-all duration-500"
            ></div>
          </div>
        </div>
        
        <!-- Légende -->
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div 
            v-for="segment in chartData" 
            :key="segment.name"
            class="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm hover:shadow transition-shadow duration-300"
          >
            <div 
              :class="segment.color" 
              class="w-4 h-4 rounded-full flex-shrink-0"
            ></div>
            <div>
              <p class="text-sm font-semibold text-gray-700">{{ segment.name }}</p>
              <p class="text-xs text-gray-500">
                {{ formatDuration(segment.duration) }} ({{ segment.percentage }}%)
              </p>
            </div>
          </div>
        </div>  
      </div>

      <div v-else class="text-gray-500 text-sm">
        Aucune donnée d'activité disponible.
      </div>
    </section>
    
    <!-- Historique des activités -->
    <section>
      <ActivityHistory />
    </section>
  </div>
</template>

<script lang="ts">
export default {
  methods: {
    formatTime(timestamp: number) {
      return new Date(timestamp).toLocaleTimeString('fr-FR');
    },
    formatDuration(ms: number) {
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }
};
</script>
