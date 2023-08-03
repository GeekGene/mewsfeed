<template>
  <div class="w-full relative">
    <div class="w-full text-content text-left break-words">
      <template v-for="(contentPart, index) of partsDisplayed" :key="index">
        <BaseMewContentTag
          v-if="contentPart.tagType !== undefined"
          :content-part="contentPart"
        />
        <span v-else class="whitespace-pre-line">
          {{ contentPart.text }}
        </span>
      </template>
      <span v-if="!disableTruncate && truncate && contentRequiresTruncation"
        >...</span
      >
    </div>
    <div
      v-if="!disableTruncate && contentRequiresTruncation && truncate"
      class="w-full h-8 bg-gradient-to-b from-base-100/0 to-base-100 absolute bottom-0 text-center flex flex-col justify-end items-end"
    >
      <button class="btn btn-xs btn-ghost" @click.stop="truncate = false">
        Show More
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Mew, MewContentPart } from "@/types/types";
import { splitMewTextIntoContentParts } from "@/utils/mewText";
import { computed, ref } from "vue";
import BaseMewContentTag from "./BaseMewContentTag.vue";

const props = withDefaults(
  defineProps<{
    mew: Mew;
    disableTruncate?: boolean;
  }>(),
  {
    disableTruncate: false,
  }
);

const TRUNCATED_MEW_LENGTH = 300;

const truncate = ref(true);

const links = computed(() => props.mew.links?.slice().reverse() || []);
const content = computed(() => props.mew.text || "");
const contentRequiresTruncation = computed(
  () => content.value.length > TRUNCATED_MEW_LENGTH || false
);
const parts = computed(() =>
  splitMewTextIntoContentParts(content.value, links.value)
);

const partsTruncated = computed(() => {
  const partsSlice: MewContentPart[] = [];
  let totalTextLength = 0;

  parts.value.forEach((part) => {
    // Append full plain text unless limit reached
    if (
      part.tagType === undefined &&
      totalTextLength + part.text.length <= TRUNCATED_MEW_LENGTH
    ) {
      partsSlice.push(part);
      totalTextLength += part.text.length;
    }

    // Split plain text into words, append words unless limit reached
    else if (part.tagType === undefined) {
      const words = part.text.split(" ");
      words.forEach((word) => {
        if (totalTextLength + word.length + 1 <= TRUNCATED_MEW_LENGTH) {
          partsSlice.push({
            ...part,
            text: word + " ",
          });
          totalTextLength += word.length + 1;
        }
      });
    }

    // Append full tag unless limit reached
    else if (totalTextLength + part.text.length <= TRUNCATED_MEW_LENGTH) {
      partsSlice.push(part);
      totalTextLength += part.text.length;
    }
  });

  return partsSlice;
});

const partsDisplayed = computed(() => {
  return !props.disableTruncate && truncate.value
    ? partsTruncated.value
    : parts.value;
});
</script>
