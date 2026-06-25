import { defineStore } from 'pinia';
import { LocalStorage } from 'quasar';
import { login, type LoginRequest, type LoginResponse } from '../api/auth.api';

interface AuthState {
  token: string | null;
  email: string | null;
  nombre: string | null;
  apellido: string | null;
  rol: string | null;
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: LocalStorage.getItem('token') as string | null,
    email: LocalStorage.getItem('email') as string | null,
    nombre: LocalStorage.getItem('nombre') as string | null,
    apellido: LocalStorage.getItem('apellido') as string | null,
    rol: LocalStorage.getItem('rol') as string | null,
  }),
  getters: {
    isAuthenticated: (state) => !!state.token,
    nombreCompleto: (state) => `${state.nombre ?? ''} ${state.apellido ?? ''}`.trim(),
  },
  actions: {
    async login(credentials: LoginRequest) {
      const { data } = await login(credentials);
      this.token = data.token;
      this.email = data.email;
      this.nombre = data.nombre;
      this.apellido = data.apellido;
      this.rol = data.rol;
      LocalStorage.set('token', data.token);
      LocalStorage.set('email', data.email);
      LocalStorage.set('nombre', data.nombre);
      LocalStorage.set('apellido', data.apellido);
      LocalStorage.set('rol', data.rol);
    },
    logout() {
      this.token = null;
      this.email = null;
      this.nombre = null;
      this.apellido = null;
      this.rol = null;
      LocalStorage.remove('token');
      LocalStorage.remove('email');
      LocalStorage.remove('nombre');
      LocalStorage.remove('apellido');
      LocalStorage.remove('rol');
    },
  },
});
