import { defineStore } from 'pinia';
import { Notify } from 'quasar';
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
  error: string | null;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const useProductoStore = defineStore('producto', {
  state: (): ProductoState => ({
    productos: [],
    loading: false,
    error: null,
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  }),
  actions: {
    async listar(params?: ListarParams) {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await listarProductos(params);
        this.productos = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
        this.page = data.page;
        this.size = data.size;
      } catch (err: any) {
        this.error = err.response?.data?.message || err.message || 'Error al cargar productos';
        this.productos = [];
        if (err.response?.status !== 401) {
          Notify.create({ type: 'negative', message: this.error });
        }
      } finally {
        this.loading = false;
      }
    },
    async crear(data: ProductoRequest) {
      await crearProducto(data);
      await this.listar({ page: this.page, size: this.size });
    },
    async actualizar(id: number, data: ProductoRequest) {
      await actualizarProducto(id, data);
      await this.listar({ page: this.page, size: this.size });
    },
    async eliminar(id: number) {
      await eliminarProducto(id);
      await this.listar({ page: this.page, size: this.size });
    },
    async toggleActivo(id: number) {
      await toggleActivo(id);
      await this.listar({ page: this.page, size: this.size });
    },
  },
});
