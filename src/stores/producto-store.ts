import { defineStore } from 'pinia';
import {
  listarProductos,
  crearProducto,
  actualizarProducto,
  eliminarProducto,
  toggleActivo,
  type ProductoRequest,
  type ProductoResponse,
  type ListarParams,
} from '../api/producto.api';

interface ProductoState {
  productos: ProductoResponse[];
  loading: boolean;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const useProductoStore = defineStore('producto', {
  state: (): ProductoState => ({
    productos: [],
    loading: false,
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  }),
  actions: {
    async listar(params?: ListarParams) {
      this.loading = true;
      try {
        const { data } = await listarProductos(params);
        this.productos = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
        this.page = data.number;
        this.size = data.size;
      } finally {
        this.loading = false;
      }
    },
    async crear(data: ProductoRequest) {
      await crearProducto(data);
      await this.listar({ page: this.page, size: this.size });
    },
    async actualizar(id: string, data: ProductoRequest) {
      await actualizarProducto(id, data);
      await this.listar({ page: this.page, size: this.size });
    },
    async eliminar(id: string) {
      await eliminarProducto(id);
      await this.listar({ page: this.page, size: this.size });
    },
    async toggleActivo(id: string) {
      await toggleActivo(id);
      await this.listar({ page: this.page, size: this.size });
    },
  },
});
