<template>
  <div class="q-pa-md">
    <div class="row items-center q-mb-md q-gutter-x-sm">
      <div class="text-h5">Usuarios</div>
      <q-space />
      <q-btn label="Imprimir" color="secondary" icon="print" @click="imprimirPDF" />
      <q-btn label="Nuevo usuario" color="primary" icon="add" @click="abrirDialogo()" />
    </div>

    <q-expansion-item label="Filtros" icon="filter_list" class="q-mb-md">
      <div class="row q-col-gutter-md q-pa-sm">
        <div class="col-xs-12 col-sm-4">
          <q-input v-model="filtroTexto" label="Buscar (nombre, apellido, email)" clearable debounce="300" />
        </div>
        <div class="col-xs-6 col-sm-3">
          <q-select v-model="filtroRol" :options="rolOptions" label="Rol" clearable />
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
      <template v-slot:body-cell-rol="props">
        <q-td>
          <q-chip :color="chipRol(props.row.rol)" text-color="white" dense>
            {{ labelRol(props.row.rol) }}
          </q-chip>
        </q-td>
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
          <div class="text-h6">{{ editando ? 'Editar usuario' : 'Nuevo usuario' }}</div>
        </q-card-section>
        <q-card-section>
          <q-form @submit.prevent="guardar" class="q-gutter-y-md">
            <q-input v-model="form.nombre" label="Nombre" :rules="[required]" outlined lazy-rules />
            <q-input v-model="form.apellido" label="Apellido" :rules="[required]" outlined lazy-rules />
            <q-input v-model="form.email" label="Email" type="email" :rules="[required, validEmail]" outlined lazy-rules />
            <q-input v-model="form.password" label="Contraseña" :type="showPassword ? 'text' : 'password'" :rules="editando ? [] : [required]" outlined lazy-rules>
              <template v-slot:append>
                <q-icon :name="showPassword ? 'visibility_off' : 'visibility'" class="cursor-pointer" @click="showPassword = !showPassword" />
              </template>
              <template v-slot:after v-if="editando">
                <q-badge color="info">Dejar vacío para no cambiar</q-badge>
              </template>
            </q-input>
            <q-select v-model="form.rol" :options="rolOptions" label="Rol" :rules="[required]" outlined lazy-rules />
            <q-input v-model="form.telefono" label="Teléfono" outlined />
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
import { useUsuarioStore } from '../stores/usuario-store';
import { Notify } from 'quasar';
import { generarPdf } from '../utils/pdf';
import type { UsuarioResponse, UsuarioRequest, RolUsuario } from '../api/usuario.api';

const store = useUsuarioStore();

const rolOptions = ['ROLE_ADMIN', 'ROLE_USER', 'ROLE_VENDEDOR'];

const columns = [
  { name: 'nombreCompleto', label: 'Nombre completo', field: 'nombre', align: 'left', sortable: false },
  { name: 'email', label: 'Email', field: 'email', align: 'left', sortable: true },
  { name: 'rol', label: 'Rol', field: 'rol', align: 'center', sortable: true },
  { name: 'telefono', label: 'Teléfono', field: 'telefono', align: 'left', sortable: false },
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
const filtroRol = ref<string | null>(null);
const filtroEstado = ref<string | null>(null);

const dialogoVisible = ref(false);
const editando = ref(false);
const showPassword = ref(false);
const form = ref<UsuarioRequest & { password?: string }>({
  nombre: '',
  apellido: '',
  email: '',
  password: '',
  rol: 'ROLE_USER',
  telefono: '',
});
const editandoId = ref<number | null>(null);

const filteredRows = computed(() => {
  let rows = store.usuarios;
  if (filtroTexto.value) {
    const t = filtroTexto.value.toLowerCase();
    rows = rows.filter((r) => r.nombre.toLowerCase().includes(t) || r.apellido.toLowerCase().includes(t) || r.email.toLowerCase().includes(t));
  }
  if (filtroRol.value) rows = rows.filter((r) => r.rol === filtroRol.value);
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

function chipRol(rol: string) {
  const map: Record<string, string> = { ROLE_ADMIN: 'purple', ROLE_USER: 'blue', ROLE_VENDEDOR: 'orange' };
  return map[rol] || 'grey';
}
function labelRol(rol: string) {
  const map: Record<string, string> = { ROLE_ADMIN: 'Admin', ROLE_USER: 'Usuario', ROLE_VENDEDOR: 'Vendedor' };
  return map[rol] || rol;
}

function abrirDialogo(usuario?: UsuarioResponse) {
  if (usuario) {
    editando.value = true;
    editandoId.value = usuario.id;
    form.value = {
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email,
      password: '',
      rol: usuario.rol,
      telefono: usuario.telefono,
    };
  } else {
    editando.value = false;
    editandoId.value = null;
    form.value = { nombre: '', apellido: '', email: '', password: '', rol: 'ROLE_USER', telefono: '' };
  }
  dialogoVisible.value = true;
}

async function guardar() {
  try {
    const payload = { ...form.value };
    if (editando.value && !payload.password) {
      delete payload.password;
    }
    if (editando.value && editandoId.value) {
      await store.actualizar(editandoId.value, payload as UsuarioRequest);
      Notify.create({ type: 'positive', message: 'Usuario actualizado' });
    } else {
      await store.crear(payload as UsuarioRequest);
      Notify.create({ type: 'positive', message: 'Usuario creado' });
    }
    dialogoVisible.value = false;
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Error al guardar' });
  }
}

async function toggleActivo(usuario: UsuarioResponse) {
  try {
    await store.toggleActivo(usuario.id);
    Notify.create({ type: 'positive', message: `Usuario ${usuario.activo ? 'desactivado' : 'activado'}` });
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Error al cambiar estado' });
  }
}

async function eliminar(usuario: UsuarioResponse) {
  try {
    await store.eliminar(usuario.id);
    Notify.create({ type: 'positive', message: 'Usuario eliminado' });
  } catch (err: any) {
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Error al eliminar' });
  }
}

function limpiarFiltros() {
  filtroTexto.value = '';
  filtroRol.value = null;
  filtroEstado.value = null;
}

function imprimirPDF() {
  const filtros: Record<string, string> = {};
  if (filtroTexto.value) filtros['Buscar'] = filtroTexto.value;
  if (filtroRol.value) filtros['Rol'] = labelRol(filtroRol.value);
  if (filtroEstado.value) filtros['Estado'] = filtroEstado.value;
  generarPdf(
    'Usuarios',
    [
      { label: 'Nombre completo', dataKey: 'nombreCompleto' },
      { label: 'Email', dataKey: 'email' },
      { label: 'Rol', dataKey: 'rol' },
      { label: 'Teléfono', dataKey: 'telefono' },
      { label: 'Estado', dataKey: 'activo' },
    ],
    filteredRows.value,
    'usuarios.pdf',
    Object.keys(filtros).length > 0 ? filtros : undefined,
  );
}
</script>

<style scoped>
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
</style>
