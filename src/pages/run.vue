<template>
  <div class="min-h-screen flex flex-col items-center justify-center p-6">
    <!-- Timer; remains in DOM but hidden after run is finished -->
    <div v-show="runStarted && !runFinished">
      <Timer @finish="finishRun" />
    </div>

    <!-- Summary displayed when run finished -->
    <div v-show="runFinished" class="w-full max-w-5xl p-6 bg-white rounded shadow">
      <ActivityStats 
        :totalTrackedTime="summary.totalDuration" 
        :totalActivities="summary.activitiesCount" 
        :averageActivityDuration="summary.averageDuration" 
      />
      <ActivityCharts :barData="barData" :barOptions="barOptions" :chartData="chartData" />
      <ActivityHistory :entries="runHistory" />
      <button @click="resetRun" class="mt-4 w-full bg-blue-600 text-white p-2 rounded">Nouveau Run</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Timer from '../components/Timer.vue';
import ActivityStats from '../components/ActivityStats.vue';
import ActivityCharts from '../components/ActivityCharts.vue';
import ActivityHistory from '../components/ActivityHistory.vue';
import { useActivityStore } from '../stores/activity';

const runStarted = ref(false);
const runFinished = ref(false);
const runStart = ref(0);
const runEnd = ref(0);

const activityStore = useActivityStore();

const startRun = () => {
  runStart.value = Date.now();
  runStarted.value = true;
  runFinished.value = false;
};

const finishRun = () => {
  runEnd.value = Date.now();
  runFinished.value = true;
  runStarted.value = false;
  // Record the run including the date property
  activityStore.recordRun({
    date: runStart.value, // new run date
    start: runStart.value,
    end: runEnd.value,
    activities: runHistory.value,
    summary: summary.value
  });
};

const resetRun = () => {
  runStarted.value = false;
  runFinished.value = false;
  startRun();
};

onMounted(() => {
  startRun();
  // Removed local interval; persistent tracking is now global via App.vue.
});

const runHistory = computed(() =>
  activityStore.history.filter(entry => entry.start >= runStart.value && entry.start <= runEnd.value)
);

const summary = computed(() => {
  const activities = runHistory.value;
  const activitiesCount = activities.length;
  const totalDuration = activities.reduce((sum, entry) => {
    const endTime = entry.end ? Math.min(entry.end, runEnd.value) : runEnd.value;
    return sum + (endTime - entry.start);
  }, 0);
  const averageDuration = activitiesCount ? totalDuration / activitiesCount : 0;
  return { activitiesCount, totalDuration, averageDuration };
});

// ...existing chart computation code...
const hourlyDistribution = computed(() => {
  const distribution = Array(24).fill(0);
  runHistory.value.forEach(entry => {
    const hour = new Date(entry.start).getHours();
    distribution[hour] += entry.end ? entry.end - entry.start : 0;
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

// Use Tailwind color classes similar to ActivityTracker
const APP_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-purple-500',
  'bg-pink-500',
  'bg-indigo-500',
  'bg-cyan-500'
];

const chartData = computed(() => {
  if (!runHistory.value.length) return [];
  const totalDuration = runHistory.value.reduce((sum, entry) => {
    const duration = entry.end ? entry.end - entry.start : 0;
    return sum + duration;
  }, 0);
  const apps = runHistory.value.reduce((acc, entry) => {
    const duration = entry.end ? entry.end - entry.start : 0;
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
</script>

<style scoped>
/* ...existing styles... */
table {
  border-collapse: collapse;
}
th, td {
  padding: 0.5rem;
}
th {
  text-align: left;
}
</style>
