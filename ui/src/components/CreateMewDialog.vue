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
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity backdrop-blur-sm"
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
                class="relative transform overflow-hidden bg-white rounded-3xl shadow-xl transition-all w-full"
              >
                <div
                  v-if="
                    (mewType !== undefined && MewTypeName.Reply in mewType) ||
                    MewTypeName.Quote in mewType
                  "
                  class="font-title text-xl flex justify-start items-center px-4 py-4 mr-2"
                >
                  <div v-if="MewTypeName.Reply in mewType" class="mr-2">
                    reply to
                  </div>
                  <div v-else-if="MewTypeName.Quote in mewType" class="mr-2">
                    quote
                  </div>

                  <BaseAgentProfileName
                    v-if="originalMew"
                    :profile="originalMew.author_profile"
                    :agentPubKey="originalMew.action.author"
                  />
                </div>

                <BaseMewContent
                  v-if="
                    mewType !== undefined &&
                    (MewTypeName.Reply in mewType ||
                      MewTypeName.Quote in mewType) &&
                    originalMew
                  "
                  :mew="originalMew.mew"
                  class="px-8 py-4"
                />

                <CreateMewInput
                  :mew-type="mewType"
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
import { FeedMew, MewType, MewTypeName } from "@/types/types";
import CreateMewInput from "@/components/CreateMewInput.vue";
import BaseMewContent from "@/components/BaseMewContent.vue";
import BaseAgentProfileName from "@/components/BaseAgentProfileName.vue";
import {
  Dialog,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from "@headlessui/vue";
import { Profile } from "@holochain-open-dev/profiles";

withDefaults(
  defineProps<{
    modelValue: boolean;
    mewType: MewType;
    originalMew?: FeedMew;
    originalAuthor?: Profile | null;
  }>(),
  {
    modelValue: false,
    originalMew: undefined,
    originalAuthor: undefined,
  }
);

const emit = defineEmits(["mew-created", "update:model-value"]);
</script>

<style scoped></style>
