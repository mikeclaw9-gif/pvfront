import { api } from 'boot/axios';

export interface ClienteRequest {
  nombre: string;
  apellido: string;
  email: string;
  direccion: string;
  telefono?: string;
  credito?: number;
  activo?: boolean;
  documento?: string;
}

export interface ClienteResponse {
  id: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  activo: boolean;
  nombre: string;
  apellido: string;
  direccion: string;
  telefono: string;
  email: string;
  credito: number;
  eliminado: boolean;
  documento: string;
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

export function listarClientes(params?: ListarParams) {
  return api.get<PageResponse<ClienteResponse>>('/clientes', { params });
}

export function obtenerCliente(id: number) {
  return api.get<ClienteResponse>(`/clientes/${id}`);
}

export function buscarPorEmail(email: string) {
  return api.get<ClienteResponse>(`/clientes/email/${email}`);
}

export function crearCliente(data: ClienteRequest) {
  return api.post<ClienteResponse>('/clientes', data);
}

export function actualizarCliente(id: number, data: ClienteRequest) {
  return api.put<ClienteResponse>(`/clientes/${id}`, data);
}

export function eliminarCliente(id: number) {
  return api.delete<void>(`/clientes/${id}`);
}

export function toggleActivo(id: number) {
  return api.patch<ClienteResponse>(`/clientes/${id}/toggle-activo`);
}
