<script setup lang="ts">
import { useActivityStore } from '../stores/activity';
import { onMounted, onUnmounted, computed, ref } from 'vue';
import ActivityHistory from './ActivityHistory.vue';


const APP_COLORS = [
    'bg-blue-500', 
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-cyan-500',
    'bg-rose-500',
    'bg-amber-500',
    'bg-lime-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-lightBlue-500',
    'bg-violet-500',
    
];

const activityStore = useActivityStore();

// Filter by date: 'jour', 'semaine', 'mois' or 'tout'
const dateFilter = ref<'jour' | 'semaine' | 'mois' | 'tout'>('jour');

// Compute start timestamp based on chosen filter
const startDateForFilter = computed(() => {
  const now = new Date();
  switch (dateFilter.value) {
    case 'jour': {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      return startOfDay.getTime();
    }
    case 'semaine': {
      const day = now.getDay();
      const diff = (day === 0 ? 6 : day - 1); 
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - diff);
      startOfWeek.setHours(0, 0, 0, 0);
      return startOfWeek.getTime();
    }
    case 'mois': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return startOfMonth.getTime();
    }
    case 'tout':
    default:
      return 0;
  }
});

// Filtered activity history based on chosen period
const filteredHistory = computed(() => {
  if (dateFilter.value === 'tout') return activityStore.history;
  const startTimestamp = startDateForFilter.value;
  return activityStore.history.filter(entry => entry.start >= startTimestamp);
});

// Computed data for the chart from filteredHistory
const chartData = computed(() => {
  if (!filteredHistory.value.length) return [];
  
  const totalDuration = filteredHistory.value.reduce((sum, entry) => 
    sum + (entry.end! - entry.start), 0);
  
  const apps = filteredHistory.value.reduce((acc, entry) => {
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

// Global statistics computed values based on filteredHistory
const totalTrackedTime = computed(() =>
  filteredHistory.value.reduce((sum, entry) => sum + (entry.end! - entry.start), 0)
);
const totalActivities = computed(() => filteredHistory.value.length);
const averageActivityDuration = computed(() =>
  totalActivities.value > 0 ? totalTrackedTime.value / totalActivities.value : 0
);

// Update loop: check for focused window every second
let intervalId: NodeJS.Timeout;
onMounted(() => {
  intervalId = setInterval(async () => {
    await activityStore.checkFocusedWindow();
  }, 1000);
});
onUnmounted(() => {
  clearInterval(intervalId);
});

const locale = ref('en');

// Language selection support
const availableLocales = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' }
];
</script>

<template>
  <div class="container mx-auto p-6 space-y-10">
    <!-- Language Selector -->
    <section class="flex justify-end">
      <select v-model="locale" class="border rounded px-2 py-1">
        <option 
          v-for="lang in availableLocales" 
          :key="lang.code" 
          :value="lang.code"
        >
          {{ lang.label }}
        </option>
      </select>
    </section>

    <!-- Section: Filter by Dates -->
    <section class="space-y-4">
      <h2 class="text-2xl font-bold text-gray-800">{{ $t('filter_by_date') }}</h2>
      <div class="flex space-x-4">
        <button 
          @click="dateFilter = 'jour'" 
          :class="['px-4 py-2 rounded', dateFilter === 'jour' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700']"
        >
          {{ $t('day') }}
        </button>
        <button 
          @click="dateFilter = 'semaine'" 
          :class="['px-4 py-2 rounded', dateFilter === 'semaine' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700']"
        >
          {{ $t('week') }}
        </button>
        <button 
          @click="dateFilter = 'mois'" 
          :class="['px-4 py-2 rounded', dateFilter === 'mois' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700']"
        >
          {{ $t('month') }}
        </button>
        <button 
          @click="dateFilter = 'tout'" 
          :class="['px-4 py-2 rounded', dateFilter === 'tout' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700']"
        >
          {{ $t('all_periods') }}
        </button>
      </div>
    </section>
   
    <!-- Section: Global Statistics -->
    <section class="space-y-4">
      <h2 class="text-2xl font-bold text-gray-800">{{ $t('global_statistics') }}</h2>
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-300">
          <p class="text-sm text-gray-500">{{ $t('total_time') }}</p>
          <p class="text-xl font-semibold text-gray-700">{{ formatDuration(totalTrackedTime) }}</p>
        </div>
        <div class="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-300">
          <p class="text-sm text-gray-500">{{ $t('activities_recorded') }}</p>
          <p class="text-xl font-semibold text-gray-700">{{ totalActivities }}</p>
        </div>
        <div class="p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-300">
          <p class="text-sm text-gray-500">{{ $t('average_duration') }}</p>
          <p class="text-xl font-semibold text-gray-700">{{ formatDuration(averageActivityDuration) }}</p>
        </div>
      </div>
    </section>
    
    <!-- Section: Applications Distribution -->
    <section class="space-y-6">
      <h2 class="text-2xl font-bold text-gray-800">{{ $t('applications_distribution') }}</h2>
      
      <div v-if="chartData.length" class="space-y-6">
        <!-- Progress Bar -->
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
        
        <!-- Legend -->
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
        {{ $t('no_activity_data') }}
      </div>
    </section>
    
    <!-- Section: Activity History -->
    <section>
      <ActivityHistory />
    </section>
  </div>
</template>

<script lang="ts">
export default {
  methods: {
    formatTime(timestamp: number): string {
      return new Date(timestamp).toLocaleTimeString('fr-FR');
    },
    formatDuration(ms: number): string {
      const totalSeconds = Math.floor(ms / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
  }
};
</script>
