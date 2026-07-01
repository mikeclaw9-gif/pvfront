export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  positive: string;
  negative: string;
  info: string;
  warning: string;
  'dark-page': string;
  dark: string;
}

export interface Theme {
  id: ThemeId;
  label: string;
  icon: string;
  preview: string[];
  light: ThemeColors;
  dark: ThemeColors;
}

export type ThemeId = 'corporate' | 'nature' | 'midnight' | 'console' | 'obsidian';

export const themes: Theme[] = [
  {
    id: 'corporate',
    label: 'Corporate',
    icon: 'business',
    preview: ['#1565C0', '#1E88E5', '#0D47A1'],
    light: {
      primary: '#1565C0',
      secondary: '#1E88E5',
      accent: '#0D47A1',
      positive: '#43A047',
      negative: '#E53935',
      info: '#039BE5',
      warning: '#FB8C00',
      'dark-page': '#FFFFFF',
      dark: '#F5F5F5',
    },
    dark: {
      primary: '#5B9BD5',
      secondary: '#4DB6AC',
      accent: '#B084CC',
      positive: '#66BB6A',
      negative: '#EF5350',
      info: '#4DD0E1',
      warning: '#FFB74D',
      'dark-page': '#0E1622',
      dark: '#1C2533',
    },
  },
  {
    id: 'nature',
    label: 'Nature',
    icon: 'eco',
    preview: ['#2E7D32', '#388E3C', '#1B5E20'],
    light: {
      primary: '#2E7D32',
      secondary: '#388E3C',
      accent: '#1B5E20',
      positive: '#43A047',
      negative: '#E53935',
      info: '#00695C',
      warning: '#F9A825',
      'dark-page': '#FAFAF5',
      dark: '#F0F0E8',
    },
    dark: {
      primary: '#5CB860',
      secondary: '#4DB6AC',
      accent: '#9CCC65',
      positive: '#81C784',
      negative: '#E57373',
      info: '#4DB6AC',
      warning: '#FFD54F',
      'dark-page': '#0B160B',
      dark: '#162616',
    },
  },
  {
    id: 'midnight',
    label: 'Midnight',
    icon: 'dark_mode',
    preview: ['#6366F1', '#8B5CF6', '#4F46E5'],
    light: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      accent: '#4F46E5',
      positive: '#22C55E',
      negative: '#EF4444',
      info: '#06B6D4',
      warning: '#F59E0B',
      'dark-page': '#F8FAFC',
      dark: '#F1F5F9',
    },
    dark: {
      primary: '#7C8CF5',
      secondary: '#A78BFA',
      accent: '#B4A0F7',
      positive: '#5AD185',
      negative: '#F87171',
      info: '#5BC0DE',
      warning: '#FBBF24',
      'dark-page': '#0D0F14',
      dark: '#1A1D26',
    },
  },
  {
    // Console: terminal verde fosforescente sobre negro profundo.
    // Ambas variantes (light y dark) son oscuras; la "light" es solo
    // ligeramente menos intensa para no forzar un fondo blanco.
    id: 'console',
    label: 'Console',
    icon: 'terminal',
    preview: ['#00FF41', '#00CC33', '#0D0D0D'],
    light: {
      primary: '#00CC33',
      secondary: '#009922',
      accent: '#00FF41',
      positive: '#00E676',
      negative: '#FF3D3D',
      info: '#00BCD4',
      warning: '#FFEA00',
      'dark-page': '#0D0D0D',
      dark: '#141414',
    },
    dark: {
      primary: '#00FF41',
      secondary: '#00CC33',
      accent: '#39FF14',
      positive: '#00E676',
      negative: '#FF5252',
      info: '#18FFFF',
      warning: '#FFD600',
      'dark-page': '#060606',
      dark: '#0D0D0D',
    },
  },
  {
    // Obsidian: oscuro neutro suave, inspirado en VS Code / OpenCode.
    // Acentos violeta-cyan de baja saturación que no cansan la vista.
    id: 'obsidian',
    label: 'Obsidian',
    icon: 'nights_stay',
    preview: ['#C792EA', '#89DDFF', '#1E1E2E'],
    light: {
      primary: '#7B68EE',
      secondary: '#56B6C2',
      accent: '#C792EA',
      positive: '#98C379',
      negative: '#E06C75',
      info: '#56B6C2',
      warning: '#E5C07B',
      'dark-page': '#1E1E2E',
      dark: '#282838',
    },
    dark: {
      primary: '#C792EA',
      secondary: '#89DDFF',
      accent: '#82AAFF',
      positive: '#A3BE8C',
      negative: '#BF616A',
      info: '#88C0D0',
      warning: '#EBCB8B',
      'dark-page': '#13131F',
      dark: '#1E1E2E',
    },
  },
];
