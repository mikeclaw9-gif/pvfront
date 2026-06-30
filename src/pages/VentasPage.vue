<template>
  <div class="pos-screen column full-height">
    <!-- Header: escáner de código de barras -->
    <div class="pos-header bg-primary text-white q-py-xs q-px-md">
      <div class="row items-center q-gutter-x-sm">
        <q-icon name="qr_code_scanner" size="sm" />
        <q-input
          ref="barcodeRef"
          v-model="codigoBarra"
          placeholder="Código de barras"
          dark
          dense
          borderless
          class="col barcode-input"
          hide-bottom-space
          input-class="text-body1 text-white text-center"
          @keyup.enter="procesarCodigoBarra"
        />
        <q-btn flat dense round icon="search" size="sm" @click="abrirBusquedaManual" />
        <q-btn flat dense round icon="qr_code_scanner" size="sm" @click="abrirDialogoScanner" />
      </div>
    </div>

    <!-- Carrito (vista tipo ticket / tabla) -->
    <div class="pos-cart col scroll">
      <div v-if="carrito.length > 0" class="cart-table">
        <div class="cart-header">
          <span class="col-cant">CANT</span>
          <span class="col-pres">PRES</span>
          <span class="col-desc">DESC</span>
          <span class="col-precio">PU</span>
          <span class="col-desc-porc">%DESC</span>
          <span class="col-monto">MONTO</span>
          <span class="col-actions"></span>
        </div>
        <div v-for="(item, index) in carrito" :key="index" class="cart-row">
          <span class="col-cant">
            <q-btn dense flat round icon="remove" size="xs" color="grey-6" @click="disminuirCantidad(index)" />
            <span class="cant-num cursor-pointer" @click="editarCantidad(index)">{{ item.cantidad }}</span>
            <q-btn dense flat round icon="add" size="xs" color="primary" @click="aumentarCantidad(index)" />
          </span>
          <span class="col-pres">{{ item.presentacion }}</span>
          <span class="col-desc">{{ item.nombre }}</span>
          <span class="col-precio">${{ item.precioUnitario.toFixed(2) }}</span>
          <span class="col-desc-porc">
            <q-input
              v-model.number="item.descuentoPorcentaje"
              type="number"
              min="0"
              max="100"
              dense
              borderless
              hide-bottom-space
              input-class="text-center desc-input"
              style="max-width: 36px"
              @update:model-value="recalcular"
            />
          </span>
          <span class="col-monto">${{ item.subtotal.toFixed(2) }}</span>
          <span class="col-actions">
            <q-btn flat dense round icon="close" size="xs" color="negative" @click="eliminarDelCarrito(index)" />
          </span>
        </div>
      </div>

      <!-- Estado vacío -->
      <div v-else class="empty-state column items-center justify-center text-grey-5">
        <q-icon name="point_of_sale" size="72px" />
        <div class="text-body1 q-mt-sm text-weight-medium">Escanee un producto</div>
        <div class="text-caption">o use el buscador manual</div>
      </div>
    </div>

    <!-- Footer: total + acciones -->
    <div class="pos-footer bg-white">
      <q-separator />
      <div class="q-px-md q-py-xs row items-center">
        <q-btn flat dense no-caps icon="person" size="sm" color="primary" @click="seleccionarCliente">
          <span class="q-ml-xs text-caption">{{ clienteSeleccionado ? clienteSeleccionado.nombre : 'Sin cliente' }}</span>
        </q-btn>
        <q-space />
        <div class="text-caption text-grey-6">{{ carrito.length }} artículo{{ carrito.length !== 1 ? 's' : '' }}</div>
      </div>
      <q-separator />
      <div class="q-px-md q-py-sm row items-baseline">
        <div class="col text-subtitle1">Total</div>
        <div class="col text-right text-h5 text-primary text-weight-bold">${{ total.toFixed(2) }}</div>
      </div>
      <q-btn
        :disable="carrito.length === 0"
        label="Cobrar"
        color="positive"
        icon="check_circle"
        class="full-width"
        size="lg"
        no-caps
        @click="finalizar"
      />
    </div>

    <!-- Diálogo: cantidad para productos pesados -->
    <q-dialog v-model="dialogoCantidad" persistent>
      <q-card style="min-width: 300px">
        <q-card-section class="text-center">
          <div class="text-h6">{{ productoSeleccionado?.nombre }}</div>
          <div class="text-caption text-grey">{{ productoSeleccionado?.codigo }}</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model.number="cantidadInput"
            type="number"
            :step="productoSeleccionado?.pesado ? 0.1 : 1"
            :min="0.001"
            label="Cantidad"
            outlined
            autofocus
            :suffix="productoSeleccionado?.pesado ? 'kg' : ''"
            class="text-h5 text-center"
          />
        </q-card-section>
        <q-card-actions align="around" class="q-pb-md">
          <q-btn label="Cancelar" flat color="primary" v-close-popup />
          <q-btn label="Agregar" color="primary" @click="confirmarAgregar" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Diálogo: buscar productos manualmente -->
    <q-dialog v-model="dialogoBusqueda" full-width position="top">
      <q-card>
        <q-card-section class="q-pb-none">
          <q-input
            v-model="busquedaManual"
            label="Buscar por código o nombre"
            outlined
            dense
            autofocus
            clearable
            @keyup.enter="buscarProductosManual"
          >
            <template v-slot:append>
              <q-btn flat dense round icon="search" color="primary" @click="buscarProductosManual" />
            </template>
          </q-input>
        </q-card-section>
        <q-card-section class="q-pa-none" style="max-height: 50vh; overflow-y: auto">
          <q-list separator v-if="productosBusqueda.length > 0">
            <q-item
              v-for="prod in productosBusqueda"
              :key="prod.id"
              clickable
              v-ripple
              @click="seleccionarProductoBusqueda(prod)"
            >
              <q-item-section>
                <q-item-label>
                  <span class="text-weight-medium">{{ prod.codigo }}</span>
                  — {{ prod.nombre }}
                </q-item-label>
                <q-item-label caption>
                  ${{ prod.precioVenta.toFixed(2) }}
                  <q-badge v-if="prod.pesado" color="orange" class="q-ml-xs">kg</q-badge>
                  <q-badge v-if="prod.existencia <= 0" color="red" class="q-ml-xs">Sin stock</q-badge>
                </q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn icon="add_shopping_cart" color="primary" dense round />
              </q-item-section>
            </q-item>
          </q-list>
          <div v-else-if="busquedaManual.length > 0" class="text-center text-grey q-py-xl">
            Sin resultados
          </div>
          <div v-else class="text-center text-grey q-py-xl text-caption">
            Escriba código o nombre del producto
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="Cerrar" flat color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Diálogo: seleccionar cliente -->
    <q-dialog v-model="dialogoCliente" position="top">
      <q-card style="min-width: 320px">
        <q-card-section>
          <div class="text-h6">Cliente</div>
        </q-card-section>
        <q-card-section>
          <q-input
            v-model="busquedaCliente"
            label="Buscar por nombre, email o documento"
            outlined
            dense
            @keyup.enter="buscarClientes"
          />
          <q-btn label="Buscar" flat color="primary" class="q-mt-sm" @click="buscarClientes" />
          <q-list class="q-mt-sm" v-if="clientesEncontrados.length > 0" separator>
            <q-item
              v-for="cli in clientesEncontrados"
              :key="cli.id"
              clickable
              v-ripple
              @click="asignarCliente(cli)"
            >
              <q-item-section>
                <q-item-label>{{ cli.nombre }} {{ cli.apellido }}</q-item-label>
                <q-item-label caption>{{ cli.documento }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-icon name="check" color="primary" />
              </q-item-section>
            </q-item>
          </q-list>
          <div v-if="clientesEncontrados.length === 0 && busquedaCliente.length > 0" class="text-grey q-mt-sm">
            Sin resultados
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="Sin cliente" flat color="primary" @click="asignarCliente(null)" v-close-popup />
          <q-btn label="Cerrar" flat v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Diálogo: ticket -->
    <q-dialog v-model="dialogoTicket" full-width>
      <q-card>
        <q-card-section class="text-center">
          <div class="text-h6">Ticket de venta #{{ ticket?.ventaId }}</div>
        </q-card-section>
        <q-card-section class="flex flex-center">
          <div
            id="ticket-content"
            class="bg-white text-black q-pa-md"
            style="max-width: 320px; width: 100%; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4"
          >
            <div class="text-center text-h6">PVenta</div>
            <div class="text-center">Ticket de venta</div>
            <div class="text-center text-caption q-mb-sm">{{ formatearFecha(ticket?.fecha) }}</div>
            <div>Atendido por: {{ ticket?.atendidoPor }}</div>
            <div v-if="ticket?.cliente">Cliente: {{ ticket?.cliente }}</div>
            <q-separator class="q-my-sm" />
            <div class="row text-weight-bold">
              <div class="col-4">Producto</div>
              <div class="col-2 text-right">Cant</div>
              <div class="col-3 text-right">P.U.</div>
              <div class="col-3 text-right">Importe</div>
            </div>
            <q-separator />
            <div v-for="(linea, i) in ticket?.lineas" :key="i">
              <div class="row">
                <div class="col-12">{{ linea.producto }}</div>
              </div>
              <div class="row">
                <div class="col-4 offset-4 text-right">{{ linea.cantidad }} {{ linea.unidad }}</div>
                <div class="col-4 text-right">${{ linea.precioUnitario.toFixed(2) }}</div>
                <div class="col-4 text-right">${{ linea.importe.toFixed(2) }}</div>
              </div>
              <div v-if="linea.descuentoPorcentaje > 0" class="row text-red">
                <div class="col-12 text-right">Desc {{ linea.descuentoPorcentaje }}%</div>
              </div>
            </div>
            <q-separator class="q-my-sm" />
            <div class="row">
              <div class="col-6">Subtotal:</div>
              <div class="col-6 text-right">${{ ticket?.subtotal.toFixed(2) }}</div>
            </div>
            <div v-if="ticket && ticket.descuentoPorcentaje > 0" class="row">
              <div class="col-6">Descuento ({{ ticket.descuentoPorcentaje }}%):</div>
              <div class="col-6 text-right">-${{ ticket.descuentoAplicado.toFixed(2) }}</div>
            </div>
            <div class="row text-weight-bold text-h6">
              <div class="col-6">TOTAL:</div>
              <div class="col-6 text-right">${{ ticket?.total.toFixed(2) }}</div>
            </div>
            <q-separator class="q-my-sm" />
            <div class="text-center text-caption">¡Gracias por su compra!</div>
          </div>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn label="Imprimir" color="primary" icon="print" @click="imprimirTicket" />
          <q-btn label="Cerrar" flat color="primary" v-close-popup @click="nuevaVenta" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <!-- Diálogo: cargando -->
    <q-dialog v-model="dialogoCargando" persistent>
      <q-card>
        <q-card-section class="row items-center q-gutter-md">
          <q-spinner size="40px" color="primary" />
          <span>Procesando venta...</span>
        </q-card-section>
      </q-card>
    </q-dialog>

    <!-- Diálogo: escáner de código de barras -->
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
import { ref, computed, nextTick, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { Notify, Loading } from 'quasar';
import { listarProductos, buscarPorCodigo, type ProductoResponse } from '../api/producto.api';
import { listarClientes, type ClienteResponse } from '../api/cliente.api';
import { crearVenta, finalizarVenta, obtenerTicket, type TicketResponse } from '../api/venta.api';

interface CarritoItem {
  productoId: number;
  codigo: string;
  nombre: string;
  presentacion: string;
  cantidad: number;
  precioUnitario: number;
  descuentoPorcentaje: number;
  subtotal: number;
  pesado: boolean;
}

const route = useRoute();
const barcodeRef = ref<any>(null);
const codigoBarra = ref('');
const scannerVisible = ref(false);
const vistaPrevia = ref<string | null>(null);
const errorScanner = ref('');

const carrito = ref<CarritoItem[]>([]);
const descuentoGlobal = ref(0);
const clienteSeleccionado = ref<ClienteResponse | null>(null);

// Cantidad dialog
const dialogoCantidad = ref(false);
const productoSeleccionado = ref<ProductoResponse | null>(null);
const cantidadInput = ref(1);

// Búsqueda manual
const dialogoBusqueda = ref(false);
const busquedaManual = ref('');
const productosBusqueda = ref<ProductoResponse[]>([]);

// Cliente dialog
const dialogoCliente = ref(false);
const busquedaCliente = ref('');
const clientesEncontrados = ref<ClienteResponse[]>([]);

// Ticket
const dialogoTicket = ref(false);
const dialogoCargando = ref(false);
const ticket = ref<TicketResponse | null>(null);
const ultimaVentaId = ref<number | null>(null);

const subtotal = computed(() =>
  carrito.value.reduce((sum, item) => sum + item.subtotal, 0),
);

const total = computed(() => {
  const st = subtotal.value;
  const desc = st * (descuentoGlobal.value / 100);
  return st - desc;
});

function formatearFecha(fecha?: string) {
  if (!fecha) return '';
  return new Date(fecha).toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function enfocarBarra() {
  nextTick(() => barcodeRef.value?.focus());
}

onMounted(() => {
  if (route.query.codigo) {
    const codigo = route.query.codigo as string;
    const guardado = sessionStorage.getItem('carritoVenta');
    if (guardado) {
      try {
        const data = JSON.parse(guardado);
        carrito.value = data.carrito || [];
        clienteSeleccionado.value = data.cliente || null;
        descuentoGlobal.value = data.descuento || 0;
      } catch { /* ignore */ }
      sessionStorage.removeItem('carritoVenta');
    }
    codigoBarra.value = codigo;
    procesarCodigoBarra();
  }
});

function recalcular() {
  carrito.value.forEach((item) => {
    item.subtotal = item.cantidad * item.precioUnitario * (1 - item.descuentoPorcentaje / 100);
  });
}

// ── Código de barras ──────────────────────────────────────────

async function procesarCodigoBarra() {
  const codigo = codigoBarra.value.trim();
  if (!codigo) return;
  codigoBarra.value = '';
  enfocarBarra();
  try {
    const { data: prod } = await buscarPorCodigo(codigo);
    agregarAlCarrito(prod);
  } catch {
    Notify.create({
      type: 'warning',
      message: `Producto "${codigo}" no encontrado`,
      actions: [
        { label: 'Buscar', color: 'white', handler: () => abrirBusquedaManual(codigo) },
      ],
    });
  }
}

// ── Agregar al carrito ────────────────────────────────────────

function agregarAlCarrito(prod: ProductoResponse) {
  if (prod.existencia <= 0) {
    Notify.create({ type: 'negative', message: `${prod.nombre} — Sin stock` });
    return;
  }
  const existente = carrito.value.find((i) => i.productoId === prod.id);
  if (existente && !prod.pesado) {
    existente.cantidad += 1;
    recalcular();
    Notify.create({ type: 'positive', message: `${prod.nombre} x${existente.cantidad}`, timeout: 800 });
    return;
  }
  if (prod.pesado) {
    productoSeleccionado.value = prod;
    cantidadInput.value = 1;
    dialogoCantidad.value = true;
    return;
  }
  const subt = prod.precioVenta;
  carrito.value.push({
    productoId: prod.id,
    codigo: prod.codigo,
    nombre: prod.nombre,
    presentacion: prod.pesado ? 'KG' : 'PIEZA',
    cantidad: 1,
    precioUnitario: prod.precioVenta,
    descuentoPorcentaje: 0,
    subtotal: subt,
    pesado: !!prod.pesado,
  });
  Notify.create({ type: 'positive', message: `${prod.nombre} agregado`, timeout: 800 });
}

function confirmarAgregar() {
  if (!productoSeleccionado.value || !cantidadInput.value || cantidadInput.value <= 0) return;
  const prod = productoSeleccionado.value;
  const subt = cantidadInput.value * prod.precioVenta;
  const idx = carrito.value.findIndex((i) => i.productoId === prod.id);
  if (idx >= 0) {
    carrito.value[idx].cantidad += cantidadInput.value;
    carrito.value[idx].subtotal = carrito.value[idx].cantidad * carrito.value[idx].precioUnitario;
  } else {
    carrito.value.push({
      productoId: prod.id,
      codigo: prod.codigo,
      nombre: prod.nombre,
      presentacion: 'KG',
      cantidad: cantidadInput.value,
      precioUnitario: prod.precioVenta,
      descuentoPorcentaje: 0,
      subtotal: subt,
      pesado: true,
    });
  }
  dialogoCantidad.value = false;
  Notify.create({ type: 'positive', message: `${prod.nombre} — ${cantidadInput.value} kg`, timeout: 1000 });
}

// ── Manipular cantidades ──────────────────────────────────────

function aumentarCantidad(index: number) {
  const item = carrito.value[index];
  if (item.pesado) {
    productoSeleccionado.value = {
      id: String(item.productoId),
      codigo: item.codigo,
      nombre: item.nombre,
      precioVenta: item.precioUnitario,
      pesado: true,
      existencia: 9999,
    } as ProductoResponse;
    cantidadInput.value = 0.1;
    dialogoCantidad.value = true;
    return;
  }
  item.cantidad += 1;
  recalcular();
}

function disminuirCantidad(index: number) {
  const item = carrito.value[index];
  if (item.cantidad <= 1) {
    eliminarDelCarrito(index);
    return;
  }
  item.cantidad -= 1;
  recalcular();
}

function editarCantidad(index: number) {
  const item = carrito.value[index];
  if (item.pesado) {
    productoSeleccionado.value = {
      id: String(item.productoId),
      codigo: item.codigo,
      nombre: item.nombre,
      precioVenta: item.precioUnitario,
      pesado: true,
      existencia: 9999,
    } as ProductoResponse;
    cantidadInput.value = item.cantidad;
    dialogoCantidad.value = true;
    return;
  }
  cantidadInput.value = item.cantidad;
  // For regular items, simple increment/decrement is enough
}

function eliminarDelCarrito(index: number) {
  const removed = carrito.value[index];
  carrito.value.splice(index, 1);
  Notify.create({ type: 'info', message: `${removed.nombre} eliminado`, timeout: 800 });
}

// ── Búsqueda manual ───────────────────────────────────────────

function abrirBusquedaManual(termino?: string) {
  busquedaManual.value = termino || '';
  productosBusqueda.value = [];
  dialogoBusqueda.value = true;
  if (termino) {
    setTimeout(() => buscarProductosManual(), 100);
  }
}

async function buscarProductosManual() {
  if (!busquedaManual.value.trim()) return;
  try {
    const { data } = await listarProductos({ size: 100 });
    const t = busquedaManual.value.toLowerCase().trim();
    productosBusqueda.value = data.content.filter(
      (p) => p.codigo.toLowerCase().includes(t) || p.nombre.toLowerCase().includes(t),
    );
  } catch {
    Notify.create({ type: 'negative', message: 'Error al buscar productos' });
  }
}

function seleccionarProductoBusqueda(prod: ProductoResponse) {
  dialogoBusqueda.value = false;
  agregarAlCarrito(prod);
}

// ── Cliente ───────────────────────────────────────────────────

function seleccionarCliente() {
  busquedaCliente.value = '';
  clientesEncontrados.value = [];
  if (clienteSeleccionado.value) {
    clientesEncontrados.value = [clienteSeleccionado.value];
  }
  dialogoCliente.value = true;
}

async function buscarClientes() {
  if (!busquedaCliente.value.trim()) return;
  try {
    const { data } = await listarClientes({ size: 50 });
    const t = busquedaCliente.value.toLowerCase();
    clientesEncontrados.value = data.content.filter(
      (c) =>
        c.nombre.toLowerCase().includes(t) ||
        c.apellido.toLowerCase().includes(t) ||
        c.email.toLowerCase().includes(t) ||
        c.documento.toLowerCase().includes(t),
    );
  } catch {
    Notify.create({ type: 'negative', message: 'Error al buscar clientes' });
  }
}

function asignarCliente(cli: ClienteResponse | null) {
  clienteSeleccionado.value = cli;
  dialogoCliente.value = false;
}

// ── Escáner de código de barras ──────────────────────────

function abrirDialogoScanner() {
  const { href } = window.location;
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    sessionStorage.setItem('carritoVenta', JSON.stringify({
      carrito: carrito.value,
      cliente: clienteSeleccionado.value,
      descuento: descuentoGlobal.value,
    }));
    const base = window.location.origin + window.location.pathname.replace(/\/+$/, '');
    const ret = encodeURIComponent(base + '/#/ventas?codigo={CODE}');
    const intentUrl = `intent://scan?ret=${ret}#Intent;scheme=zxing;package=com.google.zxing.client.android;end`;
    window.location.href = intentUrl;
    setTimeout(() => {
      scannerVisible.value = true;
      errorScanner.value = '';
      vistaPrevia.value = null;
    }, 5000);
  } else {
    scannerVisible.value = true;
    errorScanner.value = '';
    vistaPrevia.value = null;
  }
}

function cerrarScanner() {
  scannerVisible.value = false;
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
      scannerVisible.value = false;
      codigoBarra.value = code;
      await nextTick();
      procesarCodigoBarra();
      Notify.create({ type: 'positive', message: 'Código: ' + code });
    } else {
      errorScanner.value = 'No se detectó ningún código de barras en la imagen.';
      Notify.create({ type: 'warning', message: 'Código no detectado.' });
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

// ── Finalizar venta ───────────────────────────────────────────

async function finalizar() {
  if (carrito.value.length === 0) return;
  dialogoCargando.value = true;
  try {
    const detalles = carrito.value.map((item) => ({
      productoId: item.productoId,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      descuentoPorcentaje: item.descuentoPorcentaje > 0 ? item.descuentoPorcentaje : undefined,
    }));
    const payload: any = {
      detalles,
      descuentoPorcentaje: descuentoGlobal.value > 0 ? descuentoGlobal.value : undefined,
    };
    if (clienteSeleccionado.value) {
      payload.clienteId = clienteSeleccionado.value.id;
    }
    const { data: ventaCreada } = await crearVenta(payload);
    ultimaVentaId.value = ventaCreada.id;
    await finalizarVenta(ventaCreada.id, ventaCreada);
    const { data: ticketData } = await obtenerTicket(ventaCreada.id);
    ticket.value = ticketData;
    dialogoCargando.value = false;
    dialogoTicket.value = true;
  } catch (err: any) {
    dialogoCargando.value = false;
    Notify.create({ type: 'negative', message: err.response?.data?.message || 'Error al procesar la venta' });
  }
}

function nuevaVenta() {
  carrito.value = [];
  clienteSeleccionado.value = null;
  descuentoGlobal.value = 0;
  ticket.value = null;
  ultimaVentaId.value = null;
  enfocarBarra();
}

function imprimirTicket() {
  const content = document.getElementById('ticket-content');
  if (!content) return;
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <html>
      <head>
        <title>Ticket #${ticket.value?.ventaId}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 300px; margin: 0 auto; padding: 16px; }
          table { width: 100%; border-collapse: collapse; }
          td, th { padding: 2px 4px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .text-bold { font-weight: bold; }
          hr { border: none; border-top: 1px dashed #000; }
        </style>
      </head>
      <body>${content.innerHTML}</body>
    </html>
  `);
  win.document.close();
  win.print();
}
</script>

<style lang="scss" scoped>
.pos-screen {
  height: calc(100vh - 50px);
  max-height: calc(100vh - 50px);
  overflow: hidden;
  background: #f5f5f5;
}

.pos-header {
  flex-shrink: 0;
}

.barcode-input {
  :deep(.q-field__control) {
    height: 40px;
  }
  :deep(.q-field__native) {
    letter-spacing: 2px;
    font-weight: 600;
  }
}

.pos-cart {
  flex: 1 1 auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  background: #fafafa;
}

.cart-table {
  font-size: 11px;
  line-height: 1.3;
  min-width: 0;
}

.cart-header,
.cart-row {
  display: grid;
  grid-template-columns: 64px 40px 1fr 52px 42px 55px 22px;
  column-gap: 2px;
  align-items: center;
  padding: 4px 6px;
  min-width: 0;
}

.cart-header {
  position: sticky;
  top: 0;
  z-index: 1;
  background: #e8e8e8;
  font-weight: 700;
  color: #555;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  border-bottom: 1px solid #ccc;
  padding-top: 5px;
  padding-bottom: 5px;
}

.cart-row {
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  min-height: 38px;
}

.cart-row:nth-child(even) {
  background: rgba(0, 0, 0, 0.02);
}

.col-cant {
  display: flex;
  align-items: center;
  gap: 1px;
  min-width: 0;
}

.cant-num {
  min-width: 18px;
  text-align: center;
  font-weight: 700;
  font-size: 12px;
}

.col-pres {
  font-weight: 600;
  color: #666;
  font-size: 10px;
  text-transform: uppercase;
  text-align: center;
  min-width: 0;
}

.col-desc {
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  padding-right: 4px;
  min-width: 0;
}

.col-precio,
.col-monto {
  text-align: right;
  font-weight: 600;
  font-size: 11px;
  min-width: 0;
}

.col-desc-porc {
  text-align: center;
  min-width: 0;
}

.desc-input {
  font-size: 11px !important;
  font-weight: 600 !important;
  color: #c62828 !important;
  text-align: center !important;
}

.col-actions {
  display: flex;
  justify-content: center;
  min-width: 0;
}

.empty-state {
  height: 100%;
  min-height: 300px;
}

.pos-footer {
  flex-shrink: 0;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
}

.scanner-card {
  width: 100%;
  max-width: 500px;
}

.body--dark {
  .pos-screen {
    background: #1d1d1d;
  }

  .pos-cart {
    background: #1a1a1a;
  }

  .cart-header {
    background: #2a2a2a;
    color: #bbb;
    border-bottom-color: #444;
  }

  .cart-row {
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }

  .cart-row:nth-child(even) {
    background: rgba(255, 255, 255, 0.03);
  }

  .col-desc,
  .cant-num,
  .col-precio,
  .col-monto {
    color: #e8e8e8;
  }

  .col-pres {
    color: #999;
  }

  .pos-footer {
    background: #1e1e1e;
  }
}
</style>
