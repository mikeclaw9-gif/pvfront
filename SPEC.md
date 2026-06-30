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
├── quasar.config.js            # Quasar config (Vite, proxy, plugins)
├── tsconfig.json               # TS strict + @/* alias
├── AGENTS.md                   # AI assistant instructions
├── README.md                   # Project README
├── SPEC.md                     # This file
└── src/
    ├── App.vue
    ├── api/                    # Axios API functions
    │   ├── auth.api.ts
    │   ├── cliente.api.ts
    │   ├── gasto.api.ts
    │   ├── health.api.ts
    │   ├── producto.api.ts
    │   ├── reporte.api.ts
    │   ├── usuario.api.ts
    │   └── venta.api.ts
    ├── boot/
    │   └── axios.ts            # Axios instance + JWT interceptor
    ├── components/
    │   └── BackendStatusIndicator.vue
    ├── css/
    │   └── app.scss            # Global styles + tema Consola SCSS
    ├── layouts/
    │   └── MainLayout.vue      # Shell: drawer nav, temas, logout
    ├── pages/
    │   ├── LoginPage.vue
    │   ├── DashboardPage.vue
    │   ├── InventarioPage.vue
    │   ├── VentasPage.vue
    │   ├── ClientesPage.vue
    │   ├── UsuariosPage.vue
    │   ├── GastosPage.vue
    │   └── ReportesPage.vue
    ├── router/
    │   ├── index.ts            # Router instance + auth guard
    │   └── routes.ts           # Route definitions
    ├── stores/
    │   ├── index.ts
    │   ├── auth-store.ts
    │   ├── cliente-store.ts
    │   ├── gasto-store.ts
    │   ├── producto-store.ts
    │   ├── usuario-store.ts
    │   └── venta-store.ts
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
  - `/reportes` — Reportes

---

## 6. Sistema de Temas

### 6.1 Temas disponibles

4 temas seleccionables desde el menú lateral (ícono `palette`), cada uno con variante claro y oscuro:

| Tema | Claro (primario) | Oscuro (primario) |
|------|------------------|--------------------|
| **Predeterminado** | Azul `#1976D2` | Azul claro `#64B5F6` |
| **Oceánico** | Teal `#00695C` | Teal claro `#26A69A` |
| **Esmeralda** | Verde `#1B5E20` | Verde `#4CAF50` |
| **Consola** | Naranja `#BF360C` + tipografía monospace | Verde neón `#00FF41` sobre fondo `#0a0a0a` + monospace |

### 6.2 Implementación

- Las paletas se definen en `MainLayout.vue` como un array de objetos `Theme`
- Al seleccionar, se aplican CSS custom properties en `:root` (`--q-primary`, `--q-secondary`, etc.)
- Tema y modo oscuro persisten en `LocalStorage('selectedTheme', 'darkMode')`
- `app.scss` define estilos específicos por tema (fondo oscuro Consola `#0a0a0a`, fondo Oceánico `#0d1b2a`, etc.)

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

### 7.8 ReportesPage
- 7 tipos: Ventas, Stock, Productos, Gastos, Dashboard, Cortes de Caja, Clientes
- Filtros dinámicos por tipo (fechas, texto, número, selects)
- Formato respuesta backend: `{ titulo, columnas[], filas[], tipoGrafico?, graficoNombre? }`
- Resumen ejecutivo narrativo calculado de los datos
- Tarjetas de métricas clave
- Gráfica (Chart.js): LINEA, BARRA, DONA según `tipoGrafico` del backend
- Tabla detallada con formato: `$XX.00` montos, `YYYY-MM-DD HH:MM` fechas, `*N/A*` vacíos
- Exportaciones (todas funcionan desde datos frontend):
  - **JSON**: Blob descargable
  - **Excel**: HTML table → `.xls` (abre en Excel)
  - **PDF**: jsPDF + jspdf-autotable via `generarPdf()`
  - **Imprimir**: `window.print()`

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
- Reportes: endpoint GET con filtro JSON string + formato (JSON/EXCEL/PDF/PRINT)
