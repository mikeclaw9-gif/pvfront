import { defineStore } from 'pinia';
import {
  listarGastos,
  crearGasto,
  actualizarGasto,
  eliminarGasto,
  toggleActivoGasto,
  type GastoRequest,
  type GastoResponse,
  type ListarParams,
} from '../api/gasto.api';

interface GastoState {
  gastos: GastoResponse[];
  loading: boolean;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const useGastoStore = defineStore('gasto', {
  state: (): GastoState => ({
    gastos: [],
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
        const { data } = await listarGastos(params);
        this.gastos = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
        this.page = data.page;
        this.size = data.size;
      } finally {
        this.loading = false;
      }
    },
    async crear(data: GastoRequest) {
      await crearGasto(data);
      await this.listar({ page: this.page, size: this.size });
    },
    async actualizar(id: number, data: GastoRequest) {
      await actualizarGasto(id, data);
      await this.listar({ page: this.page, size: this.size });
    },
    async eliminar(id: number) {
      await eliminarGasto(id);
      await this.listar({ page: this.page, size: this.size });
    },
    async toggleActivo(id: number) {
      await toggleActivoGasto(id);
      await this.listar({ page: this.page, size: this.size });
    },
  },
});
