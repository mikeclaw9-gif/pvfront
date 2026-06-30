# pventafront

Sistema POS (Punto de Venta) — Frontend SPA construido con Quasar 2 + Vue 3.

## Stack

Quasar 2 · Vue 3.5 · Pinia 2 · Vue Router 4 · Axios · TypeScript 5.5 · SCSS · jsPDF · Chart.js

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Dev server en puerto 9000, host 0.0.0.0 |
| `npm run build` | Build para producción en `dist/` |

## Módulos

- **Auth** — Login JWT con interceptor Axios
- **Ventas** — POS con carrito, escáner de código de barras, ticket
- **Inventario** — CRUD de productos con escáner de código de barras
- **Clientes** — CRUD de clientes
- **Usuarios** — CRUD de usuarios (admin)
- **Gastos** — CRUD de gastos con filtros e impresión PDF
- **Reportes** — 7 tipos de reportes con filtros, gráficas (Chart.js), exportación a JSON/Excel/PDF/Impresión, detalle por ticket
- **Temas** — 3 temas (Corporate, Nature, Midnight) con variante claro/oscuro

## API

Backend en `http://localhost:8090/api`. Proxy configurado en dev server.

Ver `AGENTS.md` para documentación detallada del proyecto.
