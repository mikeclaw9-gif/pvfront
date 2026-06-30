import { defineStore } from 'pinia';
import {
  listarClientes,
  crearCliente,
  actualizarCliente,
  eliminarCliente,
  toggleActivo,
  type ClienteRequest,
  type ClienteResponse,
  type ListarParams,
} from '../api/cliente.api';

interface ClienteState {
  clientes: ClienteResponse[];
  loading: boolean;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const useClienteStore = defineStore('cliente', {
  state: (): ClienteState => ({
    clientes: [],
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
        const { data } = await listarClientes(params);
        this.clientes = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
        this.page = data.page;
        this.size = data.size;
      } finally {
        this.loading = false;
      }
    },
    async crear(data: ClienteRequest) {
      await crearCliente(data);
      await this.listar({ page: this.page, size: this.size });
    },
    async actualizar(id: number, data: ClienteRequest) {
      await actualizarCliente(id, data);
      await this.listar({ page: this.page, size: this.size });
    },
    async eliminar(id: number) {
      await eliminarCliente(id);
      await this.listar({ page: this.page, size: this.size });
    },
    async toggleActivo(id: number) {
      await toggleActivo(id);
      await this.listar({ page: this.page, size: this.size });
    },
  },
});
