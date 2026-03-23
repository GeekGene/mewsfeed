import { computed, inject, type ComputedRef } from "vue";

export const useCellsReady = () =>
  inject("cellsReady", computed(() => false)) as ComputedRef<boolean>;
