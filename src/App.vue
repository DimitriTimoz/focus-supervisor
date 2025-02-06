<template>
    <NuxtPage />
</template>

<script setup lang="ts">
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { useActivityStore } from './stores/activity';

import App from './App.vue';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.mount('#app');

const activityStore = useActivityStore();
activityStore.loadHistory();
</script>
