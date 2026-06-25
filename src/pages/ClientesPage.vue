<template>
  <div class="q-pa-md">
    <div class="row items-center q-mb-md q-gutter-x-sm">
      <div class="text-h5">Clientes</div>
      <q-space />
      <q-btn label="Imprimir" color="secondary" icon="print" @click="imprimirPDF" />
      <q-btn label="Nuevo cliente" color="primary" icon="add" @click="abrirDialogo()" />
    </div>

    <q-expansion-item label="Filtros" icon="filter_list" class="q-mb-md">
      <div class="row q-col-gutter-md q-pa-sm">
        <div class="col-xs-12 col-sm-4">
          <q-input v-model="filtroTexto" label="Buscar (nombre, apellido, email, documento)" clearable debounce="300" />
        </div>
        <div class="col-xs-6 col-sm-3">
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
      <template v-slot:body-cell-nombreCompleto="props">
        <q-td>{{ props.row.nombre }} {{ props.row.apellido }}</q-td>
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
          <div class="text-h6">{{ editando ? 'Editar cliente' : 'Nuevo cliente' }}</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="guardar" class="q-gutter-y-md">
            <q-input v-model="form.nombre" label="Nombre" :rules="[required]" outlined lazy-rules />
            <q-input v-model="form.apellido" label="Apellido" :rules="[required]" outlined lazy-rules />
            <q-input v-model="form.email" label="Email" type="email" :rules="[required, validEmail]" outlined lazy-rules />
            <q-input v-model="form.telefono" label="Teléfono" outlined />
            <q-input v-model="form.direccion" label="Dirección" outlined />
            <q-input v-model="form.documento" label="Documento (DNI/RUC)" outlined />
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
import { useClienteStore } from '../stores/cliente-store';
import { Notify } from 'quasar';
import { generarPdf } from '../utils/pdf';
import type { ClienteResponse, ClienteRequest } from '../api/cliente.api';

const store = useClienteStore();

const columns = [
  { name: 'nombreCompleto', label: 'Nombre completo', field: 'nombre', align: 'left', sortable: false },
  { name: 'email', label: 'Email', field: 'email', align: 'left', sortable: true },
  { name: 'telefono', label: 'Teléfono', field: 'telefono', align: 'left', sortable: false },
  { name: 'direccion', label: 'Dirección', field: 'direccion', align: 'left', sortable: false },
  { name: 'documento', label: 'Documento', field: 'documento', align: 'center', sortable: true },
  { name: 'activo', label: 'Estado', field: 'activo', align: 'center', sortable: true },
  { name: 'acciones', label: 'Acciones', field: 'acciones', align: 'center', sortable: false },
];

const pagination = ref({
  sortBy: 'nombre',
  descending: false,
  page: 1,
  rowsPerPage: 10,
  rowsNumber: 0,
});

const filtroTexto = ref('');
const filtroEstado = ref<string | null>(null);

const dialogoVisible = ref(false);
const editando = ref(false);
const form = ref<ClienteRequest>({
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  direccion: '',
  documento: '',
});
const editandoId = ref<string | null>(null);

const filteredRows = computed(() => {
  let rows = store.clientes;
  if (filtroTexto.value) {
    const t = filtroTexto.value.toLowerCase();
    rows = rows.filter(
      (r) =>
        r.nombre.toLowerCase().includes(t) ||
        r.apellido.toLowerCase().includes(t) ||
        r.email.toLowerCase().includes(t) ||
        r.documento.toLowerCase().includes(t),
    );
  }
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
function validEmail(val: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val) || 'Email inválido'; }

function abrirDialogo(cliente?: ClienteResponse) {
  if (cliente) {
    editando.value = true;
    editandoId.value = cliente.id;
    form.value = {
      nombre: cliente.nombre,
      apellido: cliente.apellido,
      email: cliente.email,
      telefono: cliente.telefono,
      direccion: cliente.direccion,
      documento: cliente.documento,
    };
  } else {
    editando.value = false;
    editandoId.value = null;
    form.value = { nombre: '', apellido: '', email: '', telefono: '', direccion: '', documento: '' };
  }
  dialogoVisible.value = true;
}

async function guardar() {
  try {
    const payload = { ...form.value };
    if (editando.value && editandoId.value) {
      await store.actualizar(editandoId.value, payload);
      Notify.create({ type: 'positive', message: 'Cliente actualizado' });
    } else {
      await store.crear(payload);
      Notify.create({ type: 'positive', message: 'Cliente creado' });
    }
    dialogoVisible.value = false;
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Error al guardar' });
  }
}

async function toggleActivo(cliente: ClienteResponse) {
  try {
    await store.toggleActivo(cliente.id);
    Notify.create({ type: 'positive', message: `Cliente ${cliente.activo ? 'desactivado' : 'activado'}` });
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Error al cambiar estado' });
  }
}

async function eliminar(cliente: ClienteResponse) {
  try {
    await store.eliminar(cliente.id);
    Notify.create({ type: 'positive', message: 'Cliente eliminado' });
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Error al eliminar' });
  }
}

function limpiarFiltros() {
  filtroTexto.value = '';
  filtroEstado.value = null;
}

function imprimirPDF() {
  const filtros: Record<string, string> = {};
  if (filtroTexto.value) filtros['Buscar'] = filtroTexto.value;
  if (filtroEstado.value) filtros['Estado'] = filtroEstado.value;
  generarPdf(
    'Clientes',
    [
      { label: 'Nombre completo', dataKey: 'nombreCompleto' },
      { label: 'Email', dataKey: 'email' },
      { label: 'Teléfono', dataKey: 'telefono' },
      { label: 'Dirección', dataKey: 'direccion' },
      { label: 'Documento', dataKey: 'documento' },
      { label: 'Estado', dataKey: 'activo' },
    ],
    filteredRows.value,
    'clientes.pdf',
    Object.keys(filtros).length > 0 ? filtros : undefined,
  );
}
</script>
