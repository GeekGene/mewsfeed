<template>
  <BaseDialog
    :model-value="modelValue"
    dialog-panel-class="md:w-auto"
    @update:model-value="(val: boolean) => emit('update:model-value', val)"
  >
    <div class="font-title text-xl flex justify-start items-center px-4 mr-2">
      {{ title ? title : "Confirm" }}
    </div>
    <div class="m-8">
      <slot></slot>
    </div>
    <div class="flex justify-center items-center space-x-4">
      <button
        class="btn btn-md btn-error"
        @click="emit('update:model-value', false)"
      >
        Cancel
      </button>
      <button
        class="btn btn-md btn-success"
        @click="
          () => {
            emit('confirm');
            emit('update:model-value', false);
          }
        "
      >
        {{ confirmText }}
      </button>
    </div>
  </BaseDialog>
</template>

<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";

const emit = defineEmits(["confirm", "update:model-value"]);
withDefaults(
  defineProps<{
    modelValue: boolean;
    showCloseButton?: boolean;
    confirmText?: string;
    title?: string;
  }>(),
  {
    showCloseButton: true,
    confirmText: "Confirm",
    title: undefined,
  }
);
</script>
