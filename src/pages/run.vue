<template>
  <!-- Timer centré -->
  <div class="flex justify-center w-full max-w-5xl mb-6">
    <Timer @finish="finishRun" />
  </div>

  <div class="min-h-screen flex flex-col items-center justify-center p-6">
    <h2 class="text-xl font-bold mb-4">Historique des runs persistants</h2>
    <!-- Section: Sélection et détails du run -->
    <section class="w-full max-w-5xl p-6 bg-white rounded shadow mb-6">
      <h2 class="text-xl font-bold mb-4">Sélectionnez un run pour voir ses détails</h2>
      <!-- Ajout du modificateur .number pour convertir la valeur en nombre -->
      <select v-model.number="selectedRunDate" class="p-2 border rounded w-full">
        <option disabled :value="null">-- Choisissez un run --</option>
        <option v-for="run in filteredRunHistoryList" :key="run.date" :value="run.date">
          {{ new Date(run.date).toLocaleString() }}
        </option>
      </select>
    </section>

    <!-- Section: Affichage des stats uniquement si le timer est terminé -->
    <div v-if="displayedRun" class="w-full max-w-5xl p-6 bg-white rounded shadow">
      <ActivityStats 
        :totalTrackedTime="displayedRun.summary.totalDuration" 
        :totalActivities="displayedRun.summary.activitiesCount" 
        :averageActivityDuration="displayedRun.summary.averageDuration" 
      />
      <ActivityCharts 
        :barData="displayedRunBarData" 
        :barOptions="barOptions" 
        :chartData="displayedRunChartData" 
      />
      <ActivityHistory :entries="displayedRun.activities" />
      <button @click="resetRun" class="mt-4 w-full bg-blue-600 text-white p-2 rounded">
        Nouveau Run
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Timer from '../components/Timer.vue';
import ActivityStats from '../components/ActivityStats.vue';
import ActivityCharts from '../components/ActivityCharts.vue';
import ActivityHistory from '../components/ActivityHistory.vue';
import ActivityDateFilter from '../components/ActivityDateFilter.vue';
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
  activityStore.loadRuns(); // Chargement des runs lors du montage du composant
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

// PROPRIÉTÉS pour la sélection d'un run persistent
const selectedRunDate = ref<number | null>(null);
const selectedRun = computed(() =>
  selectedRunDate.value !== null
    ? activityStore.runs.find(run => run.date === selectedRunDate.value) || null
    : null
);

const runHistoryList = computed(() => activityStore.runs);

// Nouvelle propriété : filtrer l'historique persistant selon une date
const runsDateFilter = ref<'jour' | 'semaine' | 'mois' | 'tout'>('tout');
const computeStartDateForRunFilter = (): number => {
  const now = new Date();
  switch (runsDateFilter.value) {
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

const filteredRunHistoryList = computed(() => {
  if (runsDateFilter.value === 'tout') return runHistoryList.value;
  const startDate = computeStartDateForRunFilter();
  return runHistoryList.value.filter(run => run.date >= startDate);
});

// Nouvelle propriété: répartition des applications pour le run sélectionné
const selectedRunChartData = computed(() => {
  if (!selectedRun.value) return [];
  const activities = selectedRun.value.activities;
  const totalDuration = activities.reduce((sum, entry) => {
    const duration = entry.end ? entry.end - entry.start : 0;
    return sum + duration;
  }, 0);
  const apps = activities.reduce((acc, entry) => {
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
    percentage: totalDuration ? Math.round((data.duration / totalDuration) * 100) : 0,
    color: APP_COLORS[index % APP_COLORS.length]
  }));
});

// Propriété "displayedRun" : si le timer vient de finir, on affiche le dernier run enregistré, sinon celui sélectionné
const displayedRun = computed(() => {
  return selectedRun.value || (activityStore.runs.length ? activityStore.runs[activityStore.runs.length - 1] : null);
});

// Calcul des données graphiques à partir du run affiché
const displayedRunHourlyDistribution = computed(() => {
  if (!displayedRun.value) return [];
  const distribution = Array(24).fill(0);
  displayedRun.value.activities.forEach(entry => {
    const hour = new Date(entry.start).getHours();
    distribution[hour] += entry.end ? entry.end - entry.start : 0;
  });
  return distribution.map((duration, hour) => ({
    hour: `${hour}:00`,
    duration
  }));
});

const displayedRunBarData = computed(() => ({
  labels: displayedRunHourlyDistribution.value.map(d => d.hour),
  datasets: [
    { 
      label: 'Activity Duration', 
      data: displayedRunHourlyDistribution.value.map(d => d.duration), 
      backgroundColor: 'rgba(59, 130, 246, 0.8)', 
      borderRadius: 6 
    }
  ]
}));

const displayedRunChartData = computed(() => {
  if (!displayedRun.value) return [];
  const activities = displayedRun.value.activities;
  const totalDuration = activities.reduce((sum, entry) => {
    const duration = entry.end ? entry.end - entry.start : 0;
    return sum + duration;
  }, 0);
  const apps = activities.reduce((acc, entry) => {
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
    percentage: totalDuration ? Math.round((data.duration / totalDuration) * 100) : 0,
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
