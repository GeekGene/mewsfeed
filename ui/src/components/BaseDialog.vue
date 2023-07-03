<template>
  <TransitionRoot as="template" :show="modelValue">
    <Dialog
      as="div"
      class="relative z-20 w-full"
      @close="emit('update:model-value', false)"
    >
      <TransitionChild
        as="template"
        enter="ease-out duration-300"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-200"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div
          class="fixed inset-0 bg-base-300 bg-opacity-75 transition-opacity backdrop-blur-sm"
          style="-webkit-backdrop-filter: blur(10px)"
        ></div>
      </TransitionChild>

      <div class="fixed inset-0 z-10 overflow-y-auto w-full">
        <div
          class="flex min-h-full items-center justify-center text-center sm:items-center px-2 sm:px-0"
        >
          <TransitionChild
            as="template"
            enter="ease-out duration-300"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel
              class="w-full md:w-2/3 sm:px-8"
              :class="dialogPanelClass"
            >
              <div
                class="relative transform overflow-hidden bg-base-100 rounded-3xl shadow-xl transition-all w-full p-2 sm:p-8"
              >
                <slot></slot>
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import {
  Dialog,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";

const emit = defineEmits(["update:model-value"]);
withDefaults(
  defineProps<{
    modelValue: boolean;
    dialogPanelClass?: string;
  }>(),
  {
    dialogPanelClass: "",
  }
);
</script>
