<template>
  <div class="row items-center q-gutter-xs">
    <q-icon
      :name="iconName"
      :color="iconColor"
      size="18px"
      class="text-weight-bold"
    />
    <span v-if="error && status === 'unavailable'" class="text-caption text-negative q-ml-xs">
      {{ error }}
    </span>
    <span v-else-if="status === 'checking'" class="text-caption text-grey-7 q-ml-xs">
      Comprobando...
    </span>
    <span v-else-if="status === 'available'" class="text-caption text-green-7 q-ml-xs">
      Disponible
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  status: 'checking' | 'available' | 'unavailable';
  error?: string;
}

const props = defineProps<Props>();

const iconName = computed(() => {
  switch (props.status) {
    case 'available':
      return 'circle';
    case 'unavailable':
      return 'circle';
    case 'checking':
      return 'hourglass_empty';
  }
});

const iconColor = computed(() => {
  switch (props.status) {
    case 'available':
      return 'positive';
    case 'unavailable':
      return 'negative';
    case 'checking':
      return 'grey-7';
  }
});
</script>