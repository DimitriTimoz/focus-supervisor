import { invoke } from '@tauri-apps/api/core';
import { open, BaseDirectory, mkdir } from "@tauri-apps/plugin-fs";
import { defineStore } from 'pinia';

export interface ActivityEntry {
  name: string;
  title: string;
  start: number;
  end: number | null;
}

export interface SprintEntry {
  date: number; 
  start: number;
  end: number;
  activities: ActivityEntry[];
  summary: {
    activitiesCount: number;
    totalDuration: number;
    averageDuration: number;
  }
}

const STORAGE_PATH = 'activity_history.json';
const SPRINTS_PATH = 'runs.json';

export const useActivityStore = defineStore('activity', {
  state: () => ({
    history: [] as ActivityEntry[],
    current: null as ActivityEntry | null,
    sprints: [] as SprintEntry[],
    trackingInterval: 0 as number,
    lastChange: 0 as number,
  }),
  actions: {
    /**
     * Charge l'historique sauvegardé depuis le fichier de stockage.
     */
    async loadHistory() {
      try {
        const file = await open(STORAGE_PATH, { read: true, baseDir: BaseDirectory.AppData });
        const fileLength = await (await file.stat()).size;
        const buf = new Uint8Array(fileLength);
        await file.read(buf);
        await file.close();
        const data = new TextDecoder().decode(buf);
        this.history = JSON.parse(data);
      } catch (error) {
        console.error('Erreur lors du chargement de l\'historique:', error);
        this.history = [];
      }
    },

    /**
     * Sauvegarde l'historique actuel dans le fichier de stockage.
     */
    async saveHistory() {
      try {
        mkdir("", { baseDir: BaseDirectory.AppData, recursive: true });

        const data = JSON.stringify(this.history);
        const buf = new TextEncoder().encode(data);
        const file = await open(STORAGE_PATH, { write: true, create: true, baseDir: BaseDirectory.AppData });
        await file.write(buf);
        await file.close();

      } catch (error) {
        console.error('Erreur lors de la sauvegarde de l\'historique:', error);
      }
    },

    async saveSprints() {
      try {
        await mkdir("", { baseDir: BaseDirectory.AppData, recursive: true });
        const data = JSON.stringify(this.sprints);
        const buf = new TextEncoder().encode(data);
        const file = await open(SPRINTS_PATH, { write: true, create: true, baseDir: BaseDirectory.AppData });
        await file.write(buf);
        await file.close();
      } catch (error) {
        console.error('Erreur lors de la sauvegarde des sprints:', error);
      }
    },

    // Ajout de la méthode loadSprints pour charger les sprintss depuis le fichier de stockage
    async loadSprints() {
      try {
        const file = await open(SPRINTS_PATH, { read: true, baseDir: BaseDirectory.AppData });
        const stat = await file.stat();
        const fileLength = stat.size;
        if (fileLength === 0) { // Si le fichier est vide
          this.sprints = [];
          await file.close();
          return;
        }
        const buf = new Uint8Array(fileLength);
        await file.read(buf);
        await file.close();
        let data = new TextDecoder().decode(buf).trim();
        // Supprimer le BOM s'il est présent
        if(data.charCodeAt(0) === 0xFEFF) {
          data = data.slice(1);
        }
        // Vérifier que le contenu commence par un crochet indiquant un tableau JSON
        if (data[0] !== '[') {
          console.error('Format invalide dans le fichier sprints. Réinitialisation.');
          this.sprints = [];
          await this.saveSprints();
          return;
        }
        try {
          this.sprints = JSON.parse(data);
        } catch (parseError) {
          console.error('Erreur lors du parsing des sprints:', parseError);
          this.sprints = [];
          await this.saveSprints();
        }
      } catch (error) {
        console.error('Erreur lors du chargement des sprints:', error);
        this.sprints = [];
      }
    },

    initPersistentTracking() {
      if (!this.trackingInterval) {
        this.trackingInterval = setInterval(async () => {
          await this.checkFocusedWindow();
          await this.checkLastInput();
        }, 1000);
      }
    },

    stopPersistentTracking() {
      if (this.trackingInterval) {
        clearInterval(this.trackingInterval);
        this.trackingInterval = 0;
      }
    },

    recordSprint(sprintData: SprintEntry) {
      this.sprints.push(sprintData);
      this.saveSprints();
    },


    /*
      * Vérifier la date du dernier input de l'utilisateur
      */

    async checkLastInput() {
      try {
        const lastInput: number = await invoke("get_last_input");
        if (lastInput) {
          this.lastChange = lastInput;
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la date du dernier input de l\'utilisateur:', error);
      }
    },


    endActivity() {
      if (this.current) {
        this.current.end = Date.now();
        this.history.push({ ...this.current });
        this.current = null;
        this.saveHistory();
        this.current = null;
      }
    },

    /**
     * Vérifie la fenêtre active et met à jour l'historique en conséquence.
     */
    async checkFocusedWindow() {
      try {
        // @ts-ignore - Invoke Tauri
        const { name, title } = await invoke("get_focused_window");
        const now = Date.now();

        // Aucun nom de fenêtre, on réinitialise l'activité actuelle.
        if (!name || this.lastChange > 1000*30) {
          this.endActivity();
          return;
        }

        // Première activité détectée.
        if (!this.current) {
          this.current = { name, title, start: now, end: null };
          return;
        }

        // Pas de changement de focus.
        if (this.current.name === name && this.current.title === title) return;

        this.lastChange = now;

        this.endActivity();
      } catch (error) {
        console.error('Erreur lors de la récupération de la fenêtre active:', error);
      }
    }
  }
});
