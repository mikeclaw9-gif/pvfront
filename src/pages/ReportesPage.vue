<template>
  <div class="q-pa-md">
    <q-tabs v-model="reporteActivo" class="q-mb-md" dense>
      <q-tab v-for="r in reportes" :key="r.key" :name="r.key" :icon="r.icon" :label="r.label" />
    </q-tabs>

    <q-card class="q-mb-md">
      <q-card-section>
        <div class="text-subtitle2 q-mb-sm">Filtros</div>
        <div class="row q-col-gutter-sm">
          <template v-for="f in filtrosConfig" :key="f.key">
            <div class="col-6 col-sm-4 col-md-3 col-lg-2">
              <q-input v-if="f.type === 'text'" v-model="filtros[f.key]" :label="f.label" dense clearable />
              <q-input v-else-if="f.type === 'date'" v-model="filtros[f.key]" :label="f.label" type="date" dense clearable />
              <q-input v-else-if="f.type === 'number'" v-model.number="filtros[f.key]" :label="f.label" type="number" dense clearable />
              <q-select v-else-if="f.type === 'select' && f.options" v-model="filtros[f.key]" :label="f.label" :options="f.options" dense clearable />
            </div>
          </template>
          <div class="col-12 flex items-end q-gutter-x-sm">
            <q-btn label="Buscar" color="primary" icon="search" @click="fetchReporte" />
            <q-btn label="Limpiar" flat @click="limpiarFiltros" />
          </div>
        </div>
      </q-card-section>
    </q-card>

    <template v-if="cargando">
      <div class="text-center q-pa-xl"><q-spinner size="48px" /></div>
    </template>

    <template v-else-if="filas.length > 0">
      <div class="reporte-container">
        <div class="reporte-header">
          <div class="text-h5">{{ titulo }}</div>
          <div class="text-caption text-grey q-mt-xs">
            Generado: {{ fechaGeneracion }} — Usuario: {{ usuarioNombre }}
          </div>
          <div v-if="filtrosActivos.length > 0" class="text-caption text-grey">
            Filtros: {{ filtrosActivos.join(', ') }}
          </div>
          <q-separator class="q-my-md" />
        </div>

        <div v-if="resumenHTML" class="resumen-ejecutivo q-mb-lg">
          <div class="text-subtitle1 text-weight-bold q-mb-sm">Resumen Ejecutivo</div>
          <div class="text-body2" v-html="resumenHTML"></div>
        </div>

        <div v-if="tarjetas.length > 0" class="row q-col-gutter-md q-mb-lg">
          <div v-for="r in tarjetas" :key="r.label" class="col-6 col-sm-4 col-md-3 col-lg-2">
            <q-card flat bordered>
              <q-card-section class="text-center">
                <div class="text-caption text-grey">{{ r.label }}</div>
                <div class="text-h6 text-primary">{{ r.valor }}</div>
              </q-card-section>
            </q-card>
          </div>
        </div>

        <div v-if="mostrarChart" class="q-mb-lg">
          <q-card flat bordered>
            <q-card-section class="cursor-pointer" @click="chartExpanded = !chartExpanded">
              <div class="row items-center">
                <div class="text-subtitle1 text-weight-bold">{{ chartTitulo }}</div>
                <q-space />
                <q-btn flat dense round :icon="chartExpanded ? 'expand_less' : 'expand_more'" size="sm" />
              </div>
            </q-card-section>
            <q-slide-transition>
              <div v-show="chartExpanded">
                <q-card-section>
                  <canvas ref="chartCanvas" style="max-height: 300px; width: 100%;"></canvas>
                </q-card-section>
              </div>
            </q-slide-transition>
          </q-card>
        </div>

        <div class="q-mb-lg">
          <div class="text-subtitle1 text-weight-bold q-mb-sm">Detalle de {{ titulo.replace('Reporte de ', '') }}</div>
          <q-markup-table dense flat bordered>
            <thead>
              <tr>
                <th v-for="col in columnasMostrar" :key="col.key" class="text-left" style="white-space: nowrap;">{{ col.label }}</th>
                <th v-if="reporteActivo === 'ventas'" class="text-center" style="white-space: nowrap; width: 60px;">Detalle</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, ri) in filasMostrar" :key="ri">
                <td v-for="col in columnasMostrar" :key="col.key" :class="esNumero(col.key) ? 'text-right' : ''">
                  <q-badge v-if="col.key === 'Estado'" :color="colorEstado(row[col.key])">{{ row[col.key] }}</q-badge>
                  <span v-else>{{ row[col.key] || '*N/A*' }}</span>
                </td>
                <td v-if="reporteActivo === 'ventas'" class="text-center">
                  <q-btn dense flat round icon="visibility" color="primary" size="sm" @click="verDetalle(filas[ri])">
                    <q-tooltip>Ver detalle</q-tooltip>
                  </q-btn>
                </td>
              </tr>
            </tbody>
          </q-markup-table>
        </div>
      </div>
    </template>

    <template v-else-if="!cargando && !errorMsg">
      <q-banner class="bg-grey-2 q-mb-md">Sin datos. Presiona "Buscar" para generar el reporte.</q-banner>
    </template>

    <template v-else-if="errorMsg && filas.length === 0">
      <q-banner class="bg-negative text-white q-mb-md">{{ errorMsg }}</q-banner>
    </template>

    <q-page-sticky v-if="filas.length > 0" position="bottom-right" :offset="[18, 18]">
      <q-btn-group push>
        <q-btn push color="primary" icon="file_download" label="JSON" @click="exportJson" />
        <q-btn push color="positive" icon="description" label="Excel" @click="exportExcel" />
        <q-btn push color="negative" icon="picture_as_pdf" label="PDF" @click="exportPdf" />
        <q-btn push color="warning" icon="print" label="Imprimir" @click="exportPrint" />
      </q-btn-group>
    </q-page-sticky>

    <q-dialog v-model="detalleDialogVisible" maximized>
      <q-card>
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="receipt" size="sm" color="primary" />
          <span class="text-h6">Detalle de venta #{{ detalleTicket?.ventaId }}</span>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section v-if="detalleLoading" class="text-center q-pa-xl">
          <q-spinner size="48px" color="primary" />
        </q-card-section>
        <q-card-section v-else-if="detalleTicket">
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-6 col-sm-3">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <div class="text-caption text-grey">Total</div>
                  <div class="text-h6 text-primary">${{ detalleTicket.total.toFixed(2) }}</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-6 col-sm-3">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <div class="text-caption text-grey">Fecha</div>
                  <div class="text-body2">{{ formatearFecha2(detalleTicket.fecha) }}</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-6 col-sm-3">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <div class="text-caption text-grey">Atendido por</div>
                  <div class="text-body2">{{ detalleTicket.atendidoPor }}</div>
                </q-card-section>
              </q-card>
            </div>
            <div class="col-6 col-sm-3">
              <q-card flat bordered>
                <q-card-section class="text-center">
                  <div class="text-caption text-grey">Cliente</div>
                  <div class="text-body2">{{ detalleTicket.cliente || 'Sin cliente' }}</div>
                </q-card-section>
              </q-card>
            </div>
          </div>
          <q-markup-table dense flat bordered>
            <thead>
              <tr>
                <th>Producto</th>
                <th class="text-right">Cantidad</th>
                <th class="text-center">Unidad</th>
                <th class="text-right">P. Unitario</th>
                <th class="text-right">Desc. %</th>
                <th class="text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(linea, idx) in detalleTicket.lineas" :key="idx">
                <td>{{ linea.producto }}</td>
                <td class="text-right">{{ linea.cantidad }}</td>
                <td class="text-center">{{ linea.unidad }}</td>
                <td class="text-right">${{ linea.precioUnitario.toFixed(2) }}</td>
                <td class="text-right">{{ linea.descuentoPorcentaje > 0 ? linea.descuentoPorcentaje + '%' : '-' }}</td>
                <td class="text-right">${{ linea.importe.toFixed(2) }}</td>
              </tr>
            </tbody>
          </q-markup-table>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useQuasar } from 'quasar';
import { Chart, registerables } from 'chart.js';
import {
  reporteVentas, reporteStock, reporteProductos, reporteGastos,
  reporteDashboard, reporteCortes, reporteClientes,
} from '../api/reporte.api';
import type { ReporteVentasFilter, ReporteStockFilter, ReporteProductosFilter, ReporteGastosFilter, ReporteDashboardFilter, ReporteCortesFilter, ReporteClientesFilter } from '../api/reporte.api';
import { generarPdf } from '../utils/pdf';
import { useAuthStore } from '../stores/auth-store';
import { obtenerTicket } from '../api/venta.api';
import type { TicketResponse } from '../api/venta.api';

Chart.register(...registerables);

const $q = useQuasar();
const authStore = useAuthStore();

const reporteActivo = ref('ventas');
const cargando = ref(false);
const errorMsg = ref('');
const datos = ref<Record<string, unknown> | null>(null);
const chartCanvas = ref<HTMLCanvasElement | null>(null);
let chartInstancia: Chart | null = null;
const chartExpanded = ref(false);
const filtros = ref<Record<string, unknown>>({});

const detalleDialogVisible = ref(false);
const detalleLoading = ref(false);
const detalleTicket = ref<TicketResponse | null>(null);

async function verDetalle(row: Record<string, unknown>) {
  const id = row.id ?? row.ID ?? row.ventaId;
  if (!id) return;
  detalleLoading.value = true;
  detalleDialogVisible.value = true;
  try {
    const { data } = await obtenerTicket(Number(id));
    detalleTicket.value = data;
  } catch {
    $q.notify({ type: 'negative', message: 'Error al obtener detalle de la venta' });
    detalleDialogVisible.value = false;
  } finally {
    detalleLoading.value = false;
  }
}

function formatearFecha2(fecha?: string) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleString('es-MX', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

const reportes = [
  { key: 'ventas', label: 'Ventas', icon: 'point_of_sale' },
  { key: 'stock', label: 'Stock', icon: 'inventory_2' },
  { key: 'productos', label: 'Productos', icon: 'shopping_bag' },
  { key: 'gastos', label: 'Gastos', icon: 'payments' },
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { key: 'cortes', label: 'Cortes de Caja', icon: 'account_balance' },
  { key: 'clientes', label: 'Clientes', icon: 'people' },
];

const reporteLabel = computed(() => reportes.find(r => r.key === reporteActivo.value)?.label || reporteActivo.value);
const fechaGeneracion = computed(() => new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }));
const usuarioNombre = computed(() => authStore.nombreCompleto || authStore.email || '');

const titulo = computed(() => {
  if (datos.value && typeof datos.value === 'object' && 'titulo' in datos.value) {
    return String(datos.value.titulo);
  }
  return `Reporte de ${reporteLabel.value}`;
});

const filtrosActivos = computed(() => {
  const out: string[] = [];
  Object.entries(filtros.value).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') out.push(`${labelHumano(k)}: ${v}`);
  });
  return out;
});

interface FiltroConfig {
  key: string; label: string; type: 'text' | 'date' | 'number' | 'select';
  options?: { label: string; value: string }[];
}

const filtrosConfig = computed<FiltroConfig[]>(() => {
  switch (reporteActivo.value) {
    case 'ventas': return [
      { key: 'fechaDesde', label: 'Fecha desde', type: 'date' },
      { key: 'fechaHasta', label: 'Fecha hasta', type: 'date' },
      { key: 'usuarioEmail', label: 'Email usuario', type: 'text' },
      { key: 'clienteId', label: 'ID Cliente', type: 'number' },
      { key: 'estado', label: 'Estado', type: 'select', options: [
        { label: 'Completada', value: 'COMPLETADA' }, { label: 'Pendiente', value: 'PENDIENTE' }, { label: 'Cancelada', value: 'CANCELADA' },
      ]},
      { key: 'metodoPago', label: 'Método de pago', type: 'select', options: [
        { label: 'Efectivo', value: 'EFECTIVO' }, { label: 'Tarjeta', value: 'TARJETA' }, { label: 'Transferencia', value: 'TRANSFERENCIA' },
      ]},
    ];
    case 'stock': return [
      { key: 'stockMinimo', label: 'Stock mínimo', type: 'number' },
      { key: 'soloActivos', label: 'Solo activos', type: 'select', options: [
        { label: 'Sí', value: 'true' }, { label: 'No', value: 'false' },
      ]},
    ];
    case 'productos': return [
      { key: 'fechaDesde', label: 'Fecha desde', type: 'date' },
      { key: 'fechaHasta', label: 'Fecha hasta', type: 'date' },
      { key: 'limite', label: 'Límite', type: 'number' },
    ];
    case 'gastos': return [
      { key: 'fechaDesde', label: 'Fecha desde', type: 'date' },
      { key: 'fechaHasta', label: 'Fecha hasta', type: 'date' },
      { key: 'categoria', label: 'Categoría', type: 'text' },
    ];
    case 'dashboard': return [
      { key: 'fecha', label: 'Fecha', type: 'date' },
    ];
    case 'cortes': return [
      { key: 'fechaDesde', label: 'Fecha desde', type: 'date' },
      { key: 'fechaHasta', label: 'Fecha hasta', type: 'date' },
    ];
    case 'clientes': return [
      { key: 'fechaDesde', label: 'Fecha desde', type: 'date' },
      { key: 'fechaHasta', label: 'Fecha hasta', type: 'date' },
      { key: 'limite', label: 'Límite', type: 'number' },
    ];
    default: return [];
  }
});

function filtrosValidos(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  Object.entries(filtros.value).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') out[k] = v;
  });
  return out;
}

function getFilterForReport() {
  const f = filtrosValidos();
  switch (reporteActivo.value) {
    case 'ventas': return f as ReporteVentasFilter;
    case 'stock': return { ...f, soloActivos: f.soloActivos === 'true' } as ReporteStockFilter;
    case 'productos': return f as ReporteProductosFilter;
    case 'gastos': return f as ReporteGastosFilter;
    case 'dashboard': return f as ReporteDashboardFilter;
    case 'cortes': return f as ReporteCortesFilter;
    case 'clientes': return f as ReporteClientesFilter;
    default: return {};
  }
}

async function fetchReporte() {
  cargando.value = true;
  errorMsg.value = '';
  datos.value = null;
  destruirChart();
  try {
    const filter = getFilterForReport();
    let res;
    switch (reporteActivo.value) {
      case 'ventas': res = await reporteVentas(filter as ReporteVentasFilter); break;
      case 'stock': res = await reporteStock(filter as ReporteStockFilter); break;
      case 'productos': res = await reporteProductos(filter as ReporteProductosFilter); break;
      case 'gastos': res = await reporteGastos(filter as ReporteGastosFilter); break;
      case 'dashboard': res = await reporteDashboard(filter as ReporteDashboardFilter); break;
      case 'cortes': res = await reporteCortes(filter as ReporteCortesFilter); break;
      case 'clientes': res = await reporteClientes(filter as ReporteClientesFilter); break;
    }
    datos.value = res.data as Record<string, unknown>;
    if (filas.value.length === 0) {
      errorMsg.value = 'El reporte se generó pero no contiene datos. Revisa los filtros.';
    }
  } catch (e: unknown) {
    errorMsg.value = e instanceof Error ? e.message : 'Error al cargar reporte';
    $q.notify({ type: 'negative', message: errorMsg.value });
  } finally {
    cargando.value = false;
  }
}

function limpiarFiltros() {
  filtros.value = {};
  fetchReporte();
}

// --- Parsing the structured response ---

const columnasDef = computed<string[]>(() => {
  const d = datos.value;
  if (d && 'columnas' in d && Array.isArray(d.columnas)) return d.columnas as string[];
  const filasRaw = filas.value;
  if (filasRaw.length > 0) return Object.keys(filasRaw[0]);
  return [];
});

const filas = computed<Record<string, unknown>[]>(() => {
  const d = datos.value;
  if (!d) return [];
  if ('filas' in d && Array.isArray(d.filas)) return d.filas as Record<string, unknown>[];
  if ('data' in d && Array.isArray(d.data)) return (d.data as Record<string, unknown>[]).map((item, i) => ({ ID: i + 1, ...item }));
  if (Array.isArray(d)) return d.map((item, i) => ({ ID: i + 1, ...(item as Record<string, unknown>) }));
  return [];
});

const tipoGrafico = computed(() => {
  const d = datos.value;
  if (d && 'tipoGrafico' in d) return String(d.tipoGrafico);
  return '';
});

const graficoNombre = computed(() => {
  const d = datos.value;
  if (d && 'graficoNombre' in d) return String(d.graficoNombre);
  return chartTitulo.value;
});

// --- Formatting ---

function fmtFecha(val: unknown): string {
  if (!val) return '';
  const s = String(val);
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hour = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${min}`;
}

function fmtMoneda(val: unknown): string {
  const n = Number(val);
  return isNaN(n) ? String(val || '') : `$${n.toFixed(2)}`;
}

function fmtCelda(key: string, val: unknown): string {
  if (val === undefined || val === null || val === '') return '*N/A*';
  const kLower = key.toLowerCase();
  if (['total', 'monto', 'preciocompra', 'precioventa', 'subtotal', 'credito', 'preciounitario'].includes(kLower)) {
    return fmtMoneda(val);
  }
  if (['fecha', 'fechaventa', 'fechagasto', 'fechacorte', 'createdat'].includes(kLower)) {
    return fmtFecha(val);
  }
  return String(val);
}

function esNumero(key: string): boolean {
  const kLower = key.toLowerCase();
  return ['total', 'monto', 'id', 'cantidad', 'existencia', 'preciocompra', 'precioventa', 'subtotal', 'credito', 'preciounitario'].includes(kLower);
}

const columnasMostrar = computed(() => {
  const cols = columnasDef.value;
  if (cols.length === 0) return [];
  return cols.map(k => ({ key: k, label: labelHumano(k) }));
});

const filasMostrar = computed(() => {
  return filas.value.map(row => {
    const out: Record<string, string> = {};
    columnasDef.value.forEach(k => {
      out[k] = fmtCelda(k, row[k]);
    });
    return out;
  });
});

// --- Resumen ejecutivo ---

const tarjetas = computed(() => {
  const items: { label: string; valor: string }[] = [];
  const rows = filas.value;
  if (rows.length === 0) return items;

  let total = 0;
  let totalCount = 0;
  const clienteConteo: Record<string, number> = {};
  let sinMetodo = 0;

  rows.forEach((r: Record<string, unknown>) => {
    const t = Number(r.Total || r.total || r.monto || 0);
    if (t > 0) { total += t; totalCount++; }
    const cli = String(r.Cliente || r.clienteNombre || r.cliente || '');
    if (cli) clienteConteo[cli] = (clienteConteo[cli] || 0) + 1;
    if (!r.MetodoPago && !r.metodoPago) sinMetodo++;
  });

  items.push({ label: 'Registros', valor: String(rows.length) });
  if (total > 0) items.push({ label: 'Total', valor: fmtMoneda(total) });

  const d = datos.value;
  if (d && typeof d === 'object') {
    const extras: Record<string, string> = {
      totalVentas: 'Ingresos Totales', totalGastos: 'Total Gastos',
      totalProductos: 'Total Productos', totalClientes: 'Total Clientes',
      ventasCount: 'Cant. Ventas', gastosCount: 'Cant. Gastos',
      ingresos: 'Ingresos', egresos: 'Egresos', saldo: 'Saldo',
      ganancia: 'Ganancia', margen: 'Margen %',
    };
    for (const [key, label] of Object.entries(extras)) {
      const v = (d as Record<string, unknown>)[key];
      if (v !== undefined && v !== null && typeof v === 'number') {
        items.push({ label, valor: key === 'margen' ? `${v.toFixed(1)}%` : fmtMoneda(v) });
      }
    }
  }

  return items;
});

const resumenHTML = computed(() => {
  const rows = filas.value;
  if (rows.length === 0) return '';

  if (reporteActivo.value === 'ventas') {
    let total = 0;
    const clienteConteo: Record<string, number> = {};
    let sinMetodo = 0;

    rows.forEach((r: Record<string, unknown>) => {
      total += Number(r.Total || r.total || 0);
      const cli = String(r.Cliente || r.clienteNombre || '');
      if (cli) clienteConteo[cli] = (clienteConteo[cli] || 0) + 1;
      if (!r.MetodoPago && !r.metodoPago) sinMetodo++;
    });

    const promedio = rows.length > 0 ? total / rows.length : 0;
    const sorted = Object.entries(clienteConteo).sort((a, b) => b[1] - a[1]);
    const top1 = sorted[0];
    const top2 = sorted[1];

    let html = `<p><strong>Total de Ventas Realizadas:</strong> ${rows.length} transacciones.</p>`;
    html += `<p><strong>Ingresos Totales:</strong> ${fmtMoneda(total)}</p>`;
    html += `<p><strong>Ticket Promedio:</strong> ${fmtMoneda(promedio)} por venta.</p>`;
    if (top1) {
      html += `<p><strong>Cliente Principal:</strong> "${top1[0]}" (${top1[1]} venta${top1[1] !== 1 ? 's' : ''})`;
      if (top2) html += `, seguido de "${top2[0]}" (${top2[1]} venta${top2[1] !== 1 ? 's' : ''})`;
      html += `.</p>`;
    }
    if (sinMetodo > 0) {
      html += `<p><em>Nota:</em> No se especificó el método de pago en ${sinMetodo} registro${sinMetodo !== 1 ? 's' : ''}.</p>`;
    }
    return html;
  }

  if (reporteActivo.value === 'stock') {
    const bajos = rows.filter(r => Number(r.existencia || 0) < 10);
    const activos = rows.filter(r => r.activo !== false);
    return `<p><strong>Total de productos:</strong> ${rows.length}.</p>
            <p><strong>Productos con stock bajo (&lt;10):</strong> ${bajos.length}.</p>
            <p><strong>Productos activos:</strong> ${activos.length}.</p>`;
  }

  if (reporteActivo.value === 'gastos') {
    const cats = new Set(rows.map(r => String(r.categoria || r.Categoria || 'Sin categoría')));
    let total = 0;
    rows.forEach(r => { total += Number(r.monto || r.Monto || 0); });
    return `<p><strong>Total de gastos:</strong> ${rows.length}.</p>
            <p><strong>Categorías:</strong> ${cats.size} diferentes.</p>
            <p><strong>Monto total:</strong> ${fmtMoneda(total)}.</p>`;
  }

  return '';
});

function colorEstado(estado: string) {
  const c: Record<string, string> = { COMPLETADA: 'positive', CANCELADA: 'negative', PENDIENTE: 'warning' };
  return c[estado] || 'grey';
}

function labelHumano(key: string): string {
  const mapa: Record<string, string> = {
    ID: 'ID', Fecha: 'Fecha y Hora', Cliente: 'Cliente', Usuario: 'Usuario',
    Estado: 'Estado', Total: 'Total', MetodoPago: 'Método de Pago',
    id: 'ID', fecha: 'Fecha', clienteNombre: 'Cliente', usuarioEmail: 'Usuario',
    estado: 'Estado', total: 'Total', metodoPago: 'Método de Pago',
    nombre: 'Nombre', apellido: 'Apellido', email: 'Email',
    codigo: 'Código', descripcion: 'Descripción', categoria: 'Categoría',
    monto: 'Monto', fechaGasto: 'Fecha Gasto',
    subtotal: 'Subtotal', descuento: 'Descuento',
    precioCompra: 'Precio Compra', precioVenta: 'Precio Venta',
    existencia: 'Existencia', pesado: 'Pesado', precioUnitario: 'P. Unitario',
    cantidad: 'Cantidad', credito: 'Crédito', documento: 'Documento',
    direccion: 'Dirección', telefono: 'Teléfono', rol: 'Rol',
    productoNombre: 'Producto', productoCodigo: 'Código Prod.',
    observacion: 'Observación',
  };
  return mapa[key] || key;
}

// --- Charts ---

const mostrarChart = computed(() => filas.value.length > 0 && (tipoGrafico.value || true));
const chartTitulo = computed(() => graficoNombre.value || `Gráfica - ${reporteLabel.value}`);

function buildChartConfig() {
  const items = filas.value;
  if (items.length < 1) return null;

  const chartType = tipoGrafico.value?.toLowerCase() || '';

  if (chartType === 'linea' || chartType === 'line' || (reporteActivo.value === 'ventas' && !chartType)) {
    const fechaKey = columnasDef.value.find(k => /fecha/i.test(k)) || 'Fecha';
    const totalKey = columnasDef.value.find(k => /total/i.test(k) || /monto/i.test(k)) || 'Total';
    const grupos: Record<string, number> = {};
    items.forEach((r: Record<string, unknown>) => {
      const raw = String(r[fechaKey] || '');
      const dia = raw.substring(0, 10);
      if (dia) grupos[dia] = (grupos[dia] || 0) + Number(r[totalKey]) || 0;
    });
    const sorted = Object.entries(grupos).sort(([a], [b]) => a.localeCompare(b));
    return {
      labels: sorted.map(([d]) => {
        const dt = new Date(d + 'T12:00:00');
        return isNaN(dt.getTime()) ? d : dt.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
      }),
      values: sorted.map(([, v]) => v),
      type: 'line' as const,
      label: 'Ingresos ($)',
    };
  }

  if (chartType === 'barra' || chartType === 'bar') {
    const labelKey = columnasDef.value.find(k => /nombre|categoria|categoría/i.test(k)) || columnasDef.value[0] || 'Nombre';
    const valKey = columnasDef.value.find(k => /total|monto|cantidad|existencia/i.test(k)) || columnasDef.value[columnasDef.value.length - 1] || 'Total';
    const sliced = items.slice(0, 15);
    return {
      labels: sliced.map(i => String(i[labelKey] || '').substring(0, 18)),
      values: sliced.map(i => Number(i[valKey]) || 0),
      type: 'bar' as const,
      label: labelHumano(valKey),
    };
  }

  if (chartType === 'dona' || chartType === 'doughnut' || chartType === 'pastel' || chartType === 'pie') {
    const catKey = columnasDef.value.find(k => /categoria|categoría|metodo|nombre/i.test(k)) || columnasDef.value[0] || 'Categoria';
    const valKey = columnasDef.value.find(k => /total|monto|cantidad/i.test(k)) || columnasDef.value[columnasDef.value.length - 1] || 'Total';
    const grupos: Record<string, number> = {};
    items.forEach((r: Record<string, unknown>) => {
      const c = String(r[catKey] || 'Sin categoría');
      grupos[c] = (grupos[c] || 0) + Number(r[valKey]) || 0;
    });
    const sorted = Object.entries(grupos).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return {
      labels: sorted.map(([c]) => c),
      values: sorted.map(([, v]) => v),
      type: 'doughnut' as const,
      label: labelHumano(valKey),
    };
  }

  // auto-detect
  const labelKey = columnasDef.value.find(k => /nombre|categoria/i.test(k)) || columnasDef.value[0] || 'ID';
  const valKey = columnasDef.value.find(k => /total|monto|cantidad|existencia/i.test(k)) || columnasDef.value[columnasDef.value.length - 1] || 'Total';
  const sliced = items.slice(0, 15);
  return {
    labels: sliced.map(i => String(i[labelKey] || '').substring(0, 18)),
    values: sliced.map(i => Number(i[valKey]) || 0),
    type: (sliced.length <= 8 ? 'doughnut' : 'bar') as 'doughnut' | 'bar',
    label: labelHumano(valKey),
  };
}

function renderChart() {
  if (!chartCanvas.value) return;
  const config = buildChartConfig();
  if (!config) return;
  destruirChart();
  const isLine = config.type === 'line';
  const isDoughnut = config.type === 'doughnut';
  chartInstancia = new Chart(chartCanvas.value, {
    type: config.type,
    data: {
      labels: config.labels,
      datasets: [{
        label: config.label,
        data: config.values,
        backgroundColor: isDoughnut
          ? ['#1976D2', '#26A69A', '#F2C037', '#E53935', '#8D6E63', '#5C6BC0', '#26A69A', '#FF7043']
          : isLine ? '#1976D2' : '#26A69A',
        borderColor: isLine ? '#1976D2' : isDoughnut ? '#fff' : undefined,
        borderWidth: isLine ? 2 : isDoughnut ? 2 : undefined,
        fill: isLine ? true : false,
        tension: isLine ? 0.3 : undefined,
        pointRadius: isLine ? 4 : undefined,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: isDoughnut, position: 'right' },
      },
      scales: isLine || (!isDoughnut) ? {
        y: { beginAtZero: true },
        x: { ticks: { maxRotation: 45 } },
      } : undefined,
    },
  });
}

function destruirChart() {
  if (chartInstancia) { chartInstancia.destroy(); chartInstancia = null; }
}

// --- Exports ---

function exportJson() {
  const blob = new Blob([JSON.stringify(datos.value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte-${reporteActivo.value}.json`;
  a.click();
  URL.revokeObjectURL(url);
  $q.notify({ type: 'positive', message: 'JSON descargado' });
}

function htmlTableToXLS() {
  const cols = columnasMostrar.value;
  let html = '<html><head><meta charset="UTF-8"><style>td,th{border:1px solid #ccc;padding:4px 8px;font-size:11px;font-family:Arial}th{background:#1976D2;color:#fff;font-weight:bold}</style></head><body>';
  html += `<h2>${titulo.value}</h2>`;
  html += `<table><thead><tr>${cols.map(c => `<th>${c.label}</th>`).join('')}</tr></thead><tbody>`;
  filasMostrar.value.forEach(row => {
    html += `<tr>${cols.map(c => `<td>${row[c.key]}</td>`).join('')}</tr>`;
  });
  html += '</tbody></table></body></html>';
  return html;
}

function exportExcel() {
  const html = htmlTableToXLS();
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `reporte-${reporteActivo.value}.xls`;
  a.click();
  URL.revokeObjectURL(url);
  $q.notify({ type: 'positive', message: 'Excel descargado' });
}

function exportPdf() {
  const cols = columnasMostrar.value.map(c => ({ label: c.label, dataKey: c.key }));
  const rows = filasMostrar.value.map(r => {
    const obj: Record<string, unknown> = {};
    columnasMostrar.value.forEach(c => { obj[c.key] = r[c.key]; });
    return obj;
  });
  const filtrosLabel: Record<string, string> = {};
  Object.entries(filtrosValidos()).forEach(([k, v]) => { filtrosLabel[labelHumano(k)] = String(v); });
  generarPdf(titulo.value, cols, rows, `reporte-${reporteActivo.value}`, filtrosLabel);
}

function exportPrint() {
  window.print();
}

function fechaHoy(): string {
  const hoy = new Date();
  return hoy.toISOString().substring(0, 10);
}

function filtrosIniciales(reporte: string): Record<string, unknown> {
  if (reporte === 'ventas') {
    const hoy = fechaHoy();
    return { fechaDesde: hoy, fechaHasta: hoy };
  }
  return {};
}

watch(reporteActivo, (nuevo) => { filtros.value = filtrosIniciales(nuevo); fetchReporte(); });
watch(filas, async () => { await nextTick(); renderChart(); }, { deep: true });
onMounted(() => { filtros.value = filtrosIniciales(reporteActivo.value); fetchReporte(); });
onUnmounted(() => destruirChart());
</script>

<style scoped>
.reporte-container {
  max-width: 1100px;
  margin: 0 auto;
}
.reporte-header {
  border-bottom: 2px solid var(--q-primary);
  padding-bottom: 8px;
  margin-bottom: 20px;
}
.resumen-ejecutivo {
  background: var(--q-dark);
  border-left: 4px solid var(--q-primary);
  padding: 16px 20px;
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-sm);
}
.q-markup-table {
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.q-markup-table th {
  font-weight: 600;
  background-color: var(--q-primary);
  color: white;
}
</style>
