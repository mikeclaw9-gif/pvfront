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
          <q-item clickable v-ripple to="/usuarios">
            <q-item-section avatar>
              <q-icon name="manage_accounts" />
            </q-item-section>
            <q-item-section>Usuarios</q-item-section>
          </q-item>
          <q-separator spaced />
          <q-item tag="label" v-ripple>
            <q-item-section avatar>
              <q-icon name="dark_mode" />
            </q-item-section>
            <q-item-section>
              <q-item-label>Tema oscuro</q-item-label>
            </q-item-section>
            <q-item-section side>
              <q-toggle v-model="darkMode" @update:model-value="toggleDark" />
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
  </q-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useQuasar, LocalStorage } from 'quasar';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth-store';

const $q = useQuasar();
const router = useRouter();
const authStore = useAuthStore();

const drawer = ref(false);
const darkMode = ref(false);

onMounted(() => {
  const saved = LocalStorage.getItem('darkMode');
  if (saved === true) {
    darkMode.value = true;
    $q.dark.set(true);
  }
});

function toggleDark(val: boolean) {
  $q.dark.set(val);
  LocalStorage.set('darkMode', val);
}

function logout() {
  authStore.logout();
  router.push('/login');
}
</script>
