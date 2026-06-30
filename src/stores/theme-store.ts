import { defineStore } from 'pinia';
import { useQuasar, LocalStorage } from 'quasar';
import { themes, type ThemeId } from '../theme/themes';

interface ThemeState {
  selectedTheme: ThemeId;
  darkMode: boolean;
}

export const useThemeStore = defineStore('theme', {
  state: (): ThemeState => ({
    selectedTheme: (LocalStorage.getItem('selectedTheme') as ThemeId) || 'corporate',
    darkMode: LocalStorage.getItem('darkMode') === true,
  }),
  getters: {
    currentTheme: (state) => themes.find(t => t.id === state.selectedTheme) || themes[0],
    activeColors: (state) => {
      const theme = themes.find(t => t.id === state.selectedTheme) || themes[0];
      return state.darkMode ? theme.dark : theme.light;
    },
    currentThemeLabel: (state) => {
      const theme = themes.find(t => t.id === state.selectedTheme) || themes[0];
      return theme.label + (state.darkMode ? ' (oscuro)' : ' (claro)');
    },
  },
  actions: {
    applyTheme() {
      const $q = useQuasar();
      const colors = this.activeColors;
      const el = document.documentElement;
      for (const [key, val] of Object.entries(colors)) {
        el.style.setProperty(`--q-${key}`, val);
      }
      el.setAttribute('data-theme', this.selectedTheme);
      $q.dark.set(this.darkMode);
      LocalStorage.set('selectedTheme', this.selectedTheme);
      LocalStorage.set('darkMode', this.darkMode);
    },
    setTheme(id: ThemeId) {
      this.selectedTheme = id;
      this.applyTheme();
    },
    toggleDark(val?: boolean) {
      this.darkMode = val !== undefined ? val : !this.darkMode;
      this.applyTheme();
    },
    init() {
      this.applyTheme();
    },
  },
});
