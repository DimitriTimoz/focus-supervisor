<template>
  <NuxtPage />
</template>

<script setup lang="ts">
import { useActivityStore } from './stores/activity';

const activityStore = useActivityStore();
activityStore.loadHistory();
activityStore.initPersistentTracking();
</script>
