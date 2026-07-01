import { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    component: () => import('pages/LoginPage.vue'),
  },
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', component: () => import('pages/DashboardPage.vue') },
      { path: 'inventario', component: () => import('pages/InventarioPage.vue') },
      { path: 'usuarios', component: () => import('pages/UsuariosPage.vue') },
      { path: 'clientes', component: () => import('pages/ClientesPage.vue') },
      { path: 'ventas', component: () => import('pages/VentasPage.vue') },
      { path: 'gastos', component: () => import('pages/GastosPage.vue') },
      { path: 'cortes-caja', component: () => import('pages/CortesCajaPage.vue') },
      { path: 'reportes', component: () => import('pages/ReportesPage.vue') },
    ],
  },
];

export default routes;
