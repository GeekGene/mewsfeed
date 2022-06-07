<template>
  <q-dialog v-model="isVisible" @hide="onClose">
    <q-card class="dialog">
      <q-card-section class="q-pb-none">
        <div class="row justify-between items-center">
          <slot name="title" />
          <q-btn v-close-popup icon="close" flat round dense />
        </div>
      </q-card-section>

      <q-card-section class="q-py-lg">
        <slot name="content" />
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from "vue";

const emit = defineEmits<{ (e: "close"): void }>();

const isVisible = ref(true);
const onClose = () => emit("close");
</script>

<style lang="sass" scoped>
.dialog
  min-width: 400px
  max-width: 600px
  max-height: calc(100vh - 100px)
</style>
