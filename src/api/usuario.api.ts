import { api } from 'boot/axios';

export type RolUsuario = 'ROLE_ADMIN' | 'ROLE_USER' | 'ROLE_VENDEDOR';

export interface UsuarioRequest {
  nombre: string;
  apellido: string;
  email: string;
  password?: string;
  rol: RolUsuario;
  telefono?: string;
}

export interface UsuarioResponse {
  id: string;
  nombre: string;
  apellido: string;
  email: string;
  rol: RolUsuario;
  telefono: string;
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
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

export function obtenerUsuario(id: string) {
  return api.get<UsuarioResponse>(`/usuarios/${id}`);
}

export function buscarPorEmail(email: string) {
  return api.get<UsuarioResponse>(`/usuarios/email/${email}`);
}

export function crearUsuario(data: UsuarioRequest) {
  return api.post<UsuarioResponse>('/usuarios', data);
}

export function actualizarUsuario(id: string, data: UsuarioRequest) {
  return api.put<UsuarioResponse>(`/usuarios/${id}`, data);
}

export function eliminarUsuario(id: string) {
  return api.delete<void>(`/usuarios/${id}`);
}

export function toggleActivo(id: string) {
  return api.patch<UsuarioResponse>(`/usuarios/${id}/toggle-activo`);
}
