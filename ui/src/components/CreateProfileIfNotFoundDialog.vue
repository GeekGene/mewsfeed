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
              <create-profile
                v-if="profilesStore && !myProfile"
                :store="profilesStore"
                class="font-content text-left prose"
                style="
                  .title {
                    font-family: Syne;
                  }
                  text-align: left;
                "
                @profile-created="emit('profile-created')"
              ></create-profile>
              <slot v-else></slot>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup lang="ts">
import { ComputedRef, inject } from "vue";
import { Profile, ProfilesStore } from "@holochain-open-dev/profiles";
import {
  Dialog,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";

const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const myProfile = inject("myProfile") as ComputedRef<Profile>;
const emit = defineEmits(["update:model-value", "profile-created"]);
withDefaults(
  defineProps<{
    modelValue: boolean;
    showCloseButton?: boolean;
  }>(),
  {
    showCloseButton: false,
  }
);
</script>
