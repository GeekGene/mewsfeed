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
        ></div>
      </TransitionChild>

      <div class="fixed inset-0 z-10 overflow-y-auto w-full">
        <div
          class="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0 w-full"
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
            <DialogPanel class="w-full sm:max-w-screen-sm">
              <div
                class="relative transform overflow-hidden bg-base-100 rounded-3xl shadow-xl transition-all w-full p-4"
              >
                <div
                  class="font-title text-xl flex justify-start items-center px-4 mr-2"
                >
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
