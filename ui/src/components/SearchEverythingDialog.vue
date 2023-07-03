<template>
  <TransitionRoot as="template" :show="modelValue">
    <Dialog
      as="div"
      class="relative z-20"
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
          class="fixed inset-0 z-10 bg-base-300 bg-opacity-75 transition-opacity backdrop-blur-sm"
          style="-webkit-backdrop-filter: blur(10px)"
        ></div>
      </TransitionChild>

      <div class="fixed inset-0 z-20 overflow-y-auto">
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
            <DialogPanel class="w-full sm:max-w-screen-sm">
              <SearchEverythingDialogInput
                @selected="
                  (val) => {
                    router.push(val);
                    emit('update:model-value', false);
                  }
                "
              />
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
import SearchEverythingDialogInput from "@/components/SearchEverythingDialogInput.vue";
import { useRouter } from "vue-router";

defineProps<{
  modelValue: boolean;
}>();
const emit = defineEmits(["update:model-value"]);
const router = useRouter();
</script>
