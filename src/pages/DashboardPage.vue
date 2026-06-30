<template>
  <div class="q-pa-md dashboard-page">
    <div class="row items-center q-mb-lg">
      <div>
        <div class="text-h5 text-weight-bold">Dashboard</div>
        <div class="text-caption text-grey-7">Panel principal de control</div>
      </div>
      <q-space />
      <q-icon name="dashboard" size="32px" color="primary" class="q-mr-sm" />
    </div>

    <div class="row q-col-gutter-md">
      <div v-for="item in dashboardItems" :key="item.to" class="col-xs-12 col-sm-6 col-md-4">
        <q-card
          clickable v-ripple :to="item.to"
          class="dashboard-card"
          flat
        >
          <div class="card-accent" :style="{ background: item.gradient }" />
          <q-card-section class="row items-center no-wrap q-pa-md">
            <div class="card-icon-wrapper" :style="{ background: item.gradient }">
              <q-icon :name="item.icon" size="32px" color="white" />
            </div>
            <div class="q-ml-md">
              <div class="text-subtitle1 text-weight-bold">{{ item.label }}</div>
              <div class="text-caption text-grey-7">{{ item.desc }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface DashboardItem {
  icon: string;
  label: string;
  desc: string;
  to: string;
  gradient: string;
}

const dashboardItems: DashboardItem[] = [
  { icon: 'point_of_sale', label: 'Ventas', desc: 'Registrar y gestionar ventas', to: '/ventas', gradient: 'linear-gradient(135deg, var(--q-primary), var(--q-secondary))' },
  { icon: 'inventory_2', label: 'Inventario', desc: 'Gestiona tus productos', to: '/inventario', gradient: 'linear-gradient(135deg, #43A047, #66BB6A)' },
  { icon: 'people', label: 'Clientes', desc: 'Administra los clientes', to: '/clientes', gradient: 'linear-gradient(135deg, var(--q-accent), #7E57C2)' },
  { icon: 'payments', label: 'Gastos', desc: 'Controla los gastos', to: '/gastos', gradient: 'linear-gradient(135deg, #FB8C00, #FFA726)' },
  { icon: 'bar_chart', label: 'Reportes', desc: 'Analiza tus datos', to: '/reportes', gradient: 'linear-gradient(135deg, #00838F, #26C6DA)' },
  { icon: 'manage_accounts', label: 'Usuarios', desc: 'Administra los usuarios', to: '/usuarios', gradient: 'linear-gradient(135deg, #7B1FA2, #AB47BC)' },
];
</script>

<style lang="scss" scoped>
.dashboard-page {
  max-width: 960px;
  margin: 0 auto;
}

.dashboard-card {
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }
}

.card-accent {
  height: 4px;
  width: 100%;
}

.card-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
