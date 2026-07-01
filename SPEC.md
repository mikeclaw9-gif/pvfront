# SPEC — pventafront

Especificación completa del frontend del sistema POS Pventa.

---

## 1. Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework UI | Quasar 2.20 (Vue 3.5) |
| Lenguaje | TypeScript 5.5 (strict) |
| Estado | Pinia 2 |
| Router | Vue Router 4 (hash mode) |
| HTTP | Axios |
| Estilos | SCSS |
| Charts | Chart.js |
| PDF | jsPDF + jspdf-autotable |
| QR/Barcode | html5-qrcode |
| Build | Vite 8 via @quasar/app-vite 2.6 |
| Dev server | Puerto 9000, host 0.0.0.0, proxy `/api/*` → `http://localhost:8090` |

---

## 2. Estructura del Proyecto

```
pventafront/
├── dist/                       # Build output
├── docswagger.json             # OpenAPI backend spec
├── env.d.ts                    # TypeScript env declarations
├── index.html                  # Entry HTML
├── package.json
├── quasar.config.js            # Quasar config (Vite, proxy, plugins, boot)
├── tsconfig.json               # TS strict + @/* alias
├── AGENTS.md                   # AI assistant instructions
├── README.md                   # Project README
├── SPEC.md                     # This file
└── src/
    ├── App.vue
    ├── api/                    # Axios API functions
    │   ├── auth.api.ts
    │   ├── cliente.api.ts
    │   ├── corte-caja.api.ts
    │   ├── gasto.api.ts
    │   ├── health.api.ts
    │   ├── producto.api.ts
    │   ├── reporte.api.ts
    │   ├── usuario.api.ts
    │   └── venta.api.ts
    ├── boot/
    │   ├── axios.ts            # Axios instance + JWT interceptor
    │   └── theme.ts            # Pre-render dark background for always-dark themes
    ├── components/
    │   └── BackendStatusIndicator.vue
    ├── css/
    │   └── app.scss            # Global styles (theme CSS vars, transitions, scrollbar, resets, Console/Obsidian overrides)
    ├── layouts/
    │   └── MainLayout.vue      # Shell: bottom tabs (mobile) / drawer (desktop), 5-theme selector, dark mode toggle
    ├── pages/
    │   ├── LoginPage.vue
    │   ├── DashboardPage.vue
    │   ├── InventarioPage.vue
    │   ├── VentasPage.vue
    │   ├── ClientesPage.vue
    │   ├── UsuariosPage.vue
    │   ├── GastosPage.vue
    │   ├── CortesCajaPage.vue
    │   └── ReportesPage.vue
    ├── router/
    │   ├── index.ts            # Router instance + auth guard
    │   └── routes.ts           # Route definitions
    ├── stores/
    │   ├── index.ts
    │   ├── auth-store.ts
    │   ├── cliente-store.ts
    │   ├── corte-caja-store.ts
    │   ├── gasto-store.ts
    │   ├── producto-store.ts
    │   ├── theme-store.ts
    │   ├── usuario-store.ts
    │   └── venta-store.ts
    ├── theme/
    │   └── themes.ts           # 5 themes (Corporate, Nature, Midnight, Console, Obsidian)
    └── utils/
        └── pdf.ts              # PDF generator (jsPDF)
```

---

## 3. Arquitectura por Capas

### 3.1 API Layer (`src/api/`)

Cada archivo exporta:
- **Interfaces** `Request`/`Response` para cada entidad
- **Funciones** CRUD tipadas con Axios
- Funciones de búsqueda específica (`buscarPorEmail`, `buscarPorCodigo`)
- **`reporte.api.ts`**: funciones para 7 endpoints con filtro JSON string + `formato` param. Exporta `exportarReporte(endpoint, filter, formato)` para descarga blob con JWT.

Patrón:
```typescript
export function listarProductos(params?: ListarParams) {
  return api.get<PageResponse<ProductoResponse>>('/productos', { params });
}
```

### 3.2 Store Layer (`src/stores/`)

Pinia Options API. Cada store expone:
- `state`: listas, loading, error
- `actions`: `listar`, `crear`, `actualizar`, `eliminar`, `toggleActivo`
- Auto-recarga al mutar (llama `listar` tras cambios)

### 3.3 Page Layer (`src/pages/`)

Composition API (`<script setup lang="ts">`). Consumen stores o API directa.

---

## 4. Autenticación

- Login vía `POST /auth/login` → `{ token, email, nombre, apellido, rol }`
- Token guardado en `LocalStorage('token')`
- Axios interceptor: adjunta `Authorization: Bearer <token>` en cada request
- 401 → limpia token + redirect a `/login`
- Store: `auth-store.ts` con `login()`, `logout()`, `nombreCompleto`

---

## 5. Routing

- **Hash-based** (`createWebHashHistory`)
- **Rutas públicas**: `/login`
- **Rutas protegidas** (requieren token):
  - `/dashboard` — Landing
  - `/ventas` — POS
  - `/inventario` — Productos
  - `/clientes` — Clientes
  - `/usuarios` — Usuarios
  - `/gastos` — Gastos
  - `/cortes-caja` — Cortes de Caja
  - `/reportes` — Reportes

---

## 6. Sistema de Temas

### 6.1 Temas disponibles

5 temas seleccionables desde un diálogo. Los temas Console y Obsidian son **siempre oscuros** (fuerzan `darkMode=true`, el toggle de modo oscuro se deshabilita).

| Tema | Estilo claro (primario) | Estilo oscuro (primario) | ¿Siempre oscuro? |
|------|------------------------|--------------------------|:---:|
| **Corporate** | Azul corporate `#1565C0`, fondos claros | Azul sobre fondos `#0E1622`/`#1C2533` | No |
| **Nature** | Verde naturaleza `#2E7D32`, fondos crema | Verde sobre fondos `#0B160B`/`#162616` | No |
| **Midnight** | Acento índigo `#5C6BC0`, fondos gris claro | Índigo sobre fondos `#0D0F14`/`#1A1D26` | No |
| **Console** | Negro terminal `#0D0D0D` (forzado oscuro) | Verde fosforescente `#00FF41`, fondo `#060606`/`#0D0D0D` | **Sí** |
| **Obsidian** | Azul-negro `#1E1E2E` (forzado oscuro) | Violeta-cyan suaves (Nord palette), fondo `#13131F`/`#1E1E2E` | **Sí** |

### 6.2 Implementación

- **Paletas**: definidas en `src/theme/themes.ts` como array de objetos `Theme` con colores `primary`, `secondary`, `accent`, `positive`, `negative`, `info`, `warning` para `light` y `dark`
- **Store**: `src/stores/theme-store.ts` (Pinia) — estado `selectedTheme` + `darkMode` boolean, persistido en `LocalStorage`. Los temas siempre oscuros (`console`, `obsidian`) fuerzan `darkMode=true` en `setTheme()` y `init()`, y `toggleDark()` no hace nada si están activos.
- **Aplicación**: el store escribe CSS custom properties en `<html>` (`--q-primary`, `--q-dark`, `--q-dark-page`, etc.) + `data-theme` attribute + `$q.dark.set()`. Para temas siempre oscuros, también fuerza inline `backgroundColor` en `html` y `body`.
- **Boot**: `src/boot/theme.ts` se ejecuta **antes del primer render** para aplicar fondo oscuro si el tema guardado es Console/Obsidian, eliminando el flash blanco.
- **CSS específico**: `app.scss` tiene reglas para `html[data-theme="console"]` y `html[data-theme="obsidian"]` que fuerzan superficies oscuras (cards, drawer, page, header) con `!important`.

### 6.3 Estilos Console

- Scrollbar verde `#00FF41`
- Bordes verdes en header/footer (`1px solid #00FF41`)

### 6.4 Estilos Obsidian

- Scrollbar violeta suave `#C792EA`
- Paleta Nord para positivo/negativo/info/warning: `#A3BE8C`, `#BF616A`, `#88C0D0`, `#EBCB8B`

---

## 7. Módulos Funcionales

### 7.1 LoginPage
- Formulario email + password
- Valida contra backend
- Redirige a `/dashboard` si ya autenticado

### 7.2 DashboardPage
- Grid de tarjetas de acceso rápido a cada módulo
- Cards con icono + texto

### 7.3 VentasPage
- Módulo POS con:
  - Input de código de barras + botón escáner
  - Tabla de carrito dinámico
  - Selector de cliente
  - Total, descuento, método de pago
  - Finalizar venta → genera ticket
- Escáner: intent ZXing en Android, fallback cámara/galería + BarcodeDetector/html5-qrcode
- Guarda carrito en sessionStorage al abrir escáner externo

### 7.4 InventarioPage
- CRUD completo de productos (codigo, nombre, precioCompra, precioVenta, existencia, pesado)
- Diálogo de escáner de código de barras (cámara/galería)
- Estado `activo`/`inactivo` toggle
- Paginación

### 7.5 ClientesPage
- CRUD de clientes (nombre, apellido, email, teléfono, dirección, documento, crédito)
- Paginación

### 7.6 UsuariosPage
- CRUD de usuarios (solo admin)
- Roles: ROLE_ADMIN, ROLE_USER, ROLE_VENDEDOR
- Paginación

### 7.7 GastosPage
- CRUD de gastos (descripción, monto, fechaGasto, categoria, metodoPago, observación)
- Filtros: texto, fechas, montos, estado
- Exportación PDF

### 7.8 CortesCajaPage
- **Estado**: banner verde si hay corte abierto (con resumen de monto inicial, ventas, gastos, métodos de pago, usuario que abrió); banner gris "No hay corte abierto" si no
- **Abrir**: diálogo con monto inicial (requerido, ≥0) + observación opcional
- **Cerrar**: diálogo con resumen del turno + monto final (precalculado = inicial + ventas reales - gastos reales) + observación opcional
- **Historial**: tabla paginada (columna: #, Apertura, Cierre, Inicial, Ventas, Final, Estado, Usuario, Acciones)
- **Detalle**: modal maximizado con info general, tarjetas de montos (inicial, final, ventas, gastos, diferencia con color), desglose por método de pago
- **Datos reales**: el store independientemente carga ventas COMPLETADAS del día (via `listarVentas` con filtro de fecha) y gastos del día (via `buscarGastosPorRangoFechas`) porque el backend devuelve `totalVentas: 0` y `totalGastos: 0` para cortes abiertos
- **Refresh**: botón para recargar ventas/gastos sin recargar el corte
- **Formato de fechas**: todos los parámetros de fecha usan `YYYY-MM-DDTHH:MM:SS` (sin `Z`, sin milisegundos) para compatibilidad con `LocalDateTime` de Spring Boot

### 7.9 ReportesPage
- 7 tipos: Ventas, Stock, Productos, Gastos, Dashboard, Cortes de Caja, Clientes
- Filtros dinámicos por tipo (fechas, texto, número, selects)
- **Fechas por defecto**: al seleccionar el tab Ventas, `fechaDesde` y `fechaHasta` se inicializan con la fecha actual (`YYYY-MM-DD`)
- Formato respuesta backend: `{ titulo, columnas[], filas[], tipoGrafico?, graficoNombre? }`
- Resumen ejecutivo narrativo calculado de los datos
- Tarjetas de métricas clave
- Gráfica (Chart.js): LINEA, BARRA, DONA según `tipoGrafico` del backend, en **panel colapsable** (por defecto cerrado — botón expandir/contraer en el encabezado)
- Tabla detallada con formato: `$XX.00` montos, `YYYY-MM-DD HH:MM` fechas, `*N/A*` vacíos
- **Columna Detalle** en reporte Ventas: botón `visibility` que abre diálogo maximizado con datos del ticket (`GET /ventas/{id}/ticket`):
  - 4 tarjetas resumen: Total, Fecha, Atendido por, Cliente
  - Tabla de líneas: Producto (nombre real), Cantidad, Unidad (KG/PIEZA), P. Unitario, Desc. %, Subtotal
- Exportaciones (todas funcionan desde datos frontend):
  - **JSON**: Blob descargable
  - **Excel**: HTML table → `.xls` (abre en Excel)
  - **PDF**: jsPDF + jspdf-autotable via `generarPdf()`
  - **Imprimir**: `window.print()` (botón color `warning`/amarillo para contraste)

---

## 8. API de Reportes

### 8.1 Endpoints

| Endpoint | operationId | Filtros |
|----------|-------------|---------|
| `GET /reportes/ventas` | reporteVentas | fechaDesde, fechaHasta, usuarioEmail, clienteId, estado, metodoPago |
| `GET /reportes/stock` | reporteStock | stockMinimo, soloActivos |
| `GET /reportes/productos` | reporteProductos | fechaDesde, fechaHasta, limite |
| `GET /reportes/gastos` | reporteGastos | fechaDesde, fechaHasta, categoria |
| `GET /reportes/dashboard` | dashboard | fecha |
| `GET /reportes/cortes-caja` | reporteCortes | fechaDesde, fechaHasta |
| `GET /reportes/clientes` | reporteClientes | fechaDesde, fechaHasta, limite |

### 8.2 Parámetros comunes

- `filter` (string, opcional): JSON string con filtros. Ej: `{"fechaDesde":"2026-06-29","fechaHasta":"2026-06-29"}`
- `formato` (string, opcional, default: `"JSON"`): `JSON | EXCEL | PDF | PRINT`

### 8.3 Formato de respuesta (JSON)

```json
{
  "titulo": "Reporte de Ventas",
  "columnas": ["ID", "Fecha", "Cliente", "Usuario", "Estado", "Total", "MetodoPago"],
  "filas": [
    { "ID": 1, "Fecha": "2026-06-29T15:30:53", "Cliente": "Mostrador", "Usuario": "pepe@gmail.com", "Estado": "COMPLETADA", "Total": 20, "MetodoPago": "" }
  ],
  "tipoGrafico": "LINEA",
  "graficoNombre": "Ventas por dia"
}
```

---

## 9. Escáner de Código de Barras

### Estrategia
1. **Android**: intent URL `intent://scan/#Intent;...;end` abre app ZXing
2. **Fallback** (todos los dispositivos):
   - Botón "Tomar foto": `<input type="file" capture="environment" accept="image/*">`
   - Botón "Subir imagen": `<input type="file" accept="image/*">`
3. **Decodificación**:
   - `BarcodeDetector` API nativa (Chrome Android)
   - Fallback: `html5-qrcode.scanFile()` (escáner JS puro)
4. No usa streaming de cámara (`getUserMedia`) — funciona en HTTP

### Preservación de estado
- Ventas: carrito guardado en `sessionStorage` antes de abrir escáner, restaurado al volver
- Inventario: datos del diálogo guardados en `sessionStorage`

---

## 10. Exportaciones

### JSON
```typescript
descargarJson(datos, nombreArchivo)
```
Blob `application/json` descargable.

### Excel (CSV)
```typescript
exportExcel()
```
Genera HTML table con estilos → Blob `application/vnd.ms-excel` → descarga `.xls`.

### PDF
```typescript
generarPdf(titulo, columnas, datos, nombreArchivo, filtros?)
```
jsPDF + autoTable en landscape A4. Soporta formateo de moneda, fecha, activo, rol.

### Imprimir
```typescript
window.print()
```
Imprime la página actual (reporte en pantalla).

---

## 11. Configuración

### quasar.config.js

```javascript
boot: ['theme', 'axios'],
css: ['app.scss'],
extras: ['material-icons'],
build: {
  distDir: 'dist',
  viteVuePluginOptions: {
    vite: { server: { allowedHosts: true } }
  }
},
devServer: {
  port: 9000, host: '0.0.0.0', open: false,
  proxy: { '/api': { target: 'http://localhost:8090', changeOrigin: true } }
},
framework: {
  iconSet: 'material-icons', lang: 'es',
  plugins: ['Dialog', 'Notify', 'Loading', 'LocalStorage']
}
```

### Plugins Quasar
- Dialog, Notify, Loading, LocalStorage

### Dependencias adicionales
- `chart.js` — gráficas en ReportesPage
- `jspdf` + `jspdf-autotable` — generación de PDF
- `html5-qrcode` — escáner de código de barras fallback

---

## 12. Convenciones de Código

- **Sin comentarios** en código de producción
- **Sin librerías de UI** adicionales a Quasar
- **Rutas de importación** relativas (`../api/...`)
- **Nombres** en español (funciones, variables, comentarios)
- **Stores**: Options API
- **Pages**: Composition API `<script setup lang="ts">`
- **API files**: funciones exportadas, sin clases

---

## 13. Backend API (Java Spring Boot)

- URL base: `http://localhost:8090/api`
- Autenticación: JWT Bearer token
- Paginación: `PageResponse<T>` con `content, page, size, totalElements, totalPages`
- Endpoints CRUD por entidad con `toggle-activo` (PATCH)
- `GET /ventas/{id}/ticket` — `TicketResponse` con `lineas[]` (producto, cantidad, unidad, precioUnitario, descuentoPorcentaje, importe) — usado en el diálogo Detalle de ReportesPage
- `GET /cortes-caja/abierto` — corte actualmente abierto (tiene `totalVentas: 0`, `totalGastos: 0` para cortes abiertos — el frontend calcula estos totales independientemente)
- `POST /cortes-caja/abrir` — abre nuevo corte con `AbrirCorteRequest` (`montoInicial` requerido, `observacion` opcional)
- `POST /cortes-caja/{id}/cerrar` — cierra corte con `CerrarCorteRequest` (`montoFinal` requerido, `observacion` opcional)
- Reportes: endpoint GET con filtro JSON string + formato (JSON/EXCEL/PDF/PRINT)

---

## 14. API de Cortes de Caja

### 14.1 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/cortes-caja` | Lista paginada (`page`, `size`, `sortBy`, `sortDir`) |
| GET | `/cortes-caja/{id}` | Obtener por ID |
| GET | `/cortes-caja/abierto` | Obtener corte actualmente abierto (404 si no hay) |
| POST | `/cortes-caja/abrir` | Abrir nuevo corte (`AbrirCorteRequest`) |
| POST | `/cortes-caja/{id}/cerrar` | Cerrar corte (`CerrarCorteRequest`) |

### 14.2 DTOs

**CorteCajaResponseDTO:**
```typescript
interface CorteCajaResponse {
  id: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  activo: boolean;
  fechaApertura: string;
  fechaCierre: string;
  montoInicial: number;
  montoFinal: number;
  totalVentas: number;      // 0 para cortes abiertos
  totalGastos: number;      // 0 para cortes abiertos
  totalEfectivo: number;
  totalTarjeta: number;
  totalTransferencia: number;
  diferencia: number;
  observacion: string;
  estado: 'ABIERTO' | 'CERRADO';
  usuarioEmail: string;
  usuarioNombre: string;
}
```

**AbrirCorteRequest:**
```typescript
interface AbrirCorteRequest {
  montoInicial: number;     // requerido, >= 0
  observacion?: string;
}
```

**CerrarCorteRequest:**
```typescript
interface CerrarCorteRequest {
  montoFinal: number;       // requerido, >= 0
  observacion?: string;
}
```

### 14.3 Cómputo de totales client-side

El backend devuelve `totalVentas: 0` y `totalGastos: 0` para cortes con estado `ABIERTO`. El frontend los calcula así:

1. Al verificar el corte abierto (`verificarCorteAbierto`), también llama a `cargarOperacionesHoy(fechaApertura)`
2. `cargarOperacionesHoy` ejecuta en paralelo:
   - `listarVentas({ fechaDesde, fechaHasta, page: 0, size: 9999 })` → filtra `estado === 'COMPLETADA'` y suma `total`
   - `buscarGastosPorRangoFechas(desde, hasta)` → suma `monto`
3. Los getters `totalVentasHoy` y `totalGastosHoy` proporcionan los totales
4. La diferencia se calcula como: `montoInicial + totalVentasHoy - totalGastosHoy`
5. El monto final por defecto en el diálogo de cierre se precalcula como: `montoInicial + totalVentasHoy - totalGastosHoy`

### 14.4 Formato de fechas

Todos los parámetros de fecha hacia el backend deben usar el formato **`YYYY-MM-DDTHH:MM:SS`** (sin `Z`, sin milisegundos, sin timezone). Las funciones helper en el store:

- `toLocalDateTimeString(d: Date)`: convierte Date local a `YYYY-MM-DDTHH:MM:SS`
- `limpiarFechaBackend(fecha: string)`: elimina microsegundos (`.415134`) y timezone (`Z`, `+/-HH:MM`) de fechas devueltas por el backend
