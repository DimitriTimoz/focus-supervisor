<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useActivityStore } from '../stores/activity';
import ActivityHistory from './ActivityHistory.vue';
import { Bar } from 'vue-chartjs'
import { Chart as ChartJS, Title, Tooltip, Legend, ArcElement, BarElement, CategoryScale, LinearScale, TimeScale } from 'chart.js'

ChartJS.register(Title, Tooltip, Legend, ArcElement, BarElement, CategoryScale, LinearScale, TimeScale)

// ===============================
// CONSTANTES & DONNÉES
// ===============================
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
  'bg-violet-500'
];

const availableLocales = [
  { code: 'en', label: 'English' },
  { code: 'fr', label: 'Français' }
];

// ===============================
// ÉTATS RÉACTIFS & STORES
// ===============================
const activityStore = useActivityStore();
const dateFilter = ref<'jour' | 'semaine' | 'mois' | 'tout'>('jour');
const locale = ref('en'); // Liaison avec le sélecteur de langue

// ===============================
// FONCTIONS UTILITAIRES
// ===============================
const computeStartDateForFilter = (): number => {
  const now = new Date();
  switch (dateFilter.value) {
    case 'jour': {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      return startOfDay.getTime();
    }
    case 'semaine': {
      const dayOfWeek = now.getDay();
      const diff = (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
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
};

// ===============================
// PROPRIÉTÉS CALCULÉES
// ===============================
const startDateForFilter = computed(() => computeStartDateForFilter());

const filteredHistory = computed(() => {
  if (dateFilter.value === 'tout') return activityStore.history;
  const startTimestamp = startDateForFilter.value;
  return activityStore.history.filter(entry => entry.start >= startTimestamp);
});

const chartData = computed(() => {
  if (!filteredHistory.value.length) return [];
  
  const totalDuration = filteredHistory.value.reduce(
    (sum, entry) => sum + (entry.end! - entry.start),
    0
  );
  
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

  return Object.entries(apps)
    .map(([name, data], index) => ({
      name,
      percentage: Math.round((data.duration / totalDuration) * 100),
      duration: data.duration,
      count: data.count,
      color: APP_COLORS[index % APP_COLORS.length]
    }));
});

const totalTrackedTime = computed(() =>
  filteredHistory.value.reduce((sum, entry) => sum + (entry.end! - entry.start), 0)
);
const totalActivities = computed(() => filteredHistory.value.length);
const averageActivityDuration = computed(() =>
  totalActivities.value > 0 ? totalTrackedTime.value / totalActivities.value : 0
);

// -------------------------------
// Nouvelles statistiques :
// -------------------------------
// Longest Activity : recherche l'activité ayant la plus longue durée
const longestActivity = computed(() => {
  if (filteredHistory.value.length === 0) return null;
  return filteredHistory.value.reduce((prev, cur) => {
    const prevDuration = prev.end ? prev.end - prev.start : 0;
    const curDuration = cur.end ? cur.end - cur.start : 0;
    return curDuration > prevDuration ? cur : prev;
  });
});

// Most Used App : recherche l'application avec la durée totale la plus élevée
const mostUsedApp = computed(() => {
  if (chartData.value.length === 0) return null;
  return chartData.value.reduce((max, seg) => seg.duration > max.duration ? seg : max, chartData.value[0]);
});


// ===============================
// BOUCLE D'ACTUALISATION
// ===============================
let intervalId: NodeJS.Timeout;
onMounted(() => {
  intervalId = setInterval(async () => {
    await activityStore.checkFocusedWindow();
  }, 1000);
});
onUnmounted(() => {
  clearInterval(intervalId);
});

const hourlyDistribution = computed(() => {
  const distribution = Array(24).fill(0)
  
  filteredHistory.value.forEach(entry => {
    const hour = new Date(entry.start).getHours()
    const duration = entry.end! - entry.start
    distribution[hour] += duration
  })

  return distribution.map((duration, hour) => ({
    hour: `${hour}:00`,
    duration
  }))
})



const barOptions = ref({
  responsive: true,
  scales: {
  }
});

const doughnutData = computed(() => ({
  labels: chartData.value.map(d => d.name),
  datasets: [{
    data: chartData.value.map(d => d.duration),
    backgroundColor: chartData.value.map(d => d.color.replace('bg-', '')).map(c => 
      getComputedStyle(document.documentElement).getPropertyValue(`--${c}`) || c
    )
  }]
}))

const barData = computed(() => ({
  datasets: [{
    label: 'Activity Duration',
    data: hourlyDistribution.value.map(d => ({
      x: new Date().setHours(parseInt(d.hour.split(':')[0]), 0, 0, 0),
      y: d.duration
    })),
    backgroundColor: '#3B82F6'
  }]
}))

</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- En-tête -->
    <header class="bg-white shadow-sm">
      <div class="container mx-auto py-4 px-6 flex justify-between items-center">
        <h1 class="text-3xl font-bold text-gray-800">{{ $t("activity_dashboard") }}</h1>
        <!-- Sélecteur de langue -->
        <div>
          <select v-model="locale" class="border border-gray-300 rounded px-3 py-1 focus:outline-blue-500">
            <option v-for="lang in availableLocales" :key="lang.code" :value="lang.code">
              {{ lang.label }}
            </option>
          </select>
        </div>
      </div>
    </header>

    <main class="container mx-auto py-6 px-6 space-y-12">
      <!-- Section: Filtrer par dates -->
      <section>
        <h2 class="text-2xl font-bold text-gray-800 mb-4">{{ $t('filter_by_date') }}</h2>
        <div class="flex flex-wrap gap-2">
          <button 
            @click="dateFilter = 'jour'" 
            :class="['transition-colors duration-300 px-4 py-2 rounded', dateFilter === 'jour' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700']">
            {{ $t('day') }}
          </button>
          <button 
            @click="dateFilter = 'semaine'" 
            :class="['transition-colors duration-300 px-4 py-2 rounded', dateFilter === 'semaine' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700']">
            {{ $t('week') }}
          </button>
          <button 
            @click="dateFilter = 'mois'" 
            :class="['transition-colors duration-300 px-4 py-2 rounded', dateFilter === 'mois' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700']">
            {{ $t('month') }}
          </button>
          <button 
            @click="dateFilter = 'tout'" 
            :class="['transition-colors duration-300 px-4 py-2 rounded', dateFilter === 'tout' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700']">
            {{ $t('all_periods') }}
          </button>
        </div>
      </section>
      <section>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="stats-card bg-gradient-to-br from-blue-50 to-blue-100">
            <div class="text-blue-600">
              <ClockIcon class="h-6 w-6" />
            </div>
            <div>
              <p class="stat-label">{{ $t('total_time') }}</p>
              <p class="stat-value">{{ formatDuration(totalTrackedTime) }}</p>
            </div>
          </div>
          <!-- Repeat similar structure for other stats -->
        </div>
      </section>
        <!-- Chart Section -->
        <section class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div class="chart-container">
            <h3 class="text-lg font-semibold mb-4">{{ $t('hourly_activity') }}</h3>
            <div class="chart-wrapper">
                <Bar :data="barData" :options="barOptions" />
            </div>
            </div>
        </section>

      <!-- Section: Statistiques globales -->
      <section>
        <h2 class="text-2xl font-bold text-gray-800 mb-6">{{ $t('global_statistics') }}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
            <p class="text-sm text-gray-500">{{ $t('total_time') }}</p>
            <p class="mt-1 text-xl font-semibold text-gray-700">{{ formatDuration(totalTrackedTime) }}</p>
          </div>
          <div class="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
            <p class="text-sm text-gray-500">{{ $t('activities_recorded') }}</p>
            <p class="mt-1 text-xl font-semibold text-gray-700">{{ totalActivities }}</p>
          </div>
          <div class="p-6 bg-white rounded-lg shadow hover:shadow-lg transition-shadow duration-300">
            <p class="text-sm text-gray-500">{{ $t('average_duration') }}</p>
            <p class="mt-1 text-xl font-semibold text-gray-700">{{ formatDuration(averageActivityDuration) }}</p>
          </div>
        </div>
      </section>

      <!-- Section: Répartition des applications -->
      <section>
        <h2 class="text-2xl font-bold text-gray-800 mb-6">{{ $t('applications_distribution') }}</h2>
        <div v-if="chartData.length" class="space-y-8">
          <!-- Progression -->
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
              class="flex items-center space-x-3 p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition duration-300"
            >
              <div :class="segment.color" class="w-4 h-4 rounded-full flex-shrink-0"></div>
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
          {{ $t('no_activity_data') }}
        </div>
      </section>

      <!-- Section: Statistiques et fonctionnalités supplémentaires -->
      <section>
        <h2 class="text-2xl font-bold text-gray-800 mb-6">Stats & Features</h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-300">
            <p class="text-sm text-gray-500">Plus longue activité:</p>
            <p class="mt-1 text-lg font-semibold text-gray-700">
              <span v-if="longestActivity">
                {{ formatDuration(longestActivity.end ? (longestActivity.end - longestActivity.start) : 0) }}
                <small class="text-xs text-gray-500">({{ longestActivity.title }})</small>
              </span>
              <span v-else>-</span>
            </p>
          </div>
          <div class="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-300">
            <p class="text-sm text-gray-500">Application la plus utilisée:</p>
            <p class="mt-1 text-lg font-semibold text-gray-700">
              <span v-if="mostUsedApp">
                {{ mostUsedApp.name }} ({{ formatDuration(mostUsedApp.duration) }})
              </span>
              <span v-else>-</span>
            </p>
          </div>
        </div>
      </section>

      <!-- Section: Historique d'activité -->
      <section>
        <ActivityHistory />
      </section>
    </main>
  </div>
</template>

<!-- Script classique pour définir quelques méthodes utilitaires -->
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
