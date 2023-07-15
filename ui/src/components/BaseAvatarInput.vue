<template>
  <button
    v-if="!modelValue"
    class="btn btn-lg btn-circle w-16 h-16"
    @click="fileInput.click()"
  >
    <IconAdd />
  </button>
  <div v-else class="avatar" @click="fileInput.click()">
    <div class="w-16 h-16 rounded-full">
      <img :src="newModelValue" />
    </div>
  </div>
  <input
    ref="fileInput"
    type="file"
    accept="image/*"
    class="hidden"
    @change="processImage"
  />
</template>

<script setup lang="ts">
import { ref } from "vue";
import IconAdd from "~icons/ion/add";
import { resizeAndExport } from "@/utils/image";

const emit = defineEmits(["update:model-value"]);
const props = defineProps<{
  modelValue: string;
}>();

const newModelValue = ref(props.modelValue);
const fileInput = ref();

const processImage = () => {
  if (fileInput.value.files && fileInput.value.files[0]) {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (!e.target) return;

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        newModelValue.value = resizeAndExport(img);
        fileInput.value = "";
      };
      img.src = e.target.result as string;
      emit("update:model-value", img.src);
    };
    reader.readAsDataURL(fileInput.value.files[0]);
  }
};
</script>
