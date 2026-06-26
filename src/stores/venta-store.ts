import { defineStore } from 'pinia';
import {
  listarVentas,
  crearVenta,
  finalizarVenta,
  type VentaRequest,
  type VentaResponse,
  type ListarVentasParams,
} from '../api/venta.api';

interface VentaState {
  ventas: VentaResponse[];
  loading: boolean;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const useVentaStore = defineStore('venta', {
  state: (): VentaState => ({
    ventas: [],
    loading: false,
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
  }),
  actions: {
    async listar(params?: ListarVentasParams) {
      this.loading = true;
      try {
        const { data } = await listarVentas(params);
        this.ventas = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
        this.page = data.number;
        this.size = data.size;
      } finally {
        this.loading = false;
      }
    },
    async crear(data: VentaRequest) {
      const { data: venta } = await crearVenta(data);
      return venta;
    },
    async finalizar(id: number) {
      const { data: venta } = await finalizarVenta(id);
      return venta;
    },
  },
});
