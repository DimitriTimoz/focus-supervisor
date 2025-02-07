<template>
    <div class="activity-wrapper">
      <h2>{{ $t("history") }}</h2>
      
      <!-- Zone défilable avec hauteur max pour protéger l'UI en cas de liste trop longue -->
      <div class="activity-list-wrapper">
        <ul class="activity-list">
          <li 
            v-for="entry in paginatedHistory" 
            :key="entry.start" 
            class="activity-item"
          >
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
  
      <!-- Pagination -->
      <div class="pagination">
        <button 
          :disabled="currentPage === 1" 
          @click="prevPage"
        >
          {{ $t("previous") }}
        </button>
        <span>Page {{ currentPage }} {{ $t("of") }} {{ totalPages }}</span>
        <button 
          :disabled="currentPage === totalPages" 
          @click="nextPage"
        >
          {{ $t("next") }}
        </button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { computed, ref } from 'vue';

  interface ActivityEntry {
    name: string;
    title: string;
    start: number;
    end: number | null;
  }
  
  const props = defineProps<{
    entries: ActivityEntry[]
  }>();
  
  // Use the provided entries prop
  const history = computed(() => props.entries || []);
  
  // Pagination
  const itemsPerPage = 10;
  const currentPage = ref(1);
  const totalPages = computed(() => Math.ceil(history.value.length / itemsPerPage));
  const paginatedHistory = computed(() => {
    const start = (currentPage.value - 1) * itemsPerPage;
    const end = currentPage.value * itemsPerPage;
    return history.value.slice(start, end);
  });
  
  function prevPage() {
    if (currentPage.value > 1) currentPage.value--;
  }
  
  function nextPage() {
    if (currentPage.value < totalPages.value) currentPage.value++;
  }
  
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
  
  /* Zone contenant la liste avec une hauteur max scrollable */
  .activity-list-wrapper {
    max-height: 400px;
    overflow-y: auto;
    margin-bottom: 10px;
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
  
  /* Styles pour la pagination */
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }
  
  .pagination button {
    padding: 6px 12px;
    border: none;
    background-color: #007bff;
    color: #fff;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
  }
  
  .pagination button:disabled {
    opacity: 0.5;
    cursor: default;
  }
  
  .pagination button:not(:disabled):hover {
    background-color: #0056b3;
  }
  </style>
