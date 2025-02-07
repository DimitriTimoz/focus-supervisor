<template>
  <div class="min-h-screen bg-gray-100">
    <!-- Header fixe avec titre et bouton pour lancer la configuration du Timer -->
    <header class="bg-blue-600 text-white p-4 flex flex-col md:flex-row md:items-center md:justify-between">
      <h1 class="text-2xl font-bold mb-4 md:mb-0">Activity Sprint Tracker</h1>
      <div class="flex items-center space-x-4">
        <button
          @click="openTimerSetup"
          class="bg-white text-blue-600 px-4 py-2 rounded shadow hover:bg-blue-50 transition"
        >
          Nouveau Sprint
        </button>
      </div>
    </header>

    <!-- Contenu principal -->
    <main class="container mx-auto p-6">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Colonne gauche : Historique et filtres -->
        <aside class="md:col-span-1 bg-white p-4 rounded shadow">
          <h2 class="text-xl font-semibold mb-4">Historique des Sprints</h2>
          <!-- Filtre de période -->
          <div class="mb-4">
            <label for="dateFilter" class="block font-medium mb-1">Filtrer par période :</label>
            <select
              id="dateFilter"
              v-model="sprintsDateFilter"
              class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="jour">Jour</option>
              <option value="semaine">Semaine</option>
              <option value="mois">Mois</option>
              <option value="tout">Tout</option>
            </select>
          </div>
          <!-- Sélection d'un sprint -->
          <div>
            <label for="sprintSelect" class="block font-medium mb-1">Sélectionnez un sprint :</label>
            <select
              id="sprintSelect"
              v-model.number="selectedSprintDate"
              class="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option disabled :value="null">-- Choisissez un sprint --</option>
              <option
                v-for="sprint in filteredSprintHistoryList"
                :key="sprint.date"
                :value="sprint.date"
              >
                {{ new Date(sprint.date).toLocaleString() }}
              </option>
            </select>
            <ActivityHistory v-if="displayedSprint" :entries="displayedSprint.activities" />
          </div>
        </aside>

        <!-- Colonne droite : Détails du sprint (stats, graphiques et historique) -->
        <section class="md:col-span-2 bg-white p-6 rounded shadow">
          <div v-if="displayedSprint">
            <h2 class="text-2xl font-bold mb-4">Détails du Sprint</h2>
            <ActivityStats 
              :totalTrackedTime="displayedSprint.summary.totalDuration" 
              :totalActivities="displayedSprint.summary.activitiesCount" 
              :averageActivityDuration="displayedSprint.summary.averageDuration" 
            />
            <div class="mt-6 gap-6">
              <!-- Graphique d'activités -->
              <div class="bg-gray-50 p-4 rounded shadow">
                <ActivityCharts 
                  :barData="displayedSprintBarData" 
                  :barOptions="barOptions" 
                  :chartData="displayedSprintChartData" 
                />
              </div>
            </div>
          </div>
          <div v-else class="text-center text-gray-500">
            Aucune donnée de sprint disponible.
          </div>
        </section>
      </div>
    </main>

    <!-- Modale de configuration du Timer -->
    <div v-if="showTimerSetup" class="fixed inset-0 flex items-center justify-center z-50">
      <!-- Fond semi-transparent -->
      <div class="absolute inset-0 bg-black opacity-50"></div>
      <!-- Contenu de la modale -->
      <div class="bg-white rounded-lg shadow-lg z-10 p-6 w-80 relative">
        <!-- Bouton de fermeture -->
        <button
          @click="closeTimerSetup"
          class="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl"
        >
          &times;
        </button>
        <h2 class="text-xl font-semibold mb-4 text-center">Configuration du Timer</h2>
        <!-- Timer centré avec dimensions adaptées (120px par 120px) -->
        <div class="relative mx-auto">
          <Timer @finish="finishSprint" class="w-full h-full" />
        </div>
        <!-- Le bouton "Démarrer le Sprint" a été supprimé -->
      </div>
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

// ----------------- Gestion du Sprint -----------------
const sprintStarted = ref(false);
const sprintFinished = ref(false);
const sprintStart = ref(0);
const sprintEnd = ref(0);

const activityStore = useActivityStore();

// Démarre le sprint en initialisant l'heure de début
const startSprint = () => {
  sprintStart.value = Date.now();
  sprintStarted.value = true;
  sprintFinished.value = false;
};

// Appelé lorsque le Timer se termine
const finishSprint = () => {
  sprintEnd.value = Date.now();
  sprintFinished.value = true;
  sprintStarted.value = false;
  // Enregistrement du sprint avec ses données
  activityStore.recordSprint({
    date: sprintStart.value,
    start: sprintStart.value,
    end: sprintEnd.value,
    activities: sprintHistory.value,
    summary: summary.value
  });
  // Fermeture automatique de la modale une fois le sprint terminé
  closeTimerSetup();
};

// Réinitialise le sprint et démarre un nouveau sprint
const resetSprint = () => {
  sprintStarted.value = false;
  sprintFinished.value = false;
  startSprint();
};

onMounted(() => {
  activityStore.loadSprints(); // Chargement des sprints enregistrés
});

// ----------------- Gestion de la modale du Timer -----------------
const showTimerSetup = ref(false);

const openTimerSetup = () => {
  resetSprint(); // Démarrage d'un nouveau sprint dès l'ouverture de la modale
  showTimerSetup.value = true;
};

const closeTimerSetup = () => {
  showTimerSetup.value = false;
};

// ----------------- Graphiques et statistiques -----------------
const sprintHistory = computed(() =>
  activityStore.history.filter(
    entry => entry.start >= sprintStart.value && entry.start <= sprintEnd.value
  )
);

const summary = computed(() => {
  const activities = sprintHistory.value;
  const activitiesCount = activities.length;
  const totalDuration = activities.reduce((sum, entry) => {
    const endTime = entry.end ? Math.min(entry.end, sprintEnd.value) : sprintEnd.value;
    return sum + (endTime - entry.start);
  }, 0);
  const averageDuration = activitiesCount ? totalDuration / activitiesCount : 0;
  return { activitiesCount, totalDuration, averageDuration };
});

const hourlyDistribution = computed(() => {
  const distribution = Array(24).fill(0);
  sprintHistory.value.forEach(entry => {
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

const displayedSprintBarData = computed(() => {
  if (!displayedSprint.value) return {};
  const distribution = Array(24).fill(0);
  displayedSprint.value.activities.forEach(entry => {
    const hour = new Date(entry.start).getHours();
    distribution[hour] += entry.end ? entry.end - entry.start : 0;
  });
  return {
    labels: distribution.map((_, hour) => `${hour}:00`),
    datasets: [
      {
        label: 'Activity Duration',
        data: distribution,
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 6
      }
    ]
  };
});

// Palette de couleurs pour les graphiques
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

const displayedSprintChartData = computed(() => {
  if (!displayedSprint.value) return [];
  const activities = displayedSprint.value.activities;
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

// ----------------- Gestion de l'historique persistant -----------------
const selectedSprintDate = ref<number | null>(null);
const selectedSprint = computed(() =>
  selectedSprintDate.value !== null
    ? activityStore.sprints.find(sprint => sprint.date === selectedSprintDate.value) || null
    : null
);

const sprintHistoryList = computed(() => activityStore.sprints);

const sprintsDateFilter = ref<'jour' | 'semaine' | 'mois' | 'tout'>('tout');
const computeStartDateForSprintFilter = (): number => {
  const now = new Date();
  switch (sprintsDateFilter.value) {
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

const filteredSprintHistoryList = computed(() => {
  if (sprintsDateFilter.value === 'tout') return sprintHistoryList.value;
  const startDate = computeStartDateForSprintFilter();
  return sprintHistoryList.value.filter(sprint => sprint.date >= startDate);
});

const displayedSprint = computed(() => {
  return selectedSprint.value || (activityStore.sprints.length ? activityStore.sprints[activityStore.sprints.length - 1] : null);
});
</script>

<style scoped>
body {
  font-family: 'Inter', sans-serif;
}

select:focus,
button:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}
</style>
