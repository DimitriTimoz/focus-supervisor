import { Chart, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

export default defineNuxtPlugin(() => {
  Chart.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
});
