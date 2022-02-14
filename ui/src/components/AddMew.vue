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
      :disable="newMew === ''"
      color="secondary"
      @click="publishMew"
    >
      Publish Mew
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Mew, CreateMewInput } from "../types/types";
const emit = defineEmits<{(e: 'publish-mew', mew: CreateMewInput): void;}>();

const newMew = ref("");
const publishMew = async () => {
    const createMewInput = {
      mewType: {
        original: null
      },
      mew: newMew.value
    };
    emit("publish-mew", createMewInput);
    newMew.value = "";
};
</script>
