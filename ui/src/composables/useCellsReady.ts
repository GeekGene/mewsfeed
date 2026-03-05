import { inject, type ComputedRef } from "vue";

export const useCellsReady = () =>
  inject("cellsReady") as ComputedRef<boolean>;
