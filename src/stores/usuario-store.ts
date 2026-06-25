import { defineStore } from 'pinia';
import {
  listarUsuarios,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario,
  toggleActivo,
  type UsuarioRequest,
  type UsuarioResponse,
  type ListarParams,
} from '../api/usuario.api';

interface UsuarioState {
  usuarios: UsuarioResponse[];
  loading: boolean;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export const useUsuarioStore = defineStore('usuario', {
  state: (): UsuarioState => ({
    usuarios: [],
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
        const { data } = await listarUsuarios(params);
        this.usuarios = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
        this.page = data.number;
        this.size = data.size;
      } finally {
        this.loading = false;
      }
    },
    async crear(data: UsuarioRequest) {
      await crearUsuario(data);
      await this.listar({ page: this.page, size: this.size });
    },
    async actualizar(id: string, data: UsuarioRequest) {
      await actualizarUsuario(id, data);
      await this.listar({ page: this.page, size: this.size });
    },
    async eliminar(id: string) {
      await eliminarUsuario(id);
      await this.listar({ page: this.page, size: this.size });
    },
    async toggleActivo(id: string) {
      await toggleActivo(id);
      await this.listar({ page: this.page, size: this.size });
    },
  },
});
