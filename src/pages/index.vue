<script setup lang="ts">
import { onMounted } from 'vue';
import { useActivityStore } from '../stores/activity';

const activityStore = useActivityStore();
onMounted(() => {
  activityStore.loadSprints();
});
</script>

<template>
  <main class="min-h-screen bg-gradient-to-br from-blue-500 to-indigo-700 flex flex-col items-center justify-center space-y-8">
    <h1 class="text-4xl text-white font-bold">Bienvenue sur Activity Sprint Tracker</h1>
    <div class="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-6">
      <a href="/sprint" class="px-8 py-4 bg-white text-blue-600 rounded shadow text-xl font-semibold hover:bg-gray-100 transition">
        Lancer un Sprint
      </a>
      <a href="/activitytracker" class="px-8 py-4 bg-white text-blue-600 rounded shadow text-xl font-semibold hover:bg-gray-100 transition">
        Voir le Tracker
      </a>
    </div>
  </main>
</template>

<style scoped>
/* ...styles supplémentaires si besoin... */
</style>
