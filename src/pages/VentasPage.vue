<template>
  <div class="q-pa-md full-height">
    <div class="text-h5 q-mb-md">Ventas</div>

    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-7">
        <q-card>
          <q-card-section class="q-pa-sm">
            <div class="row q-gutter-sm items-center">
              <q-input
                v-model="busqueda"
                label="Buscar por código o nombre"
                outlined
                dense
                class="col"
                @keyup.enter="buscarProductos"
                :debounce="300"
              />
              <q-btn icon="search" color="primary" @click="buscarProductos" />
              <q-btn label="Todos" flat color="primary" @click="cargarTodos" />
            </div>
          </q-card-section>
        </q-card>

        <q-card class="q-mt-md" v-if="productos.length > 0">
          <q-card-section class="q-pa-none">
            <q-list separator>
              <q-item v-for="prod in productos" :key="prod.id" v-ripple>
                <q-item-section>
                  <q-item-label>{{ prod.codigo }} — {{ prod.nombre }}</q-item-label>
                  <q-item-label caption>
                    ${{ prod.precioVenta.toFixed(2) }}
                    <q-badge v-if="prod.pesado" color="orange" class="q-ml-sm">Por kilo</q-badge>
                    <q-badge v-if="prod.existencia <= 0" color="red" class="q-ml-sm">Sin stock</q-badge>
                  </q-item-label>
                </q-item-section>
                <q-item-section side>
                  <q-btn
                    icon="add_shopping_cart"
                    color="primary"
                    dense
                    :disable="prod.existencia <= 0"
                    @click="agregarAlCarrito(prod)"
                  />
                </q-item-section>
              </q-item>
            </q-list>
          </q-card-section>
        </q-card>

        <q-card class="q-mt-md" v-else>
          <q-card-section class="text-center text-grey">
            <q-icon name="search" size="48px" />
            <div class="q-mt-sm">Busque productos para agregar a la venta</div>
          </q-card-section>
        </q-card>
      </div>

      <div class="col-12 col-md-5">
        <q-card>
          <q-card-section class="q-pa-sm">
            <div class="row items-center q-gutter-x-sm">
              <q-icon name="point_of_sale" size="sm" />
              <span class="text-subtitle1">Venta actual</span>
              <q-space />
              <q-btn
                :label="clienteSeleccionado ? clienteSeleccionado.nombre : 'Sin cliente'"
                flat
                dense
                color="primary"
                @click="seleccionarCliente"
              >
                <q-icon :name="clienteSeleccionado ? 'person' : 'person_add'" class="q-mr-xs" />
              </q-btn>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section class="q-pa-none" style="min-height: 200px; max-height: 350px; overflow-y: auto">
            <q-list separator v-if="carrito.length > 0">
              <q-item v-for="(item, index) in carrito" :key="index">
                <q-item-section top class="col-5">
                  <q-item-label class="text-weight-medium">{{ item.nombre }}</q-item-label>
                  <q-item-label caption>
                    <q-badge v-if="item.pesado" color="orange" class="q-mr-xs">kg</q-badge>
                    ${{ item.precioUnitario.toFixed(2) }}
                  </q-item-label>
                </q-item-section>
                <q-item-section top class="col-3">
                  <q-input
                    v-model.number="item.cantidad"
                    type="number"
                    :step="item.pesado ? 0.1 : 1"
                    :min="0.001"
                    dense
                    outlined
                    size="sm"
                    label="Cant"
                    @update:model-value="recalcular"
                  />
                </q-item-section>
                <q-item-section top class="col-2">
                  <q-input
                    v-model.number="item.descuentoPorcentaje"
                    type="number"
                    :min="0"
                    :max="100"
                    dense
                    outlined
                    size="sm"
                    label="Desc %"
                    @update:model-value="recalcular"
                  />
                </q-item-section>
                <q-item-section top side class="col-2 text-right">
                  <div class="text-weight-medium">${{ item.subtotal.toFixed(2) }}</div>
                  <q-btn flat dense icon="delete" color="negative" size="sm" @click="eliminarDelCarrito(index)" />
                </q-item-section>
              </q-item>
            </q-list>
            <div v-else class="text-center text-grey q-pa-xl">
              <q-icon name="shopping_cart" size="40px" />
              <div class="q-mt-sm">Carrito vacío</div>
            </div>
          </q-card-section>

          <q-separator />

          <q-card-section>
            <div class="row items-center q-gutter-y-sm">
              <div class="col-12 row items-center">
                <span class="col-6">Subtotal:</span>
                <span class="col-6 text-right text-weight-medium">${{ subtotal.toFixed(2) }}</span>
              </div>
              <div class="col-12 row items-center">
                <span class="col-6">Descuento global:</span>
                <div class="col-6 row items-center justify-end q-gutter-xs">
                  <q-input
                    v-model.number="descuentoGlobal"
                    type="number"
                    :min="0"
                    :max="100"
                    dense
                    outlined
                    size="sm"
                    style="width: 70px"
                    suffix="%"
                  />
                </div>
              </div>
              <q-separator class="col-12" />
              <div class="col-12 row items-center text-h6">
                <span class="col-6">TOTAL:</span>
                <span class="col-6 text-right text-primary">${{ total.toFixed(2) }}</span>
              </div>
            </div>
          </q-card-section>

          <q-card-actions align="right" class="q-pa-md">
            <q-btn
              label="Finalizar venta"
              color="positive"
              icon="check_circle"
              :disable="carrito.length === 0"
              @click="finalizar"
            />
          </q-card-actions>
        </q-card>
      </div>
    </div>

    <q-dialog v-model="dialogoCantidad" persistent>
      <q-card style="min-width: 350px">
        <q-card-section>
          <div class="text-h6">{{ productoSeleccionado?.nombre }}</div>
        </q-card-section>
        <q-card-section>
          <div class="q-gutter-y-md">
            <q-input
              v-model.number="cantidadInput"
              type="number"
              :step="productoSeleccionado?.pesado ? 0.1 : 1"
              :min="0.001"
              label="Cantidad"
              outlined
              autofocus
              :suffix="productoSeleccionado?.pesado ? 'kg' : ''"
            />
            <q-input
              v-model.number="precioInput"
              type="number"
              :min="0"
              label="Precio unitario"
              outlined
              :suffix="'$'"
            />
            <q-input
              v-model.number="descuentoItemInput"
              type="number"
              :min="0"
              :max="100"
              label="Descuento (%)"
              outlined
              suffix="%"
            />
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="Cancelar" flat color="primary" v-close-popup />
          <q-btn label="Agregar" color="primary" @click="confirmarAgregar" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="dialogoCliente">
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">Seleccionar cliente</div>
        </q-card-section>
        <q-card-section>
          <q-input v-model="busquedaCliente" label="Buscar cliente" outlined dense @keyup.enter="buscarClientes" />
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
                <q-item-label caption>{{ cli.email }} — {{ cli.documento }}</q-item-label>
              </q-item-section>
              <q-item-section side>
                <q-btn icon="check" flat dense color="primary" />
              </q-item-section>
            </q-item>
          </q-list>
          <div v-if="clientesEncontrados.length === 0 && busquedaCliente.length > 0" class="text-grey q-mt-sm">
            Sin resultados
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn label="Sin cliente" flat color="primary" @click="asignarCliente(null)" v-close-popup />
          <q-btn label="Cerrar" flat color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

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

    <q-dialog v-model="dialogoCargando" persistent>
      <q-card>
        <q-card-section class="row items-center q-gutter-md">
          <q-spinner size="40px" color="primary" />
          <span>Procesando venta...</span>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Notify } from 'quasar';
import { listarProductos, type ProductoResponse } from '../api/producto.api';
import { listarClientes, type ClienteResponse } from '../api/cliente.api';
import { crearVenta, finalizarVenta, obtenerTicket, type TicketResponse } from '../api/venta.api';

interface CarritoItem {
  productoId: number;
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  descuentoPorcentaje: number;
  subtotal: number;
  pesado: boolean;
}

const busqueda = ref('');
const productos = ref<ProductoResponse[]>([]);
const carrito = ref<CarritoItem[]>([]);
const descuentoGlobal = ref(0);

const clienteSeleccionado = ref<ClienteResponse | null>(null);

const dialogoCantidad = ref(false);
const dialogoCliente = ref(false);
const dialogoTicket = ref(false);
const dialogoCargando = ref(false);

const productoSeleccionado = ref<ProductoResponse | null>(null);
const cantidadInput = ref(1);
const precioInput = ref(0);
const descuentoItemInput = ref(0);

const busquedaCliente = ref('');
const clientesEncontrados = ref<ClienteResponse[]>([]);

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

function recalcular() {
  carrito.value.forEach((item) => {
    item.subtotal = item.cantidad * item.precioUnitario * (1 - item.descuentoPorcentaje / 100);
  });
}

async function buscarProductos() {
  if (!busqueda.value.trim()) return;
  try {
    const { data } = await listarProductos({ size: 50 });
    const t = busqueda.value.toLowerCase();
    productos.value = data.content.filter(
      (p) => p.codigo.toLowerCase().includes(t) || p.nombre.toLowerCase().includes(t),
    );
    if (productos.value.length === 0) {
      Notify.create({ type: 'info', message: 'No se encontraron productos' });
    }
  } catch {
    Notify.create({ type: 'negative', message: 'Error al buscar productos' });
  }
}

async function cargarTodos() {
  try {
    const { data } = await listarProductos({ size: 100 });
    productos.value = data.content;
  } catch {
    Notify.create({ type: 'negative', message: 'Error al cargar productos' });
  }
}

function agregarAlCarrito(prod: ProductoResponse) {
  productoSeleccionado.value = prod;
  cantidadInput.value = prod.pesado ? 1 : 1;
  precioInput.value = prod.precioVenta;
  descuentoItemInput.value = 0;
  dialogoCantidad.value = true;
}

function confirmarAgregar() {
  if (!productoSeleccionado.value) return;
  const prod = productoSeleccionado.value;
  const idx = carrito.value.findIndex((i) => i.productoId === Number(prod.id));
  const subt = cantidadInput.value * precioInput.value * (1 - descuentoItemInput.value / 100);
  if (idx >= 0) {
    carrito.value[idx].cantidad += cantidadInput.value;
    carrito.value[idx].subtotal = carrito.value[idx].cantidad * carrito.value[idx].precioUnitario * (1 - carrito.value[idx].descuentoPorcentaje / 100);
  } else {
    carrito.value.push({
      productoId: Number(prod.id),
      codigo: prod.codigo,
      nombre: prod.nombre,
      cantidad: cantidadInput.value,
      precioUnitario: precioInput.value,
      descuentoPorcentaje: descuentoItemInput.value,
      subtotal: subt,
      pesado: !!prod.pesado,
    });
  }
  dialogoCantidad.value = false;
}

function eliminarDelCarrito(index: number) {
  carrito.value.splice(index, 1);
}

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
      payload.clienteId = Number(clienteSeleccionado.value.id);
    }
    const { data: ventaCreada } = await crearVenta(payload);
    ultimaVentaId.value = ventaCreada.id;
    await finalizarVenta(ventaCreada.id);
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
