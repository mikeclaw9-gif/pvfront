import { api } from 'boot/axios';

export interface ProductoRequest {
  codigo: string;
  nombre: string;
  descripcion?: string;
  precioCompra: number;
  precioVenta: number;
  existencia: number;
  imagen?: string;
  pesado?: boolean;
}

export interface ProductoResponse {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  precioCompra: number;
  precioVenta: number;
  existencia: number;
  activo: boolean;
  fechaCreacion: string;
  fechaModificacion: string;
  imagen?: string;
  pesado?: boolean;
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

export function listarProductos(params?: ListarParams) {
  return api.get<PageResponse<ProductoResponse>>('/productos', { params });
}

export function obtenerProducto(id: string) {
  return api.get<ProductoResponse>(`/productos/${id}`);
}

export function buscarPorCodigo(codigo: string) {
  return api.get<ProductoResponse>(`/productos/codigo/${codigo}`);
}

export function crearProducto(data: ProductoRequest) {
  return api.post<ProductoResponse>('/productos', data);
}

export function actualizarProducto(id: string, data: ProductoRequest) {
  return api.put<ProductoResponse>(`/productos/${id}`, data);
}

export function eliminarProducto(id: string) {
  return api.delete<void>(`/productos/${id}`);
}

export function toggleActivo(id: string) {
  return api.patch<ProductoResponse>(`/productos/${id}/toggle-activo`);
}
