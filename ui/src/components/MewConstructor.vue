<template>
  <div>
    <q-input
      v-model="newMew"
      type="textarea"
      class="q-mb-sm"
      dense
      outlined
      @keyup.enter="publishMew"
    />
    <q-btn
      color="accent"
      @click="publishMew"
    >
      Publish Mew
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Mew } from "../types/types";
const emit = defineEmits<{(e: 'publish-mew', mew: Mew): void;}>();

const newMew = ref("");
const publishMew = async () => {
    emit("publish-mew", newMew.value);
    newMew.value = "";
};
</script>
