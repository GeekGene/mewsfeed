<template>
  <div class="column">
    <div
      class="text-body1"
      style="overflow-wrap: anywhere; white-space: pre-line"
    >
      <template v-for="(contentPart, index) of partsDisplayed" :key="index">
        <MewContentTag
          v-if="contentPart.tagType !== undefined"
          :content-part="contentPart"
        />
        <template v-else>{{ contentPart.text }}</template>
      </template>

      <span v-if="contentRequiresTruncation">
        <span v-if="truncate">...</span>
        <a @click.stop="truncate = !truncate">
          Show {{ truncate ? "More" : "Less" }}
        </a>
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { FeedMew, MewContentPart } from "@/types/types";
import { splitMewTextIntoContentParts } from "@/utils/tags";
import { computed, PropType, ref } from "vue";
import MewContentTag from "./MewContentTag.vue";

const props = defineProps({
  feedMew: { type: Object as PropType<FeedMew>, required: true },
});

const TRUNCATED_MEW_LENGTH = 300;

const truncate = ref(true);

const links = computed(
  () => props.feedMew.mew.content?.links?.slice().reverse() || []
);
const content = computed(() => props.feedMew.mew.content?.text || "");
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
  return truncate.value ? partsTruncated.value : parts.value;
});
</script>

<style lang="sass">
a
    color: $secondary
    font-weight: 600
</style>
