import { invoke } from '@tauri-apps/api/core';
import { defineStore } from 'pinia';

export interface ActivityEntry {
  name: string;
  title: string;
  start: number;
  end: number | null;
}

export const useActivityStore = defineStore('activity', {
  state: () => ({
    history: [] as ActivityEntry[],
    current: null as ActivityEntry | null,
  }),
  actions: {
    async checkFocusedWindow() {
      try {
        // @ts-ignore - Invoke Tauri
        const { name, title } = await invoke("get_focused_window");
        const now = Date.now();

        if (!name) {
          this.current = null;
          return;
        }

        if (!this.current) {
          this.current = { name, title, start: now, end: null };
          return;
        }

        if (this.current.name === name && this.current.title === title) return;

        // Sauvegarder l'entrée précédente et créer une nouvelle entrée
        this.current.end = now;
        this.history.push({ ...this.current });
        this.current = { name, title, start: now, end: null };
      } catch (error) {
        console.error('Error getting focused window:', error);
      }
    }
  }
});
