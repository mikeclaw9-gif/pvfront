import { api } from 'boot/axios';

export interface DetalleVentaRequest {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  descuentoPorcentaje?: number;
}

export interface VentaRequest {
  clienteId?: number;
  detalles: DetalleVentaRequest[];
  descuentoPorcentaje?: number;
}

export interface DetalleVentaResponse {
  id: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  activo: boolean;
  productoId: number;
  productoCodigo: string;
  productoNombre: string;
  productoDescripcion?: string;
  productoPesado: boolean;
  cantidad: number;
  precioUnitario: number;
  descuentoPorcentaje: number;
  subtotal: number;
}

export type EstadoVenta = 'PENDIENTE' | 'COMPLETADA' | 'CANCELADA';

export interface VentaResponse {
  id: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  activo: boolean;
  fecha: string;
  total: number;
  descuentoPorcentaje: number;
  estado: EstadoVenta;
  clienteId: number | null;
  clienteNombre: string;
  usuarioEmail: string;
  detalles: DetalleVentaResponse[];
}

export interface AgregarDetalleRequest {
  productoId: number;
  cantidad: number;
  precioUnitario: number;
  descuentoPorcentaje?: number;
}

export interface LineaTicket {
  producto: string;
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  descuentoPorcentaje: number;
  importe: number;
}

export interface TicketResponse {
  ventaId: number;
  fecha: string;
  atendidoPor: string;
  cliente: string;
  lineas: LineaTicket[];
  subtotal: number;
  descuentoPorcentaje: number;
  descuentoAplicado: number;
  total: number;
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

export interface ListarVentasParams {
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: string;
  estado?: EstadoVenta;
  clienteId?: number;
  fechaDesde?: string;
  fechaHasta?: string;
}

export function listarVentas(params?: ListarVentasParams) {
  return api.get<PageResponse<VentaResponse>>('/ventas', { params });
}

export function obtenerVenta(id: number) {
  return api.get<VentaResponse>(`/ventas/${id}`);
}

export function crearVenta(data: VentaRequest) {
  return api.post<VentaResponse>('/ventas', data);
}

export function agregarDetalle(ventaId: number, data: AgregarDetalleRequest) {
  return api.post<VentaResponse>(`/ventas/${ventaId}/detalles`, data);
}

export function eliminarDetalle(ventaId: number, detalleId: number) {
  return api.delete(`/ventas/${ventaId}/detalles/${detalleId}`);
}

export function finalizarVenta(id: number, data: VentaResponse) {
  return api.put<VentaResponse>(`/ventas/${id}/finalizar`, data);
}

export function anularVenta(id: number) {
  return api.put<VentaResponse>(`/ventas/${id}/anular`);
}

export function obtenerTicket(id: number) {
  return api.get<TicketResponse>(`/ventas/${id}/ticket`);
}
