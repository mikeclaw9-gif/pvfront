<template>
  <div class="window-height window-width row items-center justify-center bg-grey-2">
    <q-card style="width: 400px; max-width: 90vw">
      <q-card-section class="text-center">
        <q-icon name="point_of_sale" size="64px" color="primary" />
        <div class="text-h5 q-mt-md text-weight-bold">Pventafront</div>
        <div class="text-caption text-grey">Inicia sesión para continuar</div>
      </q-card-section>
      <q-card-section>
        <q-form @submit.prevent="handleLogin" class="q-gutter-y-md">
          <q-input
            v-model="email"
            label="Email"
            type="email"
            :rules="[required]"
            outlined
            lazy-rules
          >
            <template v-slot:prepend>
              <q-icon name="email" />
            </template>
          </q-input>
          <q-input
            v-model="password"
            label="Contraseña"
            :type="showPassword ? 'text' : 'password'"
            :rules="[required]"
            outlined
            lazy-rules
          >
            <template v-slot:prepend>
              <q-icon name="lock" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>
          <q-btn
            label="Iniciar sesión"
            type="submit"
            color="primary"
            class="full-width"
            :loading="loading"
          />
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth-store';
import { Notify } from 'quasar';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);

function required(val: string) {
  return !!val || 'Campo requerido';
}

async function handleLogin() {
  loading.value = true;
  try {
    await authStore.login({ email: email.value, password: password.value });
    router.push('/dashboard');
  } catch (err: any) {
    Notify.create({
      type: 'negative',
      message: err.response?.data?.message || 'Error al iniciar sesión',
    });
  } finally {
    loading.value = false;
  }
}
</script>
