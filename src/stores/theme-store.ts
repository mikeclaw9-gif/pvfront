import { defineStore } from 'pinia';
import { useQuasar, LocalStorage } from 'quasar';
import { themes, type ThemeId } from '../theme/themes';

interface ThemeState {
  selectedTheme: ThemeId;
  darkMode: boolean;
}

/** Temas que son siempre oscuros (no tienen variante clara funcional). */
const ALWAYS_DARK_THEMES: ThemeId[] = ['console', 'obsidian'];

export const useThemeStore = defineStore('theme', {
  state: (): ThemeState => {
    const savedTheme = (LocalStorage.getItem('selectedTheme') as ThemeId) || 'corporate';
    const savedDark = LocalStorage.getItem('darkMode') === true;
    // Si el tema guardado es siempre oscuro, forzar darkMode true desde el estado inicial
    const darkMode = ALWAYS_DARK_THEMES.includes(savedTheme) ? true : savedDark;
    return { selectedTheme: savedTheme, darkMode };
  },
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
    isAlwaysDark: (state) => ALWAYS_DARK_THEMES.includes(state.selectedTheme),
  },
  actions: {
    applyTheme() {
      const $q = useQuasar();
      const colors = this.activeColors;
      const html = document.documentElement;
      const body = document.body;

      // Aplicar variables CSS de color en <html>
      for (const [key, val] of Object.entries(colors)) {
        html.style.setProperty(`--q-${key}`, val);
      }
      html.setAttribute('data-theme', this.selectedTheme);

      // Activar modo oscuro en Quasar
      $q.dark.set(this.darkMode);

      // Forzar el fondo del body directamente para temas siempre oscuros.
      // Quasar en modo oscuro usa --q-dark-page para el fondo, pero la variable
      // se aplica mediante una clase interna; forzar background-color en body
      // garantiza que no quede fondo blanco residual.
      if (ALWAYS_DARK_THEMES.includes(this.selectedTheme)) {
        const darkPageColor = colors['dark-page'];
        body.style.backgroundColor = darkPageColor;
        html.style.backgroundColor = darkPageColor;
      } else {
        body.style.backgroundColor = '';
        html.style.backgroundColor = '';
      }

      LocalStorage.set('selectedTheme', this.selectedTheme);
      LocalStorage.set('darkMode', this.darkMode);
    },
    setTheme(id: ThemeId) {
      this.selectedTheme = id;
      // Console y Obsidian son siempre oscuros
      if (ALWAYS_DARK_THEMES.includes(id)) {
        this.darkMode = true;
      }
      this.applyTheme();
    },
    toggleDark(val?: boolean) {
      // No permitir modo claro en temas siempre oscuros
      if (this.isAlwaysDark) return;
      this.darkMode = val !== undefined ? val : !this.darkMode;
      this.applyTheme();
    },
    init() {
      // Si el tema guardado es siempre oscuro, asegurar darkMode = true
      if (ALWAYS_DARK_THEMES.includes(this.selectedTheme)) {
        this.darkMode = true;
      }
      this.applyTheme();
    },
  },
});
