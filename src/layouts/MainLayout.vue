<template>
  <q-layout view="hHh LpR lFr" style="min-height: 100vh">
    <q-header :dense="$q.screen.lt.sm" bordered class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="drawer = !drawer" />
        <q-toolbar-title class="text-weight-medium">Pventafront</q-toolbar-title>
        <q-btn flat no-caps @click="logout" class="user-btn">
          <div class="row items-center q-gutter-x-sm">
            <span class="text-caption">{{ authStore.nombreCompleto }}</span>
            <q-icon name="logout" size="sm" />
          </div>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="drawer" show-if-above :width="260" :breakpoint="1024" bordered>
      <div class="column full-height">
        <div class="text-center q-py-lg q-px-md">
          <q-icon name="point_of_sale" size="44px" color="primary" />
          <div class="text-subtitle1 text-weight-bold q-mt-sm">Pventafront</div>
          <div class="text-caption text-grey-7">Sistema de Ventas</div>
        </div>
        <q-separator />
        <q-list padding class="col">
          <q-item v-for="item in navItems" :key="item.to" clickable v-ripple :to="item.to" exact>
            <q-item-section avatar>
              <q-icon :name="item.icon" />
            </q-item-section>
            <q-item-section>{{ item.label }}</q-item-section>
          </q-item>
          <q-separator spaced />
          <q-item clickable v-ripple @click="showThemeDialog = true">
            <q-item-section avatar>
              <q-icon name="palette" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Temas</q-item-label>
              <q-item-label caption>{{ themeStore.currentThemeLabel }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
        <q-separator />
        <q-list padding>
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

    <q-footer class="bottom-tabs bg-white" :class="$q.screen.lt.md ? '' : 'desktop-hide'">
      <div class="row items-center justify-around" style="height: 56px">
        <q-btn
          v-for="tab in bottomTabs" :key="tab.id"
          :flat="!tab.isFab"
          :unelevated="tab.isFab"
          :round="tab.isFab"
          :color="tab.isFab ? 'primary' : isActiveRoute(tab.to) ? 'primary' : 'grey-7'"
          :text-color="tab.isFab ? 'white' : isActiveRoute(tab.to) ? 'primary' : 'grey-7'"
          :icon="tab.icon"
          :size="tab.isFab ? 'lg' : 'md'"
          :class="tab.isFab ? 'bottom-fab' : ''"
          :style="tab.isFab ? { marginTop: '-12px', boxShadow: 'var(--shadow-lg)' } : {}"
          stack no-caps
          @click="handleBottomTabClick(tab)"
        >
          <span v-if="tab.label" class="text-caption" style="font-size: 10px; margin-top: 2px">{{ tab.label }}</span>

          <q-menu v-if="tab.isFab" anchor="top middle" self="bottom middle" :offset="[0, 8]">
            <q-list dense style="min-width: 180px">
              <q-item clickable v-ripple @click="navigateTo('/inventario')">
                <q-item-section avatar><q-icon name="inventory_2" size="sm" /></q-item-section>
                <q-item-section>Nuevo producto</q-item-section>
              </q-item>
              <q-item clickable v-ripple @click="navigateTo('/clientes')">
                <q-item-section avatar><q-icon name="person_add" size="sm" /></q-item-section>
                <q-item-section>Nuevo cliente</q-item-section>
              </q-item>
              <q-item clickable v-ripple @click="navigateTo('/gastos')">
                <q-item-section avatar><q-icon name="payments" size="sm" /></q-item-section>
                <q-item-section>Nuevo gasto</q-item-section>
              </q-item>
            </q-list>
          </q-menu>

          <q-menu v-if="tab.isMore" anchor="top middle" self="bottom middle" :offset="[0, 8]">
            <q-list dense style="min-width: 180px">
              <q-item clickable v-ripple to="/clientes">
                <q-item-section avatar><q-icon name="people" size="sm" /></q-item-section>
                <q-item-section>Clientes</q-item-section>
              </q-item>
              <q-item clickable v-ripple to="/reportes">
                <q-item-section avatar><q-icon name="bar_chart" size="sm" /></q-item-section>
                <q-item-section>Reportes</q-item-section>
              </q-item>
              <q-item clickable v-ripple to="/usuarios">
                <q-item-section avatar><q-icon name="manage_accounts" size="sm" /></q-item-section>
                <q-item-section>Usuarios</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-ripple @click="showThemeDialog = true">
                <q-item-section avatar><q-icon name="palette" size="sm" /></q-item-section>
                <q-item-section>Temas</q-item-section>
              </q-item>
              <q-separator />
              <q-item clickable v-ripple @click="logout">
                <q-item-section avatar><q-icon name="logout" size="sm" /></q-item-section>
                <q-item-section>Salir</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </div>
    </q-footer>

    <q-dialog v-model="showThemeDialog" :maximized="$q.screen.lt.sm" transition-show="slide-up" transition-hide="slide-down">
      <q-card :class="$q.screen.lt.sm ? 'full-height' : ''" style="min-width: 360px; max-width: 420px">
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="palette" size="sm" color="primary" />
          <span class="text-h6">Tema visual</span>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section>
          <div class="row q-col-gutter-sm">
            <div v-for="t in themes" :key="t.id" class="col-4">
              <q-card
                clickable v-ripple flat
                :class="{ 'theme-card-selected': themeStore.selectedTheme === t.id }"
                :style="themeStore.selectedTheme === t.id
                  ? { border: '2px solid var(--q-primary)', backgroundColor: 'var(--q-primary)', color: '#fff' }
                  : { border: '2px solid transparent' }"
                @click="selectTheme(t.id)"
              >
                <q-card-section class="text-center q-py-md">
                  <q-icon :name="t.icon" size="32px" />
                  <div class="text-caption q-mt-xs text-weight-medium">{{ t.label }}</div>
                  <div class="row justify-center q-mt-xs q-gutter-xs">
                    <div v-for="c in t.preview" :key="c" class="theme-preview-dot" :style="{ backgroundColor: c }" />
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
              <q-toggle :model-value="themeStore.darkMode" @update:model-value="themeStore.toggleDark" />
            </q-item-section>
          </q-item>
        </q-card-section>
      </q-card>
    </q-dialog>
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth-store';
import { useThemeStore } from '../stores/theme-store';
import { themes, type ThemeId } from '../theme/themes';

const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const themeStore = useThemeStore();

const drawer = ref(false);
const showThemeDialog = ref(false);

const navItems = [
  { icon: 'dashboard', label: 'Dashboard', to: '/dashboard' },
  { icon: 'point_of_sale', label: 'Ventas', to: '/ventas' },
  { icon: 'inventory_2', label: 'Inventario', to: '/inventario' },
  { icon: 'people', label: 'Clientes', to: '/clientes' },
  { icon: 'payments', label: 'Gastos', to: '/gastos' },
  { icon: 'bar_chart', label: 'Reportes', to: '/reportes' },
  { icon: 'manage_accounts', label: 'Usuarios', to: '/usuarios' },
];

interface BottomTab {
  id: string;
  icon: string;
  label: string;
  to: string | null;
  isFab: boolean;
  isMore: boolean;
}

const bottomTabs: BottomTab[] = [
  { id: 'dashboard', icon: 'dashboard', label: 'Dashboard', to: '/dashboard', isFab: false, isMore: false },
  { id: 'ventas', icon: 'point_of_sale', label: 'Ventas', to: '/ventas', isFab: false, isMore: false },
  { id: 'fab', icon: 'add', label: '', to: null, isFab: true, isMore: false },
  { id: 'inventario', icon: 'inventory_2', label: 'Inventario', to: '/inventario', isFab: false, isMore: false },
  { id: 'more', icon: 'more_horiz', label: 'Más', to: null, isFab: false, isMore: true },
];

function isActiveRoute(path: string | null): boolean {
  if (!path) return false;
  return route.path === path;
}

function handleBottomTabClick(tab: BottomTab) {
  if (tab.isFab || tab.isMore) return;
  if (tab.to) router.push(tab.to);
}

function navigateTo(path: string) {
  drawer.value = false;
  router.push(path);
}

function selectTheme(id: ThemeId) {
  themeStore.setTheme(id);
  showThemeDialog.value = false;
}

function logout() {
  authStore.logout();
  router.push('/login');
}

onMounted(() => {
  themeStore.init();
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

.bottom-tabs {
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.body--dark .bottom-tabs {
  border-top-color: rgba(255, 255, 255, 0.08);
  background: #1e1e1e !important;
}

.desktop-hide {
  display: none !important;
}
</style>
