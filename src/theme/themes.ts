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

export type ThemeId = 'corporate' | 'nature' | 'midnight';

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
];
