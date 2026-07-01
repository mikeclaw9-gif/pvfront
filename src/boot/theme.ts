import { boot } from 'quasar/wrappers';
import { LocalStorage } from 'quasar';

/**
 * Boot de tema: aplica el color de fondo correcto ANTES del primer render
 * para evitar el flash de fondo blanco en temas siempre oscuros (Console, Obsidian).
 *
 * No usa el store de Pinia porque aún no está montado en este punto;
 * lee directamente de LocalStorage y aplica inline styles en html/body.
 */

const ALWAYS_DARK_THEMES = ['console', 'obsidian'];

const DARK_PAGE_COLORS: Record<string, string> = {
  console: '#060606',
  obsidian: '#13131F',
};

const DARK_COLORS: Record<string, string> = {
  console: '#0D0D0D',
  obsidian: '#1E1E2E',
};

export default boot(() => {
  const savedTheme = (LocalStorage.getItem('selectedTheme') as string) || 'corporate';

  if (ALWAYS_DARK_THEMES.includes(savedTheme)) {
    const darkPage = DARK_PAGE_COLORS[savedTheme] ?? '#0D0D0D';
    const dark = DARK_COLORS[savedTheme] ?? '#1A1A2E';

    const html = document.documentElement;
    const body = document.body;

    // Aplicar fondo inmediato para evitar flash blanco
    html.style.backgroundColor = darkPage;
    body.style.backgroundColor = darkPage;

    // Pre-aplicar las variables CSS de Quasar para el modo oscuro
    html.style.setProperty('--q-dark-page', darkPage);
    html.style.setProperty('--q-dark', dark);
    html.setAttribute('data-theme', savedTheme);

    // Asegurar que darkMode esté guardado como true
    LocalStorage.set('darkMode', true);
  }
});
