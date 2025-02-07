<template>
    <NuxtPage />
</template>

<script setup lang="ts">
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { useActivityStore } from './stores/activity';
// Register Chart.js components
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.mount('#app');

const activityStore = useActivityStore();
activityStore.loadHistory();
// Start persistent tracking globally
activityStore.initPersistentTracking();
</script>
