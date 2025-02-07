<template>
    <div class="timer-app">
      <!-- Conteneur pour l'affichage circulaire et le timer -->
      <div class="circle-timer">
        <svg class="progress-ring" width="220" height="220">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" style="stop-color:#4caf50; stop-opacity:1" />
              <stop offset="100%" style="stop-color:#43a047; stop-opacity:1" />
            </linearGradient>
          </defs>
          <!-- Cercle de fond -->
          <circle
            class="progress-ring__background"
            :r="circleRadius"
            cx="110"
            cy="110"
            stroke-width="14"
          />
          <!-- Cercle de progression -->
          <circle
            class="progress-ring__progress"
            :r="circleRadius"
            cx="110"
            cy="110"
            stroke-width="14"
            :stroke-dasharray="circumference"
            :stroke-dashoffset="strokeDashoffset"
            stroke-linecap="round"
            stroke="url(#gradient)"
          />
        </svg>
        <!-- Affichage numérique placé au centre -->
        <div class="timer-display">
          <span>{{ padZero(displayHours) }}</span>
          <span class="separator">:</span>
          <span>{{ padZero(displayMinutes) }}</span>
          <span class="separator">:</span>
          <span>{{ padZero(displaySeconds) }}</span>
        </div>
      </div>
  
      <!-- Zone de sélection de la durée (disponible avant démarrage) -->
      <div v-if="!hasStarted" class="selector-container">
        <DurationSelector v-model="totalSeconds" />
      </div>
  
      <!-- Boutons de contrôle -->
      <div class="control-buttons">
        <button
          v-if="!hasStarted"
          @click="startTimer"
          :disabled="totalSeconds <= 0"
          class="btn start"
        >
          Start
        </button>
        <button
          v-if="isRunning"
          @click="stopTimer"
          class="btn stop"
        >
          Stop
        </button>
        <button
          v-if="hasStarted && !isRunning"
          @click="resetTimer"
          class="btn reset"
        >
          Reset
        </button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref, computed, onUnmounted } from 'vue';
  import DurationSelector from './DurationSelector.vue';
  
  // Nombre de secondes sélectionnées (5 minutes par défaut)
  const totalSeconds = ref(300);
  
  // États du timer
  const isRunning = ref(false);
  const hasStarted = ref(false);
  const remaining = ref(0);
  const initialTime = ref(0);
  let timerInterval: ReturnType<typeof setInterval> | null = null;
  
  // Calculs pour l'affichage numérique
  const displayHours = computed(() => {
    const t = hasStarted.value ? remaining.value : totalSeconds.value;
    return Math.floor(t / 3600);
  });
  const displayMinutes = computed(() => {
    const t = hasStarted.value ? remaining.value : totalSeconds.value;
    return Math.floor((t % 3600) / 60);
  });
  const displaySeconds = computed(() => {
    const t = hasStarted.value ? remaining.value : totalSeconds.value;
    return t % 60;
  });
  
  // Paramètres pour le cercle de progression
  const circleRadius = 95;
  const circumference = 2 * Math.PI * circleRadius;
  const progressWidth = computed(() => {
    if (initialTime.value === 0) return 0;
    return (remaining.value / initialTime.value) * 100;
  });
  const strokeDashoffset = computed(() => {
    return circumference - (progressWidth.value / 100) * circumference;
  });
  
  // Format d'affichage : ajoute un zéro devant les nombres inférieurs à 10
  function padZero(value: number) {
    return String(value).padStart(2, '0');
  }
  
  function startTimer() {
    const total = totalSeconds.value;
    if (total <= 0) return;
    initialTime.value = total;
    remaining.value = total;
    isRunning.value = true;
    hasStarted.value = true;
    timerInterval = setInterval(() => {
      if (remaining.value > 0) {
        remaining.value--;
      } else {
        stopTimer();
      }
    }, 1000);
  }
  
  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    isRunning.value = false;
  }
  
  function resetTimer() {
    stopTimer();
    remaining.value = totalSeconds.value;
    hasStarted.value = false;
  }
  
  onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval);
  });
  </script>
  
  <style scoped>
  .timer-app {
    max-width: 500px;
    margin: 3rem auto;
    padding: 1.5rem;
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    text-align: center;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
  
  .circle-timer {
    position: relative;
    width: 220px;
    height: 220px;
    margin: 0 auto 1.5rem;
  }
  
  .progress-ring {
    transform: rotate(-90deg);
  }
  
  .progress-ring__background {
    fill: none;
    stroke: #f0f0f0;
  }
  
  .progress-ring__progress {
    fill: none;
    transition: stroke-dashoffset 0.6s cubic-bezier(0.4, 0, 0.2, 1);
    filter: drop-shadow(0 0 5px rgba(0, 0, 0, 0.15));
  }
  
  .timer-display {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 2rem;       /* Réduit pour éviter le débordement */
    font-weight: 700;
    color: #333;
    letter-spacing: 0.5px; /* Réduit l'espacement entre les caractères */
    white-space: nowrap;
    text-align: center;
  }
  
  .timer-display span {
    display: inline-block;
  }
  
  .separator {
    margin: 0 0.2rem;
  }
  
  .selector-container {
    margin-bottom: 1.5rem;
  }
  
  .control-buttons {
    margin-top: 1rem;
  }
  
  .control-buttons .btn {
    padding: 0.8rem 1.6rem;
    margin: 0.5rem;
    border: none;
    border-radius: 12px;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.3s, transform 0.2s;
  }
  
  .btn:active {
    transform: scale(0.96);
  }
  
  .btn.start {
    background: #4caf50;
    color: #fff;
  }
  
  .btn.start:hover {
    background: #43a047;
  }
  
  .btn.stop {
    background: #f44336;
    color: #fff;
  }
  
  .btn.stop:hover {
    background: #e53935;
  }
  
  .btn.reset {
    background: #757575;
    color: #fff;
  }
  
  .btn.reset:hover {
    background: #616161;
  }
</style>
  