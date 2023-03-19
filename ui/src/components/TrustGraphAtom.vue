<template>
  <q-item>
    <q-item-section>
      <q-input
        :model-value="value.topic"
        type="text"
        placeholder="add tag"
        dense
        borderless
        name="temp-topic"
        @change="onChange"
      />
    </q-item-section>
    <q-item-section>
      <!-- see https://quasar.dev/vue-components/slider -->
      <q-slider
        :model-value="value.weight"
        :min="0"
        :max="100"
        :step="1"
        label
        :marker-labels="fnMarkerLabel"
        name="temp-weight"
        @change="onChange"
      />
    </q-item-section>
  </q-item>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { QItem, useQuasar, QSlider, QInput } from "quasar";
import { TrustGraphAtomData } from "../types/types";

const $q = useQuasar();

const emit = defineEmits(["input"]);

function onChange(target: number | string) {
  // TODO split out into two handlers:
  if (typeof target === "string") {
    emit("input", { topic: target });
  } else {
    emit("input", { weight: target });
  }
}

defineProps<{
  value: TrustGraphAtomData;
}>();

const topic = ref("");
const weight = ref(1.0);

watch([topic, weight], () => {
  emit("input", {
    topic,
    weight,
  });
});

const fnMarkerLabel = (val: number) => {
  if (val === 0 || val === 100) {
    return {
      label: `${val}%`,
    };
  } else {
    return {
      style: {
        display: "none",
      },
    };
  }
};
</script>
