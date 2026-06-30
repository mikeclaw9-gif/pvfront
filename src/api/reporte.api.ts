import { api } from 'boot/axios';

export type FormatoReporte = 'JSON' | 'EXCEL' | 'PDF' | 'PRINT';

export interface ReporteVentasFilter {
  fechaDesde?: string;
  fechaHasta?: string;
  usuarioEmail?: string;
  clienteId?: number;
  estado?: string;
  metodoPago?: string;
}

export interface ReporteStockFilter {
  stockMinimo?: number;
  soloActivos?: boolean;
}

export interface ReporteProductosFilter {
  fechaDesde?: string;
  fechaHasta?: string;
  limite?: number;
}

export interface ReporteGastosFilter {
  fechaDesde?: string;
  fechaHasta?: string;
  categoria?: string;
}

export interface ReporteDashboardFilter {
  fecha?: string;
}

export interface ReporteCortesFilter {
  fechaDesde?: string;
  fechaHasta?: string;
}

export interface ReporteClientesFilter {
  fechaDesde?: string;
  fechaHasta?: string;
  limite?: number;
}

function filterParam(filter: Record<string, unknown>): string {
  const out: Record<string, unknown> = {};
  Object.entries(filter).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  });
  return JSON.stringify(out);
}

export function reporteVentas(filter: ReporteVentasFilter, formato: FormatoReporte = 'JSON') {
  return api.get('/reportes/ventas', { params: { filter: filterParam(filter), formato } });
}

export function reporteStock(filter: ReporteStockFilter, formato: FormatoReporte = 'JSON') {
  return api.get('/reportes/stock', { params: { filter: filterParam(filter), formato } });
}

export function reporteProductos(filter: ReporteProductosFilter, formato: FormatoReporte = 'JSON') {
  return api.get('/reportes/productos', { params: { filter: filterParam(filter), formato } });
}

export function reporteGastos(filter: ReporteGastosFilter, formato: FormatoReporte = 'JSON') {
  return api.get('/reportes/gastos', { params: { filter: filterParam(filter), formato } });
}

export function reporteDashboard(filter: ReporteDashboardFilter, formato: FormatoReporte = 'JSON') {
  return api.get('/reportes/dashboard', { params: { filter: filterParam(filter), formato } });
}

export function reporteCortes(filter: ReporteCortesFilter, formato: FormatoReporte = 'JSON') {
  return api.get('/reportes/cortes-caja', { params: { filter: filterParam(filter), formato } });
}

export function reporteClientes(filter: ReporteClientesFilter, formato: FormatoReporte = 'JSON') {
  return api.get('/reportes/clientes', { params: { filter: filterParam(filter), formato } });
}

export async function exportarReporte(endpoint: string, filter: Record<string, unknown>, formato: 'EXCEL' | 'PDF' | 'PRINT') {
  const res = await api.get(`/reportes/${endpoint}`, {
    params: { filter: filterParam(filter), formato },
    responseType: 'blob',
    headers: {
      Accept:
        formato === 'PDF'
          ? 'application/pdf'
          : formato === 'EXCEL'
            ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            : 'text/html, application/pdf',
    },
  });
  const blob = res.data as Blob;
  const contentDisposition = res.headers?.['content-disposition'] as string | undefined;
  const url = URL.createObjectURL(blob);
  if (formato === 'EXCEL') {
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-${endpoint}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  } else {
    window.open(url, '_blank');
  }
}

export function descargarJson(datos: unknown, nombreArchivo: string) {
  const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${nombreArchivo}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
