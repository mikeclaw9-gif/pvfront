import { defineStore } from 'pinia';
import {
  listarCortes,
  abrirCorte,
  cerrarCorte,
  obtenerCorteAbierto,
  type CorteCajaResponse,
  type AbrirCorteRequest,
  type CerrarCorteRequest,
  type ListarParams,
} from '../api/corte-caja.api';
import { listarVentas, type VentaResponse } from '../api/venta.api';
import { buscarGastosPorRangoFechas, type GastoResponse } from '../api/gasto.api';

/**
 * Formatea una fecha al formato que acepta Spring Boot LocalDateTime:
 * "YYYY-MM-DDTHH:MM:SS"  (sin Z, sin zona horaria, sin milisegundos)
 */
function toLocalDateTimeString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

/**
 * Si la fechaApertura viene con microsegundos "2026-06-30T20:19:07.415134"
 * la limpiamos a "2026-06-30T20:19:07" para que sea consistente.
 */
function limpiarFechaBackend(fecha: string): string {
  // Eliminar fracción de segundos y zona horaria si existen
  return fecha.replace(/\.\d+/, '').replace(/Z$/, '').replace(/[+-]\d{2}:\d{2}$/, '');
}

function todayStart(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return toLocalDateTimeString(d);
}

function todayEnd(): string {
  const d = new Date();
  d.setHours(23, 59, 59, 0);
  return toLocalDateTimeString(d);
}

interface CorteCajaState {
  cortes: CorteCajaResponse[];
  loading: boolean;
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  corteAbierto: CorteCajaResponse | null;
  cargandoEstado: boolean;
  /** Ventas COMPLETADAS del día de hoy (para el corte abierto) */
  ventasHoy: VentaResponse[];
  /** Gastos del día de hoy (desde la apertura) */
  gastosHoy: GastoResponse[];
  cargandoOperaciones: boolean;
}

export const useCorteCajaStore = defineStore('corteCaja', {
  state: (): CorteCajaState => ({
    cortes: [],
    loading: false,
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    corteAbierto: null,
    cargandoEstado: false,
    ventasHoy: [],
    gastosHoy: [],
    cargandoOperaciones: false,
  }),
  getters: {
    hayCorteAbierto: (state) => state.corteAbierto !== null,
    totalVentasHoy: (state) =>
      state.ventasHoy
        .filter(v => v.estado === 'COMPLETADA')
        .reduce((sum, v) => sum + v.total, 0),
    totalGastosHoy: (state) =>
      state.gastosHoy.reduce((sum, g) => sum + g.monto, 0),
  },
  actions: {
    async listar(params?: ListarParams) {
      this.loading = true;
      try {
        const { data } = await listarCortes(params);
        this.cortes = data.content;
        this.totalElements = data.totalElements;
        this.totalPages = data.totalPages;
        this.page = data.page;
        this.size = data.size;
      } finally {
        this.loading = false;
      }
    },
    async verificarCorteAbierto() {
      this.cargandoEstado = true;
      try {
        const { data } = await obtenerCorteAbierto();
        this.corteAbierto = data;
        // Si hay corte abierto, cargar también ventas y gastos de hoy
        if (data) {
          await this.cargarOperacionesHoy(data.fechaApertura);
        }
      } catch {
        this.corteAbierto = null;
      } finally {
        this.cargandoEstado = false;
      }
    },
    async cargarOperacionesHoy(desde?: string) {
      this.cargandoOperaciones = true;
      try {
        // Usar fechaApertura limpia como punto de inicio, o inicio del día
        const desdeFecha = desde ? limpiarFechaBackend(desde) : todayStart();
        const hasta = todayEnd();
        const [ventasRes, gastosRes] = await Promise.all([
          listarVentas({
            page: 0,
            size: 9999,
            fechaDesde: desdeFecha,
            fechaHasta: hasta,
          }),
          buscarGastosPorRangoFechas(desdeFecha, hasta),
        ]);
        this.ventasHoy = ventasRes.data.content || [];
        this.gastosHoy = gastosRes.data || [];
      } catch (e) {
        console.error('[CorteCaja] Error al cargar ventas/gastos del día:', e);
      } finally {
        this.cargandoOperaciones = false;
      }
    },
    async refrescarOperaciones() {
      // Refrescar ventas/gastos sin recargar el corte
      if (this.corteAbierto) {
        await this.cargarOperacionesHoy(this.corteAbierto.fechaApertura);
      } else {
        await this.cargarOperacionesHoy();
      }
    },
    async abrir(data: AbrirCorteRequest) {
      await abrirCorte(data);
      await this.verificarCorteAbierto();
      await this.listar({ page: this.page, size: this.size });
    },
    async cerrar(id: number, data: CerrarCorteRequest) {
      await cerrarCorte(id, data);
      await this.verificarCorteAbierto();
      await this.listar({ page: this.page, size: this.size });
    },
  },
});
