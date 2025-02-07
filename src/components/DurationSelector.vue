<template>
    <div class="duration-selector">
      <div
        class="selector-group"
        v-for="unit in units"
        :key="unit.name"
      >
        <label>{{ unit.label }}</label>
        <input
          type="number"
          :min="unit.min"
          :max="unit.max"
          v-model.number="values[unit.name]"
          @change="updateValue"
        />
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { reactive, watch } from 'vue';
  
  const props = defineProps({
    modelValue: {
      type: Number,
      default: 300 // 5 minutes par défaut
    }
  });
  const emit = defineEmits(['update:modelValue']);
  
  // Décomposition de modelValue (en secondes) en heures/minutes/secondes
  const hours = Math.floor(props.modelValue / 3600);
  const minutes = Math.floor((props.modelValue % 3600) / 60);
  const seconds = props.modelValue % 60;
  
  // Stockage réactif local de la durée
  const values = reactive({
    hours: hours,
    minutes: minutes,
    seconds: seconds
  });
  
  const units = [
    { name: 'hours', label: 'Heures', min: 0, max: 99 },
    { name: 'minutes', label: 'Minutes', min: 0, max: 59 },
    { name: 'seconds', label: 'Secondes', min: 0, max: 59 }
  ];
  
  function updateValue() {
    const total = values.hours * 3600 + values.minutes * 60 + values.seconds;
    emit('update:modelValue', total);
  }
  
  // Si la valeur externe change, on met à jour nos valeurs internes
  watch(
    () => props.modelValue,
    (newVal) => {
      values.hours = Math.floor(newVal / 3600);
      values.minutes = Math.floor((newVal % 3600) / 60);
      values.seconds = newVal % 60;
    }
  );
  </script>
  
  <style scoped>
  .duration-selector {
    display: flex;
    justify-content: space-around;
    margin-bottom: 1rem;
  }
  .selector-group {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .selector-group label {
    font-weight: bold;
    margin-bottom: 0.5rem;
    color: #555;
  }
  .selector-group input {
    width: 60px;
    padding: 0.4rem;
    text-align: center;
    font-size: 1.2rem;
    border: 1px solid #ccc;
    border-radius: 4px;
  }
  </style>
  