<template>
  <QDialog
    :model-value="modelValue"
    @update:model-value="(val: boolean) => emit('update:model-value', val)"
    @hide="emit('update:model-value', false)"
    @escape-key="emit('update:model-value', false)"
  >
    <QCard>
      <QToolbar v-if="showCloseButton">
        <QSpace />
        <QBtn v-close-popup dense flat round icon="close" />
      </QToolbar>

      <create-profile
        v-if="profilesStore && !myProfile"
        :store="profilesStore"
        @profile-created="emit('profile-created')"
      ></create-profile>
      <slot v-else></slot>
    </QCard>
  </QDialog>
</template>

<script setup lang="ts">
import { QDialog, QCard, QToolbar, QBtn, QSpace } from "quasar";
import { useMyProfile } from "@/stores/profiles";
import { ComputedRef, inject } from "vue";
import { ProfilesStore } from "@holochain-open-dev/profiles";

const profilesStore = (inject("profilesStore") as ComputedRef<ProfilesStore>)
  .value;
const emit = defineEmits(["profile-created", "update:model-value"]);
withDefaults(
  defineProps<{
    modelValue: boolean;
    showCloseButton?: boolean;
  }>(),
  {
    showCloseButton: false,
  }
);

const { myProfile } = useMyProfile();
</script>
