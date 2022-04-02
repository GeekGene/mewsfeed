<template>
  <div>
    <q-input
      v-model="newMew"
      type="textarea"
      class="q-mb-sm"
      dense
      outlined
      autofocus
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
import { CreateMewInput, MewType } from "../types/types";
import { PropType } from "vue";
const emit = defineEmits<{ (e: 'publish-mew', mew: CreateMewInput): void; }>();

const props = defineProps({
  mewType: { type: Object as PropType<MewType>, required: true }
});

const newMew = ref("");
const publishMew = async () => {
  const createMewInput = {
    mewType: props.mewType,
    mew: newMew.value
  };
  emit("publish-mew", createMewInput);
  newMew.value = "";
};
</script>
