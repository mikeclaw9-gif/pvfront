<template>
  <div class="login-screen window-height window-width column flex-center">
    <div class="login-decoration" />
    <q-card class="login-card" flat>
      <q-card-section class="text-center q-pt-xl">
        <div class="login-logo">
          <q-icon name="point_of_sale" size="56px" color="primary" />
        </div>
        <div class="text-h5 q-mt-md text-weight-bold">Pventafront</div>
        <div class="text-caption text-grey-7 q-mt-xs">Inicia sesión para continuar</div>
      </q-card-section>
      <q-card-section class="q-px-lg q-pb-lg">
        <BackendStatusIndicator :status="backendStatus" :error="backendError" />
        <q-form @submit.prevent="handleLogin" class="q-gutter-y-md q-mt-md">
          <q-input
            v-model="email"
            label="Email"
            type="email"
            :rules="[required]"
            outlined
            lazy-rules
            class="login-input"
          >
            <template v-slot:prepend>
              <q-icon name="email" color="primary" />
            </template>
          </q-input>
          <q-input
            v-model="password"
            label="Contraseña"
            :type="showPassword ? 'text' : 'password'"
            :rules="[required]"
            outlined
            lazy-rules
            class="login-input"
          >
            <template v-slot:prepend>
              <q-icon name="lock" color="primary" />
            </template>
            <template v-slot:append>
              <q-icon
                :name="showPassword ? 'visibility_off' : 'visibility'"
                class="cursor-pointer"
                color="grey-6"
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
            size="lg"
            unelevated
          />
        </q-form>
      </q-card-section>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth-store';
import { Notify } from 'quasar';
import BackendStatusIndicator from '../components/BackendStatusIndicator.vue';
import { checkHealth } from '../api/health.api';

const router = useRouter();
const authStore = useAuthStore();

const email = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const backendStatus = ref<'checking' | 'available' | 'unavailable'>('checking');
const backendError = ref<string | undefined>();

function required(val: string) {
  return !!val || 'Campo requerido';
}

async function checkBackendHealth() {
  backendStatus.value = 'checking';
  backendError.value = undefined;
  const result = await checkHealth();
  backendStatus.value = result.available ? 'available' : 'unavailable';
  backendError.value = result.error;
}

onMounted(() => {
  checkBackendHealth();
});

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

<style lang="scss" scoped>
.login-screen {
  position: relative;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 20% 30%, var(--q-primary) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 70%, var(--q-secondary) 0%, transparent 50%),
    var(--q-dark-page);
}

.login-decoration {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(circle at 10% 10%, rgba(255,255,255,0.03) 0%, transparent 50%),
    radial-gradient(circle at 90% 90%, rgba(255,255,255,0.03) 0%, transparent 50%);
}

.login-card {
  width: 400px;
  max-width: 88vw;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  position: relative;
  z-index: 1;
}

.login-logo {
  animation: logoFloat 3s ease-in-out infinite;
}

@keyframes logoFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.login-input :deep(.q-field__control) {
  border-radius: var(--radius-sm);
}
</style>
