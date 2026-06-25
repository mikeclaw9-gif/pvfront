<template>
  <div class="q-pa-md">
    <div class="row items-center q-mb-md q-gutter-x-sm">
      <div class="text-h5">Inventario</div>
      <q-space />
      <q-btn label="Imprimir" color="secondary" icon="print" @click="imprimirPDF" />
      <q-btn label="Nuevo producto" color="primary" icon="add" @click="abrirDialogo()" />
    </div>

    <q-expansion-item label="Filtros" icon="filter_list" class="q-mb-md">
      <div class="row q-col-gutter-md q-pa-sm">
        <div class="col-xs-12 col-sm-4">
          <q-input v-model="filtroTexto" label="Buscar (código, nombre, descripción)" clearable debounce="300" />
        </div>
        <div class="col-xs-6 col-sm-2">
          <q-input v-model.number="filtroPrecioCompraMin" label="Compra min" type="number" clearable />
        </div>
        <div class="col-xs-6 col-sm-2">
          <q-input v-model.number="filtroPrecioCompraMax" label="Compra max" type="number" clearable />
        </div>
        <div class="col-xs-6 col-sm-2">
          <q-input v-model.number="filtroPrecioVentaMin" label="Venta min" type="number" clearable />
        </div>
        <div class="col-xs-6 col-sm-2">
          <q-input v-model.number="filtroPrecioVentaMax" label="Venta max" type="number" clearable />
        </div>
        <div class="col-xs-6 col-sm-2">
          <q-input v-model.number="filtroStockMin" label="Stock min" type="number" clearable />
        </div>
        <div class="col-xs-6 col-sm-2">
          <q-input v-model.number="filtroStockMax" label="Stock max" type="number" clearable />
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
      <template v-slot:body-cell-descripcion="props">
        <q-td>
          <span v-if="!props.row._expandDesc">{{ props.row.descripcion?.substring(0, 50) }}{{ props.row.descripcion?.length > 50 ? '...' : '' }}</span>
          <span v-else>{{ props.row.descripcion }}</span>
          <q-btn v-if="props.row.descripcion?.length > 50" flat dense size="sm" icon="expand_more" @click="props.row._expandDesc = !props.row._expandDesc" />
        </q-td>
      </template>
      <template v-slot:body-cell-precioCompra="props">
        <q-td>$ {{ props.row.precioCompra.toFixed(2) }}</q-td>
      </template>
      <template v-slot:body-cell-precioVenta="props">
        <q-td>$ {{ props.row.precioVenta.toFixed(2) }}</q-td>
      </template>
      <template v-slot:body-cell-existencia="props">
        <q-td class="text-center">{{ props.row.existencia }}</q-td>
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
      <q-card style="min-width: 500px">
        <q-card-section>
          <div class="text-h6">{{ editando ? 'Editar producto' : 'Nuevo producto' }}</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="guardar" class="q-gutter-y-md">
            <q-input v-model="form.codigo" label="Código" :rules="[required]" outlined lazy-rules />
            <q-input v-model="form.nombre" label="Nombre" :rules="[required]" outlined lazy-rules />
            <q-input v-model="form.descripcion" label="Descripción" type="textarea" outlined />
            <q-input v-model.number="form.precioCompra" label="Precio compra" type="number" :rules="[required, minCero]" outlined lazy-rules />
            <q-input v-model.number="form.precioVenta" label="Precio venta" type="number" :rules="[required, minCero]" outlined lazy-rules />
            <q-input v-model.number="form.existencia" label="Existencia" type="number" outlined />
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
import { useProductoStore } from '../stores/producto-store';
import { Notify } from 'quasar';
import { generarPdf } from '../utils/pdf';
import type { ProductoResponse, ProductoRequest } from '../api/producto.api';

const store = useProductoStore();

const columns = [
  { name: 'codigo', label: 'Código', field: 'codigo', align: 'left', sortable: true },
  { name: 'nombre', label: 'Nombre', field: 'nombre', align: 'left', sortable: true },
  { name: 'descripcion', label: 'Descripción', field: 'descripcion', align: 'left', sortable: false },
  { name: 'precioCompra', label: 'Compra', field: 'precioCompra', align: 'right', sortable: true },
  { name: 'precioVenta', label: 'Venta', field: 'precioVenta', align: 'right', sortable: true },
  { name: 'existencia', label: 'Stock', field: 'existencia', align: 'center', sortable: true },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'center', sortable: true },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center', sortable: false },
];

const pagination = ref({
  sortBy: 'codigo',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const filtroTexto = ref('');
const filtroPrecioCompraMin = ref<number | null>(null);
const filtroPrecioCompraMax = ref<number | null>(null);
const filtroPrecioVentaMin = ref<number | null>(null);
const filtroPrecioVentaMax = ref<number | null>(null);
const filtroStockMin = ref<number | null>(null);
const filtroStockMax = ref<number | null>(null);
const filtroEstado = ref<string | null>(null);

const dialogoVisible = ref(false);
const editando = ref(false);
const form = ref<ProductoRequest>({
  codigo: '',
  nombre: '',
  descripcion: '',
  precioCompra: 0,
  precioVenta: 0,
  existencia: 0,
});
const editandoId = ref<string | null>(null);

const filteredRows = computed(() => {
  let rows = store.productos.map((p) => ({ ...p, _expandDesc: false }));
  if (filtroTexto.value) {
    const t = filtroTexto.value.toLowerCase();
    rows = rows.filter((r) => r.codigo.toLowerCase().includes(t) || r.nombre.toLowerCase().includes(t) || (r.descripcion && r.descripcion.toLowerCase().includes(t)));
  }
  if (filtroPrecioCompraMin.value !== null) rows = rows.filter((r) => r.precioCompra >= filtroPrecioCompraMin.value!);
  if (filtroPrecioCompraMax.value !== null) rows = rows.filter((r) => r.precioCompra <= filtroPrecioCompraMax.value!);
  if (filtroPrecioVentaMin.value !== null) rows = rows.filter((r) => r.precioVenta >= filtroPrecioVentaMin.value!);
  if (filtroPrecioVentaMax.value !== null) rows = rows.filter((r) => r.precioVenta <= filtroPrecioVentaMax.value!);
  if (filtroStockMin.value !== null) rows = rows.filter((r) => r.existencia >= filtroStockMin.value!);
  if (filtroStockMax.value !== null) rows = rows.filter((r) => r.existencia <= filtroStockMax.value!);
  if (filtroEstado.value) rows = rows.filter((r) => (filtroEstado.value === 'Activo') === r.activo);
  return rows;
});

onMounted(() => store.listar());

function onRequest(req: any) {
  const { page, rowsPerPage, sortBy, descending } = req.pagination;
  store.listar({ page: page - 1, size: rowsPerPage, sortBy, sortDir: descending ? 'desc' : 'asc' });
  pagination.value = { ...pagination.value, page, rowsPerPage, sortBy, descending };
}

function required(val: any) { return !!val || 'Campo requerido'; }
function minCero(val: number) { return val >= 0 || 'Debe ser >= 0'; }

function abrirDialogo(producto?: ProductoResponse) {
  if (producto) {
    editando.value = true;
    editandoId.value = producto.id;
    form.value = {
      codigo: producto.codigo,
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      precioCompra: producto.precioCompra,
      precioVenta: producto.precioVenta,
      existencia: producto.existencia,
    };
  } else {
    editando.value = false;
    editandoId.value = null;
    form.value = { codigo: '', nombre: '', descripcion: '', precioCompra: 0, precioVenta: 0, existencia: 0 };
  }
  dialogoVisible.value = true;
}

async function guardar() {
  try {
    if (editando.value && editandoId.value) {
      await store.actualizar(editandoId.value, form.value);
      Notify.create({ type: 'positive', message: 'Producto actualizado' });
    } else {
      await store.crear(form.value);
      Notify.create({ type: 'positive', message: 'Producto creado' });
    }
    dialogoVisible.value = false;
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Error al guardar' });
  }
}

async function toggleActivo(producto: ProductoResponse) {
  try {
    await store.toggleActivo(producto.id);
    Notify.create({ type: 'positive', message: `Producto ${producto.activo ? 'desactivado' : 'activado'}` });
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Error al cambiar estado' });
  }
}

async function eliminar(producto: ProductoResponse) {
  try {
    await store.eliminar(producto.id);
    Notify.create({ type: 'positive', message: 'Producto eliminado' });
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Error al eliminar' });
  }
}

function limpiarFiltros() {
  filtroTexto.value = '';
  filtroPrecioCompraMin.value = null;
  filtroPrecioCompraMax.value = null;
  filtroPrecioVentaMin.value = null;
  filtroPrecioVentaMax.value = null;
  filtroStockMin.value = null;
  filtroStockMax.value = null;
  filtroEstado.value = null;
}

function imprimirPDF() {
  const filtros: Record<string, string> = {};
  if (filtroTexto.value) filtros['Buscar'] = filtroTexto.value;
  if (filtroEstado.value) filtros['Estado'] = filtroEstado.value;
  generarPdf(
    'Inventario',
    [
      { label: 'Código', dataKey: 'codigo' },
      { label: 'Nombre', dataKey: 'nombre' },
      { label: 'Compra', dataKey: 'precioCompra' },
      { label: 'Venta', dataKey: 'precioVenta' },
      { label: 'Stock', dataKey: 'existencia' },
      { label: 'Estado', dataKey: 'activo' },
    ],
    filteredRows.value,
    'inventario.pdf',
    Object.keys(filtros).length > 0 ? filtros : undefined,
  );
}
</script>
