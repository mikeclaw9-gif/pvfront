import { api } from 'boot/axios';

export interface GastoRequest {
  descripcion: string;
  monto: number;
  fechaGasto: string;
  categoria: string;
  metodoPago?: string;
  observacion?: string;
}

export interface GastoResponse {
  id: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  activo: boolean;
  descripcion: string;
  monto: number;
  fechaGasto: string;
  categoria: string;
  metodoPago: string;
  observacion: string;
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

export function listarGastos(params?: ListarParams) {
  return api.get<PageResponse<GastoResponse>>('/gastos', { params });
}

export function obtenerGasto(id: number) {
  return api.get<GastoResponse>(`/gastos/${id}`);
}

export function crearGasto(data: GastoRequest) {
  return api.post<GastoResponse>('/gastos', data);
}

export function actualizarGasto(id: number, data: GastoRequest) {
  return api.put<GastoResponse>(`/gastos/${id}`, data);
}

export function eliminarGasto(id: number) {
  return api.delete<void>(`/gastos/${id}`);
}

export function toggleActivoGasto(id: number) {
  return api.patch<GastoResponse>(`/gastos/${id}/toggle-activo`);
}

export function buscarGastosPorRangoFechas(desde: string, hasta: string) {
  return api.get<GastoResponse[]>('/gastos/rango-fechas', { params: { desde, hasta } });
}

export function buscarGastosPorCategoria(categoria: string) {
  return api.get<GastoResponse[]>(`/gastos/categoria/${categoria}`);
}
