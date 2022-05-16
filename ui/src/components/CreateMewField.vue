<template>
  <div>
    <q-input
      v-model="newMew"
      type="textarea"
      class="q-mb-sm"
      dense
      outlined
      autofocus
    />
    <q-btn
      :disable="newMew === '' && !saving"
      :loading="saving"
      color="accent"
      @click="publishMew"
    >
      Publish Mew
    </q-btn>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { CreateMewInput, MewType } from "../types/types";
import { PropType } from "vue";
const emit = defineEmits<{ (e: "publish-mew", mew: CreateMewInput): void }>();

const props = defineProps({
  mewType: { type: Object as PropType<MewType>, required: true },
  saving: { type: Boolean, default: false },
});

const saving = computed(() => props.saving);
const newMew = ref("");
const publishMew = () => {
  const createMewInput: CreateMewInput = {
    mewType: props.mewType,
    text: newMew.value,
  };
  emit("publish-mew", createMewInput);
  newMew.value = "";
};
</script>
