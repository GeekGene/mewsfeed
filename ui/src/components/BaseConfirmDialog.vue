<template>
  <BaseDialog
    :model-value="modelValue"
    @update:model-value="(val: boolean) => emit('update:model-value', val)"
  >
    <div class="font-title text-xl flex justify-start items-center px-4 mr-2">
      {{ title ? title : "Confirm" }}
    </div>
    <div class="my-8">
      <slot></slot>
    </div>
    <div class="flex justify-between items-center">
      <button
        class="btn btn-error btn-sm"
        @click="emit('update:model-value', false)"
      >
        Cancel
      </button>
      <button
        class="btn btn-sm btn-success"
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
