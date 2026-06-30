<template>
  <div class="q-pa-md">
    <div class="row items-center q-mb-md q-gutter-x-sm">
      <div class="text-h5">Gastos</div>
      <q-space />
      <q-btn label="Imprimir" color="secondary" icon="print" @click="imprimirPDF" />
      <q-btn label="Nuevo gasto" color="primary" icon="add" @click="abrirDialogo()" />
    </div>

    <q-expansion-item label="Filtros" icon="filter_list" class="q-mb-md">
      <div class="row q-col-gutter-md q-pa-sm">
        <div class="col-xs-12 col-sm-4">
          <q-input v-model="filtroTexto" label="Buscar (descripción, categoría)" clearable debounce="300" />
        </div>
        <div class="col-xs-6 col-sm-2">
          <q-input v-model="filtroFechaDesde" label="Fecha desde" type="date" clearable />
        </div>
        <div class="col-xs-6 col-sm-2">
          <q-input v-model="filtroFechaHasta" label="Fecha hasta" type="date" clearable />
        </div>
        <div class="col-xs-6 col-sm-2">
          <q-input v-model.number="filtroMontoMin" label="Monto min" type="number" clearable />
        </div>
        <div class="col-xs-6 col-sm-2">
          <q-input v-model.number="filtroMontoMax" label="Monto max" type="number" clearable />
        </div>
        <div class="col-xs-6 col-sm-2">
          <q-select v-model="filtroEstado" :options="['Activo', 'Inactivo']" label="Estado" clearable />
        </div>
        <div class="col-xs-12 col-sm-2 flex items-center">
          <q-btn label="Limpiar filtros" flat color="primary" @click="limpiarFiltros" />
        </div>
      </div>
    </q-expansion-item>

    <q-table
      :rows="filteredRows"
      :columns="columns"
      row-key="id"
      :loading="store.loading"
      :pagination="pagination"
      @request="onRequest"
      binary-state-sort
    >
      <template v-slot:body-cell-monto="props">
        <q-td>$ {{ props.row.monto.toFixed(2) }}</q-td>
      </template>
      <template v-slot:body-cell-fechaGasto="props">
        <q-td>{{ formatearFecha(props.row.fechaGasto) }}</q-td>
      </template>
      <template v-slot:body-cell-activo="props">
        <q-td>
          <q-chip :color="props.row.activo ? 'green' : 'red'" text-color="white" dense>
            {{ props.row.activo ? 'Activo' : 'Inactivo' }}
          </q-chip>
        </q-td>
      </template>
      <template v-slot:body-cell-acciones="props">
        <q-td>
          <q-btn flat dense icon="edit" color="primary" @click="abrirDialogo(props.row)" />
          <q-btn flat dense icon="toggle_on" :color="props.row.activo ? 'negative' : 'positive'" @click="toggleActivo(props.row)" />
          <q-btn flat dense icon="delete" color="negative" @click="eliminar(props.row)" />
        </q-td>
      </template>
    </q-table>

    <q-dialog v-model="dialogoVisible" persistent>
      <q-card class="dialog-card">
        <q-card-section>
          <div class="text-h6">{{ editando ? 'Editar gasto' : 'Nuevo gasto' }}</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="guardar" class="q-gutter-y-md">
            <q-input v-model="form.descripcion" label="Descripción" :rules="[required]" outlined lazy-rules />
            <q-input v-model.number="form.monto" label="Monto" type="number" :rules="[required, mayorCero]" outlined lazy-rules />
            <q-input v-model="form.categoria" label="Categoría" :rules="[required]" outlined lazy-rules />
            <q-input v-model="form.metodoPago" label="Método de pago" outlined />
            <q-input v-model="form.observacion" label="Observación" type="textarea" outlined />
            <q-input v-model="form.fechaGasto" label="Fecha" type="datetime-local" :rules="[required]" outlined lazy-rules />

            <q-card-actions align="right">
              <q-btn label="Cancelar" flat color="primary" v-close-popup />
              <q-btn label="Guardar" type="submit" color="primary" />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useGastoStore } from '../stores/gasto-store';
import { Notify } from 'quasar';
import { generarPdf } from '../utils/pdf';
import type { GastoResponse, GastoRequest } from '../api/gasto.api';

const store = useGastoStore();

const columns = [
  { name: 'descripcion', label: 'Descripción', field: 'descripcion', align: 'left', sortable: true },
  { name: 'monto', label: 'Monto', field: 'monto', align: 'right', sortable: true },
  { name: 'categoria', label: 'Categoría', field: 'categoria', align: 'left', sortable: true },
  { name: 'metodoPago', label: 'Pago', field: 'metodoPago', align: 'left', sortable: true },
  { name: 'fechaGasto', label: 'Fecha', field: 'fechaGasto', align: 'center', sortable: true },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'center', sortable: true },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center', sortable: false },
];

const pagination = ref({
  sortBy: 'fechaGasto',
  descending: true,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const filtroTexto = ref('');
const filtroFechaDesde = ref('');
const filtroFechaHasta = ref('');
const filtroMontoMin = ref<number | null>(null);
const filtroMontoMax = ref<number | null>(null);
const filtroEstado = ref<string | null>(null);

const dialogoVisible = ref(false);
const editando = ref(false);
const form = ref<GastoRequest>({
  descripcion: '',
  monto: 0,
  categoria: '',
  metodoPago: '',
  observacion: '',
  fechaGasto: '',
});
const editandoId = ref<number | null>(null);

const filteredRows = computed(() => {
  let rows = store.gastos.map((g) => ({ ...g }));
  if (filtroTexto.value) {
    const t = filtroTexto.value.toLowerCase();
    rows = rows.filter((r) => r.descripcion.toLowerCase().includes(t) || r.categoria.toLowerCase().includes(t));
  }
  if (filtroFechaDesde.value) {
    const d = new Date(filtroFechaDesde.value);
    rows = rows.filter((r) => new Date(r.fechaGasto) >= d);
  }
  if (filtroFechaHasta.value) {
    const d = new Date(filtroFechaHasta.value + 'T23:59:59');
    rows = rows.filter((r) => new Date(r.fechaGasto) <= d);
  }
  if (filtroMontoMin.value !== null) {
    rows = rows.filter((r) => r.monto >= filtroMontoMin.value!);
  }
  if (filtroMontoMax.value !== null) {
    rows = rows.filter((r) => r.monto <= filtroMontoMax.value!);
  }
  if (filtroEstado.value) {
    rows = rows.filter((r) => (filtroEstado.value === 'Activo') === r.activo);
  }
  return rows;
});

onMounted(() => store.listar());

function onRequest(req: any) {
  const { page, rowsPerPage, sortBy, descending } = req.pagination;
  store.listar({ page: page - 1, size: rowsPerPage, sortBy, sortDir: descending ? 'desc' : 'asc' });
  pagination.value = { ...pagination.value, page, rowsPerPage, sortBy, descending };
}

function required(val: any) { return !!val || 'Campo requerido'; }
function mayorCero(val: number) { return val > 0 || 'Debe ser mayor a 0'; }

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

function abrirDialogo(gasto?: GastoResponse) {
  if (gasto) {
    editando.value = true;
    editandoId.value = gasto.id;
    form.value = {
      descripcion: gasto.descripcion,
      monto: gasto.monto,
      categoria: gasto.categoria,
      metodoPago: gasto.metodoPago,
      observacion: gasto.observacion,
      fechaGasto: gasto.fechaGasto?.substring(0, 16) || '',
    };
  } else {
    editando.value = false;
    editandoId.value = null;
    const ahora = new Date();
    const offset = ahora.getTimezoneOffset();
    const local = new Date(ahora.getTime() - offset * 60000);
    form.value = {
      descripcion: '',
      monto: 0,
      categoria: '',
      metodoPago: '',
      observacion: '',
      fechaGasto: local.toISOString().substring(0, 16),
    };
  }
  dialogoVisible.value = true;
}

async function guardar() {
  try {
    const payload = { ...form.value };
    if (editando.value && editandoId.value) {
      await store.actualizar(editandoId.value, payload);
      Notify.create({ type: 'positive', message: 'Gasto actualizado' });
    } else {
      await store.crear(payload);
      Notify.create({ type: 'positive', message: 'Gasto creado' });
    }
    dialogoVisible.value = false;
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Error al guardar' });
  }
}

async function toggleActivo(gasto: GastoResponse) {
  try {
    await store.toggleActivo(gasto.id);
    Notify.create({ type: 'positive', message: `Gasto ${gasto.activo ? 'desactivado' : 'activado'}` });
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Error al cambiar estado' });
  }
}

async function eliminar(gasto: GastoResponse) {
  try {
    await store.eliminar(gasto.id);
    Notify.create({ type: 'positive', message: 'Gasto eliminado' });
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Error al eliminar' });
  }
}

function limpiarFiltros() {
  filtroTexto.value = '';
  filtroFechaDesde.value = '';
  filtroFechaHasta.value = '';
  filtroMontoMin.value = null;
  filtroMontoMax.value = null;
  filtroEstado.value = null;
}

function imprimirPDF() {
  const filtros: Record<string, string> = {};
  if (filtroTexto.value) filtros['Buscar'] = filtroTexto.value;
  if (filtroFechaDesde.value) filtros['Fecha desde'] = filtroFechaDesde.value;
  if (filtroFechaHasta.value) filtros['Fecha hasta'] = filtroFechaHasta.value;
  if (filtroEstado.value) filtros['Estado'] = filtroEstado.value;
  generarPdf(
    'Gastos',
    [
      { label: 'Descripción', dataKey: 'descripcion' },
      { label: 'Monto', dataKey: 'monto' },
      { label: 'Categoría', dataKey: 'categoria' },
      { label: 'Método de pago', dataKey: 'metodoPago' },
      { label: 'Fecha', dataKey: 'fechaGasto' },
      { label: 'Estado', dataKey: 'activo' },
    ],
    filteredRows.value,
    'gastos.pdf',
    Object.keys(filtros).length > 0 ? filtros : undefined,
  );
}
</script>

<style scoped>
.dialog-card {
  min-width: 500px;
  max-width: 90vw;
}

@media (max-width: 600px) {
  .dialog-card {
    min-width: 95vw;
  }
}
</style>
