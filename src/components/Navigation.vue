
<template>
  <nav class="bg-gray-800 text-white p-4">
    <div class="container mx-auto flex space-x-4">
      <NuxtLink to="/" class="hover:underline" active-class="underline font-bold">Home</NuxtLink>
      <NuxtLink to="/sprint" class="hover:underline" active-class="underline font-bold">Sprint</NuxtLink>
      <NuxtLink to="/activitytracker" class="hover:underline" active-class="underline font-bold">Tracker</NuxtLink>
    </div>
  </nav>
</template>

<script setup lang="ts">
// No additional script needed.
</script>