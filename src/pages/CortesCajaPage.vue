<template>
  <div class="q-pa-md">
    <div class="row items-center q-mb-md q-gutter-x-sm">
      <div class="text-h5">Cortes de Caja</div>
      <q-space />
      <q-btn
        v-if="store.hayCorteAbierto"
        flat dense round icon="refresh"
        @click="store.refrescarOperaciones()"
        :loading="store.cargandoOperaciones"
      >
        <q-tooltip>Actualizar ventas y gastos</q-tooltip>
      </q-btn>
      <q-btn
        v-if="!store.hayCorteAbierto"
        label="Abrir caja"
        color="positive"
        icon="play_arrow"
        @click="mostrarAbrirDialogo = true"
      />
      <q-btn
        v-if="store.hayCorteAbierto"
        label="Cerrar caja"
        color="warning"
        icon="stop"
        @click="prepararCierre"
      />
    </div>

    <q-banner v-if="store.cargandoEstado" class="bg-grey-3 q-mb-md">
      <q-spinner size="sm" /> Verificando estado de caja...
    </q-banner>

    <q-card v-else-if="store.hayCorteAbierto && store.corteAbierto" flat bordered class="q-mb-md">
      <q-card-section class="bg-positive text-white text-center">
        <div class="text-subtitle1 text-weight-bold">
          <q-icon name="check_circle" class="q-mr-sm" />Corte ABIERTO
        </div>
        <div class="text-caption">
          Abierto {{ formatearFecha(store.corteAbierto.fechaApertura) }}
        </div>
      </q-card-section>
      <q-card-section>
        <div class="row q-col-gutter-md">
          <div class="col-6 col-sm-4">
            <div class="text-caption text-grey">Monto inicial</div>
            <div class="text-body1 text-weight-bold">${{ store.corteAbierto.montoInicial.toFixed(2) }}</div>
          </div>
          <div class="col-6 col-sm-4">
            <div class="text-caption text-grey">Ventas acumuladas (hoy)</div>
            <div class="text-body1 text-weight-bold">${{ store.totalVentasHoy.toFixed(2) }}</div>
          </div>
          <div class="col-6 col-sm-4">
            <div class="text-caption text-grey">Gastos acumulados (hoy)</div>
            <div class="text-body1 text-weight-bold">${{ store.totalGastosHoy.toFixed(2) }}</div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="text-caption text-grey">Efectivo</div>
            <div class="text-body1 text-weight-bold">${{ (store.corteAbierto.totalEfectivo || 0).toFixed(2) }}</div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="text-caption text-grey">Tarjeta</div>
            <div class="text-body1 text-weight-bold">${{ (store.corteAbierto.totalTarjeta || 0).toFixed(2) }}</div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="text-caption text-grey">Transferencia</div>
            <div class="text-body1 text-weight-bold">${{ (store.corteAbierto.totalTransferencia || 0).toFixed(2) }}</div>
          </div>
          <div class="col-6 col-sm-3">
            <div class="text-caption text-grey">Abierto por</div>
            <div class="text-body2">{{ store.corteAbierto.usuarioNombre || store.corteAbierto.usuarioEmail }}</div>
          </div>
        </div>
        <q-separator class="q-my-sm" />
        <div class="row items-center text-caption text-grey">
          <q-icon name="info" size="xs" class="q-mr-xs" />
          Ventas: {{ ventasCompletadasCount }} completadas &middot;
          Gastos: {{ store.gastosHoy.length }} registrados
          <q-spinner v-if="store.cargandoOperaciones" size="xs" class="q-ml-sm" />
        </div>
      </q-card-section>
    </q-card>

    <q-card v-else flat bordered class="q-mb-md">
      <q-card-section class="text-center text-grey q-py-lg">
        <q-icon name="account_balance" size="48px" class="q-mb-sm" />
        <div class="text-body1">No hay corte de caja abierto</div>
        <div class="text-caption q-mt-xs">Presiona "Abrir caja" para iniciar un nuevo turno</div>
      </q-card-section>
    </q-card>

    <div class="text-subtitle2 q-mb-sm">Historial de cortes</div>

    <q-table
      :rows="store.cortes"
      :columns="columns"
      row-key="id"
      :loading="store.loading"
      :pagination="pagination"
      @request="onRequest"
      binary-state-sort
    >
      <template v-slot:body-cell-montoInicial="props">
        <q-td>${{ props.row.montoInicial.toFixed(2) }}</q-td>
      </template>
      <template v-slot:body-cell-montoFinal="props">
        <q-td>${{ (props.row.montoFinal ?? 0).toFixed(2) }}</q-td>
      </template>
      <template v-slot:body-cell-totalVentas="props">
        <q-td>${{ props.row.totalVentas.toFixed(2) }}</q-td>
      </template>
      <template v-slot:body-cell-fechaApertura="props">
        <q-td>{{ formatearFecha(props.row.fechaApertura) }}</q-td>
      </template>
      <template v-slot:body-cell-fechaCierre="props">
        <q-td>{{ props.row.fechaCierre ? formatearFecha(props.row.fechaCierre) : '—' }}</q-td>
      </template>
      <template v-slot:body-cell-estado="props">
        <q-td>
          <q-chip
            :color="props.row.estado === 'ABIERTO' ? 'positive' : 'grey-7'"
            text-color="white"
            dense
          >
            {{ props.row.estado === 'ABIERTO' ? 'Abierto' : 'Cerrado' }}
          </q-chip>
        </q-td>
      </template>
      <template v-slot:body-cell-acciones="props">
        <q-td>
          <q-btn flat dense icon="visibility" color="primary" @click="verDetalle(props.row)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="mostrarAbrirDialogo" persistent>
      <q-card class="dialog-card">
        <q-card-section>
          <div class="text-h6">Abrir corte de caja</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="ejecutarAbrir" class="q-gutter-y-md">
            <q-input
              v-model.number="formAbrir.montoInicial"
              label="Monto inicial *"
              type="number"
              :rules="[required, mayorIgualCero]"
              outlined
              lazy-rules
              step="0.01"
              min="0"
            />
            <q-input
              v-model="formAbrir.observacion"
              label="Observación"
              type="textarea"
              outlined
            />
            <q-card-actions align="right">
              <q-btn label="Cancelar" flat color="primary" v-close-popup />
              <q-btn label="Abrir caja" type="submit" color="positive" :loading="guardando" />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="mostrarCerrarDialogo" persistent>
      <q-card class="dialog-card">
        <q-card-section>
          <div class="text-h6">Cerrar corte de caja</div>
        </q-card-section>
        <q-card-section>
          <div class="row q-col-gutter-md q-mb-md">
            <div class="col-4"><q-card flat bordered><q-card-section class="text-center"><div class="text-caption text-grey">Ventas</div><div class="text-weight-bold">${{ store.totalVentasHoy.toFixed(2) }}</div></q-card-section></q-card></div>
            <div class="col-4"><q-card flat bordered><q-card-section class="text-center"><div class="text-caption text-grey">Gastos</div><div class="text-weight-bold">${{ store.totalGastosHoy.toFixed(2) }}</div></q-card-section></q-card></div>
            <div class="col-4"><q-card flat bordered><q-card-section class="text-center"><div class="text-caption text-grey">Inicial</div><div class="text-weight-bold">${{ store.corteAbierto?.montoInicial.toFixed(2) }}</div></q-card-section></q-card></div>
          </div>
          <q-form @submit.prevent="ejecutarCerrar" class="q-gutter-y-md">
            <q-input
              v-model.number="formCerrar.montoFinal"
              label="Monto final (conteo real) *"
              type="number"
              :rules="[required, mayorIgualCero]"
              outlined
              lazy-rules
              step="0.01"
              min="0"
            />
            <q-input
              v-model="formCerrar.observacion"
              label="Observación"
              type="textarea"
              outlined
            />
            <q-card-actions align="right">
              <q-btn label="Cancelar" flat color="primary" v-close-popup />
              <q-btn label="Cerrar caja" type="submit" color="warning" :loading="guardando" />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="detalleVisible" maximized>
      <q-card>
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="account_balance" size="sm" color="primary" />
          <span class="text-h6">Corte #{{ detalle?.id }}</span>
          <q-chip v-if="detalle" :color="detalle.estado === 'ABIERTO' ? 'positive' : 'grey-7'" text-color="white" dense>
            {{ detalle.estado === 'ABIERTO' ? 'Abierto' : 'Cerrado' }}
          </q-chip>
          <q-space />
          <q-btn flat round dense icon="close" v-close-popup />
        </q-card-section>
        <q-separator />
        <q-card-section v-if="detalle" class="row q-col-gutter-md">
          <div class="col-12 col-sm-6">
            <div class="text-subtitle2 text-weight-bold q-mb-sm">Información general</div>
            <div class="q-mb-xs"><span class="text-grey">ID:</span> {{ detalle.id }}</div>
            <div class="q-mb-xs"><span class="text-grey">Estado:</span> {{ detalle.estado }}</div>
            <div class="q-mb-xs"><span class="text-grey">Apertura:</span> {{ formatearFecha(detalle.fechaApertura) }}</div>
            <div class="q-mb-xs"><span class="text-grey">Cierre:</span> {{ detalle.fechaCierre ? formatearFecha(detalle.fechaCierre) : '—' }}</div>
            <div class="q-mb-xs"><span class="text-grey">Usuario:</span> {{ detalle.usuarioNombre || detalle.usuarioEmail }}</div>
            <div class="q-mb-xs"><span class="text-grey">Observación:</span> {{ detalle.observacion || '—' }}</div>
          </div>
          <div class="col-12 col-sm-6">
            <div class="text-subtitle2 text-weight-bold q-mb-sm">Montos</div>
            <div class="row q-col-gutter-sm">
              <div class="col-6"><q-card flat bordered><q-card-section class="text-center"><div class="text-caption text-grey">Inicial</div><div class="text-body2 text-weight-bold">${{ detalle.montoInicial.toFixed(2) }}</div></q-card-section></q-card></div>
              <div class="col-6"><q-card flat bordered><q-card-section class="text-center"><div class="text-caption text-grey">Final (conteo)</div><div class="text-body2 text-weight-bold">${{ (detalle.montoFinal ?? 0).toFixed(2) }}</div></q-card-section></q-card></div>
              <div class="col-6"><q-card flat bordered><q-card-section class="text-center"><div class="text-caption text-grey">Ventas</div><div class="text-body2 text-weight-bold text-positive">${{ detalle.totalVentas.toFixed(2) }}</div></q-card-section></q-card></div>
              <div class="col-6"><q-card flat bordered><q-card-section class="text-center"><div class="text-caption text-grey">Gastos</div><div class="text-body2 text-weight-bold text-negative">${{ detalle.totalGastos.toFixed(2) }}</div></q-card-section></q-card></div>
              <div class="col-6"><q-card flat bordered><q-card-section class="text-center"><div class="text-caption text-grey">Diferencia</div><div class="text-body2 text-weight-bold" :class="diferenciaColor(detalle.diferencia)">${{ detalle.diferencia.toFixed(2) }}</div></q-card-section></q-card></div>
              <div class="col-6"><q-card flat bordered><q-card-section class="text-center"><div class="text-caption text-grey">Creado</div><div class="text-body2">{{ formatearFecha(detalle.createdAt) }}</div></q-card-section></q-card></div>
            </div>
          </div>
          <div class="col-12">
            <div class="text-subtitle2 text-weight-bold q-mb-sm">Métodos de pago</div>
            <div class="row q-col-gutter-sm">
              <div class="col-4"><q-card flat bordered><q-card-section class="text-center"><div class="text-caption text-grey">Efectivo</div><div class="text-body1 text-weight-bold">${{ (detalle.totalEfectivo || 0).toFixed(2) }}</div></q-card-section></q-card></div>
              <div class="col-4"><q-card flat bordered><q-card-section class="text-center"><div class="text-caption text-grey">Tarjeta</div><div class="text-body1 text-weight-bold">${{ (detalle.totalTarjeta || 0).toFixed(2) }}</div></q-card-section></q-card></div>
              <div class="col-4"><q-card flat bordered><q-card-section class="text-center"><div class="text-caption text-grey">Transferencia</div><div class="text-body1 text-weight-bold">${{ (detalle.totalTransferencia || 0).toFixed(2) }}</div></q-card-section></q-card></div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useCorteCajaStore } from '../stores/corte-caja-store';
import { Notify } from 'quasar';
import type { CorteCajaResponse, AbrirCorteRequest, CerrarCorteRequest } from '../api/corte-caja.api';

const store = useCorteCajaStore();

const columns = [
  { name: 'id', label: '#', field: 'id', align: 'left', sortable: true },
  { name: 'fechaApertura', label: 'Apertura', field: 'fechaApertura', align: 'center', sortable: true },
  { name: 'fechaCierre', label: 'Cierre', field: 'fechaCierre', align: 'center', sortable: true },
  { name: 'montoInicial', label: 'Inicial', field: 'montoInicial', align: 'right', sortable: true },
  { name: 'totalVentas', label: 'Ventas', field: 'totalVentas', align: 'right', sortable: true },
  { name: 'montoFinal', label: 'Final', field: 'montoFinal', align: 'right', sortable: true },
  { name: 'estado', label: 'Estado', field: 'estado', align: 'center', sortable: true },
  { name: 'usuarioNombre', label: 'Usuario', field: 'usuarioNombre', align: 'left', sortable: true },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center', sortable: false },
];

const pagination = ref({
  sortBy: 'fechaApertura',
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const mostrarAbrirDialogo = ref(false);
const mostrarCerrarDialogo = ref(false);
const detalleVisible = ref(false);
const detalle = ref<CorteCajaResponse | null>(null);
const guardando = ref(false);

const formAbrir = ref<AbrirCorteRequest>({
  montoInicial: 0,
  observacion: '',
});

const formCerrar = ref<CerrarCorteRequest>({
  montoFinal: 0,
  observacion: '',
});

const ventasCompletadasCount = computed(() =>
  store.ventasHoy.filter(v => v.estado === 'COMPLETADA').length
);

onMounted(async () => {
  await store.verificarCorteAbierto();
  await store.listar();
});

function onRequest(req: any) {
  const { page, rowsPerPage, sortBy, descending } = req.pagination;
  store.listar({ page: page - 1, size: rowsPerPage, sortBy, sortDir: descending ? 'desc' : 'asc' });
  pagination.value = { ...pagination.value, page, rowsPerPage, sortBy, descending };
}

function required(val: any) { return val !== undefined && val !== null && val !== '' || 'Campo requerido'; }
function mayorIgualCero(val: number) { return val >= 0 || 'No puede ser negativo'; }

function formatearFecha(fecha: string) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function diferenciaColor(diferencia: number) {
  if (diferencia > 0) return 'text-positive';
  if (diferencia < 0) return 'text-negative';
  return '';
}

function prepararCierre() {
  if (!store.corteAbierto) return;
  // Monto esperado en caja = inicial + ventas - gastos
  formCerrar.value = {
    montoFinal: store.corteAbierto.montoInicial + store.totalVentasHoy - store.totalGastosHoy,
    observacion: '',
  };
  mostrarCerrarDialogo.value = true;
}

async function ejecutarAbrir() {
  guardando.value = true;
  try {
    await store.abrir(formAbrir.value);
    Notify.create({ type: 'positive', message: 'Corte de caja abierto correctamente' });
    mostrarAbrirDialogo.value = false;
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Error al abrir corte' });
  } finally {
    guardando.value = false;
  }
}

async function ejecutarCerrar() {
  if (!store.corteAbierto) return;
  guardando.value = true;
  try {
    await store.cerrar(store.corteAbierto.id, formCerrar.value);
    Notify.create({ type: 'positive', message: 'Corte de caja cerrado correctamente' });
    mostrarCerrarDialogo.value = false;
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Error al cerrar corte' });
  } finally {
    guardando.value = false;
  }
}

function verDetalle(corte: CorteCajaResponse) {
  // Si es el corte abierto activo, sobrescribir los totales con los datos reales del store
  if (corte.estado === 'ABIERTO' && store.corteAbierto && corte.id === store.corteAbierto.id) {
    detalle.value = {
      ...corte,
      totalVentas: store.totalVentasHoy,
      totalGastos: store.totalGastosHoy,
      diferencia: corte.montoInicial + store.totalVentasHoy - store.totalGastosHoy,
    };
  } else {
    detalle.value = corte;
  }
  detalleVisible.value = true;
}
</script>

<style scoped>
.dialog-card {
  min-width: 500px;
  max-width: 90vw;
  border-radius: var(--radius-md);
}

:deep(.q-table) {
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

:deep(.q-table thead th) {
  font-weight: 600;
  background: var(--q-primary);
  color: white;
}

@media (max-width: 600px) {
  .dialog-card {
    min-width: 95vw;
  }
}
</style>
