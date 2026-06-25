<template>
  <div class="q-pa-md">
    <div class="text-h5 q-mb-md">Dashboard</div>
    <div class="row q-col-gutter-md">
      <div class="col-xs-12 col-sm-6">
        <q-card clickable v-ripple to="/inventario" class="cursor-pointer">
          <q-card-section class="text-center">
            <q-icon name="inventory_2" size="64px" color="primary" />
            <div class="text-h6 q-mt-sm">Inventario</div>
            <div class="text-caption text-grey">Gestiona tus productos</div>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-xs-12 col-sm-6">
        <q-card clickable v-ripple to="/usuarios" class="cursor-pointer">
          <q-card-section class="text-center">
            <q-icon name="people" size="64px" color="primary" />
            <div class="text-h6 q-mt-sm">Usuarios</div>
            <div class="text-caption text-grey">Administra los usuarios</div>
          </q-card-section>
        </q-card>
      </div>
    </div>
  </div>
</template>
