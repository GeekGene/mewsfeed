<template>
  <div class="toast toast-bottom toast-right">
    <div
      v-for="message in messages"
      :key="message.id"
      class="alert"
      :class="{
        'alert-info': message.type === 'info',
        'alert-success': message.type === 'success',
        'alert-error': message.type === 'error',
        'alert-warning': message.type === 'warning',
      }"
    >
      {{ message.text }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { useToasts } from "@/stores/toasts";
import { storeToRefs } from "pinia";

const { messages } = storeToRefs(useToasts());
</script>

<style scoped></style>
