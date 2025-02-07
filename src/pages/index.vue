<script setup lang="ts">
import { onMounted } from 'vue';
import { useActivityStore } from '../stores/activity';

const activityStore = useActivityStore();
onMounted(() => {
  activityStore.loadRuns();
});
</script>

<template>
  <main class="container">
    <a href="/run" class="btn">Run</a>
    <a href="/activitytracker" class="btn">Tracker</a>
  </main>
</template>
