<template>
  <q-layout view="hHh LpR lFr" style="min-height: 100vh">
    <q-header bordered class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="drawer = !drawer" />
        <q-toolbar-title>Pventafront</q-toolbar-title>
        <q-btn flat no-caps @click="logout">
          <div class="row items-center q-gutter-x-sm">
            <span class="text-caption">{{ authStore.nombreCompleto }}</span>
            <q-icon name="logout" />
          </div>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" show-if-above :width="220" :breakpoint="600" bordered>
      <div class="column full-height">
        <q-list padding class="col">
          <q-item clickable v-ripple to="/dashboard">
            <q-item-section avatar>
              <q-icon name="dashboard" />
            </q-item-section>
            <q-item-section>Dashboard</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/ventas">
            <q-item-section avatar>
              <q-icon name="point_of_sale" />
            </q-item-section>
            <q-item-section>Ventas</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/inventario">
            <q-item-section avatar>
              <q-icon name="inventory_2" />
            </q-item-section>
            <q-item-section>Inventario</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/clientes">
            <q-item-section avatar>
              <q-icon name="people" />
            </q-item-section>
            <q-item-section>Clientes</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/gastos">
            <q-item-section avatar>
              <q-icon name="payments" />
            </q-item-section>
            <q-item-section>Gastos</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/reportes">
            <q-item-section avatar>
              <q-icon name="bar_chart" />
            </q-item-section>
            <q-item-section>Reportes</q-item-section>
          </q-item>
          <q-item clickable v-ripple to="/usuarios">
            <q-item-section avatar>
              <q-icon name="manage_accounts" />
            </q-item-section>
            <q-item-section>Usuarios</q-item-section>
          </q-item>
          <q-separator spaced />
          <q-item clickable v-ripple @click="showThemeDialog = true">
            <q-item-section avatar>
              <q-icon name="palette" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Temas</q-item-label>
              <q-item-label caption>{{ currentThemeLabel }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item clickable v-ripple @click="logout">
            <q-item-section avatar>
              <q-icon name="logout" />
            </q-item-section>
            <q-item-section>Salir de PV</q-item-section>
          </q-item>
        </q-list>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

    <q-dialog v-model="showThemeDialog" persistent>
      <q-card style="min-width: 420px; max-width: 460px">
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="palette" size="sm" />
          <span class="text-h6">Seleccionar tema</span>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="row q-col-gutter-sm">
            <div v-for="t in themes" :key="t.id" class="col-6">
              <q-card
                clickable
                v-ripple
                flat
                :class="{
                  'theme-card-selected': selectedTheme === t.id,
                  'bg-grey-3': selectedTheme !== t.id && !$q.dark.isActive,
                  'bg-grey-9': selectedTheme !== t.id && $q.dark.isActive,
                }"
                :style="selectedTheme === t.id ? { border: '2px solid var(--q-primary)', backgroundColor: 'var(--q-primary)', color: '#fff' } : { border: '2px solid transparent' }"
                @click="selectTheme(t.id)"
              >
                <q-card-section class="text-center q-py-md">
                  <q-icon :name="t.icon" size="36px" />
                  <div class="text-caption q-mt-xs text-weight-medium">{{ t.label }}</div>
                  <div class="row justify-center q-mt-xs q-gutter-xs">
                    <div
                      v-for="c in t.preview"
                      :key="c"
                      class="theme-preview-dot"
                      :style="{ backgroundColor: c }"
                    />
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-card-section>
        <q-separator />
        <q-card-section class="q-pt-sm">
          <q-item tag="label" v-ripple class="q-pa-none">
            <q-item-section>
              <q-item-label>Modo oscuro</q-item-label>
              <q-item-label caption>Alterna entre la variante clara y oscura del tema</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle v-model="darkMode" @update:model-value="toggleDark" />
            </q-item-section>
          </q-item>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar, LocalStorage } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth-store';

interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  positive: string;
  negative: string;
  info: string;
  warning: string;
}

interface Theme {
  id: string;
  label: string;
  icon: string;
  preview: string[];
  light: ThemeColors;
  dark: ThemeColors;
}

const themes: Theme[] = [
  {
    id: 'default',
    label: 'Predeterminado',
    icon: 'palette',
    preview: ['#1976D2', '#26A69A', '#9C27B0'],
    light: {
      primary: '#1976D2',
      secondary: '#26A69A',
      accent: '#9C27B0',
      positive: '#21BA45',
      negative: '#C10015',
      info: '#31CCEC',
      warning: '#F2C037',
    },
    dark: {
      primary: '#64B5F6',
      secondary: '#4DB6AC',
      accent: '#CE93D8',
      positive: '#66BB6A',
      negative: '#EF5350',
      info: '#4DD0E1',
      warning: '#FFD54F',
    },
  },
  {
    id: 'ocean',
    label: 'Oceánico',
    icon: 'water_drop',
    preview: ['#00695C', '#00897B', '#004D40'],
    light: {
      primary: '#00695C',
      secondary: '#00897B',
      accent: '#004D40',
      positive: '#2E7D32',
      negative: '#C62828',
      info: '#00838F',
      warning: '#E65100',
    },
    dark: {
      primary: '#26A69A',
      secondary: '#4DB6AC',
      accent: '#80CBC4',
      positive: '#66BB6A',
      negative: '#EF5350',
      info: '#4DD0E1',
      warning: '#FFA726',
    },
  },
  {
    id: 'emerald',
    label: 'Esmeralda',
    icon: 'eco',
    preview: ['#1B5E20', '#2E7D32', '#827717'],
    light: {
      primary: '#1B5E20',
      secondary: '#2E7D32',
      accent: '#827717',
      positive: '#33691E',
      negative: '#B71C1C',
      info: '#00695C',
      warning: '#F57F17',
    },
    dark: {
      primary: '#4CAF50',
      secondary: '#66BB6A',
      accent: '#AED581',
      positive: '#81C784',
      negative: '#E57373',
      info: '#4DB6AC',
      warning: '#FFD54F',
    },
  },
  {
    id: 'console',
    label: 'Consola',
    icon: 'terminal',
    preview: ['#BF360C', '#558B2F', '#F9A825'],
    light: {
      primary: '#BF360C',
      secondary: '#E65100',
      accent: '#558B2F',
      positive: '#33691E',
      negative: '#B71C1C',
      info: '#00695C',
      warning: '#F9A825',
    },
    dark: {
      primary: '#00FF41',
      secondary: '#00E676',
      accent: '#FFB300',
      positive: '#76FF03',
      negative: '#FF1744',
      info: '#00E5FF',
      warning: '#FFD740',
    },
  },
];

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const drawer = ref(false);
const darkMode = ref(false);
const showThemeDialog = ref(false);
const selectedTheme = ref('default');

const currentThemeLabel = computed(() => {
  const t = themes.find(t => t.id === selectedTheme.value);
  return t ? t.label + (darkMode.value ? ' (oscuro)' : ' (claro)') : '';
});

function applyCurrentTheme() {
  const theme = themes.find(t => t.id === selectedTheme.value);
  if (!theme) return;

  const colors = darkMode.value ? theme.dark : theme.light;
  const el = document.documentElement;
  for (const [key, val] of Object.entries(colors)) {
    el.style.setProperty(`--q-${key}`, val);
  }

  el.setAttribute('data-theme', selectedTheme.value);
  LocalStorage.set('selectedTheme', selectedTheme.value);
}

function selectTheme(id: string) {
  selectedTheme.value = id;
  applyCurrentTheme();
  showThemeDialog.value = false;
}

function toggleDark(val: boolean) {
  darkMode.value = val;
  $q.dark.set(val);
  LocalStorage.set('darkMode', val);
  applyCurrentTheme();
}

onMounted(() => {
  const savedTheme = (LocalStorage.getItem('selectedTheme') as string) || 'default';
  const savedDark = LocalStorage.getItem('darkMode');

  selectedTheme.value = savedTheme;
  darkMode.value = savedDark === true;

  if (savedDark === true) {
    $q.dark.set(true);
  }

  applyCurrentTheme();
});

</script>

<style lang="scss">
.theme-preview-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(0, 0, 0, 0.15);
}
</style>
