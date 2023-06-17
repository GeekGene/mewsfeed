<template>
  <TransitionRoot as="template" :show="modelValue">
    <Dialog
      as="div"
      class="relative z-10"
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
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm"
        ></div>
      </TransitionChild>

      <div class="fixed inset-0 z-10 overflow-y-auto">
        <div
          class="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0"
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
            <DialogPanel>
              <div
                class="relative transform overflow-hidden rounded-3xl bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:w-full sm:max-w-sm sm:p-6"
              >
                <CreateMewInput
                  class="text-left"
                  :mew-type="{ [MewTypeName.Original]: null }"
                  @mew-created="(val: any) => {emit('mew-created', val); emit('update:model-value', false);} "
                />
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { MewTypeName } from "@/types/types";
import CreateMewInput from "./CreateMewInput.vue";
import {
  Dialog,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";

defineProps<{
  modelValue: boolean;
}>();
const emit = defineEmits(["mew-created", "update:model-value"]);
</script>

<style scoped></style>
