import { api } from 'boot/axios';

export interface CorteCajaResponse {
  id: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  activo: boolean;
  fechaApertura: string;
  fechaCierre: string;
  montoInicial: number;
  montoFinal: number;
  totalVentas: number;
  totalGastos: number;
  totalEfectivo: number;
  totalTarjeta: number;
  totalTransferencia: number;
  diferencia: number;
  observacion: string;
  estado: 'ABIERTO' | 'CERRADO';
  usuarioEmail: string;
  usuarioNombre: string;
}

export interface AbrirCorteRequest {
  montoInicial: number;
  observacion?: string;
}

export interface CerrarCorteRequest {
  montoFinal: number;
  observacion?: string;
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

export function listarCortes(params?: ListarParams) {
  return api.get<PageResponse<CorteCajaResponse>>('/cortes-caja', { params });
}

export function obtenerCorte(id: number) {
  return api.get<CorteCajaResponse>(`/cortes-caja/${id}`);
}

export function obtenerCorteAbierto() {
  return api.get<CorteCajaResponse>('/cortes-caja/abierto');
}

export function abrirCorte(data: AbrirCorteRequest) {
  return api.post<CorteCajaResponse>('/cortes-caja/abrir', data);
}

export function cerrarCorte(id: number, data: CerrarCorteRequest) {
  return api.post<CorteCajaResponse>(`/cortes-caja/${id}/cerrar`, data);
}
