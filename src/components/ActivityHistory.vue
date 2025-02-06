<template>
    <div class="activity-wrapper">
      <h2>Historique des Activités</h2>
      <ul class="activity-list">
        <li v-for="entry in history" :key="entry.start" class="activity-item">
          <div class="entry-header">
            {{ entry.title }} <small>({{ entry.name }})</small>
          </div>
          <div class="entry-times">
            <span>{{ formatTime(entry.start) }}</span> -
            <span>{{ entry.end ? formatTime(entry.end) : 'En cours' }}</span>
          </div>
        </li>
      </ul>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue';
  import { useActivityStore } from '../stores/activity'; 
  
  const activityStore = useActivityStore();
  
  const history = computed(() => activityStore.history);
  
  function formatTime(timestamp: number): string {
    return new Date(timestamp).toLocaleTimeString();
  }
  </script>
  
  <style scoped>
  .activity-wrapper {
    margin: 20px;
    padding: 10px;
    background-color: #f9f9f9;
    border-radius: 8px;
  }
  
  .activity-list {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  
  .activity-item {
    margin: 8px 0;
    padding: 10px;
    border: 1px solid #ddd;
    border-radius: 6px;
    background-color: #fff;
  }
  
  .entry-header {
    font-size: 14px;
    font-weight: bold;
    margin-bottom: 4px;
  }
  
  .entry-times {
    font-size: 12px;
    color: #666;
  }
  </style>
  