<template>
  <BaseDialog
    :model-value="modelValue"
    @update:model-value="(val: boolean) => emit('update:model-value', val)"
  >
    <div
      v-if="
        (mewType !== undefined && MewTypeName.Reply in mewType) ||
        MewTypeName.Quote in mewType
      "
      class="font-title text-xl flex justify-start items-center mr-2 mb-4"
    >
      <div v-if="MewTypeName.Reply in mewType" class="mr-2">reply to</div>
      <div v-else-if="MewTypeName.Quote in mewType" class="mr-2">quote</div>

      <BaseAgentProfileName
        v-if="originalMew"
        :profile="originalMew.author_profile"
        :agentPubKey="originalMew.action.author"
      />
    </div>

    <div
      v-if="
        mewType !== undefined &&
        (MewTypeName.Reply in mewType || MewTypeName.Quote in mewType) &&
        originalMew
      "
      class="bg-base-200 rounded-3xl mb-4 mx-4"
    >
      <BaseMewListItem :feed-mew="originalMew" :show-buttons="false" />
    </div>

    <CreateMewInput
      :mew-type="mewType"
      @mew-created="(val: any) => {
        emit('mew-created', val);
        emit('update:model-value', false);
      }"
    />
  </BaseDialog>
</template>

<script setup lang="ts">
import { FeedMew, MewType, MewTypeName } from "@/types/types";
import CreateMewInput from "@/components/CreateMewInput.vue";
import BaseAgentProfileName from "@/components/BaseAgentProfileName.vue";
import BaseDialog from "@/components/BaseDialog.vue";
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
