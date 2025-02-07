<template>
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Bar Chart : Activité horaire -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span class="mr-2">📊</span>
          Hourly Activity
        </h3>
        <div class="relative h-64">
          <!-- On utilise computedBarData (calculé en interne) à la place de la prop barData -->
          <Bar
            :data="computedBarData"
            :options="barOptions"
            :key="JSON.stringify(computedBarData)"
          />
        </div>
      </div>
  
      <!-- Applications Distribution -->
      <div class="bg-white rounded-lg shadow p-6">
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
  import { computed } from 'vue';
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
  
  const barOptions = props.barOptions; // On utilise les options reçues
  const chartData = props.chartData; // Chart data pour la distribution des applications
  
  // Accès au store pour récupérer l'historique complet des activités
  const activityStore = useActivityStore();
  
  // On suppose que chaque entrée d'activité possède au moins :
  // - start: number (timestamp de début)
  // - end: number (timestamp de fin)
  // - name: string (nom de l'application ou activité)
  interface Activity {
    start: number;
    end: number;
    name: string;
  }
  
  /**
   * Découpe une activité qui s'étale sur plusieurs heures en segments
   * correspondant à chaque heure.
   */
  const splitActivityIntoHours = (activity: Activity) => {
    const segments: Array<{ hour: number; duration: number }> = [];
    const endDate = new Date(activity.end);
    let currentTime = new Date(activity.start);
  
    while (currentTime < endDate) {
      // Calcul de la fin de l'heure en cours
      const nextHour = new Date(currentTime);
      nextHour.setHours(currentTime.getHours() + 1, 0, 0, 0);
      // La fin du segment est soit la fin de l'heure, soit la fin de l'activité
      const segmentEnd = nextHour < endDate ? nextHour : endDate;
      const segmentDuration = segmentEnd.getTime() - currentTime.getTime();
  
      segments.push({
        hour: currentTime.getHours(),
        duration: segmentDuration,
      });
  
      currentTime = segmentEnd;
    }
  
    return segments;
  };
  
  // Pour toutes les activités du store, on découpe chacune en segments horaires.
  const allSegments = computed(() => {
    const segments: Array<{ hour: number; duration: number }> = [];
    activityStore.history.forEach((activity: Activity) => {
      // On vérifie que l'activité a bien une date de début et de fin
      if (activity.start && activity.end) {
        segments.push(...splitActivityIntoHours(activity));
      }
    });
    return segments;
  });
  
  // Agrégation des segments par heure.
  const aggregatedByHour = computed(() => {
    const agg: Record<number, number> = {};
    allSegments.value.forEach(seg => {
      agg[seg.hour] = (agg[seg.hour] || 0) + seg.duration;
    });
    // Transformation en tableau, conversion en minutes et tri par heure
    return Object.keys(agg)
      .map(hour => ({
        hour: Number(hour),
        duration: agg[Number(hour)] / (1000 * 60), // conversion en minutes
      }))
      .sort((a, b) => a.hour - b.hour);
  });
  
  // Calcul des données à utiliser pour le graphique en barres.
  const computedBarData = computed(() => ({
    labels: aggregatedByHour.value.map(seg => `${seg.hour}:00`),
    datasets: [
      {
        label: 'Activity Duration',
        data: aggregatedByHour.value.map(seg => seg.duration),
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderRadius: 6,
      },
    ],
  }));
  
  // Fonction utilitaire pour formater une durée (en ms) en "Xh Ym"
  const formatDuration = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };
  </script>
  
  <style scoped>
  /* Ajoutez ici vos styles personnalisés si nécessaire */
  </style>
  