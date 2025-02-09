<template>
  <div v-if="isLoading" class="min-h-screen flex items-center justify-center bg-gray-100">
    <!-- ...existing loader... -->
    <p>{{ t('loading_dashboard') }}</p>
  </div>
  <div v-else class="min-h-screen bg-gray-50">
    <ActivityHeader :locale="locale" @update:locale="locale = $event" />
    <main class="max-w-7xl mx-auto py-8 px-4 space-y-10">
      <section>
        <ActivityDateFilter :currentFilter="dateFilter" @update:filter="dateFilter = $event" />
      </section>
      <section>
        <ActivityStats
          :totalTrackedTime="totalTrackedTime"
          :totalActivities="totalActivities"
          :averageActivityDuration="averageActivityDuration"
        />
      </section>
      <section>
        <ActivityCharts 
          :barData="barData" 
          :barOptions="barOptions" 
          :chartData="chartData" 
          :key="dateFilter" 
        />
      </section>
      <section>
        <!-- Pass filtered history to ActivityHistory -->
        <ActivityHistory :entries="filteredHistory" />
      </section>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import ActivityHeader from '../components/ActivityHeader.vue';
import ActivityDateFilter from '../components/ActivityDateFilter.vue';
import ActivityStats from '../components/ActivityStats.vue';
import ActivityCharts from '../components/ActivityCharts.vue';
import ActivityHistory from '../components/ActivityHistory.vue';
import Timer from '../components/Timer.vue';
import { useActivityStore } from '../stores/activity';
import { Bar } from 'vue-chartjs'; // Déjà utilisé dans ActivityCharts

// ===============================
// ETATS ET I18N
// ===============================
const { t, locale: i18nLocale } = useI18n();
const locale = ref('en');
i18nLocale.value = locale.value;
watch(locale, (newLocale) => { // added watcher to update i18n locale on change
  i18nLocale.value = newLocale;
});

const dateFilter = ref<'jour' | 'semaine' | 'mois' | 'tout'>('jour');
const isLoading = ref(true);

// ===============================
// ACTIVITÉ STORE & CALCULS
// ===============================
const activityStore = useActivityStore();

const computeStartDateForFilter = (): number => {
  const now = new Date();
  switch (dateFilter.value) {
    case 'jour': {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      return startOfDay.getTime();
    }
    case 'semaine': {
      const diff = now.getDay() === 0 ? 6 : now.getDay() - 1;
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

const startDateForFilter = computed(() => computeStartDateForFilter());

const filteredHistory = computed(() => {
  if (dateFilter.value === 'tout') return activityStore.history;
  return activityStore.history.filter(entry => entry.start >= startDateForFilter.value);
});

const totalTrackedTime = computed(() =>
  filteredHistory.value.reduce((sum, entry) => sum + (entry.end! - entry.start), 0)
);
const totalActivities = computed(() => filteredHistory.value.length);
const averageActivityDuration = computed(() =>
  totalActivities.value > 0 ? totalTrackedTime.value / totalActivities.value : 0
);

// ===============================
// CHART DATA
// ===============================
const hourlyDistribution = computed(() => {
  const distribution = Array(24).fill(0);
  filteredHistory.value.forEach(entry => {
    const hour = new Date(entry.start).getHours();
    distribution[hour] += entry.end! - entry.start;
  });
  return distribution.map((duration, hour) => ({
    hour: `${hour}:00`,
    duration
  }));
});

const barOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: { grid: { display: false }, ticks: { color: '#6B7280' } },
    y: { beginAtZero: true, grid: { color: '#E5E7EB' }, ticks: { color: '#6B7280' } }
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
    { label: 'Activity Duration', data: hourlyDistribution.value.map(d => d.duration), backgroundColor: 'rgba(59, 130, 246, 0.8)', borderRadius: 6 }
  ]
}));

const APP_COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-cyan-500'
];
const chartData = computed(() => {
  if (!filteredHistory.value.length) return [];
  const totalDuration = filteredHistory.value.reduce((sum, entry) => sum + (entry.end! - entry.start), 0);
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
    duration: data.duration,
    percentage: Math.round((data.duration / totalDuration) * 100),
    color: APP_COLORS[index % APP_COLORS.length]
  }));
});

// ===============================
// LIFECYCLE
// ===============================
let intervalId: number | undefined;
onMounted(() => {
  setTimeout(() => isLoading.value = false, 1000);
  intervalId = setInterval(async () => {
    await activityStore.checkFocusedWindow();
  }, 1000);
});
onUnmounted(() => { if (intervalId) clearInterval(intervalId); });
</script>

<style scoped>
  /* ...existing styles... */
</style>
