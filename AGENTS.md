<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tools** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them. `codegraph_node` returns one symbol's source + callers, or reads a whole file with line numbers. If the tools are listed but deferred, load them by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` and `codegraph node <symbol-or-file>` print the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->

# pventafront — Quasar 2 SPA (POS Frontend)

## Stack

Quasar 2 · Vue 3.5 · Pinia 2 · Vue Router 4 · Axios · TypeScript 5.5 · SCSS · jsPDF

## Developer Commands

| Command | What it does |
|---------|-------------|
| `npm run dev` | `quasar dev` — dev server on port 9000 (host 0.0.0.0, no auto-open) |
| `npm run build` | `quasar build` — outputs to `dist/` |

**No lint, typecheck, or test scripts exist.**

## Dev Server

- Port **9000**, bound to `0.0.0.0` (network-accessible). No auto-open.
- Proxy: `/api/*` → `http://localhost:8090` (the backend API).
- Allowed host: `miguel-desktop.local`.
- Quasar App Vite v2 under the hood (Vite-based), builds to `dist/`.

## Architecture

```
src/
├── api/          Axios functions per domain entity (auth, cliente, producto, usuario)
├── boot/         Axios boot file (baseURL /api, JWT interceptor, 401 → redirect /login)
├── css/          Global SCSS
├── layouts/      MainLayout.vue — shell with drawer nav + dark mode toggle
├── pages/        LoginPage, DashboardPage, InventarioPage, UsuariosPage, ClientesPage
├── router/       Hash-based routing (createWebHashHistory) with auth guard
├── stores/       Pinia stores (auth, cliente, producto, usuario)
└── utils/        PDF generator (jsPDF + jspdf-autotable)
```

## Conventions

- **Layer flow**: `api/{entity}.api.ts` (Axios functions, no classes) → `stores/{entity}-store.ts` (Pinia) → Vue pages consume stores via `useXStore()`.
- **API functions** are named exported functions, not classes. Each file exports request/response interfaces + CRUD functions.
- **Stores** follow the Options API pattern (`defineStore('name', { state, getters, actions })`). After mutate actions (`crear`, `actualizar`, `eliminar`, `toggleActivo`), stores auto-relist the current page.
- **Auth**: JWT token persisted in `LocalStorage` via Quasar's wrapper. Axios interceptor attaches `Bearer` header. 401 responses clear token and redirect to `/login`.
- **Routing**: Hash-based (`/#/login`, `/#/dashboard`). Guard redirects unauthenticated users to `/login`.
- **Dark mode** toggle persisted in `LocalStorage('darkMode')`.
- **PDF export** via `generarPdf(titulo, columnas, datos, nombreArchivo, filtros?)` in `src/utils/pdf.ts`. Opens PDF in new tab.
- **Language**: Spanish (`lang: es` in quasar config). Material Icons.
- **TypeScript**: strict mode, `@/*` path alias → `./src/*`. No `noUnusedLocals`/`noUnusedParameters`.
- **Quasar plugins in use**: Dialog, Notify, Loading, LocalStorage.
- **No generated code** — all source is hand-written.

## Backend API

Runs at `http://localhost:8090/api`. Endpoints mirror the frontend API files:
- `POST /auth/login` — returns `{ token, email, nombre, apellido, rol }`
- `/productos/*`, `/clientes/*`, `/usuarios/*` — full CRUD + `toggle-activo` + paginated list (`PageResponse<T>` shape)
