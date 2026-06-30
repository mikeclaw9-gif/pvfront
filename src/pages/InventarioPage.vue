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
      <q-card class="dialog-card">
        <q-card-section>
          <div class="text-h6">{{ editando ? 'Editar producto' : 'Nuevo producto' }}</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="guardar" class="q-gutter-y-md">
            <div class="row items-center q-gutter-x-sm">
              <q-input v-model="form.codigo" label="Código" :rules="[required]" outlined lazy-rules class="col" />
              <q-btn icon="qr_code_scanner" color="primary" round flat @click="abrirDialogoScanner">
                <q-tooltip>Escanear código de barras</q-tooltip>
              </q-btn>
            </div>
            <q-input v-model="form.nombre" label="Nombre" :rules="[required]" outlined lazy-rules />
            <q-input v-model="form.descripcion" label="Descripción" type="textarea" outlined />
            <q-input v-model.number="form.precioCompra" label="Precio compra" type="number" :rules="[required, minCero]" outlined lazy-rules />
            <q-input v-model.number="form.precioVenta" label="Precio venta" type="number" :rules="[required, minCero]" outlined lazy-rules />
            <q-input v-model.number="form.existencia" label="Existencia" type="number" outlined />

            <div class="row items-center q-gutter-y-sm">
              <div v-if="imagePreview" class="col-12 flex flex-center relative-position">
                <q-img :src="imagePreview" style="max-width: 200px; max-height: 200px" class="rounded-borders" />
                <q-btn flat dense icon="close" color="negative" size="sm" class="absolute-top-right" @click="removeImage" />
              </div>
              <div class="col-12 row q-gutter-sm justify-center">
                <q-btn icon="folder_open" label="Seleccionar archivo" color="primary" outline @click="triggerFileInput" />
                <q-btn icon="photo_camera" label="Tomar foto" color="primary" outline @click="triggerCamera" />
              </div>
            </div>

            <input ref="fileInputRef" type="file" accept="image/*" style="display: none" @change="onFileSelected" />
            <input ref="cameraInputRef" type="file" accept="image/*" capture="environment" style="display: none" @change="onFileSelected" />

            <q-card-actions align="right">
              <q-btn label="Cancelar" flat color="primary" v-close-popup />
              <q-btn label="Guardar" type="submit" color="primary" />
            </q-card-actions>
          </q-form>
        </q-card-section>
      </q-card>
    </q-dialog>

    <q-dialog v-model="scannerVisible" persistent maximized>
      <q-card class="scanner-card column no-wrap">
        <q-card-section class="text-center">
          <div class="text-h6">Escáner de código de barras</div>
        </q-card-section>
        <q-card-section class="col column flex-center q-gutter-y-md">
          <q-btn icon="photo_camera" label="Tomar foto" color="primary" size="lg" class="full-width" @click="capturarCamara" />
          <q-btn icon="image_search" label="Subir imagen" color="secondary" size="lg" class="full-width" outline @click="subirImagen" />
          <q-img v-if="vistaPrevia" :src="vistaPrevia" style="max-height: 200px; max-width: 100%" />
        </q-card-section>
        <q-card-section v-if="errorScanner" class="text-center text-negative">
          {{ errorScanner }}
        </q-card-section>
        <q-card-actions align="center">
          <q-btn label="Cancelar" flat color="primary" @click="cerrarScanner" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
    <div id="barcode-scanner-dummy" style="display: none"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useProductoStore } from '../stores/producto-store';
import { Notify, Loading } from 'quasar';
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
  imagenUrl: '',
});
const editandoId = ref<number | null>(null);
const imagePreview = ref<string | null>(null);
const fileInputRef = ref<HTMLInputElement | null>(null);
const cameraInputRef = ref<HTMLInputElement | null>(null);


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
      imagenUrl: producto.imagenUrl || '',
    };
    imagePreview.value = producto.imagenUrl || null;
  } else {
    editando.value = false;
    editandoId.value = null;
    form.value = { codigo: '', nombre: '', descripcion: '', precioCompra: 0, precioVenta: 0, existencia: 0, imagenUrl: '' };
    imagePreview.value = null;
  }
  dialogoVisible.value = true;
}

function triggerFileInput() {
  fileInputRef.value?.click();
}

function triggerCamera() {
  cameraInputRef.value?.click();
}

function onFileSelected(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target?.result as string;
    imagePreview.value = dataUrl;
    form.value.imagenUrl = dataUrl;
  };
  reader.readAsDataURL(file);
  input.value = '';
}

function removeImage() {
  imagePreview.value = null;
  form.value.imagenUrl = '';
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

const scannerVisible = ref(false);
const vistaPrevia = ref<string | null>(null);
const errorScanner = ref('');

function abrirDialogoScanner() {
  sessionStorage.setItem('formProducto', JSON.stringify(form.value));
  sessionStorage.setItem('editandoProducto', JSON.stringify({ editando: editando.value, editandoId: editandoId.value, imagePreview: imagePreview.value }));
  dialogoVisible.value = false;
  scannerVisible.value = true;
  errorScanner.value = '';
  vistaPrevia.value = null;
}

function cerrarScanner() {
  scannerVisible.value = false;
  restaurarFormulario();
}

function restaurarFormulario() {
  const guardado = sessionStorage.getItem('formProducto');
  if (guardado) {
    try {
      Object.assign(form.value, JSON.parse(guardado));
    } catch { /* ignore */ }
  }
  const estado = sessionStorage.getItem('editandoProducto');
  if (estado) {
    try {
      const e = JSON.parse(estado);
      editando.value = e.editando;
      editandoId.value = e.editandoId;
      imagePreview.value = e.imagePreview;
    } catch { /* ignore */ }
  }
  sessionStorage.removeItem('formProducto');
  sessionStorage.removeItem('editandoProducto');
  dialogoVisible.value = true;
}

function capturarCamara() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  (input as any).capture = 'environment';
  input.style.display = 'none';
  input.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) procesarImagen(file);
    input.remove();
  });
  document.body.appendChild(input);
  input.click();
}

function subirImagen() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.style.display = 'none';
  input.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) procesarImagen(file);
    input.remove();
  });
  document.body.appendChild(input);
  input.click();
}

async function procesarImagen(file: File) {
  vistaPrevia.value = URL.createObjectURL(file);
  errorScanner.value = '';
  Loading.show({ message: 'Analizando código de barras...' });
  try {
    const code = await detectarCodigo(file);
    Loading.hide();
    if (code) {
      form.value.codigo = code;
      scannerVisible.value = false;
      sessionStorage.removeItem('formProducto');
      sessionStorage.removeItem('editandoProducto');
      dialogoVisible.value = true;
      Notify.create({ type: 'positive', message: 'Código: ' + code });
    } else {
      errorScanner.value = 'No se detectó ningún código de barras en la imagen.';
      Notify.create({ type: 'warning', message: 'Código no detectado. Intenta con otra imagen.' });
    }
  } catch (err: any) {
    Loading.hide();
    errorScanner.value = err.message || 'Error al procesar la imagen';
    Notify.create({ type: 'negative', message: errorScanner.value });
  }
}

async function detectarCodigo(file: File): Promise<string | null> {
  const image = new Image();
  image.src = URL.createObjectURL(file);
  await image.decode();
  if ('BarcodeDetector' in window) {
    try {
      const detector = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'code_93', 'codabar', 'upc_a', 'upc_e', 'itf', 'qr_code', 'data_matrix', 'pdf417', 'aztec'],
      });
      const resultados = await detector.detect(image);
      if (resultados.length > 0) return resultados[0].rawValue;
    } catch { /* fallback */ }
  }
  const { Html5Qrcode } = await import('html5-qrcode');
  const scanner = new Html5Qrcode('barcode-scanner-dummy');
  try {
    const code = await scanner.scanFile(file, false);
    return code;
  } finally {
    scanner.clear();
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

<style scoped>
.dialog-card {
  min-width: 500px;
  max-width: 90vw;
  border-radius: var(--radius-md);
}

.scanner-card {
  width: 100%;
  max-width: 500px;
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
