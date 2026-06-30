import { api } from 'boot/axios';

export type RolUsuario = 'ROLE_ADMIN' | 'ROLE_USER' | 'ROLE_VENDEDOR';

export interface UsuarioRequest {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  rol?: RolUsuario;
  telefono?: string;
}

export interface UsuarioResponse {
  id: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  activo: boolean;
  nombre: string;
  apellido: string;
  email: string;
  rol: RolUsuario;
  telefono: string;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}

export interface ListarParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
}

export function listarUsuarios(params?: ListarParams) {
  return api.get<PageResponse<UsuarioResponse>>('/usuarios', { params });
}

export function obtenerUsuario(id: number) {
  return api.get<UsuarioResponse>(`/usuarios/${id}`);
}

export function buscarPorEmail(email: string) {
  return api.get<UsuarioResponse>(`/usuarios/email/${email}`);
}

export function crearUsuario(data: UsuarioRequest) {
  return api.post<UsuarioResponse>('/usuarios', data);
}

export function actualizarUsuario(id: number, data: UsuarioRequest) {
  return api.put<UsuarioResponse>(`/usuarios/${id}`, data);
}

export function eliminarUsuario(id: number) {
  return api.delete<void>(`/usuarios/${id}`);
}

export function toggleActivo(id: number) {
  return api.patch<UsuarioResponse>(`/usuarios/${id}/toggle-activo`);
}
