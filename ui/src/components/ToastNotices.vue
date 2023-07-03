<template>
  <div class="toast toast-bottom toast-right">
    <div
      v-for="message in messages"
      :key="message.id"
      class="alert flex justify-start items-center"
      :class="{
        'alert-info': message.type === 'info',
        'alert-success': message.type === 'success',
        'alert-error': message.type === 'error',
        'alert-warning': message.type === 'warning',
      }"
    >
      <IconInformationCircleOutline v-if="message.type === 'info'" />
      <IconCheckmarkCircleOutline v-if="message.type === 'success'" />
      <IconAlertCircleOutline v-if="message.type === 'error'" />
      <IconWarningOutline v-if="message.type === 'warning'" />
      <div>{{ message.text }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToasts } from "@/stores/toasts";
import { storeToRefs } from "pinia";
import IconAlertCircleOutline from "~icons/ion/close-circle-outline";
import IconInformationCircleOutline from "~icons/ion/information-circle-outline";
import IconCheckmarkCircleOutline from "~icons/ion/checkmark-circle-outline";
import IconWarningOutline from "~icons/ion/warning-outline";

const { messages } = storeToRefs(useToasts());
</script>

<style scoped></style>
