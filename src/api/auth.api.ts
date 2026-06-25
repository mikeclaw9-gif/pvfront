import { api } from 'boot/axios';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  email: string;
  nombre: string;
  apellido: string;
  rol: string;
}

export function login(data: LoginRequest) {
  return api.post<LoginResponse>('/auth/login', data);
}
