import { api } from 'boot/axios';

export interface ProductoRequest {
  codigo: string;
  nombre: string;
  descripcion?: string;
  precioCompra: number;
  precioVenta: number;
  existencia?: number;
  pesado?: boolean;
  imagenUrl?: string;
}

export interface ProductoResponse {
  id: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  activo: boolean;
  codigo: string;
  nombre: string;
  descripcion: string;
  precioCompra: number;
  precioVenta: number;
  existencia: number;
  pesado: boolean;
  imagenUrl: string;
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

export function listarProductos(params?: ListarParams) {
  return api.get<PageResponse<ProductoResponse>>('/productos', { params });
}

export function obtenerProducto(id: number) {
  return api.get<ProductoResponse>(`/productos/${id}`);
}

export function buscarPorCodigo(codigo: string) {
  return api.get<ProductoResponse>(`/productos/codigo/${codigo}`);
}

export function crearProducto(data: ProductoRequest) {
  return api.post<ProductoResponse>('/productos', data);
}

export function actualizarProducto(id: number, data: ProductoRequest) {
  return api.put<ProductoResponse>(`/productos/${id}`, data);
}

export function eliminarProducto(id: number) {
  return api.delete<void>(`/productos/${id}`);
}

export function toggleActivo(id: number) {
  return api.patch<ProductoResponse>(`/productos/${id}/toggle-activo`);
}
