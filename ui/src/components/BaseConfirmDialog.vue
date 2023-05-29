<template>
  <QDialog
    :model-value="modelValue"
    @update:model-value="(val: boolean) => emit('update:model-value', val)"
    @hide="emit('update:model-value', false)"
    @escape-key="emit('update:model-value', false)"
  >
    <QCard>
      <QToolbar v-if="showCloseButton">
        <QToolbarTitle v-if="title">{{ title }}</QToolbarTitle>
        <QSpace />
        <QBtn v-close-popup dense flat round icon="close" />
      </QToolbar>

      <QCardSection>
        <slot></slot>
      </QCardSection>
      <QCardSection>
        <div class="row justify-center">
          <QBtn v-close-popup size="md" icon="cancel" class="q-mr-md"
            >Cancel</QBtn
          >
          <QBtn
            v-close-popup
            size="md"
            color="secondary"
            icon="check"
            @click="emit('confirm')"
          >
            {{ confirmText }}
          </QBtn>
        </div>
      </QCardSection>
    </QCard>
  </QDialog>
</template>

<script setup lang="ts">
import {
  QDialog,
  QCard,
  QCardSection,
  QToolbar,
  QToolbarTitle,
  QBtn,
  QSpace,
} from "quasar";

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
