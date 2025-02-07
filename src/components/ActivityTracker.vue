<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useActivityStore } from '../stores/activity';
import ActivityHistory from './ActivityHistory.vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  TimeScale
} from 'chart.js';

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  TimeScale
);

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
// Set the default locale to English.
const locale = ref('en');
const isLoading = ref(true);
let intervalId: number | undefined;

// ===============================
// I18N SETUP
// ===============================
const { t, locale: i18nLocale } = useI18n();
// Set the initial i18n locale from our locale ref.
i18nLocale.value = locale.value;
// Watch for changes in the locale ref to update the i18n locale.
watch(locale, (newLocale) => {
  i18nLocale.value = newLocale;
});

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
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
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

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString(i18nLocale.value);
};

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
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

  return Object.entries(apps).map(([name, data], index) => ({
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

const longestActivity = computed(() => {
  if (filteredHistory.value.length === 0) return null;
  return filteredHistory.value.reduce((prev, cur) => {
    const prevDuration = prev.end ? prev.end - prev.start : 0;
    const curDuration = cur.end ? cur.end - cur.start : 0;
    return curDuration > prevDuration ? cur : prev;
  });
});

const mostUsedApp = computed(() => {
  if (chartData.value.length === 0) return null;
  return chartData.value.reduce(
    (max, seg) => (seg.duration > max.duration ? seg : max),
    chartData.value[0]
  );
});

const hourlyDistribution = computed(() => {
  const distribution = Array(24).fill(0);
  filteredHistory.value.forEach(entry => {
    const hour = new Date(entry.start).getHours();
    const duration = entry.end! - entry.start;
    distribution[hour] += duration;
  });
  return distribution.map((duration, hour) => ({
    hour: `${hour}:00`,
    duration
  }));
});

// ===============================
// CHART OPTIONS & DATA
// ===============================
const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: '#6B7280' }
    },
    y: {
      beginAtZero: true,
      grid: { color: '#E5E7EB' },
      ticks: { color: '#6B7280' }
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.8)',
      padding: 12,
      titleColor: '#fff',
      bodyColor: '#fff',
      cornerRadius: 8
    }
  }
};

const barData = computed(() => ({
  labels: hourlyDistribution.value.map(d => d.hour),
  datasets: [
    {
      label: 'Activity Duration',
      data: hourlyDistribution.value.map(d => d.duration),
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderRadius: 6
    }
  ]
}));

// ===============================
// LIFECYCLE HOOKS
// ===============================
onMounted(async () => {
  setTimeout(() => {
    isLoading.value = false;
  }, 1000);

  intervalId = setInterval(async () => {
    await activityStore.checkFocusedWindow();
  }, 1000);
});

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId);
});
</script>

<template>
  <div v-if="isLoading" class="min-h-screen flex items-center justify-center bg-gray-100 animate-fadeIn">
    <div class="text-center">
      <div class="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
      <p class="mt-4 text-gray-600 animate-slideIn">{{ t('loading_dashboard') }}</p>
    </div>
  </div>

  <div v-else class="min-h-screen bg-gray-50">
    <!-- Sticky Animated Header -->
    <header class="sticky top-0 z-20 bg-white shadow py-4 border-b border-gray-200 animate-slideDown">
      <div class="max-w-7xl mx-auto px-4 flex justify-between items-center">
        <h1 class="text-2xl font-semibold text-gray-900 animate-rotateIn">
          {{ t("activity_dashboard") }}
        </h1>
        <!-- Removed animation class "animate-bounce" from the select element -->
        <select
          v-model="locale"
          class="bg-gray-100 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option v-for="lang in availableLocales" :key="lang.code" :value="lang.code">
            {{ lang.label }}
          </option>
        </select>
      </div>
    </header>

    <main class="max-w-7xl mx-auto py-8 px-4 space-y-10">
      <!-- Date Filter -->
      <section class="animate-fadeIn" style="animation-delay: 200ms">
        <h2 class="text-xl font-semibold text-gray-800 mb-4">
          {{ t("filter_by_date") }}
        </h2>
        <div class="flex flex-wrap gap-3">
          <button
            v-for="filter in ['jour', 'semaine', 'mois', 'tout']"
            :key="filter"
            type="button"
            @click="dateFilter = filter"
            :class="[
              'px-5 py-2 rounded-md transition duration-200',
              dateFilter === filter
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]"
          >
            {{ t(filter) }}
          </button>
        </div>
      </section>

      <!-- Statistics Cards -->
      <section class="animate-fadeIn" style="animation-delay: 300ms">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div
            v-for="(stat, index) in [
              { label: t('total_time'), value: formatDuration(totalTrackedTime) },
              { label: t('activities_recorded'), value: totalActivities },
              { label: t('average_duration'), value: formatDuration(averageActivityDuration) }
            ]"
            :key="index"
            class="p-6 bg-white rounded-lg shadow hover:shadow-lg transition duration-200 animate-popIn"
            :style="{ animationDelay: `${(index + 1) * 100}ms` }"
          >
            <p class="text-sm text-gray-500">{{ stat.label }}</p>
            <p class="mt-2 text-3xl font-bold text-gray-900">{{ stat.value }}</p>
          </div>
        </div>
      </section>

      <!-- Charts -->
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Hourly Activity Bar Chart -->
        <div class="bg-white rounded-lg shadow p-6 animate-slideIn" style="animation-delay: 400ms">
          <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span class="mr-2">📊</span>
            {{ t("hourly_activity") }}
          </h3>
          <div class="relative h-64">
            <Bar :data="barData" :options="barOptions" />
          </div>
        </div>

        <!-- Applications Distribution -->
        <div class="bg-white rounded-lg shadow p-6 animate-slideIn" style="animation-delay: 500ms">
          <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <span class="mr-2">📈</span>
            {{ t("applications_distribution") }}
          </h3>
          <div v-if="chartData.length">
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div
                v-for="segment in chartData"
                :key="segment.name"
                class="flex items-center p-4 bg-gray-50 rounded-md shadow-sm hover:shadow transition duration-200 animate-popIn"
                style="animation-delay: 600ms"
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
            {{ t("no_activity_data") }}
          </div>
        </div>
      </section>

      <!-- Activity History -->
      <section class="animate-fadeIn" style="animation-delay: 700ms">
        <ActivityHistory />
      </section>
    </main>
  </div>
</template>

<style scoped>
/* Base animations */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes slideDown {
  from { transform: translateY(-100%); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

@keyframes popIn {
  from { transform: scale(0.9); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-10px); }
  60% { transform: translateY(-5px); }
}

@keyframes rotateIn {
  from { transform: rotate(-15deg); opacity: 0; }
  to { transform: rotate(0deg); opacity: 1; }
}

/* Apply animation classes */
.animate-fadeIn {
  animation: fadeIn 1s ease forwards;
}

.animate-slideIn {
  animation: slideIn 0.8s ease forwards;
}

.animate-slideDown {
  animation: slideDown 0.8s ease forwards;
}

.animate-popIn {
  animation: popIn 0.6s ease forwards;
}

/* Removed .animate-bounce usage from the language button */

/* Additional styling */
button {
  outline: none;
}

button:focus {
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.hover\:scale:hover {
  transform: scale(1.02);
}

footer {
  padding: 1rem;
  text-align: center;
  color: #6B7280;
  font-size: 0.875rem;
  border-top: 1px solid #E5E7EB;
  margin-top: 2rem;
}
</style>
